'use client';

import { useAppStore } from '@/lib/store';
import { PageHeader, Money } from '@/components/common/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Info, Tag, Lock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CostInput } from '@/lib/types';

interface EditState {
  injectionCount: string;
  pricePerVial: string;
  administrationCostPerVisit: string;
}

// Verifica si una molécula tiene descuento, leyendo dinámicamente del seed_data
function isMoleculeDiscounted(moleculeName: string, discountedMolecules?: string[]): boolean {
  if (!discountedMolecules || discountedMolecules.length === 0) return false;
  return discountedMolecules.includes(moleculeName);
}

export function InputCostos() {
  const data = useAppStore((s) => s.data);
  const updateCostInput = useAppStore((s) => s.updateCostInput);
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});
  const editStatesRef = useRef<Record<string, EditState>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Inicializar editStates solo una vez cuando los datos cargan por primera vez
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!data || initializedRef.current) return;
    const next: Record<string, EditState> = {};
    for (const m of Object.keys(data.costInputs)) {
      const ci = data.costInputs[m];
      next[m] = {
        injectionCount: String(ci.injectionCount),
        pricePerVial: String(ci.pricePerVial),
        administrationCostPerVisit: String(ci.administrationCostPerVisit),
      };
    }
    editStatesRef.current = next;
    setEditStates(next);
    initializedRef.current = true;
  }, [data]);

  // Handler simple: actualiza el estado local inmediatamente
  const handleChange = (molecule: string, field: keyof EditState, value: string) => {
    const next = {
      ...editStatesRef.current,
      [molecule]: {
        ...(editStatesRef.current[molecule] ?? { injectionCount: '0', pricePerVial: '0', administrationCostPerVisit: '0' }),
        [field]: value,
      },
    };
    editStatesRef.current = next;
    setEditStates(next);
  };

  // Guardar al backend con debounce (esperar 800ms después del último cambio)
  const saveTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const handleSave = (molecule: string) => {
    // Cancelar guardado pendiente
    if (saveTimeoutsRef.current[molecule]) {
      clearTimeout(saveTimeoutsRef.current[molecule]);
    }
    // Programar nuevo guardado en 800ms
    saveTimeoutsRef.current[molecule] = setTimeout(async () => {
      const state = editStatesRef.current[molecule];
      if (!state || !data) return;
      setSavingKey(molecule);
      try {
        const updates: Partial<CostInput> = {
          injectionCount: parseInt(state.injectionCount, 10) || 0,
          pricePerVial: parseFloat(state.pricePerVial) || 0,
          administrationCostPerVisit: parseFloat(state.administrationCostPerVisit) || 0,
        };
        await updateCostInput(molecule, updates);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al guardar');
      } finally {
        setSavingKey(null);
      }
    }, 800);
  };

  // Calcular valores en tiempo real para una molécula (usando el estado local)
  const calculateRow = (moleculeName: string) => {
    const state = editStates[moleculeName];
    if (!state) {
      return { costPerInjection: 0, annualAdministrationCost: 0, annualTotalCost: 0 };
    }
    const injections = parseFloat(state.injectionCount) || 0;
    const pricePerVial = parseFloat(state.pricePerVial) || 0;
    const adminPerVisit = parseFloat(state.administrationCostPerVisit) || 0;
    const discount = data?.meta.discount ?? 0;
    const appliesDiscount = isMoleculeDiscounted(moleculeName, data?.meta.discountedMolecules);

    // Fórmula 1: Costo inyecciones = N° inyecciones × Precio por jeringa prellenada (con descuento si aplica)
    const costPerInjection = appliesDiscount
      ? injections * pricePerVial * (1 - discount)
      : injections * pricePerVial;

    // Fórmula 2: Costo administración = N° inyecciones × Costo/visita admin
    const annualAdministrationCost = injections * adminPerVisit;

    // Fórmula 3: Costo anual = Costo inyecciones + Costo administración
    const annualTotalCost = costPerInjection + annualAdministrationCost;

    return { costPerInjection, annualAdministrationCost, annualTotalCost };
  };

  // Limpiar timeouts al desmontar
  useEffect(() => {
    const timeouts = saveTimeoutsRef.current;
    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Costos"
        description="Tabla de costos de tratamiento por molécula. Las primeras 3 columnas son editables (N° inyecciones, Precio por jeringa prellenada, Costo/visita admin). Las últimas 3 columnas se calculan automáticamente con las fórmulas del Excel y no son editables."
      />

      {/* Banner de fórmulas */}
      <Card className="bg-secondary/20 border-l-4 border-l-chart-2">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-chart-2 shrink-0 mt-0.5" strokeWidth={2} />
            <div className="text-[12px] text-muted-foreground leading-relaxed space-y-1">
              <div>
                <strong className="text-foreground">Columnas editables:</strong>{' '}
                N° inyecciones, Precio por jeringa prellenada, Costo/visita admin. Escriba cualquier valor y las fórmulas se calcularán automáticamente.
              </div>
              <div>
                <strong className="text-foreground">Columnas automáticas (no editables):</strong>
              </div>
              <div className="pl-3 space-y-0.5">
                <div>
                  <code className="bg-card px-1.5 py-0.5 rounded text-[11px] font-mono border border-border">
                    Costo inyecciones = N° inyecciones × Precio por jeringa prellenada
                  </code>
                  {data.meta.discount > 0 && (
                    <span className="text-[10px] text-secondary-foreground ml-2">
                      (las moléculas con descuento: ×(1−{(data.meta.discount * 100).toFixed(0)}%))
                    </span>
                  )}
                </div>
                <div>
                  <code className="bg-card px-1.5 py-0.5 rounded text-[11px] font-mono border border-border">
                    Costo admin. = N° inyecciones × Costo/visita admin.
                  </code>
                </div>
                <div>
                  <code className="bg-card px-1.5 py-0.5 rounded text-[11px] font-mono border border-border">
                    Costo anual = Costo inyecciones + Costo admin.
                  </code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-[14px] font-serif font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" strokeWidth={2} />
            Tabla de costos por molécula
            {savingKey && (
              <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-chart-2 rounded-full animate-pulse"></span>
                Guardando {savingKey.slice(0, 20)}...
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-[12px]">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-chart-2"></span>
              Editable
            </span>
            <span className="mx-2 text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 text-muted-foreground" />
              Automática (fórmula)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5 sticky left-0 bg-primary z-10 min-w-52 table-header">
                    Tecnología
                  </th>
                  <th className="text-right font-semibold px-3 py-2.5 w-28 table-header border-r border-primary-foreground/20">
                    N° inyecciones
                    <span className="block text-[9px] font-normal opacity-70">editable</span>
                  </th>
                  <th className="text-right font-semibold px-3 py-2.5 w-32 table-header border-r border-primary-foreground/20">
                    Precio por jeringa prellenada
                    <span className="block text-[9px] font-normal opacity-70">editable</span>
                  </th>
                  <th className="text-right font-semibold px-3 py-2.5 w-32 table-header border-r-2 border-primary-foreground/30">
                    Costo/visita admin.
                    <span className="block text-[9px] font-normal opacity-70">editable</span>
                  </th>
                  <th className="text-right font-semibold px-3 py-2.5 w-32 table-header">
                    Costo inyecciones
                    <span className="block text-[9px] font-normal opacity-70">= N° × Precio</span>
                  </th>
                  <th className="text-right font-semibold px-3 py-2.5 w-32 table-header">
                    Costo admin.
                    <span className="block text-[9px] font-normal opacity-70">= N° × Costo/visita</span>
                  </th>
                  <th className="text-right font-semibold px-4 py-2.5 w-36 table-header border-l border-primary-foreground/20 bg-primary">
                    Costo anual
                    <span className="block text-[9px] font-normal opacity-70">= Inyecciones + Admin.</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.molecules.map((m, i) => {
                  const ci = data.costInputs[m.name];
                  if (!ci) return null;
                  const state = editStates[m.name];
                  const isDiscounted = isMoleculeDiscounted(m.name, data.meta.discountedMolecules);
                  const calc = calculateRow(m.name);
                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        'border-b border-border',
                        i % 2 === 0 ? 'bg-card' : 'bg-muted/10',
                      )}
                    >
                      <td className="px-4 py-3 align-middle sticky left-0 bg-inherit z-10 border-r border-border">
                        <div className="font-medium text-foreground flex items-center gap-2 text-[13px]">
                          {m.name}
                          {isDiscounted && data.meta.discount > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0 px-1 gap-0.5 border-secondary-foreground/40 text-secondary-foreground bg-secondary/30"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              -{(data.meta.discount * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* === Columnas editables === */}
                      <td className="px-3 py-3 text-right border-r border-border/30 bg-chart-2/5">
                        <SimpleInput
                          value={state?.injectionCount ?? ''}
                          onChange={(v) => {
                            handleChange(m.name, 'injectionCount', v);
                            handleSave(m.name);
                          }}
                          disabled={savingKey === m.name}
                          numeric
                        />
                      </td>
                      <td className="px-3 py-3 text-right border-r border-border/30 bg-chart-2/5">
                        <SimpleInput
                          value={state?.pricePerVial ?? ''}
                          onChange={(v) => {
                            handleChange(m.name, 'pricePerVial', v);
                            handleSave(m.name);
                          }}
                          disabled={savingKey === m.name}
                          numeric
                          money
                        />
                      </td>
                      <td className="px-3 py-3 text-right border-r-2 border-border bg-chart-2/5">
                        <SimpleInput
                          value={state?.administrationCostPerVisit ?? ''}
                          onChange={(v) => {
                            handleChange(m.name, 'administrationCostPerVisit', v);
                            handleSave(m.name);
                          }}
                          disabled={savingKey === m.name}
                          numeric
                          money
                        />
                      </td>

                      {/* === Columnas automáticas (no editables) === */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-[12px] text-muted-foreground">
                        <Money value={calc.costPerInjection} compact />
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-[12px] text-muted-foreground">
                        <Money value={calc.annualAdministrationCost} compact />
                      </td>
                      <td className="px-4 py-3 text-right border-l border-border">
                        <span className="inline-block px-2 py-1 rounded bg-primary/10 text-primary font-mono tabular-nums font-semibold text-[13px]">
                          <Money value={calc.annualTotalCost} compact />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] uppercase tracking-wider">Total moléculas</CardDescription>
            <CardTitle className="text-[24px] font-serif font-bold tabular-nums">
              {data.molecules.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">
              Estrategias anti-VEGF para AMD
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] uppercase tracking-wider">Mayor costo anual</CardDescription>
            <CardTitle className="text-[18px] font-serif font-bold tabular-nums">
              <Money
                value={Math.max(...data.molecules.map((m) => calculateRow(m.name).annualTotalCost))}
                compact
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">
              {data.molecules
                .map((m) => ({ name: m.name, cost: calculateRow(m.name).annualTotalCost }))
                .sort((a, b) => b.cost - a.cost)[0]?.name}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-[11px] uppercase tracking-wider">Menor costo anual</CardDescription>
            <CardTitle className="text-[18px] font-serif font-bold tabular-nums">
              <Money
                value={Math.min(...data.molecules.map((m) => calculateRow(m.name).annualTotalCost))}
                compact
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground">
              {data.molecules
                .map((m) => ({ name: m.name, cost: calculateRow(m.name).annualTotalCost }))
                .sort((a, b) => a.cost - b.cost)[0]?.name}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Input controlado simple.
 * - El valor lo controla el padre (editStates)
 * - El padre recibe el cambio vía onChange
 * - No tiene estado local interno (evita sincronización conflictiva)
 */
interface SimpleInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  numeric?: boolean;
  money?: boolean;
}

function SimpleInput({ value, onChange, disabled, numeric, money }: SimpleInputProps) {
  return (
    <div className="relative inline-block">
      {money && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none z-10">
          $
        </span>
      )}
      <input
        aria-label={money ? 'Costo editable' : 'Número de inyecciones'}
        type={numeric ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'h-8 text-right font-mono tabular-nums text-[12px] bg-card rounded-md border border-chart-2/40 focus:border-chart-2 focus:ring-1 focus:ring-chart-2/30 outline-none transition-colors',
          money ? 'pl-5 pr-2' : 'px-2',
          'w-28 inline-block',
        )}
      />
    </div>
  );
}
