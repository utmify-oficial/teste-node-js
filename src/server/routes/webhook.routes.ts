import Router from "express";
import { WorldMarketController } from "../../modules/orders/controllers/WorldMarketController";
import { SaveUtmifyOrderUseCase } from "../../modules/orders/usecases/SaveUtmifyOrderUseCase";
import { UtmifyOrdersRepositoryMongoose } from "../../modules/orders/repositories/implementations/UtmifyOrdersRepositoryMongoose";

import { AllOffersController } from "../../modules/orders/controllers/AllOffersController";
import { ConvertOrderCurrencyAction } from "../../modules/orders/actions/ConvertOrderCurrencyAction";

const webhookRouter = Router();

const utmifyOrdersRepository = new UtmifyOrdersRepositoryMongoose();
const saveUtmifyOrderusecase = new SaveUtmifyOrderUseCase(
  utmifyOrdersRepository
);

//word-market
const worldMarketController = new WorldMarketController(saveUtmifyOrderusecase);

//all-offers
const convertOrderCurrencyToBRL = new ConvertOrderCurrencyAction();
const orderRepository = new UtmifyOrdersRepositoryMongoose();
const allOffersController = new AllOffersController(
  saveUtmifyOrderusecase,
  convertOrderCurrencyToBRL,
  orderRepository
);

webhookRouter.post("/world-market", async (req, res) => {
  await worldMarketController.handle(req, res);
});

webhookRouter.post("/all-offers", async (req, res) => {
  await allOffersController.handle(req, res);
});

export { webhookRouter };
