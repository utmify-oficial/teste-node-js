import { UseCase } from "../../../core/interfaces/UseCase";
import { StatusMachineAction } from "../actions/StatusMachineAction";
import { UtmifyOrdersRepository } from "../repositories/UtmifyOrdersRepository";
import { UtmifyOrder } from "../types/UtmifyOrder";

export type SaveUtmifyOrderUseCaseInput = {
  data: UtmifyOrder;
  additionalInfo: SaveUtmifyOrderUseCaseInputAdditionalInfo;
};

export type SaveUtmifyOrderUseCaseInputAdditionalInfo = {
  currency: string;
};

export type SaveUtmifyOrderUseCaseOutput = void;

export class SaveUtmifyOrderUseCase
  implements UseCase<SaveUtmifyOrderUseCaseInput, SaveUtmifyOrderUseCaseOutput>
{
  private readonly repository: UtmifyOrdersRepository;
  constructor(
    repository: UtmifyOrdersRepository,
    private statusMachineAction: StatusMachineAction
  ) {
    this.repository = repository;
  }

  async execute(input: SaveUtmifyOrderUseCaseInput): Promise<void> {
    let allowUpdate = true;
    const foundOrder = await this.repository.findBySaleId(input.data);
    if (foundOrder) {
      allowUpdate = await this.statusMachineAction.execute({
        actualStatus: foundOrder?.transactionStatus,
        nextStatus: input.data.transactionStatus,
      });
    }
    if (allowUpdate) {
      await this.repository.save(input.data);
    }
  }
}
