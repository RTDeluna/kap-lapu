import type { StyleSpecification } from '@maplibre/maplibre-react-native';

import { colors, type ThemeId } from '@/theme/tokens';

/**
 * The Laot base map: OpenFreeMap vector tiles (OpenMapTiles schema) painted with
 * our tokens. Sea is `map-water`, land is `map-land`, roads are `line`, so pins in
 * mango, dagat, ink and lapu stay readable. Labels are at least 14px with a halo so
 * they read in full sun on a boat.
 */
const OPENFREEMAP_TILES = 'https://tiles.openfreemap.org/planet';
const OPENFREEMAP_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

const FONT_REGULAR = ['Noto Sans Regular'];
const FONT_BOLD = ['Noto Sans Bold'];
const FONT_ITALIC = ['Noto Sans Italic'];

const LABEL_MIN = 14;

export function buildLaotStyle(theme: ThemeId): StyleSpecification {
  const c = colors[theme];
  const isDark = theme === 'dark';
  // A light halo by day; at night the halo is the night sea so sand text still pops.
  const halo = isDark ? c.surface : '#ffffff';
  const roadCasing = isDark ? c.surface : c.lineStrong;

  return {
    version: 8,
    name: `Laot ${theme}`,
    glyphs: OPENFREEMAP_GLYPHS,
    sources: {
      openmaptiles: {
        type: 'vector',
        url: OPENFREEMAP_TILES,
        attribution: '© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors',
      },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': c.mapLand } },
      {
        id: 'landcover-wood',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass', 'farmland']]],
        paint: { 'fill-color': c.surface, 'fill-opacity': 0.5 },
      },
      {
        id: 'landuse-residential',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        filter: ['in', ['get', 'class'], ['literal', ['residential', 'suburb', 'neighbourhood']]],
        paint: { 'fill-color': c.surface, 'fill-opacity': 0.6 },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': c.mapWater, 'fill-antialias': true },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        paint: {
          'line-color': c.mapWater,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 4],
        },
      },
      {
        id: 'coastline-edge',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'line-color': c.line, 'line-width': 1.5 },
      },
      {
        id: 'building',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: { 'fill-color': c.line, 'fill-opacity': 0.6 },
      },
      {
        id: 'road-casing',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': roadCasing,
          'line-opacity': 0.5,
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 16, 12],
        },
      },
      {
        id: 'road',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['!=', ['get', 'class'], 'ferry'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': c.line,
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], 1.2, 0.4],
            16,
            ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary'], 9, 4],
          ],
        },
      },
      {
        id: 'ferry',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['==', ['get', 'class'], 'ferry'],
        paint: { 'line-color': c.dagat, 'line-width': 1, 'line-dasharray': [2, 2], 'line-opacity': 0.6 },
      },
      {
        id: 'boundary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['all', ['<=', ['get', 'admin_level'], 6], ['!=', ['get', 'maritime'], 1]],
        paint: { 'line-color': c.lineStrong, 'line-width': 1, 'line-dasharray': [3, 2], 'line-opacity': 0.5 },
      },
      {
        id: 'road-label',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        minzoom: 14,
        layout: {
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
          'text-font': FONT_REGULAR,
          'text-size': LABEL_MIN,
        },
        paint: { 'text-color': c.inkMuted, 'text-halo-color': halo, 'text-halo-width': 1.5 },
      },
      {
        id: 'water-label',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'water_name',
        layout: {
          'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
          'text-font': FONT_ITALIC,
          'text-size': ['interpolate', ['linear'], ['zoom'], 6, LABEL_MIN, 14, 16],
          'text-letter-spacing': 0.05,
          'text-max-width': 8,
        },
        paint: { 'text-color': c.dagat, 'text-halo-color': halo, 'text-halo-width': 1.5 },
      },
      {
        id: 'place-label-minor',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['village', 'hamlet', 'suburb', 'neighbourhood', 'quarter']]],
        minzoom: 11,
        layout: {
          'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
          'text-font': FONT_REGULAR,
          'text-size': LABEL_MIN,
          'text-max-width': 8,
        },
        paint: { 'text-color': c.inkMuted, 'text-halo-color': halo, 'text-halo-width': 1.75 },
      },
      {
        id: 'place-label-major',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: {
          'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
          'text-font': FONT_BOLD,
          'text-size': ['interpolate', ['linear'], ['zoom'], 6, LABEL_MIN, 12, 17],
          'text-max-width': 8,
        },
        paint: { 'text-color': c.ink, 'text-halo-color': halo, 'text-halo-width': 2 },
      },
    ],
  };
}
