/* eslint-disable no-console */
import { NextFunction, Request, Response } from 'express';

export class ErrorMiddleware {
  static handle(err: any, _req: Request, res: Response, _next: NextFunction): void {
    console.error(err);

    const statusCode = err.statusCode ?? 500;
    const description = err.description ?? 'Internal server error';
    const data = err.data ?? {};

    res.status(statusCode).json({
      statusCode,
      description,
      data,
    });
  }
}
