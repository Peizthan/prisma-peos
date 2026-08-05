# PEOS MVP Specification

## Contexto

Prisma necesita capturar pedidos de paquetes fotograficos durante eventos deportivos de forma confiable y trazable.

## Problema

El proceso manual genera errores de registro, falta de identificadores unicos y dificultad para organizar pedidos por evento.

## Objetivo del MVP

Construir una base operativa que permita:

- Registrar pedidos desde Google Forms.
- Persistir pedidos en Google Sheets.
- Generar un identificador unico por pedido.
- Mantener una estructura de datos ordenada y preparada para automatizacion.

## Actores

- Atleta o responsable: completa formulario.
- Operador Prisma: administra hoja de respuestas y datos de pedidos.
- Sistema PEOS: valida, normaliza y registra el pedido.

## Requisitos funcionales

1. Al enviar un formulario, se debe generar un pedido con un ID unico.
2. El pedido debe almacenarse en una hoja `Orders` con columnas estables.
3. El ID del pedido debe quedar visible en la hoja de respuestas del formulario.
4. El sistema debe clasificar paquete en un catalogo inicial (`BASIC`, `PLUS`, `PREMIUM`).

## Requisitos no funcionales

1. Logica de negocio desacoplada de Google Workspace.
2. Codigo en TypeScript con reglas estrictas.
3. Estructura modular para permitir reemplazo de infraestructura.
4. Trazabilidad de decisiones en documentacion.

## Fuera de alcance del MVP

- Pagos online.
- Integracion con Pixieset.
- Dashboard web.
- CRM.
- App movil.

## Criterios de aceptacion iniciales

1. Trigger `onFormSubmit` registra pedidos sin intervencion manual.
2. IDs tienen formato estable y secuencial diario por evento.
3. Errores de campos obligatorios son explicitos.
4. La capa de aplicacion no depende de APIs de Google.
