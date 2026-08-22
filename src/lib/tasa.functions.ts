import { createServerFn } from "@tanstack/react-start";

export type TasaInfo = {
  usd: number;
  eur: number;
  fecha: string;
};

export const getTasa = createServerFn({ method: "GET" }).handler(async (): Promise<TasaInfo> => {
  const res = await fetch("https://ve.dolarapi.com/v1/cotizaciones");
  if (!res.ok) throw new Error("No se pudo obtener la tasa");
  const tasa = (await res.json()) as Array<{
    moneda: string;
    promedio: number;
    fechaActualizacion: string;
  }>;
  return {
    usd: Number(tasa[0]?.promedio ?? 0),
    eur: Number(tasa[1]?.promedio ?? 0),
    fecha: tasa[0]?.fechaActualizacion ?? new Date().toISOString(),
  };
});
