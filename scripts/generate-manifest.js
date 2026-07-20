import fs from 'fs';
import path from 'path';

const rawImagesDir = './public/raw-images';
const manifestPath = './src/data/raw-images-manifest.json';

/*
 * MANIFIESTO CON IDENTIFICADORES FIJOS (v2)
 *
 * Por que existe este archivo:
 * En /organizer, la seleccion de Maria Paz se guarda como una lista de numeros.
 * En la version 1 ese numero era la POSICION de la foto en la lista, asi que
 * agregar una sola foto corria todas las posiciones siguientes y su seleccion
 * pasaba a apuntar a fotos equivocadas, sin ningun error visible.
 *
 * Desde la v2 el numero es un ID fijo guardado dentro del manifiesto. Una foto
 * nace con un ID y se lo queda para siempre. Las fotos nuevas toman el
 * siguiente ID libre (nextId). Se pueden agregar o quitar fotos cuando sea:
 * nada se mueve.
 *
 * Reglas al modificar este script:
 * - NUNCA reasignar el ID de una foto existente.
 * - Los IDs se identifican por la ruta del archivo. Si renombras una foto,
 *   pierde su ID y toma uno nuevo, asi que evita renombrar.
 * - Se puede correr las veces que quieras: es idempotente.
 */

const SECTIONS = [
  ['trabaja_conmigo', 'comunicacion_eventos', 'Fotos Web MPJ Trabaja Conmigo/Comunicación y Eventos'],
  ['trabaja_conmigo', 'catas_maridajes',      'Fotos Web MPJ Trabaja Conmigo/Catas & Maridajes'],
  ['trabaja_conmigo', 'podcast',              'Fotos Web MPJ Trabaja Conmigo/Podcast Vinos con Marypepa'],
  ['trayectoria',     'mi_empresa',           'Fotos Web MPJ Trayectoria/Mi Empresa'],
  ['trayectoria',     'descorchados',         'Fotos Web MPJ Trayectoria/Descorchados'],
  ['trayectoria',     'vina_valdivieso',      'Fotos Web MPJ Trayectoria/VinaValdivieso'],
  ['trayectoria',     'revista_gourmand',     'Fotos Web MPJ Trayectoria/RevistaGourmand']
];

const VALID_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

// Orden estable e independiente del sistema operativo.
// readdirSync devuelve el orden del filesystem, que difiere entre Windows
// (case-insensitive) y Linux (mayusculas primero). Esto solo afecta el ORDEN
// EN PANTALLA, ya no la identidad de las fotos, pero conviene que sea estable.
const sortStable = (a, b) => {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
};

const getFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => VALID_EXT.includes(path.extname(f).toLowerCase()))
    .sort(sortStable);
};

// ---- Cargar el manifiesto anterior para conservar los IDs ya asignados ----

const idBySrc = new Map();
let nextId = 0;
let previous = null;

if (fs.existsSync(manifestPath)) {
  try {
    previous = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    console.error('No se pudo leer el manifiesto anterior. Abortando para no reasignar IDs.');
    process.exit(1);
  }
}

if (previous && previous.version === 2) {
  // Ya esta en v2: se reutilizan los IDs tal cual.
  for (const [group, key] of SECTIONS.map(s => [s[0], s[1]])) {
    const list = (previous[group] && previous[group][key]) || [];
    list.forEach(item => {
      if (item && typeof item.id === 'number') idBySrc.set(item.src, item.id);
    });
  }
  nextId = typeof previous.nextId === 'number'
    ? previous.nextId
    : (idBySrc.size ? Math.max(...idBySrc.values()) + 1 : 0);

} else if (previous) {
  // MIGRACION v1 -> v2.
  // En la v1 el indice era la posicion dentro de la lista plana, concatenando
  // las secciones en el orden de SECTIONS. Se siembran los IDs con esa misma
  // posicion para que la seleccion ya guardada siga apuntando a las mismas fotos.
  let flat = 0;
  for (const [group, key] of SECTIONS.map(s => [s[0], s[1]])) {
    const list = (previous[group] && previous[group][key]) || [];
    list.forEach(src => {
      if (typeof src === 'string') idBySrc.set(src, flat);
      flat++;
    });
  }
  nextId = flat;
  console.log(`Migrando manifiesto v1 -> v2. Se preservaron ${idBySrc.size} IDs existentes.`);
}

// ---- Construir el manifiesto nuevo ----

const manifest = { version: 2, nextId: 0 };
let reused = 0;
const added = [];

for (const [group, key, dir] of SECTIONS) {
  if (!manifest[group]) manifest[group] = {};
  const files = getFiles(path.join(rawImagesDir, dir));

  manifest[group][key] = files.map(f => {
    const src = `/raw-images/${dir}/${f}`;
    let id;
    if (idBySrc.has(src)) {
      id = idBySrc.get(src);
      reused++;
    } else {
      id = nextId++;
      added.push({ id, src });
    }
    return { id, src };
  });
}

manifest.nextId = nextId;

// ---- Chequeo de seguridad: ningun ID duplicado ----
const seen = new Set();
for (const [group, key] of SECTIONS.map(s => [s[0], s[1]])) {
  for (const item of manifest[group][key]) {
    if (seen.has(item.id)) {
      console.error(`ERROR: ID duplicado ${item.id} en ${item.src}. No se escribio nada.`);
      process.exit(1);
    }
    seen.add(item.id);
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`Manifiesto v2 generado en ${manifestPath}`);
console.log(`  IDs conservados: ${reused}`);
console.log(`  Fotos nuevas:    ${added.length}`);
added.forEach(a => console.log(`    +${a.id}  ${a.src.split('/').pop()}`));
console.log(`  Proximo ID libre: ${nextId}`);
