import { Action } from '../../../core/interfaces/Action';

export type ConvertOrderCurrencyActionInput = string;

export type ConvertOrderCurrencyActionOutput = number;

// eslint-disable-next-line max-len
export class ConvertOrderCurrencyAction implements Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput> {
  private currencyRate: number;

  constructor(currencyRate: number){
    this.currencyRate = currencyRate;
  }

  async execute(currency: ConvertOrderCurrencyActionInput): Promise<ConvertOrderCurrencyActionOutput> {
    await fetch('https://api.vatcomply.com/rates?base=BRL')
      .then(response => {
        return response.json();
      }).then(response => {
        Object.keys(response.rates).forEach(e => {
          if(e === currency){
            this.currencyRate = response.rates[e];
          }
        });
    });
    return this.currencyRate;
  }
}
