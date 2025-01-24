import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Env } from './Env';

export class App {
  static create(): Application {
    const app = express();
    App.use(app);
    App.listen(app);
    return app;
  }

  static use(app: Application): void {
    app.use(express.json());
    app.use(cors());
    app.use(morgan('dev'));
    // add error handler middleware
  }

  static listen(app: Application): void {
    app.listen(Env.vars.PORT, () => {
      console.log(`Application running on: http://localhost:${Env.vars.PORT}`);
    });
  }
}
