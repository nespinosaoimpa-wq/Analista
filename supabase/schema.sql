-- ============================================================
-- CRIMINT: Esquema de Base de Datos para Inteligencia Criminal
-- PostgreSQL + PostGIS en Supabase
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- Para búsqueda fuzzy
CREATE EXTENSION IF NOT EXISTS unaccent; -- Para búsqueda sin acentos

-- ============================================================
-- TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE precision_geo_enum AS ENUM (
  'EXACTA_ALTURA',
  'INTERSECCION',
  'BARRIO_CENTROIDE',
  'APROXIMADA',
  'KML_IMPORTADO'
);

CREATE TYPE estado_georref_enum AS ENUM (
  'CONFIRMADA',
  'REVISION_MANUAL',
  'PENDIENTE',
  'DESCARTADA'
);

CREATE TYPE tipo_relacion_enum AS ENUM (
  'FAMILIAR',
  'COMERCIAL',
  'PENAL_COAUTOR',
  'SUBORDINADO',
  'RIVAL',
  'CUSTODIO',
  'PROVEEDOR',
  'CLIENTE',
  'SENTIMENTAL',
  'VECINAL',
  'TENTATIVA'
);

CREATE TYPE confiabilidad_enum AS ENUM (
  'ALTA',
  'MEDIA',
  'BAJA',
  'INFERIDA'
);

CREATE TYPE rol_usuario_enum AS ENUM (
  'admin',
  'analista',
  'mando_estrategico',
  'consulta'
);

CREATE TYPE tipo_zona_enum AS ENUM (
  'BARRIO',
  'ZONA_CONFLICTO',
  'TERRITORIO_BANDA',
  'AREA_PATRULLAJE',
  'SECTOR_OPERATIVO',
  'LIMITE_JURISDICCIONAL'
);

CREATE TYPE tipo_documento_enum AS ENUM (
  'DOCX',
  'PDF',
  'KML',
  'KMZ',
  'XLSX',
  'ODT',
  'IMAGEN'
);

-- ============================================================
-- TABLA: personas (Datos de sujetos de interés)
-- ============================================================
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Datos personales
  nombre TEXT,
  apellido TEXT,
  dni TEXT,
  fecha_nacimiento DATE,
  sexo TEXT CHECK (sexo IN ('M', 'F', 'X')),
  nacionalidad TEXT DEFAULT 'Argentina',
  -- Identificación alternativa
  alias TEXT[] DEFAULT '{}',
  apodos TEXT[] DEFAULT '{}',
  -- Descripción física
  altura_cm INTEGER,
  peso_kg INTEGER,
  tez TEXT,
  cabello TEXT,
  ojos TEXT,
  contextura TEXT,
  senas_particulares TEXT, -- cicatrices, tatuajes
  fisionomia_descripcion TEXT,
  foto_url TEXT,
  -- Análisis
  score_peligrosidad INTEGER DEFAULT 0 CHECK (score_peligrosidad BETWEEN 0 AND 10),
  roles TEXT[] DEFAULT '{}', -- ej: {'tirador', 'campana', 'dealer', 'lider'}
  antecedentes_texto TEXT,
  modus_operandi TEXT,
  radio_accion_metros INTEGER,
  -- Contacto / Ubicación
  domicilio_principal TEXT,
  domicilio_principal_geom GEOMETRY(Point, 4326),
  domicilios_alternativos JSONB DEFAULT '[]',
  telefonos TEXT[] DEFAULT '{}',
  imei TEXT[] DEFAULT '{}',
  redes_sociales JSONB DEFAULT '{}',
  -- Metadata
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
  notas TEXT,
  fuente_info TEXT
);

CREATE INDEX idx_personas_geom ON personas USING GIST (domicilio_principal_geom);
CREATE INDEX idx_personas_alias ON personas USING GIN (alias);
CREATE INDEX idx_personas_apodos ON personas USING GIN (apodos);
CREATE INDEX idx_personas_dni ON personas (dni);
CREATE INDEX idx_personas_nombre_trgm ON personas USING GIN (nombre gin_trgm_ops);
CREATE INDEX idx_personas_apellido_trgm ON personas USING GIN (apellido gin_trgm_ops);

-- ============================================================
-- TABLA: bandas (Estructuras criminales)
-- ============================================================
CREATE TABLE bandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  alias_banda TEXT[] DEFAULT '{}',
  barrio_base TEXT,
  territorio GEOMETRY(MultiPolygon, 4326),
  descripcion TEXT,
  actividad_principal TEXT, -- ej: 'microtráfico', 'robo', 'extorsión'
  lider_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  rivalidades TEXT[] DEFAULT '{}',
  alianzas TEXT[] DEFAULT '{}',
  subgrupos TEXT[] DEFAULT '{}',
  nivel_amenaza INTEGER DEFAULT 0 CHECK (nivel_amenaza BETWEEN 0 AND 10),
  activa BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
  notas TEXT,
  fuente_info TEXT
);

CREATE INDEX idx_bandas_territorio ON bandas USING GIST (territorio);
CREATE INDEX idx_bandas_nombre_trgm ON bandas USING GIN (nombre gin_trgm_ops);

-- ============================================================
-- TABLA: banda_miembros (Relación personas-bandas)
-- ============================================================
CREATE TABLE banda_miembros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banda_id UUID NOT NULL REFERENCES bandas(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  rol_en_banda TEXT, -- 'lider', 'lugarteniente', 'soldado', 'campana', etc.
  fecha_ingreso DATE,
  fecha_egreso DATE,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  UNIQUE(banda_id, persona_id)
);

-- ============================================================
-- TABLA: hechos_delictivos (Eventos criminales georreferenciados)
-- ============================================================
CREATE TABLE hechos_delictivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Georreferenciación
  geom GEOMETRY(Point, 4326),
  direccion TEXT,
  barrio TEXT,
  localidad TEXT DEFAULT 'Santa Fe',
  precision_geo precision_geo_enum DEFAULT 'PENDIENTE',
  estado_georref estado_georref_enum DEFAULT 'PENDIENTE',
  -- Temporal
  fecha TIMESTAMPTZ,
  franja_horaria TEXT, -- 'MADRUGADA', 'MAÑANA', 'TARDE', 'NOCHE'
  -- Clasificación
  tipo_penal TEXT NOT NULL, -- 'Microtráfico', 'Abuso de armas', 'Homicidio', etc.
  subtipo TEXT,
  modus_operandi TEXT,
  indice_lesividad INTEGER DEFAULT 1 CHECK (indice_lesividad BETWEEN 1 AND 10),
  -- Referencia judicial
  cuij TEXT,
  requerimiento TEXT, -- R-XXXXXX-XX
  numero_informe TEXT, -- ej: 'Ref. info N°065_26'
  -- Descripción
  resumen TEXT,
  detalle TEXT,
  -- Vínculos
  banda_id UUID REFERENCES bandas(id) ON DELETE SET NULL,
  -- Metadata
  fuente_doc TEXT,
  documento_id UUID,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hechos_geom ON hechos_delictivos USING GIST (geom);
CREATE INDEX idx_hechos_fecha ON hechos_delictivos (fecha);
CREATE INDEX idx_hechos_tipo ON hechos_delictivos (tipo_penal);
CREATE INDEX idx_hechos_barrio ON hechos_delictivos (barrio);
CREATE INDEX idx_hechos_lesividad ON hechos_delictivos (indice_lesividad);
CREATE INDEX idx_hechos_cuij ON hechos_delictivos (cuij);
CREATE INDEX idx_hechos_requerimiento ON hechos_delictivos (requerimiento);

-- ============================================================
-- TABLA: hecho_personas (Relación hechos-personas)
-- ============================================================
CREATE TABLE hecho_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hecho_id UUID NOT NULL REFERENCES hechos_delictivos(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  rol_en_hecho TEXT, -- 'imputado', 'víctima', 'testigo', 'sospechoso'
  notas TEXT,
  UNIQUE(hecho_id, persona_id, rol_en_hecho)
);

-- ============================================================
-- TABLA: vinculos (Aristas del grafo de relaciones)
-- ============================================================
CREATE TABLE vinculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_origen_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  persona_destino_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_relacion tipo_relacion_enum NOT NULL,
  confiabilidad confiabilidad_enum DEFAULT 'MEDIA',
  bidireccional BOOLEAN DEFAULT true,
  descripcion TEXT,
  origen_reporte TEXT,
  hecho_id UUID REFERENCES hechos_delictivos(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  notas TEXT,
  CHECK (persona_origen_id != persona_destino_id)
);

CREATE INDEX idx_vinculos_origen ON vinculos (persona_origen_id);
CREATE INDEX idx_vinculos_destino ON vinculos (persona_destino_id);

-- ============================================================
-- TABLA: vehiculos
-- ============================================================
CREATE TABLE vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT, -- 'auto', 'moto', 'camioneta'
  marca TEXT,
  modelo TEXT,
  color TEXT,
  dominio TEXT, -- patente
  anio INTEGER,
  descripcion TEXT,
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  observaciones TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vehiculos_dominio ON vehiculos (dominio);

-- ============================================================
-- TABLA: armas
-- ============================================================
CREATE TABLE armas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT, -- 'pistola', 'revolver', 'escopeta', 'arma_blanca'
  calibre TEXT,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  estado TEXT, -- 'secuestrada', 'en_circulacion', 'destruida'
  origen TEXT, -- 'legal', 'ilegal', 'desconocido'
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  hecho_id UUID REFERENCES hechos_delictivos(id) ON DELETE SET NULL,
  observaciones TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLA: zonas_geograficas (Polígonos importados de KML)
-- ============================================================
CREATE TABLE zonas_geograficas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo tipo_zona_enum DEFAULT 'BARRIO',
  geom GEOMETRY(Geometry, 4326), -- Acepta Point, Polygon, MultiPolygon, LineString
  color_hex TEXT DEFAULT '#FF6B00',
  opacidad REAL DEFAULT 0.3,
  fuente_kml TEXT,
  visible BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_zonas_geom ON zonas_geograficas USING GIST (geom);

-- ============================================================
-- TABLA: allanamientos (Operativos tácticos)
-- ============================================================
CREATE TABLE allanamientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Ubicación
  geom GEOMETRY(Point, 4326),
  direccion TEXT,
  barrio TEXT,
  localidad TEXT DEFAULT 'Santa Fe',
  -- Datos judiciales
  cuij TEXT,
  requerimiento TEXT,
  juzgado TEXT,
  fiscal TEXT,
  -- Operativo
  fecha_operativo TIMESTAMPTZ,
  hora_inicio TIME,
  hora_fin TIME,
  fuerza_interviniente TEXT, -- 'PDI', 'Policía', 'Gendarmería', etc.
  resultado TEXT, -- 'POSITIVO', 'NEGATIVO'
  detalle_resultado TEXT,
  -- Objetivo
  objetivo_persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  banda_id UUID REFERENCES bandas(id) ON DELETE SET NULL,
  -- Secuestros
  estupefacientes_detalle TEXT,
  armas_secuestradas TEXT,
  dinero_secuestrado TEXT,
  otros_secuestros TEXT,
  -- Briefing
  vias_escape JSONB DEFAULT '[]',
  domicilios_alternativos JSONB DEFAULT '[]',
  nivel_riesgo INTEGER DEFAULT 1 CHECK (nivel_riesgo BETWEEN 1 AND 5),
  observaciones_tacticas TEXT,
  -- Metadata
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fuente_doc TEXT
);

CREATE INDEX idx_allanamientos_geom ON allanamientos USING GIST (geom);
CREATE INDEX idx_allanamientos_fecha ON allanamientos (fecha_operativo);

-- ============================================================
-- TABLA: documentos_fuente (Trazabilidad de insumos)
-- ============================================================
CREATE TABLE documentos_fuente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_archivo TEXT NOT NULL,
  tipo tipo_documento_enum,
  ruta_original TEXT,
  tamano_bytes BIGINT,
  hash_md5 TEXT,
  procesado BOOLEAN DEFAULT false,
  fecha_proceso TIMESTAMPTZ,
  entidades_extraidas JSONB DEFAULT '{}',
  errores_proceso TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLA: datos_personales_ampliados (Datos sensibles separados)
-- ============================================================
CREATE TABLE datos_personales_ampliados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  -- Documentación
  tipo_documento TEXT DEFAULT 'DNI',
  numero_documento TEXT,
  cuit_cuil TEXT,
  -- Datos civiles
  estado_civil TEXT,
  profesion TEXT,
  nivel_educativo TEXT,
  -- Familiares directos
  madre_nombre TEXT,
  padre_nombre TEXT,
  conyuge_nombre TEXT,
  hijos JSONB DEFAULT '[]', -- [{nombre, edad, observaciones}]
  -- Situación legal
  situacion_procesal TEXT, -- 'libre', 'detenido', 'prófugo', 'condicional'
  establecimiento_detencion TEXT,
  abogado TEXT,
  causas_activas JSONB DEFAULT '[]',
  -- Económico
  cuentas_bancarias JSONB DEFAULT '[]',
  billeteras_virtuales JSONB DEFAULT '[]',
  propiedades JSONB DEFAULT '[]',
  vehiculos_registrados JSONB DEFAULT '[]',
  -- Metadata
  fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
  fuente TEXT,
  clasificacion TEXT DEFAULT 'RESERVADO'
);

CREATE INDEX idx_datos_personales_persona ON datos_personales_ampliados (persona_id);

-- ============================================================
-- TABLA: audit_log (Auditoría de acceso)
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario TEXT NOT NULL,
  rol rol_usuario_enum,
  accion TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXPORT'
  tabla TEXT,
  registro_id UUID,
  detalle JSONB DEFAULT '{}',
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_usuario ON audit_log (usuario);
CREATE INDEX idx_audit_created ON audit_log (created_at);

-- ============================================================
-- TABLA: usuarios_plataforma (Gestión de usuarios y roles)
-- ============================================================
CREATE TABLE usuarios_plataforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- FK a auth.users de Supabase
  nombre TEXT NOT NULL,
  email TEXT UNIQUE,
  rol rol_usuario_enum DEFAULT 'consulta',
  grupo_trabajo TEXT,
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FUNCIONES RPC
-- ============================================================

-- Buscar hechos en un radio desde un punto
CREATE OR REPLACE FUNCTION buscar_en_radio(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radio_metros INTEGER DEFAULT 1500
)
RETURNS SETOF hechos_delictivos
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM hechos_delictivos
  WHERE ST_DWithin(
    geom::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radio_metros
  )
  ORDER BY fecha DESC;
$$;

-- Datos para mapa de calor con filtros
CREATE OR REPLACE FUNCTION heatmap_data(
  fecha_desde TIMESTAMPTZ DEFAULT '2020-01-01',
  fecha_hasta TIMESTAMPTZ DEFAULT now(),
  lesividad_min INTEGER DEFAULT 1,
  tipo TEXT DEFAULT NULL
)
RETURNS TABLE(lat DOUBLE PRECISION, lng DOUBLE PRECISION, peso INTEGER)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ST_Y(geom) as lat,
    ST_X(geom) as lng,
    indice_lesividad as peso
  FROM hechos_delictivos
  WHERE geom IS NOT NULL
    AND fecha BETWEEN fecha_desde AND fecha_hasta
    AND indice_lesividad >= lesividad_min
    AND (tipo IS NULL OR tipo_penal = tipo);
$$;

-- Obtener grafo de vínculos de una persona (1 nivel)
CREATE OR REPLACE FUNCTION grafo_persona(p_persona_id UUID)
RETURNS TABLE(
  origen_id UUID,
  origen_nombre TEXT,
  origen_alias TEXT[],
  destino_id UUID,
  destino_nombre TEXT,
  destino_alias TEXT[],
  tipo tipo_relacion_enum,
  confiabilidad confiabilidad_enum
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    v.persona_origen_id,
    po.nombre || ' ' || COALESCE(po.apellido, '') as origen_nombre,
    po.alias,
    v.persona_destino_id,
    pd.nombre || ' ' || COALESCE(pd.apellido, '') as destino_nombre,
    pd.alias,
    v.tipo_relacion,
    v.confiabilidad
  FROM vinculos v
  JOIN personas po ON po.id = v.persona_origen_id
  JOIN personas pd ON pd.id = v.persona_destino_id
  WHERE v.activo = true
    AND (v.persona_origen_id = p_persona_id OR v.persona_destino_id = p_persona_id);
$$;

-- Búsqueda fuzzy de personas por nombre o alias
CREATE OR REPLACE FUNCTION buscar_persona_fuzzy(termino TEXT)
RETURNS TABLE(
  id UUID,
  nombre TEXT,
  apellido TEXT,
  alias TEXT[],
  dni TEXT,
  score_peligrosidad INTEGER,
  similitud REAL
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.nombre,
    p.apellido,
    p.alias,
    p.dni,
    p.score_peligrosidad,
    GREATEST(
      similarity(unaccent(COALESCE(p.nombre, '') || ' ' || COALESCE(p.apellido, '')), unaccent(termino)),
      (SELECT MAX(similarity(unaccent(a), unaccent(termino))) FROM unnest(p.alias) a)
    ) as similitud
  FROM personas p
  WHERE
    unaccent(COALESCE(p.nombre, '') || ' ' || COALESCE(p.apellido, '')) % unaccent(termino)
    OR EXISTS (SELECT 1 FROM unnest(p.alias) a WHERE unaccent(a) % unaccent(termino))
    OR p.dni = termino
  ORDER BY similitud DESC
  LIMIT 20;
$$;

-- Estadísticas del dashboard
CREATE OR REPLACE FUNCTION dashboard_stats(
  fecha_desde TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  fecha_hasta TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  resultado JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_hechos', (SELECT COUNT(*) FROM hechos_delictivos WHERE fecha BETWEEN fecha_desde AND fecha_hasta),
    'total_personas', (SELECT COUNT(*) FROM personas WHERE activo = true),
    'total_bandas', (SELECT COUNT(*) FROM bandas WHERE activa = true),
    'total_allanamientos', (SELECT COUNT(*) FROM allanamientos WHERE fecha_operativo BETWEEN fecha_desde AND fecha_hasta),
    'por_tipo', (
      SELECT jsonb_agg(jsonb_build_object('tipo', tipo_penal, 'cantidad', cnt))
      FROM (
        SELECT tipo_penal, COUNT(*) as cnt
        FROM hechos_delictivos
        WHERE fecha BETWEEN fecha_desde AND fecha_hasta
        GROUP BY tipo_penal
        ORDER BY cnt DESC
      ) t
    ),
    'por_barrio', (
      SELECT jsonb_agg(jsonb_build_object('barrio', barrio, 'cantidad', cnt))
      FROM (
        SELECT barrio, COUNT(*) as cnt
        FROM hechos_delictivos
        WHERE fecha BETWEEN fecha_desde AND fecha_hasta AND barrio IS NOT NULL
        GROUP BY barrio
        ORDER BY cnt DESC
        LIMIT 15
      ) t
    ),
    'por_lesividad', (
      SELECT jsonb_agg(jsonb_build_object('nivel', nivel, 'cantidad', cnt))
      FROM (
        SELECT indice_lesividad as nivel, COUNT(*) as cnt
        FROM hechos_delictivos
        WHERE fecha BETWEEN fecha_desde AND fecha_hasta
        GROUP BY indice_lesividad
        ORDER BY nivel
      ) t
    ),
    'tendencia_diaria', (
      SELECT jsonb_agg(jsonb_build_object('fecha', dia, 'cantidad', cnt))
      FROM (
        SELECT DATE(fecha) as dia, COUNT(*) as cnt
        FROM hechos_delictivos
        WHERE fecha BETWEEN fecha_desde AND fecha_hasta
        GROUP BY DATE(fecha)
        ORDER BY dia
      ) t
    )
  ) INTO resultado;

  RETURN resultado;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hechos_delictivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE allanamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE datos_personales_ampliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_geograficas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE armas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_fuente ENABLE ROW LEVEL SECURITY;
ALTER TABLE hecho_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE banda_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_plataforma ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para acceso con service role (scripts de ingesta)
-- y para usuarios autenticados según rol

-- Por ahora, políticas abiertas para el anon key (desarrollo)
-- En producción se reemplazan por políticas basadas en rol

CREATE POLICY "Acceso público lectura personas" ON personas
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar personas" ON personas
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualizar personas" ON personas
  FOR UPDATE USING (true);

CREATE POLICY "Acceso público lectura bandas" ON bandas
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar bandas" ON bandas
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualizar bandas" ON bandas
  FOR UPDATE USING (true);

CREATE POLICY "Acceso público lectura hechos" ON hechos_delictivos
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar hechos" ON hechos_delictivos
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualizar hechos" ON hechos_delictivos
  FOR UPDATE USING (true);

CREATE POLICY "Acceso público lectura vinculos" ON vinculos
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar vinculos" ON vinculos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acceso público lectura allanamientos" ON allanamientos
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar allanamientos" ON allanamientos
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualizar allanamientos" ON allanamientos
  FOR UPDATE USING (true);

CREATE POLICY "Acceso público lectura datos_personales" ON datos_personales_ampliados
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar datos_personales" ON datos_personales_ampliados
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acceso público lectura audit" ON audit_log
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar audit" ON audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acceso público lectura zonas" ON zonas_geograficas
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar zonas" ON zonas_geograficas
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualizar zonas" ON zonas_geograficas
  FOR UPDATE USING (true);

CREATE POLICY "Acceso público lectura vehiculos" ON vehiculos
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar vehiculos" ON vehiculos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acceso público lectura armas" ON armas
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar armas" ON armas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acceso público lectura documentos" ON documentos_fuente
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar documentos" ON documentos_fuente
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualizar documentos" ON documentos_fuente
  FOR UPDATE USING (true);

CREATE POLICY "Acceso público lectura hecho_personas" ON hecho_personas
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar hecho_personas" ON hecho_personas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acceso público lectura banda_miembros" ON banda_miembros
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar banda_miembros" ON banda_miembros
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acceso público lectura usuarios" ON usuarios_plataforma
  FOR SELECT USING (true);
CREATE POLICY "Acceso público insertar usuarios" ON usuarios_plataforma
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Acceso público actualizar usuarios" ON usuarios_plataforma
  FOR UPDATE USING (true);

-- ============================================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personas_updated_at BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bandas_updated_at BEFORE UPDATE ON bandas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER hechos_updated_at BEFORE UPDATE ON hechos_delictivos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
