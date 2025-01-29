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

  async findBySaleId(saleId: string): Promise<UtmifyOrderFromDb | null> {
    const order = await UtmifyOrderModel.findOne({ saleId });

    if (!order) {
      return null;
    }

    return order.toEntity();
  }
}
