import type { Order, OrderPackage } from '../../domain/entities/order';
import { DailySequenceOrderIdGenerator } from '../../domain/services/order-id-generator';
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

  constructor(private readonly orderRepository: OrderRepository) {}

  execute(input: RegisterOrderInput): Order {
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
}
