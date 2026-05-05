import { UseCase } from '../../../../core/utils/UseCase';
import { ok } from '../../../../core/utils/Result';
export class MarkNotificationReadUseCase extends UseCase {
  constructor({ notificationRepository }) { super(); this._repo = notificationRepository; }
  async execute() { return ok(null); }
}
