import type { DeliveryCode, OrderPackage, ServiceTypeCode } from '../../domain/entities/order';

export interface OrderCatalogRepository {
  hasActiveEventRestrictions(): boolean;
  isAllowedEventCode(eventCode: string): boolean;
  resolveActiveEventCode(): string;
  isAllowedPackage(packageCode: OrderPackage): boolean;
  isAllowedServiceType(serviceTypeCode: ServiceTypeCode): boolean;
  isAllowedDeliveryCode(deliveryCode: DeliveryCode): boolean;
}
