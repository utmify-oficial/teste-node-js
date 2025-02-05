import axios from "axios";
import * as https from "https";
import { Action } from "../../../core/interfaces/Action";
import { RequestError } from "../../../core/errors/RequestError";

import { AwesomeApi } from "../externalApis/AwesomeApi";
export type ConvertOrderCurrencyActionInput = {
  currency: string;
  value: number;
};
export type ConvertOrderCurrencyActionOutput = number;

// eslint-disable-next-line max-len
export class ConvertOrderCurrencyAction
  implements
    Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput>
{
  constructor(private aewsomeApi: AwesomeApi) {}
  async execute(_input: { currency: string; value: number }): Promise<number> {
    const factor = await this.aewsomeApi.getCurrencyConversion(_input.currency);
    return parseFloat(factor) * _input.value;
  }
}
