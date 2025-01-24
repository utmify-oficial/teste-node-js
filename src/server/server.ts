import { MongoDB } from '../database/MongoDB';
import { App } from './App';
import { Env } from './Env';
import { router } from './routes/router';

const start = async () => {
  Env.init();

  await MongoDB.connect();

  const app = App.create();

  app.use(router);
};

start();
