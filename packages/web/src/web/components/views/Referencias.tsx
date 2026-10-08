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
import { FileText, ExternalLink, Quote, Pill } from 'lucide-react';

export function Referencias() {
  const data = useAppStore((s) => s.data);
  const setSelectedMolecule = useAppStore((s) => s.setSelectedMolecule);
  const setActiveView = useAppStore((s) => s.setActiveView);
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referencias"
        description="Bibliografía científica y regulatoria que respalda la evidencia clínica de cada molécula. Las referencias están organizadas por molécula y por dominio (Eficacia, Seguridad, Supresión VEGF, Organizativo)."
      />

      <div className="space-y-4">
        {data.molecules.map((m) => {
          const refs = data.references[m.name] || [];
          if (refs.length === 0) return null;

          const byDomain: Record<string, string[]> = {};
          for (const r of refs) {
            const key = r.domain.trim();
            if (!byDomain[key]) byDomain[key] = [];
            byDomain[key].push(r.citation);
          }

          return (
            <Card key={m.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-primary/5 transition-colors border-b bg-muted/30 py-3"
                onClick={() => {
                  setSelectedMolecule(m.name);
                  setActiveView('mcda-dashboard');
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4 text-primary" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-[14px] font-serif font-semibold">
                        {m.name}
                      </CardTitle>
                      <CardDescription className="text-[11px] mt-0.5">
                        {refs.length} referencia{refs.length !== 1 ? 's' : ''} · Click para ver en dashboard
                      </CardDescription>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  {Object.entries(byDomain).map(([domain, citations]) => (
                    <div key={domain} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DomainBadge domain={domain} />
                        <span className="text-[11px] text-muted-foreground">
                          {citations.length} cita{citations.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <ul className="space-y-2 pl-4 border-l-2 border-border">
                        {citations.map((cite, i) => (
                          <li
                            key={i}
                            className="relative pl-3 text-[12px] text-muted-foreground leading-relaxed"
                          >
                            <Quote className="absolute -left-[1.15rem] top-1 w-3 h-3 text-primary/40" />
                            {cite}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary footer */}
      <Card className="bg-secondary/20 border-l-4 border-l-chart-2">
        <CardContent className="p-5">
          <h4 className="font-serif text-[13px] font-semibold mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-chart-2" strokeWidth={2} />
            Nota sobre las fuentes
          </h4>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Las referencias incluyen ensayos clínicos publicados (NCT, EPAR-EMA, CADTH),
            artículos revisados por pares (Korobelnik, Schmidt-Erfurth, Brown, Bressler,
            Silva, Venkatesh, Sharma, Vemulakonda) y regulaciones del INVIMA (Instituto
            Nacional de Vigilancia de Medicamentos y Alimentos de Colombia). Esta
            bibliografía corresponde a la hoja <strong>Referencias</strong> del Excel
            original y se mantiene intacta en el modelo web.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
