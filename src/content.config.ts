import { defineCollection } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';

/*
 * Colecciones de Astro que leen los archivos que escribe Keystatic
 * (ver keystatic.config.ts). Así las imágenes pasan por astro:assets
 * y los datos quedan tipados.
 */

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const textoOpcional = z.string().optional().transform((v) => (v?.trim() ? v.trim() : undefined));

const SUBTECNICAS = [
  'aguafuerte',
  'aguatinta',
  'aguafuerte-y-aguatinta',
  'manera-negra',
  'punta-seca',
  'carborundo',
  'alcograbado',
  'zieglerografia',
  'stock-gum',
] as const;

/**
 * En producción quita del almacén de contenido las obras marcadas como
 * «ejemplo» o no publicadas, de modo que sus imágenes ni siquiera se importan
 * ni se copian a dist/.
 */
function sinEjemplosEnProduccion(loader: Loader): Loader {
  return {
    ...loader,
    name: 'obras-sin-ejemplos',
    load: async (ctx) => {
      await loader.load(ctx);
      if (!import.meta.env.PROD) return;
      for (const [id, entrada] of ctx.store.entries()) {
        const d = entrada.data as { ejemplo?: boolean; publicada?: boolean };
        if (d.ejemplo || d.publicada === false) {
          ctx.store.delete(id);
          ctx.logger.info(`Obra ${d.ejemplo ? 'de ejemplo' : 'oculta'} excluida de la publicación: ${id}`);
        }
      }
    },
  };
}

const obras = defineCollection({
  loader: sinEjemplosEnProduccion(glob({ pattern: '**/*.mdoc', base: './src/content/obras' })),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      tecnica: z.discriminatedUnion('discriminant', [
        z.object({ discriminant: z.literal('oleo'), value: z.unknown().optional() }),
        z.object({ discriminant: z.literal('acuarela'), value: z.unknown().optional() }),
        z.object({
          discriminant: z.literal('grabado'),
          value: z.object({
            subtecnica: z.enum(SUBTECNICAS),
            edicion: textoOpcional,
          }),
        }),
      ]),
      // Keystatic lo guarda como texto ("2010"); aquí pasa a número o undefined.
      anio: z
        .union([z.number().int(), z.string()])
        .nullish()
        .transform((v) => (v == null || v === '' ? undefined : Number(v))),
      medidas: textoOpcional,
      soporte: textoOpcional,
      estado: z.enum(['sin-indicar', 'disponible', 'vendida', 'no-a-la-venta']).default('sin-indicar'),
      imagen: image(),
      alt: textoOpcional,
      imagenPlancha: image().nullish(),
      vistas: z.array(z.object({ imagen: image(), etiqueta: textoOpcional })).default([]),
      proceso: z
        .array(z.object({ imagen: image(), titulo: textoOpcional, texto: textoOpcional }))
        .default([]),
      paleta: z
        .object({ color1: hex.or(z.literal('')).optional(), color2: hex.or(z.literal('')).optional(), color3: hex.or(z.literal('')).optional() })
        .optional()
        .transform((p) => {
          const c = [p?.color1, p?.color2, p?.color3].filter((x): x is string => !!x);
          return c.length === 3 ? (c as [string, string, string]) : undefined;
        }),
      muro: z
        .object({ x: z.number().nullish(), y: z.number().nullish(), rotacion: z.number().nullish() })
        .optional()
        .transform((m) =>
          m && m.x != null && m.y != null ? { x: m.x, y: m.y, rotacion: m.rotacion ?? 0 } : undefined
        ),
      destacada: z.boolean().default(false),
      orden: z.number().default(100),
      ejemplo: z.boolean().default(false),
      notas: textoOpcional,
      entradilla: textoOpcional,
      publicada: z.boolean().default(true),
      interpretacionDe: textoOpcional,
    }),
});

const tecnicas = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/tecnicas' }),
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      grupo: z.enum(['principal', 'grabado']).default('principal'),
      resumen: textoOpcional,
      titular: textoOpcional,
      imagen: image().nullish(),
      orden: z.number().default(100),
    }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      fecha: z.coerce.date(),
      portada: image().nullish(),
      extracto: textoOpcional,
      borrador: z.boolean().default(false),
    }),
});

const sobreMi = defineCollection({
  loader: glob({ pattern: 'index.mdoc', base: './src/content/sobre-mi' }),
  schema: ({ image }) =>
    z.object({
      frase: textoOpcional,
      retrato: image().nullish(),
      firma: image().nullish(),
      trayectoria: z.array(z.object({ anio: textoOpcional, texto: textoOpcional })).default([]),
    }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/legal' }),
  schema: z.object({
    titulo: z.string(),
    actualizado: z.coerce.date(),
    resumen: textoOpcional,
    orden: z.number().default(100),
  }),
});

export const collections = { obras, tecnicas, blog, sobreMi, legal };
