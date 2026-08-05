# Database Model (Google Sheets MVP)

## Enfoque

Aunque Google Sheets se usa como almacenamiento inicial, se define un modelo de datos canonico para facilitar migracion a base relacional.

## Entidad Order

Campos:

- `orderId` (string, PK funcional)
- `eventCode` (string)
- `athleteFullName` (string)
- `guardianFullName` (string, opcional)
- `email` (string)
- `packageCode` (enum: BASIC | PLUS | PREMIUM)
- `createdAtIso` (string ISO-8601)
- `sourceResponseId` (string)

## Hoja Orders

Orden de columnas:

1. orderId
2. eventCode
3. athleteFullName
4. guardianFullName
5. email
6. packageCode
7. createdAtIso
8. sourceResponseId

## Hoja Config

Orden de columnas:

1. type
2. code
3. isActive
4. description

Reglas:

1. `type` acepta `PACKAGE`, `EVENT` o `ALERT_EMAIL`.
2. `code` se evalua en mayusculas para matching.
3. `isActive` controla si la entrada participa en validacion.
4. Los paquetes activos controlan valores permitidos en `packageCode`.
5. Los eventos activos, si existen, controlan valores permitidos en `eventCode`.
6. Los registros `ALERT_EMAIL` activos se usan para notificaciones de errores criticos.

## Reglas de integridad (MVP)

1. `orderId` debe ser unico.
2. `eventCode`, `athleteFullName`, `email`, `packageCode` son obligatorios.
3. `email` se normaliza a minusculas.
4. `eventCode` se normaliza a mayusculas.

## Migracion futura sugerida

Tabla `orders` en PostgreSQL con:

- `id` UUID (PK tecnica)
- `order_id` (UNIQUE, equivalente funcional a `orderId`)
- indices por `event_code`, `created_at`, `email`
