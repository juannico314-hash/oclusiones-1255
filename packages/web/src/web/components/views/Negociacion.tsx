'use client';

import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/common/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Percent, Info, TrendingDown, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function Negociacion() {
  const data = useAppStore((s) => s.data);
  const updateDiscount = useAppStore((s) => s.updateDiscount);

  const [discountInput, setDiscountInput] = useState(
    data ? ((data.meta.discount ?? 0) * 100).toFixed(0) : '0',
  );

  const handleDiscountSave = async () => {
    const v = parseFloat(discountInput) / 100;
    if (isNaN(v) || v < 0 || v > 1) {
      toast.error('El descuento debe estar entre 0 y 100%');
      return;
    }
    await updateDiscount(v);
    toast.success(`Descuento actualizado a ${(v * 100).toFixed(0)}%`);
  };

  if (!data) return null;

  // Moléculas que reciben el descuento (definidas en el seed_data)
  const discountedMolecules = data.molecules.filter(
    (m) => (data.meta.discountedMolecules || []).includes(m.name),
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Negociación"
        description="Configuración del descuento aplicado al costo de tratamiento de las moléculas seleccionadas. El porcentaje se aplica automáticamente en la vista de Costos."
      />

      {/* Tarjeta principal de descuento */}
      <Card>
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-[14px] font-serif font-semibold flex items-center gap-2">
            <Percent className="w-4 h-4 text-primary" strokeWidth={2} />
            Descuento de negociación
          </CardTitle>
          <CardDescription className="text-[12px]">
            Ingrese el porcentaje de descuento acordado. Este valor se aplica al costo anual de inyecciones de las moléculas con descuento.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {/* Input grande y centrado */}
          <div className="flex flex-col items-center py-6">
            <label
              htmlFor="discount-input"
              className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3"
            >
              Porcentaje de descuento
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-card border-2 border-primary rounded-lg overflow-hidden shadow-sm">
                <input
                  id="discount-input"
                    aria-label="Descuento (%)"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  onBlur={handleDiscountSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-32 text-center text-[36px] font-mono font-bold text-primary bg-transparent outline-none px-4 py-2"
                />
                <div className="px-4 py-2 bg-primary text-white text-[20px] font-semibold">
                  %
                </div>
              </div>
            </div>
            {/* Barra de progreso verde */}
            <div className="w-full max-w-md mt-6">
              <div className="h-5 w-full bg-muted rounded-full overflow-hidden border-2 border-[#1A3A5F]">
                <div
                  className="h-full bg-gradient-to-r from-[#90EE90] to-[#5DB85D] transition-all duration-500 flex items-center justify-end pr-3"
                  style={{
                    width: `${Math.min(100, Math.max(2, parseFloat(discountInput) || 0))}%`,
                  }}
                >
                  {parseFloat(discountInput) > 5 && (
                    <span className="text-[11px] font-bold text-[#1A3A5F]">
                      {parseFloat(discountInput) || 0}%
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Valor actual guardado:{' '}
              <span className="font-mono font-semibold text-foreground">
                {((data.meta.discount ?? 0) * 100).toFixed(0)}%
              </span>
            </p>
          </div>

          {/* Información de la fórmula */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-start gap-3 p-3 rounded-md bg-secondary/20">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
              <div className="text-[12px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Fórmula aplicada:</strong>{' '}
                <code className="bg-card px-1.5 py-0.5 rounded text-[11px] font-mono border border-border">
                  Costo inyecciones = N° inyecciones × Precio × (1 − Descuento)
                </code>
                <br />
                El descuento se aplica únicamente al costo de inyecciones de las moléculas las moléculas con descuento,
                replicando las fórmulas originales de la hoja <em>Input_costo2</em> del Excel.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moléculas afectadas */}
      <Card>
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-[14px] font-serif font-semibold flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-primary" strokeWidth={2} />
            Moléculas afectadas por el descuento
          </CardTitle>
          <CardDescription className="text-[12px]">
            {discountedMolecules.length} molécula(s) las moléculas con descuento reciben este descuento en su costo de inyecciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {discountedMolecules.map((m) => {
              const cost = data.costInputs[m.name];
              const originalCost = cost ? cost.injectionCount * cost.pricePerVial : 0;
              const discountedCost = cost ? cost.costPerInjection : 0;
              const savings = originalCost - discountedCost;
              return (
                <div
                  key={m.id}
                  className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="font-medium text-foreground text-[13px] mb-2">
                    {m.name}
                  </div>
                  {cost && (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inyecciones/año:</span>
                        <span className="font-mono text-foreground">{cost.injectionCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio por jeringa prellenada:</span>
                        <span className="font-mono text-foreground">
                          ${cost.pricePerVial.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-border">
                        <span className="text-muted-foreground">Costo sin descuento:</span>
                        <span className="font-mono text-muted-foreground line-through">
                          ${originalCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground font-medium">Costo con descuento:</span>
                        <span className="font-mono text-primary font-semibold">
                          ${discountedCost.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      {savings > 0 && (
                        <div className="flex justify-between">
                          <span className="text-chart-2">Ahorro anual:</span>
                          <span className="font-mono text-chart-2 font-semibold">
                            ${savings.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Impacto en costos totales */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h4 className="font-serif text-[14px] font-semibold mb-1">
                Impacto en el modelo de costos
              </h4>
              <p className="text-[12px] text-white/80 leading-relaxed">
                El descuento del <strong>{((data.meta.discount ?? 0) * 100).toFixed(0)}%</strong> se aplica
                automáticamente en la vista de <strong>Costos</strong>, reduciendo el costo anual de
                inyecciones de las moléculas las moléculas con descuento. Esto impacta directamente en el costo total anual
                y en el costo por unidad de beneficio neto mostrado en el Dashboard y Resumen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
