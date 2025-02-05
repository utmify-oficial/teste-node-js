import { StatusMachineAction } from "../../actions/StatusMachineAction";
import { UtmifyOrdersRepositoryMongoose } from "../../repositories/implementations/UtmifyOrdersRepositoryMongoose";
import { UtmifyOrderFromDb } from "../../repositories/UtmifyOrdersRepository";
import {
  SaveUtmifyOrderUseCase,
  SaveUtmifyOrderUseCaseInput,
} from "../SaveUtmifyOrderUseCase";

const repository = new UtmifyOrdersRepositoryMongoose();
const statusMachineAction = new StatusMachineAction();
const usecase = new SaveUtmifyOrderUseCase(repository, statusMachineAction);

describe("execute", () => {
  it("should call reposiroty with correct params", async () => {
    jest
      .spyOn(repository, "save")
      .mockResolvedValueOnce({} as UtmifyOrderFromDb);

    const mockedInput = {
      data: {
        saleId: "sale_id",
      },
      additionalInfo: {
        currency: "BRL",
      },
    } as SaveUtmifyOrderUseCaseInput;

    const res = await usecase.execute(mockedInput);

    expect(res).toBeUndefined();

    expect(repository.save).toHaveReturnedTimes(1);
    expect(repository.save).toHaveBeenCalledWith(mockedInput.data);
  });
});
