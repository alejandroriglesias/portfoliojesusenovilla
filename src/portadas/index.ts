import type { Portada } from '../lib/portada';
import Galeria from './Galeria.astro';
import Luz from './Luz.astro';
import Revista from './Revista.astro';
import Muro from './Muro.astro';
import Boceto from './Boceto.astro';
import Bandas from './Bandas.astro';
import Deriva from './Deriva.astro';

/** Componente de cada portada. */
export const COMPONENTES: Record<Portada, typeof Galeria> = {
  galeria: Galeria,
  luz: Luz,
  revista: Revista,
  muro: Muro,
  boceto: Boceto,
  bandas: Bandas,
  deriva: Deriva,
};

export const componenteDe = (p: Portada) => COMPONENTES[p] ?? Galeria;
