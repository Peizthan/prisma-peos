# Automation Plan (MVP and Beyond)

## MVP actual

- Trigger `onFormSubmit` procesa cada respuesta.
- Se genera pedido y se guarda en `Orders`.
- Se escribe `Order ID` en hoja de respuestas.
- Se usa `LockService` para proteger la seccion critica de registro.
- Se valida el esquema de cabeceras de `Orders` antes de persistir.
- Se registran eventos tecnicos en `SystemLogs` con formato estructurado.
- Se valida contra catalogos activos en hoja `Config`.
- Los paquetes del formulario se mapearan desde etiquetas de presentacion como `Individual` o `Familiar x 2 personas` hacia codigos internos como `INDIVIDUAL` o `FAMILIAR_2`.
- En errores criticos se envia alerta por email a destinatarios operativos.

## Automatizaciones siguientes recomendadas

1. Alertas operativas
- Enviar correo al equipo cuando falle el trigger.

2. Normalizacion de catalogos
- Hoja `Config` para paquetes y eventos validos.
- Si existen eventos activos en `Config`, solo se aceptan esos codigos.
- Si no existen eventos activos, la validacion de evento queda abierta para operacion inicial.
- Los paquetes siempre se validan contra `Config`.

### Esquema de hoja `Config`

Cabeceras requeridas:

1. `type`
2. `code`
3. `isActive`
4. `description`

Tipos permitidos:

- `PACKAGE`
- `EVENT`
- `ALERT_EMAIL`

## Destinatarios de alertas

Orden de resolucion:

1. Script Property `PEOS_ALERT_EMAILS` con correos separados por coma o punto y coma.
2. Filas activas en `Config` con `type=ALERT_EMAIL` y `code=<correo>`.

Codigos criticos que disparan alerta:

- `LOCK_TIMEOUT`
- `SHEET_SCHEMA_INVALID`
- `UNEXPECTED_ERROR`

3. Reintentos controlados
- Definir politica de retry para errores `retryable`.
- Limitar maximo de intentos para evitar duplicidad de efectos.

## Principio de diseno

Toda automatizacion debe invocar casos de uso de aplicacion, evitando logica de negocio dentro de funciones de trigger.
