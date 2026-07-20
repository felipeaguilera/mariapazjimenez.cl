import fs from 'fs';
import path from 'path';

const rawImagesDir = './public/raw-images';
const manifestPath = './src/data/raw-images-manifest.json';

const getFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });
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
