/**
 * TEMPORAL — letras candidatas para menú y párrafos (Syne se queda en títulos).
 * Lo usan la página /tipografias y PruebaFuentes («Probar en toda la web»).
 */
export interface FuentePrueba {
  id: string;
  nombre: string;
  /** Valor para --font-body. */
  familia: string;
  caracter: string;
}

export const FUENTES_PRUEBA: FuentePrueba[] = [
  {
    id: 'inter',
    nombre: 'Inter (la actual)',
    familia: "'Inter Variable', 'Inter', system-ui, sans-serif",
    caracter: 'Neutra y muy legible, pero es la más usada de la web.',
  },
  {
    id: 'instrument-sans',
    nombre: 'Instrument Sans',
    familia: "'Instrument Sans Variable', system-ui, sans-serif",
    caracter: 'Grotesca algo estrecha, editorial y muy actual. La recomendada.',
  },
  {
    id: 'manrope',
    nombre: 'Manrope',
    familia: "'Manrope Variable', system-ui, sans-serif",
    caracter: 'Geométrica cálida, de formas abiertas; comparte el aire de Syne.',
  },
  {
    id: 'geist',
    nombre: 'Geist',
    familia: "'Geist Variable', system-ui, sans-serif",
    caracter: 'Grotesca precisa y limpia, aire de estudio de diseño.',
  },
  {
    id: 'dm-sans',
    nombre: 'DM Sans',
    familia: "'DM Sans Variable', system-ui, sans-serif",
    caracter: 'Geométrica amable y redondeada; muy cómoda en textos largos.',
  },
  {
    id: 'newsreader',
    nombre: 'Newsreader (serifa)',
    familia: "'Newsreader Variable', Georgia, serif",
    caracter: 'Serifa editorial de catálogo de exposición; el menú también sería con serifa.',
  },
];

export const CLAVE_PRUEBA = 'prueba:fuente';
