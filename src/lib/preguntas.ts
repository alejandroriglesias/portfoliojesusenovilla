import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';
import { esMarcador } from './ajustes';

const reader = createReader(process.cwd(), keystaticConfig);

/** Preguntas frecuentes del panel, sin las que no tienen respuesta (vacía o entre [corchetes]). */
export async function getPreguntas() {
  const datos = await reader.singletons.preguntas.read();
  const preguntas = (datos?.preguntas ?? [])
    .map((p) => ({ pregunta: p.pregunta.trim(), respuesta: (p.respuesta ?? '').trim() }))
    .filter((p) => p.pregunta && p.respuesta && !esMarcador(p.respuesta));
  return { intro: datos?.intro && !esMarcador(datos.intro) ? datos.intro.trim() : undefined, preguntas };
}
