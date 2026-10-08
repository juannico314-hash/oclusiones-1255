'use client';

import { useAppStore } from '@/lib/store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ValorOvalDiagram } from './ValorRadialDiagram';
import {
  BookOpen,
  BarChart3,
  Table2,
  DollarSign,
  FileText,
  Layers,
} from 'lucide-react';
import type { ViewKey } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NavButton {
  view: ViewKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BUTTONS: NavButton[] = [
  { view: 'mcda-dashboard', label: 'Detallado', description: 'Análisis avanzado por molécula', icon: BarChart3 },
  { view: 'resumen', label: 'Comparativo', description: 'Tabla comparativa de moléculas', icon: Table2 },
  { view: 'referencias', label: 'Referencias', description: 'Bibliografía científica', icon: FileText },
  { view: 'input-costos', label: 'Costos', description: 'Tabla editable de costos', icon: DollarSign },
  { view: 'definiciones', label: 'Definiciones', description: 'Criterios y dominios', icon: BookOpen },
];

export function ModeloDeValor() {
  const data = useAppStore((s) => s.data);
  const setActiveView = useAppStore((s) => s.setActiveView);

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Título superior */}
      <h2 className="text-[22px] font-serif font-semibold text-foreground tracking-tight">
        Modelo de valor — {data.meta.indication || 'Degeneración macular asociada a la edad'}
      </h2>

      {/* Diagrama de óvalos */}
      <Card>
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-[14px] font-serif font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" strokeWidth={2} />
            Diagrama de valor
          </CardTitle>
          <CardDescription className="text-[12px]">
            Haga clic en cualquier criterio del círculo para ver su definición operacional.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ValorOvalDiagram />
          {/* Leyenda de colores por dominio */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-center gap-5 text-[11px]">
            <LegendItem color="bg-gradient-to-b from-[#2E5A8F] to-[#0F2440]" label="Eficacia" />
            <LegendItem color="bg-gradient-to-b from-[#C4DBF0] to-[#7BA8D4]" label="Seguridad" />
            <LegendItem color="bg-gradient-to-b from-[#AEDBBD] to-[#6FA886]" label="PROs" />
            <LegendItem color="bg-gradient-to-b from-[#9CCBED] to-[#5A9BCB]" label="Organizativo" />
          </div>
        </CardContent>
      </Card>

      {/* Cuadro de navegación — ocupa todo el ancho */}
      <Card>
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-[14px] font-serif font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" strokeWidth={2} />
            Navegación
          </CardTitle>
          <CardDescription className="text-[12px]">
            Seleccione la vista que desea consultar.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {NAV_BUTTONS.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.view}
                  onClick={() => setActiveView(btn.view)}
                  className="group p-4 rounded-md bg-[#1A3A5F] hover:bg-[#2a4a6f] text-white text-left transition-all flex flex-col gap-2 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                    <span className="text-white/30 group-hover:text-white/60 text-[16px] transition-colors">→</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold leading-tight">
                      {btn.label}
                    </div>
                    <div className="text-[10px] text-white/60 leading-tight mt-0.5">
                      {btn.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
}

function LegendItem({ color, label }: LegendItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('inline-block w-4 h-4 rounded-full shadow-sm', color)} />
      <span className="text-[#0F2440]">{label}</span>
    </div>
  );
}
