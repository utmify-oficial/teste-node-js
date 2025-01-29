import { RequestError } from '../../../core/errors/RequestError';
import { UtmifyTransactionStatus } from '../types/UtmifyTransactionStatus';

export class AllOffersOrderValidationService {

  validateStatusTransition(currentStatus: UtmifyTransactionStatus, newStatus: UtmifyTransactionStatus) {
    if (currentStatus === UtmifyTransactionStatus.Paid &&
      newStatus === UtmifyTransactionStatus.Pending) {
      throw new RequestError(400, 'Paid orders cannot be updated to pending status');
    }

    if (currentStatus === UtmifyTransactionStatus.Refunded &&
      (newStatus === UtmifyTransactionStatus.Paid ||
        newStatus === UtmifyTransactionStatus.Pending)) {
      throw new RequestError(400, 'Refunded orders cannot be updated to paid or pending status');
    }
  }

}
