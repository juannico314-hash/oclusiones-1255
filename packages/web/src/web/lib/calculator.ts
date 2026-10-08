/**
 * Motor de cálculo MCDA.
 * Replica las fórmulas del Excel:
 *   - Mapeo de resultado textual -> valor 1-5 (hoja Parametros)
 *   - Puntaje ponderado = Peso * (Valor / 5)
 *   - % del dominio = Σ(Puntaje) / Σ(Peso) * 100
 *   - Total global = Σ(Puntaje ponderado de todos los criterios)
 *   - Costo x inyección = N° inyecciones * Precio por vial
 *   - Costo anual inyecciones = Costo x inyección  (con descuento aplicado a Ranibizumab T&E y q4)
 *   - Costo anual administración = N° inyecciones * Costo por visita
 *   - Costo total anual = Costo inyecciones + Costo administración
 *   - Costo por beneficio = Costo total / Total global
 *
 * Referencias del Excel:
 *   - F16: =(C16 * (E16/5))  -> puntaje ponderado
 *   - G16: =(F16+F17)/(C16+C17)*100  -> % del dominio Eficacia
 *   - G19: =(F19+F20+F21+F22)/(C19+C20+C21+C22)*100  -> % Seguridad
 *   - G24: =(F24+F25)/(C24+C25)*100  -> % PROs
 *   - G27: =(F27+F28)/(C27+C28)*100  -> % Organizativo
 *   - F30: =F16+F17+F19+F20+F21+F22+F24+F25+F27+F28  -> Total global
 *   - I9..I23: =E*G  -> Costo x inyección
 *   - M9..M23: =E*K  -> Costo anual administración
 *   - O9..O23: =I+M  -> Costo total anual
 *   - I13, I21: =E13*G13*(1-'Modelo de valor'!O23)  -> con descuento para Ranibizumab T&E y q4
 *   - Q9..Q23: =O9..O23  -> Costo anual final
 *   - R22: =R20/E9  -> Costo por unidad de beneficio neto = Costo total / Total global
 */

import type {
  AppData,
  CriteriaResult,
  DomainResult,
  MoleculeScore,
  Parameter,
  Weight,
  CostInput,
} from './types';

const SAFETY_EVENTS = new Set([
  'Desprendimiento de retina', 'Evento cerebrovascular',
  'Infarto agudo de miocardio', 'Vitreitis',
]);

export function isSafetyEvent(criteria: string): boolean {
  return SAFETY_EVENTS.has(criteria.trim());
}

/** Excel stores frequencies as proportions: 0.0056 = 0.56%.
 * Explicit percentage strings are also supported; NR is never treated as zero.
 */
export function parseSafetyFrequency(result: string): number | null {
  const clean = result.trim().replace(',', '.');
  if (!clean || clean.toUpperCase() === 'NR') return null;
  if (!/^\d+(?:\.\d+)?%?$/.test(clean)) return null;
  const frequency = Number(clean.replace('%', '')) / (clean.endsWith('%') ? 100 : 1);
  return Number.isFinite(frequency) && frequency >= 0 && frequency <= 1 ? frequency : null;
}

export function resolveSafetyFrequency(result: string): number | null {
  if (result.trim().toUpperCase() === 'NR') return 0;
  const frequency = parseSafetyFrequency(result);
  if (frequency === null) return null;
  if (frequency === 0) return 5;
  if (frequency < 0.005) return 4;
  if (frequency < 0.01) return 3;
  if (frequency < 0.03) return 2;
  return 1;
}

const DOMAIN_GROUPS: { domain: string; criteria: string[] }[] = [
  {
    domain: 'Eficacia',
    criteria: [
      'Cambio medio en la agudeza visual corregida (BCVA)',
      'Pacientes con ganancia ≥15 letras en BCVA',
    ],
  },
  {
    domain: 'Seguridad',
    criteria: [
      'Desprendimiento de retina',
      'Evento cerebrovascular',
      'Infarto agudo de miocardio',
      'Vitreitis',
      'Supresión sistémica de VEGF',
    ],
  },
  {
    domain: 'PROs',
    criteria: [
      'Calidad de vida relacionada con la salud',
      'Discapacidad / capacidad funcional',
    ],
  },
  {
    domain: 'Organizativo',
    criteria: [
      'Estado de aprobación regulatoria',
      'Inclusión en guías de práctica clínica',
    ],
  },
];

/**
 * Mapea un resultado textual a un valor numérico (1-5) usando la tabla Parametros.
 * Replica el VLOOKUP del Excel: busca por criteria + level.
 */
export function resolveValue(
  parameters: Parameter[],
  criteria: string,
  result: string,
): number | null {
  if (!result || result.trim() === '') return null;
  if (isSafetyEvent(criteria)) return resolveSafetyFrequency(result);
  // Normalizar
  const cleanResult = result.trim();
  // Buscar match exacto en level
  const found = parameters.find(
    (p) => p.criteria.trim() === criteria.trim() && p.level.trim() === cleanResult,
  );
  if (found) return found.value;
  // Buscar match parcial (cuando el resultado contiene el nivel, ej. "Ocurrencia" vs "Ocurrencia ")
  const partial = parameters.find(
    (p) =>
      p.criteria.trim() === criteria.trim() &&
      (p.level.trim().toLowerCase() === cleanResult.toLowerCase() ||
        cleanResult.toLowerCase().includes(p.level.trim().toLowerCase()) ||
        p.level.trim().toLowerCase().includes(cleanResult.toLowerCase())),
  );
  if (partial) return partial.value;
  // Si es numérico (ej. "5.6" letras BCVA), mapear por rangos según criterio
  const numeric = parseFloat(cleanResult);
  if (!isNaN(numeric)) {
    return mapNumericByCriteria(criteria, numeric);
  }
  return null;
}

/**
 * Mapeo numérico por rangos (replica los rangos en la hoja Definiciones):
 *   BCVA: 0–5=1; 6–10=2; 11–15=4; >15=5
 *   Pacientes ≥15 letras: 0–15%=1; 16–30%=3; >30%=5
 */
function mapNumericByCriteria(criteria: string, numeric: number): number | null {
  const c = criteria.trim();
  if (c.includes('Cambio medio en la agudeza visual')) {
    if (numeric <= 5) return 1;
    if (numeric <= 10) return 2;
    if (numeric <= 15) return 4;
    return 5;
  }
  if (c.includes('Pacientes con ganancia')) {
    if (numeric <= 15) return 1;
    if (numeric <= 30) return 3;
    return 5;
  }
  return null;
}

/**
 * Construye los dots de visualización (1-5) rellenados según el valor.
 * Replica el IF(COLUMNS(...)<=value, 1, "") del Excel.
 */
function buildDots(value: number | null): (0 | 1)[] {
  const v = value ?? 0;
  return [1, 2, 3, 4, 5].map((i) => (i <= v ? 1 : 0)) as (0 | 1)[];
}

/**
 * Genera la descripción textual del resultado.
 * Replica EXACTAMENTE las fórmulas de la columna D del MCDA Advanced Dashboard del Excel.
 * Cada criterio tiene su propia fórmula IF que genera un texto específico según el resultado.
 */
function buildDescription(
  criteria: string,
  moleculeName: string,
  result: string,
): string {
  const c = criteria.trim();
  const r = result.trim();
  const rLower = r.toLowerCase();

  // R16: Cambio medio en BCVA
  if (c.includes('Cambio medio en la agudeza visual')) {
    return `La ganancia media de BCVA con ${moleculeName} fue de ${r} letras, de acuerdo con lo reportado en la literatura científica.`;
  }

  // R17: Pacientes con ganancia ≥15 letras
  if (c.includes('Pacientes con ganancia')) {
    return `La proporción de pacientes con ganancia ≥15 letras en BCVA fue de ${r}% con ${moleculeName} según el tiempo reportado en la literatura.`;
  }

  // Eventos de seguridad: fórmulas MCDA D19:D22 del Excel aprobado.
  if (isSafetyEvent(c)) {
    const frequency = parseSafetyFrequency(r);
    if (frequency === null) return 'Información No Reportada (NR)';
    const eventType = c === 'Vitreitis' ? 'evento adverso ' : 'evento adverso serio';
    if (frequency === 0) {
      return `Para ${moleculeName} no se reportaron casos de ${c.toLowerCase()} como ${eventType} durante el periodo de seguimiento clínico reportado en el estudio fuente.`;
    }
    const range = frequency < 0.005 ? 'mayor de 0% y menor de 0,5%'
      : frequency < 0.01 ? 'de 0,5% a menos de 1%'
      : frequency < 0.03 ? 'de 1% a menos de 3%'
      : 'igual o superior al 3%';
    return `Para ${moleculeName}, la frecuencia reportada de ${c.toLowerCase()} como ${eventType} fue ${range}.`;
  }

  // R22: Supresión sistémica de VEGF
  if (c === 'Supresión sistémica de VEGF') {
    if (rLower === 'no prolongada') {
      return 'Supresión sistémica baja. ; perfil seguro y de elección en riesgo renal , según la guía fuente.';
    }
    if (rLower === 'prolongada') {
      return 'Supresión sistémica prolongada. Restringido si TFGe < 60 ml/min  de acuerdo con la guía fuente ).';
    }
    return 'PRECAUCIÓN: Mecanismo biespecífico actualmente bajo investigación. Datos clínicos limitados a largo plazo en nefropatía.';
  }

  // R24: Calidad de vida
  if (c.includes('Calidad de vida')) {
    if (rLower === 'mejoría') {
      return `  La evidencia sugiere una mejora en la calidad de vida  global del paciente, tras el tratamiento con ${moleculeName}, según la literatura fuente del modelo.`;
    }
    if (rLower === 'empeoramiento') {
      return `Alerta: Restricción en la calidad de vida con ${moleculeName}. Evidencia reporta deterioro significativo en los ámbitos laboral, social o funcional.`;
    }
    if (rLower === 'sin efecto') {
      return `Estabilidad clínica: No se reportaron cambios significativos en la calidad de vida ni en el desempeño diario del paciente con ${moleculeName}.`;
    }
    return 'Información No Reportada (NR) sobre calidad de vida.';
  }

  // R25: Discapacidad / capacidad funcional
  if (c.includes('Discapacidad')) {
    if (rLower === 'mejoría') {
      return ` La evidencia disponible muestra una mejora en los dominios relacionados con la capacidad funcional o  el desempeño de los pacientes en las actividades de la vida diaria tras el tratamiento con ${moleculeName}.`;
    }
    if (rLower === 'empeoramiento') {
      return `Alerta de deterioro funcional: Se evidencia un incremento en el grado de discapacidad o restricciones severas para realizar actividades de la vida diaria con ${moleculeName}.`;
    }
    if (rLower === 'sin efecto') {
      return `Estabilidad funcional: No se reportaron cambios significativos en el grado de discapacidad basal ni en el desempeño diario del paciente con ${moleculeName}.`;
    }
    return `No se encontraron datos disponibles para dominios relacionados con la capacidad funcional del paciente y a su desempeño en las actividades de la vida diaria; para ${moleculeName} solo se encuentran datos para la calidad de vida global.`;
  }

  // R27: Estado de aprobación regulatoria
  if (c.includes('Estado de aprobación')) {
    if (rLower === 'on-label') {
      return `Aprobación vigente: La tecnología ${moleculeName} cuenta con una indicación formalmente aprobada por la agencia de salud para esta patología y dispone de registro sanitario activo en el país, respaldando su uso clínico .`;
    }
    if (rLower === 'off-label') {
      return `Uso fuera de indicación (Off-Label): La tecnología ${moleculeName} no cuenta con un registro sanitario específico ni indicación autorizada por la agencia de salud para el manejo de esta enfermedad en el país.`;
    }
    return `Estado regulatorio no reportado o en proceso de evaluación sanitaria para ${moleculeName}.`;
  }

  // R28: Inclusión en guías de práctica clínica
  if (c.includes('Inclusión en guías')) {
    if (rLower === 'incluido') {
      return `${moleculeName} está incluido como una opción de tratamiento en las guías de práctica clínica de referencia, teniendo un  posicionamiento actual en el  algoritmo terapéutico.`;
    }
    if (rLower === 'no incluido') {
      return `Sin recomendación formal: La tecnología ${moleculeName} no está incluida en las guías de práctica clínica de referencia para esta enfermedad, lo que evidencia una falta de consenso o adopción en los esquemas de tratamiento estándar.`;
    }
    return `Evidencia no disponible o pendiente de actualización sobre la inclusión de ${moleculeName} en guías de práctica clínica.`;
  }

  return r;
}

/**
 * Verifica si una molécula debe recibir descuento.
 * Lee dinámicamente la lista de data.meta.discountedMolecules.
 * Si no existe, devuelve false (sin descuento).
 */
function isDiscounted(moleculeName: string, data: AppData): boolean {
  const list = data.meta.discountedMolecules;
  if (!list || list.length === 0) return false;
  return list.includes(moleculeName);
}

/**
 * Calcula el puntaje completo de una molécula replicando todas las fórmulas del Excel.
 */
export function calculateMoleculeScore(
  data: AppData,
  moleculeName: string,
): MoleculeScore {
  const outcomes = data.moleculeInputs[moleculeName] || [];
  const weights = data.weights;
  const costInput = data.costInputs[moleculeName];

  // 1. Construir resultados por criterio
  const criteriaResults: CriteriaResult[] = weights.map((w: Weight) => {
    const outcome = outcomes.find(
      (o) => o.outcome.trim() === w.criteria.trim(),
    );
    const result = outcome?.result ?? '';
    const value = isSafetyEvent(w.criteria)
      ? resolveSafetyFrequency(result)
      : outcome?.value ?? resolveValue(data.parameters, w.criteria, result);
    const weightedScore = value !== null ? w.weight * (value / 5) : 0;
    const dots = buildDots(value);

    return {
      domain: w.domain,
      criteria: w.criteria,
      weight: w.weight,
      result,
      description: outcome?.description || buildDescription(w.criteria, moleculeName, result),
      value,
      weightedScore,
      dots,
      reference: outcome?.reference ?? '',
      followup: outcome?.followup ?? '',
      comments: outcome?.comments ?? '',
    };
  });

  // 2. Agrupar por dominio y calcular %
  const domains: DomainResult[] = DOMAIN_GROUPS.map((g) => {
    const domainCriteria = criteriaResults.filter((c) => c.domain === g.domain);
    const domainWeightSum = domainCriteria.reduce((s, c) => s + c.weight, 0);
    const domainWeightedScoreSum = domainCriteria.reduce(
      (s, c) => s + c.weightedScore,
      0,
    );
    const domainPercentage =
      domainWeightSum > 0 ? (domainWeightedScoreSum / domainWeightSum) * 100 : 0;
    return {
      domain: g.domain,
      criteria: domainCriteria,
      domainPercentage,
      domainWeightSum,
      domainWeightedScoreSum,
    };
  });

  // 3. Total global = suma de todos los puntajes ponderados
  const totalGlobal = criteriaResults.reduce((s, c) => s + c.weightedScore, 0);

  // 4. Costos (replica Input_costo2)
  let costAnnualInjections = 0;
  let costAnnualAdministration = 0;
  let costAnnualTotal = 0;
  let costPerBenefit = 0;

  if (costInput) {
    const injections = costInput.injectionCount;
    const pricePerVial = costInput.pricePerVial;
    const adminPerVisit = costInput.administrationCostPerVisit;
    const appliesDiscount = isDiscounted(moleculeName, data);
    const discount = data.meta.discount;

    // I = E * G  (con descuento opcional para Ranibizumab T&E y q4)
    costAnnualInjections = appliesDiscount
      ? injections * pricePerVial * (1 - discount)
      : injections * pricePerVial;

    // M = E * K
    costAnnualAdministration = injections * adminPerVisit;

    // O = I + M
    costAnnualTotal = costAnnualInjections + costAnnualAdministration;

    // R22 = R20 / E9  (costo total / total global)
    costPerBenefit = totalGlobal > 0 ? costAnnualTotal / totalGlobal : 0;
  }

  return {
    molecule: moleculeName,
    criteria: criteriaResults,
    domains,
    totalGlobal,
    costAnnualInjections,
    costAnnualAdministration,
    costAnnualTotal,
    costPerBenefit,
  };
}

/**
 * Calcula el puntaje de todas las moléculas (para el Resumen y comparativos).
 */
export function calculateAllScores(data: AppData): MoleculeScore[] {
  return data.molecules.map((m) => calculateMoleculeScore(data, m.name));
}

/**
 * Recalcula los costos cuando se actualiza un input de costo o el descuento.
 * Replica la hoja Input_costo2.
 */
export function recalculateCosts(
  costInput: CostInput,
  moleculeName: string,
  discount: number,
  appliesDiscount: boolean = false,
): {
  costPerInjection: number;
  annualAdministrationCost: number;
  annualTotalCost: number;
  annualFinalCost: number;
} {
  const injections = costInput.injectionCount;
  const pricePerVial = costInput.pricePerVial;
  const adminPerVisit = costInput.administrationCostPerVisit;

  const costPerInjection = appliesDiscount
    ? injections * pricePerVial * (1 - discount)
    : injections * pricePerVial;

  const annualAdministrationCost = injections * adminPerVisit;
  const annualTotalCost = costPerInjection + annualAdministrationCost;
  const annualFinalCost = annualTotalCost;

  return {
    costPerInjection,
    annualAdministrationCost,
    annualTotalCost,
    annualFinalCost,
  };
}
