import fs from 'fs';
import path from 'path';

const selectionsPath = './fotos-seleccionadas.json';
const assetsDir = './src/assets';
const homePath = './src/data/home.json';
const trayectoriaPath = './src/data/trayectoria.json';

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Check if selections file exists
if (!fs.existsSync(selectionsPath)) {
  console.error(`Error: No se encontró el archivo '${selectionsPath}' en la raíz del proyecto.`);
  console.log('Por favor, descarga el archivo desde el organizador e introduce el archivo en la raíz.');
  process.exit(1);
}

try {
  const selections = JSON.parse(fs.readFileSync(selectionsPath, 'utf-8'));
  console.log('Cargando selección de imágenes...');

  // Helper to copy and rename files
  const processSectionImages = (sectionKey, imageList) => {
    if (!imageList || imageList.length === 0) {
      console.log(`- Sección [${sectionKey}]: Sin imágenes seleccionadas.`);
      return [];
    }

    return imageList.map((item, index) => {
      // Find source path (e.g. /raw-images/Fotos.../file.jpg)
      // Remove leading slash for local fs operations
      const sourceRelative = item.src.startsWith('/') ? item.src.slice(1) : item.src;
      const sourcePath = path.join('./public', sourceRelative);

      if (!fs.existsSync(sourcePath)) {
        console.warn(`  Advertencia: No se encontró el archivo origen: ${sourcePath}`);
        return item; // Fallback to original
      }

      // Generate normalized name: src/assets/sectionKey_index.ext
      const ext = path.extname(sourcePath).toLowerCase();
      const targetName = `${sectionKey}_${index + 1}${ext}`;
      const targetPath = path.join(assetsDir, targetName);

      // Copy file
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  Copiado: ${sourcePath} -> ${targetPath}`);

      // Return configuration object for Astro
      return {
        src: `/src/assets/${targetName}`,
        position: item.position || 'center'
      };
    });
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
  console.log('✓ Archivo home.json actualizado correctamente.');

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
  console.log('✓ Archivo trayectoria.json actualizado correctamente.');

  // Clean up selection file
  fs.unlinkSync(selectionsPath);
  console.log(`✓ Archivo temporal '${selectionsPath}' eliminado de la raíz.`);
  console.log('\n¡Proceso completado con éxito! Las imágenes están listas en src/assets/ y configuradas.');

} catch (error) {
  console.error('Ocurrió un error procesando el archivo JSON:', error);
  process.exit(1);
}
