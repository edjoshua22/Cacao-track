/**
 * @file GetMonitoringDataUseCase.js
 */
import { UseCase } from '../../../../core/utils/UseCase';
import { ok } from '../../../../core/utils/Result';

export class GetMonitoringDataUseCase extends UseCase {
  constructor({ monitoringRepository }) { super(); this._repo = monitoringRepository; }
  async execute({ callback }) {
    const unsubscribe = this._repo.subscribeToLiveSensors(callback);
    return ok({ unsubscribe });
  }
}
