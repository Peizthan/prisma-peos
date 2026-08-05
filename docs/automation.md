# Automation Plan (MVP and Beyond)

## MVP actual

- Trigger `onFormSubmit` procesa cada respuesta.
- Se genera pedido y se guarda en `Orders`.
- Se escribe `Order ID` en hoja de respuestas.

## Automatizaciones siguientes recomendadas

1. Bloqueo de concurrencia
- Usar `LockService` para evitar colisiones en secuencias.

2. Registro tecnico de errores
- Hoja `SystemLogs` para auditoria minima.
- Nivel de severidad y contexto de evento.

3. Alertas operativas
- Enviar correo al equipo cuando falle el trigger.

4. Normalizacion de catalogos
- Hoja `Config` para paquetes y eventos validos.

## Principio de diseno

Toda automatizacion debe invocar casos de uso de aplicacion, evitando logica de negocio dentro de funciones de trigger.
