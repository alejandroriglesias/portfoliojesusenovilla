/**
 * Consentimiento de cookies y almacenamiento (solo en el navegador).
 *
 * - «Necesarias» siempre activas: transiciones entre páginas y este registro.
 * - «Preferencias» opcional: recordar la vista de la página Obra.
 * - La elección caduca a los 12 meses y se vuelve a preguntar.
 * - Scripts futuros que necesiten permiso (p. ej. estadísticas) se escriben como
 *   <script type="text/plain" data-cookies="preferencias">…</script>
 *   y solo se ejecutan cuando su categoría está aceptada.
 */
export type Categoria = 'preferencias';

export interface Consentimiento {
  v: number;
  /** Fecha ISO de la elección. */
  fecha: string;
  preferencias: boolean;
}

const CLAVE = 'cookies:consentimiento';
const VERSION = 1;
const VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;
/** Datos guardados que dependen de «Preferencias»: se borran si se rechaza. */
const DE_PREFERENCIAS = ['obra:modo', 'obra:vista'];

export const EVENTO_CAMBIO = 'cookies:cambio';
export const EVENTO_ABRIR = 'cookies:abrir';

export function leerConsentimiento(): Consentimiento | null {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Consentimiento | null;
    if (!c || c.v !== VERSION) return null;
    if (Date.now() - new Date(c.fecha).getTime() > VIGENCIA_MS) return null;
    return c;
  } catch {
    return null;
  }
}

export function permite(categoria: Categoria) {
  return leerConsentimiento()?.[categoria] === true;
}

export function guardarConsentimiento(elegido: { preferencias: boolean }) {
  const c: Consentimiento = { v: VERSION, fecha: new Date().toISOString(), ...elegido };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(c));
    if (!c.preferencias) DE_PREFERENCIAS.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* almacenamiento bloqueado: la elección vale solo para esta visita */
  }
  activarScripts(c);
  document.dispatchEvent(new CustomEvent<Consentimiento>(EVENTO_CAMBIO, { detail: c }));
  return c;
}

/** Ejecuta los scripts en espera cuya categoría ya está aceptada. */
export function activarScripts(c = leerConsentimiento()) {
  if (!c) return;
  document.querySelectorAll<HTMLScriptElement>('script[type="text/plain"][data-cookies]').forEach((viejo) => {
    const cat = viejo.dataset.cookies as Categoria;
    if (c[cat] !== true) return;
    const nuevo = document.createElement('script');
    [...viejo.attributes].forEach((a) => a.name !== 'type' && nuevo.setAttribute(a.name, a.value));
    nuevo.textContent = viejo.textContent;
    viejo.replaceWith(nuevo);
  });
}

/** Abre el aviso de cookies con los ajustes desplegados (enlace del pie). */
export function abrirAjustesCookies() {
  document.dispatchEvent(new Event(EVENTO_ABRIR));
}
