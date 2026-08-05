export type OrderPackage = 'BASIC' | 'PLUS' | 'PREMIUM';

export interface Order {
  orderId: string;
  eventCode: string;
  athleteFullName: string;
  guardianFullName?: string;
  email: string;
  packageCode: OrderPackage;
  createdAtIso: string;
  sourceResponseId: string;
}
