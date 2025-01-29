import { RequestError } from '../../../core/errors/RequestError';
import { Action } from '../../../core/interfaces/Action';
import axios from 'axios';

interface OrderValues {
  totalValueInCents: number;
  sellerValueInCents: number;
  platformValueInCents: number;
  shippingValueInCents: number;
}

interface OrderItem {
  ItemId: string;
  ItemName: string;
  Quantity: number;
  UnitPrice: number;
  ItemCategory: string;
  ItemBrand: string;
  ItemSku: string;
}

export interface ConvertOrderCurrencyActionInput {
  originalCurrency: string;
  values: OrderValues;
  items: OrderItem[];

}

export interface ConvertOrderCurrencyActionOutput {
  convertedValues: OrderValues;
  convertedItems: OrderItem[];
}

interface AwesomeApiResponse {
  [key: string]: {
    code: string;
    codein: string;
    name: string;
    high: string;
    low: string;
    varBid: string;
    pctChange: string;
    bid: string;
    ask: string;
    timestamp: string;
    create_date: string;
  }
}
export class ConvertOrderCurrencyAction implements Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput> {
  private readonly BASE_URL = 'https://economia.awesomeapi.com.br/json/last';

  async execute(input: ConvertOrderCurrencyActionInput): Promise<ConvertOrderCurrencyActionOutput> {
    if (input.originalCurrency === 'BRL') {
      return {
        convertedValues: { ...input.values },
        convertedItems: [...input.items],
      };
    }

    try {
      const currencyPair = `${input.originalCurrency}-BRL`;
      const response = await axios.get<AwesomeApiResponse>(`${this.BASE_URL}/${currencyPair}`);

      const exchangeKey = `${input.originalCurrency}BRL`;
      const exchangeRate = Number(response.data[exchangeKey].bid);

      if (!exchangeRate) {
        throw new RequestError(400, `Exchange rate not available for ${input.originalCurrency}`);
      }

      const convertedValues: OrderValues = {
        totalValueInCents: this.convertValue(input.values.totalValueInCents, exchangeRate),
        sellerValueInCents: this.convertValue(input.values.sellerValueInCents, exchangeRate),
        platformValueInCents: this.convertValue(input.values.platformValueInCents, exchangeRate),
        shippingValueInCents: this.convertValue(input.values.shippingValueInCents, exchangeRate),
      };

      const convertedItems: OrderItem[] = input.items.map(item => ({
        ...item,
        UnitPrice: Number((item.UnitPrice * exchangeRate).toFixed(2)),
      }));

      console.log('convertedValues final', convertedValues);

      return {
        convertedValues,
        convertedItems,
      };
    } catch (error) {
      if (error instanceof RequestError) {
        throw error;
      }
      throw new RequestError(
        500,
        `Failed to convert currency from ${input.originalCurrency} to BRL: ${error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private convertValue(valueInCents: number, rate: number): number {
    return Math.round(valueInCents * rate);
  }
}
