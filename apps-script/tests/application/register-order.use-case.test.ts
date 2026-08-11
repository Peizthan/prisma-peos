import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Order } from '../../src/domain/entities/order';
import type { OrderCatalogRepository } from '../../src/application/ports/order-catalog-repository';
import type { OrderRepository } from '../../src/application/ports/order-repository';
import { PeosError } from '../../src/application/errors/peos-error';
import { RegisterOrderUseCase } from '../../src/application/use-cases/register-order';

class InMemoryOrderRepository implements OrderRepository {
  readonly savedOrders: Order[] = [];

  constructor(private readonly sequence: number) {}

  nextSequenceForDay(): number {
    return this.sequence;
  }

  save(order: Order): void {
    this.savedOrders.push(order);
  }
}

class InMemoryCatalogRepository implements OrderCatalogRepository {
  constructor(
    private readonly allowedPackages: Set<string>,
    private readonly allowedEvents: Set<string>,
    private readonly hasEventRestrictionsFlag: boolean,
    private readonly allowedServiceTypes: Set<string> = new Set(['PRESENTATION', 'PRESENTATION_AND_PORTRAITS']),
    private readonly allowedDeliveries: Set<string> = new Set(['IMMEDIATE', 'PRIORITY', 'STANDARD'])
  ) {}

  hasActiveEventRestrictions(): boolean {
    return this.hasEventRestrictionsFlag;
  }

  isAllowedEventCode(eventCode: string): boolean {
    return this.allowedEvents.has(eventCode);
  }

  resolveActiveEventCode(): string {
    return this.allowedEvents.size > 0 ? Array.from(this.allowedEvents)[0] : 'UNSPECIFIED';
  }

  isAllowedPackage(packageCode: Order['packageCode']): boolean {
    return this.allowedPackages.has(packageCode);
  }

  isAllowedServiceType(serviceTypeCode: string): boolean {
    return this.allowedServiceTypes.has(serviceTypeCode);
  }

  isAllowedDeliveryCode(deliveryCode: string): boolean {
    return this.allowedDeliveries.has(deliveryCode);
  }
}

describe('RegisterOrderUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T15:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers and stores order when package and event pass catalog rules', () => {
    const orderRepository = new InMemoryOrderRepository(3);
    const catalogRepository = new InMemoryCatalogRepository(
      new Set(['INDIVIDUAL', 'FAMILIAR_2', 'MULTIELEMENTO_2', 'FAMILIAR_3', 'MULTIELEMENTO_3']),
      new Set(['MTY-OPEN-2026']),
      true
    );
    const useCase = new RegisterOrderUseCase(orderRepository, catalogRepository);

    const order = useCase.execute({
      eventCode: 'MTY-OPEN-2026',
      athleteFullName: 'Athlete One',
      guardianFullName: 'Guardian One',
      phoneWhatsapp: '+541155556666',
      email: 'athlete@example.com',
      serviceTypeCode: 'PRESENTATION',
      packageCode: 'FAMILIAR_2',
      deliveryCode: 'IMMEDIATE',
      pixiesetSelection: 'YES',
      sourceResponseId: 'FORM-ROW-10'
    });

    expect(order.orderId).toBe('PEOS-MTY-OPEN-2026-20260805-0003');
    expect(orderRepository.savedOrders).toHaveLength(1);
    expect(orderRepository.savedOrders[0]?.sourceResponseId).toBe('FORM-ROW-10');
    expect(orderRepository.savedOrders[0]?.phoneWhatsapp).toBe('+541155556666');
  });

  it('rejects order when package is not allowed', () => {
    const orderRepository = new InMemoryOrderRepository(1);
    const catalogRepository = new InMemoryCatalogRepository(new Set(['INDIVIDUAL']), new Set(), false);
    const useCase = new RegisterOrderUseCase(orderRepository, catalogRepository);

    expect(() =>
      useCase.execute({
        eventCode: 'FREE-EVENT',
        athleteFullName: 'Athlete One',
        guardianFullName: 'Guardian One',
        phoneWhatsapp: '+541155556666',
        email: 'athlete@example.com',
        serviceTypeCode: 'PRESENTATION',
        packageCode: 'MULTIELEMENTO_3',
        deliveryCode: 'IMMEDIATE',
        pixiesetSelection: 'NO',
        sourceResponseId: 'FORM-ROW-11'
      })
    ).toThrowError(PeosError);

    expect(orderRepository.savedOrders).toHaveLength(0);
  });

  it('rejects order when event restrictions are enabled and event is not allowed', () => {
    const orderRepository = new InMemoryOrderRepository(1);
    const catalogRepository = new InMemoryCatalogRepository(
      new Set(['INDIVIDUAL', 'FAMILIAR_2', 'MULTIELEMENTO_2', 'FAMILIAR_3', 'MULTIELEMENTO_3']),
      new Set(['ALLOWED-EVENT']),
      true
    );
    const useCase = new RegisterOrderUseCase(orderRepository, catalogRepository);

    expect(() =>
      useCase.execute({
        eventCode: 'NOT-ALLOWED',
        athleteFullName: 'Athlete One',
        guardianFullName: 'Guardian One',
        phoneWhatsapp: '+541155556666',
        email: 'athlete@example.com',
        serviceTypeCode: 'PRESENTATION',
        packageCode: 'INDIVIDUAL',
        deliveryCode: 'STANDARD',
        pixiesetSelection: 'NO',
        sourceResponseId: 'FORM-ROW-12'
      })
    ).toThrowError(PeosError);

    expect(orderRepository.savedOrders).toHaveLength(0);
  });

  it('accepts any event when there are no active event restrictions', () => {
    const orderRepository = new InMemoryOrderRepository(5);
    const catalogRepository = new InMemoryCatalogRepository(
      new Set(['INDIVIDUAL', 'FAMILIAR_2', 'MULTIELEMENTO_2', 'FAMILIAR_3', 'MULTIELEMENTO_3']),
      new Set(),
      false
    );
    const useCase = new RegisterOrderUseCase(orderRepository, catalogRepository);

    const order = useCase.execute({
      eventCode: 'NEW-EVENT-2026',
      athleteFullName: 'Athlete Two',
      guardianFullName: 'Guardian Two',
      phoneWhatsapp: '+541155556777',
      email: 'athlete2@example.com',
      serviceTypeCode: 'PRESENTATION_AND_PORTRAITS',
      packageCode: 'INDIVIDUAL',
      deliveryCode: 'STANDARD',
      pixiesetSelection: 'YES',
      sourceResponseId: 'FORM-ROW-13'
    });

    expect(order.orderId).toBe('PEOS-NEW-EVENT-2026-20260805-0005');
    expect(orderRepository.savedOrders).toHaveLength(1);
    expect(order.status).toBe('PENDING');
  });
});
