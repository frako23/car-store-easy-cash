import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  MoonStar,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  SunMedium,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  cargarNegocio,
  cargarProductos,
  cargarTasaGuardada,
  descargarFacturaPdf,
  fmtBs,
  fmtRef,
  fmtUsd,
  guardarNegocio,
  guardarTasa,
  type LineaCarrito,
  type Producto,
} from "@/lib/pos";
import { getTasa } from "@/lib/tasa.functions";

const THEME_KEY = "pos.theme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Autorepuestos Easy Cash | Tienda de repuestos" },
      {
        name: "description",
        content:
          "Catálogo mobile first para una tienda de repuestos automotrices con precios en REF y conversión a bolívares.",
      },
      { property: "og:title", content: "Autorepuestos Easy Cash" },
      {
        property: "og:description",
        content:
          "Compra rápida de repuestos automotrices con una interfaz moderna, clara y pensada para WhatsApp.",
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
  const [monedaTasa, setMonedaTasa] = useState<"usd" | "eur">("usd");
  const [negocio, setNegocio] = useState("Autorepuestos Easy Cash");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteDocumento, setClienteDocumento] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [metodoPago, setMetodoPago] = useState("Transferencia / pago móvil");
  const [numeroFactura, setNumeroFactura] = useState(
    () =>
      `FAC-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(Math.random() * 9000 + 1000)}`,
  );
  const [abrirCobro, setAbrirCobro] = useState(false);
  const [abrirAjustes, setAbrirAjustes] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setProductos(cargarProductos());
    setTasaManual(cargarTasaGuardada());
    setNegocio(cargarNegocio());
    setMonedaTasa("usd");
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    setDarkMode(
      savedTheme
        ? savedTheme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches,
    );
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  const tasaQuery = useQuery({
    queryKey: ["tasa"],
    queryFn: () => getTasa(),
    staleTime: 1000 * 60 * 30,
  });

  const tasaApi = monedaTasa === "usd" ? tasaQuery.data?.usd : tasaQuery.data?.eur;

  useEffect(() => {
    if (tasaApi) guardarTasa(tasaApi);
  }, [tasaApi]);

  const tasa = tasaManual ?? tasaApi ?? 0;

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
    return q
      ? productos.filter(
          (p) => p.categoria.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q),
        )
      : productos;
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

  const generarFacturaPdf = () => {
    const telefono = clienteTelefono.replace(/\D/g, "");
    const saludo = [
      `Hola ${clienteNombre || "estimado cliente"},`,
      "te estamos preparando tu factura digital en PDF.",
      "En breve te la haremos llegar por este medio.",
    ].join(" ");

    if (telefono) {
      const url = `https://wa.me/58${telefono}?text=${encodeURIComponent(saludo)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }

    void descargarFacturaPdf({
      datos: {
        numero: numeroFactura,
        fecha: new Date(),
        negocio,
        rifEmisor: "J-5522202-0",
        direccionEmisor: "Autorepuestos Easy Cash, Venezuela",
        telefonoEmisor: "0424-1468579",
        clienteNombre,
        clienteDocumento,
        clienteDireccion,
        clienteTelefono,
        clienteEmail,
        monedaReferencia: monedaTasa,
        tasa,
        ivaPorcentaje: 16,
        metodoPago,
        observaciones: "Factura generada desde el sistema digital de ventas.",
      },
      lineas,
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-36">
      <header className="hero sticky top-0 z-20 px-4 pb-4 pt-5 text-white shadow-card">
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-14 place-items-center overflow-hidden rounded-2xl bg-white/15 text-white shadow-card ring-1 ring-white/20">
            <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.28em] text-white/70">Tienda de repuestos</p>
            <h1 className="truncate font-display text-xl font-semibold text-white">{negocio}</h1>
            <div className="mt-2 flex  items-center gap-2 text-xs text-white/80">
              <div className="flex flex-col items-center rounded-full bg-white/12 px-2.5 py-1 font-medium leading-tight">
                <span>USD</span>
                <span>{tasaQuery.data?.usd ? fmtBs(tasaQuery.data.usd) : "..."}</span>
              </div>
              <div className="flex flex-col items-center rounded-full bg-white/12 px-2.5 py-1 font-medium leading-tight">
                <span>EUR</span>
                <span>{tasaQuery.data?.eur ? fmtBs(tasaQuery.data.eur) : "..."}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMonedaTasa((m) => (m === "usd" ? "eur" : "usd"));
                  setTasaManual(null);
                }}
                className="rounded-full bg-white px-3 py-1 font-semibold text-brand"
              >
                {monedaTasa === "usd" ? "Usando USD" : "Usando EUR"}
              </button>
            </div>
          </div>
          <div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Modo oscuro"
                className="text-white hover:bg-white/10"
                onClick={() => setDarkMode((v) => !v)}
              >
                {darkMode ? <SunMedium /> : <MoonStar />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Vaciar selección"
                className="text-white hover:bg-white/10"
                onClick={() => setCarrito({})}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Actualizar tasa"
                className="text-white hover:bg-white/10"
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
                className="text-white hover:bg-white/10"
                onClick={() => setAbrirAjustes(true)}
              >
                <Settings />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-4 rounded-3xl bg-white/15 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShoppingBag className="size-4" />
            Frenos, motores, filtros, baterías y más
          </div>
          <p className="mt-1 text-xs text-white/75">
            Venta rápida, visual y pensada para mostrador o factura PDF.
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" />
            <Input
              inputMode="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar repuestos o categorías..."
              className="h-12 rounded-2xl border-0 bg-white pl-9 text-base text-foreground"
            />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 p-4">
        {filtrados.map((p) => {
          const cant = carrito[p.id] ?? 0;
          const Icon = p.icono;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => agregar(p.id)}
              className="product-card relative flex min-h-36 flex-col justify-between rounded-3xl p-3 text-left shadow-card ring-1 ring-border transition active:scale-[0.97] active:ring-brand"
            >
              {cant > 0 && (
                <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {cant}
                </span>
              )}
              <div className="flex flex-col gap-3 pr-6">
                <span className="grid size-12 place-items-center rounded-3xl bg-brand/10 text-brand">
                  <Icon className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand">
                    {p.categoria}
                  </p>
                  <span className="mt-1 block text-base font-semibold leading-snug text-foreground">
                    {p.nombre}
                  </span>
                </div>
              </div>
              <span className="mt-3">
                <span className="block font-display text-lg font-semibold tabular text-foreground">
                  {fmtUsd(p.precioUsd)}
                </span>
                <span className="block text-xs tabular text-muted-foreground">
                  {fmtBs(p.precioUsd * tasa)}
                </span>
              </span>
            </button>
          );
        })}
      </section>

      {items > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md p-4">
          <button
            type="button"
            onClick={() => setAbrirCobro(true)}
            className="whatsapp-gradient flex w-full items-center justify-between rounded-3xl px-5 py-4 text-success-foreground shadow-pop transition active:scale-[0.98]"
          >
            <span className="text-sm font-medium">
              {items} {items === 1 ? "pieza" : "piezas"} · Cobrar
            </span>
            <span className="text-right">
              <span className="block font-display text-lg font-bold tabular">
                {fmtUsd(totalUsd)}
              </span>
              <span className="block text-xs tabular opacity-80">{fmtBs(totalUsd * tasa)}</span>
            </span>
          </button>
        </div>
      )}

      <Sheet open={abrirCobro} onOpenChange={setAbrirCobro}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="font-display">Resumen del pedido</SheetTitle>
          </SheetHeader>

          <div className="max-h-[45vh] space-y-2 overflow-y-auto px-4 py-3">
            {lineas.map((l) => (
              <div key={l.producto.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.producto.nombre}</p>
                  <p className="text-xs tabular text-muted-foreground">
                    {fmtUsd(l.producto.precioUsd * l.cantidad)} ·{" "}
                    {fmtRef(l.producto.precioUsd * l.cantidad * tasa)} ·{" "}
                    {fmtBs(l.producto.precioUsd * l.cantidad * tasa)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    type="button"
                    onClick={() => quitar(l.producto.id)}
                  >
                    -
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold tabular">
                    {l.cantidad}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    type="button"
                    onClick={() => agregar(l.producto.id)}
                  >
                    +
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
                  {fmtUsd(totalUsd)}
                </span>
                <span className="block text-sm tabular text-muted-foreground">
                  {fmtBs(totalUsd * tasa)}
                </span>
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="numeroFactura">Número de factura</Label>
              <Input
                id="numeroFactura"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clienteNombre">Nombre del cliente</Label>
              <Input
                id="clienteNombre"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clienteDocumento">C.I. o RIF del cliente</Label>
              <Input
                id="clienteDocumento"
                value={clienteDocumento}
                onChange={(e) => setClienteDocumento(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clienteDireccion">Dirección del cliente</Label>
              <Input
                id="clienteDireccion"
                value={clienteDireccion}
                onChange={(e) => setClienteDireccion(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clienteTelefono">Teléfono del cliente</Label>
              <Input
                id="clienteTelefono"
                inputMode="tel"
                placeholder="04141234567"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <Button
              className="whatsapp-gradient w-full py-4 text-base font-semibold text-success-foreground hover:opacity-95"
              onClick={generarFacturaPdf}
            >
              Generar factura PDF
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
                Vaciar
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setAbrirCobro(false)}>
                Seguir
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={abrirAjustes} onOpenChange={setAbrirAjustes}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          <SheetHeader className="px-0">
            <SheetTitle className="font-display">Ajustes de tienda</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="clienteEmail">Correo del cliente</Label>
              <Input
                id="clienteEmail"
                type="email"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="metodoPago">Método de pago</Label>
              <Input
                id="metodoPago"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="h-12 text-base"
              />
            </div>

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
              <Label htmlFor="tasa">Tasa de referencia (Bs por 1 $)</Label>
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
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setNegocio("Autorepuestos Easy Cash");
                guardarNegocio("Autorepuestos Easy Cash");
              }}
            >
              Restaurar marca base
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
