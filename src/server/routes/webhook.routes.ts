/* eslint-disable max-len */
import Router from 'express';
import { WorldMarketController } from '../../modules/orders/controllers/WorldMarketController';
import { SaveUtmifyOrderUseCase } from '../../modules/orders/usecases/SaveUtmifyOrderUseCase';
import {
  UtmifyOrdersRepositoryMongoose,
} from'../../modules/orders/repositories/implementations/UtmifyOrdersRepositoryMongoose';
import { AxiosAdapter } from '../../http/AxiosAdapter';
import { ConvertOrderCurrencyAction } from '../../modules/orders/actions/ConvertOrderCurrencyAction';
import { GetOrderTransactionStatusUseCase } from '../../modules/orders/usecases/GetOrderTransactionStatusUseCase';
import { AllOffersController } from '../../modules/orders/controllers/AllOffersController';

const webhookRouter = Router();

const httpClient = new AxiosAdapter();

const converterOrderCurrencyAction = new ConvertOrderCurrencyAction(httpClient);

const utmifyOrdersRepository = new UtmifyOrdersRepositoryMongoose();

const saveUtmifyOrderusecase = new SaveUtmifyOrderUseCase(utmifyOrdersRepository);
const getOrderTransactionStatusUseCase = new GetOrderTransactionStatusUseCase(utmifyOrdersRepository);
const worldMarketController = new WorldMarketController(saveUtmifyOrderusecase);
const allOffersController = new AllOffersController(saveUtmifyOrderusecase, getOrderTransactionStatusUseCase, converterOrderCurrencyAction);

webhookRouter.post('/world-market', async (req, res) => {
  await worldMarketController.handle(req, res);
});

webhookRouter.post('/all-offers', async (req, res) => {
  await allOffersController.handle(req, res);
});

export { webhookRouter };
