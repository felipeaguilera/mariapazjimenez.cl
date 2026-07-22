# Plan: persistencia confiable del organizador (Netlify Blobs)

Plan para que Antigravity lo implemente. Felipe lo revisa antes de aprobar.
Antes de tocar nada, leer `AGENTS.md` y `SPEC.md`.

## Problema que resuelve

El organizador guarda la selección de fotos en un servicio gratuito
(`keyvalue.immanuel.co`) mandando **toda la selección dentro de la URL**. Con
pocas fotos funcionaba; al llegar a 47, la URL creció y el servicio empezó a
descartar las escrituras en silencio. En la sesión con la clienta se perdió el
guardado en la nube. Lo único que salvó el trabajo fue localStorage y el botón
de exportar JSON.

La causa de fondo: se depende de un servicio sin garantía y se escribe por URL,
que tiene límite de largo. Hay que sacar ese servicio del camino.

## Objetivo

Reemplazar la persistencia por **Netlify Blobs**, el almacenamiento propio de
Netlify, detrás de una función serverless. El valor viaja en el cuerpo del
request, sin límite de URL y sin terceros. María Paz entra desde su equipo y ve
el estado al día.

No cambiar la interfaz del organizador ni el sistema de IDs del manifiesto. Solo
cambia de dónde se lee y a dónde se escribe la selección.

## Arquitectura

```
organizer.astro  ──fetch──>  /.netlify/functions/selections  ──>  Netlify Blobs
   (navegador)                 (función serverless)                 (store durable)
```

Una sola función con dos métodos:
- `GET /.netlify/functions/selections` devuelve el JSON de la selección actual.
- `POST` con la selección en el body la guarda.

## Archivos

### Nuevo: `netlify/functions/selections.js`
```js
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const store = getStore('mpj-organizer');
  const KEY = 'selecciones';

  if (req.method === 'GET') {
    const data = await store.get(KEY, { type: 'json' });
    return Response.json(data ?? {});
  }

  if (req.method === 'POST') {
    const body = await req.json();
    await store.setJSON(KEY, body);
    return Response.json({ ok: true });
  }

  return new Response('Method not allowed', { status: 405 });
};
```

### Nuevo: `netlify.toml` (si no existe)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
```

### Cambio: `package.json`
Agregar dependencia `@netlify/blobs`.

### Cambio: `src/pages/organizer.astro`
Reemplazar las tres llamadas a KeyValue por la función local. Hoy son:
- `API_URL = "https://keyvalue.immanuel.co/api/KeyVal"` y el uso base64url.

Nuevo:
- `loadFromCloud()`: `fetch('/.netlify/functions/selections')` y usar el JSON tal cual.
- `saveToCloud()`: `fetch('/.netlify/functions/selections', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(selections) })`.
- Eliminar `base64urlEncode/Decode` y el `APP_KEY`. Ya no hacen falta: el valor va en el body como JSON normal.

**Conservar intacto** el resto de la lógica que ya funciona bien: autoguardado
con debounce de 2s, respaldo en localStorage, la recuperación que compara local
vs nube y conserva lo que tenga más trabajo, el botón de descarga de respaldo y
el aviso al cerrar con cambios pendientes. Todo eso sigue igual, solo cambia el
transporte.

### Cambio: `scripts/apply-selections.js`
Hoy baja la selección de KeyValue. Cambiar para que lea del nuevo endpoint de
Netlify (la URL de producción del sitio), o como alternativa que lea un archivo
local `scripts/seed-selection.json`. Recomendado: soportar ambos, con un flag.

## Sembrar la selección actual (no perder las 47)

En el repo está `scripts/seed-selection.json` con las 47 fotos ya elegidas por
María Paz. Después del primer deploy con Blobs, sembrar el store una vez para
que esas 47 aparezcan marcadas y nadie las vuelva a elegir. Dos formas:

- Un POST único al endpoint con el contenido de `seed-selection.json`, o
- Un script `scripts/seed-blobs.js` que lo suba con `@netlify/blobs`.

Verificar después que el organizador carga las 47 marcadas.

## Checklist de prueba (antes de dar por listo)

- [ ] `netlify dev` local: guardar una selección, recargar, sigue ahí
- [ ] Deploy a Netlify sin errores de función
- [ ] En producción: marcar fotos, esperar el autoguardado, recargar en otra
      pestaña, aparecen los cambios
- [ ] Abrir desde otro equipo o ventana incógnito: ve el mismo estado
- [ ] Sembrar las 47 y confirmar que se ven marcadas
- [ ] Cortar la red un momento: no se pierde nada, reintenta al volver
- [ ] `git diff --stat --ignore-all-space` muestra solo lo tocado

## Rollback

Si Blobs da problemas, el organizador sigue teniendo localStorage + exportar
JSON como red de seguridad. La selección nunca vive solo en la nube.

## Fuera de alcance

- No cambiar el sistema de IDs del manifiesto. Ya está en v2 con IDs fijos.
- No re-subir ni reordenar fotos. Las 13 nuevas (IDs 58-70) ya están en el
  manifiesto y aparecerán en el organizador con este mismo deploy.
- No tocar los textos ni el diseño del sitio.

## Contexto de datos (para verificar)

- 71 fotos en total en el organizador (IDs 0 a 70).
- IDs 0-57: fotos originales. Las 47 seleccionadas están en `seed-selection.json`.
- IDs 58-70: fotos nuevas sin asignar aún, para que María Paz las revise.
