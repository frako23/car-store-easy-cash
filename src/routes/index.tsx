import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, RefreshCw, Search, Settings, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getTasa } from "@/lib/tasa.functions";
import {
  cargarNegocio,
  cargarProductos,
  cargarTasaGuardada,
  fmtBs,
  fmtUsd,
  guardarNegocio,
  guardarTasa,
  mensajeWhatsapp,
  type LineaCarrito,
  type Producto,
} from "@/lib/pos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Punto de Venta rápido en Bs y $ | CajaVE" },
      {
        name: "description",
        content:
          "Factura en segundos desde el celular: precios en bolívares y dólares con tasa del BCV y envío del recibo por WhatsApp.",
      },
      { property: "og:title", content: "CajaVE — Punto de venta móvil en Bs y $" },
      {
        property: "og:description",
        content:
          "Cobra rápido, calcula con la tasa de referencia del día y envía el detalle de la compra por WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PuntoDeVenta,
});

function PuntoDeVenta() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [tasaManual, setTasaManual] = useState<number | null>(null);
  const [negocio, setNegocio] = useState("Mi Negocio");
  const [telefono, setTelefono] = useState("");
  const [abrirCobro, setAbrirCobro] = useState(false);
  const [abrirAjustes, setAbrirAjustes] = useState(false);

  useEffect(() => {
    setProductos(cargarProductos());
    setTasaManual(cargarTasaGuardada());
    setNegocio(cargarNegocio());
  }, []);

  const tasaQuery = useQuery({
    queryKey: ["tasa"],
    queryFn: () => getTasa(),
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (tasaQuery.data?.usd) guardarTasa(tasaQuery.data.usd);
  }, [tasaQuery.data]);

  const tasa = tasaManual ?? tasaQuery.data?.usd ?? 0;

  const lineas: LineaCarrito[] = useMemo(
    () =>
      Object.entries(carrito)
        .map(([id, cantidad]) => {
          const producto = productos.find((p) => p.id === id);
          return producto ? { producto, cantidad } : null;
        })
        .filter((l): l is LineaCarrito => l !== null),
    [carrito, productos],
  );

  const totalUsd = lineas.reduce((s, l) => s + l.producto.precioUsd * l.cantidad, 0);
  const items = lineas.reduce((s, l) => s + l.cantidad, 0);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? productos.filter((p) => p.nombre.toLowerCase().includes(q)) : productos;
  }, [busqueda, productos]);

  const agregar = (id: string) => setCarrito((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const quitar = (id: string) =>
    setCarrito((c) => {
      const n = (c[id] ?? 0) - 1;
      const copia = { ...c };
      if (n <= 0) delete copia[id];
      else copia[id] = n;
      return copia;
    });

  const enviarWhatsapp = () => {
    const texto = mensajeWhatsapp({ negocio, lineas, tasa, totalUsd });
    const num = telefono.replace(/\D/g, "");
    const url = num
      ? `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-36">
      <header className="sticky top-0 z-20 bg-brand px-4 pb-4 pt-5 text-brand-foreground shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold">{negocio}</h1>
            <p className="text-xs text-brand-foreground/70">
              {tasa > 0 ? `Tasa ref. ${fmtBs(tasa)} / $1` : "Cargando tasa…"}
              {tasaManual ? " (manual)" : ""}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Actualizar tasa"
              className="text-brand-foreground hover:bg-brand-foreground/10"
              onClick={() => {
                setTasaManual(null);
                tasaQuery.refetch();
              }}
            >
              <RefreshCw className={tasaQuery.isFetching ? "animate-spin" : ""} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Ajustes"
              className="text-brand-foreground hover:bg-brand-foreground/10"
              onClick={() => setAbrirAjustes(true)}
            >
              <Settings />
            </Button>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            inputMode="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto…"
            className="h-12 rounded-xl border-0 bg-card pl-9 text-base text-foreground"
          />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 p-4">
        {filtrados.map((p) => {
          const cant = carrito[p.id] ?? 0;
          return (
            <button
              key={p.id}
              onClick={() => agregar(p.id)}
              className="relative flex min-h-28 flex-col justify-between rounded-2xl bg-card p-3 text-left shadow-card ring-1 ring-border transition active:scale-[0.97]"
            >
              {cant > 0 && (
                <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {cant}
                </span>
              )}
              <span className="pr-6 text-sm font-medium leading-snug">{p.nombre}</span>
              <span className="mt-2">
                <span className="block font-display text-lg font-semibold tabular text-foreground">
                  {fmtBs(p.precioUsd * tasa)}
                </span>
                <span className="block text-xs tabular text-muted-foreground">
                  {fmtUsd(p.precioUsd)}
                </span>
              </span>
            </button>
          );
        })}
        {filtrados.length === 0 && (
          <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">
            Sin resultados.{" "}
            <Link to="/productos" className="font-medium text-primary underline">
              Agregar producto
            </Link>
          </p>
        )}
      </section>

      {items > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md p-4">
          <button
            onClick={() => setAbrirCobro(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-pop transition active:scale-[0.98]"
          >
            <span className="text-sm font-medium">
              {items} {items === 1 ? "artículo" : "artículos"} · Cobrar
            </span>
            <span className="text-right">
              <span className="block font-display text-lg font-bold tabular">
                {fmtBs(totalUsd * tasa)}
              </span>
              <span className="block text-xs tabular opacity-80">{fmtUsd(totalUsd)}</span>
            </span>
          </button>
        </div>
      )}

      <Sheet open={abrirCobro} onOpenChange={setAbrirCobro}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="font-display">Resumen de la compra</SheetTitle>
          </SheetHeader>

          <div className="max-h-[45vh] space-y-2 overflow-y-auto px-4 py-3">
            {lineas.map((l) => (
              <div key={l.producto.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.producto.nombre}</p>
                  <p className="text-xs tabular text-muted-foreground">
                    {fmtBs(l.producto.precioUsd * l.cantidad * tasa)} ·{" "}
                    {fmtUsd(l.producto.precioUsd * l.cantidad)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => quitar(l.producto.id)}>
                    <Minus />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold tabular">
                    {l.cantidad}
                  </span>
                  <Button size="icon" variant="outline" onClick={() => agregar(l.producto.id)}>
                    <Plus />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t bg-muted/40 px-4 py-4">
            <div className="flex items-end justify-between">
              <span className="text-sm text-muted-foreground">Total a pagar</span>
              <span className="text-right">
                <span className="block font-display text-2xl font-bold tabular">
                  {fmtBs(totalUsd * tasa)}
                </span>
                <span className="block text-sm tabular text-muted-foreground">
                  {fmtUsd(totalUsd)}
                </span>
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tel">WhatsApp del comprador (opcional)</Label>
              <Input
                id="tel"
                inputMode="tel"
                placeholder="584121234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <Button className="h-13 w-full py-4 text-base font-semibold" onClick={enviarWhatsapp}>
              Enviar por WhatsApp
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCarrito({});
                  setAbrirCobro(false);
                }}
              >
                <Trash2 /> Vaciar
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setAbrirCobro(false)}>
                <X /> Seguir
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={abrirAjustes} onOpenChange={setAbrirAjustes}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          <SheetHeader className="px-0">
            <SheetTitle className="font-display">Ajustes</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="negocio">Nombre del negocio</Label>
              <Input
                id="negocio"
                value={negocio}
                className="h-12 text-base"
                onChange={(e) => {
                  setNegocio(e.target.value);
                  guardarNegocio(e.target.value);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tasa">Tasa de referencia (Bs por $1)</Label>
              <Input
                id="tasa"
                inputMode="decimal"
                value={tasa ? String(tasa) : ""}
                className="h-12 text-base tabular"
                onChange={(e) => {
                  const n = Number(e.target.value.replace(",", "."));
                  if (Number.isFinite(n) && n > 0) {
                    setTasaManual(n);
                    guardarTasa(n);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Fuente oficial: ve.dolarapi.com
                {tasaQuery.data?.fecha
                  ? ` · ${new Date(tasaQuery.data.fecha).toLocaleDateString("es-VE")}`
                  : ""}
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/productos">Administrar productos</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
