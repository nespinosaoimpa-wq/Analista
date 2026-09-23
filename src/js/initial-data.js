// CRIMINT — Dataset Táctico y Operativo de Inteligencia Criminal (Santa Fe)
// Consolidación de Dossiers, Planillas Judiciales CUIJ, Violencia Armada HAF y Organizaciones Criminales

export const INITIAL_ZONAS = [
  {
    "id": "zona-yapeyu",
    "nombre": "Barrio Yapeyú - Sector Norte",
    "tipo": "BANDA_CONFLICTO",
    "barrio": "Yapeyú",
    "color_hex": "#EF4444",
    "descripcion": "Sector de disputa territorial armada entre Puchingas y bandas de Recreo. Búnkers y pasadizos.",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -60.740042,
            -31.559614
          ],
          [
            -60.744912,
            -31.565812
          ],
          [
            -60.745792,
            -31.571443
          ],
          [
            -60.736673,
            -31.5736
          ],
          [
            -60.732338,
            -31.567037
          ],
          [
            -60.731845,
            -31.561991
          ],
          [
            -60.740042,
            -31.559614
          ]
        ]
      ]
    }
  },
  {
    "id": "zona-san-lorenzo",
    "nombre": "San Lorenzo / Chalet - Corredor Zazpe y Estrada",
    "tipo": "BANDA_CONFLICTO",
    "barrio": "San Lorenzo",
    "color_hex": "#DC2626",
    "descripcion": "Epicentro de conflicto armado entre La Negrada y Los de Siempre. Alta concentración de balaceras (HAF) y allanamientos.",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -60.7325,
            -31.65
          ],
          [
            -60.725,
            -31.652
          ],
          [
            -60.723,
            -31.662
          ],
          [
            -60.735,
            -31.661
          ],
          [
            -60.7325,
            -31.65
          ]
        ]
      ]
    }
  },
  {
    "id": "zona-centenario",
    "nombre": "Centenario / Fonavi San Jerónimo",
    "tipo": "PATRULLAJE_PRIORITARIO",
    "barrio": "Centenario",
    "color_hex": "#0284C7",
    "descripcion": "Bastión histórico de \"Los de Siempre\". Extorsiones, balaceras y control de accesos a monoblocks.",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -60.724,
            -31.662
          ],
          [
            -60.715,
            -31.663
          ],
          [
            -60.716,
            -31.674
          ],
          [
            -60.726,
            -31.673
          ],
          [
            -60.724,
            -31.662
          ]
        ]
      ]
    }
  },
  {
    "id": "zona-barranquitas",
    "nombre": "Barranquitas Oeste / Río Salado",
    "tipo": "BANDA_CONFLICTO",
    "barrio": "Barranquitas",
    "color_hex": "#10B981",
    "descripcion": "Corredor de aprovisionamiento de la Banda del Correntino (Beban). Vías de escape ribereñas.",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -60.72,
            -31.63
          ],
          [
            -60.71,
            -31.632
          ],
          [
            -60.712,
            -31.64
          ],
          [
            -60.722,
            -31.639
          ],
          [
            -60.72,
            -31.63
          ]
        ]
      ]
    }
  },
  {
    "id": "zona-castanaduy",
    "nombre": "Santa Fe Norte - Castañaduy / Las Flores",
    "tipo": "PATRULLAJE_PRIORITARIO",
    "barrio": "Santa Fe Norte",
    "color_hex": "#8B5CF6",
    "descripcion": "Base operativa y guardería de vehículos de la red de Polaco Maidana.",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -60.735,
            -31.585
          ],
          [
            -60.72,
            -31.586
          ],
          [
            -60.721,
            -31.597
          ],
          [
            -60.736,
            -31.596
          ],
          [
            -60.735,
            -31.585
          ]
        ]
      ]
    }
  },
  {
    "id": "zona-alto-verde",
    "nombre": "Alto Verde - Sector Ribereño",
    "tipo": "BANDA_CONFLICTO",
    "barrio": "Alto Verde",
    "color_hex": "#EC4899",
    "descripcion": "Dominio territorial de \"Los Espinillos\". Puntos de trasbordo fluvial y caletas isleñas.",
    "geom": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -60.69,
            -31.645
          ],
          [
            -60.675,
            -31.646
          ],
          [
            -60.678,
            -31.662
          ],
          [
            -60.693,
            -31.66
          ],
          [
            -60.69,
            -31.645
          ]
        ]
      ]
    }
  }
];

export const INITIAL_BANDAS = [
  {
    "id": "banda-la-negrada",
    "nombre": "La Negrada",
    "barrio_base": "San Lorenzo / Chalet",
    "color_hex": "#EF4444",
    "actividad_principal": "Microtráfico, usurpaciones coactivas y abusos de armas de alta lesividad",
    "descripcion": "Organización criminal con base territorial en el sudoeste de Santa Fe. Conducción operativa vinculada a Jon Zabala y la familia Giovanniello. Mantiene histórica y violenta pugna con \"Los de Siempre\" por bocas de expendio y control de pasillos.",
    "nivel_amenaza": 9,
    "cabecilla_principal": "Jon Nelson Zabala (Prófugo - Pedido de Captura)",
    "zonas_operacion": [
      "San Lorenzo",
      "Chalet",
      "Centenario",
      "Santa Rosa de Lima"
    ],
    "rivales": [
      "Los de Siempre"
    ],
    "delitos_alta_lesividad": "Reiteradas balaceras con heridos de arma de fuego (HAF), usurpaciones violentas para búnkers y tiroteos en ochava Zazpe y Zavalla.",
    "activa": true
  },
  {
    "id": "banda-los-de-siempre",
    "nombre": "Los de Siempre",
    "barrio_base": "Centenario / Fonavi San Jerónimo",
    "color_hex": "#0EA5E9",
    "actividad_principal": "Sicariato, extorsión armada a comercios y narcotráfico organizado",
    "descripcion": "Histórica facción criminal dirigida por el clan Leiva (\"Nano\" Leiva, Juan Abel Leiva). Cuenta con tiradores armados con pistolas 9mm y calibres mayores. Control de monoblocks en barrio Centenario.",
    "nivel_amenaza": 10,
    "cabecilla_principal": "Oscar Orlando Leiva (\"Nano\" - Liderazgo penitenciario) y Juan Abel Leiva",
    "zonas_operacion": [
      "Centenario",
      "Fonavi San Jerónimo",
      "Varadero Sarsotti",
      "San Lorenzo"
    ],
    "rivales": [
      "La Negrada"
    ],
    "delitos_alta_lesividad": "Ataques sistemáticos con armas automáticas sobre fachadas, homicidios en ajuste de cuentas y enfrentamientos territoriales.",
    "activa": true
  },
  {
    "id": "banda-polaco-maidana",
    "nombre": "Banda del Polaco Maidana",
    "barrio_base": "Santa Fe Norte / Castañaduy / Recreo",
    "color_hex": "#8B5CF6",
    "actividad_principal": "Distribución mayorista de cocaína, vehículos gemelos y acopio balístico",
    "descripcion": "Estructura con conexiones interjurisdiccionales Santa Fe-Rosario operada por Esteban Darío Maidana y Salvador Mendoza. Utilización de vehículos adulterados para distribución rápida.",
    "nivel_amenaza": 8,
    "cabecilla_principal": "Esteban Darío Maidana (\"Polaco Maidana\" - Pedido de Captura)",
    "zonas_operacion": [
      "Castañaduy",
      "Santa Fe Norte",
      "Recreo",
      "Las Flores"
    ],
    "rivales": [
      "Facciones independientes zona norte"
    ],
    "delitos_alta_lesividad": "Abuso de armas de guerra, intimidaciones con disparos a deudores y encubrimiento de vehículos con pedido de secuestro.",
    "activa": true
  },
  {
    "id": "banda-puchingas",
    "nombre": "Los Puchingas",
    "barrio_base": "Yapeyú / San Agustín",
    "color_hex": "#F59E0B",
    "actividad_principal": "Puntos de venta de pasta base, soldaditos armados y enfrentamientos de pasillo",
    "descripcion": "Grupo armado territorial asentado en los pasillos de Yapeyú y San Agustín. Utilizan campanas con handies y menores armados para custodia de búnkers.",
    "nivel_amenaza": 8,
    "cabecilla_principal": "Isaias Benítez (\"Puchinga\" - Pedido de Captura)",
    "zonas_operacion": [
      "Yapeyú",
      "San Agustín",
      "Loyola",
      "Ceferino Namuncurá"
    ],
    "rivales": [
      "Los Chingos"
    ],
    "delitos_alta_lesividad": "Enfrentamientos armados en esquinas, homicidios en pasajes peatonales y heridos por balaceras directas.",
    "activa": true
  },
  {
    "id": "banda-correntino",
    "nombre": "Banda del Correntino (Beban)",
    "barrio_base": "Barranquitas / Mayoraz",
    "color_hex": "#10B981",
    "actividad_principal": "Fraccionamiento de estupefacientes, robos calificados y acopio de armas",
    "descripcion": "Clan integrado por Cristian Ismael Beban, Claudia Pedriel, la familia Alviso y el \"Aceitero\" Leguizamon. Depósito y distribución en el eje oeste-noroeste.",
    "nivel_amenaza": 8,
    "cabecilla_principal": "Cristian Ismael Beban (Pedido de Captura)",
    "zonas_operacion": [
      "Barranquitas",
      "Mayoraz",
      "Pavón",
      "San Pantaleón"
    ],
    "rivales": [
      "Bandas ribereñas del Salado"
    ],
    "delitos_alta_lesividad": "Asaltos a mano armada, agresiones con armas de fuego para blindar casas de acopio.",
    "activa": true
  },
  {
    "id": "banda-espinillos",
    "nombre": "Los Espinillos",
    "barrio_base": "Alto Verde / Zona Costera",
    "color_hex": "#EC4899",
    "actividad_principal": "Tránsito fluvial de cargamentos, búnkers insulares y piratería ribereña",
    "descripcion": "Organización radicada en las defensas y terraplenes de Alto Verde. Emplea canoas a motor para transportar material ilícito evitando retenes terrestres.",
    "nivel_amenaza": 7,
    "cabecilla_principal": "Estructura descentralizada costera",
    "zonas_operacion": [
      "Alto Verde",
      "La Guardia",
      "El Pozo",
      "Bajada Distéfano"
    ],
    "rivales": [
      "Bandas de El Pozo"
    ],
    "delitos_alta_lesividad": "Tiroteos con armas largas en barrancas ribereñas, agresiones agravadas por el uso de armas de fuego.",
    "activa": true
  }
];

export const INITIAL_PERSONAS = [
  {
    "id": "p-celer-gabriel",
    "nombre": "Gabriel Nicolás",
    "apellido": "Celer",
    "alias": [
      "Gaby",
      "Celer"
    ],
    "dni": "37337271",
    "cuit": "20-37337271-5",
    "fecha_nacimiento": "1993-06-21",
    "sexo": "M",
    "roles": [
      "integrante",
      "distribuidor",
      "soldadito"
    ],
    "score_peligrosidad": 7,
    "banda_id": "banda-los-de-siempre",
    "banda_nombre": "Los de Siempre",
    "banda_color": "#0EA5E9",
    "pedido_captura": false,
    "estado_judicial": "INVESTIGADO - IDENTIFICADO EN TERRITORIO",
    "cuij_asociados": [
      "21-09726972-3"
    ],
    "domicilio_principal": "Vera Mujica 674, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.72409 -31.66444)",
    "link_dossier": "https://docs.google.com/document/d/1LpeWNiTKd7OiNT04V-6iHH3seoXrbhd/edit",
    "delitos_asociados": [
      "Microtráfico",
      "Asociación ilícita"
    ],
    "antecedentes_texto": "Integrante identificado de la organización criminal Los de Siempre con base en Centenario. Dossier judicial del Ministerio Público de la Acusación adjunto.",
    "activo": true
  },
  {
    "id": "p-zabala-jon",
    "nombre": "Jon Nelson",
    "apellido": "Zabala",
    "alias": [
      "Jon",
      "Zabala"
    ],
    "dni": "38991204",
    "sexo": "M",
    "fecha_nacimiento": "1994-06-18",
    "roles": [
      "cabecilla",
      "organizador",
      "financista"
    ],
    "score_peligrosidad": 10,
    "banda_id": "banda-la-negrada",
    "banda_nombre": "La Negrada",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA NACIONAL E INTERNACIONAL",
    "cuij_asociados": [
      "21-09744817-2",
      "21-09745475-9"
    ],
    "domicilio_principal": "San Lorenzo / Pasaje Zazpe 1700, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7289 -31.6582)",
    "delitos_asociados": [
      "Homicidio calificado",
      "Comercialización agravada de estupefacientes",
      "Asociación ilícita",
      "Abuso de armas"
    ],
    "antecedentes_texto": "Líder de \"La Negrada\". Órdenes directas de tiroteos contra Los de Siempre. Múltiples allanamientos con resultado positivo de municiones.",
    "activo": true
  },
  {
    "id": "p-maidana-esteban",
    "nombre": "Esteban Darío",
    "apellido": "Maidana",
    "alias": [
      "Polaco Maidana",
      "Polaco"
    ],
    "dni": "37812940",
    "sexo": "M",
    "fecha_nacimiento": "1993-02-14",
    "roles": [
      "cabecilla",
      "distribuidor mayorista",
      "acopiador"
    ],
    "score_peligrosidad": 9,
    "banda_id": "banda-polaco-maidana",
    "banda_nombre": "Banda del Polaco Maidana",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA ACTIVO",
    "cuij_asociados": [
      "21-08338285-3",
      "21-09319473-7"
    ],
    "domicilio_principal": "Castañaduy 6807, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7250 -31.5900)",
    "delitos_asociados": [
      "Comercialización de estupefacientes",
      "Tenencia ilegal de arma de guerra",
      "Encubrimiento agravado"
    ],
    "antecedentes_texto": "Conexión logística Rosario-Santa Fe. Flota de vehículos gemelos (Peugeot 206 gris DYH883). Prófugo desde allanamiento en Recreo.",
    "activo": true
  },
  {
    "id": "p-beban-cristian",
    "nombre": "Cristian Ismael",
    "apellido": "Beban",
    "alias": [
      "El Correntino",
      "Beban"
    ],
    "dni": "36627096",
    "sexo": "M",
    "fecha_nacimiento": "1992-09-03",
    "roles": [
      "cabecilla",
      "acopiador",
      "organizador"
    ],
    "score_peligrosidad": 9,
    "banda_id": "banda-correntino",
    "banda_nombre": "Banda del Correntino (Beban)",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA ACTIVO",
    "cuij_asociados": [
      "21-09551234-8"
    ],
    "domicilio_principal": "José Cibils 3336, Barranquitas, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7180 -31.6320)",
    "delitos_asociados": [
      "Comercialización de estupefacientes",
      "Robo calificado",
      "Asociación ilícita"
    ],
    "antecedentes_texto": "Cabecilla de la red del oeste. Centro de distribución en Barranquitas y depósitos en Pavón y República de Chile.",
    "activo": true
  },
  {
    "id": "p-leiva-oscar",
    "nombre": "Oscar Orlando",
    "apellido": "Leiva",
    "alias": [
      "Nano Leiva",
      "Nano"
    ],
    "dni": "32190845",
    "sexo": "M",
    "fecha_nacimiento": "1986-11-05",
    "roles": [
      "cabecilla",
      "jefe de facción",
      "organizador"
    ],
    "score_peligrosidad": 10,
    "banda_id": "banda-los-de-siempre",
    "banda_nombre": "Los de Siempre",
    "pedido_captura": false,
    "estado_judicial": "PRISIÓN EFECTIVA / LIDERAZGO PENITENCIARIO",
    "cuij_asociados": [
      "21-09726972-3",
      "21-09123841-0"
    ],
    "domicilio_principal": "Fonavi San Jerónimo, Manzana 11, Centenario, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7200 -31.6680)",
    "delitos_asociados": [
      "Homicidio calificado",
      "Extorsión coactiva",
      "Asociación ilícita",
      "Tenencia de armas de guerra"
    ],
    "antecedentes_texto": "Líder indiscutido de Los de Siempre. Maneja la estructura desde prisión mediante teléfonos celulares y visitas familiares.",
    "activo": true
  },
  {
    "id": "p-leiva-juan-abel",
    "nombre": "Juan Abel",
    "apellido": "Leiva",
    "alias": [
      "Abelito",
      "Juancho"
    ],
    "dni": "35490214",
    "sexo": "M",
    "roles": [
      "segundo jefe",
      "organizador armado",
      "tirador"
    ],
    "score_peligrosidad": 9,
    "banda_id": "banda-los-de-siempre",
    "banda_nombre": "Los de Siempre",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA ACTIVO",
    "cuij_asociados": [
      "21-09726972-3"
    ],
    "domicilio_principal": "Centenario, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7215 -31.6670)",
    "delitos_asociados": [
      "Tentativa de homicidio",
      "Abuso de armas",
      "Extorsiones"
    ],
    "antecedentes_texto": "Hermano y brazo ejecutor de Nano Leiva en las calles. Comanda operativos de intimidación armada.",
    "activo": true
  },
  {
    "id": "p-benitez-isaias",
    "nombre": "Isaias",
    "apellido": "Benítez",
    "alias": [
      "Puchinga",
      "Isa"
    ],
    "dni": "41982345",
    "sexo": "M",
    "roles": [
      "cabecilla",
      "tirador",
      "distribuidor"
    ],
    "score_peligrosidad": 9,
    "banda_id": "banda-puchingas",
    "banda_nombre": "Los Puchingas",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA ACTIVO",
    "cuij_asociados": [
      "21-09693542-8"
    ],
    "domicilio_principal": "Diagonal Abipones y Neuquén, Yapeyú, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7435 -31.5667)",
    "delitos_asociados": [
      "Homicidio en riña",
      "Abuso de armas de fuego",
      "Microtráfico agravado"
    ],
    "antecedentes_texto": "Líder del grupo armado en Yapeyú. Investigado por el MPA en legajo 21-09693542-8 por enfrentamiento a tiros en vía pública.",
    "activo": true
  },
  {
    "id": "p-sosa-marcelo",
    "nombre": "Marcelo Alejandro",
    "apellido": "Sosa",
    "alias": [
      "El Tuerto",
      "Chelo Sosa"
    ],
    "dni": "40644753",
    "sexo": "M",
    "roles": [
      "lugarteniente",
      "distribuidor",
      "custodio armado"
    ],
    "score_peligrosidad": 8,
    "banda_id": "banda-la-negrada",
    "banda_nombre": "La Negrada",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA ACTIVO",
    "cuij_asociados": [
      "21-09744817-2"
    ],
    "domicilio_principal": "Liberación y Estrada, San Lorenzo, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7305 -31.6512)",
    "delitos_asociados": [
      "Microtráfico",
      "Abuso de armas",
      "Lesiones graves por HAF"
    ],
    "antecedentes_texto": "Mano derecha de Jon Zabala en San Lorenzo. Registrado en el sistema de violencia armada HAF como blanco de ataque y tirador.",
    "activo": true
  },
  {
    "id": "p-doello-juan",
    "nombre": "Juan Manuel",
    "apellido": "Doello",
    "alias": [
      "Polaco Doello",
      "Juancito"
    ],
    "dni": "39369578",
    "sexo": "M",
    "roles": [
      "financista",
      "acopiador",
      "distribuidor"
    ],
    "score_peligrosidad": 8,
    "banda_id": "banda-la-negrada",
    "banda_nombre": "La Negrada",
    "pedido_captura": false,
    "estado_judicial": "PRISIÓN PREVENTIVA CONFIRMADA",
    "cuij_asociados": [
      "21-09319473-7"
    ],
    "domicilio_principal": "Urquiza 4250, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7088 -31.6285)",
    "delitos_asociados": [
      "Comercialización de estupefacientes agravada",
      "Asociación ilícita"
    ],
    "antecedentes_texto": "Imputado con prisión preventiva en causa CUIJ 21-09319473-7. Vínculo financiero y logístico de acopio.",
    "activo": true
  },
  {
    "id": "p-giovanniello-emilce",
    "nombre": "Emilce",
    "apellido": "Giovanniello",
    "alias": [
      "La Madre de Jon"
    ],
    "dni": "21903482",
    "sexo": "F",
    "roles": [
      "resguardo financiero",
      "logística familiar"
    ],
    "score_peligrosidad": 6,
    "banda_id": "banda-la-negrada",
    "banda_nombre": "La Negrada",
    "pedido_captura": false,
    "estado_judicial": "INVESTIGADA / INHIBICIÓN DE BIENES",
    "cuij_asociados": [
      "21-09744817-2"
    ],
    "domicilio_principal": "San Lorenzo, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7300 -31.6520)",
    "delitos_asociados": [
      "Lavado de activos",
      "Encubrimiento"
    ],
    "antecedentes_texto": "Madre de Jon Zabala. Titular de propiedades y vehículos utilizados por la estructura.",
    "activo": true
  },
  {
    "id": "p-giovanniello-marcelo",
    "nombre": "Marcelo Nicolás",
    "apellido": "Giovanniello",
    "alias": [
      "Nico"
    ],
    "dni": "43890124",
    "sexo": "M",
    "roles": [
      "acopiador",
      "distribuidor"
    ],
    "score_peligrosidad": 7,
    "banda_id": "banda-la-negrada",
    "banda_nombre": "La Negrada",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO CON MEDIDAS ALTERNATIVAS",
    "cuij_asociados": [
      "21-09744817-2"
    ],
    "domicilio_principal": "San Lorenzo, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7310 -31.6530)",
    "delitos_asociados": [
      "Microtráfico",
      "Tenencia de arma civil"
    ],
    "antecedentes_texto": "Hermano por vía materna de Jon Zabala. Operador de puntos de acopio en San Lorenzo.",
    "activo": true
  },
  {
    "id": "p-carnaghi-lautaro",
    "nombre": "Lautaro Fabián",
    "apellido": "Carnaghi",
    "alias": [
      "Toro"
    ],
    "dni": "42390184",
    "sexo": "M",
    "roles": [
      "tirador",
      "sicario",
      "seguridad armada"
    ],
    "score_peligrosidad": 8,
    "banda_id": "banda-la-negrada",
    "banda_nombre": "La Negrada",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA ACTIVO",
    "cuij_asociados": [
      "21-09744817-2"
    ],
    "domicilio_principal": "Chalet, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7260 -31.6600)",
    "delitos_asociados": [
      "Tentativa de homicidio",
      "Abuso de armas",
      "Lesiones graves"
    ],
    "antecedentes_texto": "Tirador de La Negrada. Identificado en tiroteos contra Los de Siempre en Centenario.",
    "activo": true
  },
  {
    "id": "p-aguilar-diego",
    "nombre": "Diego Francisco",
    "apellido": "Aguilar",
    "alias": [
      "Dieguito"
    ],
    "dni": "38190342",
    "sexo": "M",
    "roles": [
      "chofer",
      "soldado",
      "campana"
    ],
    "score_peligrosidad": 7,
    "banda_id": "banda-la-negrada",
    "banda_nombre": "La Negrada",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO",
    "cuij_asociados": [
      "21-09744817-2"
    ],
    "domicilio_principal": "San Lorenzo, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7320 -31.6540)",
    "delitos_asociados": [
      "Encubrimiento",
      "Microtráfico"
    ],
    "antecedentes_texto": "Moviliza motocicletas de apoyo y vigila esquinas durante las transacciones.",
    "activo": true
  },
  {
    "id": "p-filippa-walter",
    "nombre": "Walter Nicolás",
    "apellido": "Filippa",
    "alias": [
      "Nico Filippa"
    ],
    "dni": "41098234",
    "sexo": "M",
    "roles": [
      "soldado",
      "dealer"
    ],
    "score_peligrosidad": 6,
    "banda_id": "banda-la-negrada",
    "banda_nombre": "La Negrada",
    "pedido_captura": false,
    "estado_judicial": "INVESTIGADO",
    "cuij_asociados": [
      "21-09744817-2"
    ],
    "domicilio_principal": "Santa Rosa de Lima, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7330 -31.6440)",
    "delitos_asociados": [
      "Microtráfico"
    ],
    "antecedentes_texto": "Punto de venta satélite en Santa Rosa de Lima.",
    "activo": true
  },
  {
    "id": "p-celer-walter",
    "nombre": "Walter Damián",
    "apellido": "Celer",
    "alias": [
      "Dami"
    ],
    "dni": "34890123",
    "sexo": "M",
    "roles": [
      "lugarteniente",
      "logística armada",
      "organizador"
    ],
    "score_peligrosidad": 8,
    "banda_id": "banda-los-de-siempre",
    "banda_nombre": "Los de Siempre",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA ACTIVO",
    "cuij_asociados": [
      "21-09726972-3"
    ],
    "domicilio_principal": "Centenario, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7220 -31.6660)",
    "delitos_asociados": [
      "Abuso de armas de guerra",
      "Extorsión",
      "Asociación ilícita"
    ],
    "antecedentes_texto": "Encargado del parque balístico de Los de Siempre. Coordina el alquiler y custodia de armamento.",
    "activo": true
  },
  {
    "id": "p-celer-matias",
    "nombre": "Matías Damián",
    "apellido": "Celer",
    "alias": [
      "Mati Celer"
    ],
    "dni": "43109234",
    "sexo": "M",
    "roles": [
      "tirador",
      "soldado"
    ],
    "score_peligrosidad": 8,
    "banda_id": "banda-los-de-siempre",
    "banda_nombre": "Los de Siempre",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA ACTIVO",
    "cuij_asociados": [
      "21-09726972-3"
    ],
    "domicilio_principal": "Centenario / Fonavi, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7230 -31.6670)",
    "delitos_asociados": [
      "Tentativa de homicidio",
      "Abuso de armas calificado"
    ],
    "antecedentes_texto": "Implicado en múltiples balaceras en pasajes de Centenario contra miembros de La Negrada.",
    "activo": true
  },
  {
    "id": "p-leiva-brian",
    "nombre": "Brian",
    "apellido": "Leiva",
    "alias": [
      "Brian Leiva"
    ],
    "dni": "40912384",
    "sexo": "M",
    "roles": [
      "tirador",
      "sicario"
    ],
    "score_peligrosidad": 8,
    "banda_id": "banda-los-de-siempre",
    "banda_nombre": "Los de Siempre",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA ACTIVO",
    "cuij_asociados": [
      "21-09726972-3"
    ],
    "domicilio_principal": "Centenario, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7205 -31.6690)",
    "delitos_asociados": [
      "Homicidio calificado en grado de tentativa",
      "Portación de arma de guerra"
    ],
    "antecedentes_texto": "Sobrino de Nano Leiva. Ejecutor armado en ataques contra bocas de expendio rivales.",
    "activo": true
  },
  {
    "id": "p-passarello-jesica",
    "nombre": "Jésica Haydee",
    "apellido": "Passarello",
    "alias": [
      "Jesi"
    ],
    "dni": "36901234",
    "sexo": "F",
    "roles": [
      "administradora",
      "recaudadora",
      "pareja"
    ],
    "score_peligrosidad": 6,
    "banda_id": "banda-los-de-siempre",
    "banda_nombre": "Los de Siempre",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADA - PRISIÓN DOMICILIARIA",
    "cuij_asociados": [
      "21-09726972-3"
    ],
    "domicilio_principal": "Fonavi San Jerónimo, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7190 -31.6685)",
    "delitos_asociados": [
      "Comercialización de estupefacientes",
      "Lavado de dinero"
    ],
    "antecedentes_texto": "Pareja de integrante de la cúpula de Los de Siempre. Recauda dinero de billeteras electrónicas.",
    "activo": true
  },
  {
    "id": "p-mendoza-salvador",
    "nombre": "Salvador Ariel",
    "apellido": "Mendoza",
    "alias": [
      "Salva",
      "Gordo Mendoza"
    ],
    "dni": "36109234",
    "sexo": "M",
    "roles": [
      "transportista",
      "lugarteniente"
    ],
    "score_peligrosidad": 7,
    "banda_id": "banda-polaco-maidana",
    "banda_nombre": "Banda del Polaco Maidana",
    "pedido_captura": false,
    "estado_judicial": "PRISIÓN PREVENTIVA",
    "cuij_asociados": [
      "21-08338285-3"
    ],
    "domicilio_principal": "Recreo / Castañaduy, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7300 -31.5400)",
    "delitos_asociados": [
      "Transporte de estupefacientes",
      "Adulteración de numeración de objetos registrables"
    ],
    "antecedentes_texto": "Chofer principal de la banda. Detenido con ladrillo compacto de cocaína en baúl de automóvil.",
    "activo": true
  },
  {
    "id": "p-pedriel-claudia",
    "nombre": "Claudia Josefina",
    "apellido": "Pedriel",
    "alias": [
      "Claudia"
    ],
    "dni": "39370316",
    "sexo": "F",
    "roles": [
      "custodia de acopio",
      "recaudadora"
    ],
    "score_peligrosidad": 6,
    "banda_id": "banda-correntino",
    "banda_nombre": "Banda del Correntino (Beban)",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADA",
    "cuij_asociados": [
      "21-09551234-8"
    ],
    "domicilio_principal": "José Cibils 3336, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7180 -31.6320)",
    "delitos_asociados": [
      "Microtráfico",
      "Tenencia de estupefacientes con fines de comercialización"
    ],
    "antecedentes_texto": "Pareja y mano derecha de Cristian Beban en la administración del búnker principal.",
    "activo": true
  },
  {
    "id": "p-alviso-walter",
    "nombre": "Walter Ángel Uriel",
    "apellido": "Alviso",
    "alias": [
      "Wally"
    ],
    "dni": "45488582",
    "sexo": "M",
    "roles": [
      "soldado",
      "distribuidor"
    ],
    "score_peligrosidad": 7,
    "banda_id": "banda-correntino",
    "banda_nombre": "Banda del Correntino (Beban)",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO",
    "cuij_asociados": [
      "21-09551234-8"
    ],
    "domicilio_principal": "República de Chile 2954, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7150 -31.6340)",
    "delitos_asociados": [
      "Microtráfico",
      "Abuso de armas"
    ],
    "antecedentes_texto": "Distribución callejera en motovehículo por barrio Barranquitas.",
    "activo": true
  },
  {
    "id": "p-leguizamon-felipe",
    "nombre": "Felipe Dardo",
    "apellido": "Leguizamón",
    "alias": [
      "El Aceitero"
    ],
    "dni": "18341032",
    "sexo": "M",
    "roles": [
      "socio de acopio",
      "financista"
    ],
    "score_peligrosidad": 8,
    "banda_id": "banda-correntino",
    "banda_nombre": "Banda del Correntino (Beban)",
    "pedido_captura": true,
    "estado_judicial": "PRÓFUGO - PEDIDO DE CAPTURA ACTIVO",
    "cuij_asociados": [
      "21-09551234-8"
    ],
    "domicilio_principal": "Pavón 1431, Santa Fe",
    "domicilio_principal_geom": "SRID=4326;POINT(-60.7120 -31.6250)",
    "delitos_asociados": [
      "Comercialización agravada de estupefacientes",
      "Tenencia de arma de guerra"
    ],
    "antecedentes_texto": "Veterano con amplio prontuario en el negocio del narcotráfico. Aprovisiona a la banda de Beban.",
    "activo": true
  },
  {
    "id": "p-insumo-2-0",
    "nombre": "LAUTARO",
    "apellido": "LEIVA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-2",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09323425-9"
    ],
    "domicilio_principal": "Barrio Dorrego La Chaqueñada",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09323425-9 radicada en OTRA SEDE POLICIAL. Fiscal: MARCOLIN, ROSANA NOEMI.",
    "activo": true
  },
  {
    "id": "p-insumo-2-1",
    "nombre": "TAL CHANO",
    "apellido": "DELGADO UN",
    "alias": [
      "CHANO"
    ],
    "dni": "S/D-2",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09323425-9"
    ],
    "domicilio_principal": "Barrio Dorrego La Chaqueñada",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09323425-9 radicada en OTRA SEDE POLICIAL. Fiscal: MARCOLIN, ROSANA NOEMI.",
    "activo": true
  },
  {
    "id": "p-insumo-3-0",
    "nombre": "CARINA",
    "apellido": "LEONE",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-3",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09324464-5"
    ],
    "domicilio_principal": "Alto verde, Manzana 6 cerca. Cerca del Poli",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09324464-5 radicada en OTRA SEDE POLICIAL. Fiscal: Fernandez, Eric Valerio.",
    "activo": true
  },
  {
    "id": "p-insumo-3-1",
    "nombre": "ALBERTO",
    "apellido": "LEONE RAMON",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-3",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09324464-5"
    ],
    "domicilio_principal": "Alto verde, Manzana 6 cerca. Cerca del Poli",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09324464-5 radicada en OTRA SEDE POLICIAL. Fiscal: Fernandez, Eric Valerio.",
    "activo": true
  },
  {
    "id": "p-insumo-4-0",
    "nombre": "ANGEL",
    "apellido": "ZANZON",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-4",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09324957-4"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09324957-4 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 15°-SANTO TOME. Fiscal: Vigo Fierro, Diego Fernando; DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-4-1",
    "nombre": "ABRIL",
    "apellido": "ALMIRON",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-4",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09324957-4"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09324957-4 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 15°-SANTO TOME. Fiscal: Vigo Fierro, Diego Fernando; DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-4-2",
    "nombre": "MARIA",
    "apellido": "SOLIS LAILA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-4",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09324957-4"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09324957-4 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 15°-SANTO TOME. Fiscal: Vigo Fierro, Diego Fernando; DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-4-3",
    "nombre": "MICAELA",
    "apellido": "BIRASOLI",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-4",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09324957-4"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09324957-4 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 15°-SANTO TOME. Fiscal: Vigo Fierro, Diego Fernando; DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-4-4",
    "nombre": "GASTON ALEXIS",
    "apellido": "BIRASOLI MAURO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-4",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09324957-4"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09324957-4 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 15°-SANTO TOME. Fiscal: Vigo Fierro, Diego Fernando; DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-4-5",
    "nombre": "JORGE",
    "apellido": "BIRASOLI CARLOS",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-4",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09324957-4"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09324957-4 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 15°-SANTO TOME. Fiscal: Vigo Fierro, Diego Fernando; DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-7-0",
    "nombre": "ABEL",
    "apellido": "LEIVA JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "28241471",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09325542-6"
    ],
    "domicilio_principal": "Vera Mujica 674, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09325542-6 radicada en MPA Regional 1. Fiscal: Cecchini, Manuel Eduardo.",
    "activo": true
  },
  {
    "id": "p-insumo-8-0",
    "nombre": "MAGALÍ",
    "apellido": "PATIÑO ANTONELLA",
    "alias": [
      "Investigado"
    ],
    "dni": "41730037",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09325584-1"
    ],
    "domicilio_principal": "1ro. De Mayo 5350, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09325584-1 radicada en MPA Regional 1. Fiscal: DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-9-0",
    "nombre": "BELEN",
    "apellido": "SOUZA MARIA",
    "alias": [
      "Investigado"
    ],
    "dni": "43493546",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09326253-8"
    ],
    "domicilio_principal": "ALBERTI 5915",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09326253-8 radicada en OTRA SEDE POLICIAL. Fiscal: Fernandez, Eric Valerio; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-10-0",
    "nombre": "DANIEL",
    "apellido": "CAMELINO MARCELO",
    "alias": [
      "Investigado"
    ],
    "dni": "36038200",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09327746-2"
    ],
    "domicilio_principal": "Pje. Peru 354, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09327746-2 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-11-0",
    "nombre": "ANTONIA",
    "apellido": "DELGADO RAMONA",
    "alias": [
      "Investigado"
    ],
    "dni": "35438002",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09327906-6"
    ],
    "domicilio_principal": "Patagones 3900, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo gratuito"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09327906-6 radicada en OTRA SEDE POLICIAL. Fiscal: Arri, María Gabriela.",
    "activo": true
  },
  {
    "id": "p-insumo-12-0",
    "nombre": "EDUARDO",
    "apellido": "FERNANDEZ JAVIER",
    "alias": [
      "Investigado"
    ],
    "dni": "27967582",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09330021-9"
    ],
    "domicilio_principal": "Alberti 4003, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09330021-9 radicada en OTRA SEDE POLICIAL. Fiscal: Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-13-0",
    "nombre": "BRIAN",
    "apellido": "ZANABRIA MICHAEL",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-13",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09330709-4"
    ],
    "domicilio_principal": "HILARIO SABROSO 1852",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09330709-4 radicada en U.R.I. LA CAPITAL - COMISARIA DISTRITO 12-SANTO TOME. Fiscal: Lascurain, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-15-0",
    "nombre": "EXEQUIEL",
    "apellido": "GELI GONZALO",
    "alias": [
      "Investigado"
    ],
    "dni": "43959988",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09332181-9"
    ],
    "domicilio_principal": "gaboto , calleEntre1: libertad, calleEntre2: iriondo, observaciones: en inmediacones de la plaza Manuel Belgrano de Santo Tomé",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09332181-9 radicada en MPA Regional 1. Fiscal: Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-16-0",
    "nombre": "BIBIANA",
    "apellido": "PEREZ LAURA",
    "alias": [
      "Investigado"
    ],
    "dni": "33010912",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09332787-7"
    ],
    "domicilio_principal": "SANTIAGO DEL ESTERO 275",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo gratuito"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09332787-7 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-17-0",
    "nombre": "LUCIA",
    "apellido": "FERNANDEZ MARTA",
    "alias": [
      "Investigado"
    ],
    "dni": "26064254",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09333410-5"
    ],
    "domicilio_principal": "BERNARDO DE IRIGOYEN 6934",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego calificada Tenencia ilegítima de arma de guerra // Ley 23737 Tenencia simple de estupefacientes // Delitos contra la propiedad Robo Calificado Uso de arma"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09333410-5 radicada en U.R.I. LA CAPITAL - SECCIONAL 9°. Fiscal: Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-17-1",
    "nombre": "VALENTIN",
    "apellido": "MAIDANA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-17",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09333410-5"
    ],
    "domicilio_principal": "BERNARDO DE IRIGOYEN 6934",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego calificada Tenencia ilegítima de arma de guerra // Ley 23737 Tenencia simple de estupefacientes // Delitos contra la propiedad Robo Calificado Uso de arma"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09333410-5 radicada en U.R.I. LA CAPITAL - SECCIONAL 9°. Fiscal: Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-18-0",
    "nombre": "CARLOS",
    "apellido": "CASTRO HUMBERTO",
    "alias": [
      "Investigado"
    ],
    "dni": "10935149",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09333832-1"
    ],
    "domicilio_principal": "Violetas E/ Sauces Y Fresnos 4270, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09333832-1 radicada en MPA Regional 1. Fiscal: Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-20-0",
    "nombre": "ANGEL",
    "apellido": "CORVALAN MIGUEL",
    "alias": [
      "Investigado"
    ],
    "dni": "21808959",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09336994-4"
    ],
    "domicilio_principal": "San Martin 00, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte // Delitos contra la propiedad Robo Simple // Delitos contra la seguridad pública Portación ilegítima de arma de fuego"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09336994-4 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 12°-B° LOS TRONCOS. Fiscal: DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-21-0",
    "nombre": "DARÍO",
    "apellido": "CASAL MAURO",
    "alias": [
      "Investigado"
    ],
    "dni": "42032212",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09337541-3"
    ],
    "domicilio_principal": "Junin 2141, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09337541-3 radicada en MPA Regional 1. Fiscal: Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-22-0",
    "nombre": "ALEJANDRO",
    "apellido": "RODA SEBASTIAN",
    "alias": [
      "Investigado"
    ],
    "dni": "31718707",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09338642-3"
    ],
    "domicilio_principal": "Gorostiaga 4121, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09338642-3 radicada en U.R.I. LA CAPITAL - SECCIONAL 1°. Fiscal: Vigo Fierro, Diego Fernando; Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-23-0",
    "nombre": "ORLANDO",
    "apellido": "TOLOSA HERNAN",
    "alias": [
      "Investigado"
    ],
    "dni": "27889449",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09340146-5"
    ],
    "domicilio_principal": "Coronda 758, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes // Delitos contra la administración pública Resistencia y desobediencia a la autoridad // Delitos contra la administración pública Cohecho activo"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09340146-5 radicada en U.R.XV. SAN JERONIMO - CRIA. 8° - CENTENO. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-24-0",
    "nombre": "HORACIO",
    "apellido": "IBARRA JAVIER",
    "alias": [
      "Investigado"
    ],
    "dni": "34618531",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09343646-3"
    ],
    "domicilio_principal": "Raul Taca 3060, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09343646-3 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-26-0",
    "nombre": "MARCELO",
    "apellido": "JUAREZ RAMON",
    "alias": [
      "Investigado"
    ],
    "dni": "33212738",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09344336-2"
    ],
    "domicilio_principal": "4 De Enero 9328, observaciones: Origen: RENAPER // Juan Diaz De Solis 5963, observaciones: Origen: RENAPER // Neuquen 6576, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09344336-2 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-26-1",
    "nombre": "SOLEDAD",
    "apellido": "JARA CECILIA",
    "alias": [
      "Investigado"
    ],
    "dni": "30185048",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09344336-2"
    ],
    "domicilio_principal": "4 De Enero 9328, observaciones: Origen: RENAPER // Juan Diaz De Solis 5963, observaciones: Origen: RENAPER // Neuquen 6576, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09344336-2 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-26-2",
    "nombre": "HUMBERTO",
    "apellido": "GIMENEZ LUIS",
    "alias": [
      "Investigado"
    ],
    "dni": "22280051",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09344336-2"
    ],
    "domicilio_principal": "4 De Enero 9328, observaciones: Origen: RENAPER // Juan Diaz De Solis 5963, observaciones: Origen: RENAPER // Neuquen 6576, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09344336-2 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-26-3",
    "nombre": "EVANGELINA",
    "apellido": "RODRIGUEZ RAMONA",
    "alias": [
      "Investigado"
    ],
    "dni": "26343918",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09344336-2"
    ],
    "domicilio_principal": "4 De Enero 9328, observaciones: Origen: RENAPER // Juan Diaz De Solis 5963, observaciones: Origen: RENAPER // Neuquen 6576, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09344336-2 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-27-0",
    "nombre": "RAFAEL",
    "apellido": "TOLEDO TOMÁS",
    "alias": [
      "Investigado"
    ],
    "dni": "40360473",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09345181-0"
    ],
    "domicilio_principal": "Castelli 3769, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09345181-0 radicada en OTRA SEDE POLICIAL. Fiscal: Haidar, Arturo.",
    "activo": true
  },
  {
    "id": "p-insumo-28-0",
    "nombre": "MILAGROS",
    "apellido": "PEDROZO BRISA",
    "alias": [
      "Investigado"
    ],
    "dni": "44024271",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09345266-3"
    ],
    "domicilio_principal": "Calle 35 Pje 14 0, observaciones: Origen: RENAPER // B° La Barranquera 6318, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09345266-3 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-28-1",
    "nombre": "MARISOL",
    "apellido": "PEDROZO MAIRA",
    "alias": [
      "Investigado"
    ],
    "dni": "45951682",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09345266-3"
    ],
    "domicilio_principal": "Calle 35 Pje 14 0, observaciones: Origen: RENAPER // B° La Barranquera 6318, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09345266-3 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-29-0",
    "nombre": "ALEJANDRA",
    "apellido": "CALDERON EVA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-29",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09347154-4"
    ],
    "domicilio_principal": "NUEVO TORINO 1400",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Lesiones Dolosas Leves"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09347154-4 radicada en U.R.XI. LAS COLONIAS - DESTACAMENTO POLICIAL 1° - LA ORILLA. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-31-0",
    "nombre": "GUADALUPE",
    "apellido": "MARTINEZ MICAELA",
    "alias": [
      "Investigado"
    ],
    "dni": "41864951",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09350537-6"
    ],
    "domicilio_principal": "Pje. Denis 7238, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09350537-6 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 17° - B° ESTANISLAO LOPEZ. Fiscal: Lascurain, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-33-0",
    "nombre": "JOSE",
    "apellido": "FERNANDEZ MARIA",
    "alias": [
      "Investigado"
    ],
    "dni": "31459063",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09350858-8"
    ],
    "domicilio_principal": "Martin Zapata 3310, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo gratuito"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09350858-8 radicada en OTRA SEDE POLICIAL. Fiscal: Fernandez, Eric Valerio.",
    "activo": true
  },
  {
    "id": "p-insumo-35-0",
    "nombre": "JUAN",
    "apellido": "AGUIRRE",
    "alias": [
      "Investigado"
    ],
    "dni": "39456675",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09351563-0"
    ],
    "domicilio_principal": "SAN JUSTO",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09351563-0 radicada en U.R.XVI. SAN JUSTO - COMISARIA 2° - SAN JUSTO (BARRIO REYES). Fiscal: Persello, Guillermo.",
    "activo": true
  },
  {
    "id": "p-insumo-36-0",
    "nombre": "VICTORIA GUADALUPE",
    "apellido": "OPORTO SHARON",
    "alias": [
      "Investigado"
    ],
    "dni": "36263693",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09351571-1"
    ],
    "domicilio_principal": "Pje. Pividori 2560, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09351571-1 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-37-0",
    "nombre": "NOEMI",
    "apellido": "HERRERA VERONICA",
    "alias": [
      "Investigado"
    ],
    "dni": "23899862",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09351675-0"
    ],
    "domicilio_principal": "Alemany 210, observaciones: Origen: RENAPER // Cordoba 281, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Amenazas Calificada Uso de arma // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil // Ley 23737 Siembra, cultivo de plantas o guarda de semillas, precursores químicos o cualquier otra materia prima para la producción y fabricación de estupefacientes cuando sea para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09351675-0 radicada en U.R.XV. SAN JERONIMO - CRIA. 11° - DIAZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-37-1",
    "nombre": "DAVID",
    "apellido": "ZOTTO JESUS",
    "alias": [
      "Investigado"
    ],
    "dni": "35222222",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09351675-0"
    ],
    "domicilio_principal": "Alemany 210, observaciones: Origen: RENAPER // Cordoba 281, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Amenazas Calificada Uso de arma // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil // Ley 23737 Siembra, cultivo de plantas o guarda de semillas, precursores químicos o cualquier otra materia prima para la producción y fabricación de estupefacientes cuando sea para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09351675-0 radicada en U.R.XV. SAN JERONIMO - CRIA. 11° - DIAZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-38-0",
    "nombre": "CARLOS",
    "apellido": "SANDOVAL JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "41943163",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09351935-0"
    ],
    "domicilio_principal": "San Lorenzo 5607, observaciones: Origen: RENAPER // Barrio El Triangulo 0, observaciones: Origen: RENAPER // Colonia Indigena 0, observaciones: Origen: RENAPER // Mzna 3 4, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por ser cometido en las inmediaciones o en el interior de un establecimiento de enseñanza, centro asistencial, lugar de detención, institución deportiva, cultural o social o en sitios donde se realicen espectáculos o diversiones públicos o en otros lugares a los que escolares y estudiantes acudan para realizar actividades educativas, deportivas o sociales"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09351935-0 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-38-1",
    "nombre": "RAFAEL",
    "apellido": "COSTANZO GUSTAVO",
    "alias": [
      "Investigado"
    ],
    "dni": "26149672",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09351935-0"
    ],
    "domicilio_principal": "San Lorenzo 5607, observaciones: Origen: RENAPER // Barrio El Triangulo 0, observaciones: Origen: RENAPER // Colonia Indigena 0, observaciones: Origen: RENAPER // Mzna 3 4, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por ser cometido en las inmediaciones o en el interior de un establecimiento de enseñanza, centro asistencial, lugar de detención, institución deportiva, cultural o social o en sitios donde se realicen espectáculos o diversiones públicos o en otros lugares a los que escolares y estudiantes acudan para realizar actividades educativas, deportivas o sociales"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09351935-0 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-38-2",
    "nombre": "MANUEL",
    "apellido": "UVIEDO EZEQUIEL",
    "alias": [
      "Investigado"
    ],
    "dni": "38726851",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09351935-0"
    ],
    "domicilio_principal": "San Lorenzo 5607, observaciones: Origen: RENAPER // Barrio El Triangulo 0, observaciones: Origen: RENAPER // Colonia Indigena 0, observaciones: Origen: RENAPER // Mzna 3 4, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por ser cometido en las inmediaciones o en el interior de un establecimiento de enseñanza, centro asistencial, lugar de detención, institución deportiva, cultural o social o en sitios donde se realicen espectáculos o diversiones públicos o en otros lugares a los que escolares y estudiantes acudan para realizar actividades educativas, deportivas o sociales"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09351935-0 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-38-3",
    "nombre": "LEONEL",
    "apellido": "D'ANGELO SANDRO",
    "alias": [
      "Investigado"
    ],
    "dni": "40703536",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09351935-0"
    ],
    "domicilio_principal": "San Lorenzo 5607, observaciones: Origen: RENAPER // Barrio El Triangulo 0, observaciones: Origen: RENAPER // Colonia Indigena 0, observaciones: Origen: RENAPER // Mzna 3 4, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por ser cometido en las inmediaciones o en el interior de un establecimiento de enseñanza, centro asistencial, lugar de detención, institución deportiva, cultural o social o en sitios donde se realicen espectáculos o diversiones públicos o en otros lugares a los que escolares y estudiantes acudan para realizar actividades educativas, deportivas o sociales"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09351935-0 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-39-0",
    "nombre": "GABRIEL",
    "apellido": "AQUINO SANTIAGO",
    "alias": [
      "Investigado"
    ],
    "dni": "46650238",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09351970-9"
    ],
    "domicilio_principal": "Pasaje 10 Angel Martinez Manzana 4, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento de estupefacientes de manera ocasional, a titulo gratuito, de escasa cantidad y con fines para el consumo personal de quien lo recepta"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09351970-9 radicada en OTRA SEDE POLICIAL. Fiscal: TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-40-0",
    "nombre": "ALEJANDRO",
    "apellido": "POLDI RAFAEL",
    "alias": [
      "Investigado"
    ],
    "dni": "36002032",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09353033-8"
    ],
    "domicilio_principal": "Risso 3309, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09353033-8 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 19° - PJE ALFONZO 10581. Fiscal: Fernandez, Eric Valerio; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-41-0",
    "nombre": "EMANUEL",
    "apellido": "DAMARIO MILTON",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-41",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09353218-7"
    ],
    "domicilio_principal": "CORONDA",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09353218-7 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-41-1",
    "nombre": "ORLANDO",
    "apellido": "BASSI LUIS",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-41",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09353218-7"
    ],
    "domicilio_principal": "CORONDA",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09353218-7 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-41-2",
    "nombre": "IVAN ANOTNIO",
    "apellido": "DAMARIO JOSÉ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-41",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09353218-7"
    ],
    "domicilio_principal": "CORONDA",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09353218-7 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-41-3",
    "nombre": "MIGUEL",
    "apellido": "LEIVA ORLANDO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-41",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09353218-7"
    ],
    "domicilio_principal": "CORONDA",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09353218-7 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-41-4",
    "nombre": "ABEL",
    "apellido": "LEIVA JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-41",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09353218-7"
    ],
    "domicilio_principal": "CORONDA",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09353218-7 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-42-0",
    "nombre": "ROMA",
    "apellido": "NARVAEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-42",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09354354-5"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09354354-5 radicada en MPA Regional 1. Fiscal: Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-43-0",
    "nombre": "KEVIN",
    "apellido": "KLUWAK",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-43",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09354808-3"
    ],
    "domicilio_principal": "SAN JUSTO",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo gratuito // Actos turbatorios o molestias"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09354808-3 radicada en U.R.XVI. SAN JUSTO - COMISARIA 1° - SAN JUSTO. Fiscal: Persello, Guillermo.",
    "activo": true
  },
  {
    "id": "p-insumo-43-1",
    "nombre": "ANDRES",
    "apellido": "GIORDANO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-43",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09354808-3"
    ],
    "domicilio_principal": "SAN JUSTO",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo gratuito // Actos turbatorios o molestias"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09354808-3 radicada en U.R.XVI. SAN JUSTO - COMISARIA 1° - SAN JUSTO. Fiscal: Persello, Guillermo.",
    "activo": true
  },
  {
    "id": "p-insumo-44-0",
    "nombre": "ABIGAIL",
    "apellido": "MOREL ERICA",
    "alias": [
      "Investigado"
    ],
    "dni": "43283288",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09355310-9"
    ],
    "domicilio_principal": "Providencia 1480, observaciones: Origen: RENAPER // J Paso 2348, observaciones: Origen: RENAPER // providencia 1439 // 1° De Mayo 2081, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09355310-9 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-44-1",
    "nombre": "LAUTARO",
    "apellido": "MOREL AGUSTIN",
    "alias": [
      "Investigado"
    ],
    "dni": "40925632",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09355310-9"
    ],
    "domicilio_principal": "Providencia 1480, observaciones: Origen: RENAPER // J Paso 2348, observaciones: Origen: RENAPER // providencia 1439 // 1° De Mayo 2081, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09355310-9 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-44-2",
    "nombre": "NO_INFORMA",
    "apellido": "MOREL SOL",
    "alias": [
      "Investigado"
    ],
    "dni": "35653997",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09355310-9"
    ],
    "domicilio_principal": "Providencia 1480, observaciones: Origen: RENAPER // J Paso 2348, observaciones: Origen: RENAPER // providencia 1439 // 1° De Mayo 2081, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09355310-9 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-44-3",
    "nombre": "CRISTIAN",
    "apellido": "MOREL NOEL",
    "alias": [
      "Investigado"
    ],
    "dni": "38897609",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09355310-9"
    ],
    "domicilio_principal": "Providencia 1480, observaciones: Origen: RENAPER // J Paso 2348, observaciones: Origen: RENAPER // providencia 1439 // 1° De Mayo 2081, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09355310-9 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-44-4",
    "nombre": "LUDMILA",
    "apellido": "MOREL MELANI",
    "alias": [
      "Investigado"
    ],
    "dni": "39860389",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09355310-9"
    ],
    "domicilio_principal": "Providencia 1480, observaciones: Origen: RENAPER // J Paso 2348, observaciones: Origen: RENAPER // providencia 1439 // 1° De Mayo 2081, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09355310-9 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-44-5",
    "nombre": "DAVID",
    "apellido": "BRAMUEL JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "46879141",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09355310-9"
    ],
    "domicilio_principal": "Providencia 1480, observaciones: Origen: RENAPER // J Paso 2348, observaciones: Origen: RENAPER // providencia 1439 // 1° De Mayo 2081, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09355310-9 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-44-6",
    "nombre": "GABRIEL",
    "apellido": "FLORES ADRIANO",
    "alias": [
      "Investigado"
    ],
    "dni": "46858515",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09355310-9"
    ],
    "domicilio_principal": "Providencia 1480, observaciones: Origen: RENAPER // J Paso 2348, observaciones: Origen: RENAPER // providencia 1439 // 1° De Mayo 2081, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09355310-9 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-45-0",
    "nombre": "GERARDO",
    "apellido": "SORIANO LUIS",
    "alias": [
      "Investigado"
    ],
    "dni": "42870770",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09355410-5"
    ],
    "domicilio_principal": "LUCIANO LEIVA 8500",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09355410-5 radicada en MPA Regional 1. Fiscal: Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-46-0",
    "nombre": "ORLANDO",
    "apellido": "SANCHEZ JORGE",
    "alias": [
      "Investigado"
    ],
    "dni": "23513240",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09355746-5"
    ],
    "domicilio_principal": "Valparaiso 3023, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09355746-5 radicada en MPA Regional 1. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-46-1",
    "nombre": "MARIA",
    "apellido": "RAMIREZ ROMINA",
    "alias": [
      "Investigado"
    ],
    "dni": "36010602",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09355746-5"
    ],
    "domicilio_principal": "Valparaiso 3023, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09355746-5 radicada en MPA Regional 1. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-47-0",
    "nombre": "FERNANDO",
    "apellido": "VISCONTI",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-47",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09356589-1"
    ],
    "domicilio_principal": "9 de Julio 1579",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte // Amenazas Simple"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09356589-1 radicada en U.R.XVIII. SAN MARTIN - COMISARIA 2° - SAN JORGE. Fiscal: Rodríguez y Barros, Diego Gustavo.",
    "activo": true
  },
  {
    "id": "p-insumo-50-0",
    "nombre": "DANIEL",
    "apellido": "GALLARDO PABLO",
    "alias": [
      "Investigado"
    ],
    "dni": "41994071",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09358764-9"
    ],
    "domicilio_principal": "Calle 7 555, observaciones: Origen: RENAPER // Casa 245, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09358764-9 radicada en MPA Regional 1. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-50-1",
    "nombre": "IGNACIO",
    "apellido": "FIGUEROA JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "31610216",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09358764-9"
    ],
    "domicilio_principal": "Calle 7 555, observaciones: Origen: RENAPER // Casa 245, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09358764-9 radicada en MPA Regional 1. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-51-0",
    "nombre": "MARÍA ELIDA",
    "apellido": "KORNCHU ROSA",
    "alias": [
      "Investigado"
    ],
    "dni": "28591696",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09358953-7"
    ],
    "domicilio_principal": "Hernandarias 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo oneroso"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09358953-7 radicada en U.R.VII. GARAY - COMISARIA 5°-CAYASTA. Fiscal: MPA.",
    "activo": true
  },
  {
    "id": "p-insumo-54-0",
    "nombre": "SOLEDAD",
    "apellido": "DUARTE NATALIA",
    "alias": [
      "Investigado"
    ],
    "dni": "24452358",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09359423-9"
    ],
    "domicilio_principal": "SAN FRANCISCO - MANZANA F",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09359423-9 radicada en OTRA SEDE POLICIAL. Fiscal: Cecchini, Francisco José.",
    "activo": true
  },
  {
    "id": "p-insumo-55-0",
    "nombre": "MAXIMILIANO",
    "apellido": "BAUCERO EMANUEL",
    "alias": [
      "Investigado"
    ],
    "dni": "35769601",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09359636-3"
    ],
    "domicilio_principal": "SAN JAVIER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09359636-3 radicada en OTRA SEDE POLICIAL. Fiscal: Cecchini, Francisco José.",
    "activo": true
  },
  {
    "id": "p-insumo-55-1",
    "nombre": "ENRIQUE",
    "apellido": "BAUCERO SEBASTIAN",
    "alias": [
      "Investigado"
    ],
    "dni": "40557613",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09359636-3"
    ],
    "domicilio_principal": "SAN JAVIER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09359636-3 radicada en OTRA SEDE POLICIAL. Fiscal: Cecchini, Francisco José.",
    "activo": true
  },
  {
    "id": "p-insumo-56-0",
    "nombre": "EZEQUIEL",
    "apellido": "MIÑO MARCOS",
    "alias": [
      "Investigado"
    ],
    "dni": "40452968",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09359711-4"
    ],
    "domicilio_principal": "Azopardo 304, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09359711-4 radicada en OTRA SEDE POLICIAL. Fiscal: Haidar, Arturo; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-57-0",
    "nombre": "LEANDRO",
    "apellido": "NUÑEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-57",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360227-4"
    ],
    "domicilio_principal": "IRIGOYEN",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360227-4 radicada en U.R.XV. SAN JERONIMO - CRIA. 17° - IRIGOYEN. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-59-0",
    "nombre": "NICOLÀS",
    "apellido": "LEGUIZAMON AGUSTÌN",
    "alias": [
      "Investigado"
    ],
    "dni": "41976317",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360246-0"
    ],
    "domicilio_principal": "4 De Julio 1650, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360246-0 radicada en U.R.XVI. SAN JUSTO - COMISARIA 3° GDOR. CRESPO. Fiscal: Persello, Guillermo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-0",
    "nombre": "CHAY",
    "apellido": "RANS GORDO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-1",
    "nombre": "JESICA",
    "apellido": "ROLDAN",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-2",
    "nombre": "ANTONIO",
    "apellido": "MISCIAGNA ANDRES",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-3",
    "nombre": "SANTINO",
    "apellido": "TAVERNA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-4",
    "nombre": "OSCAR",
    "apellido": "MELGAREJO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-5",
    "nombre": "ALEJANDRO",
    "apellido": "GOMEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-6",
    "nombre": "NICOLÁS",
    "apellido": "SAPRIETTO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-7",
    "nombre": "DAVID",
    "apellido": "GONZALEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-8",
    "nombre": "CLAUDIO",
    "apellido": "HEREDIA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-9",
    "nombre": "EZEQUIEL",
    "apellido": "REYES JONATAN",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-10",
    "nombre": "LUCAS",
    "apellido": "SOTTOCORNO CESAR",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-11",
    "nombre": "MIGUEL",
    "apellido": "PERALTA CARLOS",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-60-12",
    "nombre": "LUIS",
    "apellido": "LOZA JOSÉ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-60",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360262-2"
    ],
    "domicilio_principal": "GALVEZ",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360262-2 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-61-0",
    "nombre": "CELESTE",
    "apellido": "AVALOS",
    "alias": [
      "Investigado"
    ],
    "dni": "41515803",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360843-4"
    ],
    "domicilio_principal": "SAN JUSTO",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la administración pública Encubrimiento // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego calificada Tenencia ilegítima de arma de guerra // Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360843-4 radicada en U.R.XVI. SAN JUSTO - COMISARIA 2° - SAN JUSTO (BARRIO REYES). Fiscal: Persello, Guillermo.",
    "activo": true
  },
  {
    "id": "p-insumo-61-1",
    "nombre": "ANDRES",
    "apellido": "AVALOS",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-61",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360843-4"
    ],
    "domicilio_principal": "SAN JUSTO",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la administración pública Encubrimiento // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego calificada Tenencia ilegítima de arma de guerra // Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360843-4 radicada en U.R.XVI. SAN JUSTO - COMISARIA 2° - SAN JUSTO (BARRIO REYES). Fiscal: Persello, Guillermo.",
    "activo": true
  },
  {
    "id": "p-insumo-61-2",
    "nombre": "WILLIANS",
    "apellido": "PORTILLO",
    "alias": [
      "Investigado"
    ],
    "dni": "42329972",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09360843-4"
    ],
    "domicilio_principal": "SAN JUSTO",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la administración pública Encubrimiento // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego calificada Tenencia ilegítima de arma de guerra // Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09360843-4 radicada en U.R.XVI. SAN JUSTO - COMISARIA 2° - SAN JUSTO (BARRIO REYES). Fiscal: Persello, Guillermo.",
    "activo": true
  },
  {
    "id": "p-insumo-62-0",
    "nombre": "TAL POLACO",
    "apellido": "MAIDANA UN",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-62",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09361378-0"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09361378-0 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-63-0",
    "nombre": "JUAN",
    "apellido": "FRUTOS",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-63",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09362718-8"
    ],
    "domicilio_principal": "Necochea y Roque Saenz Peña",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09362718-8 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-64-0",
    "nombre": "FLORENCIA DAMARIS",
    "apellido": "[CONDENADO] GONZALEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "38596507",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09363274-2"
    ],
    "domicilio_principal": "Laprida 6229, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo gratuito agravados por ser cometido en las inmediaciones o en el interior de un establecimiento de enseñanza, centro asistencial, lugar de detención, institución deportiva, cultural o social o en sitios donde se realicen espectáculos o diversiones públicos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09363274-2 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-65-0",
    "nombre": "ANDRES",
    "apellido": "JUAREZ ANTONIO",
    "alias": [
      "Investigado"
    ],
    "dni": "34650551",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09365255-7"
    ],
    "domicilio_principal": "Azopardo 10376, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09365255-7 radicada en U.R.I. LA CAPITAL - COMISARIA DISTRITO 16-RECREO. Fiscal: Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-66-0",
    "nombre": "RUFINO",
    "apellido": "BUSTOS RODRIGO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-66",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09365341-3"
    ],
    "domicilio_principal": "PASAJE KOCH 1117",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09365341-3 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-67-0",
    "nombre": "ARIEL",
    "apellido": "SIMI CARLOS",
    "alias": [
      "Investigado"
    ],
    "dni": "37571861",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09366518-7"
    ],
    "domicilio_principal": "Mosconi 3650, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09366518-7 radicada en OTRA SEDE POLICIAL. Fiscal: NUZZO, MARIA LUCILA.",
    "activo": true
  },
  {
    "id": "p-insumo-68-0",
    "nombre": "DAMIAN",
    "apellido": "SEGOVIA WALTER",
    "alias": [
      "Investigado"
    ],
    "dni": "41287722",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09366681-7"
    ],
    "domicilio_principal": "Cortada Arijon 1188, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09366681-7 radicada en U.R.XV. SAN JERONIMO - CRIA. 1° - CORONDA. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-69-0",
    "nombre": "ALEJANDRO",
    "apellido": "GARCIA DIEGO",
    "alias": [
      "Investigado"
    ],
    "dni": "46539847",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09366825-9"
    ],
    "domicilio_principal": "Pje. Cervantes 4600, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte // Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por la intervención de tres o más personas organizadas para cometerlos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09366825-9 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura; GIAVEDONI, ESTANISLAO DAVID; MARCHI, ANDRÉS ENRIQUE.",
    "activo": true
  },
  {
    "id": "p-insumo-69-1",
    "nombre": "ARMANDO",
    "apellido": "GARCIA GABRIEL",
    "alias": [
      "Investigado"
    ],
    "dni": "41932470",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09366825-9"
    ],
    "domicilio_principal": "Pje. Cervantes 4600, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte // Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por la intervención de tres o más personas organizadas para cometerlos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09366825-9 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura; GIAVEDONI, ESTANISLAO DAVID; MARCHI, ANDRÉS ENRIQUE.",
    "activo": true
  },
  {
    "id": "p-insumo-70-0",
    "nombre": "ANDREA",
    "apellido": "BENITEZ ROMINA",
    "alias": [
      "Investigado"
    ],
    "dni": "31200538",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09367310-4"
    ],
    "domicilio_principal": "Entre Rios 2431, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09367310-4 radicada en MPA Regional 1. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-71-0",
    "nombre": "MARTIN",
    "apellido": "GUTIERREZ EMANUEL",
    "alias": [
      "Investigado"
    ],
    "dni": "37329547",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09367490-9"
    ],
    "domicilio_principal": "Soler 1983, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09367490-9 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-72-0",
    "nombre": "SEBASTIAN CESAR",
    "apellido": "[CONDENADO] DAPERNO",
    "alias": [
      "Investigado"
    ],
    "dni": "30452887",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09368827-6"
    ],
    "domicilio_principal": "Juan De Garay 1264, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por ser cometido en las inmediaciones o en el interior de un establecimiento de enseñanza, centro asistencial, lugar de detención, institución deportiva, cultural o social o en sitios donde se realicen espectáculos o diversiones públicos o en otros lugares a los que escolares y estudiantes acudan para realizar actividades educativas, deportivas o sociales"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09368827-6 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-74-0",
    "nombre": "GUSTAVO",
    "apellido": "CEPEDA MATIAS",
    "alias": [
      "Investigado"
    ],
    "dni": "19018111",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09369835-2"
    ],
    "domicilio_principal": "Espinillo 3690, observaciones: Origen: RENAPER // Guatemala 255, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09369835-2 radicada en MPA Regional 1. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-74-1",
    "nombre": "SAMUEL",
    "apellido": "CORVALAN PABLO",
    "alias": [
      "Investigado"
    ],
    "dni": "37281464",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09369835-2"
    ],
    "domicilio_principal": "Espinillo 3690, observaciones: Origen: RENAPER // Guatemala 255, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09369835-2 radicada en MPA Regional 1. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-75-0",
    "nombre": "VANESA",
    "apellido": "CACERES JESICA",
    "alias": [
      "Investigado"
    ],
    "dni": "26716529",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09370534-0"
    ],
    "domicilio_principal": "Lavalle 5081, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09370534-0 radicada en U.R.I. LA CAPITAL - SECCIONAL 5°. Fiscal: DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-77-0",
    "nombre": "ANTONIO",
    "apellido": "GAUNA PEDRO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-77",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09371632-6"
    ],
    "domicilio_principal": "DR. ZAVALLA Y REGIMIENTO 12 DE INFANTERIA",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte // Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09371632-6 radicada en U.R.I. LA CAPITAL - COMISARIA 26°-B° POMPEYA. Fiscal: Cecchini, Manuel Eduardo.",
    "activo": true
  },
  {
    "id": "p-insumo-78-0",
    "nombre": "AGUSTINA",
    "apellido": "VAZQUEZ SOL",
    "alias": [
      "Investigado"
    ],
    "dni": "42559399",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09372470-1"
    ],
    "domicilio_principal": "GOBERNADOR FREYRE 8074 // ESTRADA 7750",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09372470-1 radicada en MPA Regional 1. Fiscal: Tolosa, Yanina Aurora.",
    "activo": true
  },
  {
    "id": "p-insumo-78-1",
    "nombre": "MARIANO ANTONIO",
    "apellido": "[CONDENADO] ACOSTA BLAS",
    "alias": [
      "Investigado"
    ],
    "dni": "37075193",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09372470-1"
    ],
    "domicilio_principal": "GOBERNADOR FREYRE 8074 // ESTRADA 7750",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09372470-1 radicada en MPA Regional 1. Fiscal: Tolosa, Yanina Aurora.",
    "activo": true
  },
  {
    "id": "p-insumo-80-0",
    "nombre": "MAYRA SOLANGE",
    "apellido": "[CONDENADO] MUÑOZ",
    "alias": [
      "Investigado"
    ],
    "dni": "40647061",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09372619-4"
    ],
    "domicilio_principal": "Cafferata 8370, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09372619-4 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-80-1",
    "nombre": "ALCIDES RAÚL",
    "apellido": "[CONDENADO] MENDIETA JOAQUÍN",
    "alias": [
      "Investigado"
    ],
    "dni": "43286693",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09372619-4"
    ],
    "domicilio_principal": "Cafferata 8370, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09372619-4 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-80-2",
    "nombre": "IRUPE NO_INFORMA",
    "apellido": "[CONDENADO] MENDOZA CANDELA",
    "alias": [
      "Investigado"
    ],
    "dni": "45217651",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09372619-4"
    ],
    "domicilio_principal": "Cafferata 8370, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09372619-4 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-82-0",
    "nombre": "SOLEDAD",
    "apellido": "ZEBALLOS SILVIA",
    "alias": [
      "Investigado"
    ],
    "dni": "31233549",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09384485-5"
    ],
    "domicilio_principal": "CALLE S/N Bº NUEVA ESPERANZA",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil // Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por la intervención de tres o más personas organizadas para cometerlos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09384485-5 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-82-1",
    "nombre": "OCAMPO",
    "apellido": "MONDAQUE SEVEDO",
    "alias": [
      "Investigado"
    ],
    "dni": "18831867",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09384485-5"
    ],
    "domicilio_principal": "CALLE S/N Bº NUEVA ESPERANZA",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil // Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por la intervención de tres o más personas organizadas para cometerlos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09384485-5 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-85-0",
    "nombre": "LOURDES",
    "apellido": "SCHEFFER",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-85",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09374651-9"
    ],
    "domicilio_principal": "CAMINO VIEJO ESPERANZA Y RIO NEGRO",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la integridad sexual Víctima menor de 16 años (estupro) Abuso sexual Con acceso carnal // Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09374651-9 radicada en MPA Regional 1. Fiscal: Del Río Ayala, Alejandra.",
    "activo": true
  },
  {
    "id": "p-insumo-86-0",
    "nombre": "GUILLERMO",
    "apellido": "ORONAO",
    "alias": [
      "Investigado"
    ],
    "dni": "40825964",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09375286-1"
    ],
    "domicilio_principal": "Torre 8 0, observaciones: Origen: RENAPER // MONSEÑOR ZASPE 3924 3924, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09375286-1 radicada en MPA Regional 1. Fiscal: Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-86-1",
    "nombre": "AGUSTIN EUSEBIO",
    "apellido": "HOYO RODRIGO",
    "alias": [
      "Investigado"
    ],
    "dni": "43579055",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09375286-1"
    ],
    "domicilio_principal": "Torre 8 0, observaciones: Origen: RENAPER // MONSEÑOR ZASPE 3924 3924, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09375286-1 radicada en MPA Regional 1. Fiscal: Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-89-0",
    "nombre": "MAXIMILIANO",
    "apellido": "VEJETTI",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-89",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09375290-9"
    ],
    "domicilio_principal": "25 DE MAYO 2232",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09375290-9 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-90-0",
    "nombre": "NAZARENO JESUS",
    "apellido": "[CRIT_OPORT] VEGA GERONIMO",
    "alias": [
      "Investigado"
    ],
    "dni": "45269287",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09375291-8"
    ],
    "domicilio_principal": "Manzana 2 Casa 5, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09375291-8 radicada en MPA Regional 1. Fiscal: Haidar, Arturo; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-91-0",
    "nombre": "RAMON",
    "apellido": "LENCINAS JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "42533058",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09375292-6"
    ],
    "domicilio_principal": "J.j.paso Y J.d.peron 0, observaciones: Origen: RENAPER // ARTIGAS 545, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09375292-6 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Cecchini, Manuel Eduardo.",
    "activo": true
  },
  {
    "id": "p-insumo-91-1",
    "nombre": "JAVIER",
    "apellido": "MENDOZA LUCAS",
    "alias": [
      "Investigado"
    ],
    "dni": "41258623",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09375292-6"
    ],
    "domicilio_principal": "J.j.paso Y J.d.peron 0, observaciones: Origen: RENAPER // ARTIGAS 545, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09375292-6 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Cecchini, Manuel Eduardo.",
    "activo": true
  },
  {
    "id": "p-insumo-91-2",
    "nombre": "OTRO NO POSEE",
    "apellido": "RAMIREZ YAPURA SAUL",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-91",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09375292-6"
    ],
    "domicilio_principal": "J.j.paso Y J.d.peron 0, observaciones: Origen: RENAPER // ARTIGAS 545, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09375292-6 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Cecchini, Manuel Eduardo.",
    "activo": true
  },
  {
    "id": "p-insumo-96-0",
    "nombre": "TOMAS",
    "apellido": "GAUCHAT",
    "alias": [
      "Investigado"
    ],
    "dni": "42330949",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09376045-7"
    ],
    "domicilio_principal": "Lino Terford 2392, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09376045-7 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-97-0",
    "nombre": "PEDRO",
    "apellido": "VERA NICOLAS",
    "alias": [
      "Investigado"
    ],
    "dni": "33559220",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09376252-2"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09376252-2 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Cecchini, Manuel Eduardo.",
    "activo": true
  },
  {
    "id": "p-insumo-98-0",
    "nombre": "DAMIAN",
    "apellido": "GOROSITO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-98",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09384478-2"
    ],
    "domicilio_principal": "Chubut 4486, observaciones: Origen: RENAPER // ayacucho , calleEntre1: San Juan, barrio: Pompeya, observaciones: casa color roja, hay un ternero afuera // Pavon 3847, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09384478-2 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-98-1",
    "nombre": "FERNANDO CATRIEL",
    "apellido": "[CONDENADO] REIGERT",
    "alias": [
      "Investigado"
    ],
    "dni": "39860310",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09384478-2"
    ],
    "domicilio_principal": "Chubut 4486, observaciones: Origen: RENAPER // ayacucho , calleEntre1: San Juan, barrio: Pompeya, observaciones: casa color roja, hay un ternero afuera // Pavon 3847, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09384478-2 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-98-2",
    "nombre": "OLGA ESTHER",
    "apellido": "[CONDENADO] CABALLERO",
    "alias": [
      "Investigado"
    ],
    "dni": "32763452",
    "sexo": "M",
    "roles": [
      "imputado armado",
      "investigado"
    ],
    "score_peligrosidad": 7,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09384478-2"
    ],
    "domicilio_principal": "Chubut 4486, observaciones: Origen: RENAPER // ayacucho , calleEntre1: San Juan, barrio: Pompeya, observaciones: casa color roja, hay un ternero afuera // Pavon 3847, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la seguridad pública Tenencia ilegítima de armas de fuego de uso civil"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09384478-2 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-99-0",
    "nombre": "ALIAS: PECO",
    "apellido": "MARTINEZ MARIA JOSE",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-99",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09376869-5"
    ],
    "domicilio_principal": "JUAN DIAZ DE SOLIS (ENTRE HUERGO Y LLERENA) , observaciones: EL FRENTE ESTARÌA PINTADO DE COLOR AMARILLO, EN EL LUGAR FUNCIONARÌA UN KIOSCO, Y LA VIVIENDA CONTARÌA CON DOS PLANTAS",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09376869-5 radicada en MPA Regional 1. Fiscal: NUZZO, MARIA LUCILA; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-103-0",
    "nombre": "JONATAN",
    "apellido": "SILVA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-103",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09376881-4"
    ],
    "domicilio_principal": "REPUBLICA DE CHILE 3915",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09376881-4 radicada en OTRA SEDE POLICIAL. Fiscal: Haidar, Arturo; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-104-0",
    "nombre": "BERTA",
    "apellido": "LEIS VERONICA",
    "alias": [
      "Investigado"
    ],
    "dni": "32871231",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09377176-9"
    ],
    "domicilio_principal": "Independencia 621, observaciones: Origen: RENAPER // SILVESTRO S/N",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09377176-9 radicada en OTRA SEDE POLICIAL. Fiscal: Grimberg, Federico Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-104-1",
    "nombre": "EDUARDO",
    "apellido": "ROBLEDO MARTIN",
    "alias": [
      "Investigado"
    ],
    "dni": "33654907",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09377176-9"
    ],
    "domicilio_principal": "Independencia 621, observaciones: Origen: RENAPER // SILVESTRO S/N",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09377176-9 radicada en OTRA SEDE POLICIAL. Fiscal: Grimberg, Federico Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-104-2",
    "nombre": "JAVIER",
    "apellido": "GOMEZ PABLO",
    "alias": [
      "Investigado"
    ],
    "dni": "24848194",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09377176-9"
    ],
    "domicilio_principal": "Independencia 621, observaciones: Origen: RENAPER // SILVESTRO S/N",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09377176-9 radicada en OTRA SEDE POLICIAL. Fiscal: Grimberg, Federico Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-106-0",
    "nombre": "JUAN",
    "apellido": "FRUTOS",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-106",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09377780-5"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09377780-5 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-107-0",
    "nombre": "ANGELA",
    "apellido": "BERON MARIANA",
    "alias": [
      "Investigado"
    ],
    "dni": "36264760",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09378068-7"
    ],
    "domicilio_principal": "DIAZ DE SOLIS 4147 // COCHABAMBA 4183",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09378068-7 radicada en MPA Regional 1. Fiscal: Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-107-1",
    "nombre": "ESTEBAN ARIEL",
    "apellido": "MESA CLAUDIO",
    "alias": [
      "Investigado"
    ],
    "dni": "26614148",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09378068-7"
    ],
    "domicilio_principal": "DIAZ DE SOLIS 4147 // COCHABAMBA 4183",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09378068-7 radicada en MPA Regional 1. Fiscal: Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-108-0",
    "nombre": "NESTOR",
    "apellido": "CARPENZANO PABLO",
    "alias": [
      "Investigado"
    ],
    "dni": "43398149",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09378074-1"
    ],
    "domicilio_principal": "Ignacio Crespo 6710, observaciones: Origen: RENAPER // Ex Combatiente De Malvinas 7100, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09378074-1 radicada en U.R.I. LA CAPITAL - SECCIONAL 7°. Fiscal: Vigo Fierro, Diego Fernando; Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-108-1",
    "nombre": "FEDERICO JOAQUÌN",
    "apellido": "JUAREZ TOBÌAS",
    "alias": [
      "Investigado"
    ],
    "dni": "47105802",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09378074-1"
    ],
    "domicilio_principal": "Ignacio Crespo 6710, observaciones: Origen: RENAPER // Ex Combatiente De Malvinas 7100, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09378074-1 radicada en U.R.I. LA CAPITAL - SECCIONAL 7°. Fiscal: Vigo Fierro, Diego Fernando; Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-109-0",
    "nombre": "NICOLÁS",
    "apellido": "VALENZUELA LAUTARO",
    "alias": [
      "Investigado"
    ],
    "dni": "45506699",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09379030-5"
    ],
    "domicilio_principal": "French 2900, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09379030-5 radicada en U.R.I. LA CAPITAL - SECCIONAL 3°. Fiscal: DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-110-0",
    "nombre": "NAHUEL",
    "apellido": "CAMAÑO SANTIAGO",
    "alias": [
      "Investigado"
    ],
    "dni": "43806012",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09379430-0"
    ],
    "domicilio_principal": "Dr. Caviglia 1270, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09379430-0 radicada en U.R.I. LA CAPITAL - COMISARIA DISTRITO 19-SAUCE VIEJO. Fiscal: Fernandez, Eric Valerio; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-111-0",
    "nombre": "ALFREDO",
    "apellido": "CASSIET HECTOR",
    "alias": [
      "Investigado"
    ],
    "dni": "16178366",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09380510-8"
    ],
    "domicilio_principal": "FRENCH 2552",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09380510-8 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-112-0",
    "nombre": "JUAN SEBASTIÁN",
    "apellido": "[CRIT_OPORT] ALTAMIRANO",
    "alias": [
      "Investigado"
    ],
    "dni": "45805206",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09381434-4"
    ],
    "domicilio_principal": "BERNARDO DE IRIGOYEN 6776",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09381434-4 radicada en MPA Regional 1. Fiscal: Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-113-0",
    "nombre": "CARLOS",
    "apellido": "FERNANDEZ JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "34822807",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09381755-6"
    ],
    "domicilio_principal": "Sarsotti 6588, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09381755-6 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-114-0",
    "nombre": "ISAIAS",
    "apellido": "LOPEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-114",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09381754-8"
    ],
    "domicilio_principal": "Balbiano 1780",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09381754-8 radicada en U.R.XV. SAN JERONIMO - CRIA. 2° - GALVEZ. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-116-0",
    "nombre": "EXEQUIEL",
    "apellido": "OBREGON KEVIN",
    "alias": [
      "Investigado"
    ],
    "dni": "42242769",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09382968-6"
    ],
    "domicilio_principal": "Demetrio Gomez - Int. 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09382968-6 radicada en MPA Regional 1. Fiscal: DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-117-0",
    "nombre": "MATÍAS",
    "apellido": "BAILETTI JOSÉ",
    "alias": [
      "Investigado"
    ],
    "dni": "33748012",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09383398-5"
    ],
    "domicilio_principal": "Av. Galicia 1215, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09383398-5 radicada en OTRA SEDE POLICIAL. Fiscal: Vigo Fierro, Diego Fernando; TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-119-0",
    "nombre": "JONATAN",
    "apellido": "CARO NAHUEL",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-119",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09385139-8"
    ],
    "domicilio_principal": "GRAL. PAZ 9600",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Delitos contra la propiedad Hurto Simple // Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09385139-8 radicada en U.R.I. LA CAPITAL - SECCIONAL 8°. Fiscal: Fontana, César Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-120-0",
    "nombre": "SELENE",
    "apellido": "MENDOZA BRISA",
    "alias": [
      "Investigado"
    ],
    "dni": "41513818",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09385320-9"
    ],
    "domicilio_principal": "Lamadrid 4160, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09385320-9 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 17° - B° ESTANISLAO LOPEZ. Fiscal: Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-121-0",
    "nombre": "YANINA",
    "apellido": "AYALA MICAELA",
    "alias": [
      "Investigado"
    ],
    "dni": "19095464",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09385339-0"
    ],
    "domicilio_principal": "Km 4 Irapitá Y Pje S/n 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09385339-0 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 17° - B° ESTANISLAO LOPEZ. Fiscal: Fernandez, Eric Valerio.",
    "activo": true
  },
  {
    "id": "p-insumo-123-0",
    "nombre": "LOURDES",
    "apellido": "SCHEFFER",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-123",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09385666-7"
    ],
    "domicilio_principal": "CAMINO VIEJO ESPERANZA Y RÍO NEGRO",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por ser en perjuicio de mujeres embarazadas o de personas disminuidas psíquicamente, o sirviéndose de menores de dieciocho años o sin perjuicio de éstos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09385666-7 radicada en MPA Regional 1. Fiscal: MPA.",
    "activo": true
  },
  {
    "id": "p-insumo-126-0",
    "nombre": "ISAIAS",
    "apellido": "RIVAS MILTON",
    "alias": [
      "Investigado"
    ],
    "dni": "45951683",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09387471-1"
    ],
    "domicilio_principal": "Demetrio Gomez - Mz 6 0, observaciones: Origen: RENAPER // Manzana 6 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09387471-1 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-126-1",
    "nombre": "NICOLAS",
    "apellido": "LOPEZ GASPAR",
    "alias": [
      "Investigado"
    ],
    "dni": "45637412",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09387471-1"
    ],
    "domicilio_principal": "Demetrio Gomez - Mz 6 0, observaciones: Origen: RENAPER // Manzana 6 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09387471-1 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-128-0",
    "nombre": "BEATRIZ",
    "apellido": "BUSTOS MÓNICA",
    "alias": [
      "Investigado"
    ],
    "dni": "22592191",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09389653-7"
    ],
    "domicilio_principal": "Av Caseros 98, observaciones: Origen: RENAPER // DIAZ VELEZ 4094, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo gratuito agravados por ser cometido en las inmediaciones o en el interior de un establecimiento de enseñanza, centro asistencial, lugar de detención, institución deportiva, cultural o social o en sitios donde se realicen espectáculos o diversiones públicos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09389653-7 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-128-1",
    "nombre": "VERONICA",
    "apellido": "OJEDA ANALIA",
    "alias": [
      "Investigado"
    ],
    "dni": "24656136",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09389653-7"
    ],
    "domicilio_principal": "Av Caseros 98, observaciones: Origen: RENAPER // DIAZ VELEZ 4094, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo gratuito agravados por ser cometido en las inmediaciones o en el interior de un establecimiento de enseñanza, centro asistencial, lugar de detención, institución deportiva, cultural o social o en sitios donde se realicen espectáculos o diversiones públicos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09389653-7 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-129-0",
    "nombre": "ALBERTO",
    "apellido": "EMMERT CARLOS",
    "alias": [
      "Investigado"
    ],
    "dni": "25831754",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09391495-0"
    ],
    "domicilio_principal": "25 De Mayo 1411, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09391495-0 radicada en U.R.I. LA CAPITAL - COMISARIA DISTRITO 12-SANTO TOME. Fiscal: DE PEDRO SOTTINI, OMAR LEONARDO.",
    "activo": true
  },
  {
    "id": "p-insumo-130-0",
    "nombre": "JOEL",
    "apellido": "BENAVIDES JAIRO",
    "alias": [
      "Investigado"
    ],
    "dni": "44307109",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09391715-1"
    ],
    "domicilio_principal": "E. Zeballos 5467, observaciones: Origen: RENAPER // Colon 467, observaciones: Origen: RENAPER // Zona Urbana 00, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09391715-1 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-130-1",
    "nombre": "ALEXIS",
    "apellido": "OJEDA JONATAN",
    "alias": [
      "Investigado"
    ],
    "dni": "32059599",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09391715-1"
    ],
    "domicilio_principal": "E. Zeballos 5467, observaciones: Origen: RENAPER // Colon 467, observaciones: Origen: RENAPER // Zona Urbana 00, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09391715-1 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-130-2",
    "nombre": "MAXIMILIANO",
    "apellido": "MILANESIO CRISTIAN",
    "alias": [
      "Investigado"
    ],
    "dni": "37451803",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09391715-1"
    ],
    "domicilio_principal": "E. Zeballos 5467, observaciones: Origen: RENAPER // Colon 467, observaciones: Origen: RENAPER // Zona Urbana 00, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09391715-1 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-131-0",
    "nombre": "MARTIN",
    "apellido": "AGUIRRE LEONEL",
    "alias": [
      "Investigado"
    ],
    "dni": "40053368",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09391717-8"
    ],
    "domicilio_principal": "Manzana 5, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09391717-8 radicada en MPA Regional 1. Fiscal: Lascurain, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-132-0",
    "nombre": "MATIAS",
    "apellido": "MARTINEZ JORGE",
    "alias": [
      "Investigado"
    ],
    "dni": "44024759",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09391735-6"
    ],
    "domicilio_principal": "Los Cardenales Alt 200 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Siembra, cultivo de plantas o guarda de semillas, precursores químicos o cualquier otra materia prima para la producción y fabricación de estupefacientes cuando sea para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09391735-6 radicada en MPA Regional 1. Fiscal: Fernandez, Eric Valerio; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-133-0",
    "nombre": "VALENTINA",
    "apellido": "DUTRUEL DANA",
    "alias": [
      "Investigado"
    ],
    "dni": "42181459",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09391983-9"
    ],
    "domicilio_principal": "AUTOPISTA SANTA FE- ROSARIO KM 141",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09391983-9 radicada en U.R.I. LA CAPITAL - COMISARIA DISTRITO 19-SAUCE VIEJO. Fiscal: TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-135-0",
    "nombre": "GABRIEL",
    "apellido": "ANDRES CRISTIAN",
    "alias": [
      "Investigado"
    ],
    "dni": "34565182",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09392279-1"
    ],
    "domicilio_principal": "Velez Sarsfield 4280, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09392279-1 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-136-0",
    "nombre": "LEONEL",
    "apellido": "RAVELLI MATIAS",
    "alias": [
      "Investigado"
    ],
    "dni": "37153278",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09393124-3"
    ],
    "domicilio_principal": "2do. Pasaje 7250, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09393124-3 radicada en U.R.I. LA CAPITAL - COMISARIA DISTRITO 19-SAUCE VIEJO. Fiscal: Vigo Fierro, Diego Fernando; Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-138-0",
    "nombre": "FABRICIO",
    "apellido": "VALDEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-138",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09394163-9"
    ],
    "domicilio_principal": "HELVECIA",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09394163-9 radicada en OTRA SEDE POLICIAL. Fiscal: HERNÁNDEZ, EZEQUIEL.",
    "activo": true
  },
  {
    "id": "p-insumo-139-0",
    "nombre": "PEDRO RAFAEL",
    "apellido": "ABALOS YAIR",
    "alias": [
      "Investigado"
    ],
    "dni": "43840883",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09395206-2"
    ],
    "domicilio_principal": "Mocovi 10200, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09395206-2 radicada en MPA Regional 1. Fiscal: Arri, María Gabriela.",
    "activo": true
  },
  {
    "id": "p-insumo-140-0",
    "nombre": "ESTEBAN",
    "apellido": "CABRERA GUILLERMO",
    "alias": [
      "Investigado"
    ],
    "dni": "44654863",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09395503-7"
    ],
    "domicilio_principal": "Manzana 3 Pasaje 16 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09395503-7 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-141-0",
    "nombre": "LORE",
    "apellido": "OLIVERA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-141",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09411591-1"
    ],
    "domicilio_principal": "Entre Ríos 1393, calleEntre1: Tucuman, calleEntre2: Estados Unidos de Mexico",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09411591-1 radicada en MPA Regional 1. Fiscal: Urquiza, María Laura.",
    "activo": true
  },
  {
    "id": "p-insumo-142-0",
    "nombre": "ANDRES",
    "apellido": "PERISSUTTI JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "41490606",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09396423-0"
    ],
    "domicilio_principal": "J M Gutierrez 1838, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09396423-0 radicada en MPA Regional 1. Fiscal: MPA.",
    "activo": true
  },
  {
    "id": "p-insumo-143-0",
    "nombre": "NOELIA",
    "apellido": "ANDERSEN MELINA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-143",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09396866-9"
    ],
    "domicilio_principal": "ESTANISLAO ZEBALLOS (INSTERSECCION CON 3ER PJE.) 8250",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por la intervención de tres o más personas organizadas para cometerlos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09396866-9 radicada en MPA Regional 1. Fiscal: NUZZO, MARIA LUCILA.",
    "activo": true
  },
  {
    "id": "p-insumo-143-1",
    "nombre": "LOS MILAGROS",
    "apellido": "TABORDA MARIA DE",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-143",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09396866-9"
    ],
    "domicilio_principal": "ESTANISLAO ZEBALLOS (INSTERSECCION CON 3ER PJE.) 8250",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por la intervención de tres o más personas organizadas para cometerlos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09396866-9 radicada en MPA Regional 1. Fiscal: NUZZO, MARIA LUCILA.",
    "activo": true
  },
  {
    "id": "p-insumo-143-2",
    "nombre": "JAVIER",
    "apellido": "BERDUN LUCAS",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-143",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09396866-9"
    ],
    "domicilio_principal": "ESTANISLAO ZEBALLOS (INSTERSECCION CON 3ER PJE.) 8250",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por la intervención de tres o más personas organizadas para cometerlos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09396866-9 radicada en MPA Regional 1. Fiscal: NUZZO, MARIA LUCILA.",
    "activo": true
  },
  {
    "id": "p-insumo-143-3",
    "nombre": "JOSE",
    "apellido": "TABORDA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-143",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09396866-9"
    ],
    "domicilio_principal": "ESTANISLAO ZEBALLOS (INSTERSECCION CON 3ER PJE.) 8250",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por la intervención de tres o más personas organizadas para cometerlos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09396866-9 radicada en MPA Regional 1. Fiscal: NUZZO, MARIA LUCILA.",
    "activo": true
  },
  {
    "id": "p-insumo-143-4",
    "nombre": "JORGE",
    "apellido": "TABORDA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-143",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09396866-9"
    ],
    "domicilio_principal": "ESTANISLAO ZEBALLOS (INSTERSECCION CON 3ER PJE.) 8250",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte agravados por la intervención de tres o más personas organizadas para cometerlos"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09396866-9 radicada en MPA Regional 1. Fiscal: NUZZO, MARIA LUCILA.",
    "activo": true
  },
  {
    "id": "p-insumo-144-0",
    "nombre": "ROBERTO",
    "apellido": "ZABALA MARIO",
    "alias": [
      "Investigado"
    ],
    "dni": "39456930",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09397510-0"
    ],
    "domicilio_principal": "Rivadavia Y Alvear 0, observaciones: Origen: RENAPER // Pedro De Mendoza 6288, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09397510-0 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-144-1",
    "nombre": "ANTONIO",
    "apellido": "PEREZ JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "40311233",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09397510-0"
    ],
    "domicilio_principal": "Rivadavia Y Alvear 0, observaciones: Origen: RENAPER // Pedro De Mendoza 6288, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09397510-0 radicada en OTRA SEDE POLICIAL. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-146-0",
    "nombre": "MARCELO",
    "apellido": "GODOY",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-146",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09399546-2"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09399546-2 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Arri, María Gabriela.",
    "activo": true
  },
  {
    "id": "p-insumo-147-0",
    "nombre": "DANIEL",
    "apellido": "SANDOVAL",
    "alias": [
      "Investigado"
    ],
    "dni": "36877502",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09400016-2"
    ],
    "domicilio_principal": "CAVOUR 1337",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09400016-2 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-148-0",
    "nombre": "ANDRES",
    "apellido": "STRADA JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "43163643",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09400284-9"
    ],
    "domicilio_principal": "Urquiza 60, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09400284-9 radicada en MPA Regional 1. Fiscal: Benitez, Alejandro Franco.",
    "activo": true
  },
  {
    "id": "p-insumo-149-0",
    "nombre": "GUADALUPE",
    "apellido": "CONTRERAS CECILIA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-149",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09402299-9"
    ],
    "domicilio_principal": "Almonacid 4732, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09402299-9 radicada en MPA Regional 1. Fiscal: Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-149-1",
    "nombre": "ELIZABET",
    "apellido": "VALLEJO CINTIA",
    "alias": [
      "Investigado"
    ],
    "dni": "37153364",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09402299-9"
    ],
    "domicilio_principal": "Almonacid 4732, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09402299-9 radicada en MPA Regional 1. Fiscal: Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-150-0",
    "nombre": "AGUSTINA",
    "apellido": "SAN MILLAN",
    "alias": [
      "Investigado"
    ],
    "dni": "35127360",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09402446-0"
    ],
    "domicilio_principal": "La Paz 547, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09402446-0 radicada en OTRA SEDE POLICIAL. Fiscal: Urquiza, María Laura; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-151-0",
    "nombre": "DANIEL",
    "apellido": "LOZANO CARLOS",
    "alias": [
      "Investigado"
    ],
    "dni": "20725386",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09402793-1"
    ],
    "domicilio_principal": "Ramirez E Roca Y Ruta 11 S/n 00, observaciones: Origen: RENAPER // F Ramirez Y Roca 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09402793-1 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 15°-SANTO TOME. Fiscal: Vigo Fierro, Diego Fernando; TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-151-1",
    "nombre": "NICOLAS",
    "apellido": "LOZANO PABLO",
    "alias": [
      "Investigado"
    ],
    "dni": "37283578",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09402793-1"
    ],
    "domicilio_principal": "Ramirez E Roca Y Ruta 11 S/n 00, observaciones: Origen: RENAPER // F Ramirez Y Roca 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09402793-1 radicada en U.R.I. LA CAPITAL - SUBCOMISARIA 15°-SANTO TOME. Fiscal: Vigo Fierro, Diego Fernando; TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-152-0",
    "nombre": "LUIS",
    "apellido": "OVELAR JOSE",
    "alias": [
      "Investigado"
    ],
    "dni": "35653131",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09405069-0"
    ],
    "domicilio_principal": "Camino Viejo Esperanza 9205, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09405069-0 radicada en MPA Regional 1. Fiscal: MPA.",
    "activo": true
  },
  {
    "id": "p-insumo-154-0",
    "nombre": "EZEQUIEL",
    "apellido": "MUÑOZ EDUARDO",
    "alias": [
      "Investigado"
    ],
    "dni": "35653700",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09405446-7"
    ],
    "domicilio_principal": "Hipolito Irigoyen 4096, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09405446-7 radicada en OTRA SEDE POLICIAL. Fiscal: NUZZO, MARIA LUCILA.",
    "activo": true
  },
  {
    "id": "p-insumo-156-0",
    "nombre": "JOSÉ",
    "apellido": "MONTAÑO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-156",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09419325-4"
    ],
    "domicilio_principal": "Lavaisse , calleEntre1: Dr. Zavalla // Lavaisse , calleEntre1: Dr Zavalla",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09419325-4 radicada en MPA Regional 1. Fiscal: Escobar Cello, Luciana.",
    "activo": true
  },
  {
    "id": "p-insumo-156-1",
    "nombre": "FAMILIA",
    "apellido": "ESPINDOLA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-156",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09419325-4"
    ],
    "domicilio_principal": "Lavaisse , calleEntre1: Dr. Zavalla // Lavaisse , calleEntre1: Dr Zavalla",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09419325-4 radicada en MPA Regional 1. Fiscal: Escobar Cello, Luciana.",
    "activo": true
  },
  {
    "id": "p-insumo-156-2",
    "nombre": "FAMILIA",
    "apellido": "RÍOS",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-156",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09419325-4"
    ],
    "domicilio_principal": "Lavaisse , calleEntre1: Dr. Zavalla // Lavaisse , calleEntre1: Dr Zavalla",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09419325-4 radicada en MPA Regional 1. Fiscal: Escobar Cello, Luciana.",
    "activo": true
  },
  {
    "id": "p-insumo-157-0",
    "nombre": "MELODY SOL",
    "apellido": "[CONDENADO] PUERTAS",
    "alias": [
      "Investigado"
    ],
    "dni": "43124022",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09405724-5"
    ],
    "domicilio_principal": "ESTRADA 8504",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo gratuito"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09405724-5 radicada en U.R.I. LA CAPITAL - SECCIONAL 8°. Fiscal: MPA.",
    "activo": true
  },
  {
    "id": "p-insumo-159-0",
    "nombre": "EZEQUIEL",
    "apellido": "RODRIGUEZ JONATAN",
    "alias": [
      "Investigado"
    ],
    "dni": "36761806",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09406482-9"
    ],
    "domicilio_principal": "San Martin Al Oeste 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09406482-9 radicada en MPA Regional 1. Fiscal: Vigo Fierro, Diego Fernando; Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-160-0",
    "nombre": "CAROLINA",
    "apellido": "ISAAC GIULIANA",
    "alias": [
      "Investigado"
    ],
    "dni": "39570139",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09406863-8"
    ],
    "domicilio_principal": "Avellaneda 2363, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09406863-8 radicada en U.R.I. LA CAPITAL - COMISARIA DISTRITO 12-SANTO TOME. Fiscal: Vigo Fierro, Diego Fernando; FILIPPI, DANIEL ALBERTO.",
    "activo": true
  },
  {
    "id": "p-insumo-161-0",
    "nombre": "ALEJANDRO",
    "apellido": "CARBONARA RODRIGUEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-161",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09406964-2"
    ],
    "domicilio_principal": "RUTA NACIONAL 168",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09406964-2 radicada en OTRA SEDE POLICIAL. Fiscal: NUZZO, MARIA LUCILA.",
    "activo": true
  },
  {
    "id": "p-insumo-162-0",
    "nombre": "HORACIO",
    "apellido": "TORREZ HÉCTOR",
    "alias": [
      "Investigado"
    ],
    "dni": "41932284",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09407719-9"
    ],
    "domicilio_principal": "Pasaje M. De Irala 3851, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09407719-9 radicada en MPA Regional 1. Fiscal: Orio, Ignacio.",
    "activo": true
  },
  {
    "id": "p-insumo-163-0",
    "nombre": "ELIAS HUGO",
    "apellido": "[EJEC_SUSP] MARTINEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "40703402",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09408395-5"
    ],
    "domicilio_principal": "Av General Paz 8300 // Riobamba 8200",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09408395-5 radicada en MPA Regional 1. Fiscal: TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-163-1",
    "nombre": "JULIO",
    "apellido": "MARTINEZ JESUS",
    "alias": [
      "Investigado"
    ],
    "dni": "44525597",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09408395-5"
    ],
    "domicilio_principal": "Av General Paz 8300 // Riobamba 8200",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09408395-5 radicada en MPA Regional 1. Fiscal: TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-164-0",
    "nombre": "GABRIEL",
    "apellido": "LEONES FERNANDO",
    "alias": [
      "Investigado"
    ],
    "dni": "46367018",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09408830-2"
    ],
    "domicilio_principal": "ARISTOBULO QUIROZ Y DAMETRIO GOMEZ (Bº ALTO VERDE)",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09408830-2 radicada en MPA Regional 1. Fiscal: Peresin, Rosana Guadalupe.",
    "activo": true
  },
  {
    "id": "p-insumo-165-0",
    "nombre": "ALEXANDER",
    "apellido": "VILLA YOSEMIR",
    "alias": [
      "Investigado"
    ],
    "dni": "45652935",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09408833-7"
    ],
    "domicilio_principal": "Manzana 5 Pasaje 13 00, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09408833-7 radicada en MPA Regional 1. Fiscal: TROSSERO, CLELIA ANTONINA.",
    "activo": true
  },
  {
    "id": "p-insumo-166-1",
    "nombre": "EMANUEL",
    "apellido": "NAVARRETE MARCOS",
    "alias": [
      "Investigado"
    ],
    "dni": "39241279",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09408982-1"
    ],
    "domicilio_principal": "Teofilo Romang 560, observaciones: Origen: RENAPER // ARTIGAS 545, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09408982-1 radicada en MPA Regional 1. Fiscal: Nessier, Raúl Marcelo.",
    "activo": true
  },
  {
    "id": "p-insumo-167-0",
    "nombre": "GABRIEL",
    "apellido": "MOLINAS ALEXANDER",
    "alias": [
      "Investigado"
    ],
    "dni": "47105487",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09409973-8"
    ],
    "domicilio_principal": "Libertad 3815, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09409973-8 radicada en MPA Regional 1. Fiscal: Fernandez, Eric Valerio; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-167-1",
    "nombre": "SEBASTIAN",
    "apellido": "MOLINA LUCIANO",
    "alias": [
      "Investigado"
    ],
    "dni": "48468688",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09409973-8"
    ],
    "domicilio_principal": "Libertad 3815, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09409973-8 radicada en MPA Regional 1. Fiscal: Fernandez, Eric Valerio; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-168-0",
    "nombre": "RODRIGO",
    "apellido": "CORIA SACHA",
    "alias": [
      "Investigado"
    ],
    "dni": "39254815",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09411356-0"
    ],
    "domicilio_principal": "Comunidad Aborigen 0, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09411356-0 radicada en MPA Regional 1. Fiscal: MPA.",
    "activo": true
  },
  {
    "id": "p-insumo-169-0",
    "nombre": "FABRICIO",
    "apellido": "AQUINO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-169",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09411533-4"
    ],
    "domicilio_principal": "SAN JUSTO",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09411533-4 radicada en U.R.XVI. SAN JUSTO - CENTRO ORIENT.VICT. VIOL. FLIAR.Y SEXUAL. Fiscal: Persello, Guillermo.",
    "activo": true
  },
  {
    "id": "p-insumo-170-0",
    "nombre": "GABRIEL",
    "apellido": "LEIVA",
    "alias": [
      "Investigado"
    ],
    "dni": "39047301",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09411976-3"
    ],
    "domicilio_principal": "Carrel 2429, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09411976-3 radicada en U.R.XI. LAS COLONIAS - SUBCOMISARIA 18°- ESPERANZA. Fiscal: MPA.",
    "activo": true
  },
  {
    "id": "p-insumo-171-0",
    "nombre": "JAVIER",
    "apellido": "MELO ELIAN",
    "alias": [
      "Investigado"
    ],
    "dni": "45637550",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09413176-3"
    ],
    "domicilio_principal": "Luis Maggi 2546, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia de estupefacientes para consumo personal"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09413176-3 radicada en U.R.I. LA CAPITAL - COMISARIA DISTRITO 12-SANTO TOME. Fiscal: Vigo Fierro, Diego Fernando; APULLAN, ROBERTO GABRIEL.",
    "activo": true
  },
  {
    "id": "p-insumo-172-0",
    "nombre": "ALBERTO",
    "apellido": "BALSARINI GABRIEL",
    "alias": [
      "Investigado"
    ],
    "dni": "32521375",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09415640-5"
    ],
    "domicilio_principal": "Gral.lopez 2961, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Tenencia simple de estupefacientes"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09415640-5 radicada en U.R.I. LA CAPITAL - COMISARIA DISTRITO 19-SAUCE VIEJO. Fiscal: Nigro, Agustín María; Vigo Fierro, Diego Fernando.",
    "activo": true
  },
  {
    "id": "p-insumo-173-0",
    "nombre": "MILAGROS ARIADNA",
    "apellido": "[CONDENADO] AZCURRA",
    "alias": [
      "Investigado"
    ],
    "dni": "46040037",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 6,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": true,
    "estado_judicial": "PRISIÓN PREVENTIVA / PEDIDO DE DETENCIÓN",
    "cuij_asociados": [
      "21-09415667-7"
    ],
    "domicilio_principal": "1ro. De Mayo 7872, observaciones: Origen: RENAPER",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Entrega, suministro, aplicación o facilitamiento a otros estupefacientes a titulo gratuito"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09415667-7 radicada en U.R.I. LA CAPITAL - SECCIONAL 8°. Fiscal: Vigo Fierro, Diego Fernando; Arri, María Gabriela.",
    "activo": true
  },
  {
    "id": "p-insumo-174-0",
    "nombre": "DIOSNEL",
    "apellido": "AVALO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-174",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09361362-4"
    ],
    "domicilio_principal": "Colastine Norte - En la Entrada De la Ruta 1 Calle Rene Favaloro Casa 182 Pasillo Ruta 1 Casa 182, observaciones: Pasillo Casa 182",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09361362-4 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-175-0",
    "nombre": "BRISA",
    "apellido": "RAMIREZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-175",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09361319-5"
    ],
    "domicilio_principal": "Pasaje Leiva 3545",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09361319-5 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-176-0",
    "nombre": "JAVIER",
    "apellido": "RODRIGUEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-176",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09361344-6"
    ],
    "domicilio_principal": "4to pasaje entre primera junta y tucuman.",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09361344-6 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-176-1",
    "nombre": "SANDRO",
    "apellido": "ROMERO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-176",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09361344-6"
    ],
    "domicilio_principal": "4to pasaje entre primera junta y tucuman.",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09361344-6 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-180-0",
    "nombre": "N",
    "apellido": "N",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-180",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09362262-3"
    ],
    "domicilio_principal": "Santa Fe",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09362262-3 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-182-0",
    "nombre": "DIOSNEL",
    "apellido": "AVALO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-182",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09362311-5"
    ],
    "domicilio_principal": "Colastine Norte - Bañado - Enfrente del Dispensario - Casa 182 - Calle Rene Favaloro",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09362311-5 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-183-0",
    "nombre": "LAUTARO",
    "apellido": "SEGOVIA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-183",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09362456-1"
    ],
    "domicilio_principal": "Alberdi 3210",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09362456-1 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-189-0",
    "nombre": "ANDREA",
    "apellido": "ACOSTA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-189",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09362775-7"
    ],
    "domicilio_principal": "Padre Genesio y Denis",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09362775-7 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-190-0",
    "nombre": "JUAN",
    "apellido": "ESCOBAR",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-190",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09362845-1"
    ],
    "domicilio_principal": "Manuel Leiva 3555, calleEntre1: Jujuy, calleEntre2: Formoza",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09362845-1 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-193-0",
    "nombre": "MAXIMO",
    "apellido": "ROMERO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-193",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09363798-1"
    ],
    "domicilio_principal": "Melvin Jones 835",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09363798-1 radicada en OTRA SEDE POLICIAL. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-194-0",
    "nombre": "MARIA",
    "apellido": "RAMIREZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-194",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09363848-1"
    ],
    "domicilio_principal": "Estanislao Zeballos y 4to pasaje",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09363848-1 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-194-1",
    "nombre": "ROBERTO",
    "apellido": "BORDA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-194",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09363848-1"
    ],
    "domicilio_principal": "Estanislao Zeballos y 4to pasaje",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09363848-1 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-198-0",
    "nombre": "ALIAS PAPU",
    "apellido": "AVALOS DIOSNEL",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-198",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09364563-1"
    ],
    "domicilio_principal": "Rene favaloro S/N",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09364563-1 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-204-0",
    "nombre": "JESSICA",
    "apellido": "ROMERO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-204",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09365526-2"
    ],
    "domicilio_principal": "Cordoba 2255, calleEntre1: Belgrano, calleEntre2: Republica de Siria, observaciones: Casa tipo Racho en Ciclovia",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09365526-2 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-208-0",
    "nombre": "CARLOS",
    "apellido": "PIPO JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-208",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09365763-9"
    ],
    "domicilio_principal": "Espora 639, calleEntre1: Patricio Cullen, calleEntre2: Antonia godoy, observaciones: pasillo, depto 2",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09365763-9 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-209-0",
    "nombre": "GIUSTI",
    "apellido": "MAXIMILIANO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-209",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09365829-6"
    ],
    "domicilio_principal": "Saavedra 1150",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09365829-6 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-210-0",
    "nombre": "ACEVEDO",
    "apellido": "SEBASTIAN",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-210",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09365779-6"
    ],
    "domicilio_principal": "Avellaneda y Guemes",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09365779-6 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-213-0",
    "nombre": "ESCURRA",
    "apellido": "JULIAN",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-213",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09366312-5"
    ],
    "domicilio_principal": "Santiago de Chile 1800, esquinaCon: Moreno, observaciones: Carpionteria llamada \"Madeira\" // Santiago de Chile 1800, esquinaCon: MOreno, observaciones: Carpinteria llamada \"madeira\"",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09366312-5 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-213-1",
    "nombre": "ESQUIVEL",
    "apellido": "JULIAN",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-213",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09366312-5"
    ],
    "domicilio_principal": "Santiago de Chile 1800, esquinaCon: Moreno, observaciones: Carpionteria llamada \"Madeira\" // Santiago de Chile 1800, esquinaCon: MOreno, observaciones: Carpinteria llamada \"madeira\"",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09366312-5 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-215-0",
    "nombre": "MARIA",
    "apellido": "LOPEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-215",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09366464-4"
    ],
    "domicilio_principal": "Padre Malaver 5560, calleEntre1: Pje Carrasco, calleEntre2: Gdor Lehmann",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09366464-4 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-217-0",
    "nombre": "ALBERTO",
    "apellido": "KERN GUILLERMO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-217",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09366643-4"
    ],
    "domicilio_principal": "Vieytes , calleEntre1: Pje Marsengo",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09366643-4 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-218-0",
    "nombre": "VIVIANA",
    "apellido": "SOSA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-218",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09366721-9"
    ],
    "domicilio_principal": "Lamadrid , calleEntre1: Mendoza",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09366721-9 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-218-1",
    "nombre": "MARTIN",
    "apellido": "GIUOVINO EDUARDO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-218",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09366721-9"
    ],
    "domicilio_principal": "Lamadrid , calleEntre1: Mendoza",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09366721-9 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-226-0",
    "nombre": "LAUTARO",
    "apellido": "SEGOVIA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-226",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09367039-3"
    ],
    "domicilio_principal": "Alberdi 3210",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09367039-3 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-227-0",
    "nombre": "ANGELICA",
    "apellido": "LOPEZ VICO",
    "alias": [
      "Investigado"
    ],
    "dni": "24320924",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09367045-8"
    ],
    "domicilio_principal": "Alfonsina Storni 6500, calleEntre1: Reinares, calleEntre2: Av 12 de octubre",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09367045-8 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-227-1",
    "nombre": "DAIARA",
    "apellido": "PAYE",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-227",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09367045-8"
    ],
    "domicilio_principal": "Alfonsina Storni 6500, calleEntre1: Reinares, calleEntre2: Av 12 de octubre",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09367045-8 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-228-0",
    "nombre": "DELFINA",
    "apellido": "CORDOBA ANDREA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-228",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09367062-8"
    ],
    "domicilio_principal": "belgrano 6307, observaciones: En el domicilio funcionaria una despensa llamada \"trijas\" donde comercializarían estupefacientes // providencia 1485",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09367062-8 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-228-1",
    "nombre": "DAVID",
    "apellido": "GRAMUEL JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-228",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09367062-8"
    ],
    "domicilio_principal": "belgrano 6307, observaciones: En el domicilio funcionaria una despensa llamada \"trijas\" donde comercializarían estupefacientes // providencia 1485",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09367062-8 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-228-2",
    "nombre": "ERICA",
    "apellido": "MOREL",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-228",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09367062-8"
    ],
    "domicilio_principal": "belgrano 6307, observaciones: En el domicilio funcionaria una despensa llamada \"trijas\" donde comercializarían estupefacientes // providencia 1485",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09367062-8 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-233-0",
    "nombre": "ALBERTO",
    "apellido": "KERN GUILLERMO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-233",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09367436-4"
    ],
    "domicilio_principal": "pje marsengo , calleEntre1: Vieytes",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09367436-4 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-240-0",
    "nombre": "LAUTARO",
    "apellido": "SEGOVIA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-240",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09367599-9"
    ],
    "domicilio_principal": "Alberdi 3210, calleEntre1: colon, calleEntre2: estanislao zeballo, barrio: Barrio Norte",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09367599-9 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-257-0",
    "nombre": "MELANI",
    "apellido": "MANSILLA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-257",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09368170-0"
    ],
    "domicilio_principal": "espora 639, calleEntre1: patricio cullen, calleEntre2: antonia godoy",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09368170-0 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-257-1",
    "nombre": "CARLOS PIPO",
    "apellido": "VAZQUEZ JUAN",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-257",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09368170-0"
    ],
    "domicilio_principal": "espora 639, calleEntre1: patricio cullen, calleEntre2: antonia godoy",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09368170-0 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-259-0",
    "nombre": "MATIAS",
    "apellido": "MACHADO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-259",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09368220-0"
    ],
    "domicilio_principal": "luciano molinas 3900, calleEntre1: brasil, calleEntre2: av pte peron",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09368220-0 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-263-0",
    "nombre": "VIVIANA",
    "apellido": "SOSA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-263",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09368290-1"
    ],
    "domicilio_principal": "3 de Febrero 3111, calleEntre1: Urquiza, calleEntre2: Francia",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09368290-1 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-263-1",
    "nombre": "MARTIN",
    "apellido": "GIOVINO EDUARDO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-263",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09368290-1"
    ],
    "domicilio_principal": "3 de Febrero 3111, calleEntre1: Urquiza, calleEntre2: Francia",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09368290-1 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-264-0",
    "nombre": "CAROLINA",
    "apellido": "GARCIA GISEL",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-264",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09368291-9"
    ],
    "domicilio_principal": "francia 5152, calleEntre1: pje santa teresita, calleEntre2: zapata",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09368291-9 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-270-0",
    "nombre": "DANIEL",
    "apellido": "DIAZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-270",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09368965-5"
    ],
    "domicilio_principal": "huergo , calleEntre1: Dr zavalla, calleEntre2: Av Gdor Freyre, observaciones: una cortada, freyre un pasillo enfrente de un toldo y una obra",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09368965-5 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-277-0",
    "nombre": "PABLO",
    "apellido": "KIÑIONES",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-277",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09369138-2"
    ],
    "domicilio_principal": "San Martin 1250",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09369138-2 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-279-0",
    "nombre": "ESCURRA JULIAN",
    "apellido": "ESQUIVEL /",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-279",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09369118-8"
    ],
    "domicilio_principal": "Santiago de Chile 1800",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09369118-8 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-280-0",
    "nombre": "PABLO",
    "apellido": "OJEDA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-280",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09369208-7"
    ],
    "domicilio_principal": "Sargento Cabral 1662",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23737 Comercialización de estupefacientes, precursores químicos o cualquier otra materia prima para su producción o fabricación o tenencia con fines de comercialización, o distribución, entrega en pago, almacenamiento o transporte"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09369208-7 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-282-0",
    "nombre": "EMILSE",
    "apellido": "SANCHEZ MARIA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-282",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09369345-8"
    ],
    "domicilio_principal": "Cervera 6765, calleEntre1: Estanislao Zeballos, calleEntre2: Espora, barrio: Cabal",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09369345-8 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-285-0",
    "nombre": "KERT",
    "apellido": "GUILLERMO ALBERTO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-285",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09369783-6"
    ],
    "domicilio_principal": "pje marsengo , calleEntre1: vieytes",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09369783-6 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-294-0",
    "nombre": "NICOLAS",
    "apellido": "NOGUERA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-294",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09372352-7"
    ],
    "domicilio_principal": "Pasaje Ferreira 1280",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09372352-7 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-295-0",
    "nombre": "MARIO",
    "apellido": "SANCHEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-295",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09372573-2"
    ],
    "domicilio_principal": "Caballero",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09372573-2 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-295-1",
    "nombre": "SILVA",
    "apellido": "ANIBAL",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-295",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09372573-2"
    ],
    "domicilio_principal": "Caballero",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09372573-2 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-297-0",
    "nombre": "LEO",
    "apellido": "CONTRERAS",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-297",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09373239-9"
    ],
    "domicilio_principal": "Moreno 1900, calleEntre1: San Martin, calleEntre2: Almirante Brown",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09373239-9 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-300-0",
    "nombre": "SUSANA",
    "apellido": "GONZALEZ",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-300",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09391599-9"
    ],
    "domicilio_principal": "Maurer , observaciones: Roberto Maurer - casa - 53 6 63 - color roja - Esquina Scalabrini Ortiz",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09391599-9 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-303-0",
    "nombre": "ALEXIS",
    "apellido": "OLIVERA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-303",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09404419-4"
    ],
    "domicilio_principal": "Entre rios 1393, calleEntre1: tucuman, calleEntre2: Estados unidos de mexico",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09404419-4 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-303-1",
    "nombre": "LORENA",
    "apellido": "OLIVERA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-303",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09404419-4"
    ],
    "domicilio_principal": "Entre rios 1393, calleEntre1: tucuman, calleEntre2: Estados unidos de mexico",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09404419-4 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-304-0",
    "nombre": "ALBERTO",
    "apellido": "KERT GUILLERMO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-304",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09404469-0"
    ],
    "domicilio_principal": ", calleEntre1: Guemes, calleEntre2: Risso, observaciones: Fracciona los estupefacientes en el domicilio de su madre, domiciliada en calle Guemes y Risso -pasillo.-",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09404469-0 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-306-0",
    "nombre": "MAIRA",
    "apellido": "PEDROZO",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-306",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09413562-9"
    ],
    "domicilio_principal": "M soler , calleEntre1: Saavedra, observaciones: Partido las colonias / Direccion aportada donde estaria la femenina Maira Pedrozo",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09413562-9 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-307-0",
    "nombre": "FELIPE",
    "apellido": "LEGUIZAMON",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-307",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09413626-9"
    ],
    "domicilio_principal": "Pje Son numero casa 22 , calleEntre1: Aristobulo, calleEntre2: Azcuenaga",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09413626-9 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-307-1",
    "nombre": "OSCAR",
    "apellido": "SAMI",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-307",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09413626-9"
    ],
    "domicilio_principal": "Pje Son numero casa 22 , calleEntre1: Aristobulo, calleEntre2: Azcuenaga",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09413626-9 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  },
  {
    "id": "p-insumo-308-0",
    "nombre": "VERONICA",
    "apellido": "PIACENSA",
    "alias": [
      "Investigado"
    ],
    "dni": "S/D-308",
    "sexo": "M",
    "roles": [
      "imputado",
      "investigado"
    ],
    "score_peligrosidad": 5,
    "banda_id": null,
    "banda_nombre": "Investigación Individual",
    "pedido_captura": false,
    "estado_judicial": "IMPUTADO EN CAUSA",
    "cuij_asociados": [
      "21-09413650-1"
    ],
    "domicilio_principal": "Los eucaliptus 6167, calleEntre1: Rp1, calleEntre2: Las Higueras, observaciones: Colastine Norte - casa quinta",
    "domicilio_principal_geom": null,
    "delitos_asociados": [
      "Ley 23.737 Microtráfico"
    ],
    "antecedentes_texto": "Causa CUIJ 21-09413650-1 radicada en MPA Regional 1. Fiscal: S/A.",
    "activo": true
  }
];

export const INITIAL_VINCULOS = [
  {
    "id": "v-disputa-1",
    "persona_origen_id": "p-zabala-jon",
    "persona_destino_id": "p-leiva-oscar",
    "tipo_relacion": "DISPUTA_ARMADA",
    "origen_nombre": "Jon Nelson Zabala (La Negrada)",
    "destino_nombre": "Oscar \"Nano\" Leiva (Los de Siempre)",
    "certeza": "CONFIRMADO",
    "tipo": "DISPUTA_ARMADA",
    "origen_informacion": "Informes de Inteligencia PDI y MPA - Guerra territorial San Lorenzo vs Centenario"
  },
  {
    "id": "v-disputa-2",
    "persona_origen_id": "p-sosa-marcelo",
    "persona_destino_id": "p-celer-matias",
    "tipo_relacion": "TIROTEO_CRUZADO",
    "origen_nombre": "Marcelo Sosa (La Negrada)",
    "destino_nombre": "Matías Celer (Los de Siempre)",
    "certeza": "CONFIRMADO",
    "tipo": "TIROTEO_CRUZADO",
    "origen_informacion": "Registro HAF 2025 - Enfrentamiento armado con heridos en Liberación y Estrada"
  },
  {
    "id": "v-disputa-3",
    "persona_origen_id": "p-carnaghi-lautaro",
    "persona_destino_id": "p-leiva-brian",
    "tipo_relacion": "RIVAL_DIRECTO",
    "origen_nombre": "Lautaro Carnaghi (La Negrada)",
    "destino_nombre": "Brian Leiva (Los de Siempre)",
    "certeza": "CONFIRMADO",
    "tipo": "RIVAL_DIRECTO",
    "origen_informacion": "Causa CUIJ 21-09726972-3 - Ataque a balazos a domicilio"
  },
  {
    "id": "v-disputa-4",
    "persona_origen_id": "p-benitez-isaias",
    "persona_destino_id": "p-maidana-esteban",
    "tipo_relacion": "DISPUTA_ZONA_NORTE",
    "origen_nombre": "Isaias Benítez (Los Puchingas)",
    "destino_nombre": "Esteban Maidana (Polaco Maidana)",
    "certeza": "INVESTIGADO",
    "tipo": "DISPUTA_ZONA_NORTE",
    "origen_informacion": "Causa CUIJ 21-09693542-8 - Pugna por bocas de expendio en Yapeyú"
  },
  {
    "id": "v-negrada-1",
    "persona_origen_id": "p-zabala-jon",
    "persona_destino_id": "p-sosa-marcelo",
    "tipo_relacion": "SUBORDINADO_A",
    "origen_nombre": "Jon Nelson Zabala",
    "destino_nombre": "Marcelo Sosa",
    "certeza": "CONFIRMADO",
    "tipo": "SUBORDINADO_A",
    "origen_informacion": "CUIJ 21-09744817-2 - Escuchas y tareas de campo PDI"
  },
  {
    "id": "v-negrada-2",
    "persona_origen_id": "p-zabala-jon",
    "persona_destino_id": "p-carnaghi-lautaro",
    "tipo_relacion": "SICARIO_DE",
    "origen_nombre": "Jon Nelson Zabala",
    "destino_nombre": "Lautaro Carnaghi",
    "certeza": "CONFIRMADO",
    "tipo": "SICARIO_DE",
    "origen_informacion": "Intervenciones telefónicas judiciales"
  },
  {
    "id": "v-negrada-3",
    "persona_origen_id": "p-zabala-jon",
    "persona_destino_id": "p-giovanniello-marcelo",
    "tipo_relacion": "ACOPIADOR_DE",
    "origen_nombre": "Jon Nelson Zabala",
    "destino_nombre": "Marcelo Giovanniello",
    "certeza": "CONFIRMADO",
    "tipo": "ACOPIADOR_DE",
    "origen_informacion": "Acta de allanamiento pasaje Zazpe"
  },
  {
    "id": "v-negrada-4",
    "persona_origen_id": "p-zabala-jon",
    "persona_destino_id": "p-aguilar-diego",
    "tipo_relacion": "LOGISTICA_MOTOVEHICULOS",
    "origen_nombre": "Jon Nelson Zabala",
    "destino_nombre": "Diego Aguilar",
    "certeza": "CONFIRMADO",
    "tipo": "LOGISTICA_MOTOVEHICULOS",
    "origen_informacion": "Secuestro de motovehículos con pedido de captura"
  },
  {
    "id": "v-negrada-5",
    "persona_origen_id": "p-zabala-jon",
    "persona_destino_id": "p-giovanniello-emilce",
    "tipo_relacion": "FAMILIAR_MADRE",
    "origen_nombre": "Jon Nelson Zabala",
    "destino_nombre": "Emilce Giovanniello",
    "certeza": "CONFIRMADO",
    "tipo": "FAMILIAR_MADRE",
    "origen_informacion": "Registro Civil y patrimonial"
  },
  {
    "id": "v-negrada-6",
    "persona_origen_id": "p-sosa-marcelo",
    "persona_destino_id": "p-filippa-walter",
    "tipo_relacion": "DEALER_SUBORDINADO",
    "origen_nombre": "Marcelo Sosa",
    "destino_nombre": "Walter Filippa",
    "certeza": "CONFIRMADO",
    "tipo": "DEALER_SUBORDINADO",
    "origen_informacion": "Filmaciones encubiertas en boca de expendio"
  },
  {
    "id": "v-negrada-7",
    "persona_origen_id": "p-doello-juan",
    "persona_destino_id": "p-zabala-jon",
    "tipo_relacion": "FINANCISTA_PROVEEDOR",
    "origen_nombre": "Juan Manuel Doello",
    "destino_nombre": "Jon Nelson Zabala",
    "certeza": "CONFIRMADO",
    "tipo": "FINANCISTA_PROVEEDOR",
    "origen_informacion": "Causa CUIJ 21-09319473-7 - Billeteras virtuales cruzadas"
  },
  {
    "id": "v-siempre-1",
    "persona_origen_id": "p-leiva-oscar",
    "persona_destino_id": "p-leiva-juan-abel",
    "tipo_relacion": "SEGUNDO_AL_MANDO",
    "origen_nombre": "Oscar \"Nano\" Leiva",
    "destino_nombre": "Juan Abel Leiva",
    "certeza": "CONFIRMADO",
    "tipo": "SEGUNDO_AL_MANDO",
    "origen_informacion": "Comunicaciones carcelarias monitoreadas"
  },
  {
    "id": "v-siempre-2",
    "persona_origen_id": "p-leiva-oscar",
    "persona_destino_id": "p-celer-walter",
    "tipo_relacion": "ARMERO_LOGISTICO",
    "origen_nombre": "Oscar \"Nano\" Leiva",
    "destino_nombre": "Walter Damián Celer",
    "certeza": "CONFIRMADO",
    "tipo": "ARMERO_LOGISTICO",
    "origen_informacion": "Causa 21-09726972-3 - Armas 9mm incautadas"
  },
  {
    "id": "v-siempre-3",
    "persona_origen_id": "p-leiva-juan-abel",
    "persona_destino_id": "p-leiva-brian",
    "tipo_relacion": "SICARIO_DEALER",
    "origen_nombre": "Juan Abel Leiva",
    "destino_nombre": "Brian Leiva",
    "certeza": "CONFIRMADO",
    "tipo": "SICARIO_DEALER",
    "origen_informacion": "Actuaciones policiales en Fonavi Centenario"
  },
  {
    "id": "v-siempre-4",
    "persona_origen_id": "p-celer-walter",
    "persona_destino_id": "p-celer-matias",
    "tipo_relacion": "FAMILIAR_HERMANO",
    "origen_nombre": "Walter Damián Celer",
    "destino_nombre": "Matías Damián Celer",
    "certeza": "CONFIRMADO",
    "tipo": "FAMILIAR_HERMANO",
    "origen_informacion": "Registro Civil"
  },
  {
    "id": "v-siempre-5",
    "persona_origen_id": "p-leiva-oscar",
    "persona_destino_id": "p-passarello-jesica",
    "tipo_relacion": "RECAUDADORA_CONYUGE",
    "origen_nombre": "Oscar \"Nano\" Leiva",
    "destino_nombre": "Jésica Passarello",
    "certeza": "CONFIRMADO",
    "tipo": "RECAUDADORA_CONYUGE",
    "origen_informacion": "Causa Lavado de Activos MPA"
  },
  {
    "id": "v-maidana-1",
    "persona_origen_id": "p-maidana-esteban",
    "persona_destino_id": "p-mendoza-salvador",
    "tipo_relacion": "CHOFER_TRANSPORTE",
    "origen_nombre": "Esteban Darío Maidana",
    "destino_nombre": "Salvador Ariel Mendoza",
    "certeza": "CONFIRMADO",
    "tipo": "CHOFER_TRANSPORTE",
    "origen_informacion": "Causa CUIJ 21-08338285-3 - Traslados Santa Fe - Rosario"
  },
  {
    "id": "v-correntino-1",
    "persona_origen_id": "p-beban-cristian",
    "persona_destino_id": "p-pedriel-claudia",
    "tipo_relacion": "PAREJA_ADMINISTRACION",
    "origen_nombre": "Cristian Ismael Beban",
    "destino_nombre": "Claudia Josefina Pedriel",
    "certeza": "CONFIRMADO",
    "tipo": "PAREJA_ADMINISTRACION",
    "origen_informacion": "Planilla Dossier Barranquitas"
  },
  {
    "id": "v-correntino-2",
    "persona_origen_id": "p-beban-cristian",
    "persona_destino_id": "p-alviso-walter",
    "tipo_relacion": "VENDEDOR_PUNTERO",
    "origen_nombre": "Cristian Ismael Beban",
    "destino_nombre": "Walter Ángel Alviso",
    "certeza": "CONFIRMADO",
    "tipo": "VENDEDOR_PUNTERO",
    "origen_informacion": "CUIJ 21-09551234-8 - República de Chile 2954"
  },
  {
    "id": "v-correntino-3",
    "persona_origen_id": "p-beban-cristian",
    "persona_destino_id": "p-leguizamon-felipe",
    "tipo_relacion": "SOCIO_PROVEEDOR",
    "origen_nombre": "Cristian Ismael Beban",
    "destino_nombre": "Felipe Dardo Leguizamón",
    "certeza": "CONFIRMADO",
    "tipo": "SOCIO_PROVEEDOR",
    "origen_informacion": "Dossier Aceitero Pavón 1431"
  }
];

export const INITIAL_ALLANAMIENTOS = [
  {
    "id": "allanamiento-zazpe",
    "cuij": "21-09726972-3",
    "requerimiento": "R-062-26",
    "fecha_operativo": "2026-02-18T06:30:00.000Z",
    "direccion": "Zavalla y Monseñor Zazpe (Ochava 1700)",
    "barrio": "San Lorenzo",
    "localidad": "Santa Fe",
    "fuerza_interviniente": "Policía de Investigaciones (PDI) y Tropas de Operaciones Especiales (TOE)",
    "resultado": "Positivo",
    "juzgado_interviniente": "Juez Penal Colegio de Jueces 1a Instancia Santa Fe",
    "resultado_detalle": "Secuestro de 1 pistola calibre 9mm Browning con numeración limada, 42 cartuchos intactos, 118 dosis de clorhidrato de cocaína, balanza de precisión y 4 teléfonos celulares.",
    "resumen": "Inmueble fortificado utilizado como búnker y puesto de guardia armada de La Negrada.",
    "geom": "SRID=4326;POINT(-60.7289 -31.6582)"
  },
  {
    "id": "allanamiento-liberacion",
    "cuij": "21-09744817-2",
    "requerimiento": "R-060-26",
    "fecha_operativo": "2026-01-24T07:15:00.000Z",
    "direccion": "Liberación y Estrada",
    "barrio": "San Lorenzo",
    "localidad": "Santa Fe",
    "fuerza_interviniente": "Prefectura Naval Argentina y PDI",
    "resultado": "Positivo",
    "juzgado_interviniente": "MPA Unidad Fiscal Especial de Microtráfico",
    "resultado_detalle": "Secuestro de 84 envoltorios de nylon con sustancia blanquecina (cocaína), $312.000 en efectivo y documentación de interés para individualizar a Sosa y Zabala.",
    "resumen": "Operativo simultáneo tras evento de heridos de arma de fuego (HAF).",
    "geom": "SRID=4326;POINT(-60.7305 -31.6512)"
  },
  {
    "id": "allanamiento-castanaduy",
    "cuij": "21-08338285-3",
    "requerimiento": "R-047-25",
    "fecha_operativo": "2025-11-12T06:00:00.000Z",
    "direccion": "Castañaduy 6807",
    "barrio": "Santa Fe Norte",
    "localidad": "Santa Fe",
    "fuerza_interviniente": "Gendarmería Nacional",
    "resultado": "Positivo",
    "juzgado_interviniente": "Juzgado Federal N° 2 Santa Fe",
    "resultado_detalle": "Secuestro de vehículo Peugeot 206 dominio DYH883 adulterado, 650 grs de marihuana compacta, documentación y handies con frecuencia policial.",
    "resumen": "Guardería vehicular y centro de despacho de la banda de Polaco Maidana.",
    "geom": "SRID=4326;POINT(-60.7250 -31.5900)"
  },
  {
    "id": "allanamiento-cibils",
    "cuij": "21-09551234-8",
    "requerimiento": "R-012-25",
    "fecha_operativo": "2025-10-05T07:00:00.000Z",
    "direccion": "José Cibils 3336",
    "barrio": "Barranquitas",
    "localidad": "Santa Fe",
    "fuerza_interviniente": "PDI Microtráfico",
    "resultado": "Positivo",
    "juzgado_interviniente": "MPA Fiscalía Regional 1",
    "resultado_detalle": "Secuestro de revólver calibre .38 con 5 cartuchos, 35 envoltorios de cocaína y balanza digital.",
    "resumen": "Finca perteneciente a Claudia Pedriel y Cristian Beban.",
    "geom": "SRID=4326;POINT(-60.7180 -31.6320)"
  }
];

export const INITIAL_HECHOS = [
  {
    "id": "hecho-haf-1",
    "tipo_penal": "Abuso de armas y lesiones graves por HAF",
    "fecha": "2026-02-15T22:45:00.000Z",
    "franja_horaria": "NOCHE",
    "direccion": "Liberación y Estrada",
    "barrio": "San Lorenzo",
    "localidad": "Santa Fe",
    "cuij": "21-09744817-2",
    "requerimiento": "R-060-26",
    "indice_lesividad": 9,
    "geom": "SRID=4326;POINT(-60.7305 -31.6512)",
    "resumen": "Tiroteo entre facciones en punto de venta de estupefacientes. Víctima Sosa Marcelo con herida de bala en miembro inferior. 18 vainas 9mm levantadas en el asfalto.",
    "modus_operandi": "Ataque con ráfagas cortas desde motovehículo en movimiento por parte de tiradores de Los de Siempre.",
    "banda_implicada": "La Negrada vs Los de Siempre"
  },
  {
    "id": "hecho-haf-2",
    "tipo_penal": "Homicidio doloso agravado",
    "fecha": "2026-01-20T03:30:00.000Z",
    "franja_horaria": "MADRUGADA",
    "direccion": "Diagonal Abipones y Neuquén",
    "barrio": "Yapeyú",
    "localidad": "Santa Fe",
    "cuij": "21-09693542-8",
    "requerimiento": "R-018-26",
    "indice_lesividad": 10,
    "geom": "SRID=4326;POINT(-60.7435 -31.5667)",
    "resumen": "Homicidio con arma de fuego calibre 9mm en pasillo interno de Yapeyú. Ajuste de cuentas por control territorial de búnker.",
    "modus_operandi": "Tirador a pie sorprende a la víctima a escasa distancia y efectúa 4 disparos a la zona torácica.",
    "banda_implicada": "Los Puchingas"
  },
  {
    "id": "hecho-haf-3",
    "tipo_penal": "Abuso de armas y daño calificado",
    "fecha": "2026-02-08T20:15:00.000Z",
    "franja_horaria": "NOCHE",
    "direccion": "Zavalla y Monseñor Zazpe 1700",
    "barrio": "San Lorenzo",
    "localidad": "Santa Fe",
    "cuij": "21-09726972-3",
    "requerimiento": "R-062-26",
    "indice_lesividad": 8,
    "geom": "SRID=4326;POINT(-60.7289 -31.6582)",
    "resumen": "Ataque armado contra vivienda lindante a la ochava. 14 impactos de bala en mampostería y portón metálico.",
    "modus_operandi": "Intimidación coactiva contra vecinos para desalojo y usurpación del inmueble para acopio.",
    "banda_implicada": "La Negrada"
  },
  {
    "id": "hecho-haf-4",
    "tipo_penal": "Comercialización de estupefacientes y tenencia de armas de guerra",
    "fecha": "2026-01-10T18:00:00.000Z",
    "franja_horaria": "TARDE",
    "direccion": "Urquiza 4250",
    "barrio": "Barranquitas",
    "localidad": "Santa Fe",
    "cuij": "21-09319473-7",
    "indice_lesividad": 7,
    "geom": "SRID=4326;POINT(-60.7088 -31.6285)",
    "resumen": "Centro neurálgico de acopio y entrega mayorista. Secuestro de cocaína y balanzas.",
    "modus_operandi": "Distribución en vehículos particulares bajo apariencia de viajes de aplicación.",
    "banda_implicada": "Red Doello / Zabala"
  },
  {
    "id": "hecho-haf-5",
    "tipo_penal": "Tentativa de homicidio y balacera en vía pública",
    "fecha": "2025-12-28T23:10:00.000Z",
    "franja_horaria": "NOCHE",
    "direccion": "Fonavi San Jerónimo Manzana 11",
    "barrio": "Centenario",
    "localidad": "Santa Fe",
    "cuij": "21-09726972-3",
    "indice_lesividad": 9,
    "geom": "SRID=4326;POINT(-60.7200 -31.6680)",
    "resumen": "Enfrentamiento armado entre grupos antagónicos en patio central de monoblocks. Dos heridos de arma de fuego derivados al Hospital Cullen.",
    "modus_operandi": "Disparos cruzados entre tiradores apostados en escaleras y tiradores en pasillos peatonales.",
    "banda_implicada": "Los de Siempre"
  },
  {
    "id": "hecho-haf-6",
    "tipo_penal": "Robo calificado por uso de arma y secuestro de armamento",
    "fecha": "2025-11-30T14:20:00.000Z",
    "franja_horaria": "TARDE",
    "direccion": "Pavón 1431",
    "barrio": "Mayoraz",
    "localidad": "Santa Fe",
    "cuij": "21-09551234-8",
    "indice_lesividad": 7,
    "geom": "SRID=4326;POINT(-60.7120 -31.6250)",
    "resumen": "Inmueble allanado tras robo con arma de fuego. Secuestro de escopeta 12/70 y munición de guerra.",
    "modus_operandi": "Depósito clandestino y guardería de armas para alquiler.",
    "banda_implicada": "Banda del Correntino (Beban)"
  }
];
