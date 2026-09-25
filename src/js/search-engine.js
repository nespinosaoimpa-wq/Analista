/**
 * CRIMINT — Motor de Búsqueda Centralizado y Compulsa Automática
 * Indexa todas las entidades del sistema y detecta matches cruzados
 * entre personas, hechos, allanamientos, bandas, vehículos, familiares y direcciones.
 */

// ============================================================
// 1. NORMALIZACIÓN DE TEXTO PARA BÚSQUEDA ESTRICTA
// ============================================================

/**
 * Normaliza un string para comparación: minúsculas, sin acentos, sin puntuación extra
 */
export function normalizeText(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, ' ')   // solo alfanuméricos y espacios
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokeniza un string normalizado en palabras individuales
 */
function tokenize(str) {
  return normalizeText(str).split(' ').filter(w => w.length > 1);
}

/**
 * Calcula similitud entre dos strings usando distancia de Levenshtein normalizada
 */
function levenshteinSimilarity(a, b) {
  if (!a || !b) return 0;
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;

  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  if (maxLen > 40) {
    // Para strings largos, usar inclusión parcial
    return na.includes(nb) || nb.includes(na) ? 0.7 : 0;
  }

  const matrix = [];
  for (let i = 0; i <= na.length; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= nb.length; j++) {
      if (i === 0) {
        matrix[i][j] = j;
      } else {
        const cost = na[i - 1] === nb[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
  }
  const dist = matrix[na.length][nb.length];
  return 1 - dist / maxLen;
}

// ============================================================
// 2. ÍNDICE INVERTIDO EN MEMORIA
// ============================================================

class SearchIndex {
  constructor() {
    this.entries = [];        // Todos los registros indexados
    this.invertedIndex = {};  // palabra → [índices de entries]
    this.dniIndex = {};       // DNI → [entry indices]
    this.cuijIndex = {};      // CUIJ → [entry indices]
    this.patenteIndex = {};   // Patente → [entry indices]
    this.aliasIndex = {};     // Alias normalizado → [entry indices]
    this.addressIndex = {};   // Dirección normalizada → [entry indices]
    this.nameIndex = {};      // Nombre completo norm → [entry indices]
    this.built = false;
    this.lastBuildTime = 0;
  }

  /**
   * Construye el índice a partir de los datos actuales del sistema.
   * Se llama una vez al inicio y luego se refresca incrementalmente.
   */
  async build(getPersonas, getHechos, getBandas, getAllanamientos, getAllVinculos) {
    const startTime = performance.now();
    this.entries = [];
    this.invertedIndex = {};
    this.dniIndex = {};
    this.cuijIndex = {};
    this.patenteIndex = {};
    this.aliasIndex = {};
    this.addressIndex = {};
    this.nameIndex = {};

    try {
      const [personas, hechos, bandas, allanamientos, vinculos] = await Promise.all([
        getPersonas({ limit: 5000 }),
        getHechos({ limit: 5000 }),
        getBandas({ limit: 500 }),
        getAllanamientos({ limit: 2000 }),
        getAllVinculos()
      ]);

      // Indexar PERSONAS (incluyendo sub-entidades: familiares, vehículos, causas, domicilios)
      personas.forEach(p => {
        const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.trim();
        const aliases = Array.isArray(p.alias) ? p.alias : (p.alias ? [p.alias] : []);
        const roles = Array.isArray(p.roles) ? p.roles : (p.roles ? [p.roles] : []);

        // Todos los textos buscables de esta persona
        const searchableTexts = [
          nombreCompleto,
          ...aliases,
          p.dni || '',
          p.cuit || '',
          p.banda_nombre || '',
          p.domicilio_principal || '',
          p.estado_procesal || '',
          p.antecedentes_texto || '',
          ...roles,
          ...(Array.isArray(p.cuij_asociados) ? p.cuij_asociados : []),
          ...(Array.isArray(p.delitos_asociados) ? p.delitos_asociados : []),
        ];

        // Añadir domicilios
        if (Array.isArray(p.domicilios)) {
          p.domicilios.forEach(d => {
            searchableTexts.push(d.direccion || '');
            searchableTexts.push(d.barrio || '');
            searchableTexts.push(d.detalle || '');
          });
        }

        // Añadir causas (CUIJ y carátulas)
        if (Array.isArray(p.causas)) {
          p.causas.forEach(c => {
            searchableTexts.push(c.cuij || '');
            searchableTexts.push(c.caratula || '');
            searchableTexts.push(c.organo || '');
          });
        }

        // Añadir vehículos
        if (Array.isArray(p.vehiculos)) {
          p.vehiculos.forEach(v => {
            searchableTexts.push(v.patente || '');
            searchableTexts.push(`${v.marca || ''} ${v.modelo || ''}`);
            searchableTexts.push(v.color || '');
            searchableTexts.push(v.titular || '');
          });
        }

        // Añadir familiares
        if (Array.isArray(p.familiares)) {
          p.familiares.forEach(f => {
            searchableTexts.push(f.nombre || '');
            searchableTexts.push(f.dni || '');
            searchableTexts.push(f.parentesco || '');
          });
        }

        const idx = this.entries.length;
        const entry = {
          type: 'persona',
          id: p.id,
          title: nombreCompleto || 'Sin nombre',
          subtitle: aliases.length ? `Alias: ${aliases.join(', ')}` : (p.dni ? `DNI: ${p.dni}` : ''),
          data: p,
          searchText: searchableTexts.join(' '),
          score: 0,
          matchReasons: []
        };
        this.entries.push(entry);

        // Índices directos
        if (p.dni) this._addToMap(this.dniIndex, normalizeText(p.dni), idx);
        aliases.forEach(a => this._addToMap(this.aliasIndex, normalizeText(a), idx));
        if (nombreCompleto) this._addToMap(this.nameIndex, normalizeText(nombreCompleto), idx);

        // Indexar domicilios
        if (p.domicilio_principal) {
          this._addToMap(this.addressIndex, normalizeText(p.domicilio_principal), idx);
        }
        if (Array.isArray(p.domicilios)) {
          p.domicilios.forEach(d => {
            if (d.direccion) this._addToMap(this.addressIndex, normalizeText(d.direccion), idx);
          });
        }

        // Indexar CUIJ de causas
        if (Array.isArray(p.causas)) {
          p.causas.forEach(c => {
            if (c.cuij) this._addToMap(this.cuijIndex, normalizeText(c.cuij), idx);
          });
        }
        if (Array.isArray(p.cuij_asociados)) {
          p.cuij_asociados.forEach(c => {
            this._addToMap(this.cuijIndex, normalizeText(c), idx);
          });
        }

        // Indexar patentes
        if (Array.isArray(p.vehiculos)) {
          p.vehiculos.forEach(v => {
            if (v.patente) this._addToMap(this.patenteIndex, normalizeText(v.patente), idx);
          });
        }

        // Índice invertido de palabras
        this._indexWords(searchableTexts.join(' '), idx);
      });

      // Indexar HECHOS
      hechos.forEach(h => {
        const searchableTexts = [
          h.tipo_penal || '',
          h.cuij || '',
          h.direccion || '',
          h.barrio || '',
          h.localidad || '',
          h.resumen || '',
          h.modus_operandi || '',
          h.fecha || ''
        ];

        const idx = this.entries.length;
        this.entries.push({
          type: 'hecho',
          id: h.id,
          title: h.tipo_penal || 'Hecho',
          subtitle: `${h.direccion || h.barrio || ''} ${h.cuij ? `(CUIJ: ${h.cuij})` : ''} ${h.fecha ? `— ${h.fecha.split('T')[0]}` : ''}`,
          data: h,
          searchText: searchableTexts.join(' '),
          score: 0,
          matchReasons: []
        });

        if (h.cuij) this._addToMap(this.cuijIndex, normalizeText(h.cuij), idx);
        if (h.direccion) this._addToMap(this.addressIndex, normalizeText(h.direccion), idx);
        this._indexWords(searchableTexts.join(' '), idx);
      });

      // Indexar BANDAS
      bandas.forEach(b => {
        const searchableTexts = [
          b.nombre || '',
          b.barrio_base || '',
          b.descripcion || '',
          b.actividad_principal || ''
        ];

        const idx = this.entries.length;
        this.entries.push({
          type: 'banda',
          id: b.id,
          title: `Banda: ${b.nombre}`,
          subtitle: b.barrio_base ? `Base: ${b.barrio_base}` : '',
          data: b,
          searchText: searchableTexts.join(' '),
          score: 0,
          matchReasons: []
        });

        this._indexWords(searchableTexts.join(' '), idx);
      });

      // Indexar ALLANAMIENTOS
      allanamientos.forEach(a => {
        const searchableTexts = [
          a.cuij || '',
          a.direccion || '',
          a.barrio || '',
          a.resultado_detalle || '',
          a.resumen || '',
          a.fuerza_interviniente || '',
          a.fecha_operativo || ''
        ];

        const idx = this.entries.length;
        this.entries.push({
          type: 'allanamiento',
          id: a.id,
          title: `Allanamiento: ${a.cuij || a.direccion}`,
          subtitle: `${a.direccion || ''} ${a.barrio ? `(${a.barrio})` : ''} ${a.fecha_operativo ? `— ${a.fecha_operativo.split('T')[0]}` : ''}`,
          data: a,
          searchText: searchableTexts.join(' '),
          score: 0,
          matchReasons: []
        });

        if (a.cuij) this._addToMap(this.cuijIndex, normalizeText(a.cuij), idx);
        if (a.direccion) this._addToMap(this.addressIndex, normalizeText(a.direccion), idx);
        this._indexWords(searchableTexts.join(' '), idx);
      });

      this.built = true;
      this.lastBuildTime = performance.now() - startTime;
      console.log(`[CRIMINT Search] Índice construido: ${this.entries.length} entidades en ${this.lastBuildTime.toFixed(0)}ms`);
    } catch (err) {
      console.error('[CRIMINT Search] Error construyendo índice:', err);
    }
  }

  _addToMap(map, key, idx) {
    if (!key) return;
    if (!map[key]) map[key] = [];
    if (!map[key].includes(idx)) map[key].push(idx);
  }

  _indexWords(text, idx) {
    const words = tokenize(text);
    words.forEach(word => {
      this._addToMap(this.invertedIndex, word, idx);
    });
  }

  /**
   * Añade una nueva entidad al índice sin reconstruir todo
   */
  addEntry(entry) {
    const idx = this.entries.length;
    this.entries.push(entry);
    this._indexWords(entry.searchText, idx);
    return idx;
  }

  /**
   * Búsqueda principal: multi-campo, con score y razones del match
   */
  search(query, { limit = 30, types = null, minScore = 0.3 } = {}) {
    if (!query || query.length < 2 || !this.built) return [];
    
    const normalizedQuery = normalizeText(query);
    const queryTokens = tokenize(query);
    const results = new Map(); // entryIdx → {score, reasons}

    // 1. Búsqueda directa por DNI
    if (/^\d{7,8}$/.test(query.replace(/\D/g, ''))) {
      const dniNorm = normalizeText(query.replace(/\D/g, ''));
      const dniMatches = this.dniIndex[dniNorm] || [];
      dniMatches.forEach(idx => {
        this._addResult(results, idx, 1.0, '🆔 DNI exacto');
      });
      // Buscar también en familiares
      this.entries.forEach((e, idx) => {
        if (e.type === 'persona' && Array.isArray(e.data.familiares)) {
          e.data.familiares.forEach(f => {
            if (normalizeText(f.dni) === dniNorm) {
              this._addResult(results, idx, 0.85, `👨‍👩‍👧 Familiar: ${f.nombre} (${f.parentesco})`);
            }
          });
        }
      });
    }

    // 2. Búsqueda por CUIJ (formato XX-XXXXXXXX-X)
    if (/\d{2}[-\s]?\d{6,10}[-\s]?\d{0,1}/.test(query)) {
      const cuijNorm = normalizeText(query);
      Object.entries(this.cuijIndex).forEach(([key, indices]) => {
        if (key.includes(cuijNorm) || cuijNorm.includes(key)) {
          indices.forEach(idx => {
            this._addResult(results, idx, 0.95, '📋 CUIJ coincide');
          });
        }
      });
    }

    // 3. Búsqueda por PATENTE
    if (/^[a-z]{2,3}\d{3}[a-z]{0,3}$/i.test(query.replace(/\s/g, '')) || /^\d{3}[a-z]{3}$/i.test(query.replace(/\s/g, ''))) {
      const patenteNorm = normalizeText(query.replace(/\s/g, ''));
      Object.entries(this.patenteIndex).forEach(([key, indices]) => {
        if (key.includes(patenteNorm) || patenteNorm.includes(key)) {
          indices.forEach(idx => {
            this._addResult(results, idx, 0.95, '🚗 Patente coincide');
          });
        }
      });
    }

    // 4. Búsqueda por ALIAS (match exacto y parcial)
    Object.entries(this.aliasIndex).forEach(([aliasKey, indices]) => {
      if (aliasKey === normalizedQuery) {
        indices.forEach(idx => this._addResult(results, idx, 0.95, '🏷️ Alias exacto'));
      } else if (aliasKey.includes(normalizedQuery) || normalizedQuery.includes(aliasKey)) {
        indices.forEach(idx => this._addResult(results, idx, 0.8, '🏷️ Alias parcial'));
      }
    });

    // 5. Búsqueda por NOMBRE (match exacto y parcial)
    Object.entries(this.nameIndex).forEach(([nameKey, indices]) => {
      const sim = levenshteinSimilarity(normalizedQuery, nameKey);
      if (sim >= 0.7) {
        indices.forEach(idx => this._addResult(results, idx, sim, sim >= 0.9 ? '👤 Nombre exacto' : '👤 Nombre similar'));
      } else {
        // Verificar si todas las palabras de la query están en el nombre
        const nameTokens = tokenize(nameKey);
        const queryTokensInName = queryTokens.filter(qt => nameTokens.some(nt => nt.includes(qt) || qt.includes(nt)));
        if (queryTokensInName.length > 0 && queryTokensInName.length >= Math.min(queryTokens.length, nameTokens.length)) {
          indices.forEach(idx => this._addResult(results, idx, 0.75, '👤 Nombre coincide'));
        }
      }
    });

    // 6. Búsqueda por DIRECCIÓN
    Object.entries(this.addressIndex).forEach(([addrKey, indices]) => {
      // Para direcciones, verificar que las palabras clave estén presentes
      const addrTokens = tokenize(addrKey);
      const matchingTokens = queryTokens.filter(qt =>
        addrTokens.some(at => at.includes(qt) || qt.includes(at))
      );
      if (matchingTokens.length >= Math.min(2, queryTokens.length) && queryTokens.length >= 2) {
        indices.forEach(idx => {
          const entityType = this.entries[idx]?.type;
          const label = entityType === 'persona' ? '🏠 Domicilio' : entityType === 'hecho' ? '📍 Dirección del hecho' : '📍 Dirección operativo';
          this._addResult(results, idx, 0.7, label);
        });
      }
    });

    // 7. Búsqueda por índice invertido de palabras (catch-all)
    queryTokens.forEach(token => {
      // Buscar la palabra exacta
      const exactMatches = this.invertedIndex[token] || [];
      exactMatches.forEach(idx => {
        this._addResult(results, idx, 0.5, '🔍 Texto coincide');
      });

      // Buscar prefijo (autocomplete)
      if (token.length >= 3) {
        Object.entries(this.invertedIndex).forEach(([word, indices]) => {
          if (word !== token && word.startsWith(token)) {
            indices.forEach(idx => {
              this._addResult(results, idx, 0.35, '🔍 Texto parcial');
            });
          }
        });
      }
    });

    // Compilar resultados
    let resultsList = [];
    results.forEach(({ score, reasons }, idx) => {
      if (score < minScore) return;
      const entry = this.entries[idx];
      if (!entry) return;
      if (types && !types.includes(entry.type)) return;

      resultsList.push({
        type: entry.type,
        id: entry.id,
        title: entry.title,
        subtitle: entry.subtitle,
        score,
        matchReasons: [...new Set(reasons)],
        data: entry.data
      });
    });

    // Ordenar por score descendente
    resultsList.sort((a, b) => b.score - a.score);
    return resultsList.slice(0, limit);
  }

  _addResult(results, idx, score, reason) {
    if (results.has(idx)) {
      const existing = results.get(idx);
      existing.score = Math.max(existing.score, score);
      existing.reasons.push(reason);
    } else {
      results.set(idx, { score, reasons: [reason] });
    }
  }

  // ============================================================
  // 3. COMPULSA AUTOMÁTICA (CROSS-REFERENCING)
  // ============================================================

  /**
   * Dado un ID de persona, busca automáticamente todos los cruces posibles:
   * - Hechos en sus direcciones
   * - Allanamientos en sus direcciones
   * - Otras personas que comparten dirección, CUIJ, o familiares
   * - Bandas vinculadas
   */
  compulsaPersona(personaId) {
    if (!this.built) return { matches: [], total: 0 };

    const personaEntry = this.entries.find(e => e.type === 'persona' && e.id === personaId);
    if (!personaEntry) return { matches: [], total: 0 };

    const p = personaEntry.data;
    const matches = [];
    const seen = new Set();
    seen.add(personaId);

    // 1. Buscar por direcciones
    const direcciones = [];
    if (p.domicilio_principal) direcciones.push(normalizeText(p.domicilio_principal));
    if (Array.isArray(p.domicilios)) {
      p.domicilios.forEach(d => {
        if (d.direccion) direcciones.push(normalizeText(d.direccion));
      });
    }

    direcciones.forEach(dirNorm => {
      Object.entries(this.addressIndex).forEach(([addrKey, indices]) => {
        // Verificar similitud de direcciones
        const dirTokens = tokenize(dirNorm);
        const addrTokens = tokenize(addrKey);
        const common = dirTokens.filter(dt => addrTokens.some(at => at === dt || (at.length > 3 && dt.includes(at)) || (dt.length > 3 && at.includes(dt))));

        if (common.length >= 2 || (common.length === 1 && dirTokens.length <= 2)) {
          indices.forEach(idx => {
            const e = this.entries[idx];
            if (!e || seen.has(e.id)) return;
            seen.add(e.id);
            matches.push({
              type: e.type,
              id: e.id,
              title: e.title,
              subtitle: e.subtitle,
              data: e.data,
              matchType: 'direccion',
              matchDetail: `Misma dirección: ${addrKey}`,
              icon: '📍'
            });
          });
        }
      });
    });

    // 2. Buscar por CUIJ compartidos
    const cuijs = [];
    if (Array.isArray(p.causas)) p.causas.forEach(c => { if (c.cuij) cuijs.push(normalizeText(c.cuij)); });
    if (Array.isArray(p.cuij_asociados)) p.cuij_asociados.forEach(c => cuijs.push(normalizeText(c)));

    cuijs.forEach(cuijNorm => {
      Object.entries(this.cuijIndex).forEach(([cuijKey, indices]) => {
        if (cuijKey.includes(cuijNorm) || cuijNorm.includes(cuijKey)) {
          indices.forEach(idx => {
            const e = this.entries[idx];
            if (!e || seen.has(e.id)) return;
            seen.add(e.id);
            matches.push({
              type: e.type,
              id: e.id,
              title: e.title,
              subtitle: e.subtitle,
              data: e.data,
              matchType: 'cuij',
              matchDetail: `Misma causa CUIJ: ${cuijNorm}`,
              icon: '📋'
            });
          });
        }
      });
    });

    // 3. Buscar familiares que sean otras personas en el sistema
    if (Array.isArray(p.familiares)) {
      p.familiares.forEach(fam => {
        const famNameNorm = normalizeText(fam.nombre);
        // Buscar en el índice de nombres
        Object.entries(this.nameIndex).forEach(([nameKey, indices]) => {
          const sim = levenshteinSimilarity(famNameNorm, nameKey);
          if (sim >= 0.75) {
            indices.forEach(idx => {
              const e = this.entries[idx];
              if (!e || seen.has(e.id) || e.type !== 'persona') return;
              seen.add(e.id);
              matches.push({
                type: 'persona',
                id: e.id,
                title: e.title,
                subtitle: e.subtitle,
                data: e.data,
                matchType: 'familiar',
                matchDetail: `Familiar registrado: ${fam.nombre} (${fam.parentesco})`,
                icon: '👨‍👩‍👧'
              });
            });
          }
        });
        // También buscar por DNI de familiar
        if (fam.dni) {
          const famDniNorm = normalizeText(fam.dni);
          const dniHits = this.dniIndex[famDniNorm] || [];
          dniHits.forEach(idx => {
            const e = this.entries[idx];
            if (!e || seen.has(e.id)) return;
            seen.add(e.id);
            matches.push({
              type: 'persona',
              id: e.id,
              title: e.title,
              subtitle: e.subtitle,
              data: e.data,
              matchType: 'familiar_dni',
              matchDetail: `DNI familiar ${fam.nombre}: ${fam.dni}`,
              icon: '🆔'
            });
          });
        }
      });
    }

    // 4. Buscar por patentes compartidas (vehículos registrados a nombre de otros)
    if (Array.isArray(p.vehiculos)) {
      p.vehiculos.forEach(v => {
        if (v.patente) {
          const patNorm = normalizeText(v.patente);
          Object.entries(this.patenteIndex).forEach(([patKey, indices]) => {
            if (patKey === patNorm) {
              indices.forEach(idx => {
                const e = this.entries[idx];
                if (!e || seen.has(e.id)) return;
                seen.add(e.id);
                matches.push({
                  type: e.type,
                  id: e.id,
                  title: e.title,
                  subtitle: e.subtitle,
                  data: e.data,
                  matchType: 'vehiculo',
                  matchDetail: `Mismo vehículo patente: ${v.patente}`,
                  icon: '🚗'
                });
              });
            }
          });
        }
      });
    }

    // 5. Buscar por banda
    if (p.banda_nombre && p.banda_nombre !== 'Individual') {
      const bandaNorm = normalizeText(p.banda_nombre);
      this.entries.forEach((e, idx) => {
        if (e.type === 'persona' && !seen.has(e.id)) {
          const otherBanda = normalizeText(e.data.banda_nombre);
          if (otherBanda && otherBanda === bandaNorm) {
            seen.add(e.id);
            matches.push({
              type: 'persona',
              id: e.id,
              title: e.title,
              subtitle: e.subtitle,
              data: e.data,
              matchType: 'banda',
              matchDetail: `Misma banda: ${p.banda_nombre}`,
              icon: '🔗'
            });
          }
        }
      });
    }

    // Ordenar por tipo de match (prioridad)
    const matchPriority = { familiar_dni: 0, familiar: 1, cuij: 2, direccion: 3, vehiculo: 4, banda: 5 };
    matches.sort((a, b) => (matchPriority[a.matchType] || 99) - (matchPriority[b.matchType] || 99));

    return {
      matches,
      total: matches.length,
      categories: {
        familiares: matches.filter(m => m.matchType === 'familiar' || m.matchType === 'familiar_dni').length,
        causas: matches.filter(m => m.matchType === 'cuij').length,
        direcciones: matches.filter(m => m.matchType === 'direccion').length,
        vehiculos: matches.filter(m => m.matchType === 'vehiculo').length,
        banda: matches.filter(m => m.matchType === 'banda').length
      }
    };
  }

  /**
   * Compulsa general: dado un término de búsqueda, detecta todas las conexiones
   * cruzadas entre los resultados encontrados
   */
  compulsaGeneral(term) {
    const searchResults = this.search(term, { limit: 50, minScore: 0.3 });
    const connections = [];

    // Para cada par de resultados, verificar si están conectados
    for (let i = 0; i < searchResults.length; i++) {
      for (let j = i + 1; j < searchResults.length; j++) {
        const a = searchResults[i];
        const b = searchResults[j];
        const link = this._findConnection(a, b);
        if (link) {
          connections.push({
            from: { type: a.type, id: a.id, title: a.title },
            to: { type: b.type, id: b.id, title: b.title },
            ...link
          });
        }
      }
    }

    return { results: searchResults, connections };
  }

  _findConnection(a, b) {
    // Verificar conexión por dirección
    const aDirs = this._extractAddresses(a);
    const bDirs = this._extractAddresses(b);

    for (const ad of aDirs) {
      for (const bd of bDirs) {
        const adTokens = tokenize(ad);
        const bdTokens = tokenize(bd);
        const common = adTokens.filter(t => bdTokens.includes(t));
        if (common.length >= 2) {
          return { connectionType: 'direccion', detail: `Dirección compartida` };
        }
      }
    }

    // Verificar conexión por CUIJ
    const aCuij = this._extractCuij(a);
    const bCuij = this._extractCuij(b);
    for (const ac of aCuij) {
      for (const bc of bCuij) {
        if (normalizeText(ac) === normalizeText(bc)) {
          return { connectionType: 'cuij', detail: `Causa compartida: ${ac}` };
        }
      }
    }

    // Verificar conexión por banda
    const aBanda = a.data?.banda_nombre || a.data?.nombre;
    const bBanda = b.data?.banda_nombre || b.data?.nombre;
    if (aBanda && bBanda && normalizeText(aBanda) === normalizeText(bBanda) && a.type !== b.type) {
      return { connectionType: 'banda', detail: `Banda: ${aBanda}` };
    }

    return null;
  }

  _extractAddresses(entry) {
    const addrs = [];
    const d = entry.data;
    if (d?.direccion) addrs.push(d.direccion);
    if (d?.domicilio_principal) addrs.push(d.domicilio_principal);
    if (Array.isArray(d?.domicilios)) d.domicilios.forEach(dom => { if (dom.direccion) addrs.push(dom.direccion); });
    return addrs;
  }

  _extractCuij(entry) {
    const cuijs = [];
    const d = entry.data;
    if (d?.cuij) cuijs.push(d.cuij);
    if (Array.isArray(d?.causas)) d.causas.forEach(c => { if (c.cuij) cuijs.push(c.cuij); });
    if (Array.isArray(d?.cuij_asociados)) cuijs.push(...d.cuij_asociados);
    return cuijs;
  }

  /**
   * Estadísticas del índice para debug / monitoreo
   */
  getStats() {
    return {
      totalEntries: this.entries.length,
      personas: this.entries.filter(e => e.type === 'persona').length,
      hechos: this.entries.filter(e => e.type === 'hecho').length,
      bandas: this.entries.filter(e => e.type === 'banda').length,
      allanamientos: this.entries.filter(e => e.type === 'allanamiento').length,
      wordsIndexed: Object.keys(this.invertedIndex).length,
      dniIndexed: Object.keys(this.dniIndex).length,
      cuijIndexed: Object.keys(this.cuijIndex).length,
      patentesIndexed: Object.keys(this.patenteIndex).length,
      addressesIndexed: Object.keys(this.addressIndex).length,
      buildTimeMs: this.lastBuildTime,
      built: this.built
    };
  }
}

// Singleton global
export const searchEngine = new SearchIndex();
