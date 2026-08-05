# Prisma Event Order System (PEOS)

PEOS es un sistema para registrar y organizar pedidos de paquetes fotograficos en eventos deportivos.

El MVP usa Google Forms, Google Sheets y Google Apps Script, pero su arquitectura esta disenada para migrar en el futuro a una aplicacion web propia (React/Next.js) sin reescribir la logica de negocio.

## Principios del proyecto

- Clean Architecture
- SOLID
- DRY
- KISS
- Modularidad y desacoplamiento

## Alcance MVP

- Registro de pedidos desde Google Forms
- Almacenamiento automatico en Google Sheets
- Generacion de identificadores unicos por pedido
- Organizacion de pedidos en una hoja dedicada

Fuera de alcance en esta fase:

- Pagos online
- Integracion con Pixieset
- Dashboard web
- CRM
- App movil

## Estructura

Ver documentacion en `docs/` para especificacion, arquitectura, modelo de datos y roadmap.

## Requisitos

- Node.js 20+
- npm 10+
- Cuenta de Google con acceso a Apps Script

## Comandos

```bash
npm install
npm run lint
npm run typecheck
npm run build:apps-script
```

## Despliegue Apps Script

1. Copiar `.clasp.example.json` a `.clasp.json` y completar `scriptId`.
2. Compilar: `npm run build:apps-script`
3. Enviar a Apps Script: `npm run clasp:push`

## Decisiones importantes

Toda decision arquitectonica relevante se documenta en `docs/architecture.md`.
