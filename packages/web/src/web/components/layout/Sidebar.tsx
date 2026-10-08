'use client';

import { useAppStore } from '@/lib/store';
import type { ViewKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Table2,
  DollarSign,
  FileText,
  Activity,
  RotateCcw,
  ChevronRight,
  Handshake,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  key: ViewKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  hasSubmenu?: boolean;
  submenu?: { key: ViewKey; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'modelo-valor',
    label: 'Modelo de valor',
    description: 'Hub central',
    icon: LayoutDashboard,
    hasSubmenu: true,
    submenu: [
      {
        key: 'negociacion',
        label: 'Negociación',
        description: 'Descuento y costos',
        icon: Handshake,
      },
    ],
  },
  {
    key: 'definiciones',
    label: 'Definiciones',
    description: 'Criterios y dominios',
    icon: BookOpen,
  },
  {
    key: 'mcda-dashboard',
    label: 'Dashboard',
    description: 'Análisis avanzado',
    icon: BarChart3,
  },
  {
    key: 'resumen',
    label: 'Resumen',
    description: 'Comparativo',
    icon: Table2,
  },
  {
    key: 'input-costos',
    label: 'Costos',
    description: 'Tabla de costos',
    icon: DollarSign,
  },
  {
    key: 'referencias',
    label: 'Referencias',
    description: 'Bibliografía',
    icon: FileText,
  },
];

export function Sidebar() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const resetData = useAppStore((s) => s.resetData);
  const data = useAppStore((s) => s.data);

  // El submenu está abierto si la vista activa es el padre o alguno de los hijos
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Si la vista activa es 'negociacion', expandir 'modelo-valor'
    if (activeView === 'negociacion') initial.add('modelo-valor');
    return initial;
  });

  const toggleSubmenu = (key: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isMenuActive = (item: NavItem) => {
    if (activeView === item.key) return true;
    if (item.submenu) {
      return item.submenu.some((sub) => sub.key === activeView);
    }
    return false;
  };

  return (
    <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      {/* Logo / Header */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <Activity className="w-4.5 h-4.5 text-sidebar-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-tight truncate font-serif">
              Modelo de Valor
            </h1>
            <p className="text-[11px] text-sidebar-foreground/60 leading-tight mt-0.5">
              MCDA · Anti-VEGF
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Navegación
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isMenuActive(item);
            const isExpanded = expandedMenus.has(item.key);
            const hasSub = item.hasSubmenu && item.submenu && item.submenu.length > 0;
            return (
              <li key={item.key}>
                <button
                  onClick={() => {
                    if (hasSub) {
                      toggleSubmenu(item.key);
                      setActiveView(item.key);
                    } else {
                      setActiveView(item.key);
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all',
                    isActive
                      ? 'bg-sidebar-accent text-white shadow-sm'
                      : 'hover:bg-white/5 text-sidebar-foreground/85',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50',
                    )}
                    strokeWidth={2}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'text-[13px] leading-tight',
                        isActive ? 'font-semibold' : 'font-medium',
                      )}
                    >
                      {item.label}
                    </div>
                    <div className="text-[11px] text-sidebar-foreground/50 leading-tight mt-0.5">
                      {item.description}
                    </div>
                  </div>
                  {hasSub && (
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 text-sidebar-foreground/40 shrink-0 transition-transform',
                        isExpanded && 'rotate-90',
                      )}
                      strokeWidth={2.5}
                    />
                  )}
                </button>

                {/* Submenú desplegable */}
                {hasSub && isExpanded && item.submenu && (
                  <ul className="mt-1 ml-7 space-y-0.5 border-l border-sidebar-border/40 pl-3">
                    {item.submenu.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeView === sub.key;
                      return (
                        <li key={sub.key}>
                          <button
                            onClick={() => setActiveView(sub.key)}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left transition-all',
                              isSubActive
                                ? 'bg-sidebar-primary/20 text-sidebar-primary font-semibold'
                                : 'hover:bg-white/5 text-sidebar-foreground/70',
                            )}
                          >
                            <SubIcon
                              className={cn(
                                'w-3.5 h-3.5 shrink-0',
                                isSubActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/40',
                              )}
                              strokeWidth={2}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] leading-tight font-medium">
                                {sub.label}
                              </div>
                              <div className="text-[10px] text-sidebar-foreground/40 leading-tight mt-0.5">
                                {sub.description}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer con estado, botón reset y logos */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <div className="text-[11px] text-sidebar-foreground/60 space-y-1">
          <div className="font-semibold text-sidebar-foreground/80 uppercase tracking-wider text-[10px] mb-1.5">
            Estado
          </div>
          <div className="flex justify-between">
            <span>Moléculas</span>
            <span className="font-mono text-sidebar-foreground/80">{data?.molecules.length ?? 0}</span>
          </div>
        </div>
        <button
          onClick={() => resetData()}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-[11px] rounded-md border border-sidebar-border/60 text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground transition-colors"
          title="Restablecer al estado original"
        >
          <RotateCcw className="w-3 h-3" />
          Restablecer
        </button>

        {/* Logos de empresas */}
        <div className="pt-4 border-t border-sidebar-border/60 flex flex-col items-center justify-center gap-5">
          <img
            src="/logo-lucentis.png"
            alt="Lucentis"
            className="h-8 w-auto max-w-[160px] opacity-95"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <img
            src="/logo-axonpharma-white.png"
            alt="Axon Pharma"
            className="h-5 w-auto max-w-[190px] opacity-95 py-1"
          />
        </div>
      </div>
    </aside>
  );
}
