import { Action } from '../../../core/interfaces/Action';

export type ConvertOrderCurrencyActionInput = void;
export type ConvertOrderCurrencyActionOutput = void;

// eslint-disable-next-line max-len
export class ConvertOrderCurrencyAction implements Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput> {
  async execute(_input: void): Promise<void> {
    // ...
  }
}
