import type { Order, OrderPackage } from '../../domain/entities/order';
import { PeosError } from '../errors/peos-error';
import { DailySequenceOrderIdGenerator } from '../../domain/services/order-id-generator';
import type { OrderCatalogRepository } from '../ports/order-catalog-repository';
import type { OrderRepository } from '../ports/order-repository';

export interface RegisterOrderInput {
  eventCode: string;
  athleteFullName: string;
  guardianFullName?: string;
  email: string;
  packageCode: OrderPackage;
  sourceResponseId: string;
}

export class RegisterOrderUseCase {
  private readonly orderIdGenerator = new DailySequenceOrderIdGenerator();

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly catalogRepository: OrderCatalogRepository
  ) {}

  execute(input: RegisterOrderInput): Order {
    this.validateCatalogRules(input);

    const now = new Date();
    const sequence = this.orderRepository.nextSequenceForDay(input.eventCode, now);
    const orderId = this.orderIdGenerator.generate({
      eventCode: input.eventCode,
      date: now,
      sequence
    });

    const order: Order = {
      orderId,
      eventCode: input.eventCode,
      athleteFullName: input.athleteFullName,
      email: input.email,
      packageCode: input.packageCode,
      createdAtIso: now.toISOString(),
      sourceResponseId: input.sourceResponseId,
      ...(input.guardianFullName ? { guardianFullName: input.guardianFullName } : {})
    };

    this.orderRepository.save(order);
    return order;
  }

  private validateCatalogRules(input: RegisterOrderInput): void {
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
