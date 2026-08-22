# Quick Sell Pro

desarrolla una aplicacion web de punto de venta, para que rapidamente el vendedor pueda facturar los productos al comprador, y enviarle por whatsapp lo que esta comprando con el monto, debe estar enfocada en mobile first, ya que rapidamente debe facturar, los precios de los productos deben estar expresador en Bs y $ y debe manejar una tasa de referencia que va a obtener de la api https://ve.dolarapi.com/v1/cotizaciones

y obtiene el siguiente resultado de hacer un get

[  {    "moneda": "USD",    "fuente": "oficial",    "nombre": "Dólar",    "compra": null,    "venta": null,    "promedio": 779.9522,    "fechaActualizacion": "2026-08-21T00:00:00-04:00"  },  {    "moneda": "EUR",    "fuente": "oficial",    "nombre": "Euro",    "compra": null,    "venta": null,    "promedio": 911.21815526,    "fechaActualizacion": "2026-08-21T00:00:00-04:00"  }]

el dato del precio que va a obtener es si guardamos el resultaen el variable tasa, seria tasa[0].promedio

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://easy-cash-go.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6ba7c5a7-94b3-4320-aca8-2d2f223857d1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
