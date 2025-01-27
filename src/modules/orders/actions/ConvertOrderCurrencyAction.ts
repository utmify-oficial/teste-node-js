import { RequestError } from '../../../core/errors/RequestError';
import { Action } from '../../../core/interfaces/Action';
import { Convert } from "easy-currencies";

export type ConvertOrderCurrencyActionInput = number;
export type ConvertOrderCurrencyActionOutput = number;

// eslint-disable-next-line max-len
export class ConvertOrderCurrencyAction implements Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput> {
  private readonly targetCode: string = 'BRL';

  private _code: string = '';
  set code(value: string) {
    this._code = value;
  }
  get code() {
    return this._code;
  }

  async execute(value: number): Promise<number> {
    return Convert(value).from(this.code).to(this.targetCode)
      .catch(_ => { throw new RequestError(400, `Error on convert currency: ${this.code}`) });
  }
}
