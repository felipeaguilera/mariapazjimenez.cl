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

## Preferencias de diseño y comportamiento

Decisiones ya tomadas sobre cómo se ven y se comportan las fotos. Respetarlas.

- **Carrusel sin autoplay.** Nada se mueve solo. Se navega con las flechas, se
  invita a hacer clic. No reactivar el auto-avance.
- **Orden aleatorio por visita.** El carrusel baraja las fotos en cada carga,
  para que quien no hace clic no vea siempre la misma.
- **Contador numérico, no puntos.** Todos los sliders muestran "1 / N", nunca dots.
- **Recorte automático a 2:3.** El sitio recorta solo (object-fit cover, position
  center). No re-encuadrar cada foto a mano. Para ajustar un recorte puntual, usar
  el campo `position` (top / center / bottom), no editar el archivo. Solo recortar
  a mano las excepciones (fotos horizontales que se pierden mucho).
- **Proporción por bloque.** El carrusel acepta un `ratio` (ej "2 / 3" vertical o
  "3 / 2" horizontal). Valdivieso va horizontal porque es una sola foto apaisada.
- **Nombres neutrales `mpj-<id>`.** Las fotos aplicadas se nombran por su ID fijo,
  no por sección. Una foto en varias secciones es un solo archivo compartido.
- **IDs visibles en el organizador.** Cada foto muestra su badge "ID N", para
  poder referirlas por número en vez del nombre de archivo (que no se usa en el sitio).

## Estado y pendientes

- Persistencia del organizador: migrada de KeyValue a **Netlify Blobs** (confiable).
- Selección final aplicada (56 fotos, nombres `mpj-<id>`). Valdivieso a una foto
  horizontal, Gourmand reemplazado por versiones en alta resolución.
- Hero de "Quién soy": swap manual a la foto ID 65 (`public/assets/quien-soy-hero.webp`).
  Cambiarlo hoy es indicar otro ID, no elegir en el organizador.
- Pendiente sin urgencia: candado de contraseña del organizador. Plan listo en
  `PLAN-organizer-password.md` (Netlify Edge Function, gratis).
- Opción futura: categoría "Quién soy" seleccionable en el organizador, para que
  María Paz elija el hero ella misma. Hoy es swap manual.
- Limpieza final cuando todo esté cerrado: quitar `public/raw-images/` y
  `src/pages/organizer.astro` del sitio público.

## Qué NO hacer

- No modificar archivos en `public/assets/` sin confirmar
- No cambiar el design system (colores, fuentes) — aprobado por la cliente
- No escribir copy definitivo — ese trabajo es de María Paz
- No cambiar la estructura de navegación sin consultar
- No renombrar ni reordenar archivos dentro de `public/raw-images/`
- No commitear sin correr `git diff --stat --ignore-all-space` antes
