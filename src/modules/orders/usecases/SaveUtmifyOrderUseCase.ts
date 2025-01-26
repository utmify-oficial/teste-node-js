import { UseCase } from '../../../core/interfaces/UseCase';
import { UtmifyOrdersRepository } from '../repositories/UtmifyOrdersRepository';
import { UtmifyOrder } from '../types/utimify/UtmifyOrder';

export type SaveUtmifyOrderUseCaseInput = {
  data: UtmifyOrder;
  additionalInfo: SaveUtmifyOrderUseCaseInputAdditionalInfo;
};

export type SaveUtmifyOrderUseCaseInputAdditionalInfo = {
  currency: string;
};

export type SaveUtmifyOrderUseCaseOutput = void;

export class SaveUtmifyOrderUseCase implements UseCase<SaveUtmifyOrderUseCaseInput, SaveUtmifyOrderUseCaseOutput> {
  private readonly repository: UtmifyOrdersRepository;

  constructor(repository: UtmifyOrdersRepository) {
    this.repository = repository;
  }

  async execute(input: SaveUtmifyOrderUseCaseInput): Promise<void> {
    await this.repository.save(input.data);
  }
}
