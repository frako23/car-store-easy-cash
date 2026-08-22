import { BadgePlus, BriefcaseMedical, Shirt, Stethoscope, type LucideIcon } from "lucide-react";

export type Producto = {
  id: string;
  nombre: string;
  precioUsd: number;
  icono: LucideIcon;
  categoria: string;
};

export type LineaCarrito = {
  producto: Producto;
  cantidad: number;
};

export const ICONOS_POR_CATEGORIA = {
  Uniforme: Shirt,
  Bata: BriefcaseMedical,
  Chaqueta: Stethoscope,
  Suéter: BadgePlus,
} as const;

const KEY_TASA = "pos.tasa";
const KEY_NEGOCIO = "pos.negocio";

export const PRODUCTOS_DEMO: Producto[] = [
  { id: "u1", nombre: "Uniforme médico $40", precioUsd: 40, icono: Shirt, categoria: "Uniforme" },
  { id: "u2", nombre: "Uniforme médico $50", precioUsd: 50, icono: Shirt, categoria: "Uniforme" },
  { id: "u3", nombre: "Uniforme médico $70", precioUsd: 70, icono: Shirt, categoria: "Uniforme" },
  { id: "u4", nombre: "Uniforme médico $80", precioUsd: 80, icono: Shirt, categoria: "Uniforme" },
  { id: "u5", nombre: "Uniforme médico $90", precioUsd: 90, icono: Shirt, categoria: "Uniforme" },
  {
    id: "u6",
    nombre: "Uniforme médico $120",
    precioUsd: 120,
    icono: Shirt,
    categoria: "Uniforme",
  },
  {
    id: "b1",
    nombre: "Bata médica $50",
    precioUsd: 50,
    icono: BriefcaseMedical,
    categoria: "Bata",
  },
  {
    id: "b2",
    nombre: "Bata médica $100",
    precioUsd: 100,
    icono: BriefcaseMedical,
    categoria: "Bata",
  },
  {
    id: "c1",
    nombre: "Chaqueta médica $40",
    precioUsd: 40,
    icono: Stethoscope,
    categoria: "Chaqueta",
  },
  {
    id: "c2",
    nombre: "Chaqueta médica $90",
    precioUsd: 90,
    icono: Stethoscope,
    categoria: "Chaqueta",
  },
  { id: "s1", nombre: "Suéter médico $100", precioUsd: 100, icono: BadgePlus, categoria: "Suéter" },
];

export function cargarProductos(): Producto[] {
  return PRODUCTOS_DEMO;
}

export function guardarProductos(_productos: Producto[]) {}

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
  if (typeof window === "undefined") return "Uniformes Médicos";
  return window.localStorage.getItem(KEY_NEGOCIO) ?? "Uniformes Médicos";
}

export function guardarNegocio(nombre: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_NEGOCIO, nombre);
}

export const fmtUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtRef = (n: number) =>
  `REF ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
      return [
        `• ${l.cantidad} x ${l.producto.categoria}`,
        `  ${fmtUsd(sub)} / ${fmtBs(sub * tasa)}`,
      ].join("\n");
    })
    .join("\n");

  return [
    `*${negocio}*`,
    "",
    "*Pedido de uniformes médicos*",
    `Fecha: ${new Date().toLocaleString("es-VE")}`,
    "",
    "*Datos para Pago Móvil*",
    "Teléfono: `0424-1468579`",
    "Cédula/RIF: `5522202`",
    "Banco: *0102 (BDV)*",
    "",
    "*Detalle del pedido*",
    items,
    "",
    "*Total a pagar*",
    `Total USD: *${fmtUsd(totalUsd)}*`,
    `Total Bs: *${fmtBs(totalUsd * tasa)}*`,
    "",
    `Tasa de referencia: *${fmtBs(tasa)} por 1 $*`,
    "",
    "Gracias por su compra.",
  ].join("\n");
}
