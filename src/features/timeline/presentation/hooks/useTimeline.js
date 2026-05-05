/**
 * @file useTimeline.js
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import container from '../../../../core/di/container';

/**
 * @returns {{ images: object[], isLoading: boolean, refreshing: boolean, onRefresh: Function }}
 */
export const useTimeline = () => {
  const [images,     setImages]    = useState([]);
  const [isLoading,  setIsLoading] = useState(true);
  const [refreshing, setRefreshing]= useState(false);

  useEffect(() => {
    let unsubscribe = null;

    const setup = async () => {
      const useCase = container.resolve('getTimelineUseCase');
      const result  = await useCase.execute({ callback: (imgs) => { setImages(imgs); setIsLoading(false); setRefreshing(false); } });
      if (result.success) unsubscribe = result.data.unsubscribe;
      else { setIsLoading(false); }
    };

    setup();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); }, []);

  return { images, isLoading, refreshing, onRefresh };
};
