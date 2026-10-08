'use client';

import { useAppStore } from '@/lib/store';
import { PageHeader, DomainBadge } from '@/components/common/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

export function Definiciones() {
  const data = useAppStore((s) => s.data);
  const selectedCriteria = useAppStore((s) => s.selectedCriteria);
  const setSelectedCriteria = useAppStore((s) => s.setSelectedCriteria);
  const selectedRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (selectedCriteria && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedCriteria]);

  if (!data) return null;

  const byDomain: Record<string, typeof data.definitions> = {};
  for (const d of data.definitions) {
    const key = d.domain.trim();
    if (!byDomain[key]) byDomain[key] = [];
    byDomain[key].push(d);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Definiciones"
        description="Criterios de evaluación, dominios clínicos y definiciones operacionales utilizados por el modelo MCDA. Cada criterio se traduce a un valor 1–5 según los rangos definidos en la columna 'Valores posibles', alineados con el Excel aprobado."
      />

      {/* Banner de criterio seleccionado */}
      {selectedCriteria && (
        <Card className="bg-primary/10 border-primary">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="text-[12px] text-foreground">
              <span className="font-semibold">Criterio seleccionado desde el diagrama: </span>
              <span className="text-primary">{selectedCriteria}</span>
            </div>
            <button
              onClick={() => setSelectedCriteria(null)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Quitar selección
            </button>
          </CardContent>
        </Card>
      )}

      {/* Tabla de definiciones */}
      <Card>
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-[14px] font-serif font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" strokeWidth={2} />
            Definiciones operacionales por dominio
          </CardTitle>
          <CardDescription className="text-[12px]">
            {data.definitions.length} criterios distribuidos en 4 dominios: Eficacia, Seguridad, PROs y Organizativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5 w-40 table-header">Dominio</th>
                  <th className="text-left font-semibold px-4 py-2.5 w-64 table-header">Criterio</th>
                  <th className="text-left font-semibold px-4 py-2.5 table-header">Definición operacional</th>
                  <th className="text-left font-semibold px-4 py-2.5 w-72 table-header">Valores posibles</th>
                </tr>
              </thead>
              <tbody>
                {data.definitions.map((d, i) => {
                  const isSelected = selectedCriteria && selectedCriteria.trim() === d.criteria.trim();
                  return (
                    <tr
                      key={i}
                      ref={isSelected ? selectedRef : undefined}
                      className={cn(
                        'border-b border-border transition-colors',
                        isSelected
                          ? 'bg-primary/15 ring-2 ring-primary ring-inset'
                          : i % 2 === 0
                            ? 'bg-card'
                            : 'bg-muted/15',
                      )}
                    >
                      <td className="px-4 py-3 align-top">
                        <DomainBadge domain={d.domain} />
                      </td>
                      <td className="px-4 py-3 align-top font-medium text-foreground text-[13px]">
                        {d.criteria}
                        {isSelected && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-primary font-semibold">
                            ← Seleccionado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground leading-relaxed text-[12px]">
                        {d.operationalDefinition}
                      </td>
                      {/* Valores posibles — misma tipografía que las demás celdas, sin cuadro gris */}
                      <td className="px-4 py-3 align-top text-muted-foreground leading-relaxed text-[12px] whitespace-pre-line">
                        {d.possibleValues}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resumen por dominio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(byDomain).map(([domain, items]) => (
          <Card key={domain}>
            <CardHeader className="pb-3">
              <DomainBadge domain={domain} />
              <CardTitle className="text-[13px] font-serif mt-2">
                {items.length} criterio{items.length !== 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                {items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary mt-0.5">▸</span>
                    <span className="leading-relaxed">{item.criteria}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nota metodológica */}
      <Card className="bg-secondary/20 border-l-4 border-l-chart-2">
        <CardContent className="p-5">
          <h4 className="font-serif text-[13px] font-semibold mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-chart-2" strokeWidth={2} />
            Nota metodológica
          </h4>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Los valores 1 a 5 representan una escala ordinal donde <strong className="text-foreground">1</strong>{' '}
            corresponde al peor desenlace posible y <strong className="text-foreground">5</strong> al mejor. Para los
            eventos de seguridad, las frecuencias se califican así: 5 = 0%; 4 = &gt;0% a &lt;0,5%;
            3 = ≥0,5% a &lt;1%; 2 = ≥1% a &lt;3%; 1 = ≥3%. La supresión sistémica de VEGF
            conserva su escala categórica: No prolongada = 5; Prolongada = 1. Los datos no reportados
            (NR) reciben valor 0 y no aportan puntaje, conforme al Excel aprobado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
