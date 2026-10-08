'use client';

import { useAppStore } from '@/lib/store';
import { calculateAllScores } from '@/lib/calculator';
import { PageHeader } from '@/components/common/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Table2, ArrowUpDown, CheckSquare, Square, CheckCheck, SquareX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';

type SortKey = 'totalGlobal' | 'efficacy' | 'safety' | 'pros' | 'positioning' | 'annualCost' | 'costPerBenefit';

export function Resumen() {
  const data = useAppStore((s) => s.data);
  const setSelectedMolecule = useAppStore((s) => s.setSelectedMolecule);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const selectedMolecules = useAppStore((s) => s.selectedMolecules);
  const toggleMoleculeSelection = useAppStore((s) => s.toggleMoleculeSelection);
  const selectAllMolecules = useAppStore((s) => s.selectAllMolecules);
  const deselectAllMolecules = useAppStore((s) => s.deselectAllMolecules);
  const [sortKey, setSortKey] = useState<SortKey>('totalGlobal');
  const [sortAsc, setSortAsc] = useState(false);

  // Inicializar: todas las moléculas seleccionadas por defecto (solo si no hay selección previa)
  useEffect(() => {
    if (!data) return;
    const hasSelection = Object.keys(selectedMolecules).length > 0;
    if (!hasSelection) {
      selectAllMolecules(data.molecules.map((m) => m.name));
    }
  }, [data, selectedMolecules, selectAllMolecules]);

  const scores = useMemo(() => (data ? calculateAllScores(data) : []), [data]);

  // Filtrar scores según selección
  const filteredScores = useMemo(() => {
    return scores.filter((s) => {
      // Si no hay selección definida, mostrar todas
      if (Object.keys(selectedMolecules).length === 0) return true;
      return selectedMolecules[s.molecule] !== false;
    });
  }, [scores, selectedMolecules]);

  if (!data || scores.length === 0) return null;

  const sortedScores = [...filteredScores].sort((a, b) => {
    let av: number, bv: number;
    switch (sortKey) {
      case 'efficacy':
        av = a.domains.find((d) => d.domain === 'Eficacia')?.domainPercentage ?? 0;
        bv = b.domains.find((d) => d.domain === 'Eficacia')?.domainPercentage ?? 0;
        break;
      case 'safety':
        av = a.domains.find((d) => d.domain === 'Seguridad')?.domainPercentage ?? 0;
        bv = b.domains.find((d) => d.domain === 'Seguridad')?.domainPercentage ?? 0;
        break;
      case 'pros':
        av = a.domains.find((d) => d.domain === 'PROs')?.domainPercentage ?? 0;
        bv = b.domains.find((d) => d.domain === 'PROs')?.domainPercentage ?? 0;
        break;
      case 'positioning':
        av = a.domains.find((d) => d.domain === 'Organizativo')?.domainPercentage ?? 0;
        bv = b.domains.find((d) => d.domain === 'Organizativo')?.domainPercentage ?? 0;
        break;
      case 'annualCost':
        av = a.costAnnualTotal;
        bv = b.costAnnualTotal;
        break;
      case 'costPerBenefit':
        av = a.costPerBenefit;
        bv = b.costPerBenefit;
        break;
      default:
        av = a.totalGlobal;
        bv = b.totalGlobal;
    }
    return sortAsc ? av - bv : bv - av;
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  // Calcular mejor total solo para resaltar en tabla
  const bestTotal = filteredScores.length > 0 ? Math.max(...filteredScores.map((s) => s.totalGlobal)) : 0;

  const selectedCount = filteredScores.length;
  const totalCount = data.molecules.length;

  const handleSortHeader = (key: SortKey, label: string) => (
    <button
      onClick={() => toggleSort(key)}
      className="inline-flex items-center gap-1 hover:text-primary-foreground/80 transition-colors"
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  const allMoleculeNames = data.molecules.map((m) => m.name);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resumen comparativo"
        description="Seleccione las moléculas que desea comparar y vea los resultados en la tabla. Las moléculas no seleccionadas permanecen ocultas."
      />

      {/* Selector de moléculas */}
      <Card>
        <CardHeader className="border-b bg-muted/30 py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[14px] font-serif font-semibold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" strokeWidth={2} />
                Selección de moléculas
              </CardTitle>
              <CardDescription className="text-[12px] mt-1">
                {selectedCount} de {totalCount} moléculas seleccionadas — haga clic para activar/desactivar
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => selectAllMolecules(allMoleculeNames)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Todas
              </button>
              <button
                onClick={() => deselectAllMolecules(allMoleculeNames)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors font-medium"
              >
                <SquareX className="w-3.5 h-3.5" />
                Ninguna
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {data.molecules.map((m) => {
              const isSelected = selectedMolecules[m.name] !== false;
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMoleculeSelection(m.name)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-md border text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 hover:bg-primary/10'
                      : 'border-border bg-muted/30 hover:bg-muted/50 opacity-60 hover:opacity-100',
                  )}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={2} />
                  )}
                  <span className={cn(
                    'text-[12px] font-medium truncate',
                    isSelected ? 'text-foreground' : 'text-muted-foreground line-through'
                  )}>
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mensaje si no hay moléculas seleccionadas */}
      {filteredScores.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="p-12 text-center">
            <Table2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-muted-foreground font-medium">
              No hay moléculas seleccionadas
            </p>
            <p className="text-[12px] text-muted-foreground/70 mt-1">
              Seleccione al menos una molécula arriba para ver la tabla comparativa.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabla comparativa */}
          <Card>
            <CardHeader className="border-b bg-muted/30 py-3">
              <CardTitle className="text-[14px] font-serif font-semibold flex items-center gap-2">
                <Table2 className="w-4 h-4 text-primary" strokeWidth={2} />
                Comparativo de moléculas seleccionadas
              </CardTitle>
              <CardDescription className="text-[12px]">
                Mostrando {selectedCount} de {totalCount} moléculas · Ordenado por{' '}
                <strong className="text-foreground">{sortKey}</strong> ({sortAsc ? 'ascendente' : 'descendente'})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="text-left font-semibold px-4 py-2.5 sticky left-0 bg-primary z-10 min-w-52 table-header">
                        Molécula
                      </th>
                      <th className="text-right font-semibold px-3 py-2.5 w-24 table-header">
                        {handleSortHeader('efficacy', 'Eficacia')}
                      </th>
                      <th className="text-right font-semibold px-3 py-2.5 w-24 table-header">
                        {handleSortHeader('safety', 'Seguridad')}
                      </th>
                      <th className="text-right font-semibold px-3 py-2.5 w-24 table-header">
                        {handleSortHeader('pros', 'PROs')}
                      </th>
                      <th className="text-right font-semibold px-3 py-2.5 w-24 table-header">
                        {handleSortHeader('positioning', 'Posic.')}
                      </th>
                      <th className="text-right font-semibold px-4 py-2.5 w-28 table-header border-l border-primary-foreground/20">
                        {handleSortHeader('totalGlobal', 'Total global')}
                      </th>
                      <th className="text-right font-semibold px-4 py-2.5 w-32 table-header">
                        {handleSortHeader('annualCost', 'Costo anual')}
                      </th>
                      <th className="text-right font-semibold px-4 py-2.5 w-32 table-header">
                        {handleSortHeader('costPerBenefit', 'Costo/beneficio')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScores.map((s, i) => {
                      const efficacy = s.domains.find((d) => d.domain === 'Eficacia');
                      const safety = s.domains.find((d) => d.domain === 'Seguridad');
                      const pros = s.domains.find((d) => d.domain === 'PROs');
                      const pos = s.domains.find((d) => d.domain === 'Organizativo');
                      const isBestTotal = s.totalGlobal === bestTotal;
                      return (
                        <tr
                          key={s.molecule}
                          className={cn(
                            'border-b border-border hover:bg-primary/5 transition-colors cursor-pointer',
                            i % 2 === 0 ? 'bg-card' : 'bg-muted/10',
                          )}
                          onClick={() => {
                            setSelectedMolecule(s.molecule);
                            setActiveView('mcda-dashboard');
                          }}
                        >
                          <td aria-label={s.molecule} className="px-4 py-3 align-top sticky left-0 bg-inherit z-10 border-r border-border">
                            <div>
                              <div className="font-medium text-foreground leading-tight text-[13px]">
                                {s.molecule}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                Click para ver detalle
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono tabular-nums text-[12px]">
                            <ScoreCell value={efficacy?.domainPercentage ?? 0} />
                          </td>
                          <td className="px-3 py-3 text-right font-mono tabular-nums text-[12px]">
                            <ScoreCell value={safety?.domainPercentage ?? 0} />
                          </td>
                          <td className="px-3 py-3 text-right font-mono tabular-nums text-[12px]">
                            <ScoreCell value={pros?.domainPercentage ?? 0} />
                          </td>
                          <td className="px-3 py-3 text-right font-mono tabular-nums text-[12px]">
                            <ScoreCell value={pos?.domainPercentage ?? 0} />
                          </td>
                          <td className="px-4 py-3 text-right border-l border-border">
                            <span
                              className={cn(
                                'inline-block px-2 py-1 rounded font-mono tabular-nums font-bold text-[13px]',
                                isBestTotal
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'bg-primary/10 text-primary',
                              )}
                            >
                              {s.totalGlobal.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono tabular-nums text-[12px]">
                              ${s.costAnnualTotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono tabular-nums text-[12px]">
                              ${s.costPerBenefit.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
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

          {/* Leyenda */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 bg-secondary rounded"></span>
                  Mejor puntaje global
                </div>
                <div className="ml-auto text-[10px] italic">
                  Haga clic en una fila para ver el detalle en el Dashboard
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ScoreCell({ value }: { value: number }) {
  const color =
    value >= 75
      ? 'text-secondary-foreground font-semibold'
      : value >= 50
        ? 'text-foreground'
        : value >= 25
          ? 'text-chart-3'
          : 'text-destructive';
  return <span className={color}>{value.toFixed(1)}%</span>;
}


