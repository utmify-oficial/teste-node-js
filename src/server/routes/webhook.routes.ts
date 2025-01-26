import Router from "express";
import { WorldMarketController } from "../../modules/orders/controllers/WorldMarketController";
import { SaveUtmifyOrderUseCase } from "../../modules/orders/usecases/SaveUtmifyOrderUseCase";
import { UtmifyOrdersRepositoryMongoose } from "../../modules/orders/repositories/implementations/UtmifyOrdersRepositoryMongoose";
import { AllOffersController } from "../../modules/orders/controllers/AllOffersController";
import { ConvertOrderCurrencyAction } from "../../modules/orders/actions/ConvertOrderCurrencyAction";

const webhookRouter = Router();

const convertOrderCurrencyAction = new ConvertOrderCurrencyAction();
const utmifyOrdersRepository = new UtmifyOrdersRepositoryMongoose();
const saveUtmifyOrderusecase = new SaveUtmifyOrderUseCase(
  utmifyOrdersRepository
);
const worldMarketController = new WorldMarketController(saveUtmifyOrderusecase);
const allOffersController = new AllOffersController(
  saveUtmifyOrderusecase,
  convertOrderCurrencyAction
);
webhookRouter.post("/world-market", async (req, res) => {
  await worldMarketController.handle(req, res);
});
webhookRouter.post("/allOffers", async (req, res) => {
  await allOffersController.handle(req, res);
});

export { webhookRouter };
