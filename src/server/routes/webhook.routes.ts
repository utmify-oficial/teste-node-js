import Router from 'express';
import { WorldMarketController } from '../../modules/orders/controllers/WorldMarketController';
import { AllOffersController } from '../../modules/orders/controllers/AllOffersController';
import { SaveUtmifyOrderUseCase } from '../../modules/orders/usecases/SaveUtmifyOrderUseCase';
import {
  UtmifyOrdersRepositoryMongoose,
} from'../../modules/orders/repositories/implementations/UtmifyOrdersRepositoryMongoose';

const webhookRouter = Router();

const utmifyOrdersRepository = new UtmifyOrdersRepositoryMongoose();
const saveUtmifyOrderusecase = new SaveUtmifyOrderUseCase(utmifyOrdersRepository);
const worldMarketController = new WorldMarketController(saveUtmifyOrderusecase);
const allOffersController = new AllOffersController(saveUtmifyOrderusecase);

webhookRouter.post('/world-market', async (req, res) => {
  await worldMarketController.handle(req, res);
});

webhookRouter.post('/all-offers', async (req, res) => {
  await allOffersController.handle(req, res);
});

export { webhookRouter };
