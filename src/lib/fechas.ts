const formato = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** «20 de noviembre de 2026» */
export const fechaLarga = (d: Date) => formato.format(d);

/** «2026-11-20» para el atributo datetime */
export const fechaISO = (d: Date) => d.toISOString().slice(0, 10);
