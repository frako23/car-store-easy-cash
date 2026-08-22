import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cargarTasaGuardada, fmtBs, fmtRef, ICONOS_POR_CATEGORIA, PRODUCTOS_DEMO } from "@/lib/pos";

export const Route = createFileRoute("/productos")({
  head: () => ({
    meta: [
      { title: "Catálogo médico | Uniformes.Médicoss" },
      {
        name: "description",
        content:
          "Lista completa de uniformes médicos, batas, chaquetas y suéteres con precios base en dólares.",
      },
    ],
  }),
  component: Productos,
});

function Productos() {
  const tasa = cargarTasaGuardada() ?? 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background pb-10">
      <header className="hero sticky top-0 z-20 flex items-center gap-3 px-3 py-4 text-brand-foreground shadow-card">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="text-brand-foreground hover:bg-white/10"
        >
          <Link to="/" aria-label="Volver al inicio">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.28em] text-white/70">Marca y catálogo</p>
          <h1 className="font-display text-xl font-semibold">Uniformes médicos</h1>
        </div>
      </header>

      <section className="space-y-4 p-4">
        <div className="rounded-3xl bg-card p-4 shadow-card ring-1 ring-border">
          <p className="text-sm text-muted-foreground">
            Esta línea visual está inspirada en tu logo para que la marca se sienta médica, limpia y
            confiable.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PRODUCTOS_DEMO.map((p) => {
            const Icon =
              ICONOS_POR_CATEGORIA[p.categoria as keyof typeof ICONOS_POR_CATEGORIA] ?? p.icono;
            return (
              <article
                key={p.id}
                className="rounded-3xl bg-card p-4 shadow-card ring-1 ring-border"
              >
                <div className="flex flex-col gap-3">
                  <span className="grid size-12 place-items-center rounded-3xl bg-brand/10 text-brand">
                    <Icon className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand">
                      {p.categoria}
                    </p>
                    <h2 className="mt-1 text-base font-semibold leading-snug">{p.categoria}</h2>
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="font-display text-lg font-semibold">{fmtRef(p.precioUsd)}</p>
                    {tasa > 0 && (
                      <p className="text-xs tabular text-muted-foreground">
                        {fmtBs(p.precioUsd * tasa)}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    Disponible
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
