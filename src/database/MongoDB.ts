/* eslint-disable no-console */
import mongoose from "mongoose";
import { Env } from "../server/Env";

export class MongoDB {
  static async connect(): Promise<void> {
    await mongoose.connect(Env.vars.MONGODB_URL);
    console.log("MongoDB connected");
  }

  static async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}
