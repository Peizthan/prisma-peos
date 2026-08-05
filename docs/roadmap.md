# PEOS Roadmap

## Fase 0 - Fundacion tecnica (actual)

- Estructura base del repositorio.
- Tooling TypeScript, ESLint, Prettier.
- Capas de arquitectura y primer flujo de registro.
- Documentacion inicial.

## Fase 1 - Endurecimiento del MVP

- Validaciones de datos mas estrictas.
- Lock para concurrencia en triggers.
- Registro de errores operativos y alertas.
- Pruebas unitarias de dominio y aplicacion.

### Siguiente hito inmediato (proxima iteracion)

1. Alertas operativas por email sobre errores criticos (`SystemLogs` + trigger de alerta).
2. Catalogos de configuracion (`Config`) para eventos y paquetes permitidos.
3. Pruebas unitarias para `RegisterOrderUseCase` y `DailySequenceOrderIdGenerator`.
4. Contrato de API interno para futura migracion web (DTOs y puertos compartidos).

## Fase 2 - Automatizaciones

- Notificaciones por email internas.
- Tareas programadas para consolidacion diaria.
- Exportaciones para flujo de edicion fotografica.

## Fase 3 - Preparacion de migracion web

- Extraer core de negocio a paquete compartido.
- Exponer casos de uso via API backend.
- Diseñar modelo de autenticacion y permisos.

## Fase 4 - Plataforma web (React/Next.js)

- Portal de operaciones.
- Dashboard de pedidos y estados.
- Integracion futura de pagos y CRM.
