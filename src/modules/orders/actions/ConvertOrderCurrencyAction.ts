import { Action } from '../../../core/interfaces/Action';
import { UtmifyValues } from '../types/UtmifyValues';

export type ConvertOrderCurrencyActionInput = {
  input_currency: 'USD' | 'EUR';
  target_currency: 'BRL';
  values: UtmifyValues;
};

export type ConvertOrderCurrencyActionOutput = UtmifyValues;

// eslint-disable-next-line max-len
export class ConvertOrderCurrencyAction implements Action<ConvertOrderCurrencyActionInput, ConvertOrderCurrencyActionOutput> {
  public async execute(input: ConvertOrderCurrencyActionInput): Promise<ConvertOrderCurrencyActionOutput> {
    const formatDate: (input_date: Date) => string = (input_date: Date) => {
      return `${input_date.getMonth() + 1}-${input_date.getDate()}-${input_date.getFullYear()}`;
    }
    const threeDaysAgo = new Date(new Date().setDate(new Date().getDate() - 3));
    const initialDate = formatDate(threeDaysAgo);
    const finalDate = formatDate(new Date());
    const res = await fetch(`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodoFechamento(codigoMoeda=@codigoMoeda,dataInicialCotacao=@dataInicialCotacao,dataFinalCotacao=@dataFinalCotacao)?@codigoMoeda='${input.input_currency}'&@dataInicialCotacao='${initialDate}'&@dataFinalCotacao='${finalDate}'&$format=json&$select=cotacaoCompra`);
    const exchangeInfo = (await res.json()) as PtaxResponse;
    const exchangeRate = exchangeInfo.value[0].cotacaoCompra;
    return {
      totalValueInCents: Math.ceil(input.values.totalValueInCents * exchangeRate),
      sellerValueInCents: Math.ceil(input.values.sellerValueInCents * exchangeRate),
      platformValueInCents: Math.ceil(input.values.platformValueInCents * exchangeRate),
      shippingValueInCents: input.values.shippingValueInCents != null ? Math.ceil(input.values.shippingValueInCents * exchangeRate) : null
    };
  }
}

type PtaxResponse = {
  value: Cotacao[];
};

type Cotacao = {
  cotacaoCompra: number;
};
