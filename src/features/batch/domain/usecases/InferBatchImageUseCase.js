/**
 * @file InferBatchImageUseCase.js
 * @description Use case for ML image inference on a cacao bean photo URL.
 * Migrated from utils/inferImage.js — all original logic preserved.
 */
import { UseCase } from '../../../../core/utils/UseCase';
import { ok, fail } from '../../../../core/utils/Result';
import { Failure }  from '../../../../core/error/Failure';
import { getApiBaseUrl } from '../../../../../config';
import { logApiCall, logProductionError } from '../../../../core/utils/debugUtils';

// Module-level health cache (shared across invocations)
let _apiHealthStatus  = null;
let _lastHealthCheck  = 0;
const HEALTH_CHECK_INTERVAL = 30000;

/** @returns {Promise<boolean>} */
async function checkApiHealth() {
  const now = Date.now();
  if (_apiHealthStatus !== null && (now - _lastHealthCheck) < HEALTH_CHECK_INTERVAL) return _apiHealthStatus;
  try {
    const baseUrl  = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/health`, { method: 'GET' });
    _apiHealthStatus = response.ok;
    _lastHealthCheck = now;
    logApiCall(`${baseUrl}/health`, 'GET', response.ok, response.ok ? null : new Error('Health check failed'));
    return _apiHealthStatus;
  } catch (e) {
    _apiHealthStatus = false;
    _lastHealthCheck = now;
    logApiCall('health', 'GET', false, e);
    return false;
  }
}

/** Extract day key from image URL timestamp. @param {string} imageUrl @returns {string} */
function extractDayKey(imageUrl) {
  const match = imageUrl.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
  if (!match) return 'day0';
  const [datePart, timePart] = match[1].split('_');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split('-').map(Number);
  const imageTime = new Date(year, month - 1, day, hour, minute, second).getTime();
  return imageTime < Date.now() - 24 * 60 * 60 * 1000 ? 'day0' : 'day1';
}

export class InferBatchImageUseCase extends UseCase {
  constructor() { super(); }

  /**
   * Run ML inference on a cacao image URL.
   * @param {{ imageUrl: string }} input
   * @returns {Promise<{ success: boolean, data?: { stage: string, day: string, confidence: number }, error?: Failure }>}
   */
  async execute({ imageUrl }) {
    try {
      if (__DEV__) console.log('🔍 Starting image inference for URL:', imageUrl);
      const baseUrl = getApiBaseUrl();
      const dayKey  = extractDayKey(imageUrl);

      const isHealthy = await checkApiHealth();
      if (!isHealthy) {
        return ok({ stage: dayKey === 'day0' ? 'Fresh' : 'Anaerobic', day: dayKey, confidence: 0.5, error: 'API unavailable' });
      }

      const response = await fetch(`${baseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(`API Error: ${response.status} - ${errorText}`);
        logApiCall(`${baseUrl}/predict`, 'POST', false, err);
        if (!__DEV__) logProductionError(err, 'InferBatchImageUseCase.predict');
        return ok({ stage: dayKey === 'day0' ? 'Fresh' : 'Anaerobic', day: dayKey, confidence: 0, error: `API Error: ${response.status}` });
      }

      const data = await response.json();
      logApiCall(`${baseUrl}/predict`, 'POST', true);
      return ok({ stage: dayKey === 'day0' ? 'Fresh' : 'Anaerobic', day: dayKey, confidence: data.confidence || 0.8 });
    } catch (e) {
      logProductionError(e, 'InferBatchImageUseCase');
      if (e.message.includes('Network request failed')) { _apiHealthStatus = false; _lastHealthCheck = 0; }
      const dayKey = extractDayKey(imageUrl);
      return ok({ stage: dayKey === 'day0' ? 'Fresh' : 'Anaerobic', day: dayKey, confidence: 0, error: e.message });
    }
  }
}

/** Stage name mapping. */
export const stageMapping = {
  day0: 'Fresh', day1: 'Anaerobic', day2: 'Anaerobic / Alcoholic',
  day3: 'Aerobic', day4: 'Aerobic', day5: 'Maturation', day6: 'Drying Ready',
};
