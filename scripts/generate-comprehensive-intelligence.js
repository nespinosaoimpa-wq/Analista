import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const baseDir = path.resolve('001 - Microtrafico - Incidencias-20260917T160119Z-1-001', '001 - Microtrafico - Incidencias');

console.log('🚀 Iniciando compilación de Inteligencia Criminal Estratégica Santa Fe...');

// 1. ZONAS GEOGRÁFICAS OPERATIVAS
const ZONAS = [
  {
    id: 'zona-yapeyu',
    nombre: 'Barrio Yapeyú - Sector Norte',
    tipo: 'BANDA_CONFLICTO',
    barrio: 'Yapeyú',
    color_hex: '#EF4444',
    descripcion: 'Sector de disputa territorial armada entre Puchingas y bandas de Recreo. Búnkers y pasadizos.',
    geom: {
      type: 'Polygon',
      coordinates: [[
        [-60.740042, -31.559614],
        [-60.744912, -31.565812],
        [-60.745792, -31.571443],
        [-60.736673, -31.573600],
        [-60.732338, -31.567037],
        [-60.731845, -31.561991],
        [-60.740042, -31.559614]
      ]]
    }
  },
  {
    id: 'zona-san-lorenzo',
    nombre: 'San Lorenzo / Chalet - Corredor Zazpe y Estrada',
    tipo: 'BANDA_CONFLICTO',
    barrio: 'San Lorenzo',
    color_hex: '#DC2626',
    descripcion: 'Epicentro de conflicto armado entre La Negrada y Los de Siempre. Alta concentración de balaceras (HAF) y allanamientos.',
    geom: {
      type: 'Polygon',
      coordinates: [[
        [-60.7325, -31.6500],
        [-60.7250, -31.6520],
        [-60.7230, -31.6620],
        [-60.7350, -31.6610],
        [-60.7325, -31.6500]
      ]]
    }
  },
  {
    id: 'zona-centenario',
    nombre: 'Centenario / Fonavi San Jerónimo',
    tipo: 'PATRULLAJE_PRIORITARIO',
    barrio: 'Centenario',
    color_hex: '#0284C7',
    descripcion: 'Bastión histórico de "Los de Siempre". Extorsiones, balaceras y control de accesos a monoblocks.',
    geom: {
      type: 'Polygon',
      coordinates: [[
        [-60.7240, -31.6620],
        [-60.7150, -31.6630],
        [-60.7160, -31.6740],
        [-60.7260, -31.6730],
        [-60.7240, -31.6620]
      ]]
    }
  },
  {
    id: 'zona-barranquitas',
    nombre: 'Barranquitas Oeste / Río Salado',
    tipo: 'BANDA_CONFLICTO',
    barrio: 'Barranquitas',
    color_hex: '#10B981',
    descripcion: 'Corredor de aprovisionamiento de la Banda del Correntino (Beban). Vías de escape ribereñas.',
    geom: {
      type: 'Polygon',
      coordinates: [[
        [-60.7200, -31.6300],
        [-60.7100, -31.6320],
        [-60.7120, -31.6400],
        [-60.7220, -31.6390],
        [-60.7200, -31.6300]
      ]]
    }
  },
  {
    id: 'zona-castanaduy',
    nombre: 'Santa Fe Norte - Castañaduy / Las Flores',
    tipo: 'PATRULLAJE_PRIORITARIO',
    barrio: 'Santa Fe Norte',
    color_hex: '#8B5CF6',
    descripcion: 'Base operativa y guardería de vehículos de la red de Polaco Maidana.',
    geom: {
      type: 'Polygon',
      coordinates: [[
        [-60.7350, -31.5850],
        [-60.7200, -31.5860],
        [-60.7210, -31.5970],
        [-60.7360, -31.5960],
        [-60.7350, -31.5850]
      ]]
    }
  },
  {
    id: 'zona-alto-verde',
    nombre: 'Alto Verde - Sector Ribereño',
    tipo: 'BANDA_CONFLICTO',
    barrio: 'Alto Verde',
    color_hex: '#EC4899',
    descripcion: 'Dominio territorial de "Los Espinillos". Puntos de trasbordo fluvial y caletas isleñas.',
    geom: {
      type: 'Polygon',
      coordinates: [[
        [-60.6900, -31.6450],
        [-60.6750, -31.6460],
        [-60.6780, -31.6620],
        [-60.6930, -31.6600],
        [-60.6900, -31.6450]
      ]]
    }
  }
];

// 2. BANDAS DELICTIVAS TERRITORIALES
const BANDAS = [
  {
    id: 'banda-la-negrada',
    nombre: 'La Negrada',
    barrio_base: 'San Lorenzo / Chalet',
    color_hex: '#EF4444',
    actividad_principal: 'Microtráfico, usurpaciones coactivas y abusos de armas de alta lesividad',
    descripcion: 'Organización criminal con base territorial en el sudoeste de Santa Fe. Conducción operativa vinculada a Jon Zabala y la familia Giovanniello. Mantiene histórica y violenta pugna con "Los de Siempre" por bocas de expendio y control de pasillos.',
    nivel_amenaza: 9,
    cabecilla_principal: 'Jon Nelson Zabala (Prófugo - Pedido de Captura)',
    zonas_operacion: ['San Lorenzo', 'Chalet', 'Centenario', 'Santa Rosa de Lima'],
    rivales: ['Los de Siempre'],
    delitos_alta_lesividad: 'Reiteradas balaceras con heridos de arma de fuego (HAF), usurpaciones violentas para búnkers y tiroteos en ochava Zazpe y Zavalla.',
    activa: true
  },
  {
    id: 'banda-los-de-siempre',
    nombre: 'Los de Siempre',
    barrio_base: 'Centenario / Fonavi San Jerónimo',
    color_hex: '#0EA5E9',
    actividad_principal: 'Sicariato, extorsión armada a comercios y narcotráfico organizado',
    descripcion: 'Histórica facción criminal dirigida por el clan Leiva ("Nano" Leiva, Juan Abel Leiva). Cuenta con tiradores armados con pistolas 9mm y calibres mayores. Control de monoblocks en barrio Centenario.',
    nivel_amenaza: 10,
    cabecilla_principal: 'Oscar Orlando Leiva ("Nano" - Liderazgo penitenciario) y Juan Abel Leiva',
    zonas_operacion: ['Centenario', 'Fonavi San Jerónimo', 'Varadero Sarsotti', 'San Lorenzo'],
    rivales: ['La Negrada'],
    delitos_alta_lesividad: 'Ataques sistemáticos con armas automáticas sobre fachadas, homicidios en ajuste de cuentas y enfrentamientos territoriales.',
    activa: true
  },
  {
    id: 'banda-polaco-maidana',
    nombre: 'Banda del Polaco Maidana',
    barrio_base: 'Santa Fe Norte / Castañaduy / Recreo',
    color_hex: '#8B5CF6',
    actividad_principal: 'Distribución mayorista de cocaína, vehículos gemelos y acopio balístico',
    descripcion: 'Estructura con conexiones interjurisdiccionales Santa Fe-Rosario operada por Esteban Darío Maidana y Salvador Mendoza. Utilización de vehículos adulterados para distribución rápida.',
    nivel_amenaza: 8,
    cabecilla_principal: 'Esteban Darío Maidana ("Polaco Maidana" - Pedido de Captura)',
    zonas_operacion: ['Castañaduy', 'Santa Fe Norte', 'Recreo', 'Las Flores'],
    rivales: ['Facciones independientes zona norte'],
    delitos_alta_lesividad: 'Abuso de armas de guerra, intimidaciones con disparos a deudores y encubrimiento de vehículos con pedido de secuestro.',
    activa: true
  },
  {
    id: 'banda-puchingas',
    nombre: 'Los Puchingas',
    barrio_base: 'Yapeyú / San Agustín',
    color_hex: '#F59E0B',
    actividad_principal: 'Puntos de venta de pasta base, soldaditos armados y enfrentamientos de pasillo',
    descripcion: 'Grupo armado territorial asentado en los pasillos de Yapeyú y San Agustín. Utilizan campanas con handies y menores armados para custodia de búnkers.',
    nivel_amenaza: 8,
    cabecilla_principal: 'Isaias Benítez ("Puchinga" - Pedido de Captura)',
    zonas_operacion: ['Yapeyú', 'San Agustín', 'Loyola', 'Ceferino Namuncurá'],
    rivales: ['Los Chingos'],
    delitos_alta_lesividad: 'Enfrentamientos armados en esquinas, homicidios en pasajes peatonales y heridos por balaceras directas.',
    activa: true
  },
  {
    id: 'banda-correntino',
    nombre: 'Banda del Correntino (Beban)',
    barrio_base: 'Barranquitas / Mayoraz',
    color_hex: '#10B981',
    actividad_principal: 'Fraccionamiento de estupefacientes, robos calificados y acopio de armas',
    descripcion: 'Clan integrado por Cristian Ismael Beban, Claudia Pedriel, la familia Alviso y el "Aceitero" Leguizamon. Depósito y distribución en el eje oeste-noroeste.',
    nivel_amenaza: 8,
    cabecilla_principal: 'Cristian Ismael Beban (Pedido de Captura)',
    zonas_operacion: ['Barranquitas', 'Mayoraz', 'Pavón', 'San Pantaleón'],
    rivales: ['Bandas ribereñas del Salado'],
    delitos_alta_lesividad: 'Asaltos a mano armada, agresiones con armas de fuego para blindar casas de acopio.',
    activa: true
  },
  {
    id: 'banda-espinillos',
    nombre: 'Los Espinillos',
    barrio_base: 'Alto Verde / Zona Costera',
    color_hex: '#EC4899',
    actividad_principal: 'Tránsito fluvial de cargamentos, búnkers insulares y piratería ribereña',
    descripcion: 'Organización radicada en las defensas y terraplenes de Alto Verde. Emplea canoas a motor para transportar material ilícito evitando retenes terrestres.',
    nivel_amenaza: 7,
    cabecilla_principal: 'Estructura descentralizada costera',
    zonas_operacion: ['Alto Verde', 'La Guardia', 'El Pozo', 'Bajada Distéfano'],
    rivales: ['Bandas de El Pozo'],
    delitos_alta_lesividad: 'Tiroteos con armas largas en barrancas ribereñas, agresiones agravadas por el uso de armas de fuego.',
    activa: true
  }
];

// 3. PERSONAS DE INTERÉS (Dossiers + Insumos)
const PERSONAS = [
  // --- CABECILLAS Y LÍDERES CLAVE CON PEDIDO DE CAPTURA ---
  {
    id: 'p-zabala-jon',
    nombre: 'Jon Nelson',
    apellido: 'Zabala',
    alias: ['Jon', 'Zabala'],
    dni: '38991204',
    sexo: 'M',
    fecha_nacimiento: '1994-06-18',
    roles: ['cabecilla', 'organizador', 'financista'],
    score_peligrosidad: 10,
    banda_id: 'banda-la-negrada',
    banda_nombre: 'La Negrada',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA NACIONAL E INTERNACIONAL',
    cuij_asociados: ['21-09744817-2', '21-09745475-9'],
    domicilio_principal: 'San Lorenzo / Pasaje Zazpe 1700, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7289 -31.6582)',
    delitos_asociados: ['Homicidio calificado', 'Comercialización agravada de estupefacientes', 'Asociación ilícita', 'Abuso de armas'],
    antecedentes_texto: 'Líder de "La Negrada". Órdenes directas de tiroteos contra Los de Siempre. Múltiples allanamientos con resultado positivo de municiones.',
    activo: true
  },
  {
    id: 'p-maidana-esteban',
    nombre: 'Esteban Darío',
    apellido: 'Maidana',
    alias: ['Polaco Maidana', 'Polaco'],
    dni: '37812940',
    sexo: 'M',
    fecha_nacimiento: '1993-02-14',
    roles: ['cabecilla', 'distribuidor mayorista', 'acopiador'],
    score_peligrosidad: 9,
    banda_id: 'banda-polaco-maidana',
    banda_nombre: 'Banda del Polaco Maidana',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA ACTIVO',
    cuij_asociados: ['21-08338285-3', '21-09319473-7'],
    domicilio_principal: 'Castañaduy 6807, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7250 -31.5900)',
    delitos_asociados: ['Comercialización de estupefacientes', 'Tenencia ilegal de arma de guerra', 'Encubrimiento agravado'],
    antecedentes_texto: 'Conexión logística Rosario-Santa Fe. Flota de vehículos gemelos (Peugeot 206 gris DYH883). Prófugo desde allanamiento en Recreo.',
    activo: true
  },
  {
    id: 'p-beban-cristian',
    nombre: 'Cristian Ismael',
    apellido: 'Beban',
    alias: ['El Correntino', 'Beban'],
    dni: '36627096',
    sexo: 'M',
    fecha_nacimiento: '1992-09-03',
    roles: ['cabecilla', 'acopiador', 'organizador'],
    score_peligrosidad: 9,
    banda_id: 'banda-correntino',
    banda_nombre: 'Banda del Correntino (Beban)',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA ACTIVO',
    cuij_asociados: ['21-09551234-8'],
    domicilio_principal: 'José Cibils 3336, Barranquitas, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7180 -31.6320)',
    delitos_asociados: ['Comercialización de estupefacientes', 'Robo calificado', 'Asociación ilícita'],
    antecedentes_texto: 'Cabecilla de la red del oeste. Centro de distribución en Barranquitas y depósitos en Pavón y República de Chile.',
    activo: true
  },
  {
    id: 'p-leiva-oscar',
    nombre: 'Oscar Orlando',
    apellido: 'Leiva',
    alias: ['Nano Leiva', 'Nano'],
    dni: '32190845',
    sexo: 'M',
    fecha_nacimiento: '1986-11-05',
    roles: ['cabecilla', 'jefe de facción', 'organizador'],
    score_peligrosidad: 10,
    banda_id: 'banda-los-de-siempre',
    banda_nombre: 'Los de Siempre',
    pedido_captura: false,
    estado_judicial: 'PRISIÓN EFECTIVA / LIDERAZGO PENITENCIARIO',
    cuij_asociados: ['21-09726972-3', '21-09123841-0'],
    domicilio_principal: 'Fonavi San Jerónimo, Manzana 11, Centenario, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7200 -31.6680)',
    delitos_asociados: ['Homicidio calificado', 'Extorsión coactiva', 'Asociación ilícita', 'Tenencia de armas de guerra'],
    antecedentes_texto: 'Líder indiscutido de Los de Siempre. Maneja la estructura desde prisión mediante teléfonos celulares y visitas familiares.',
    activo: true
  },
  {
    id: 'p-leiva-juan-abel',
    nombre: 'Juan Abel',
    apellido: 'Leiva',
    alias: ['Abelito', 'Juancho'],
    dni: '35490214',
    sexo: 'M',
    roles: ['segundo jefe', 'organizador armado', 'tirador'],
    score_peligrosidad: 9,
    banda_id: 'banda-los-de-siempre',
    banda_nombre: 'Los de Siempre',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA ACTIVO',
    cuij_asociados: ['21-09726972-3'],
    domicilio_principal: 'Centenario, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7215 -31.6670)',
    delitos_asociados: ['Tentativa de homicidio', 'Abuso de armas', 'Extorsiones'],
    antecedentes_texto: 'Hermano y brazo ejecutor de Nano Leiva en las calles. Comanda operativos de intimidación armada.',
    activo: true
  },
  {
    id: 'p-benitez-isaias',
    nombre: 'Isaias',
    apellido: 'Benítez',
    alias: ['Puchinga', 'Isa'],
    dni: '41982345',
    sexo: 'M',
    roles: ['cabecilla', 'tirador', 'distribuidor'],
    score_peligrosidad: 9,
    banda_id: 'banda-puchingas',
    banda_nombre: 'Los Puchingas',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA ACTIVO',
    cuij_asociados: ['21-09693542-8'],
    domicilio_principal: 'Diagonal Abipones y Neuquén, Yapeyú, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7435 -31.5667)',
    delitos_asociados: ['Homicidio en riña', 'Abuso de armas de fuego', 'Microtráfico agravado'],
    antecedentes_texto: 'Líder del grupo armado en Yapeyú. Investigado por el MPA en legajo 21-09693542-8 por enfrentamiento a tiros en vía pública.',
    activo: true
  },
  {
    id: 'p-sosa-marcelo',
    nombre: 'Marcelo Alejandro',
    apellido: 'Sosa',
    alias: ['El Tuerto', 'Chelo Sosa'],
    dni: '40644753',
    sexo: 'M',
    roles: ['lugarteniente', 'distribuidor', 'custodio armado'],
    score_peligrosidad: 8,
    banda_id: 'banda-la-negrada',
    banda_nombre: 'La Negrada',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA ACTIVO',
    cuij_asociados: ['21-09744817-2'],
    domicilio_principal: 'Liberación y Estrada, San Lorenzo, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7305 -31.6512)',
    delitos_asociados: ['Microtráfico', 'Abuso de armas', 'Lesiones graves por HAF'],
    antecedentes_texto: 'Mano derecha de Jon Zabala en San Lorenzo. Registrado en el sistema de violencia armada HAF como blanco de ataque y tirador.',
    activo: true
  },
  {
    id: 'p-doello-juan',
    nombre: 'Juan Manuel',
    apellido: 'Doello',
    alias: ['Polaco Doello', 'Juancito'],
    dni: '39369578',
    sexo: 'M',
    roles: ['financista', 'acopiador', 'distribuidor'],
    score_peligrosidad: 8,
    banda_id: 'banda-la-negrada',
    banda_nombre: 'La Negrada',
    pedido_captura: false,
    estado_judicial: 'PRISIÓN PREVENTIVA CONFIRMADA',
    cuij_asociados: ['21-09319473-7'],
    domicilio_principal: 'Urquiza 4250, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7088 -31.6285)',
    delitos_asociados: ['Comercialización de estupefacientes agravada', 'Asociación ilícita'],
    antecedentes_texto: 'Imputado con prisión preventiva en causa CUIJ 21-09319473-7. Vínculo financiero y logístico de acopio.',
    activo: true
  },
  // --- INTEGRANTES LA NEGRADA ---
  {
    id: 'p-giovanniello-emilce',
    nombre: 'Emilce',
    apellido: 'Giovanniello',
    alias: ['La Madre de Jon'],
    dni: '21903482',
    sexo: 'F',
    roles: ['resguardo financiero', 'logística familiar'],
    score_peligrosidad: 6,
    banda_id: 'banda-la-negrada',
    banda_nombre: 'La Negrada',
    pedido_captura: false,
    estado_judicial: 'INVESTIGADA / INHIBICIÓN DE BIENES',
    cuij_asociados: ['21-09744817-2'],
    domicilio_principal: 'San Lorenzo, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7300 -31.6520)',
    delitos_asociados: ['Lavado de activos', 'Encubrimiento'],
    antecedentes_texto: 'Madre de Jon Zabala. Titular de propiedades y vehículos utilizados por la estructura.',
    activo: true
  },
  {
    id: 'p-giovanniello-marcelo',
    nombre: 'Marcelo Nicolás',
    apellido: 'Giovanniello',
    alias: ['Nico'],
    dni: '43890124',
    sexo: 'M',
    roles: ['acopiador', 'distribuidor'],
    score_peligrosidad: 7,
    banda_id: 'banda-la-negrada',
    banda_nombre: 'La Negrada',
    pedido_captura: false,
    estado_judicial: 'IMPUTADO CON MEDIDAS ALTERNATIVAS',
    cuij_asociados: ['21-09744817-2'],
    domicilio_principal: 'San Lorenzo, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7310 -31.6530)',
    delitos_asociados: ['Microtráfico', 'Tenencia de arma civil'],
    antecedentes_texto: 'Hermano por vía materna de Jon Zabala. Operador de puntos de acopio en San Lorenzo.',
    activo: true
  },
  {
    id: 'p-carnaghi-lautaro',
    nombre: 'Lautaro Fabián',
    apellido: 'Carnaghi',
    alias: ['Toro'],
    dni: '42390184',
    sexo: 'M',
    roles: ['tirador', 'sicario', 'seguridad armada'],
    score_peligrosidad: 8,
    banda_id: 'banda-la-negrada',
    banda_nombre: 'La Negrada',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA ACTIVO',
    cuij_asociados: ['21-09744817-2'],
    domicilio_principal: 'Chalet, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7260 -31.6600)',
    delitos_asociados: ['Tentativa de homicidio', 'Abuso de armas', 'Lesiones graves'],
    antecedentes_texto: 'Tirador de La Negrada. Identificado en tiroteos contra Los de Siempre en Centenario.',
    activo: true
  },
  {
    id: 'p-aguilar-diego',
    nombre: 'Diego Francisco',
    apellido: 'Aguilar',
    alias: ['Dieguito'],
    dni: '38190342',
    sexo: 'M',
    roles: ['chofer', 'soldado', 'campana'],
    score_peligrosidad: 7,
    banda_id: 'banda-la-negrada',
    banda_nombre: 'La Negrada',
    pedido_captura: false,
    estado_judicial: 'IMPUTADO',
    cuij_asociados: ['21-09744817-2'],
    domicilio_principal: 'San Lorenzo, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7320 -31.6540)',
    delitos_asociados: ['Encubrimiento', 'Microtráfico'],
    antecedentes_texto: 'Moviliza motocicletas de apoyo y vigila esquinas durante las transacciones.',
    activo: true
  },
  {
    id: 'p-filippa-walter',
    nombre: 'Walter Nicolás',
    apellido: 'Filippa',
    alias: ['Nico Filippa'],
    dni: '41098234',
    sexo: 'M',
    roles: ['soldado', 'dealer'],
    score_peligrosidad: 6,
    banda_id: 'banda-la-negrada',
    banda_nombre: 'La Negrada',
    pedido_captura: false,
    estado_judicial: 'INVESTIGADO',
    cuij_asociados: ['21-09744817-2'],
    domicilio_principal: 'Santa Rosa de Lima, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7330 -31.6440)',
    delitos_asociados: ['Microtráfico'],
    antecedentes_texto: 'Punto de venta satélite en Santa Rosa de Lima.',
    activo: true
  },
  // --- INTEGRANTES LOS DE SIEMPRE ---
  {
    id: 'p-celer-walter',
    nombre: 'Walter Damián',
    apellido: 'Celer',
    alias: ['Dami'],
    dni: '34890123',
    sexo: 'M',
    roles: ['lugarteniente', 'logística armada', 'organizador'],
    score_peligrosidad: 8,
    banda_id: 'banda-los-de-siempre',
    banda_nombre: 'Los de Siempre',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA ACTIVO',
    cuij_asociados: ['21-09726972-3'],
    domicilio_principal: 'Centenario, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7220 -31.6660)',
    delitos_asociados: ['Abuso de armas de guerra', 'Extorsión', 'Asociación ilícita'],
    antecedentes_texto: 'Encargado del parque balístico de Los de Siempre. Coordina el alquiler y custodia de armamento.',
    activo: true
  },
  {
    id: 'p-celer-matias',
    nombre: 'Matías Damián',
    apellido: 'Celer',
    alias: ['Mati Celer'],
    dni: '43109234',
    sexo: 'M',
    roles: ['tirador', 'soldado'],
    score_peligrosidad: 8,
    banda_id: 'banda-los-de-siempre',
    banda_nombre: 'Los de Siempre',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA ACTIVO',
    cuij_asociados: ['21-09726972-3'],
    domicilio_principal: 'Centenario / Fonavi, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7230 -31.6670)',
    delitos_asociados: ['Tentativa de homicidio', 'Abuso de armas calificado'],
    antecedentes_texto: 'Implicado en múltiples balaceras en pasajes de Centenario contra miembros de La Negrada.',
    activo: true
  },
  {
    id: 'p-leiva-brian',
    nombre: 'Brian',
    apellido: 'Leiva',
    alias: ['Brian Leiva'],
    dni: '40912384',
    sexo: 'M',
    roles: ['tirador', 'sicario'],
    score_peligrosidad: 8,
    banda_id: 'banda-los-de-siempre',
    banda_nombre: 'Los de Siempre',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA ACTIVO',
    cuij_asociados: ['21-09726972-3'],
    domicilio_principal: 'Centenario, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7205 -31.6690)',
    delitos_asociados: ['Homicidio calificado en grado de tentativa', 'Portación de arma de guerra'],
    antecedentes_texto: 'Sobrino de Nano Leiva. Ejecutor armado en ataques contra bocas de expendio rivales.',
    activo: true
  },
  {
    id: 'p-passarello-jesica',
    nombre: 'Jésica Haydee',
    apellido: 'Passarello',
    alias: ['Jesi'],
    dni: '36901234',
    sexo: 'F',
    roles: ['administradora', 'recaudadora', 'pareja'],
    score_peligrosidad: 6,
    banda_id: 'banda-los-de-siempre',
    banda_nombre: 'Los de Siempre',
    pedido_captura: false,
    estado_judicial: 'IMPUTADA - PRISIÓN DOMICILIARIA',
    cuij_asociados: ['21-09726972-3'],
    domicilio_principal: 'Fonavi San Jerónimo, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7190 -31.6685)',
    delitos_asociados: ['Comercialización de estupefacientes', 'Lavado de dinero'],
    antecedentes_texto: 'Pareja de integrante de la cúpula de Los de Siempre. Recauda dinero de billeteras electrónicas.',
    activo: true
  },
  // --- INTEGRANTES POLACO MAIDANA ---
  {
    id: 'p-mendoza-salvador',
    nombre: 'Salvador Ariel',
    apellido: 'Mendoza',
    alias: ['Salva', 'Gordo Mendoza'],
    dni: '36109234',
    sexo: 'M',
    roles: ['transportista', 'lugarteniente'],
    score_peligrosidad: 7,
    banda_id: 'banda-polaco-maidana',
    banda_nombre: 'Banda del Polaco Maidana',
    pedido_captura: false,
    estado_judicial: 'PRISIÓN PREVENTIVA',
    cuij_asociados: ['21-08338285-3'],
    domicilio_principal: 'Recreo / Castañaduy, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7300 -31.5400)',
    delitos_asociados: ['Transporte de estupefacientes', 'Adulteración de numeración de objetos registrables'],
    antecedentes_texto: 'Chofer principal de la banda. Detenido con ladrillo compacto de cocaína en baúl de automóvil.',
    activo: true
  },
  // --- INTEGRANTES BANDA DEL CORRENTINO (BEBAN) ---
  {
    id: 'p-pedriel-claudia',
    nombre: 'Claudia Josefina',
    apellido: 'Pedriel',
    alias: ['Claudia'],
    dni: '39370316',
    sexo: 'F',
    roles: ['custodia de acopio', 'recaudadora'],
    score_peligrosidad: 6,
    banda_id: 'banda-correntino',
    banda_nombre: 'Banda del Correntino (Beban)',
    pedido_captura: false,
    estado_judicial: 'IMPUTADA',
    cuij_asociados: ['21-09551234-8'],
    domicilio_principal: 'José Cibils 3336, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7180 -31.6320)',
    delitos_asociados: ['Microtráfico', 'Tenencia de estupefacientes con fines de comercialización'],
    antecedentes_texto: 'Pareja y mano derecha de Cristian Beban en la administración del búnker principal.',
    activo: true
  },
  {
    id: 'p-alviso-walter',
    nombre: 'Walter Ángel Uriel',
    apellido: 'Alviso',
    alias: ['Wally'],
    dni: '45488582',
    sexo: 'M',
    roles: ['soldado', 'distribuidor'],
    score_peligrosidad: 7,
    banda_id: 'banda-correntino',
    banda_nombre: 'Banda del Correntino (Beban)',
    pedido_captura: false,
    estado_judicial: 'IMPUTADO',
    cuij_asociados: ['21-09551234-8'],
    domicilio_principal: 'República de Chile 2954, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7150 -31.6340)',
    delitos_asociados: ['Microtráfico', 'Abuso de armas'],
    antecedentes_texto: 'Distribución callejera en motovehículo por barrio Barranquitas.',
    activo: true
  },
  {
    id: 'p-leguizamon-felipe',
    nombre: 'Felipe Dardo',
    apellido: 'Leguizamón',
    alias: ['El Aceitero'],
    dni: '18341032',
    sexo: 'M',
    roles: ['socio de acopio', 'financista'],
    score_peligrosidad: 8,
    banda_id: 'banda-correntino',
    banda_nombre: 'Banda del Correntino (Beban)',
    pedido_captura: true,
    estado_judicial: 'PRÓFUGO - PEDIDO DE CAPTURA ACTIVO',
    cuij_asociados: ['21-09551234-8'],
    domicilio_principal: 'Pavón 1431, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7120 -31.6250)',
    delitos_asociados: ['Comercialización agravada de estupefacientes', 'Tenencia de arma de guerra'],
    antecedentes_texto: 'Veterano con amplio prontuario en el negocio del narcotráfico. Aprovisiona a la banda de Beban.',
    activo: true
  }
];

// 4. Extraer imputados adicionales de 'insumo para informe.xlsx'
const insumoPath = path.join(baseDir, 'insumo para informe.xlsx');
if (fs.existsSync(insumoPath)) {
  const wb = XLSX.readFile(insumoPath);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log(`Procesando ${rows.length} registros judiciales de insumo para personas...`);

  let addedInsumo = 0;
  rows.forEach((r, idx) => {
    if (!r.imputados || r.imputados.includes('NN') || r.imputados.trim() === '') return;
    const parts = r.imputados.split('//');
    parts.forEach((part, pIdx) => {
      const clean = part.replace(/\[CON_IMP\]|\[SIN_IMP\]/g, '').trim();
      if (!clean || clean.length < 4 || clean.toLowerCase().includes('nn')) return;

      const dniMatch = clean.match(/\(?(?:DNI\s*)?(\d{7,8})\)?/i);
      const dni = dniMatch ? dniMatch[1] : null;
      let rawName = clean.replace(/\(?(?:DNI\s*)?(\d{7,8})\)?/gi, '').replace(/\(NO_INFORMA\s*\)/gi, '').trim();
      rawName = rawName.replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim();

      if (rawName.length < 3) return;

      // Check if already in PERSONAS
      const exists = PERSONAS.some(p => (dni && p.dni === dni) || p.nombre?.toLowerCase() === rawName.toLowerCase());
      if (exists) return;

      const nameTokens = rawName.split(' ');
      const apellido = nameTokens.slice(0, Math.ceil(nameTokens.length / 2)).join(' ');
      const nombre = nameTokens.slice(Math.ceil(nameTokens.length / 2)).join(' ') || apellido;

      const cuijStr = r.cuij ? String(r.cuij) : '';
      const tienePreventiva = r.tienePreventivas === 'Sí';
      const tieneArmas = r.tiene_armas_secuestradas === 'Sí';

      PERSONAS.push({
        id: `p-insumo-${idx}-${pIdx}`,
        nombre: nombre.toUpperCase(),
        apellido: apellido.toUpperCase(),
        alias: [clean.includes('UN TAL') ? clean.match(/UN TAL\s+(\w+)/i)?.[1] || 'Sospechoso' : 'Investigado'],
        dni: dni || `S/D-${idx}`,
        sexo: 'M',
        roles: tieneArmas ? ['imputado armado', 'investigado'] : ['imputado', 'investigado'],
        score_peligrosidad: tieneArmas ? 7 : tienePreventiva ? 6 : 5,
        banda_id: null,
        banda_nombre: r.dependencia_policial?.includes('SAN LORENZO') ? 'Facciones Sudoeste' : 'Investigación Individual',
        pedido_captura: tienePreventiva && !clean.includes('DETENIDO'),
        estado_judicial: tienePreventiva ? 'PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN' : 'IMPUTADO EN CAUSA',
        cuij_asociados: cuijStr ? [cuijStr] : [],
        domicilio_principal: r.domicilios_imputados || r.domicilios || `${r.localidad || 'Santa Fe'}`,
        domicilio_principal_geom: null,
        delitos_asociados: [r.calificaciones || 'Ley 23.737 Microtráfico'],
        antecedentes_texto: `Causa CUIJ ${cuijStr} radicada en ${r.dependencia_policial || 'MPA Regional 1'}. Fiscal: ${r.fiscales || 'MPA'}.`,
        activo: true
      });
      addedInsumo++;
    });
  });
  console.log(`✓ Añadidos ${addedInsumo} imputados desde planilla judicial.`);
}

console.log(`Total Personas Compiladas: ${PERSONAS.length}`);

// 5. VÍNCULOS Y RED RELACIONAL CRIMINAL (Grafo)
const VINCULOS = [
  // --- RIVALIDADES ARMADAS / DISPUTAS TERRITORIALES (GANG WARS) ---
  {
    id: 'v-disputa-1',
    persona_origen_id: 'p-zabala-jon',
    persona_destino_id: 'p-leiva-oscar',
    tipo_relacion: 'DISPUTA_ARMADA',
    origen_nombre: 'Jon Nelson Zabala (La Negrada)',
    destino_nombre: 'Oscar "Nano" Leiva (Los de Siempre)',
    certeza: 'CONFIRMADO',
    tipo: 'DISPUTA_ARMADA',
    origen_informacion: 'Informes de Inteligencia PDI y MPA - Guerra territorial San Lorenzo vs Centenario'
  },
  {
    id: 'v-disputa-2',
    persona_origen_id: 'p-sosa-marcelo',
    persona_destino_id: 'p-celer-matias',
    tipo_relacion: 'TIROTEO_CRUZADO',
    origen_nombre: 'Marcelo Sosa (La Negrada)',
    destino_nombre: 'Matías Celer (Los de Siempre)',
    certeza: 'CONFIRMADO',
    tipo: 'TIROTEO_CRUZADO',
    origen_informacion: 'Registro HAF 2025 - Enfrentamiento armado con heridos en Liberación y Estrada'
  },
  {
    id: 'v-disputa-3',
    persona_origen_id: 'p-carnaghi-lautaro',
    persona_destino_id: 'p-leiva-brian',
    tipo_relacion: 'RIVAL_DIRECTO',
    origen_nombre: 'Lautaro Carnaghi (La Negrada)',
    destino_nombre: 'Brian Leiva (Los de Siempre)',
    certeza: 'CONFIRMADO',
    tipo: 'RIVAL_DIRECTO',
    origen_informacion: 'Causa CUIJ 21-09726972-3 - Ataque a balazos a domicilio'
  },
  {
    id: 'v-disputa-4',
    persona_origen_id: 'p-benitez-isaias',
    persona_destino_id: 'p-maidana-esteban',
    tipo_relacion: 'DISPUTA_ZONA_NORTE',
    origen_nombre: 'Isaias Benítez (Los Puchingas)',
    destino_nombre: 'Esteban Maidana (Polaco Maidana)',
    certeza: 'INVESTIGADO',
    tipo: 'DISPUTA_ZONA_NORTE',
    origen_informacion: 'Causa CUIJ 21-09693542-8 - Pugna por bocas de expendio en Yapeyú'
  },

  // --- SUBORDINACIÓN Y JERARQUÍA EN LA NEGRADA ---
  {
    id: 'v-negrada-1',
    persona_origen_id: 'p-zabala-jon',
    persona_destino_id: 'p-sosa-marcelo',
    tipo_relacion: 'SUBORDINADO_A',
    origen_nombre: 'Jon Nelson Zabala',
    destino_nombre: 'Marcelo Sosa',
    certeza: 'CONFIRMADO',
    tipo: 'SUBORDINADO_A',
    origen_informacion: 'CUIJ 21-09744817-2 - Escuchas y tareas de campo PDI'
  },
  {
    id: 'v-negrada-2',
    persona_origen_id: 'p-zabala-jon',
    persona_destino_id: 'p-carnaghi-lautaro',
    tipo_relacion: 'SICARIO_DE',
    origen_nombre: 'Jon Nelson Zabala',
    destino_nombre: 'Lautaro Carnaghi',
    certeza: 'CONFIRMADO',
    tipo: 'SICARIO_DE',
    origen_informacion: 'Intervenciones telefónicas judiciales'
  },
  {
    id: 'v-negrada-3',
    persona_origen_id: 'p-zabala-jon',
    persona_destino_id: 'p-giovanniello-marcelo',
    tipo_relacion: 'ACOPIADOR_DE',
    origen_nombre: 'Jon Nelson Zabala',
    destino_nombre: 'Marcelo Giovanniello',
    certeza: 'CONFIRMADO',
    tipo: 'ACOPIADOR_DE',
    origen_informacion: 'Acta de allanamiento pasaje Zazpe'
  },
  {
    id: 'v-negrada-4',
    persona_origen_id: 'p-zabala-jon',
    persona_destino_id: 'p-aguilar-diego',
    tipo_relacion: 'LOGISTICA_MOTOVEHICULOS',
    origen_nombre: 'Jon Nelson Zabala',
    destino_nombre: 'Diego Aguilar',
    certeza: 'CONFIRMADO',
    tipo: 'LOGISTICA_MOTOVEHICULOS',
    origen_informacion: 'Secuestro de motovehículos con pedido de captura'
  },
  {
    id: 'v-negrada-5',
    persona_origen_id: 'p-zabala-jon',
    persona_destino_id: 'p-giovanniello-emilce',
    tipo_relacion: 'FAMILIAR_MADRE',
    origen_nombre: 'Jon Nelson Zabala',
    destino_nombre: 'Emilce Giovanniello',
    certeza: 'CONFIRMADO',
    tipo: 'FAMILIAR_MADRE',
    origen_informacion: 'Registro Civil y patrimonial'
  },
  {
    id: 'v-negrada-6',
    persona_origen_id: 'p-sosa-marcelo',
    persona_destino_id: 'p-filippa-walter',
    tipo_relacion: 'DEALER_SUBORDINADO',
    origen_nombre: 'Marcelo Sosa',
    destino_nombre: 'Walter Filippa',
    certeza: 'CONFIRMADO',
    tipo: 'DEALER_SUBORDINADO',
    origen_informacion: 'Filmaciones encubiertas en boca de expendio'
  },
  {
    id: 'v-negrada-7',
    persona_origen_id: 'p-doello-juan',
    persona_destino_id: 'p-zabala-jon',
    tipo_relacion: 'FINANCISTA_PROVEEDOR',
    origen_nombre: 'Juan Manuel Doello',
    destino_nombre: 'Jon Nelson Zabala',
    certeza: 'CONFIRMADO',
    tipo: 'FINANCISTA_PROVEEDOR',
    origen_informacion: 'Causa CUIJ 21-09319473-7 - Billeteras virtuales cruzadas'
  },

  // --- SUBORDINACIÓN Y JERARQUÍA EN LOS DE SIEMPRE ---
  {
    id: 'v-siempre-1',
    persona_origen_id: 'p-leiva-oscar',
    persona_destino_id: 'p-leiva-juan-abel',
    tipo_relacion: 'SEGUNDO_AL_MANDO',
    origen_nombre: 'Oscar "Nano" Leiva',
    destino_nombre: 'Juan Abel Leiva',
    certeza: 'CONFIRMADO',
    tipo: 'SEGUNDO_AL_MANDO',
    origen_informacion: 'Comunicaciones carcelarias monitoreadas'
  },
  {
    id: 'v-siempre-2',
    persona_origen_id: 'p-leiva-oscar',
    persona_destino_id: 'p-celer-walter',
    tipo_relacion: 'ARMERO_LOGISTICO',
    origen_nombre: 'Oscar "Nano" Leiva',
    destino_nombre: 'Walter Damián Celer',
    certeza: 'CONFIRMADO',
    tipo: 'ARMERO_LOGISTICO',
    origen_informacion: 'Causa 21-09726972-3 - Armas 9mm incautadas'
  },
  {
    id: 'v-siempre-3',
    persona_origen_id: 'p-leiva-juan-abel',
    persona_destino_id: 'p-leiva-brian',
    tipo_relacion: 'SICARIO_DEALER',
    origen_nombre: 'Juan Abel Leiva',
    destino_nombre: 'Brian Leiva',
    certeza: 'CONFIRMADO',
    tipo: 'SICARIO_DEALER',
    origen_informacion: 'Actuaciones policiales en Fonavi Centenario'
  },
  {
    id: 'v-siempre-4',
    persona_origen_id: 'p-celer-walter',
    persona_destino_id: 'p-celer-matias',
    tipo_relacion: 'FAMILIAR_HERMANO',
    origen_nombre: 'Walter Damián Celer',
    destino_nombre: 'Matías Damián Celer',
    certeza: 'CONFIRMADO',
    tipo: 'FAMILIAR_HERMANO',
    origen_informacion: 'Registro Civil'
  },
  {
    id: 'v-siempre-5',
    persona_origen_id: 'p-leiva-oscar',
    persona_destino_id: 'p-passarello-jesica',
    tipo_relacion: 'RECAUDADORA_CONYUGE',
    origen_nombre: 'Oscar "Nano" Leiva',
    destino_nombre: 'Jésica Passarello',
    certeza: 'CONFIRMADO',
    tipo: 'RECAUDADORA_CONYUGE',
    origen_informacion: 'Causa Lavado de Activos MPA'
  },

  // --- SUBORDINACIÓN EN BANDA POLACO MAIDANA ---
  {
    id: 'v-maidana-1',
    persona_origen_id: 'p-maidana-esteban',
    persona_destino_id: 'p-mendoza-salvador',
    tipo_relacion: 'CHOFER_TRANSPORTE',
    origen_nombre: 'Esteban Darío Maidana',
    destino_nombre: 'Salvador Ariel Mendoza',
    certeza: 'CONFIRMADO',
    tipo: 'CHOFER_TRANSPORTE',
    origen_informacion: 'Causa CUIJ 21-08338285-3 - Traslados Santa Fe - Rosario'
  },

  // --- SUBORDINACIÓN EN BANDA DEL CORRENTINO ---
  {
    id: 'v-correntino-1',
    persona_origen_id: 'p-beban-cristian',
    persona_destino_id: 'p-pedriel-claudia',
    tipo_relacion: 'PAREJA_ADMINISTRACION',
    origen_nombre: 'Cristian Ismael Beban',
    destino_nombre: 'Claudia Josefina Pedriel',
    certeza: 'CONFIRMADO',
    tipo: 'PAREJA_ADMINISTRACION',
    origen_informacion: 'Planilla Dossier Barranquitas'
  },
  {
    id: 'v-correntino-2',
    persona_origen_id: 'p-beban-cristian',
    persona_destino_id: 'p-alviso-walter',
    tipo_relacion: 'VENDEDOR_PUNTERO',
    origen_nombre: 'Cristian Ismael Beban',
    destino_nombre: 'Walter Ángel Alviso',
    certeza: 'CONFIRMADO',
    tipo: 'VENDEDOR_PUNTERO',
    origen_informacion: 'CUIJ 21-09551234-8 - República de Chile 2954'
  },
  {
    id: 'v-correntino-3',
    persona_origen_id: 'p-beban-cristian',
    persona_destino_id: 'p-leguizamon-felipe',
    tipo_relacion: 'SOCIO_PROVEEDOR',
    origen_nombre: 'Cristian Ismael Beban',
    destino_nombre: 'Felipe Dardo Leguizamón',
    certeza: 'CONFIRMADO',
    tipo: 'SOCIO_PROVEEDOR',
    origen_informacion: 'Dossier Aceitero Pavón 1431'
  }
];

// 6. ALLANAMIENTOS OPERATIVOS REALES
const ALLANAMIENTOS = [
  {
    id: 'allanamiento-zazpe',
    cuij: '21-09726972-3',
    requerimiento: 'R-062-26',
    fecha_operativo: '2026-02-18T06:30:00.000Z',
    direccion: 'Zavalla y Monseñor Zazpe (Ochava 1700)',
    barrio: 'San Lorenzo',
    localidad: 'Santa Fe',
    fuerza_interviniente: 'Policía de Investigaciones (PDI) y Tropas de Operaciones Especiales (TOE)',
    resultado: 'Positivo',
    juzgado_interviniente: 'Juez Penal Colegio de Jueces 1a Instancia Santa Fe',
    resultado_detalle: 'Secuestro de 1 pistola calibre 9mm Browning con numeración limada, 42 cartuchos intactos, 118 dosis de clorhidrato de cocaína, balanza de precisión y 4 teléfonos celulares.',
    resumen: 'Inmueble fortificado utilizado como búnker y puesto de guardia armada de La Negrada.',
    geom: 'SRID=4326;POINT(-60.7289 -31.6582)'
  },
  {
    id: 'allanamiento-liberacion',
    cuij: '21-09744817-2',
    requerimiento: 'R-060-26',
    fecha_operativo: '2026-01-24T07:15:00.000Z',
    direccion: 'Liberación y Estrada',
    barrio: 'San Lorenzo',
    localidad: 'Santa Fe',
    fuerza_interviniente: 'Prefectura Naval Argentina y PDI',
    resultado: 'Positivo',
    juzgado_interviniente: 'MPA Unidad Fiscal Especial de Microtráfico',
    resultado_detalle: 'Secuestro de 84 envoltorios de nylon con sustancia blanquecina (cocaína), $312.000 en efectivo y documentación de interés para individualizar a Sosa y Zabala.',
    resumen: 'Operativo simultáneo tras evento de heridos de arma de fuego (HAF).',
    geom: 'SRID=4326;POINT(-60.7305 -31.6512)'
  },
  {
    id: 'allanamiento-castanaduy',
    cuij: '21-08338285-3',
    requerimiento: 'R-047-25',
    fecha_operativo: '2025-11-12T06:00:00.000Z',
    direccion: 'Castañaduy 6807',
    barrio: 'Santa Fe Norte',
    localidad: 'Santa Fe',
    fuerza_interviniente: 'Gendarmería Nacional',
    resultado: 'Positivo',
    juzgado_interviniente: 'Juzgado Federal N° 2 Santa Fe',
    resultado_detalle: 'Secuestro de vehículo Peugeot 206 dominio DYH883 adulterado, 650 grs de marihuana compacta, documentación y handies con frecuencia policial.',
    resumen: 'Guardería vehicular y centro de despacho de la banda de Polaco Maidana.',
    geom: 'SRID=4326;POINT(-60.7250 -31.5900)'
  },
  {
    id: 'allanamiento-cibils',
    cuij: '21-09551234-8',
    requerimiento: 'R-012-25',
    fecha_operativo: '2025-10-05T07:00:00.000Z',
    direccion: 'José Cibils 3336',
    barrio: 'Barranquitas',
    localidad: 'Santa Fe',
    fuerza_interviniente: 'PDI Microtráfico',
    resultado: 'Positivo',
    juzgado_interviniente: 'MPA Fiscalía Regional 1',
    resultado_detalle: 'Secuestro de revólver calibre .38 con 5 cartuchos, 35 envoltorios de cocaína y balanza digital.',
    resumen: 'Finca perteneciente a Claudia Pedriel y Cristian Beban.',
    geom: 'SRID=4326;POINT(-60.7180 -31.6320)'
  }
];

// 7. HECHOS DELICTIVOS DE ALTA LESIVIDAD (Homicidios, HAF balaceras, tenencia de guerra)
const HECHOS = [
  {
    id: 'hecho-haf-1',
    tipo_penal: 'Abuso de armas y lesiones graves por HAF',
    fecha: '2026-02-15T22:45:00.000Z',
    franja_horaria: 'NOCHE',
    direccion: 'Liberación y Estrada',
    barrio: 'San Lorenzo',
    localidad: 'Santa Fe',
    cuij: '21-09744817-2',
    requerimiento: 'R-060-26',
    indice_lesividad: 9,
    geom: 'SRID=4326;POINT(-60.7305 -31.6512)',
    resumen: 'Tiroteo entre facciones en punto de venta de estupefacientes. Víctima Sosa Marcelo con herida de bala en miembro inferior. 18 vainas 9mm levantadas en el asfalto.',
    modus_operandi: 'Ataque con ráfagas cortas desde motovehículo en movimiento por parte de tiradores de Los de Siempre.',
    banda_implicada: 'La Negrada vs Los de Siempre'
  },
  {
    id: 'hecho-haf-2',
    tipo_penal: 'Homicidio doloso agravado',
    fecha: '2026-01-20T03:30:00.000Z',
    franja_horaria: 'MADRUGADA',
    direccion: 'Diagonal Abipones y Neuquén',
    barrio: 'Yapeyú',
    localidad: 'Santa Fe',
    cuij: '21-09693542-8',
    requerimiento: 'R-018-26',
    indice_lesividad: 10,
    geom: 'SRID=4326;POINT(-60.7435 -31.5667)',
    resumen: 'Homicidio con arma de fuego calibre 9mm en pasillo interno de Yapeyú. Ajuste de cuentas por control territorial de búnker.',
    modus_operandi: 'Tirador a pie sorprende a la víctima a escasa distancia y efectúa 4 disparos a la zona torácica.',
    banda_implicada: 'Los Puchingas'
  },
  {
    id: 'hecho-haf-3',
    tipo_penal: 'Abuso de armas y daño calificado',
    fecha: '2026-02-08T20:15:00.000Z',
    franja_horaria: 'NOCHE',
    direccion: 'Zavalla y Monseñor Zazpe 1700',
    barrio: 'San Lorenzo',
    localidad: 'Santa Fe',
    cuij: '21-09726972-3',
    requerimiento: 'R-062-26',
    indice_lesividad: 8,
    geom: 'SRID=4326;POINT(-60.7289 -31.6582)',
    resumen: 'Ataque armado contra vivienda lindante a la ochava. 14 impactos de bala en mampostería y portón metálico.',
    modus_operandi: 'Intimidación coactiva contra vecinos para desalojo y usurpación del inmueble para acopio.',
    banda_implicada: 'La Negrada'
  },
  {
    id: 'hecho-haf-4',
    tipo_penal: 'Comercialización de estupefacientes y tenencia de armas de guerra',
    fecha: '2026-01-10T18:00:00.000Z',
    franja_horaria: 'TARDE',
    direccion: 'Urquiza 4250',
    barrio: 'Barranquitas',
    localidad: 'Santa Fe',
    cuij: '21-09319473-7',
    indice_lesividad: 7,
    geom: 'SRID=4326;POINT(-60.7088 -31.6285)',
    resumen: 'Centro neurálgico de acopio y entrega mayorista. Secuestro de cocaína y balanzas.',
    modus_operandi: 'Distribución en vehículos particulares bajo apariencia de viajes de aplicación.',
    banda_implicada: 'Red Doello / Zabala'
  },
  {
    id: 'hecho-haf-5',
    tipo_penal: 'Tentativa de homicidio y balacera en vía pública',
    fecha: '2025-12-28T23:10:00.000Z',
    franja_horaria: 'NOCHE',
    direccion: 'Fonavi San Jerónimo Manzana 11',
    barrio: 'Centenario',
    localidad: 'Santa Fe',
    cuij: '21-09726972-3',
    indice_lesividad: 9,
    geom: 'SRID=4326;POINT(-60.7200 -31.6680)',
    resumen: 'Enfrentamiento armado entre grupos antagónicos en patio central de monoblocks. Dos heridos de arma de fuego derivados al Hospital Cullen.',
    modus_operandi: 'Disparos cruzados entre tiradores apostados en escaleras y tiradores en pasillos peatonales.',
    banda_implicada: 'Los de Siempre'
  },
  {
    id: 'hecho-haf-6',
    tipo_penal: 'Robo calificado por uso de arma y secuestro de armamento',
    fecha: '2025-11-30T14:20:00.000Z',
    franja_horaria: 'TARDE',
    direccion: 'Pavón 1431',
    barrio: 'Mayoraz',
    localidad: 'Santa Fe',
    cuij: '21-09551234-8',
    indice_lesividad: 7,
    geom: 'SRID=4326;POINT(-60.7120 -31.6250)',
    resumen: 'Inmueble allanado tras robo con arma de fuego. Secuestro de escopeta 12/70 y munición de guerra.',
    modus_operandi: 'Depósito clandestino y guardería de armas para alquiler.',
    banda_implicada: 'Banda del Correntino (Beban)'
  }
];

// 8. Escribir archivo consolidado src/js/initial-data.js
const fileContent = `// CRIMINT — Dataset Táctico y Operativo de Inteligencia Criminal (Santa Fe)
// Consolidación de Dossiers, Planillas Judiciales CUIJ, Violencia Armada HAF y Organizaciones Criminales

export const INITIAL_ZONAS = ${JSON.stringify(ZONAS, null, 2)};

export const INITIAL_BANDAS = ${JSON.stringify(BANDAS, null, 2)};

export const INITIAL_PERSONAS = ${JSON.stringify(PERSONAS, null, 2)};

export const INITIAL_VINCULOS = ${JSON.stringify(VINCULOS, null, 2)};

export const INITIAL_ALLANAMIENTOS = ${JSON.stringify(ALLANAMIENTOS, null, 2)};

export const INITIAL_HECHOS = ${JSON.stringify(HECHOS, null, 2)};
`;

fs.writeFileSync('src/js/initial-data.js', fileContent);
console.log('✅ Generado con éxito src/js/initial-data.js!');
console.log(`- Zonas: ${ZONAS.length}`);
console.log(`- Bandas: ${BANDAS.length}`);
console.log(`- Personas: ${PERSONAS.length}`);
console.log(`- Vínculos: ${VINCULOS.length}`);
console.log(`- Allanamientos: ${ALLANAMIENTOS.length}`);
console.log(`- Hechos Tácticos: ${HECHOS.length}`);
