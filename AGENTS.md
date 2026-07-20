# AGENTS.md

Reglas de trabajo para agentes de código en este proyecto.
Lo leen Antigravity, Claude Code y Cursor desde la raíz del repo.

Antes de tocar cualquier archivo, lee también `SPEC.md`, que describe el estado
técnico actual del sitio.

---

## Cómo trabajamos

**Felipe aprueba, el agente implementa.** No se hace commit ni push sin que
Felipe lo pida explícitamente.

**Planificar antes de programar.** Para cualquier cambio que toque más de un
archivo o que introduzca un servicio externo, escribe primero el plan y espéralo
aprobado. Felipe revisa esos planes con un segundo agente antes de dar el visto
bueno, así que el plan debe explicar el diseño, no solo los pasos.

**Cuando algo se rehace, decirlo.** Si una decisión anterior resultó equivocada,
mejor cambiarla que defenderla. Pero explica qué cambió y por qué.

**Idioma:** español para comentarios, mensajes de commit y textos de interfaz.
Sin em dash en ningún texto de cara al usuario.

---

## Reglas técnicas de la casa

Estas salieron de errores reales del proyecto. No son teoría.

### 1. Nunca guardar estado por posición

Si algo se guarda como "el elemento número 3 de la lista", se rompe en silencio
apenas la lista cambia de orden o le agregan un elemento. Usa identificadores
fijos y explícitos, almacenados junto al dato.

Caso real: la selección de fotos de la clienta se guardaba como índices de
posición. Agregar una sola foto habría hecho que sus elecciones apuntaran a
fotos distintas, sin ningún error visible. Hoy `raw-images-manifest.json` tiene
un `id` fijo por foto y un `nextId`. No reasignar IDs existentes jamás.

### 2. `readdirSync` no ordena igual en Windows que en Linux

Windows ordena sin distinguir mayúsculas, Linux las pone primero. Netlify
compila en Linux. Cualquier lista generada leyendo un directorio tiene que
ordenarse explícitamente, o el resultado cambia según dónde se corra.

### 3. Verificar fin de línea antes de cada commit

```bash
git diff --stat --ignore-all-space
```

Si sale vacío mientras `git diff --stat` muestra archivos, son solo finales de
línea y no se commitean. Este repo ya tiene `.gitattributes` con `eol=lf`. Si
trabajas en otro proyecto sin ese archivo, créalo antes de seguir.

Commitear ese ruido rompe `git blame` de forma permanente.

### 4. Todo lo que guarda trabajo del usuario se autoguarda

Nada de botones de "guardar" como única vía. Si el usuario puede perder tiempo
de trabajo, se guarda solo, con respaldo local y reintento ante fallo de red.

Al recuperar estado, nunca sobrescribir a ciegas: comparar contra el respaldo
local y conservar lo que tenga más trabajo.

### 5. Probar la segunda sesión, no solo la primera

Que funcione al hacer clic no basta. Antes de dar algo por listo, pregúntate:

- ¿Qué pasa si el usuario cierra y vuelve mañana?
- ¿Qué pasa si cambian los archivos de entrada?
- ¿Qué pasa si esto corre dos veces?
- ¿Qué pasa en Linux, si lo probé en Windows?

Los cuatro bugs serios de este proyecto fallaban en silencio y solo aparecían
en la segunda pasada.

### 6. Los scripts que regeneran datos son idempotentes

Correrlos dos veces seguidas debe dar exactamente el mismo archivo. Si no,
tienen un bug.

### 7. Verificar el formato real de las imágenes

Las fotos de clientes vienen con extensiones mentirosas. En este proyecto llegó
un HEIC de iPhone llamado `.WEBP` que ningún navegador podía mostrar. Comprueba
el tipo real, no la extensión.

### 8. Servicios externos: avisar antes

Cualquier dependencia de terceros se propone antes de integrarla, con su modo de
falla explicado. Si es un servicio gratuito sin garantía, tiene que existir una
copia local del dato.

---

## Antes de dar algo por terminado

- [ ] `npx astro build` pasa sin errores ni warnings nuevos
- [ ] `git diff --stat --ignore-all-space` muestra solo lo que tocaste
- [ ] Si cambiaste un script de datos, lo corriste dos veces y da lo mismo
- [ ] Si cambiaste algo que guarda estado, probaste recargar la página
- [ ] `SPEC.md` quedó actualizado si cambió la arquitectura

---

## Qué NO hacer

- No inventar ni completar copy. Los textos los escribe María Paz.
- No modificar `public/assets/` sin confirmar con Felipe.
- No cambiar el design system, colores ni tipografías. Están aprobados.
- No cambiar la estructura de navegación sin consultar.
- No renombrar archivos dentro de `public/raw-images/`. Pierden su ID.
- No hacer commit ni push sin que Felipe lo pida.
