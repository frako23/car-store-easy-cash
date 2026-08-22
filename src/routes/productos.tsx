import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cargarProductos,
  cargarTasaGuardada,
  fmtBs,
  fmtUsd,
  guardarProductos,
  type Producto,
} from "@/lib/pos";

export const Route = createFileRoute("/productos")({
  head: () => ({
    meta: [
      { title: "Catálogo de productos y precios | CajaVE" },
      {
        name: "description",
        content:
          "Agrega, edita y elimina los productos de tu punto de venta con precios en dólares y su conversión automática a bolívares.",
      },
      { property: "og:title", content: "Catálogo de productos | CajaVE" },
      {
        property: "og:description",
        content: "Gestiona tu lista de productos y precios para facturar más rápido.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Productos,
});

function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tasa, setTasa] = useState(0);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");

  useEffect(() => {
    setProductos(cargarProductos());
    setTasa(cargarTasaGuardada() ?? 0);
  }, []);

  const persistir = (lista: Producto[]) => {
    setProductos(lista);
    guardarProductos(lista);
  };

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(precio.replace(",", "."));
    if (!nombre.trim() || !Number.isFinite(p) || p <= 0) return;
    persistir([
      { id: crypto.randomUUID(), nombre: nombre.trim(), precioUsd: p },
      ...productos,
    ]);
    setNombre("");
    setPrecio("");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background pb-10">
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-brand px-3 py-4 text-brand-foreground shadow-card">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="text-brand-foreground hover:bg-brand-foreground/10"
        >
          <Link to="/" aria-label="Volver a la caja">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="font-display text-xl font-semibold">Productos</h1>
      </header>

      <form onSubmit={agregar} className="space-y-3 border-b bg-card p-4 shadow-card">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Producto</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Café molido 250g"
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="precio">Precio en dólares ($)</Label>
          <Input
            id="precio"
            inputMode="decimal"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="3.50"
            className="h-12 text-base tabular"
          />
        </div>
        <Button type="submit" className="w-full py-4 text-base font-semibold">
          Agregar producto
        </Button>
      </form>

      <ul className="divide-y">
        {productos.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.nombre}</p>
              <p className="text-xs tabular text-muted-foreground">
                {fmtUsd(p.precioUsd)}
                {tasa > 0 ? ` · ${fmtBs(p.precioUsd * tasa)}` : ""}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Eliminar ${p.nombre}`}
              onClick={() => persistir(productos.filter((x) => x.id !== p.id))}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </li>
        ))}
      </ul>
    </main>
  );
}
