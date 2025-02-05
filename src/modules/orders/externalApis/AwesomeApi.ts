import axios from "axios";
import * as https from "https";
import { RequestError } from "../../../core/errors/RequestError";

export class AwesomeApi {
  async getCurrencyConversion(currency: string): Promise<any> {
    const httpService = axios.create({
      baseURL: process.env.AWESOME_API_URL,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    const currencyStringURL = `${currency}-BRL`;
    const currencyString = `${currency}BRL`;

    try {
      const response = await httpService({
        url: `/last/${currencyStringURL}`,
        method: "get",
      });

      return response.data[currencyString].bid;
    } catch (error) {
      throw new RequestError(
        400,
        `Unknown Currency Conversion error: ${error || null}`
      );
    }
  }
}
