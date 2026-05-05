/**
 * @file GetTimelineUseCase.js
 */
import { UseCase } from '../../../../core/utils/UseCase';
import { ok, fail } from '../../../../core/utils/Result';
import { Failure }  from '../../../../core/error/Failure';
import { calculateFermentationDay, safeParseTimestamp } from '../../../../core/utils/fermentationUtils';

export class GetTimelineUseCase extends UseCase {
  constructor({ timelineRepository, authService }) {
    super();
    this._repo = timelineRepository;
    this._auth = authService;
  }

  /**
   * Subscribe to timeline captures and invoke callback with processed images.
   * @param {{ callback: Function }} input
   * @returns {Promise<{ success: boolean, data?: { unsubscribe: Function } }>}
   */
  async execute({ callback }) {
    try {
      await this._auth.initialize();
      const userId = this._auth.getUserId();
      if (!userId) return fail(new Failure('User not authenticated'));

      const unsubscribe = this._repo.subscribeToCapturesForUser(userId, ({ data }) => {
        if (!data) { callback([]); return; }

        const parseTs = (ts) => {
          try {
            const [d, t] = ts.includes('_') ? ts.split('_') : ts.split(' ');
            const [y, m, day] = d.split('-').map(Number);
            const [h, min, s] = t.split(/[-:]/).map(Number);
            return new Date(y, m - 1, day, h, min, s);
          } catch { return null; }
        };

        const results = Object.entries(data)
          .map(([timestamp, url]) => {
            const fermentationInfo = calculateFermentationDay(timestamp);
            const date = parseTs(timestamp);
            return {
              timestamp,
              url,
              inference: { day: fermentationInfo.dayKey, stage: fermentationInfo.stageName },
              parsedDate: date,
              dayNumber: fermentationInfo.dayNumber,
              displayDate: date ? date.toLocaleString() : timestamp,
            };
          })
          .sort((a, b) => (b.parsedDate?.getTime() || 0) - (a.parsedDate?.getTime() || 0));

        callback(results);
      });

      return ok({ unsubscribe });
    } catch (error) {
      return fail(new Failure(error.message, error));
    }
  }
}
