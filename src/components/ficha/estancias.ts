/**
 * Estancias reales para la vista «en casa» (AmbienteObra). Todas son fotos de
 * Unsplash con la Licencia Unsplash: uso libre, también comercial, sin pedir
 * permiso ni atribuir (no se pueden revender tal cual).
 *
 * Calibración (en píxeles del archivo guardado en src/assets/ambiente):
 * - pxCm: escala en el plano de la pared, medida con un mueble de tamaño
 *   conocido (silla Thonet ~87 cm, puertas IKEA de 60 × 38 cm, etc.).
 * - x: centro horizontal de la obra.
 * - base: borde inferior más bajo permitido (por encima de muebles y plantas).
 * - centro: si existe, la obra se centra a esa altura (altura de los ojos) y
 *   solo baja hasta `base`; si no, se apoya siempre en `base`.
 * - max: hueco libre en la pared (cm, con marco). Si la obra no cabe, se
 *   reduce y deja de estar a escala; esas estancias no entran en el sorteo.
 * - foco: punto de la foto (0–1) que se mantiene centrado al recortarla.
 * - zoom: ampliación sobre el «cover» para fotos que abarcan mucha pared.
 * - sombra: dos sombras [x, y, desenfoque, opacidad] en cm, según la luz.
 * - luz: la foto en «multiplicar» sobre la obra (sombras y luz reales).
 * - canto: lado del bastidor que ve la cámara (según dónde cuelga la obra).
 */
import salon from '../../assets/ambiente/salon.jpg';
import sillaThonet from '../../assets/ambiente/silla-thonet.jpg';
import sillaRaton from '../../assets/ambiente/silla-raton.jpg';
import aparadorNogal from '../../assets/ambiente/aparador-nogal.jpg';
import aparadorAzul from '../../assets/ambiente/aparador-azul.jpg';
import sofaGris from '../../assets/ambiente/sofa-gris.jpg';

type Sombra = [x: number, y: number, desenfoque: number, opacidad: number];

export interface Estancia {
  id: string;
  /** Para el texto accesible: «La obra colgada en …». */
  descripcion: string;
  foto: ImageMetadata;
  pxCm: number;
  x: number;
  base: number;
  centro?: number;
  max: { w: number; h: number };
  foco: { x: number; y: number };
  zoom?: number;
  sombra: [Sombra, Sombra];
  luz: { opacidad: number; brillo: number; contraste: number };
  canto: 'izq' | 'der' | 'no';
  credito: { autor: string; url: string };
}

export const ESTANCIAS: Estancia[] = [
  {
    id: 'aparador-roble',
    descripcion: 'un salón, sobre un aparador de roble',
    foto: salon,
    pxCm: 12.5,
    x: 640,
    base: 1040,
    // Hasta 62 cm de alto: por encima, la obra quedaría pegada al borde de arriba de la foto.
    max: { w: 88, h: 62 },
    foco: { x: 0.3, y: 0.4 },
    sombra: [
      [0.35, 0.5, 0.7, 0.32],
      [1.6, 2.4, 4.5, 0.2],
    ],
    luz: { opacidad: 0.75, brillo: 1.12, contraste: 1.08 },
    canto: 'der',
    credito: { autor: 'Imani Bahati', url: 'https://unsplash.com/photos/UrQeWGobTnI' },
  },
  {
    id: 'silla-thonet',
    descripcion: 'un rincón con una silla Thonet y una planta',
    foto: sillaThonet,
    pxCm: 16.1,
    x: 1584,
    base: 2319,
    centro: 1240,
    max: { w: 80, h: 72 },
    foco: { x: 0.5, y: 0.55 },
    sombra: [
      [0.25, 0.45, 0.6, 0.28],
      [1.2, 2, 4, 0.16],
    ],
    luz: { opacidad: 0.6, brillo: 1.1, contraste: 1.05 },
    canto: 'izq',
    credito: { autor: 'Liana Mikah', url: 'https://unsplash.com/photos/Ul294fy2fmE' },
  },
  {
    id: 'silla-raton',
    descripcion: 'una pared blanca sobre una butaca de ratán',
    foto: sillaRaton,
    pxCm: 9.73,
    x: 1538,
    base: 1902,
    centro: 1289,
    max: { w: 150, h: 120 },
    foco: { x: 0.62, y: 0.52 },
    zoom: 1.2,
    sombra: [
      [0.3, 0.45, 0.6, 0.26],
      [1.3, 2.2, 4.2, 0.16],
    ],
    luz: { opacidad: 0.6, brillo: 1.08, contraste: 1.06 },
    canto: 'izq',
    credito: { autor: 'Alina Bondar', url: 'https://unsplash.com/photos/DJ3dx5MoUIw' },
  },
  {
    id: 'aparador-nogal',
    descripcion: 'un salón con luz de tarde, sobre un aparador de los años cincuenta',
    foto: aparadorNogal,
    pxCm: 8,
    x: 723,
    base: 1420,
    centro: 1200,
    max: { w: 110, h: 100 },
    foco: { x: 0.3, y: 0.44 },
    zoom: 1.4,
    sombra: [
      [0.4, 0.55, 0.5, 0.3],
      [1.8, 2.6, 4.5, 0.18],
    ],
    luz: { opacidad: 0.7, brillo: 1.06, contraste: 1.1 },
    canto: 'der',
    credito: { autor: 'Julia (@beazy)', url: 'https://unsplash.com/photos/aX1TTOuq83M' },
  },
  {
    id: 'aparador-azul',
    descripcion: 'un aparador azul con una lámpara encendida',
    foto: aparadorAzul,
    pxCm: 21.4,
    x: 1044,
    base: 1695,
    max: { w: 76, h: 54 },
    foco: { x: 0.5, y: 0.48 },
    // La lámpara alumbra desde abajo: la sombra cae hacia arriba.
    sombra: [
      [0.2, -0.35, 0.6, 0.3],
      [0.9, -1.6, 3.5, 0.16],
    ],
    luz: { opacidad: 0.8, brillo: 1.05, contraste: 1.05 },
    canto: 'no',
    credito: { autor: 'Mattes Buskies', url: 'https://unsplash.com/photos/w1c-ZiZMS4U' },
  },
  {
    id: 'sofa-gris',
    descripcion: 'una pared blanca sobre un sofá gris',
    foto: sofaGris,
    pxCm: 17.9,
    x: 1215,
    base: 1825,
    max: { w: 100, h: 80 },
    foco: { x: 0.5, y: 0.47 },
    sombra: [
      [0.15, 0.45, 0.6, 0.22],
      [0.6, 2, 4.2, 0.14],
    ],
    luz: { opacidad: 0.45, brillo: 1.03, contraste: 1.04 },
    canto: 'no',
    credito: { autor: 'dix sept', url: 'https://unsplash.com/photos/qY3pLOIpt4w' },
  },
];
