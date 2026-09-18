# CRIMINT — Plataforma de Inteligencia Criminal y Despliegue Táctico

Sistema integral de análisis criminal, resolución de entidades y apoyo a la toma de decisiones tácticas para fuerzas de seguridad y organismos judiciales (Ministerio Público de la Acusación). Diseñado con arquitectura desacoplada en tres capas para soportar georreferenciación masiva, redes de vínculos complejas y despliegue operativo en territorio.

---

## 🏛️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA OPERATIVA TÁCTICA                   │
│  - Mapa Táctico Mapbox GL (Heatmap KDE, Clusters, Zonas)    │
│  - Dashboard Analítico en Tiempo Real (Chart.js)           │
│  - Red de Vínculos Criminales Interactiva (Vis-Network)     │
│  - Fichas Tácticas y Briefings de Allanamiento              │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│             PIPELINE DE INGESTA & ENTITY RESOLUTION         │
│  - Ingesta KML/KMZ (Polígonos y puntos Google My Maps)      │
│  - Procesamiento XLSX / CSV (Causas, CUIJs, Domicilios)     │
│  - Extracción de Entidades asistida por LLM (DOCX / PDF)   │
│  - Georreferenciación Automática y Normalización            │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                    MOTOR DE DATOS HÍBRIDO                   │
│  - PostgreSQL + PostGIS (Geometrías, ST_Point, ST_Polygon)  │
│  - Modelo de Grafos (Nodos: Personas/Bandas; Aristas)       │
│  - Seguridad RLS (Row Level Security) y Logs de Auditoría  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Características Principales

1. **🗺️ Mapa Táctico Interactivo (Mapbox GL JS)**
   - Visualización de hechos delictivos con capas conmutables: Puntos individuales, Heatmap por Kernel Density Estimation (KDE) y Clusters con conteo dinámico.
   - Capa de Polígonos Tácticos: Zonas de conflicto entre bandas y sectores de patrullaje prioritario.
   - Puntos de allanamientos y objetivos judiciales con estado (Positivo / Negativo / En curso).

2. **📊 Dashboard y Analítica Criminal (Chart.js)**
   - KPIs automáticos: Total de hechos, personas de interés identificadas, bandas activas y allanamientos.
   - Gráficos de tendencias temporales, distribución por tipo penal (Microtráfico, Abuso de armas, Homicidios, etc.), ranking por barrio e índice de lesividad (1 a 10).

3. **🕸️ Análisis de Redes de Vínculos (Vis-Network)**
   - Grafo interactivo de relaciones: coautorías, subordinación jerárquica, vínculos familiares, comerciales y sentimentales.
   - Cálculo de centralidad para identificar líderes de facciones y operadores logísticos.

4. **📁 Ingesta Multiformato**
   - **KML / KMZ**: Carga directa de capas de Google My Maps arrastrando el archivo.
   - **Excel / CSV**: Parseo automático de planillas de causas judiciales (CUIJ, dependencias policiales, domicilios e imputados).
   - **Informes Policiales**: Extracción estructurada de nombres, apodos, armas y estupefacientes secuestrados.

5. **📋 Ficha Táctica y Briefing Operativo**
   - Generación de órdenes de operaciones reservadas con datos del objetivo, CUIJ, juzgado interviniente, fuerza asignada, hipótesis criminal y protocolos de seguridad perimetral listos para imprimir (`window.print`).

---

## 🛠️ Stack Tecnológico

- **Frontend**: Vanilla JavaScript (ES Modules), Vite 6, CSS3 con tema táctico oscuro (Glassmorphism, custom design system).
- **Cartografía**: Mapbox GL JS v3.
- **Gráficos & Visualización**: Chart.js v4, Vis-Network v9.
- **Procesamiento de Archivos**: SheetJS (XLSX), JSZip (KMZ), DOMParser (KML).
- **Backend & Base de Datos**: Supabase (PostgreSQL 15 + PostGIS).

---

## 📦 Puesta en Marcha Local

### 1. Clonar el Repositorio
```bash
git clone https://github.com/nespinosaoimpa-wq/Analista.git
cd Analista
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Copiar el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```
Completar con las claves de Supabase y el token público de Mapbox:
```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu_clave_anon>
VITE_SUPABASE_SERVICE_KEY=<tu_clave_servicio>
VITE_MAPBOX_TOKEN=<tu_mapbox_token>
```

### 4. Ejecutar el Schema en la Base de Datos
1. Ingresar al panel de **Supabase** de su proyecto.
2. Ir a **SQL Editor**.
3. Copiar el contenido del archivo [`supabase/schema.sql`](supabase/schema.sql) y ejecutarlo ("Run").
   *Esto creará las 14 tablas relacionales/espaciales, índices PostGIS, políticas de seguridad RLS y funciones RPC para búsquedas fuzzy y estadísticas.*

### 5. Carga de Datos Iniciales (Opcional)
Para cargar datos de muestra representativos de Santa Fe (Barrio Yapeyú, San Lorenzo, Barranquitas):
```bash
npm run seed
```

Para procesar e ingestar los archivos Excel y mapas KMZ locales:
```bash
npm run import:local
```

### 6. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173/`.

### 7. Compilar para Producción
```bash
npm run build
```
Los archivos optimizados se generarán en la carpeta `dist/`.

---

## 🔒 Estructura del Modelo de Datos (`schema.sql`)

- `personas`: Datos filiatorios, descripción física, alias, roles criminales, índice de peligrosidad y geometría de domicilio.
- `hechos_delictivos`: Fecha, franja horaria, tipo penal, lesividad (1-10), CUIJ, requerimiento y punto PostGIS (`geom`).
- `bandas`: Estructuras criminales, colores de identificación táctica, barrio base y nivel de amenaza.
- `vinculos`: Aristas del grafo de relaciones (tipo de vínculo, certeza probatoria, fuente de información).
- `allanamientos`: Operativos judiciales con georreferenciación, juzgado, fuerza y detalle de secuestros.
- `zonas_geograficas`: Polígonos PostGIS (`ST_Polygon`) para delimitar áreas de conflicto y patrullaje.
- `armas` y `vehiculos`: Elementos de interés asociados a personas o hechos delictivos.
- `audit_log`: Registro inmutable de cada acción, inserción y consulta en el sistema.

---

## 👥 Contribuciones y Licencia

Desarrollado para el análisis táctico e investigación criminal. Todos los derechos reservados.
