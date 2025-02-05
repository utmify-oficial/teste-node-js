import Router from "express";
import { WorldMarketController } from "../../modules/orders/controllers/WorldMarketController";
import { SaveUtmifyOrderUseCase } from "../../modules/orders/usecases/SaveUtmifyOrderUseCase";
import { UtmifyOrdersRepositoryMongoose } from "../../modules/orders/repositories/implementations/UtmifyOrdersRepositoryMongoose";
import { AllOffersController } from "../../modules/orders/controllers/AllOffersController";
import { StatusMachineAction } from "../../modules/orders/actions/StatusMachineAction";
import { ConvertOrderCurrencyAction } from "../../modules/orders/actions/ConvertOrderCurrencyAction";
import { AwesomeApi } from "../../modules/orders/externalApis/AwesomeApi";

const webhookRouter = Router();
const statusMachineAction = new StatusMachineAction();
const utmifyOrdersRepository = new UtmifyOrdersRepositoryMongoose();
const awesomeApi = new AwesomeApi();
const saveUtmifyOrderusecase = new SaveUtmifyOrderUseCase(
  utmifyOrdersRepository,
  statusMachineAction
);
const convertOrderCurrencyAction = new ConvertOrderCurrencyAction(awesomeApi);
const worldMarketController = new WorldMarketController(saveUtmifyOrderusecase);
const allOffersController = new AllOffersController(
  saveUtmifyOrderusecase,
  convertOrderCurrencyAction
);

webhookRouter.post("/world-market", async (req, res) => {
  await worldMarketController.handle(req, res);
});

webhookRouter.post("/all-offers", async (req, res) => {
  await allOffersController.handle(req, res);
});

export { webhookRouter };
