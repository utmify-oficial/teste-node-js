/* eslint-disable no-console */
import cors from 'cors';
import express, { Application } from 'express';
import 'express-async-errors';
import morgan from 'morgan';
import http from 'http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { Env } from './Env';
import { router } from './routes/router';
import { ErrorMiddleware } from './middlewares/ErrorMiddleware';
import { swaggerOptions } from '../docs/swagger';

export class App {
  static server: http.Server;

  static create(): Application {
    const app = express();

    App.use(app);
    App.listen(app);

    return app;
  }

  static use(app: Application): void {
    app.use(express.json());
    app.use(cors({ origin: '*' }));
    app.use(morgan('dev'));
    app.use(router);
    const swaggerDocs = swaggerJsdoc(swaggerOptions);
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
    app.use(ErrorMiddleware.handle);
  }

  static listen(app: Application): any {
    App.server = app.listen(Env.vars.PORT, () => {
      console.log(`Application running on: http://localhost:${Env.vars.PORT}`);
    });
  }

  static close(): void {
    if (App.server) App.server.close();
  }
}
