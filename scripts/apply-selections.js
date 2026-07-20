import fs from 'fs';
import path from 'path';

const API_URL = "https://keyvalue.immanuel.co/api/KeyVal";
const APP_KEY = "ecmcx7yj";
const ITEM_KEY = "selections";

const manifestPath = './src/data/raw-images-manifest.json';
const assetsDir = './src/assets';
const homePath = './src/data/home.json';
const trayectoriaPath = './src/data/trayectoria.json';

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function base64urlDecode(str) {
  if (!str) return '';
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

async function run() {
  console.log('Conectando con la nube de KeyValue...');
  
  let selections;
  try {
    const res = await fetch(`${API_URL}/GetValue/${APP_KEY}/${ITEM_KEY}`);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    
    // KeyValue returns string with quotes from json endpoint
    const encrypted = await res.json();
    if (!encrypted || encrypted.trim() === "") {
      console.error('Error: No se encontraron selecciones guardadas en la nube.');
      process.exit(1);
    }

    const decrypted = base64urlDecode(encrypted);
    selections = JSON.parse(decrypted);
    console.log('✓ Selección descargada con éxito de la nube.');
  } catch (error) {
    console.error('Error al descargar la selección desde la nube:', error.message);
    process.exit(1);
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
