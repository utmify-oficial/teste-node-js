import { RootFilterQuery } from 'mongoose';
import { UtmifyOrderModel } from '../../models/UtmifyOrderModel';
import { UtmifyOrder } from '../../types/UtmifyOrder';
import { UtmifyTransactionStatus } from '../../types/UtmifyTransactionStatus';
import { UtmifyOrderFromDb, UtmifyOrdersRepository } from '../UtmifyOrdersRepository';

export class UtmifyOrdersRepositoryMongoose implements UtmifyOrdersRepository {
  async save(order: UtmifyOrder): Promise<UtmifyOrderFromDb | null> {
    const model = new UtmifyOrderModel(order);

    const savedOrder = await model.save().catch(async (e) => {
      if (!e.message.includes('duplicate key error')) throw e;

      const filter: RootFilterQuery<UtmifyOrder> = {
        saleId: order.saleId,
        platform: order.platform,
        externalWebhookId: order.externalWebhookId,
      };

      if (order.transactionStatus === UtmifyTransactionStatus.Pending) {
        filter.$nor = [
          { transactionStatus: UtmifyTransactionStatus.Paid },
          { transactionStatus: UtmifyTransactionStatus.Refunded }
        ];
      }

      if (order.transactionStatus === UtmifyTransactionStatus.Paid) {
        filter.$nor = [{ transactionStatus: UtmifyTransactionStatus.Refunded }];
      }

      const updatedOrder = await UtmifyOrderModel.findOneAndUpdate(filter, order, { new: true });
      return updatedOrder;
    });

    return savedOrder?.toEntity() ?? null;
  }
}
