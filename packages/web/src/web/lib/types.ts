/**
 * Tipos centrales del Modelo de Valor MCDA.
 * Espejo de la estructura del Excel original MV_naMD_V5_VF.
 */

export interface Molecule {
  id: string;
  index: number;
  name: string;
  columnRange: string;
  selected: boolean;
}

export interface Definition {
  domain: string;
  criteria: string;
  operationalDefinition: string;
  possibleValues: string;
}

export interface Parameter {
  domain: string;
  criteria: string;
  level: string;
  value: number;
}

export interface Weight {
  domain: string;
  criteria: string;
  weight: number;
}

export interface MoleculeOutcome {
  outcome: string;
  result: string;
  value: number | null;
  followup: string;
  reference: string;
  comments: string;
  /** Descripción personalizada del resultado (del Excel). Si está presente, se usa directamente en lugar de la generada por buildDescription. */
  description?: string;
}

export interface CostInput {
  technology: string;
  injectionCount: number;
  pricePerVial: number;
  costPerInjection: number;
  administrationCostPerVisit: number;
  annualAdministrationCost: number;
  annualTotalCost: number;
  annualFinalCost: number;
}

export interface Reference {
  domain: string;
  citation: string;
}

export interface CachedResult {
  molecule: string;
  efficacy: number;
  safety: number;
  pros: number;
  positioning: number;
  totalGlobal: number;
  annualCost: number;
  costPerBenefit: number;
}

export interface AppData {
  meta: {
    source: string;
    description: string;
    version: string;
    discount: number;
    indication?: string;
    discountedMolecules?: string[];
  };
  molecules: Molecule[];
  definitions: Definition[];
  parameters: Parameter[];
  weights: Weight[];
  moleculeInputs: Record<string, MoleculeOutcome[]>;
  costInputs: Record<string, CostInput>;
  references: Record<string, Reference[]>;
  cachedResults: CachedResult[];
}

// ============================================================
// Tipos derivados del motor de cálculo
// ============================================================

export interface CriteriaResult {
  domain: string;
  criteria: string;
  weight: number;
  result: string;
  description: string;
  value: number | null;
  weightedScore: number;
  dots: (0 | 1)[];
  reference: string;
  followup: string;
  comments: string;
}

export interface DomainResult {
  domain: string;
  criteria: CriteriaResult[];
  domainPercentage: number;
  domainWeightSum: number;
  domainWeightedScoreSum: number;
}

export interface MoleculeScore {
  molecule: string;
  criteria: CriteriaResult[];
  domains: DomainResult[];
  totalGlobal: number;
  costAnnualInjections: number;
  costAnnualAdministration: number;
  costAnnualTotal: number;
  costPerBenefit: number;
}

export type ViewKey =
  | 'modelo-valor'
  | 'negociacion'
  | 'definiciones'
  | 'mcda-dashboard'
  | 'resumen'
  | 'input-costos'
  | 'referencias';
