export const SERVICE_TYPE_DISPLAY_LABELS = {
  PRESENTATION: 'Fotos de la presentación',
  PRESENTATION_AND_PORTRAITS: 'Fotos de la presentación + retratos'
} as const satisfies Record<string, string>;

export const SERVICE_TYPE_CODES = ['PRESENTATION', 'PRESENTATION_AND_PORTRAITS'] as const;
export type ServiceTypeCode = (typeof SERVICE_TYPE_CODES)[number];

export const PACKAGE_DISPLAY_LABELS = {
  INDIVIDUAL: 'Individual',
  FAMILIAR_2: 'Familiar x 2',
  MULTIELEMENTO_2: 'Multielemento x 2',
  FAMILIAR_3: 'Familiar x 3',
  MULTIELEMENTO_3: 'Multielemento x 3'
} as const satisfies Record<string, string>;

export const ORDER_PACKAGE_CODES = ['INDIVIDUAL', 'FAMILIAR_2', 'MULTIELEMENTO_2', 'FAMILIAR_3', 'MULTIELEMENTO_3'] as const;
export type OrderPackage = (typeof ORDER_PACKAGE_CODES)[number];

export const DELIVERY_DISPLAY_LABELS = {
  IMMEDIATE: 'Entrega Inmediata',
  PRIORITY: 'Entrega Prioritaria',
  STANDARD: 'Entrega Estándar'
} as const satisfies Record<string, string>;

export const DELIVERY_CODES = ['IMMEDIATE', 'PRIORITY', 'STANDARD'] as const;
export type DeliveryCode = (typeof DELIVERY_CODES)[number];

export const PIXIESET_SELECTION_VALUES = ['YES', 'NO'] as const;
export type PixiesetSelection = (typeof PIXIESET_SELECTION_VALUES)[number];

export type OrderStatus = 'PENDING';

export interface Order {
  orderId: string;
  eventCode: string;
  athleteFullName: string;
  guardianFullName: string;
  phoneWhatsapp: string;
  email: string;
  serviceTypeCode: ServiceTypeCode;
  packageCode: OrderPackage;
  deliveryCode: DeliveryCode;
  pixiesetSelection: PixiesetSelection;
  academyGroupClub?: string;
  observations?: string;
  price?: number;
  status: OrderStatus;
  createdAtIso: string;
  sourceResponseId: string;
}
