// Arquivo: actions/ConvertOrderCurrencyAction.ts
import { Action } from "../../../core/interfaces/Action";

export type ConvertOrderCurrencyActionInput = {
  currency: string;
  totalSaleAmount: number;
  userCommission: number;
  platformCommission: number;
};

export type ConvertOrderCurrencyActionOutput = {
  totalSaleAmountInBRL: number;
  userCommissionInBRL: number;
  platformCommissionInBRL: number;
};

export class ConvertOrderCurrencyAction
  implements
    Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput>
{
  // Simulação de função que retorna a taxa de câmbio para BRL
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    const exchangeRates: { [key: string]: number } = {
      USD: 5.25, // Exemplo de taxa de câmbio de USD para BRL
      EUR: 5.7, // Exemplo de taxa de câmbio de EUR para BRL
      BRL: 1, // BRL para BRL
    };

    return exchangeRates[fromCurrency] || 1; // Retorna 1 se a moeda for BRL
  }

  // Função que executa a conversão
  async execute(
    input: ConvertOrderCurrencyActionInput
  ): Promise<ConvertOrderCurrencyActionOutput> {
    const { currency, totalSaleAmount, userCommission, platformCommission } =
      input;

    if (currency === "BRL") {
      return {
        totalSaleAmountInBRL: totalSaleAmount,
        userCommissionInBRL: userCommission,
        platformCommissionInBRL: platformCommission,
      };
    }

    const exchangeRate = await this.getExchangeRate(currency, "BRL");
    return {
      totalSaleAmountInBRL: totalSaleAmount * exchangeRate,
      userCommissionInBRL: userCommission * exchangeRate,
      platformCommissionInBRL: platformCommission * exchangeRate,
    };
  }
}
