# SPEC.md — mariapazjimenez.cl

Estado técnico del sitio. Lee esto antes de tocar cualquier archivo.

Las reglas de trabajo (cómo commitear, qué no hacer, checklist de cierre) están
en `AGENTS.md`, en la raíz del repo. Léelo también.

Última actualización: julio 2026.

## Stack

- **Framework:** Astro (static site generator)
- **Hosting:** Netlify — deploy automático desde rama `main`
- **CMS:** Decap CMS, activo en `/admin/`
- **Repo:** github.com/felipeaguilera/mariapazjimenez.cl (privado)
- **URL temporal:** https://mariapazjimenezcl.netlify.app/
- **Dominio final:** mariapazjimenez.cl (DNS aún en HostingPlus, migrar después del contenido final)

## Estructura de archivos

```
mariapazjimenez.cl/
├── AGENTS.md            # Reglas de trabajo para agentes
├── SPEC.md              # Este archivo: estado técnico
├── .gitattributes       # eol=lf, evita diffs falsos desde Windows
├── public/
│   ├── assets/          # Imágenes finales del sitio — NO modificar sin confirmar
│   │   └── icons/       # SVGs de redes sociales
│   ├── raw-images/      # TEMPORAL: fotos crudas para que MPJ elija en /organizer
│   │                    # Se borra cuando termine la selección
│   ├── admin/           # Decap CMS — no modificar
│   └── brief.html       # Página de estado para la clienta
├── scripts/
│   ├── generate-manifest.js   # Genera el manifiesto con IDs fijos
│   └── apply-selections.js    # Baja la selección de la nube y aplica las fotos
├── src/
│   ├── assets/          # Fotos elegidas, optimizadas por astro:assets en build
│   ├── components/
│   │   └── ImageCarousel.astro   # Carrusel 2:3 vertical
│   ├── data/
│   │   ├── home.json
│   │   ├── trayectoria.json
│   │   └── raw-images-manifest.json   # v2, con IDs fijos
│   ├── layouts/Base.astro
│   └── pages/
│       ├── index.astro
│       ├── trayectoria.astro
│       └── organizer.astro    # TEMPORAL: herramienta de selección de fotos
└── astro.config.mjs
```

## Design system

```css
--accent:    #8B1A2F;   /* burdeos — color principal */
--accent-lt: #F7EDEF;   /* burdeos muy claro — fondos de badge/highlight */
--bg:        #FAFAF7;   /* fondo base */
--surface:   #F2EEE8;   /* fondo alternado (pull quote, podcast, footer) */
--text:      #1A1A1A;
--muted:     #6B6B6B;
--border:    #E4DED4;
```

Tipografía (Google Fonts):
- **Headings:** Cormorant Garamond — 400, 600, italic
- **Body / UI:** Poppins — 300, 400, 500, 600

Botones:
- `.btn-outline`: borde + texto `#8B1A2F`, fondo transparente. Variante estándar.
- `.btn-primary`: fondo `#8B1A2F`, texto blanco. Reservado, no en uso activo.

## Páginas

### index.astro — 6 secciones en orden
1. Hero: 2 col (texto izq, foto der), nombre + tagline + 2 botones
2. Pull quote: cita central en itálica, fondo `--surface`
3. Mi trabajo: 4 áreas (Comunicaciones y PR, Eventos, Podcast y Charlas, Turismo)
4. Clientes: logo wall con `clientes-logos-maria-paz.jpg`
5. Podcast: Vinos con Maripepa, links YouTube / Spotify / Apple Podcasts
6. Contacto: WhatsApp, email, Instagram

### trayectoria.astro
- Bloques de carrera alternados (texto + imagen 16:9)
- Formación: WSET 2, WSET 3 con mérito, Diplomado UC, Mendoza
- Mismo nav y footer que index

## CMS (Decap)

- Colección activa: `work` — corresponde a las 4 cards de "Mi trabajo"
- Campos por card: título, descripción, imagen (opcional)
- Acceso: `/admin/` con Netlify Identity

## Nota importante sobre scripts externos en Astro

Scripts CDN externos (Netlify Identity, etc.) requieren el atributo `is:inline`:
```html
<script is:inline src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
```
Sin `is:inline`, Astro intenta bundlear el script y falla.

## Sistema de fotos (activo, julio 2026)

Flujo completo para llevar las fotos de María Paz al sitio:

```
public/raw-images/          fotos crudas, temporales, versionadas en git
        ↓  node scripts/generate-manifest.js
raw-images-manifest.json    lista con un ID FIJO por foto
        ↓  MPJ elige en /organizer (online, autoguardado)
KeyValue (nube)             { seccion: [ids...] } en base64url
        ↓  node scripts/apply-selections.js
src/assets/                 solo las fotos elegidas, renombradas
        ↓  astro build
dist/_astro/*.webp          optimizadas, 800x1200, calidad 80
```

### Reglas críticas de este sistema

**Los números son IDs fijos, no posiciones.** El manifiesto es `version: 2` y
cada foto tiene su `id`. Se pueden agregar o quitar fotos sin descolocar la
selección de María Paz. Nunca reasignar un ID existente ni renombrar archivos
en `raw-images/`, porque el ID se identifica por la ruta.

**`generate-manifest.js` es idempotente.** Correrlo dos veces da el mismo
archivo. Conserva los IDs previos y solo asigna nuevos a fotos nuevas.

**`/organizer` autoguarda.** Cada cambio va a localStorage al instante y a la
nube a los 2 segundos. Al cargar compara ambos y conserva el que tenga más
trabajo, para no borrar una sesión sin subir.

**Persistencia:** `keyvalue.immanuel.co`, app key `ecmcx7yj`, item `selections`.
Servicio gratuito sin garantía, elegido a propósito para una herramienta
temporal. El valor viaja dentro de la URL, así que hay un límite de tamaño no
confirmado, estimado en unas 25 a 30 asignaciones. Si empiezan a fallar los
guardados, hay que comprimir el formato del payload.

### Cuando termine la selección

1. `node scripts/apply-selections.js`
2. Revisar `home.json` y `trayectoria.json`
3. `npx astro build` y confirmar que genera los `.webp`
4. Commit y push
5. Limpieza final: borrar `public/raw-images/` y `src/pages/organizer.astro`,
   que son temporales y hoy quedan públicos

## Estado del contenido

Textos definitivos de María Paz ya aplicados en `home.json` y
`trayectoria.json` (julio 2026). Las imágenes de los carruseles siguen en
placeholder hasta que termine la selección.

No inventar ni completar copy sin confirmación de Felipe.

## Pendientes conocidos

- Dos fotos de Viña Valdivieso llegaron en tamaño muy chico (330x220 y 201x251)
  y el carrusel las agranda a 800x1200, así que se ven borrosas y pesan más que
  el original. Esa carpeta tiene solo 3 fotos en total.
- Límite de guardado del servicio KeyValue sin verificar.
- Falta la limpieza final de `raw-images/` y `organizer.astro`.

## Qué NO hacer

- No modificar archivos en `public/assets/` sin confirmar
- No cambiar el design system (colores, fuentes) — aprobado por la cliente
- No escribir copy definitivo — ese trabajo es de María Paz
- No cambiar la estructura de navegación sin consultar
- No renombrar ni reordenar archivos dentro de `public/raw-images/`
- No commitear sin correr `git diff --stat --ignore-all-space` antes
