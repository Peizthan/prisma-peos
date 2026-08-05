import type { OrderPackage } from '../../domain/entities/order';

export interface OrderCatalogRepository {
  hasActiveEventRestrictions(): boolean;
  isAllowedEventCode(eventCode: string): boolean;
  isAllowedPackage(packageCode: OrderPackage): boolean;
}
