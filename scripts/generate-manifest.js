import fs from 'fs';
import path from 'path';

const rawImagesDir = './public/raw-images';
const manifestPath = './src/data/raw-images-manifest.json';

// IMPORTANTE: el orden de este manifiesto define los indices globales que se
// guardan como seleccion de Maria Paz en /organizer. Si el orden cambia, sus
// selecciones apuntan a otras fotos.
//
// fs.readdirSync() devuelve el orden del sistema de archivos, que NO es igual
// en Windows (case-insensitive) que en Linux/Netlify (case-sensitive, las
// mayusculas van primero). Por eso se ordena explicitamente case-insensitive:
// reproduce el orden original de Windows y es estable en cualquier plataforma.
//
// NO cambiar este comparador mientras haya una seleccion activa sin aplicar.
const sortStable = (a, b) => {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
};

const getFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    })
    .sort(sortStable);
};

const manifest = {
  trabaja_conmigo: {
    comunicacion_eventos: getFiles(path.join(rawImagesDir, 'Fotos Web MPJ Trabaja Conmigo/Comunicación y Eventos'))
      .map(f => `/raw-images/Fotos Web MPJ Trabaja Conmigo/Comunicación y Eventos/${f}`),
    catas_maridajes: getFiles(path.join(rawImagesDir, 'Fotos Web MPJ Trabaja Conmigo/Catas & Maridajes'))
      .map(f => `/raw-images/Fotos Web MPJ Trabaja Conmigo/Catas & Maridajes/${f}`),
    podcast: getFiles(path.join(rawImagesDir, 'Fotos Web MPJ Trabaja Conmigo/Podcast Vinos con Marypepa'))
      .map(f => `/raw-images/Fotos Web MPJ Trabaja Conmigo/Podcast Vinos con Marypepa/${f}`)
  },
  trayectoria: {
    mi_empresa: getFiles(path.join(rawImagesDir, 'Fotos Web MPJ Trayectoria/Mi Empresa'))
      .map(f => `/raw-images/Fotos Web MPJ Trayectoria/Mi Empresa/${f}`),
    descorchados: getFiles(path.join(rawImagesDir, 'Fotos Web MPJ Trayectoria/Descorchados'))
      .map(f => `/raw-images/Fotos Web MPJ Trayectoria/Descorchados/${f}`),
    vina_valdivieso: getFiles(path.join(rawImagesDir, 'Fotos Web MPJ Trayectoria/VinaValdivieso'))
      .map(f => `/raw-images/Fotos Web MPJ Trayectoria/VinaValdivieso/${f}`),
    revista_gourmand: getFiles(path.join(rawImagesDir, 'Fotos Web MPJ Trayectoria/RevistaGourmand'))
      .map(f => `/raw-images/Fotos Web MPJ Trayectoria/RevistaGourmand/${f}`)
  }
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
console.log('Manifest generated successfully at', manifestPath);
