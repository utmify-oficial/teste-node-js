import { MongoDB } from '../database/MongoDB';
import { App } from './App';
import { Env } from './Env';

const start = async () => {
  Env.init();
  await MongoDB.connect();
  App.create();
};

start();
