# Oclusiones venosas retinianas · Actualización de Seguridad

## Cambios
- Eliminado Endoftalmitis; incorporados Evento cerebrovascular y Vitreitis (ortografía del Excel).
- Pesos de Seguridad: retina 13,2; cerebrovascular 10,7; infarto 10,7; vitreitis 7,4; VEGF 5. Total Seguridad: 47%.
- Definiciones, datos y mensajes reproducen el Excel aprobado, hoja Inputs_OVR.
- Cuatro eventos: 5=0%; 4=>0% a <0,5%; 3=≥0,5% a <1%; 2=≥1% a <3%; 1=≥3%.
- Supresión VEGF conserva la escala categórica del Excel. NR aporta cero puntos, no equivale a ausencia de eventos.
- Once óvalos redistribuidos; no cambian tipografía, tamaño de letra, colores ni los restantes componentes.
- No se modificaron datos de Eficacia, PROs, Organizativo, costos ni bibliografía general. Los pesos organizativos continúan 4 y 3 del ZIP original, no 3,5 y 3,5 del Excel nuevo, por quedar fuera del alcance. El total de ese dominio sigue siendo 7.
- Corrección técnica del guardado de costos: se guarda el valor actual, no el anterior. No cambia su presentación.

## Plataforma
Adaptación a Bun/Vite/React/Hono/oRPC aprobada por el usuario. Este ZIP no es un proyecto Next.js.
Los cambios de costos/descuento se conservan en la base Drizzle/libSQL.
El Excel aprobado se incluye sin modificar y conserva sus macros.

## Ejecutar localmente
Requiere Bun. Desde la raíz:

```bash
bun install
```

Crear `.env` en la raíz con `DATABASE_URL=file:./ovr-local.db`. Para Turso, usar los valores privados propios de DATABASE_URL y DATABASE_AUTH_TOKEN. Nunca compartir credenciales.

```bash
bun run db:push
bun run dev
```

La web usa el puerto asignado en `__ports.cjs` (4200).

## Verificación
```bash
bun test scripts/security.test.ts
bun run build
bun run lint
bun run typecheck
```
20 pruebas unitarias aprobadas. Compilación, lint y tipos aprobados. Pruebas en navegador: Inicio, Definiciones, Dashboard (ambas moléculas), Resumen, Costos y Referencias; persistencia tras recarga y restablecimiento. Once burbujas sin superposición; cero errores JavaScript.
Resultados: Ranibizumab 90,72; Aflibercept 91,00. IAM Ranibizumab: 0,56%, valor 3, aporte 6,42.
El build muestra aviso de tamaño del bundle, no un error.

## Datos y reproducción
- `data/Excel-aprobado-OVR.xlsm`: referencia aprobada intacta.
- `data/seed_data.json`: datos actualizados de la aplicación.
- `data/original_seed.json`: base original para comprobar el alcance.
- `scripts/update_security.py`: actualización de Seguridad con controles de no modificación fuera de alcance (Python y openpyxl).

No se incluyen `.env`, credenciales, bases con cambios de prueba, cachés ni dependencias. La publicación y el dominio se gestionan desde la plataforma Runable.
