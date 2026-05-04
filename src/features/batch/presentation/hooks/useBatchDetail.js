/**
 * @file useBatchDetail.js
 */
import { useState, useEffect } from 'react';
import container from '../../../../core/di/container';

/**
 * @param {string} batchId
 * @returns {{ batch: object|null, isLoading: boolean, error: string|null }}
 */
export const useBatchDetail = (batchId) => {
  const [batch,     setBatch]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!batchId) { setIsLoading(false); return; }
    const useCase = container.resolve('getBatchDetailUseCase');
    useCase.execute({ batchId }).then((result) => {
      if (result.success) setBatch(result.data);
      else setError(result.error.message);
      setIsLoading(false);
    });
  }, [batchId]);

  return { batch, isLoading, error };
};
