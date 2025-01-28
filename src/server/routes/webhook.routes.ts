import Router from 'express';
import { WorldMarketController } from '../../modules/orders/controllers/WorldMarketController';
import { SaveUtmifyOrderUseCase } from '../../modules/orders/usecases/SaveUtmifyOrderUseCase';
import { AllOffersController } from '../../modules/orders/controllers/AllOffersController';
import {
  UtmifyOrdersRepositoryMongoose,
} from '../../modules/orders/repositories/implementations/UtmifyOrdersRepositoryMongoose';
import { ConvertOrderCurrencyAction } from '../../modules/orders/actions/ConvertOrderCurrencyAction';
import { AllOffersTransformationService } from '../../modules/orders/services/AllOffersTransformationService';

const webhookRouter = Router();
const allOffersTransformationService = new AllOffersTransformationService();
const currencyConverter = new ConvertOrderCurrencyAction();

const utmifyOrdersRepository = new UtmifyOrdersRepositoryMongoose();
const saveUtmifyOrderusecase = new SaveUtmifyOrderUseCase(utmifyOrdersRepository);
const worldMarketController = new WorldMarketController(saveUtmifyOrderusecase);
const allOffersController = new AllOffersController(
  saveUtmifyOrderusecase,
  allOffersTransformationService,
  currencyConverter,
);

webhookRouter.post('/world-market', async (req, res) => {
  await worldMarketController.handle(req, res);
});

webhookRouter.post('/all-offers', async (req, res) => {
  await allOffersController.handle(req, res);
});

export { webhookRouter };
