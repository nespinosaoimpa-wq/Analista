// CRIMINT — Initial Tactical Dataset for Santa Fe
// Provides immediate realistic operational data if Supabase is offline or still unmigrated

export const INITIAL_ZONAS = [
  {
    id: 'zona-yapeyu',
    nombre: 'Barrio Yapeyú - Sector Norte',
    tipo: 'BANDA_CONFLICTO',
    barrio: 'Yapeyú',
    color_hex: '#EF4444',
    descripcion: 'Sector de disputa territorial armada entre facciones locales. Búnkers y pasadizos.',
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
    nombre: 'San Lorenzo - Zona de Operaciones',
    tipo: 'PATRULLAJE_PRIORITARIO',
    barrio: 'San Lorenzo',
    color_hex: '#F59E0B',
    descripcion: 'Sector con reiterados requerimientos de allanamiento y saturación policial.',
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
    id: 'zona-barranquitas',
    nombre: 'Barranquitas Oeste / Salado',
    tipo: 'BANDA_CONFLICTO',
    barrio: 'Barranquitas',
    color_hex: '#8B5CF6',
    descripcion: 'Corredor ribereño de aprovisionamiento de microtráfico.',
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
  }
];

export const INITIAL_HECHOS = [
  {
    id: 'hecho-1',
    tipo_penal: 'Microtráfico',
    fecha: new Date(Date.now() - 1 * 86400000).toISOString(),
    franja_horaria: 'TARDE',
    direccion: 'Liberación y Estrada',
    barrio: 'San Lorenzo',
    localidad: 'Santa Fe',
    cuij: '21-09744817-2',
    requerimiento: 'R-060-26',
    indice_lesividad: 4,
    geom: 'SRID=4326;POINT(-60.7305 -31.6512)',
    resumen: 'Venta al menudeo con flujo constante de compradores en motovehículos.',
    modus_operandi: 'Pasamanos rápido desde ventana enrejada con campana a 50 metros.'
  },
  {
    id: 'hecho-2',
    tipo_penal: 'Abuso de armas',
    fecha: new Date(Date.now() - 3 * 86400000).toISOString(),
    franja_horaria: 'NOCHE',
    direccion: 'Alfonsina Storni y Figueroa',
    barrio: 'Yapeyú',
    localidad: 'Santa Fe',
    cuij: '21-09745475-9',
    indice_lesividad: 8,
    geom: 'SRID=4326;POINT(-60.7369 -31.5741)',
    resumen: 'Ataque armado contra fachada de inmueble. 14 vainas servidas cal 9mm secuestradas.',
    modus_operandi: 'Dos masculinos a bordo de motocicleta 150cc disparan en movimiento.'
  },
  {
    id: 'hecho-3',
    tipo_penal: 'Comercialización de estupefacientes',
    fecha: new Date(Date.now() - 5 * 86400000).toISOString(),
    franja_horaria: 'NOCHE',
    direccion: 'Juan Díaz de Solís 1400',
    barrio: 'San Lorenzo',
    localidad: 'Santa Fe',
    cuij: '21-09319473-7',
    indice_lesividad: 6,
    geom: 'SRID=4326;POINT(-60.7280 -31.6560)',
    resumen: 'Centro de fraccionamiento y pesaje. Punto de aprovisionamiento de soldaditos.',
    modus_operandi: 'Inmueble fortificado con doble puerta de chapa reforzada y cámaras.'
  },
  {
    id: 'hecho-4',
    tipo_penal: 'Homicidio',
    fecha: new Date(Date.now() - 8 * 86400000).toISOString(),
    franja_horaria: 'MADRUGADA',
    direccion: 'Diagonal Abipones y Neuquén',
    barrio: 'Yapeyú',
    localidad: 'Santa Fe',
    cuij: '21-09123841-0',
    indice_lesividad: 10,
    geom: 'SRID=4326;POINT(-60.7435 -31.5667)',
    resumen: 'Víctima masculina con múltiples heridas de proyectil de arma de fuego en vía pública.',
    modus_operandi: 'Ajuste de cuentas por deuda de estupefacientes en territorio disputado.'
  },
  {
    id: 'hecho-5',
    tipo_penal: 'Microtráfico',
    fecha: new Date(Date.now() - 10 * 86400000).toISOString(),
    franja_horaria: 'TARDE',
    direccion: 'Urquiza 4250',
    barrio: 'Barranquitas',
    localidad: 'Santa Fe',
    cuij: '21-09319473-7',
    indice_lesividad: 5,
    geom: 'SRID=4326;POINT(-60.7088 -31.6285)',
    resumen: 'Distribución mayorista a domicilios satélites.',
    modus_operandi: 'Entrega en baúl de automóvil particular en punto de encuentro pactado.'
  },
  {
    id: 'hecho-6',
    tipo_penal: 'Tentativa de homicidio',
    fecha: new Date(Date.now() - 12 * 86400000).toISOString(),
    franja_horaria: 'NOCHE',
    direccion: 'Zavalla y Monseñor Zazpe',
    barrio: 'San Lorenzo',
    localidad: 'Santa Fe',
    cuij: '21-09726972-3',
    indice_lesividad: 9,
    geom: 'SRID=4326;POINT(-60.7289 -31.6582)',
    resumen: 'Herido de arma de fuego en tórax trasladado al Hospital Cullen en código rojo.',
    modus_operandi: 'Emboscada en ochava con dos tiradores pie a tierra.'
  },
  {
    id: 'hecho-7',
    tipo_penal: 'Robo calificado',
    fecha: new Date(Date.now() - 15 * 86400000).toISOString(),
    franja_horaria: 'MAÑANA',
    direccion: 'Regimiento 12 de Infantería y Peñaloza',
    barrio: 'Las Flores',
    localidad: 'Santa Fe',
    cuij: '21-09551234-8',
    indice_lesividad: 6,
    geom: 'SRID=4326;POINT(-60.7320 -31.5950)',
    resumen: 'Sustracción de motovehículo a mano armada con pistola calibre 9mm.',
    modus_operandi: 'Interceptación mediante cruce de motocicleta y amenaza directa.'
  },
  {
    id: 'hecho-8',
    tipo_penal: 'Microtráfico',
    fecha: new Date(Date.now() - 18 * 86400000).toISOString(),
    franja_horaria: 'TARDE',
    direccion: 'Pasaje Cervantes y Gaboto',
    barrio: 'Santa Rosa de Lima',
    localidad: 'Santa Fe',
    cuij: '21-09441199-1',
    indice_lesividad: 4,
    geom: 'SRID=4326;POINT(-60.7320 -31.6420)',
    resumen: 'Búnker de expendio continuo de pasta base / clorhidrato.',
    modus_operandi: 'Operación con menores de edad utilizados para entrega y recaudación.'
  }
];

export const INITIAL_PERSONAS = [
  {
    id: 'persona-1',
    nombre: 'Marcelo Alejandro',
    apellido: 'Sosa',
    alias: ['El Tuerto', 'Chelo'],
    dni: '40644753',
    sexo: 'M',
    fecha_nacimiento: '1997-04-12',
    tez: 'Trigueña',
    cabello: 'Negro corto',
    contextura: 'Delgada',
    senas_particulares: 'Cicatriz en ceja izquierda y tatuaje de cruz en antebrazo derecho',
    score_peligrosidad: 8,
    roles: ['dealer', 'distribuidor', 'acopiador'],
    domicilio_principal: 'Liberación y Estrada, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7305 -31.6512)',
    antecedentes_texto: 'Causa CUIJ 21-09744817-2 por presunta infracción Ley 23.737. Detención en 2022 por tenencia de arma de guerra.',
    activo: true
  },
  {
    id: 'persona-2',
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
    antecedentes_texto: 'Imputado CUIJ 21-09319473-7. Prisión preventiva confirmada en apelación.',
    activo: true
  },
  {
    id: 'persona-3',
    nombre: 'Esteban Darío',
    apellido: 'Maidana',
    alias: ['Puchinga'],
    dni: '42189034',
    sexo: 'M',
    fecha_nacimiento: '2000-08-15',
    tez: 'Trigueña',
    score_peligrosidad: 7,
    roles: ['tirador', 'soldadito', 'campana'],
    domicilio_principal: 'Zavalla y Zazpe 1700, Santa Fe',
    domicilio_principal_geom: 'SRID=4326;POINT(-60.7289 -31.6582)',
    antecedentes_texto: 'Intervenido en allanamiento con secuestro de municiones calibre 9mm.',
    activo: true
  },
  {
    id: 'persona-4',
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
    antecedentes_texto: 'Titular de billeteras virtuales para recaudación de puntos de venta.',
    activo: true
  }
];

export const INITIAL_BANDAS = [
  {
    id: 'banda-1',
    nombre: 'La Negrada',
    barrio_base: 'San Lorenzo',
    color_hex: '#EF4444',
    actividad_principal: 'Microtráfico, usurpaciones y abusos de arma',
    descripcion: 'Célula con base territorial en el sudoeste de Santa Fe. Disputa activa con Los de Siempre.',
    nivel_amenaza: 8,
    activa: true
  },
  {
    id: 'banda-2',
    nombre: 'Los Chingos',
    barrio_base: 'Yapeyú',
    color_hex: '#F59E0B',
    actividad_principal: 'Comercialización de cocaína fraccionada',
    descripcion: 'Estructura con ramificaciones en Recreo y Las Flores.',
    nivel_amenaza: 7,
    activa: true
  },
  {
    id: 'banda-3',
    nombre: 'Los de Siempre',
    barrio_base: 'Centenario',
    color_hex: '#0EA5E9',
    actividad_principal: 'Sicariato, extorsión y microtráfico',
    descripcion: 'Histórica facción con articulación hacia barras de fútbol.',
    nivel_amenaza: 9,
    activa: true
  }
];

export const INITIAL_ALLANAMIENTOS = [
  {
    id: 'allanamiento-1',
    cuij: '21-09744817-2',
    requerimiento: 'R-060-26',
    fecha_operativo: new Date(Date.now() - 2 * 86400000).toISOString(),
    direccion: 'Zavalla y Monseñor Zazpe 1700',
    barrio: 'San Lorenzo',
    localidad: 'Santa Fe',
    fuerza_interviniente: 'PDI (Policía de Investigaciones)',
    resultado: 'Positivo',
    juzgado_interviniente: 'MPA Fiscalía Regional 1',
    resultado_detalle: 'Secuestro de 58 envoltorios de cocaína, balanza digital, $142.000 y 2 celulares.',
    resumen: 'Allanamiento de urgencia autorizado por juez penal tras tareas encubiertas.',
    geom: 'SRID=4326;POINT(-60.7289 -31.6582)'
  },
  {
    id: 'allanamiento-2',
    cuij: '21-09319473-7',
    requerimiento: 'R-012-25',
    fecha_operativo: new Date(Date.now() - 9 * 86400000).toISOString(),
    direccion: 'Juan Díaz de Solís 1450',
    barrio: 'San Lorenzo',
    localidad: 'Santa Fe',
    fuerza_interviniente: 'Gendarmería Nacional',
    resultado: 'Positivo',
    juzgado_interviniente: 'Juzgado Federal N° 1 Santa Fe',
    resultado_detalle: 'Secuestro de trozo compacto de marihuana (650gr) y pistola calibre .380.',
    resumen: 'Operativo simultáneo en tres objetivos vinculados a la red de Doello.',
    geom: 'SRID=4326;POINT(-60.7280 -31.6560)'
  }
];

export const INITIAL_VINCULOS = [
  {
    id: 'vinculo-1',
    persona_origen_id: 'persona-2', // Doello
    persona_destino_id: 'persona-1', // Sosa
    tipo_relacion: 'SUBORDINADO_A',
    origen_nombre: 'Juan Manuel Doello',
    destino_nombre: 'Marcelo Alejandro Sosa',
    certeza: 'CONFIRMADO',
    tipo: 'SUBORDINADO_A',
    origen_informacion: 'CUIJ 21-09319473-7 - Escuchas directas'
  },
  {
    id: 'vinculo-2',
    persona_origen_id: 'persona-1', // Sosa
    persona_destino_id: 'persona-3', // Maidana
    tipo_relacion: 'COAUTOR_EN',
    origen_nombre: 'Marcelo Alejandro Sosa',
    destino_nombre: 'Esteban Darío Maidana',
    certeza: 'CONFIRMADO',
    tipo: 'COAUTOR_EN',
    origen_informacion: 'Allanamiento Zavalla y Zazpe'
  },
  {
    id: 'vinculo-3',
    persona_origen_id: 'persona-1', // Sosa
    persona_destino_id: 'persona-4', // Pallavidini
    tipo_relacion: 'FAMILIAR_DE',
    origen_nombre: 'Marcelo Alejandro Sosa',
    destino_nombre: 'Romina Vanesa Pallavidini',
    certeza: 'CONFIRMADO',
    tipo: 'FAMILIAR_DE',
    origen_informacion: 'Investigación patrimonial PDI'
  }
];
