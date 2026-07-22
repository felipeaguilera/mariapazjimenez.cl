import fs from 'fs';
import path from 'path';

const seedPath = './scripts/seed-selection.json';
const manifestPath = './src/data/raw-images-manifest.json';
const assetsDir = './src/assets';
const homePath = './src/data/home.json';
const trayectoriaPath = './src/data/trayectoria.json';

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function run() {
  const isLocal = process.argv.includes('--local');
  let selections;

  if (isLocal) {
    console.log(`Leyendo selección local desde ${seedPath}...`);
    if (!fs.existsSync(seedPath)) {
      console.error(`Error: No se encontró el archivo local de selecciones: ${seedPath}`);
      process.exit(1);
    }
    try {
      const raw = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      selections = raw.selecciones || raw;
      console.log('✓ Selección local cargada con éxito.');
    } catch (error) {
      console.error('Error al leer el archivo local de selección:', error.message);
      process.exit(1);
    }
  } else {
    const ENDPOINT_URL = process.env.SELECTIONS_URL || "https://mariapazjimenezcl.netlify.app/.netlify/functions/selections";
    console.log(`Conectando con el servidor (${ENDPOINT_URL})...`);
    try {
      const res = await fetch(ENDPOINT_URL);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      selections = await res.json();
      if (!selections || typeof selections !== 'object') {
        console.error('Error: La respuesta del servidor no es un objeto válido.');
        process.exit(1);
      }
      console.log('✓ Selección descargada con éxito desde la nube.');
    } catch (error) {
      console.error('Error al descargar la selección desde la nube:', error.message);
      console.error('Pista: si quieres usar la selección local guardada en git, ejecuta con el flag --local');
      process.exit(1);
    }
  }

  // Read manifest to map indices to paths
  if (!fs.existsSync(manifestPath)) {
    console.error(`Error: No se encontró el manifiesto de imágenes: ${manifestPath}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Mapa ID fijo -> ruta de la foto.
  //
  // Los numeros que guarda /organizer son los IDs del manifiesto (v2), NO la
  // posicion en la lista. Por eso agregar fotos nuevas no descoloca la seleccion.
  const srcById = new Map();
  const mapFolderFiles = (group, key) => {
    const list = (manifest[group] && manifest[group][key]) || [];
    list.forEach((item, idx) => {
      // v2: { id, src }. Compatibilidad con v1: string suelto, id = posicion global.
      if (typeof item === 'string') {
        srcById.set(srcById.size, item);
      } else {
        srcById.set(item.id, item.src);
      }
    });
  };

  mapFolderFiles('trabaja_conmigo', 'comunicacion_eventos');
  mapFolderFiles('trabaja_conmigo', 'catas_maridajes');
  mapFolderFiles('trabaja_conmigo', 'podcast');
  mapFolderFiles('trayectoria', 'mi_empresa');
  mapFolderFiles('trayectoria', 'descorchados');
  mapFolderFiles('trayectoria', 'vina_valdivieso');
  mapFolderFiles('trayectoria', 'revista_gourmand');

  // Helper to copy and rename files using manifest indices
  const processSectionImages = (sectionKey, indexList) => {
    if (!indexList || indexList.length === 0) {
      console.log(`- Sección [${sectionKey}]: Sin imágenes seleccionadas.`);
      return [];
    }

    return indexList.map((photoId, listIndex) => {
      const src = srcById.get(photoId);
      if (!src) {
        console.warn(`  Advertencia: el ID [${photoId}] no existe en el manifiesto (${sectionKey}). Se omite. Puede que esa foto se haya borrado o renombrado.`);
        return null;
      }

      // Remove leading slash for local fs operations
      const sourceRelative = src.startsWith('/') ? src.slice(1) : src;
      const sourcePath = path.join('./public', sourceRelative);

      if (!fs.existsSync(sourcePath)) {
        console.warn(`  Advertencia: No se encontró el archivo origen: ${sourcePath}`);
        return { src, position: 'center' };
      }

      // Generate normalized name: src/assets/sectionKey_index.ext
      const ext = path.extname(sourcePath).toLowerCase();
      const targetName = `${sectionKey}_${listIndex + 1}${ext}`;
      const targetPath = path.join(assetsDir, targetName);

      // Copy file
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  Copiado: ${sourcePath} -> ${targetPath}`);

      // Return configuration object for Astro
      return {
        src: `/src/assets/${targetName}`,
        position: 'center' // Default crop position
      };
    }).filter(Boolean);
  };

  // 1. Process Home (Trabaja conmigo) Sections
  const homeData = JSON.parse(fs.readFileSync(homePath, 'utf-8'));
  
  if (selections.comunicacion_eventos) {
    homeData.work_cards[0].images = processSectionImages('comunicacion_eventos', selections.comunicacion_eventos);
  }
  if (selections.catas_maridajes) {
    homeData.work_cards[1].images = processSectionImages('catas_maridajes', selections.catas_maridajes);
  }
  if (selections.podcast) {
    homeData.work_cards[2].images = processSectionImages('podcast', selections.podcast);
  }

  fs.writeFileSync(homePath, JSON.stringify(homeData, null, 2), 'utf-8');
  console.log('✓ Archivo home.json actualizado.');

  // 2. Process Trayectoria Sections
  const trayectoriaData = JSON.parse(fs.readFileSync(trayectoriaPath, 'utf-8'));

  if (selections.mi_empresa) {
    trayectoriaData.career[0].images = processSectionImages('mi_empresa', selections.mi_empresa);
  }
  if (selections.descorchados) {
    trayectoriaData.career[1].images = processSectionImages('descorchados', selections.descorchados);
  }
  if (selections.vina_valdivieso) {
    trayectoriaData.career[2].images = processSectionImages('vina_valdivieso', selections.vina_valdivieso);
  }
  if (selections.revista_gourmand) {
    trayectoriaData.career[3].images = processSectionImages('revista_gourmand', selections.revista_gourmand);
  }

  fs.writeFileSync(trayectoriaPath, JSON.stringify(trayectoriaData, null, 2), 'utf-8');
  console.log('✓ Archivo trayectoria.json actualizado.');

  console.log('\n¡Proceso completado con éxito! Las imágenes están listas en src/assets/ y aplicadas.');
}

run();
