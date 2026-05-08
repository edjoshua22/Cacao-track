/**
 * @file useStirrerController.js
 * @description Presentation-layer hook. Owns all stirrer state and orchestrates use cases.
 * The screen component is completely dumb — it only consumes this hook.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { StirrerRemoteDataSource } from '../../data/datasources/StirrerRemoteDataSource';
import { StirrerLocalDataSource, DEFAULT_ESP_IP } from '../../data/datasources/StirrerLocalDataSource';
import { StirrerRepositoryImpl } from '../../data/repositories/StirrerRepositoryImpl';
import { StartStirrerUseCase } from '../../domain/usecases/StartStirrerUseCase';
import { StopStirrerUseCase } from '../../domain/usecases/StopStirrerUseCase';
import { GetEspIpUseCase } from '../../domain/usecases/GetEspIpUseCase';
import { SaveEspIpUseCase } from '../../domain/usecases/SaveEspIpUseCase';
import { mapToStirrerViewModel } from '../viewmodels/StirrerViewModel';

// ── Instantiate the dependency graph once (module-level singletons) ────────────
const _localDS = new StirrerLocalDataSource();
const _remoteDS = new StirrerRemoteDataSource(DEFAULT_ESP_IP);
const _repo = new StirrerRepositoryImpl({
  stirrerRemoteDataSource: _remoteDS,
  stirrerLocalDataSource: _localDS,
});

const _startUseCase = new StartStirrerUseCase({ stirrerRepository: _repo });
const _stopUseCase = new StopStirrerUseCase({ stirrerRepository: _repo });
const _getIpUseCase = new GetEspIpUseCase({ stirrerRepository: _repo });
const _saveIpUseCase = new SaveEspIpUseCase({ stirrerRepository: _repo });

// ──────────────────────────────────────────────────────────────────────────────

/**
 * @returns {{
 *   vm:         import('../viewmodels/StirrerViewModel').StirrerViewModel,
 *   onStart:    () => Promise<void>,
 *   onStop:     () => Promise<void>,
 *   onSaveIp:   (ip: string) => Promise<void>,
 *   onDismissError: () => void,
 * }}
 */
export const useStirrerController = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [espIp, setEspIp] = useState(DEFAULT_ESP_IP);

  // Load the saved IP on mount
  useEffect(() => {
    _getIpUseCase.execute().then(ip => {
      if (ip) setEspIp(ip);
    });
  }, []);

  const onStart = useCallback(async () => {
    setIsSending(true);
    setError(null);
    const result = await _startUseCase.execute();
    setIsSending(false);
    if (result.success) {
      setIsRunning(true);
    } else {
      setError(result.error?.message ?? 'Failed to start motor');
    }
  }, []);

  const onStop = useCallback(async () => {
    setIsSending(true);
    setError(null);
    const result = await _stopUseCase.execute();
    setIsSending(false);
    if (result.success) {
      setIsRunning(false);
    } else {
      setError(result.error?.message ?? 'Failed to stop motor');
    }
  }, []);

  const onSaveIp = useCallback(async (ip) => {
    const trimmed = ip.trim();
    if (!trimmed) return;
    setEspIp(trimmed);
    await _saveIpUseCase.execute(trimmed);
  }, []);

  const onDismissError = useCallback(() => setError(null), []);

  const vm = useMemo(
    () => mapToStirrerViewModel({ isRunning, isSending, error, espIp }),
    [isRunning, isSending, error, espIp],
  );

  return { vm, onStart, onStop, onSaveIp, onDismissError };
};
