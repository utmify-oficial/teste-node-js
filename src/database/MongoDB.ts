import mongoose from 'mongoose';
import { Env } from '../server/Env';

export class MongoDB {
  static async connect(): Promise<void> {
    await mongoose.connect(Env.vars.MONGODB_URL);
    console.log('MongoDB connected');
  }
}
