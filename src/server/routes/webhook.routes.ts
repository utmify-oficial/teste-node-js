import Router from 'express';
import { WorldMarketController } from '../../modules/orders/controllers/WorldMarketController';
import { SaveUtmifyOrderUseCase } from '../../modules/orders/usecases/SaveUtmifyOrderUseCase';
import {
  UtmifyOrdersRepositoryMongoose,
} from'../../modules/orders/repositories/implementations/UtmifyOrdersRepositoryMongoose';

const webhookRouter = Router();

const utmifyOrdersRepository = new UtmifyOrdersRepositoryMongoose();
const saveUtmifyOrderusecase = new SaveUtmifyOrderUseCase(utmifyOrdersRepository);
const worldMarketController = new WorldMarketController(saveUtmifyOrderusecase);

webhookRouter.post('/world-market', async (req, res) => {
  await worldMarketController.handle(req, res);
});

export { webhookRouter };
