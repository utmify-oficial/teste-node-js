/* eslint-disable max-len */
import { RequestError } from '../../../core/errors/RequestError';
import { Action } from '../../../core/interfaces/Action';
import { HttpClient } from '../../../http/HttpClient';

export type ConvertOrderCurrencyActionInput = {
  currency: 'USD' | 'EUR',
  orderCreated: string,
  value: number,
};

export type ConvertOrderCurrencyActionOutput = number;

export class ConvertOrderCurrencyAction implements Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput> {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async execute({ currency, orderCreated, value }: ConvertOrderCurrencyActionInput): Promise<ConvertOrderCurrencyActionOutput> {
    const dateInYYYYMMDD = this.formatDateToYYYYMMDD(orderCreated);

    const url = `https://economia.awesomeapi.com.br/json/daily/${currency}-BRL/1?start_date=${dateInYYYYMMDD}&end_date=${dateInYYYYMMDD}`;

    try {
      const data = await this.httpClient.get(url);
      if (data.length === 0) {
        throw new RequestError(404, 'No data found for the requested date');
      }
      const currencyValue = parseFloat(data[0].ask);
      return this.convertValue(value, currencyValue);
    } catch(error) {
      console.error(error);
      throw new RequestError(400, 'Error processing currency conversion');
    }
  }

  private formatDateToYYYYMMDD(dateTime: string): string {
    const date = new Date(dateTime);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }

  private convertValue(value: number, currencyValue: number) {
    return Math.round(Number(((value ?? 0) * currencyValue).toFixed(2)));
  }
}
