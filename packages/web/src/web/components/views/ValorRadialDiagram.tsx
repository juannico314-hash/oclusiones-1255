'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

/**
 * Diagrama de óvalos moderno.
 * - Óvalos de criterios más separados en la parte superior e inferior
 *   (ángulos ajustados para evitar que se toquen)
 * - Degradados SVG y sombras para efecto 3D
 * - Clic en criterio → navega a Definiciones
 */

type Domain = 'eficacia' | 'seguridad' | 'pros' | 'posicionamiento';

interface CriteriaNode {
  id: string;
  label: string;
  shortLabel: string;
  domain: Domain;
  /** Ángulo en grados (0 = arriba, sentido horario) */
  angle: number;
}

// Once criterios; órbita elíptica sin reducir texto ni óvalos.
const CRITERIA: CriteriaNode[] = [
  { id: 'bcva', label: 'Cambio medio en la agudeza visual corregida (BCVA)', shortLabel: 'Cambio Medio en (BCVA)', domain: 'eficacia', angle: 0 },
  { id: 'ganancia15', label: 'Pacientes con ganancia ≥15 letras en BCVA', shortLabel: 'Ganancia ≥15 letras en BCVA', domain: 'eficacia', angle: 36 },
  { id: 'desprendimiento', label: 'Desprendimiento de retina', shortLabel: 'Desprendimiento de retina', domain: 'seguridad', angle: 68 },
  { id: 'cerebrovascular', label: 'Evento cerebrovascular', shortLabel: 'Evento cerebrovascular', domain: 'seguridad', angle: 96 },
  { id: 'infarto', label: 'Infarto agudo de miocardio', shortLabel: 'Infarto agudo de miocardio', domain: 'seguridad', angle: 122 },
  { id: 'vitreitis', label: 'Vitreitis', shortLabel: 'Vitreitis', domain: 'seguridad', angle: 150 },
  { id: 'vegf', label: 'Supresión sistémica de VEGF', shortLabel: 'Supresión sistémica de VEGF', domain: 'seguridad', angle: 186 },
  { id: 'calidad', label: 'Calidad de vida relacionada con la salud', shortLabel: 'Calidad de Vida', domain: 'pros', angle: 222 },
  { id: 'discapacidad', label: 'Discapacidad / capacidad funcional', shortLabel: 'Discapacidad', domain: 'pros', angle: 252 },
  { id: 'aprobacion', label: 'Estado de aprobación regulatoria', shortLabel: 'Estado de aprobación regulatoria', domain: 'posicionamiento', angle: 280 },
  { id: 'guias', label: 'Inclusión en guías de práctica clínica', shortLabel: 'Inclusión en guías de práctica clínica', domain: 'posicionamiento', angle: 310 },
];

interface DomainNode {
  id: Domain;
  label: string;
}

const DOMAINS: DomainNode[] = [
  { id: 'eficacia', label: 'Eficacia' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'pros', label: 'PROs' },
  { id: 'posicionamiento', label: 'Organizativo' },
];

const PALETTE: Record<Domain, { base: string; light: string; dark: string; text: string }> = {
  eficacia:        { base: '#1A3A5F', light: '#2E5A8F', dark: '#0F2440', text: '#FFFFFF' },
  seguridad:       { base: '#A8C8E8', light: '#C4DBF0', dark: '#7BA8D4', text: '#0F2440' },
  pros:            { base: '#90C8A8', light: '#AEDBBD', dark: '#6FA886', text: '#0F2440' },
  posicionamiento: { base: '#7FB8E0', light: '#9CCBED', dark: '#5A9BCB', text: '#0F2440' },
};

// Dimensiones del SVG
const VIEW_W = 1200;
const VIEW_H = 760;

// Centro del diagrama (desplazado a la derecha)
const CENTER_X = 690;
const CENTER_Y = 380;

// Órbita ampliada (radio mayor = más separación entre todos los óvalos)
const ORBIT_RADIUS = 310;

// Columna de dominios a la izquierda
const DOMAINS_X = 105;

function polar(angleDeg: number, radius: number, cx: number = CENTER_X, cy: number = CENTER_Y) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + (radius === ORBIT_RADIUS ? 375 : radius) * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function wrapText(text: string, maxLen: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxLen) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

interface ValorOvalDiagramProps {
  className?: string;
}

export function ValorOvalDiagram({ className }: ValorOvalDiagramProps) {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const setSelectedCriteria = useAppStore((s) => s.setSelectedCriteria);

  const handleCriteriaClick = (criteriaLabel: string) => {
    setSelectedCriteria(criteriaLabel);
    setActiveView('definiciones');
  };

  return (
    <div className={cn('w-full flex items-center justify-center', className)}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        style={{ maxHeight: '780px' }}
      >
        <defs>
          <radialGradient id="grad-valor" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#3A6FA8" />
            <stop offset="55%" stopColor="#1A3A5F" />
            <stop offset="100%" stopColor="#0F2440" />
          </radialGradient>
          <linearGradient id="grad-eficacia" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={PALETTE.eficacia.light} />
            <stop offset="100%" stopColor={PALETTE.eficacia.dark} />
          </linearGradient>
          <linearGradient id="grad-seguridad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={PALETTE.seguridad.light} />
            <stop offset="100%" stopColor={PALETTE.seguridad.dark} />
          </linearGradient>
          <linearGradient id="grad-pros" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={PALETTE.pros.light} />
            <stop offset="100%" stopColor={PALETTE.pros.dark} />
          </linearGradient>
          <linearGradient id="grad-posicionamiento" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={PALETTE.posicionamiento.light} />
            <stop offset="100%" stopColor={PALETTE.posicionamiento.dark} />
          </linearGradient>
          <filter id="shadow-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1A3A5F" floodOpacity="0.25" />
          </filter>
          <filter id="shadow-strong" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1A3A5F" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Círculos decorativos de fondo */}
        <circle cx={CENTER_X} cy={CENTER_Y} r={ORBIT_RADIUS + 20} fill="none" stroke="#1A3A5F" strokeWidth={1} strokeOpacity={0.08} strokeDasharray="3,5" />
        <circle cx={CENTER_X} cy={CENTER_Y} r={ORBIT_RADIUS - 70} fill="none" stroke="#1A3A5F" strokeWidth={1} strokeOpacity={0.06} strokeDasharray="2,4" />

        {/* Columna izquierda: 4 óvalos de dominios */}
        {DOMAINS.map((d, i) => {
          const y = 100 + i * 170;
          const palette = PALETTE[d.id];
          return (
            <g key={d.id} filter="url(#shadow-soft)">
              <ellipse cx={DOMAINS_X} cy={y} rx={92} ry={50} fill={`url(#grad-${d.id})`} stroke={palette.dark} strokeWidth={1.5} />
              <ellipse cx={DOMAINS_X} cy={y - 18} rx={70} ry={14} fill="#FFFFFF" opacity={0.18} />
              <text x={DOMAINS_X} y={y} textAnchor="middle" dominantBaseline="central" fill={palette.text} fontSize={d.label.length > 18 ? 12 : 14} fontWeight={700} fontFamily="var(--font-serif)" style={{ pointerEvents: 'none' }}>
                {d.label.length > 18 ? wrapText(d.label, 16).map((line, j, arr) => (
                  <tspan key={j} x={DOMAINS_X} dy={j === 0 ? `${-(arr.length - 1) * 0.55}em` : '1.1em'}>{line}</tspan>
                )) : d.label}
              </text>
            </g>
          );
        })}

        {/* Línea conectora dominios → centro */}
        <line x1={DOMAINS_X + 95} y1={CENTER_Y} x2={CENTER_X - 90} y2={CENTER_Y} stroke="#1A3A5F" strokeWidth={2} strokeOpacity={0.35} strokeDasharray="6,4" />

        {/* Líneas conectoras centro → criterios */}
        {CRITERIA.map((c) => {
          const pos = polar(c.angle, ORBIT_RADIUS);
          return (
            <line key={`line-${c.id}`} x1={CENTER_X} y1={CENTER_Y} x2={pos.x} y2={pos.y} stroke="#1A3A5F" strokeWidth={1.5} strokeOpacity={0.4} />
          );
        })}

        {/* Óvalo central: Valor */}
        <g filter="url(#shadow-strong)">
          <ellipse cx={CENTER_X} cy={CENTER_Y} rx={78} ry={54} fill="url(#grad-valor)" stroke="#0F2440" strokeWidth={2} />
          <ellipse cx={CENTER_X} cy={CENTER_Y - 22} rx={58} ry={16} fill="#FFFFFF" opacity={0.22} />
          <text x={CENTER_X} y={CENTER_Y} textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" fontSize={24} fontWeight={700} fontFamily="var(--font-serif)" style={{ pointerEvents: 'none' }}>Valor</text>
        </g>

        {/* 11 óvalos de criterios en círculo */}
        {CRITERIA.map((c) => {
          const pos = polar(c.angle, ORBIT_RADIUS);
          const palette = PALETTE[c.domain];
          const lines = wrapText(c.shortLabel, 22);
          return (
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- SVG groups cannot contain native HTML buttons.
            <g key={c.id} role="button" tabIndex={0} aria-label={c.label} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCriteriaClick(c.label); } }} onClick={() => handleCriteriaClick(c.label)} className="cursor-pointer transition-transform" style={{ pointerEvents: 'all' }} filter="url(#shadow-soft)">
              <ellipse cx={pos.x} cy={pos.y} rx={108} ry={52} fill="transparent" stroke="transparent" />
              <ellipse cx={pos.x} cy={pos.y} rx={100} ry={46} fill={`url(#grad-${c.domain})`} stroke={palette.dark} strokeWidth={1.5} className="oval-hover" style={{ transition: 'all 0.25s ease' }} />
              <ellipse cx={pos.x} cy={pos.y - 16} rx={76} ry={12} fill="#FFFFFF" opacity={0.2} style={{ pointerEvents: 'none' }} />
              {lines.map((line, i) => (
                <text key={i} x={pos.x} y={pos.y + (i - (lines.length - 1) / 2) * 13} textAnchor="middle" dominantBaseline="central" fill={palette.text} fontSize={11} fontWeight={600} style={{ pointerEvents: 'none' }}>{line}</text>
              ))}
            </g>
          );
        })}
      </svg>

      <style>{`
        .oval-hover:hover {
          filter: brightness(1.08);
        }
        .cursor-pointer:hover .oval-hover {
          stroke-width: 2.5 !important;
        }
      `}</style>
    </div>
  );
}
