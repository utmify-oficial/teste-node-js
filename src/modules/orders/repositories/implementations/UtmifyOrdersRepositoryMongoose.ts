import { UtmifyOrderModel } from "../../models/UtmifyOrderModel";
import { UtmifyOrder } from "../../types/UtmifyOrder";
import {
  UtmifyOrderFromDb,
  UtmifyOrdersRepository,
} from "../UtmifyOrdersRepository";

export class UtmifyOrdersRepositoryMongoose implements UtmifyOrdersRepository {
  async save(order: UtmifyOrder): Promise<UtmifyOrderFromDb | null> {
    const model = new UtmifyOrderModel(order);
    const savedOrder = await model.save().catch(async (e) => {
      if (!e.message.includes("duplicate key error")) throw e;

      // Fetch the existing order
      const existingOrder = await UtmifyOrderModel.findOne({
        saleId: order.saleId,
        platform: order.platform,
        externalWebhookId: order.externalWebhookId,
      });

      if (existingOrder) {
        const currentStatus = existingOrder.transactionStatus;
        const newStatus = order.transactionStatus;
        if (
          (currentStatus === "Paid" && newStatus === "Pending") ||
          (currentStatus === "Refunded" &&
            (newStatus === "Paid" || newStatus === "Pending"))
        ) {
          throw new Error("Invalid status transition");
        }
      }

      const updatedOrder = await UtmifyOrderModel.findOneAndUpdate(
        {
          saleId: order.saleId,
          platform: order.platform,
          externalWebhookId: order.externalWebhookId,
        },
        order,
        { new: true }
      );
      return updatedOrder;
    });
    return savedOrder?.toEntity() ?? null;
  }
}
