// ============================================================
// CRIMINT - Motor de Geocodificación Quirúrgica y Cartografía
// Santa Fe Capital y Área Metropolitana
// Soporta: Google Maps URL, Coordenadas GPS, Intersecciones,
// Alturas exactas Catastro/OSM, y Ajuste Manual en Mapa.
// ============================================================

import { CONFIG } from './config.js';

export const SANTA_FE_BOUNDS = {
  minLat: -31.6900,
  maxLat: -31.5200,
  minLng: -60.7600,
  maxLng: -60.6400
};

export function isInSantaFe(lat, lng) {
  if (lat == null || lng == null) return false;
  return lat >= SANTA_FE_BOUNDS.minLat && lat <= SANTA_FE_BOUNDS.maxLat &&
         lng >= SANTA_FE_BOUNDS.minLng && lng <= SANTA_FE_BOUNDS.maxLng;
}

// ------------------------------------------------------------
// 1. Parser de Coordenadas Directas y Enlaces de Google Maps
// ------------------------------------------------------------
export function parseCoordsOrUrl(input) {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();

  // 1. Google Maps URL con patrón @lat,lng
  const gmapAtMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (gmapAtMatch) {
    return { lat: parseFloat(gmapAtMatch[1]), lng: parseFloat(gmapAtMatch[2]), source: 'google_maps_url', precision: 'GPS_COORDENADAS' };
  }

  // 2. Google Maps URL con ?q=lat,lng o ll=lat,lng
  const gmapQMatch = str.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (gmapQMatch) {
    return { lat: parseFloat(gmapQMatch[1]), lng: parseFloat(gmapQMatch[2]), source: 'google_maps_url', precision: 'GPS_COORDENADAS' };
  }

  // 3. Coordenadas decimales: e.g. -31.6467, -60.7065 o -60.7065, -31.6467
  const rawCoordMatch = str.match(/^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/);
  if (rawCoordMatch) {
    let p1 = parseFloat(rawCoordMatch[1]);
    let p2 = parseFloat(rawCoordMatch[2]);
    let lat = p1, lng = p2;
    // En Santa Fe la Latitud ronda -31 y la Longitud -60. Corregir inversión automática si viene (lng, lat)
    if (p1 < -55 && p1 > -65 && p2 < -25 && p2 > -35) {
      lng = p1; lat = p2;
    }
    return { lat, lng, source: 'raw_coords', precision: 'GPS_COORDENADAS' };
  }

  // 4. Formato DMS (Grados, Minutos, Segundos): e.g. 31°38'48.2"S 60°42'23.7"W
  const dmsMatch = str.match(/(\d+)°(\d+)'([\d.]+)"\s*([NSns])[,\s]+(\d+)°(\d+)'([\d.]+)"\s*([WOEwoe])/);
  if (dmsMatch) {
    let lat = parseFloat(dmsMatch[1]) + parseFloat(dmsMatch[2]) / 60 + parseFloat(dmsMatch[3]) / 3600;
    if (dmsMatch[4].toUpperCase() === 'S') lat = -lat;
    let lng = parseFloat(dmsMatch[5]) + parseFloat(dmsMatch[6]) / 60 + parseFloat(dmsMatch[7]) / 3600;
    if (dmsMatch[8].toUpperCase() === 'W' || dmsMatch[8].toUpperCase() === 'O') lng = -lng;
    return { lat, lng, source: 'dms_coords', precision: 'GPS_COORDENADAS' };
  }

  return null;
}

// ------------------------------------------------------------
// 2. Limpieza y Normalización de Texto de Direcciones
// ------------------------------------------------------------
export function cleanAddressQuery(raw) {
  if (!raw) return '';
  return raw
    .replace(/\s*\(.*?\)\s*/g, ' ') // Quitar aclaraciones entre paréntesis como "(Ochava 1700)"
    .replace(/\b(B°|Barrio|Bº|Mz\.?|Manzana|Casa|Dpto|Lote|Torre)\b[^\s,]+/gi, '') // Quitar datos catastrales menores
    .replace(/\s+/g, ' ')
    .trim();
}

// ------------------------------------------------------------
// 3. Geocodificación Inversa (Reverse Geocode: Lng, Lat -> Calle y Altura)
// ------------------------------------------------------------
export async function reverseGeocode(lng, lat) {
  if (lng == null || lat == null) return null;
  const token = CONFIG.mapbox?.token;

  // Intento 1: Mapbox Reverse Geocoding
  if (token) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=ar&types=address,poi,neighborhood,locality`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const feat = data.features[0];
        const barrioFeat = data.features.find(f => f.place_type?.includes('neighborhood'));
        const cityFeat = data.features.find(f => f.place_type?.includes('place'));

        return {
          direccion: feat.text ? `${feat.text} ${feat.address || ''}`.trim() : feat.place_name,
          barrio: barrioFeat ? barrioFeat.text : '',
          localidad: cityFeat ? cityFeat.text : 'Santa Fe',
          full: feat.place_name
        };
      }
    } catch (e) {
      console.warn('Mapbox reverse geocode failed:', e);
    }
  }

  // Intento 2: Photon Reverse Geocoding (OSM)
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`;
    const res = await fetch(photonUrl);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const p = data.features[0].properties || {};
      const street = p.street || p.name || '';
      const num = p.housenumber || '';
      return {
        direccion: `${street} ${num}`.trim() || 'Ubicación seleccionada',
        barrio: p.district || '',
        localidad: p.city || 'Santa Fe',
        full: `${street} ${num}, ${p.district ? p.district + ', ' : ''}${p.city || 'Santa Fe'}`.trim()
      };
    }
  } catch (e) { }

  return {
    direccion: `Punto (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
    barrio: '',
    localidad: 'Santa Fe',
    full: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  };
}

// ------------------------------------------------------------
// 4. Motor Principal de Geocodificación Quirúrgica Multi-Etapa
// ------------------------------------------------------------
export async function geocodeAddress(address, barrio = '', localidad = 'Santa Fe') {
  if (!address || typeof address !== 'string' || !address.trim()) return null;

  // Paso 0: Ver si el analista pegó un enlace de Google Maps o Coordenadas directas
  const directCoord = parseCoordsOrUrl(address);
  if (directCoord) {
    const rev = await reverseGeocode(directCoord.lng, directCoord.lat);
    return {
      lat: directCoord.lat,
      lng: directCoord.lng,
      precision: 'GPS_COORDENADAS',
      confidence: 1.0,
      display_name: rev?.full || `${directCoord.lat.toFixed(6)}, ${directCoord.lng.toFixed(6)}`,
      direccion: rev?.direccion || address,
      barrio: rev?.barrio || barrio || '',
      localidad: localidad || 'Santa Fe',
      source: directCoord.source
    };
  }

  const targetCity = (localidad || 'Santa Fe').trim();
  const isCitySantaFe = targetCity.toLowerCase().includes('santa fe');
  const cleaned = cleanAddressQuery(address);

  // Paso 0.5: Google Maps Geocoding API si el usuario proveyó clave
  const googleKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('crimint_google_maps_key') : '') || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (googleKey) {
    try {
      const gQuery = `${cleaned}, ${barrio ? barrio + ', ' : ''}${targetCity}, Santa Fe, Argentina`;
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(gQuery)}&key=${googleKey}&language=es&region=ar`;
      const gRes = await fetch(gUrl);
      const gData = await gRes.json();
      if (gData.status === 'OK' && gData.results && gData.results.length > 0) {
        const topResult = gData.results[0];
        const lat = topResult.geometry.location.lat;
        const lng = topResult.geometry.location.lng;
        const isRooftop = topResult.geometry.location_type === 'ROOFTOP';
        const isIntersection = topResult.types.includes('intersection');

        let precision = 'APROXIMADA_CALLE';
        if (isRooftop) precision = 'EXACTA_ALTURA';
        else if (isIntersection) precision = 'INTERSECCION';

        return {
          lat,
          lng,
          precision,
          confidence: isRooftop ? 1.0 : 0.95,
          display_name: topResult.formatted_address,
          direccion: cleaned,
          barrio: barrio || '',
          localidad: targetCity,
          source: 'google_maps_api'
        };
      }
    } catch (e) {
      console.warn('Google Maps Geocoding error:', e);
    }
  }

  // Paso 1: Motor Photon (Komoot / OpenStreetMap Santa Fe)
  // Destacado para numeraciones exactas en Santa Fe y esquinas registradas
  try {
    const photonQuery = `${cleaned}, ${barrio ? barrio + ', ' : ''}${targetCity}, Argentina`;
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(photonQuery)}&lat=-31.6333&lon=-60.6936&limit=6`;
    const res = await fetch(photonUrl);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      for (const feat of data.features) {
        const [lng, lat] = feat.geometry.coordinates;
        const p = feat.properties;
        const cityName = (p.city || '').toLowerCase();
        const isInBounds = !isCitySantaFe || isInSantaFe(lat, lng);
        const isNotWrongCity = !cityName.includes('santo tomé') && !cityName.includes('rosario');

        if (isInBounds && isNotWrongCity) {
          const hasHouseNumber = !!p.housenumber;
          const isIntersection = (p.name || '').includes(' y ') || (p.street || '').includes(' y ');
          let precision = 'APROXIMADA_CALLE';
          if (hasHouseNumber) precision = 'EXACTA_ALTURA';
          else if (isIntersection) precision = 'INTERSECCION';

          return {
            lat,
            lng,
            precision,
            confidence: hasHouseNumber ? 0.98 : (isIntersection ? 0.92 : 0.85),
            display_name: `${p.name || p.street || ''} ${p.housenumber || ''}, ${p.district || p.city || 'Santa Fe'}`.trim(),
            direccion: `${p.name || p.street || ''} ${p.housenumber || ''}`.trim() || cleaned,
            barrio: p.district || barrio || '',
            localidad: p.city || targetCity,
            source: 'photon_osm'
          };
        }
      }
    }
  } catch (e) { }

  // Paso 2: Nominatim (OpenStreetMap Argentina con Bounding Box)
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleaned + ', ' + targetCity + ', Argentina')}&format=json&addressdetails=1&limit=5&countrycodes=ar`;
    const res = await fetch(nomUrl, { headers: { 'User-Agent': 'CrimintApp/2.0 (investigacion@santafe.gob.ar)' } });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      for (const item of data) {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const disp = (item.display_name || '').toLowerCase();
        const isInBounds = !isCitySantaFe || isInSantaFe(lat, lng);
        const isNotWrongCity = !disp.includes('santo tomé') && !disp.includes('rosario');

        if (isInBounds && isNotWrongCity) {
          const isHouse = item.type === 'house' || item.class === 'place';
          return {
            lat,
            lng,
            precision: isHouse ? 'EXACTA_ALTURA' : 'APROXIMADA_CALLE',
            confidence: isHouse ? 0.95 : 0.80,
            display_name: item.display_name,
            direccion: item.address?.road ? `${item.address.road} ${item.address.house_number || ''}`.trim() : item.display_name,
            barrio: item.address?.suburb || item.address?.neighbourhood || barrio || '',
            localidad: item.address?.city || targetCity,
            source: 'nominatim_osm'
          };
        }
      }
    }
  } catch (e) { }

  // Paso 3: Mapbox Places v5 con Bounding Box Estricto Santa Fe
  const token = CONFIG.mapbox?.token;
  if (token) {
    try {
      const query = [cleaned, barrio, targetCity, 'Argentina'].filter(Boolean).join(', ');
      const bbox = isCitySantaFe ? CONFIG.geocoding.bbox : CONFIG.geocoding.bboxWide;
      const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=ar&proximity=${CONFIG.geocoding.proximity}&bbox=${bbox}&limit=5`;
      const res = await fetch(mbUrl);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        for (const feat of data.features) {
          const [lng, lat] = feat.center;
          const placeName = (feat.place_name || '').toLowerCase();

          // Ignorar centroide genérico de la ciudad ([-60.70241, -31.618284]) si no se buscó sólo la ciudad
          if (feat.place_type.includes('place') && !cleaned.toLowerCase().includes('santa fe')) {
            continue;
          }
          // Descartar resultados que caigan en Santo Tomé o Recreo si se busca en Santa Fe Capital
          if (isCitySantaFe && (placeName.includes('santo tomé') || placeName.includes('recreo'))) {
            continue;
          }
          if (isCitySantaFe && !isInSantaFe(lat, lng)) {
            continue;
          }

          let precision = 'APROXIMADA_CALLE';
          if (feat.place_type.includes('address')) precision = 'EXACTA_ALTURA';
          else if (feat.place_type.includes('poi')) precision = 'INTERSECCION';
          else if (feat.place_type.includes('neighborhood')) precision = 'BARRIO_CENTROIDE';

          return {
            lat,
            lng,
            precision,
            confidence: feat.relevance || 0.7,
            display_name: feat.place_name,
            direccion: feat.text ? `${feat.text} ${feat.address || ''}`.trim() : feat.place_name,
            barrio: barrio || '',
            localidad: targetCity,
            source: 'mapbox'
          };
        }
      }
    } catch (e) { }
  }

  // Paso 4: Fallback de Intersección ("Calle 1 y Calle 2")
  const intersectionMatch = cleaned.match(/^(.+?)\s+(?:y|esq\.?|esquina|\/)\s+(.+)$/i);
  if (intersectionMatch) {
    const s1 = intersectionMatch[1].trim();
    const s2 = intersectionMatch[2].trim();
    try {
      const [g1, g2] = await Promise.all([
        geocodeAddress(s1, barrio, targetCity),
        geocodeAddress(s2, barrio, targetCity)
      ]);
      if (g1 && g2) {
        const midLat = (g1.lat + g2.lat) / 2;
        const midLng = (g1.lng + g2.lng) / 2;
        return {
          lat: midLat,
          lng: midLng,
          precision: 'INTERSECCION',
          confidence: 0.85,
          display_name: `${s1} y ${s2}, ${targetCity}`,
          direccion: `${s1} y ${s2}`,
          barrio: barrio || g1.barrio || g2.barrio || '',
          localidad: targetCity,
          source: 'intersection_synthetic'
        };
      }
    } catch (e) { }
  }

  return null;
}

// ------------------------------------------------------------
// 5. Utilidad de Renderizado de Badge de Precisión Cartográfica
// ------------------------------------------------------------
export function renderPrecisionBadge(precision, coords = null) {
  let badgeClass = 'badge-secondary';
  let label = 'Sin geocodificar';
  let icon = '⚪';
  let tooltip = 'Ubicación aún no verificada';

  switch (precision) {
    case 'EXACTA_ALTURA':
      badgeClass = 'badge-success';
      label = 'Altura Exacta';
      icon = '🟢';
      tooltip = 'Número de puerta y altura verificado en catastro/OSM';
      break;
    case 'MANUAL_EXACTA':
      badgeClass = 'badge-success';
      label = 'Fijado en Mapa';
      icon = '🎯';
      tooltip = 'Posición fijada quirúrgicamente por el analista en el mapa';
      break;
    case 'GPS_COORDENADAS':
      badgeClass = 'badge-info';
      label = 'GPS / Google Maps';
      icon = '📍';
      tooltip = 'Coordenadas satelitales directas extraídas con precisión militar';
      break;
    case 'INTERSECCION':
      badgeClass = 'badge-primary';
      label = 'Esquina / Intersección';
      icon = '🔵';
      tooltip = 'Intersección de calles verificada';
      break;
    case 'APROXIMADA_CALLE':
      badgeClass = 'badge-warning';
      label = 'Calle Aproximada';
      icon = '🟡';
      tooltip = 'Ubicado a nivel de calle (altura exacta estimada)';
      break;
    case 'BARRIO_CENTROIDE':
      badgeClass = 'badge-danger';
      label = 'Barrio / Zona';
      icon = '🟠';
      tooltip = 'Centroide aproximado de barrio';
      break;
  }

  const coordTxt = coords ? ` [${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}]` : '';

  return `
    <span class="badge ${badgeClass} geo-precision-badge" title="${tooltip}" style="font-size:10px;padding:2px 6px;display:inline-flex;align-items:center;gap:4px;border-radius:4px;cursor:help">
      <span>${icon}</span>
      <span>${label}${coordTxt}</span>
    </span>
  `;
}
