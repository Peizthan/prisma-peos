# Automation Plan (MVP and Beyond)

## MVP actual

- Trigger `onFormSubmit` procesa cada respuesta.
- Se genera pedido y se guarda en `Orders`.
- Se escribe `Order ID` en hoja de respuestas.
- Se usa `LockService` para proteger la seccion critica de registro.
- Se valida el esquema de cabeceras de `Orders` antes de persistir.
- Se registran eventos tecnicos en `SystemLogs` con formato estructurado.

## Automatizaciones siguientes recomendadas

1. Alertas operativas
- Enviar correo al equipo cuando falle el trigger.

2. Normalizacion de catalogos
- Hoja `Config` para paquetes y eventos validos.

3. Reintentos controlados
- Definir politica de retry para errores `retryable`.
- Limitar maximo de intentos para evitar duplicidad de efectos.

## Principio de diseno

Toda automatizacion debe invocar casos de uso de aplicacion, evitando logica de negocio dentro de funciones de trigger.
