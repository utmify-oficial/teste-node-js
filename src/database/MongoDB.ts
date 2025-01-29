/* eslint-disable no-console */
import mongoose from "mongoose";
import { config } from "dotenv";

config();

export class MongoDB {
  static async connect(): Promise<void> {
    await mongoose.connect(process.env.MONGODB_URL as string);
    console.log("MongoDB connected");
  }

  static async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}
