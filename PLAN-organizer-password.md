# Plan: proteger el organizador con contraseña (gratis)

Para Antigravity. Felipe lo revisa antes de aprobar. Leer `AGENTS.md` y `SPEC.md`.

## Objetivo

Dejar `/organizer` accesible pero **detrás de una sola contraseña compartida**,
sin costo. Así Felipe (y María Paz) lo tienen "a mano" en producción sin que
quede abierto a cualquiera con la URL.

La protección de contraseña nativa de Netlify es de pago. La alternativa gratis
es una **Edge Function** que intercepta la ruta y pide la clave. Netlify tiene
una plantilla oficial para esto (actualizada marzo 2026).

## Alcance

Proteger:
- `/organizer` (la página)
- `/raw-images/*` (las fotos crudas, hoy públicas)

Dejar público el resto del sitio (inicio, trayectoria).

Nota sobre el endpoint `/.netlify/functions/selections`: hoy es público y sin
auth, igual que antes. Como solo guarda una selección de fotos, el riesgo es
bajo. Si se quiere cerrar también, que la misma Edge Function cubra esa ruta,
pero el `fetch` del organizador ya va con la cookie de sesión al ser mismo
origen, así que seguiría funcionando. Decisión de Felipe si se incluye o no.

## Cómo funciona

1. Una Edge Function corre antes de servir las rutas protegidas.
2. Si el request trae una cookie de sesión válida, deja pasar.
3. Si no, muestra un formulario de contraseña.
4. Al enviar la clave correcta, setea una cookie de sesión (HttpOnly, Secure,
   SameSite=Strict, expira en ~24 h) y deja pasar.
5. La clave se lee de una variable de entorno de Netlify, nunca en el código.
6. Comparar con hash usando Web Crypto, no texto plano.

## Archivos

### [NEW] `netlify/edge-functions/auth.js`
Edge function con la lógica de arriba. Basarse en la plantilla oficial de
Netlify "password-protect-a-page". Leer la clave de `ORGANIZER_PASSWORD`.

### [MODIFY] `netlify.toml`
Declarar la edge function y las rutas que cubre:
```toml
[[edge_functions]]
  path = "/organizer"
  function = "auth"

[[edge_functions]]
  path = "/raw-images/*"
  function = "auth"
```

### Variable de entorno (en el panel de Netlify, no en git)
`ORGANIZER_PASSWORD` = la clave que elija Felipe.

## Verificación

- [ ] `netlify dev` local: entrar a `/organizer` pide contraseña
- [ ] Clave incorrecta: no deja pasar
- [ ] Clave correcta: entra y la sesión dura al recargar
- [ ] El inicio y `/trayectoria` siguen abiertos, sin contraseña
- [ ] El organizador sigue guardando bien tras autenticarse (la cookie viaja al
      `fetch` del endpoint por ser mismo origen)
- [ ] Deploy y repetir en producción
- [ ] `git diff --stat --ignore-all-space` muestra solo lo tocado

## Importante

- La clave nunca va en el código ni en git. Solo en la variable de entorno.
- Esto es una barrera simple de una clave, no login por usuario. Suficiente
  para una herramienta interna, no para datos sensibles.
- No tocar la lógica de Blobs ni el organizador salvo lo necesario para la auth.

## Contexto

Referencias: plantilla oficial de Netlify "password-protect-a-page" y ejemplos
de basic auth con edge functions. La Edge Function corre en el borde antes de
servir la ruta, por eso puede bloquear el acceso a la página estática.
