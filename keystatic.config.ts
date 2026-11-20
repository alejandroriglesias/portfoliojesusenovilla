import { collection, config, fields, singleton } from '@keystatic/core';

/*
 * Modelo de contenido (BRIEF §3).
 *
 * Las imágenes se guardan en src/assets/… (no en public/) para que Astro las
 * optimice con astro:assets. El `publicPath` es relativo al archivo de
 * contenido (src/content/<colección>/<slug>.mdoc → ../../assets/…).
 */

// En producción se guarda en GitHub. En local, en los archivos del proyecto, salvo que
// PUBLIC_KEYSTATIC_MODO=github (solo para el asistente de configuración inicial; ver README).
const usarGithub = import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_MODO === 'github';
// Repositorio de GitHub donde se guarda el contenido en producción, p. ej. «usuario/jesusenovilla-web».
// Se define como variable de entorno en Netlify (ver README).
const repo = (import.meta.env.PUBLIC_KEYSTATIC_GITHUB_REPO as `${string}/${string}` | undefined) ?? 'OWNER/REPO';

// ---------- Listas compartidas ----------

export const TECNICAS = [
  { label: 'Óleo', value: 'oleo' },
  { label: 'Acuarela', value: 'acuarela' },
  { label: 'Grabado', value: 'grabado' },
] as const;

export const SUBTECNICAS = [
  { label: 'Aguafuerte', value: 'aguafuerte' },
  { label: 'Aguatinta', value: 'aguatinta' },
  { label: 'Aguafuerte y aguatinta', value: 'aguafuerte-y-aguatinta' },
  { label: 'Manera negra', value: 'manera-negra' },
  { label: 'Punta seca', value: 'punta-seca' },
  { label: 'Carborundo', value: 'carborundo' },
  { label: 'Alcograbado', value: 'alcograbado' },
  { label: 'Zieglerografía', value: 'zieglerografia' },
  { label: 'Stock-gum', value: 'stock-gum' },
] as const;

const imagenObra = (label: string, description?: string, required = false) =>
  fields.image({
    label,
    description,
    directory: 'src/assets/obras',
    publicPath: '../../assets/obras/',
    validation: { isRequired: required },
  });

const colorHex = (label: string) =>
  fields.text({
    label,
    description: 'Formato #RRGGBB',
    validation: {
      length: { min: 0, max: 7 },
      pattern: { regex: /^(#[0-9A-Fa-f]{6})?$/, message: 'Usa el formato #RRGGBB, p. ej. #C8371A' },
    },
  });

const textoEnriquecido = (label: string, carpeta: string, description?: string) =>
  fields.markdoc({
    label,
    description,
    options: {
      image: {
        directory: `src/assets/${carpeta}`,
        publicPath: `../../assets/${carpeta}/`,
      },
      // Sin tablas ni bloques de código: no hacen falta y simplifican el editor.
      table: false,
      codeBlock: false,
    },
  });

export default config({
  storage: usarGithub
    ? {
        kind: 'github',
        repo,
        // Cada guardado desde el panel es un commit en la rama principal;
        // Netlify detecta el cambio y vuelve a publicar la web (1–2 minutos).
      }
    : { kind: 'local' },
  locale: 'es-ES',
  ui: {
    brand: { name: 'Jesús Senovilla' },
    navigation: {
      Contenido: ['obras', 'tecnicas', 'blog'],
      Páginas: ['sobreMi', 'ajustes'],
    },
  },

  collections: {
    // ======================= OBRAS =======================
    obras: collection({
      label: 'Obras',
      slugField: 'titulo',
      path: 'src/content/obras/*',
      format: { contentField: 'descripcion' },
      entryLayout: 'form',
      columns: ['titulo', 'anio', 'publicada'],
      previewUrl: '/obra/{slug}',
      schema: {
        titulo: fields.slug({
          name: { label: 'Título', validation: { isRequired: true } },
          slug: {
            label: 'Dirección web',
            description: 'Se genera a partir del título. Cambiarla rompe los enlaces antiguos.',
          },
        }),
        tecnica: fields.conditional(
          fields.select({
            label: 'Técnica',
            options: [...TECNICAS],
            defaultValue: 'oleo',
          }),
          {
            oleo: fields.empty(),
            acuarela: fields.empty(),
            grabado: fields.object({
              subtecnica: fields.select({
                label: 'Técnica de grabado',
                options: [...SUBTECNICAS],
                defaultValue: 'aguafuerte',
              }),
              edicion: fields.text({
                label: 'Edición',
                description: 'P. ej. «50 ejemplares».',
              }),
            }),
          }
        ),
        // Texto de 4 cifras (el campo numérico mostraba «2,010»).
        publicada: fields.checkbox({
          label: 'Publicada',
          description: 'Desmárcala para ocultar la obra de la web mientras la revisas (no se borra).',
          defaultValue: true,
        }),
        interpretacionDe: fields.text({
          label: 'Interpretación de…',
          description: 'Si es una interpretación de la obra de otro artista, su nombre (p. ej. «Sorolla»). Se muestra en la ficha.',
        }),
        anio: fields.text({
          label: 'Año',
          description: 'Cuatro cifras, p. ej. 2019. Vacío si no se sabe.',
          validation: {
            length: { min: 0, max: 4 },
            pattern: { regex: /^(\d{4})?$/, message: 'Escribe el año con cuatro cifras, p. ej. 2019' },
          },
        }),
        medidas: fields.text({ label: 'Medidas', description: '«alto × ancho cm», p. ej. «40 × 30 cm».' }),
        soporte: fields.text({ label: 'Soporte', description: 'Lienzo, tabla, papel…' }),
        estado: fields.select({
          label: 'Estado',
          description: 'Se muestra con un punto de color en la ficha.',
          options: [
            { label: 'Sin indicar', value: 'sin-indicar' },
            { label: 'Disponible', value: 'disponible' },
            { label: 'Vendida', value: 'vendida' },
            { label: 'No a la venta', value: 'no-a-la-venta' },
          ],
          defaultValue: 'sin-indicar',
        }),
        imagen: imagenObra(
          'Imagen principal',
          'Foto en alta resolución (mínimo 2500 px en el lado largo). Se usa para la lupa.',
          true
        ),
        alt: fields.text({
          label: 'Descripción de la imagen (texto alternativo)',
          description: 'Qué se ve en la obra, para personas que no pueden verla. Si se deja vacío se usa el título.',
          multiline: true,
        }),
        imagenPlancha: imagenObra(
          'Imagen de la plancha (opcional)',
          'Recorte sin papel. Se usa en algunas portadas y en las miniaturas.'
        ),
        vistas: fields.array(
          fields.object({
            imagen: imagenObra('Imagen', undefined, true),
            etiqueta: fields.text({ label: 'Etiqueta', description: 'Detalle, plancha, reverso…' }),
          }),
          {
            label: 'Otras vistas',
            description: 'Miniaturas de la ficha.',
            itemLabel: (p) => p.fields.etiqueta.value || 'Vista',
          }
        ),
        proceso: fields.array(
          fields.object({
            imagen: imagenObra('Imagen', undefined, true),
            titulo: fields.text({ label: 'Título del paso' }),
            texto: fields.text({ label: 'Texto', multiline: true }),
          }),
          {
            label: 'Cómo se hizo',
            description: 'Pasos del proceso. Si está vacío, la sección no aparece.',
            itemLabel: (p) => p.fields.titulo.value || 'Paso',
          }
        ),
        entradilla: fields.text({
          label: 'Entradilla',
          description: 'Una frase que presente la obra (se muestra grande en la ficha).',
          multiline: true,
        }),
        descripcion: textoEnriquecido('Descripción', 'obras'),
        paleta: fields.object(
          {
            color1: colorHex('Color 1'),
            color2: colorHex('Color 2'),
            color3: colorHex('Color 3'),
          },
          {
            label: 'Paleta (portada Bandas)',
            description: 'Tres colores dominantes. Déjalos vacíos para calcularlos automáticamente a partir de la imagen.',
            layout: [4, 4, 4],
          }
        ),
        muro: fields.object(
          {
            x: fields.integer({ label: 'X' }),
            y: fields.integer({ label: 'Y' }),
            rotacion: fields.number({ label: 'Rotación (°)', validation: { min: -15, max: 15 } }),
          },
          {
            label: 'Posición en el muro (portada Muro)',
            description: 'Opcional. Si se deja vacío, se coloca automáticamente.',
            layout: [4, 4, 4],
          }
        ),
        destacada: fields.checkbox({
          label: 'Obra destacada',
          description: 'Aparece en la portada.',
          defaultValue: false,
        }),
        orden: fields.integer({
          label: 'Orden',
          description: 'Las obras con número menor aparecen antes.',
          defaultValue: 100,
        }),
        ejemplo: fields.checkbox({
          label: 'Imagen de ejemplo (no publicar)',
          description: 'Marcada = imagen generada solo para desarrollo. Estas obras NO se publican en la web.',
          defaultValue: false,
        }),
        notas: fields.text({
          label: 'Notas internas',
          description: 'Solo para ti; no se muestran en la web.',
          multiline: true,
        }),
      },
    }),

    // ======================= TÉCNICAS =======================
    tecnicas: collection({
      label: 'Técnicas',
      slugField: 'nombre',
      path: 'src/content/tecnicas/*',
      format: { contentField: 'sobreLaTecnica' },
      entryLayout: 'form',
      columns: ['nombre', 'grupo'],
      previewUrl: '/tecnicas/{slug}',
      schema: {
        nombre: fields.slug({
          name: { label: 'Nombre', validation: { isRequired: true } },
          slug: {
            label: 'Dirección web',
            description: 'Debe coincidir con la técnica elegida en las obras (oleo, acuarela, grabado, manera-negra…).',
          },
        }),
        grupo: fields.select({
          label: 'Tipo',
          options: [
            { label: 'Técnica principal', value: 'principal' },
            { label: 'Técnica de grabado', value: 'grabado' },
          ],
          defaultValue: 'principal',
        }),
        resumen: fields.text({ label: 'Resumen', multiline: true }),
        titular: fields.text({
          label: 'Titular',
          description: 'Frase grande del bloque «Sobre la técnica», p. ej. «De la oscuridad hacia la luz.». La última palabra va en color.',
        }),
        imagen: fields.image({
          label: 'Imagen',
          directory: 'src/assets/tecnicas',
          publicPath: '../../assets/tecnicas/',
        }),
        orden: fields.integer({ label: 'Orden', defaultValue: 100 }),
        sobreLaTecnica: textoEnriquecido(
          'Sobre la técnica',
          'tecnicas',
          'Texto explicativo (bloque negro de la ficha de obra).'
        ),
      },
    }),

    // ======================= BLOG =======================
    blog: collection({
      label: 'Blog',
      slugField: 'titulo',
      path: 'src/content/blog/*',
      format: { contentField: 'cuerpo' },
      entryLayout: 'content',
      columns: ['titulo', 'fecha'],
      previewUrl: '/blog/{slug}',
      schema: {
        titulo: fields.slug({ name: { label: 'Título', validation: { isRequired: true } } }),
        fecha: fields.date({
          label: 'Fecha',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),
        portada: fields.image({
          label: 'Imagen de portada',
          directory: 'src/assets/blog',
          publicPath: '../../assets/blog/',
        }),
        extracto: fields.text({ label: 'Extracto', multiline: true }),
        borrador: fields.checkbox({
          label: 'Borrador',
          description: 'Los borradores no se publican.',
          defaultValue: false,
        }),
        cuerpo: textoEnriquecido('Texto', 'blog'),
      },
    }),
  },

  singletons: {
    // ======================= SOBRE MÍ =======================
    sobreMi: singleton({
      label: 'Sobre mí',
      path: 'src/content/sobre-mi/',
      format: { contentField: 'bio' },
      entryLayout: 'form',
      schema: {
        frase: fields.text({
          label: 'Frase',
          description: 'Una frase potente sobre tu forma de trabajar (tu manifiesto en una línea).',
          multiline: true,
        }),
        retrato: fields.image({
          label: 'Retrato',
          directory: 'src/assets/sobre-mi',
          publicPath: '../../assets/sobre-mi/',
        }),
        firma: fields.image({
          label: 'Firma',
          description: 'PNG con fondo transparente.',
          directory: 'src/assets/sobre-mi',
          publicPath: '../../assets/sobre-mi/',
        }),
        trayectoria: fields.array(
          fields.object({
            anio: fields.text({ label: 'Año' }),
            texto: fields.text({ label: 'Texto', description: 'Exposición, premio, formación…' }),
          }),
          {
            label: 'Trayectoria',
            itemLabel: (p) => [p.fields.anio.value, p.fields.texto.value].filter(Boolean).join(' · ') || 'Hito',
          }
        ),
        bio: textoEnriquecido('Biografía', 'sobre-mi'),
      },
    }),

    // ======================= AJUSTES =======================
    ajustes: singleton({
      label: 'Ajustes',
      path: 'src/content/ajustes/',
      format: { data: 'json' },
      schema: {
        email: fields.text({
          label: 'Email de contacto',
          description: 'Aparece en el pie y en Contacto.',
        }),
        instagram: fields.url({ label: 'Instagram (URL)' }),
        taller: fields.text({ label: 'Taller (ciudad)', description: 'Se muestra en Contacto.' }),
        encargos: fields.text({ label: 'Encargos', description: 'P. ej. «Sí, consultar plazos». Se muestra en Contacto.' }),
        portadaActiva: fields.select({
          label: 'Portada activa',
          description: 'Qué diseño se muestra en la página de inicio.',
          options: [
            { label: '01 · Galería', value: 'galeria' },
            { label: '02 · Luz', value: 'luz' },
            { label: '03 · Revista', value: 'revista' },
            { label: '04 · Muro', value: 'muro' },
            { label: '05 · Boceto', value: 'boceto' },
            { label: '06 · Bandas', value: 'bandas' },
          ],
          defaultValue: 'luz',
        }),
        frasePortada: fields.text({ label: 'Frase de portada', multiline: true }),
        condicionesEnvio: fields.text({
          label: 'Condiciones de envío',
          description: 'Se muestra en el bloque «¿Te interesa esta obra?» de cada ficha.',
        }),
        edicionRevista: fields.text({
          label: 'Edición (portada Revista)',
          description: 'P. ej. «Nº 01 — Invierno 2026».',
        }),
        seoTitulo: fields.text({ label: 'Título SEO por defecto' }),
        seoDescripcion: fields.text({ label: 'Descripción SEO por defecto', multiline: true }),
      },
    }),
  },
});
