import { Action } from "../../../core/interfaces/Action";
import { UtmifyTransactionStatus } from "../types/UtmifyTransactionStatus";
export type StatusMachineActionInput = {
  actualStatus: UtmifyTransactionStatus;
  nextStatus: UtmifyTransactionStatus;
};
export type StatusMachineActionOutput = boolean;

// eslint-disable-next-line max-len
export class StatusMachineAction
  implements Action<StatusMachineActionInput, StatusMachineActionOutput>
{
  async execute(input: {
    actualStatus: UtmifyTransactionStatus;
    nextStatus: UtmifyTransactionStatus;
  }): Promise<boolean> {
    let allowUpdate = false;
    switch (input.actualStatus) {
      case UtmifyTransactionStatus.Pending:
        allowUpdate = true;
        break;
      case UtmifyTransactionStatus.Paid:
        if (input.nextStatus == UtmifyTransactionStatus.Refunded) {
          allowUpdate = true;
        }
        break;
      case UtmifyTransactionStatus.Refunded:
        allowUpdate = false;
        break;
      default:
        allowUpdate = false;
        break;
    }
    return allowUpdate;
  }
}
