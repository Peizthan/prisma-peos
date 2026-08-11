import type {
  DeliveryCode,
  Order,
  OrderPackage,
  OrderStatus,
  PixiesetSelection,
  ServiceTypeCode
} from '../../domain/entities/order';
import { PeosError } from '../errors/peos-error';
import { DailySequenceOrderIdGenerator } from '../../domain/services/order-id-generator';
import type { OrderCatalogRepository } from '../ports/order-catalog-repository';
import type { OrderRepository } from '../ports/order-repository';

export interface RegisterOrderInput {
  eventCode?: string;
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
  status?: OrderStatus;
  sourceResponseId: string;
}

export class RegisterOrderUseCase {
  private readonly orderIdGenerator = new DailySequenceOrderIdGenerator();

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogRepository: OrderCatalogRepository
  ) {}

  execute(input: RegisterOrderInput): Order {
    const eventCode = input.eventCode ?? this.catalogRepository.resolveActiveEventCode();
    this.validateCatalogRules({ ...input, eventCode });

    const now = new Date();
    const sequence = this.orderRepository.nextSequenceForDay(eventCode, now);
    const orderId = this.orderIdGenerator.generate({
      eventCode,
      date: now,
      sequence
    });

    const order: Order = {
      orderId,
      eventCode,
      athleteFullName: input.athleteFullName,
      guardianFullName: input.guardianFullName,
      phoneWhatsapp: input.phoneWhatsapp,
      email: input.email,
      serviceTypeCode: input.serviceTypeCode,
      packageCode: input.packageCode,
      deliveryCode: input.deliveryCode,
      pixiesetSelection: input.pixiesetSelection,
      ...(input.academyGroupClub?.trim() ? { academyGroupClub: input.academyGroupClub.trim() } : {}),
      ...(input.observations?.trim() ? { observations: input.observations.trim() } : {}),
      ...(typeof input.price === 'number' ? { price: input.price } : {}),
      status: input.status ?? 'PENDING',
      createdAtIso: now.toISOString(),
      sourceResponseId: input.sourceResponseId
    };

    this.orderRepository.save(order);
    return order;
  }

  private validateCatalogRules(input: RegisterOrderInput & { eventCode: string }): void {
    if (!this.catalogRepository.isAllowedServiceType(input.serviceTypeCode)) {
      throw new PeosError(`Service type not allowed by config: ${input.serviceTypeCode}`, {
        code: 'VALIDATION_ERROR',
        operation: 'RegisterOrderUseCase.validateCatalogRules',
        retryable: false,
        context: {
          serviceTypeCode: input.serviceTypeCode
        }
      });
    }

    if (!this.catalogRepository.isAllowedPackage(input.packageCode)) {
      throw new PeosError(`Package not allowed by config: ${input.packageCode}`, {
        code: 'VALIDATION_ERROR',
        operation: 'RegisterOrderUseCase.validateCatalogRules',
        retryable: false,
        context: {
          packageCode: input.packageCode
        }
      });
    }

    if (!this.catalogRepository.isAllowedDeliveryCode(input.deliveryCode)) {
      throw new PeosError(`Delivery not allowed by config: ${input.deliveryCode}`, {
        code: 'VALIDATION_ERROR',
        operation: 'RegisterOrderUseCase.validateCatalogRules',
        retryable: false,
        context: {
          deliveryCode: input.deliveryCode
        }
      });
    }

    const hasEventRestrictions = this.catalogRepository.hasActiveEventRestrictions();
    if (!hasEventRestrictions) {
      return;
    }

    if (!this.catalogRepository.isAllowedEventCode(input.eventCode)) {
      throw new PeosError(`Event not allowed by config: ${input.eventCode}`, {
        code: 'VALIDATION_ERROR',
        operation: 'RegisterOrderUseCase.validateCatalogRules',
        retryable: false,
        context: {
          eventCode: input.eventCode
        }
      });
    }
  }
}
