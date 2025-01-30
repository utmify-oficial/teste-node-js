/* eslint-disable max-len */
import { ConvertOrderCurrencyAction, ConvertOrderCurrencyActionInput } from '../ConvertOrderCurrencyAction';
import { AxiosAdapter } from '../../../../http/AxiosAdapter';
import { RequestError } from '../../../../core/errors/RequestError';

jest.mock('../../../../http/AxiosAdapter');

describe('execute', () => {
  let httpClient: AxiosAdapter;
  let convertOrderCurrencyAction: ConvertOrderCurrencyAction;

  beforeEach(() => {
    httpClient = new AxiosAdapter();
    convertOrderCurrencyAction = new ConvertOrderCurrencyAction(httpClient);
  });

  it('should return correct converted value for USD to BRL', async function() {
    const input = {
      currency: 'USD',
      orderCreated: '2025-01-24T03:00:00Z',
      value: 100,
    } as ConvertOrderCurrencyActionInput;

    jest.spyOn(httpClient, 'get').mockResolvedValue([{
      ask: '5.00',
    }]);

    const result = await convertOrderCurrencyAction.execute(input);

    expect(result).toBe(500.00);
    expect(httpClient.get).toHaveBeenCalledWith('https://economia.awesomeapi.com.br/json/daily/USD-BRL/1?start_date=20250124&end_date=20250124');
  });

  it('should throw an error if the API response is empty', async function() {
    const input = {
      currency: 'USD',
      orderCreated: '2025-02-24T03:00:00',
      value: 100,
    } as ConvertOrderCurrencyActionInput;

    jest.spyOn(httpClient, 'get').mockResolvedValue([]);

    await expect(convertOrderCurrencyAction.execute(input)).rejects.toThrow(new RequestError(400, 'Error processing currency conversion'));
  });
});
