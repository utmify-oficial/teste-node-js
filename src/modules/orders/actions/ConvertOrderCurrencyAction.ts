import axios from 'axios';
import { Action } from '../../../core/interfaces/Action';
import { AllOffersCurrency } from '../types/allOffers/AllOffersPaymentMethod';
import { Env } from '../../../server/Env';

export type ConvertOrderCurrencyActionInput = {
  currency: AllOffersCurrency;
  value: number;
};
export type ConvertOrderCurrencyActionOutput = number;

export class ConvertOrderCurrencyAction
implements Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput> {
  private static get API_KEY(): string | null {
    return Env.vars.EXCHANGE_API_KEY;
  }

  private static get BASE_URL(): string {
    if (!ConvertOrderCurrencyAction.API_KEY) {
      return '';
    }
    return `https://v6.exchangerate-api.com/v6/${ConvertOrderCurrencyAction.API_KEY}/latest`;
  }

  private static STATIC_RATES: Record<string, number> = {
    USD: 5.92,
    EUR: 6.20,
    BRL: 1.0,
  };

  async execute({ currency, value }: { currency: AllOffersCurrency; value: number }): Promise<number> {
    try {
      if (!ConvertOrderCurrencyAction.API_KEY) {
        return this.convertWithStaticRates(currency, value);
      }

      const response = await axios.get(`${ConvertOrderCurrencyAction.BASE_URL}/${currency}`);
      const rates = response.data.conversion_rates;

      if (!rates.BRL) {
        throw new Error('Conversion rate for BRL not found.');
      }
      return value * rates.BRL;
    } catch {
      return this.convertWithStaticRates(currency, value);
    }
  }

  private convertWithStaticRates(currency: AllOffersCurrency, value: number): number {
    const rate = ConvertOrderCurrencyAction.STATIC_RATES[currency];
    if (!rate) {
      throw new Error(`Static exchange rate not found for currency: ${currency}`);
    }
    return value * rate;
  }
}
