/**
 * TEMPORAL — letras candidatas para los títulos (la «letra grande»). El texto
 * y el menú ya son Manrope. Lo usan la página /tipografias y PruebaFuentes
 * («Probar en toda la web»).
 */
export interface FuentePrueba {
  id: string;
  nombre: string;
  /** Valor para --font-display. */
  familia: string;
  caracter: string;
  /** Solo tiene un grosor (no se debe engordar artificialmente). */
  unGrosor?: boolean;
  /** Anchura (para letras con eje de anchura, como Archivo). */
  anchura?: string;
}

export const FUENTES_PRUEBA: FuentePrueba[] = [
  {
    id: 'syne',
    nombre: 'Syne (la actual)',
    familia: "'Syne Variable', 'Syne', system-ui, sans-serif",
    caracter: 'Ancha y rara, con mucha personalidad; la que tiene la web ahora.',
  },
  {
    id: 'bricolage-grotesque',
    nombre: 'Bricolage Grotesque',
    familia: "'Bricolage Grotesque Variable', system-ui, sans-serif",
    caracter: 'Grotesca expresiva y artesanal, de las más de moda. Moderna sin ser fría.',
  },
  {
    id: 'unbounded',
    nombre: 'Unbounded',
    familia: "'Unbounded Variable', system-ui, sans-serif",
    caracter: 'Geométrica muy ancha y redonda: la más parecida en fuerza a Syne, más amable.',
  },
  {
    id: 'archivo',
    nombre: 'Archivo Expanded',
    familia: "'Archivo Variable', system-ui, sans-serif",
    caracter: 'Grotesca ensanchada, sobria y contundente; aire de cartel y de museo.',
    anchura: '125%',
  },
  {
    id: 'fraunces',
    nombre: 'Fraunces',
    familia: "'Fraunces Variable', Georgia, serif",
    caracter: 'Serifa blanda con carácter; cálida y artística, muy actual.',
  },
  {
    id: 'playfair-display',
    nombre: 'Playfair Display',
    familia: "'Playfair Display Variable', Georgia, serif",
    caracter: 'Serifa clásica de alto contraste, la de la web de referencia: elegante y de galería.',
  },
  {
    id: 'instrument-serif',
    nombre: 'Instrument Serif',
    familia: "'Instrument Serif', Georgia, serif",
    caracter: 'Serifa fina y condensada, muy editorial y en tendencia; solo un grosor, se usa grande.',
    unGrosor: true,
  },
];

export const CLAVE_PRUEBA = 'prueba:titulos';
