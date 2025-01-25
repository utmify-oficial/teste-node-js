import { Types } from 'mongoose';
import { UtmifyOrder } from '../types/UtmifyOrder';

export interface UtmifyOrdersRepository {
  save(order: UtmifyOrder): Promise<UtmifyOrderFromDb | null>;
}

export type UtmifyOrderFromDb = UtmifyOrder & {
  _id: Types.ObjectId;
};
