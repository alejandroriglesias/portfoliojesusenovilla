# CLAUDE.md — jesusenovilla.com

Proyecto: nueva web de portafolio del artista Jesús Senovilla con CMS propio fácil de usar.

## Antes de empezar
- Lee `BRIEF.md` (alcance, stack, modelo de contenido, tokens, fases) y `prototipos/README.md` (qué es cada diseño y cómo leer los archivos `.dc.html`).
- Trabaja por las fases del punto 8 del brief y confirma con el usuario al terminar cada una.

## Reglas
- Stack: Astro + Keystatic (modo `local` en desarrollo, `github` en producción), TypeScript, CSS propio con variables. Nada de Tailwind ni frameworks de UI salvo que el usuario lo pida.
- Los prototipos son la referencia visual: replica maquetación, tipografía, espaciados, colores e interacciones. No los ejecutes tal cual (dependen de un runtime que no está incluido); pásalos a componentes Astro con JS vanilla.
- Interfaz y contenidos en español.
- Accesibilidad: `<button>`/`<a>` reales, `alt` en todas las obras, foco visible, contraste AA y `prefers-reduced-motion` en cada animación.
- Imágenes con `astro:assets`; las fuentes autoalojadas si es posible.
- **Nunca publiques las imágenes de `assets/ejemplos/`** (son generadas, no son obras reales). Úsalas solo en desarrollo y márcalas como ejemplo en el contenido inicial.
- No inventes datos del artista (fechas, premios, exposiciones, precios): deja marcadores `[…]` y pregunta.
- Arranca con `npm run dev` y comprueba cada página en escritorio y a ancho de móvil antes de dar una fase por terminada.
