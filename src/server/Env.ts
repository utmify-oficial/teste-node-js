import dotenv from 'dotenv';

export type EnvVars = {
  PORT: number;
  MONGODB_URL: string;
  EXCHANGE_API_KEY: string;
};

export class Env {
  static vars: EnvVars;

  static init(): void {
    dotenv.config();

    Env.vars = {
      PORT: Number(process.env.PORT),
      MONGODB_URL: String(process.env.MONGODB_URL),
      EXCHANGE_API_KEY: String(process.env.EXCHANGE_API_KEY),
    };
  }
}
