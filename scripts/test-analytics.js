import fs from 'fs';

const data = JSON.parse(fs.readFileSync('public/data/santa_fe_tactical.json', 'utf8'));

const STOP_WORDS = new Set([
  'llamada anonima', 'llamado anonimo', 'los vecinos', 'los mismos', 'los fines',
  'los estupefacientes', 'los dias', 'los domicilios', 'los retire', 'los viste',
  'los gritos', 'los hechos quien', 'descripcion:', 'recurrente', 'sin nombre',
  'santa fe', 'puerta negra', 'puerta blanca', 'porton negro', 'casa amarilla',
  'pasillo', 'reja negra', 'camioneta', 'auto', 'moto', 'motocicleta', 'frente',
  'anonimo', 'tercero', 'femenina', 'masculino', 'denuncia', 'comisaria'
]);

const denunciados = new Map();

data.features.forEach((f, idx) => {
  if (f.geometry.type !== 'Point') return;
  const p = f.properties;
  
  // 1. Quoted text in 'nombre' (this is where Google My Maps markers store the target person!)
  const titleQuotes = (p.nombre || '').match(/"([^"]+)"/g) || [];
  titleQuotes.forEach(q => {
    let name = q.replace(/"/g, '').trim();
    if (name.length >= 3 && name.length <= 40 && !name.toLowerCase().startsWith('cuij')) {
      const lower = name.toLowerCase();
      if (!STOP_WORDS.has(lower)) {
        const list = denunciados.get(name) || [];
        list.push({ idx, tipo: p.tipo, barrio: p.barrio || p.direccion });
        denunciados.set(name, list);
      }
    }
  });

  // 2. Explicit names in resumen: "alias", "apodado", "imputado", "imputada", "familia [Nombre]"
  const famMatch = (p.resumen || '').match(/\b(?:familia|flia\.?|banda de|alias|apodo)\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+)?)/gi) || [];
  famMatch.forEach(m => {
    let clean = m.trim().replace(/\s+/g, ' ');
    if (clean.length >= 5 && clean.length <= 35) {
      const lower = clean.toLowerCase();
      if (!STOP_WORDS.has(lower) && !lower.includes('estupefaciente')) {
        const list = denunciados.get(clean) || [];
        list.push({ idx, tipo: p.tipo, barrio: p.barrio || p.direccion });
        denunciados.set(clean, list);
      }
    }
  });
});

const top = Array.from(denunciados.entries())
  .filter(([name, list]) => list.length >= 2)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 25);

console.log('--- PERSONAS / BANDAS / DENUNCIADOS RECURRENTES DETECTADOS ---');
top.forEach(t => {
  console.log(`• ${t[0]} (${t[1].length} incidencias)`);
});
