/**
 * CRIMINT — Script de Carga de Datos Iniciales (Seed Data)
 * Carga datos tácticos de muestra para Santa Fe:
 * - Bandas (Los Chingos, La Negrada, Los de Siempre)
 * - Personas de interés con antecedentes y roles
 * - Vínculos y jerarquías (Grafo criminal)
 * - Hechos delictivos georreferenciados (Microtráfico, balaceras, homicidios)
 * - Allanamientos y operativos con secuestros
 * - Zonas de patrullaje prioritario y conflicto
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gzatltsxpvnmtrafjmbg.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Error: Falta VITE_SUPABASE_ANON_KEY o VITE_SUPABASE_SERVICE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('🚀 Iniciando siembra de datos de inteligencia criminal (Santa Fe)...');

  // 1. ZONAS GEOGRÁFICAS
  console.log('📍 Insertando Zonas Geográficas...');
  const zonas = [
    {
      nombre: 'Barrio Yapeyú - Sector Norte',
      tipo: 'BANDA_CONFLICTO',
      barrio: 'Yapeyú',
      color_hex: '#EF4444',
      descripcion: 'Sector de disputa activa entre facciones locales. Control de pasillos y búnkers de microtráfico.',
      geom: 'SRID=4326;POLYGON((-60.740042 -31.559614, -60.744912 -31.565812, -60.745792 -31.571443, -60.736673 -31.573600, -60.732338 -31.567037, -60.731845 -31.561991, -60.740042 -31.559614))'
    },
    {
      nombre: 'San Lorenzo - Ochava Monseñor Zazpe',
      tipo: 'PATRULLAJE_PRIORITARIO',
      barrio: 'San Lorenzo',
      color_hex: '#F59E0B',
      descripcion: 'Punto neurálgico de acopio y distribución minorista. Múltiples requerimientos judiciales de allanamiento.',
      geom: 'SRID=4326;POLYGON((-60.7325 -31.6500, -60.7250 -31.6520, -60.7230 -31.6620, -60.7350 -31.6610, -60.7325 -31.6500))'
    },
    {
      nombre: 'Barranquitas Oeste',
      tipo: 'BANDA_CONFLICTO',
      barrio: 'Barranquitas',
      color_hex: '#8B5CF6',
      descripcion: 'Zona de tránsito fluvial y escape hacia el río Salado.',
      geom: 'SRID=4326;POLYGON((-60.7200 -31.6300, -60.7100 -31.6320, -60.7120 -31.6400, -60.7220 -31.6390, -60.7200 -31.6300))'
    }
  ];

  for (const z of zonas) {
    const { error } = await supabase.from('zonas_geograficas').insert(z);
    if (error) console.warn(`Zonas warning: ${error.message}`);
  }

  // 2. BANDAS
  console.log('🏴 Insertando Bandas...');
  const { data: bData, error: bErr } = await supabase.from('bandas').insert([
    {
      nombre: 'La Negrada',
      barrio_base: 'San Lorenzo',
      color_hex: '#EF4444',
      actividad_principal: 'Microtráfico, usurpaciones coactivas y abusos de arma',
      descripcion: 'Célula con base territorial en el sudoeste de Santa Fe. Mantiene disputas con Los de Siempre por control de bocas de expendio.',
      nivel_amenaza: 8,
      activa: true
    },
    {
      nombre: 'Los Chingos',
      barrio_base: 'Yapeyú',
      color_hex: '#F59E0B',
      actividad_principal: 'Comercialización de clorhidrato de cocaína fraccionada',
      descripcion: 'Estructura familiar con ramificaciones en Recreo y Las Flores.',
      nivel_amenaza: 7,
      activa: true
    },
    {
      nombre: 'Los de Siempre',
      barrio_base: 'Centenario / Fonavi San Jerónimo',
      color_hex: '#0EA5E9',
      actividad_principal: 'Sicariato, extorsión a comercios y microtráfico',
      descripcion: 'Histórica facción con articulación hacia barras de fútbol y distribución en zona sur.',
      nivel_amenaza: 9,
      activa: true
    }
  ]).select();

  if (bErr) console.warn(`Bandas warning: ${bErr.message}`);

  // 3. PERSONAS DE INTERÉS
  console.log('👤 Insertando Personas de Interés...');
  const { data: pData, error: pErr } = await supabase.from('personas').insert([
    {
      nombre: 'Marcelo Alejandro',
      apellido: 'Sosa',
      alias: ['El Tuerto', 'Chelo'],
      dni: '40644753',
      sexo: 'M',
      fecha_nacimiento: '1997-04-12',
      tez: 'Trigueña',
      cabello: 'Negro corto',
      contextura: 'Delgada',
      senas_particulares: 'Cicatriz pronunciada en ceja izquierda y tatuaje de cruz en antebrazo derecho',
      score_peligrosidad: 8,
      roles: ['dealer', 'distribuidor', 'acopiador'],
      domicilio_principal: 'Liberación y Estrada, Santa Fe',
      domicilio_principal_geom: 'SRID=4326;POINT(-60.7305 -31.6512)',
      antecedentes_texto: 'Causa CUIJ 21-09744817-2 por presunta infracción a la Ley 23.737. Detención previa en 2022 por portación indebida de arma de fuego de guerra.',
      activo: true
    },
    {
      nombre: 'Juan Manuel',
      apellido: 'Doello',
      alias: ['Polaco', 'Juancito'],
      dni: '39369578',
      sexo: 'M',
      fecha_nacimiento: '1995-11-23',
      tez: 'Clara',
      cabello: 'Castaño ondulado',
      contextura: 'Robusta',
      senas_particulares: 'Tatuaje de alas en cuello',
      score_peligrosidad: 9,
      roles: ['cabecilla', 'organizador', 'financiador'],
      domicilio_principal: 'Urquiza 4250, Santa Fe',
      domicilio_principal_geom: 'SRID=4326;POINT(-60.7088 -31.6285)',
      antecedentes_texto: 'Imputado en CUIJ 21-09319473-7. Prisión preventiva dictada en apelación. Mantiene vínculo de provisión desde Rosario.',
      activo: true
    },
    {
      nombre: 'Esteban Darío',
      apellido: 'Maidana',
      alias: ['Puchinga'],
      dni: '42189034',
      sexo: 'M',
      fecha_nacimiento: '2000-08-15',
      tez: 'Trigueña',
      cabello: 'Rapado en laterales',
      contextura: 'Atlética',
      score_peligrosidad: 7,
      roles: ['tirador', 'soldadito', 'campana'],
      domicilio_principal: 'Zavalla y Zazpe 1700, Santa Fe',
      domicilio_principal_geom: 'SRID=4326;POINT(-60.7289 -31.6582)',
      antecedentes_texto: 'Intervenido en 3 allanamientos con resultado de secuestro de municiones cal 9mm.',
      activo: true
    },
    {
      nombre: 'Romina Vanesa',
      apellido: 'Pallavidini',
      alias: ['La Gorda', 'Romi'],
      dni: '35890123',
      sexo: 'F',
      fecha_nacimiento: '1991-03-05',
      tez: 'Clara',
      score_peligrosidad: 5,
      roles: ['custodia de acopio', 'recaudadora'],
      domicilio_principal: 'Reinares y Neuquén, Santa Fe',
      domicilio_principal_geom: 'SRID=4326;POINT(-60.7387 -31.5712)',
      antecedentes_texto: 'Administradora de billeteras virtuales para cobro de estupefacientes por transferencias.',
      activo: true
    }
  ]).select();

  if (pErr) console.warn(`Personas warning: ${pErr.message}`);

  // 4. VÍNCULOS
  if (pData && pData.length >= 3) {
    console.log('🔗 Insertando Vínculos Criminales...');
    await supabase.from('vinculos').insert([
      {
        persona_origen_id: pData[1].id, // Doello
        persona_destino_id: pData[0].id, // Sosa
        tipo_relacion: 'SUBORDINADO_A',
        certeza: 'CONFIRMADO',
        origen_informacion: 'CUIJ 21-09319473-7 - Escuchas telefónicas directas',
        observaciones: 'Doello provee semanalmente el material para fraccionamiento a Sosa.'
      },
      {
        persona_origen_id: pData[0].id, // Sosa
        persona_destino_id: pData[2].id, // Maidana
        tipo_relacion: 'COAUTOR_EN',
        certeza: 'CONFIRMADO',
        origen_informacion: 'Allanamiento de Zavalla y Zazpe',
        observaciones: 'Maidana cumple función de custodia armada en el punto de venta de Sosa.'
      },
      {
        persona_origen_id: pData[0].id, // Sosa
        persona_destino_id: pData[3].id, // Pallavidini
        tipo_relacion: 'FAMILIAR_DE',
        certeza: 'CONFIRMADO',
        origen_informacion: 'Registro Civil / Investigaciones PDI',
        observaciones: 'Conviviente y titular de cuenta recaudadora.'
      }
    ]);
  }

  // 5. HECHOS DELICTIVOS
  console.log('🚨 Insertando Hechos Delictivos Georreferenciados...');
  const hechos = [
    {
      tipo_penal: 'Microtráfico',
      fecha: new Date(Date.now() - 2 * 86400000).toISOString(),
      franja_horaria: 'TARDE',
      direccion: 'Liberación y Estrada',
      barrio: 'San Lorenzo',
      localidad: 'Santa Fe',
      cuij: '21-09744817-2',
      requerimiento: 'R-060-26',
      indice_lesividad: 4,
      estado_georref: 'CONFIRMADA',
      precision_geo: 'EXACTA_ALTURA',
      geom: 'SRID=4326;POINT(-60.7305 -31.6512)',
      resumen: 'Venta al menudeo con flujo constante de compradores en motovehículos.',
      modus_operandi: 'Pasamanos rápido desde ventana enrejada con campana a 50 metros.'
    },
    {
      tipo_penal: 'Abuso de armas',
      fecha: new Date(Date.now() - 5 * 86400000).toISOString(),
      franja_horaria: 'NOCHE',
      direccion: 'Alfonsina Storni y Figueroa',
      barrio: 'Yapeyú',
      localidad: 'Santa Fe',
      cuij: '21-09745475-9',
      indice_lesividad: 8,
      estado_georref: 'CONFIRMADA',
      precision_geo: 'INTERSECCION',
      geom: 'SRID=4326;POINT(-60.7369 -31.5741)',
      resumen: 'Ataque armado contra fachada de inmueble. 14 vainas servidas cal 9mm secuestradas.',
      modus_operandi: 'Dos masculinos a bordo de motocicleta 150cc disparan en movimiento.'
    },
    {
      tipo_penal: 'Comercialización de estupefacientes',
      fecha: new Date(Date.now() - 10 * 86400000).toISOString(),
      franja_horaria: 'NOCHE',
      direccion: 'Juan Díaz de Solís 1400',
      barrio: 'San Lorenzo',
      localidad: 'Santa Fe',
      cuij: '21-09319473-7',
      indice_lesividad: 6,
      estado_georref: 'CONFIRMADA',
      precision_geo: 'EXACTA_ALTURA',
      geom: 'SRID=4326;POINT(-60.7280 -31.6560)',
      resumen: 'Centro de fraccionamiento y pesaje. Punto de aprovisionamiento de soldaditos.',
      modus_operandi: 'Inmueble fortificado con doble puerta de chapa reforzada y cámaras.'
    },
    {
      tipo_penal: 'Homicidio',
      fecha: new Date(Date.now() - 18 * 86400000).toISOString(),
      franja_horaria: 'MADRUGADA',
      direccion: 'Diagonal Abipones y Neuquén',
      barrio: 'Yapeyú',
      localidad: 'Santa Fe',
      indice_lesividad: 10,
      estado_georref: 'CONFIRMADA',
      precision_geo: 'INTERSECCION',
      geom: 'SRID=4326;POINT(-60.7435 -31.5667)',
      resumen: 'Víctima masculina con múltiples heridas de proyectil de arma de fuego en vía pública.',
      modus_operandi: 'Ajuste de cuentas por deuda de estupefacientes en territorio disputado.'
    }
  ];

  for (const h of hechos) {
    await supabase.from('hechos_delictivos').insert(h);
  }

  // 6. ALLANAMIENTOS
  console.log('🛡️ Insertando Allanamientos...');
  await supabase.from('allanamientos').insert([
    {
      cuij: '21-09744817-2',
      requerimiento: 'R-060-26',
      fecha_operativo: new Date(Date.now() - 3 * 86400000).toISOString(),
      direccion: 'Zavalla y Monseñor Zazpe 1700',
      barrio: 'San Lorenzo',
      localidad: 'Santa Fe',
      fuerza_interviniente: 'PDI (Policía de Investigaciones)',
      resultado: 'Positivo',
      juzgado_interviniente: 'MPA Fiscalía Regional 1',
      resultado_detalle: 'Secuestro de 58 envoltorios con sustancia blanquecina (cocaína), balanza digital marca Pocket, $142.000 en efectivo y dos teléfonos celulares.',
      resumen: 'Allanamiento de urgencia autorizado por juez penal tras tareas encubiertas.',
      geom: 'SRID=4326;POINT(-60.7289 -31.6582)'
    },
    {
      cuij: '21-09319473-7',
      requerimiento: 'R-012-25',
      fecha_operativo: new Date(Date.now() - 15 * 86400000).toISOString(),
      direccion: 'Juan Díaz de Solís 1450',
      barrio: 'San Lorenzo',
      localidad: 'Santa Fe',
      fuerza_interviniente: 'Gendarmería Nacional',
      resultado: 'Positivo',
      juzgado_interviniente: 'Juzgado Federal N° 1 Santa Fe',
      resultado_detalle: 'Secuestro de 1 trozo compacto de marihuana (650gr), pistola calibre .380 con numeración limada y 15 cartuchos.',
      resumen: 'Operativo simultáneo en tres objetivos vinculados a la red de Doello.',
      geom: 'SRID=4326;POINT(-60.7280 -31.6560)'
    }
  ]);

  console.log('✅ Siembra de datos completada exitosamente.');
}

seed().catch(err => {
  console.error('Error durante la siembra de datos:', err);
  process.exit(1);
});
