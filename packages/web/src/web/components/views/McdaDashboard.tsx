'use client';

import { useAppStore } from '@/lib/store';
import { calculateMoleculeScore } from '@/lib/calculator';
import { PageHeader, DomainBadge, DotsDisplay, ValuePill, Money, Percent } from '@/components/common/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, Target, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOMAIN_COLORS: Record<string, string> = {
  Eficacia: 'oklch(0.65 0.13 155)',
  Seguridad: 'oklch(0.72 0.10 200)',
  PROs: 'oklch(0.55 0.10 220)',
  'Organizativo': 'oklch(0.78 0.10 140)',
};

export function McdaDashboard() {
  const data = useAppStore((s) => s.data);
  const selectedMolecule = useAppStore((s) => s.selectedMolecule);
  const setSelectedMolecule = useAppStore((s) => s.setSelectedMolecule);

  if (!data) return null;

  const score = calculateMoleculeScore(data, selectedMolecule);

  const donutData = score.domains.map((d) => ({
    name: d.domain,
    value: d.domainWeightedScoreSum,
    fullMark: d.domainWeightSum,
    percentage: d.domainPercentage,
  }));

  const cost = data.costInputs[selectedMolecule];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Análisis avanzado del modelo multicriterio. Muestra el puntaje global, los puntajes ponderados por criterio, la visualización de dots (1–5) y la información económica asociada a la molécula seleccionada."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Molécula</span>
            <Select value={selectedMolecule} onValueChange={setSelectedMolecule}>
              <SelectTrigger className="w-60 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.molecules.map((m) => (
                  <SelectItem key={m.id} value={m.name}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Top row: Global score + donut + economic panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Global score card */}
        <Card className="lg:col-span-3 bg-primary text-primary-foreground border-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-primary-foreground/70 text-[10px] uppercase tracking-wider font-semibold">
              <Target className="w-3 h-3" strokeWidth={2.5} />
              Puntaje global
            </div>
            <div className="mt-3">
              <div className="text-[44px] font-serif font-bold tabular-nums leading-none">
                {score.totalGlobal.toFixed(2)}
              </div>
              <div className="text-[11px] text-primary-foreground/70 mt-2">de 100 puntos posibles</div>
            </div>
            <div className="mt-5 pt-4 border-t border-primary-foreground/20">
              <div className="text-[10px] text-primary-foreground/60 uppercase tracking-wider mb-1">
                Molécula evaluada
              </div>
              <div className="text-[13px] font-medium leading-tight">{selectedMolecule}</div>
            </div>
          </CardContent>
        </Card>

        {/* Donut chart */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-serif font-semibold flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
              Distribución por dominio
            </CardTitle>
            <CardDescription className="text-[12px]">
              Puntaje ponderado obtenido por dominio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={2}
                    label={(entry: any) => `${entry.percentage?.toFixed(0)}%`}
                    labelLine={false}
                  >
                    {donutData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={DOMAIN_COLORS[entry.name] ?? 'oklch(0.50 0 0)'}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-[11px] text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Economic panel */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-serif font-semibold flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
              Información económica
            </CardTitle>
            <CardDescription className="text-[12px]">Panel económico de la molécula.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <EcoRow
              label="Costo anual inyecciones"
              value={<Money value={score.costAnnualInjections} compact />}
              hint="= N° inyecciones × Precio"
            />
            <EcoRow
              label="Costo anual administración"
              value={<Money value={score.costAnnualAdministration} compact />}
              hint="= N° inyecciones × Costo/visita"
            />
            <div className="pt-3 border-t border-border">
              <EcoRow
                label="Costo total anual"
                value={<Money value={score.costAnnualTotal} compact />}
                hint="= Inyecciones + Administración"
                emphasize
              />
            </div>
            <div className="pt-3 border-t border-border">
              <EcoRow
                label="Costo por beneficio neto"
                value={<Money value={score.costPerBenefit} compact />}
                hint="= Costo total / Puntaje global"
                emphasize
              />
            </div>
            {cost && (
              <div className="pt-3 border-t border-border text-[11px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Inyecciones/año</span>
                  <span className="font-mono text-foreground">{cost.injectionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Precio por jeringa prellenada</span>
                  <span className="font-mono text-foreground">
                    ${cost.pricePerVial.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Costo/visita admin.</span>
                  <span className="font-mono text-foreground">
                    ${cost.administrationCostPerVisit.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed criteria table */}
      <Card>
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-[14px] font-serif font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" strokeWidth={2} />
            Detalle por criterio
          </CardTitle>
          <CardDescription className="text-[12px]">
            Puntajes ponderados por criterio según peso asignado. La columna 'Dots' replica la visualización del Excel.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5 w-36 table-header">Dominio</th>
                  <th className="text-left font-semibold px-4 py-2.5 table-header">Criterio</th>
                  <th className="text-right font-semibold px-3 py-2.5 w-20 table-header">Peso (%)</th>
                  <th className="text-left font-semibold px-4 py-2.5 min-w-72 table-header">Resultado</th>
                  <th className="text-center font-semibold px-3 py-2.5 w-14 table-header">Valor</th>
                  <th className="text-left font-semibold px-4 py-2.5 w-28 table-header">Dots (1–5)</th>
                  <th className="text-right font-semibold px-4 py-2.5 w-28 table-header">Puntaje</th>
                  <th className="text-right font-semibold px-4 py-2.5 w-20 table-header">% dom.</th>
                </tr>
              </thead>
              <tbody>
                {score.criteria.map((c, i) => {
                  const domainInfo = score.domains.find((d) => d.domain === c.domain);
                  return (
                    <tr
                      key={i}
                      className={cn(
                        'border-b border-border',
                        i % 2 === 0 ? 'bg-card' : 'bg-muted/15',
                      )}
                    >
                      <td className="px-4 py-3 align-top">
                        <DomainBadge domain={c.domain} />
                      </td>
                      <td className="px-4 py-3 align-top font-medium text-foreground text-[13px]">
                        {c.criteria}
                      </td>
                      <td className="px-3 py-3 align-top text-right font-mono tabular-nums text-[13px]">
                        {c.weight.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground text-[12px] leading-relaxed">
                        {c.description}
                        {c.followup && (
                          <div className="mt-0.5 text-[10px] italic">
                            Seguimiento: {c.followup}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-center">
                        <ValuePill value={c.value} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <DotsDisplay value={c.value} />
                      </td>
                      <td className="px-4 py-3 align-top text-right font-mono tabular-nums font-semibold text-[13px]">
                        {c.weightedScore.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 align-top text-right font-mono tabular-nums text-muted-foreground text-[12px]">
                        {domainInfo ? (
                          <Percent value={domainInfo.domainPercentage} decimals={0} />
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-primary text-primary-foreground">
                  <td colSpan={6} className="px-4 py-3 font-semibold text-right text-[13px]">
                    TOTAL GLOBAL OBTENIDO
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[15px]">
                    {score.totalGlobal.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-[11px]">
                    /100
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Domain summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {score.domains.map((d) => {
          const color = DOMAIN_COLORS[d.domain] ?? 'oklch(0.50 0 0)';
          return (
            <Card key={d.domain} className="overflow-hidden">
              <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
              <CardHeader className="pb-2 pt-4">
                <DomainBadge domain={d.domain} />
                <CardTitle className="text-[26px] font-serif font-bold mt-2 tabular-nums leading-none">
                  <Percent value={d.domainPercentage} decimals={1} />
                </CardTitle>
                <CardDescription className="text-[11px] mt-1">
                  {d.criteria.length} criterio{d.criteria.length !== 1 ? 's' : ''} · peso {d.domainWeightSum.toFixed(1)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Obtenido</span>
                    <span className="font-mono text-foreground">{d.domainWeightedScoreSum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Máximo</span>
                    <span className="font-mono text-foreground">{d.domainWeightSum.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reference info */}
      {score.criteria.some((c) => c.reference) && (
        <Card className="bg-secondary/20 border-l-4 border-l-chart-2">
          <CardContent className="p-5">
            <h4 className="font-serif text-[13px] font-semibold mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-chart-2" strokeWidth={2} />
              Referencias de evidencia
            </h4>
            <ul className="space-y-2 text-[12px] text-muted-foreground">
              {score.criteria
                .filter((c) => c.reference)
                .map((c, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-semibold text-foreground shrink-0 w-44 text-[12px]">
                      {c.criteria}:
                    </span>
                    <span className="leading-relaxed">{c.reference}</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface EcoRowProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  emphasize?: boolean;
}

function EcoRow({ label, value, hint, emphasize }: EcoRowProps) {
  return (
    <div className={cn(emphasize && 'bg-secondary/40 -mx-2 px-2 py-1.5 rounded')}>
      <div className="flex items-center justify-between">
        <span className={cn('text-[12px]', emphasize ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
          {label}
        </span>
        <span className={cn('text-[13px] font-semibold font-mono', emphasize && 'text-primary')}>
          {value}
        </span>
      </div>
      {hint && (
        <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
          {hint}
        </div>
      )}
    </div>
  );
}
