import type { Order } from '../../domain/entities/order';

export interface OrderRepository {
  nextSequenceForDay(eventCode: string, date: Date): number;
  save(order: Order): void;
}
