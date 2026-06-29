# SPEC.md — mariapazjimenez.cl

Contexto técnico para agentes de código (Antigravity, Claude en VSCode). Lee esto antes de tocar cualquier archivo.

## Stack

- **Framework:** Astro (static site generator)
- **Hosting:** Netlify — deploy automático desde rama `main`
- **CMS:** Decap CMS, activo en `/admin/`
- **Repo:** github.com/felipeaguilera/mariapazjimenez.cl (privado)
- **URL temporal:** https://mariapazjimenezcl.netlify.app/
- **Dominio final:** mariapazjimenez.cl (DNS aún en HostingPlus, migrar después del contenido final)

## Estructura de archivos

```
web/
├── public/
│   ├── assets/          # Imágenes y SVGs — NO modificar sin confirmar con Felipe
│   │   ├── icons/       # SVGs de redes (WhatsApp, Email, Instagram, YouTube, Spotify, Apple)
│   │   ├── MariaPaz-Portrait.png
│   │   ├── Logo-maria-paz-morado.png   ← usar en nav/footer (fondos claros)
│   │   ├── logo-blanco.png             ← reservado para fondos oscuros
│   │   ├── clientes-logos-maria-paz.jpg
│   │   ├── VinosconMaripepa-Podcast.jpg
│   │   └── wset-badge.jpg
│   ├── admin/           # Decap CMS — no modificar
│   └── brief.html       # Página de estado del proyecto (cliente)
├── src/
│   ├── pages/
│   │   ├── index.astro       # Página principal (6 secciones)
│   │   └── trayectoria.astro # Página de trayectoria
│   ├── content/
│   │   └── work/             # Cards de "Mi trabajo" — editables via CMS
│   └── components/           # Componentes Astro si existen
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

## Estado actual del contenido

Todo el copy del sitio está en placeholder (`Pendiente. X líneas. Lorem ipsum...`). Los textos los escribe María Paz y los entrega via hoja de contenidos (`_context/MPJ-Contenidos-v1.html`). No inventar ni completar copy sin confirmación de Felipe.

## Qué NO hacer

- No modificar archivos en `public/assets/` sin confirmar
- No cambiar el design system (colores, fuentes) — aprobado por la cliente
- No escribir copy definitivo — ese trabajo es de María Paz
- No cambiar la estructura de navegación sin consultar
