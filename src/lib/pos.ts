import { jsPDF } from "jspdf";
import { BatteryCharging, CarFront, Disc3, Filter, Fuel, Gauge, Sparkles, type LucideIcon } from "lucide-react";

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

export type DatosFactura = {
  numero: string;
  fecha: Date;
  negocio: string;
  rifEmisor: string;
  direccionEmisor: string;
  telefonoEmisor: string;
  clienteNombre: string;
  clienteDocumento: string;
  clienteDireccion: string;
  clienteTelefono: string;
  clienteEmail: string;
  monedaReferencia: "usd" | "eur";
  tasa: number;
  ivaPorcentaje: number;
  metodoPago: string;
  observaciones: string;
};

export const ICONOS_POR_CATEGORIA = {
  Frenos: Disc3,
  Motor: CarFront,
  Filtros: Filter,
  Batería: BatteryCharging,
  Iluminación: Sparkles,
  Combustible: Fuel,
  Instrumentos: Gauge,
} as const;

const KEY_TASA = "pos.tasa";
const KEY_NEGOCIO = "pos.negocio";

export const PRODUCTOS_DEMO: Producto[] = [
  { id: "f1", nombre: "Pastillas de freno cerámicas", precioUsd: 38, icono: Disc3, categoria: "Frenos" },
  { id: "f2", nombre: "Discos ventilados delanteros", precioUsd: 96, icono: Disc3, categoria: "Frenos" },
  { id: "m1", nombre: "Kit de cadena de tiempo", precioUsd: 124, icono: CarFront, categoria: "Motor" },
  { id: "m2", nombre: "Bomba de agua", precioUsd: 52, icono: CarFront, categoria: "Motor" },
  { id: "fi1", nombre: "Filtro de aceite premium", precioUsd: 14, icono: Filter, categoria: "Filtros" },
  { id: "fi2", nombre: "Filtro de aire de cabina", precioUsd: 18, icono: Filter, categoria: "Filtros" },
  { id: "b1", nombre: "Batería 12V 60Ah", precioUsd: 118, icono: BatteryCharging, categoria: "Batería" },
  { id: "b2", nombre: "Batería 12V 75Ah", precioUsd: 154, icono: BatteryCharging, categoria: "Batería" },
  { id: "l1", nombre: "Juego de bombillos LED", precioUsd: 26, icono: Sparkles, categoria: "Iluminación" },
  { id: "c1", nombre: "Bomba de combustible", precioUsd: 74, icono: Fuel, categoria: "Combustible" },
  { id: "i1", nombre: "Sensor de temperatura", precioUsd: 22, icono: Gauge, categoria: "Instrumentos" },
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
  if (typeof window === "undefined") return "Autorepuestos Easy Cash";
  return window.localStorage.getItem(KEY_NEGOCIO) ?? "Autorepuestos Easy Cash";
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

export function formatearFechaFactura(fecha: Date) {
  return {
    fecha: fecha.toLocaleDateString("es-VE"),
    hora: fecha.toLocaleTimeString("es-VE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  };
}

export function calcularFactura(lineas: LineaCarrito[], ivaPorcentaje: number) {
  const baseUsd = lineas.reduce((s, l) => s + l.producto.precioUsd * l.cantidad, 0);
  const ivaUsd = baseUsd * (ivaPorcentaje / 100);
  const totalUsd = baseUsd + ivaUsd;

  return {
    baseUsd,
    ivaUsd,
    totalUsd,
    baseBs: baseUsd,
    ivaBs: ivaUsd,
    totalBs: totalUsd,
  };
}

export function crearFacturaHtml(opts: {
  datos: DatosFactura;
  lineas: LineaCarrito[];
}) {
  const { datos, lineas } = opts;
  const totales = calcularFactura(lineas, datos.ivaPorcentaje);
  const fechaHora = formatearFechaFactura(datos.fecha);
  const rows = lineas
    .map((l) => {
      const subtotalUsd = l.producto.precioUsd * l.cantidad;
      const subtotalBs = subtotalUsd * datos.tasa;
      return `
        <tr>
          <td>${l.cantidad}</td>
          <td>${l.producto.nombre}</td>
          <td>${fmtUsd(l.producto.precioUsd)}</td>
          <td>${fmtUsd(subtotalUsd)}</td>
          <td>${fmtBs(subtotalBs)}</td>
        </tr>
      `;
    })
    .join("");

  return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Factura ${datos.numero}</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #111827; background: #f3f4f6; }
    .page { max-width: 210mm; margin: 0 auto; background: white; padding: 16mm; min-height: 297mm; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
    h1 { margin: 0; font-size: 24px; }
    h2 { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; }
    .muted { color: #6b7280; font-size: 12px; line-height: 1.4; }
    .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .value { font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border-bottom: 1px solid #e5e7eb; text-align: left; padding: 8px 6px; font-size: 12px; vertical-align: top; }
    th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
    .totals { margin-top: 14px; display: grid; gap: 6px; justify-content: end; }
    .totals div { display: flex; justify-content: space-between; gap: 24px; min-width: 280px; font-size: 13px; }
    .totals strong { font-size: 15px; }
    .footer { margin-top: 18px; font-size: 11px; color: #6b7280; }
    @media print {
      body { background: white; }
      .page { min-height: auto; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <h1>Factura</h1>
        <div class="muted">${datos.negocio}</div>
        <div class="muted">${datos.direccionEmisor}</div>
        <div class="muted">RIF: ${datos.rifEmisor} | Teléfono: ${datos.telefonoEmisor}</div>
      </div>
      <div style="text-align:right">
        <h2>N° ${datos.numero}</h2>
        <div class="muted">Fecha: ${fechaHora.fecha}</div>
        <div class="muted">Hora: ${fechaHora.hora}</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="label">Cliente</div>
        <div class="value">${datos.clienteNombre || "Consumidor final"}</div>
        <div class="muted">${datos.clienteDocumento || "C.I. / RIF no indicado"}</div>
        <div class="muted">${datos.clienteDireccion || "Dirección no indicada"}</div>
        <div class="muted">${datos.clienteTelefono || ""}</div>
        <div class="muted">${datos.clienteEmail || ""}</div>
      </div>
      <div class="card">
        <div class="label">Pago</div>
        <div class="value">${datos.metodoPago}</div>
        <div class="muted">Tasa de referencia: ${fmtBs(datos.tasa)} por 1 $</div>
        <div class="muted">Moneda de referencia: ${datos.monedaReferencia.toUpperCase()}</div>
      </div>
    </div>

    <div class="card">
      <div class="label">Detalle</div>
      <table>
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Descripción</th>
            <th>Unit. USD</th>
            <th>Subtotal USD</th>
            <th>Subtotal Bs</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div><span>Base imponible</span><span>${fmtUsd(totales.baseUsd)} | ${fmtBs(totales.baseBs * datos.tasa)}</span></div>
      <div><span>IVA ${datos.ivaPorcentaje}%</span><span>${fmtUsd(totales.ivaUsd)} | ${fmtBs(totales.ivaBs * datos.tasa)}</span></div>
      <div><strong>Total</strong><strong>${fmtUsd(totales.totalUsd)} | ${fmtBs(totales.totalBs * datos.tasa)}</strong></div>
    </div>

    <div class="card" style="margin-top:12px;">
      <div class="label">Observaciones</div>
      <div class="muted">${datos.observaciones || "Sin observaciones."}</div>
    </div>

    <div class="footer">
      Documento emitido conforme a los requisitos generales de facturación aplicables en Venezuela. Verificar condiciones fiscales específicas del contribuyente antes de su uso oficial.
    </div>
  </div>
</body>
</html>
  `;
}

export function descargarFacturaPdf(opts: {
  datos: DatosFactura;
  lineas: LineaCarrito[];
}) {
  const { datos, lineas } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margenX = 14;
  let y = 16;
  const ancho = 210 - margenX * 2;
  const totales = calcularFactura(lineas, datos.ivaPorcentaje);
  const fechaHora = formatearFechaFactura(datos.fecha);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Factura", margenX, y);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(datos.negocio, margenX, y + 7);
  doc.text(datos.direccionEmisor, margenX, y + 12);
  doc.text(`RIF: ${datos.rifEmisor} | Tel: ${datos.telefonoEmisor}`, margenX, y + 17);
  doc.setFont("helvetica", "bold");
  doc.text(`N° ${datos.numero}`, 210 - margenX, y + 2, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${fechaHora.fecha}`, 210 - margenX, y + 8, { align: "right" });
  doc.text(`Hora: ${fechaHora.hora}`, 210 - margenX, y + 13, { align: "right" });

  y += 28;
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(margenX, y, ancho, 24, 3, 3, "S");
  doc.setFont("helvetica", "bold");
  doc.text("Cliente", margenX + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(datos.clienteNombre || "Consumidor final", margenX + 3, y + 11);
  doc.text(datos.clienteDocumento || "C.I. / RIF no indicado", margenX + 3, y + 16);
  doc.text(datos.metodoPago, margenX + 3, y + 21);

  doc.text(`Tasa: ${fmtBs(datos.tasa)} por 1 $`, margenX + 103, y + 11);
  doc.text(`Moneda: ${datos.monedaReferencia.toUpperCase()}`, margenX + 103, y + 16);
  doc.text(datos.clienteTelefono || "", margenX + 103, y + 21);

  y += 31;
  doc.setFont("helvetica", "bold");
  doc.text("Detalle", margenX, y);
  y += 4;

  const header = ["Cant.", "Descripción", "Unit. USD", "Subtotal USD", "Subtotal Bs"];
  const colX = [margenX, margenX + 16, margenX + 84, margenX + 120, margenX + 154];
  doc.setFontSize(9);
  header.forEach((h, i) => doc.text(h, colX[i], y));
  y += 2;
  doc.line(margenX, y, 210 - margenX, y);
  y += 5;
  doc.setFont("helvetica", "normal");

  lineas.forEach((l) => {
    const subtotalUsd = l.producto.precioUsd * l.cantidad;
    const subtotalBs = subtotalUsd * datos.tasa;
    const descripcion = doc.splitTextToSize(l.producto.nombre, 64);
    doc.text(String(l.cantidad), colX[0], y);
    doc.text(descripcion, colX[1], y);
    doc.text(fmtUsd(l.producto.precioUsd), colX[2], y);
    doc.text(fmtUsd(subtotalUsd), colX[3], y);
    doc.text(fmtBs(subtotalBs), colX[4], y);
    y += Math.max(6, descripcion.length * 4 + 1);
    if (y > 260) {
      doc.addPage();
      y = 16;
    }
  });

  y += 4;
  doc.line(margenX, y, 210 - margenX, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Base imponible: ${fmtUsd(totales.baseUsd)} | ${fmtBs(totales.baseBs * datos.tasa)}`, margenX, y);
  y += 6;
  doc.text(`IVA ${datos.ivaPorcentaje}%: ${fmtUsd(totales.ivaUsd)} | ${fmtBs(totales.ivaBs * datos.tasa)}`, margenX, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${fmtUsd(totales.totalUsd)} | ${fmtBs(totales.totalBs * datos.tasa)}`, margenX, y);

  y += 12;
  doc.setFont("helvetica", "normal");
  const observaciones = doc.splitTextToSize(`Observaciones: ${datos.observaciones || "Sin observaciones."}`, ancho);
  doc.text(observaciones, margenX, y);

  doc.save(`${datos.numero}.pdf`);
}
