# OVR · Actualización acotada
- [x] Leer Excel y ZIP, alcance y adaptación aprobados.
- [x] Identificar Seguridad en Inputs_OVR, pesos MCDA, definiciones y fórmulas.
- [x] Copiar UI original y adaptar backend a oRPC con persistencia.
- [x] Actualizar solo Seguridad, validar no cambios fuera de alcance.
- [x] Reorganizar once óvalos sin cambiar fuentes/tamaños.
- [x] Build, pruebas límites escala, navegador y edición/reset costos.
- [x] ZIP sin secretos ni node_modules, entregar web y ZIP.
Decisión: preservar pesos organizativos originales 4 y 3; Excel nuevo muestra 3.5 y 3.5, fuera de alcance Seguridad. Total de dominio sigue 7.
Supresión VEGF mantiene escala categórica del Excel (No prolongada=5, Prolongada=1), no porcentajes.

Verificación final: 20 tests; build, lint y typecheck OK; persistencia y reset OK. Se corrigió cierre obsoleto de costos original sin cambios visuales.
