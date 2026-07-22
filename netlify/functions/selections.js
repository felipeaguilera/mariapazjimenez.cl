import { getStore } from '@netlify/blobs';

const ALLOWED_KEYS = new Set([
  'comunicacion_eventos',
  'catas_maridajes',
  'podcast',
  'mi_empresa',
  'descorchados',
  'vina_valdivieso',
  'revista_gourmand'
]);

function validateSelections(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return false;
  }
  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.has(key)) {
      return false;
    }
    if (!Array.isArray(body[key])) {
      return false;
    }
  }
  return true;
}

export default async (req) => {
  const store = getStore('mpj-organizer');
  const KEY = 'selecciones';

  if (req.method === 'GET') {
    try {
      const data = await store.get(KEY, { type: 'json' });
      return Response.json(data ?? {});
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (!validateSelections(body)) {
        return Response.json({ error: 'Payload no válido' }, { status: 400 });
      }
      await store.setJSON(KEY, body);
      return Response.json({ ok: true });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
};
