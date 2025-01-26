import { UtmifyOrderModel } from '../../models/UtmifyOrderModel';
import { UtmifyOrder } from '../../types/utimify/UtmifyOrder';
import { UtmifyTransactionStatus } from '../../types/utimify/UtmifyTransactionStatus';
import { UtmifyOrderFromDb, UtmifyOrdersRepository } from '../UtmifyOrdersRepository';

export class UtmifyOrdersRepositoryMongoose implements UtmifyOrdersRepository {

  async save(order: UtmifyOrder): Promise<UtmifyOrderFromDb | null> {

    const existingOrder = await UtmifyOrderModel.findOne({
      saleId: order.saleId,
      platform: order.platform,
      externalWebhookId: order.externalWebhookId,
    });

    if (existingOrder) {
      if (!this.canUpdateTransactionStatus(existingOrder.transactionStatus as UtmifyTransactionStatus,
        order.transactionStatus)) {
        throw new Error(
          `Attempt to update order status from ${existingOrder.transactionStatus} to ${order.transactionStatus}, which is not allowed.`,
        );
      }

      const updatedOrder = await UtmifyOrderModel.findOneAndUpdate(
        {
          saleId: order.saleId,
          platform: order.platform,
          externalWebhookId: order.externalWebhookId,
        },
        order,
        { new: true },
      );

      return updatedOrder?.toEntity() ?? null;
    }

    const model = new UtmifyOrderModel(order);
    const savedOrder = await model.save();
    return savedOrder?.toEntity() ?? null;
  }

  private canUpdateTransactionStatus(
    currentStatus: UtmifyTransactionStatus, newStatus: UtmifyTransactionStatus,
  ): boolean {
    const statusPriority: Record<UtmifyTransactionStatus, number> = {
      Pending: 1,
      Paid: 2,
      Refunded: 3,
    };

    return statusPriority[newStatus] >= statusPriority[currentStatus];
  }
}
