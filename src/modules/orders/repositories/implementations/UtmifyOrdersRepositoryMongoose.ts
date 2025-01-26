import { TransactionError } from '../../../../core/errors/TransactionError';
import { UtmifyOrderModel } from '../../models/UtmifyOrderModel';
import { UtmifyOrder } from '../../types/UtmifyOrder';
import { UtmifyTransactionStatus } from '../../types/UtmifyTransactionStatus';
import { UtmifyOrderFromDb, UtmifyOrdersRepository } from '../UtmifyOrdersRepository';

export class UtmifyOrdersRepositoryMongoose implements UtmifyOrdersRepository {
  async save(order: UtmifyOrder): Promise<UtmifyOrderFromDb | null> {
    const model = new UtmifyOrderModel(order);

    const currentSavedOrder = await UtmifyOrderModel.findOne({ saleId: order.saleId, platform: order.platform, externalWebhookId: order.externalWebhookId });

    if (currentSavedOrder) {
      if (
        currentSavedOrder.transactionStatus == UtmifyTransactionStatus.Paid && order.transactionStatus == UtmifyTransactionStatus.Pending
        || currentSavedOrder.transactionStatus == UtmifyTransactionStatus.Refunded && (order.transactionStatus == UtmifyTransactionStatus.Paid || order.transactionStatus == UtmifyTransactionStatus.Pending)
      ) {
        throw new TransactionError("Invalid order transaction status update");
      }
    }

    const savedOrder = await model.save().catch(async (e) => {
      if (!e.message.includes('duplicate key error')) throw e;

      const updatedOrder = await UtmifyOrderModel.findOneAndUpdate({
        saleId: order.saleId,
        platform: order.platform,
        externalWebhookId: order.externalWebhookId,
      }, order, { new: true });

      return updatedOrder;
    });

    return savedOrder?.toEntity() ?? null;
  }
}
