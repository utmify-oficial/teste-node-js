import { Router } from 'express';
import { webhookRouter } from './webhook.routes';

const router = Router();

router.use('/webhooks', webhookRouter);

export { router };
