export type Producto = {
  id: string;
  nombre: string;
  precioUsd: number;
};

export type LineaCarrito = {
  producto: Producto;
  cantidad: number;
};

const KEY_PRODUCTOS = "pos.productos";
const KEY_TASA = "pos.tasa";
const KEY_NEGOCIO = "pos.negocio";

export const PRODUCTOS_DEMO: Producto[] = [
  { id: "p1", nombre: "Harina P.A.N. 1kg", precioUsd: 1.2 },
  { id: "p2", nombre: "Arroz 1kg", precioUsd: 1.5 },
  { id: "p3", nombre: "Aceite 1L", precioUsd: 2.4 },
  { id: "p4", nombre: "Azúcar 1kg", precioUsd: 1.1 },
  { id: "p5", nombre: "Café molido 250g", precioUsd: 3.5 },
  { id: "p6", nombre: "Leche en polvo 1kg", precioUsd: 6.9 },
  { id: "p7", nombre: "Pasta larga 1kg", precioUsd: 1.3 },
  { id: "p8", nombre: "Refresco 2L", precioUsd: 2.0 },
  { id: "p9", nombre: "Pan campesino", precioUsd: 1.8 },
  { id: "p10", nombre: "Queso blanco 1kg", precioUsd: 5.2 },
];

export function cargarProductos(): Producto[] {
  if (typeof window === "undefined") return PRODUCTOS_DEMO;
  try {
    const raw = window.localStorage.getItem(KEY_PRODUCTOS);
    if (!raw) return PRODUCTOS_DEMO;
    const parsed = JSON.parse(raw) as Producto[];
    return Array.isArray(parsed) ? parsed : PRODUCTOS_DEMO;
  } catch {
    return PRODUCTOS_DEMO;
  }
}

export function guardarProductos(productos: Producto[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_PRODUCTOS, JSON.stringify(productos));
}

export function cargarTasaGuardada(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY_TASA);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function guardarTasa(tasa: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_TASA, String(tasa));
}

export function cargarNegocio(): string {
  if (typeof window === "undefined") return "Mi Negocio";
  return window.localStorage.getItem(KEY_NEGOCIO) ?? "Mi Negocio";
}

export function guardarNegocio(nombre: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_NEGOCIO, nombre);
}

export const fmtUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtBs = (n: number) =>
  `Bs ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function mensajeWhatsapp(opts: {
  negocio: string;
  lineas: LineaCarrito[];
  tasa: number;
  totalUsd: number;
}) {
  const { negocio, lineas, tasa, totalUsd } = opts;
  const items = lineas
    .map((l) => {
      const sub = l.producto.precioUsd * l.cantidad;
      return `• ${l.cantidad} x ${l.producto.nombre} — ${fmtUsd(sub)} / ${fmtBs(sub * tasa)}`;
    })
    .join("\n");

  return [
    `*${negocio}* — Nota de entrega`,
    new Date().toLocaleString("es-VE"),
    "",
    items,
    "",
    `*TOTAL: ${fmtUsd(totalUsd)}*`,
    `*TOTAL: ${fmtBs(totalUsd * tasa)}*`,
    `Tasa de referencia: ${fmtBs(tasa)} / $1`,
    "",
    "¡Gracias por su compra!",
  ].join("\n");
}
