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
- Catalogo de paquetes Prisma con codigos internos y etiquetas de formulario compatibles

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
npm run check
npm run build:apps-script
```

## Frontend Local (localhost)

El frontend vive en la carpeta `web/` y corre con Vite para revisar producto en local.

```bash
# instalar dependencias del frontend
cd web
npm install

# correr frontend en localhost
npm run dev
```

URL local esperada:

- `http://localhost:5173/`

Desde la raiz del repo tambien puedes iniciar frontend con:

```bash
npm run dev:web
```

## Validacion integral de calidad

Para validar Apps Script y frontend en una sola corrida:

```bash
npm run check
```

## Despliegue Apps Script

1. Copiar `.clasp.example.json` a `.clasp.json` y completar `scriptId`.
2. Compilar: `npm run build:apps-script`
3. Enviar a Apps Script: `npm run clasp:push`

## Decisiones importantes

Toda decision arquitectonica relevante se documenta en `docs/architecture.md`.
