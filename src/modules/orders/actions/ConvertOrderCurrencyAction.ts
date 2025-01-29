import axios from "axios";
import { Action } from "../../../core/interfaces/Action";
import { Env } from "../../../server/Env";

export type ConvertOrderCurrencyActionInput = {
  amount: number;
  currency: "EUR" | "USD" | "BRL";
};
export type ConvertOrderCurrencyActionOutput = number;

// eslint-disable-next-line max-len
export class ConvertOrderCurrencyAction
  implements
    Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput>
{
  async execute(
    input: ConvertOrderCurrencyActionInput
  ): Promise<ConvertOrderCurrencyActionOutput> {
    try {
      const response = await axios.get(
        `${Env.vars.EXCHANGE_RATE_API_URL}${input.currency}`
      );
      const rate = response.data.conversion_rates["BRL"];
      return input.amount * rate;
    } catch (error) {
      console.error("Error obtaining exchange rate:", error);
      throw new Error("Currency conversion failure");
    }
  }
}
