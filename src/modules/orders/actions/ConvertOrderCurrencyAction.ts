import { Action } from '../../../core/interfaces/Action';

export type ConvertOrderCurrencyActionInput = {
  amount: number;
  currency: string;
};

export type ConvertOrderCurrencyActionOutput = {
  amountInCents: number;
};

// eslint-disable-next-line max-len
export class ConvertOrderCurrencyAction implements Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput> {
  async execute(input: ConvertOrderCurrencyActionInput): Promise<ConvertOrderCurrencyActionOutput> {
    const { amount, currency } = input;
    const amountInCents = this.convertToBRL(amount, currency) * 100;
    return { amountInCents };
  }

  private convertToBRL(amount: number, currency: string): number {
    switch (currency) {
      case 'USD':
        return amount * 5.2; // Exemplo de taxa de conversão
      case 'EUR':
        return amount * 6.1; // Exemplo de taxa de conversão
      case 'BRL':
      default:
        return amount;
    }
  }
}
