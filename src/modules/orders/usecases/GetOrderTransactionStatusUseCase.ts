/* eslint-disable max-len */
import { UseCase } from '../../../core/interfaces/UseCase';
import { UtmifyOrdersRepository } from '../repositories/UtmifyOrdersRepository';
import { UtmifyTransactionStatus } from '../types/UtmifyTransactionStatus';

export type GetOrderTransactionStatusUseCaseInput = {
    saleId: string
}

export type GetOrderTransactionStatusUseCaseOutput = {
    transactionStatus: UtmifyTransactionStatus | null
}
export class GetOrderTransactionStatusUseCase implements UseCase<GetOrderTransactionStatusUseCaseInput, GetOrderTransactionStatusUseCaseOutput> {
  private readonly repository: UtmifyOrdersRepository;

  constructor(repository: UtmifyOrdersRepository) {
    this.repository = repository;
  }

  async execute(input: GetOrderTransactionStatusUseCaseInput): Promise<GetOrderTransactionStatusUseCaseOutput> {
    const order = await this.repository.getTransactionStatusBySaleId(input.saleId);
    if(!order) {
      return {
        transactionStatus: null,
      };
    }
    return {
      transactionStatus: order.transactionStatus,
    };
  }

}
