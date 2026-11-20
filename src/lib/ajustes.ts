import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

const reader = createReader(process.cwd(), keystaticConfig);

export type Ajustes = NonNullable<Awaited<ReturnType<typeof reader.singletons.ajustes.read>>>;

export async function getAjustes() {
  const ajustes = await reader.singletons.ajustes.read();
  if (!ajustes) throw new Error('Falta src/content/ajustes/index.json');
  return ajustes;
}

/** Un valor entre [corchetes] es un marcador pendiente de rellenar. */
export const esMarcador = (v?: string | null) => !v || /^\[.*\]$/.test(v.trim());

export function usuarioInstagram(url?: string | null) {
  const m = url?.match(/instagram\.com\/([^/?#]+)/i);
  return m ? `@${m[1]}` : 'Instagram';
}
