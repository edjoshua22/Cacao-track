/**
 * @file useOnboarding.js
 */
import { useState, useEffect, useCallback } from 'react';
import container from '../../../../core/di/container';

export const useOnboarding = () => {
  const [slides,      setSlides]      = useState([]);
  const [isComplete,  setIsComplete]  = useState(false);
  const [isLoading,   setIsLoading]   = useState(true);
  const [currentIndex,setCurrentIndex]= useState(0);

  useEffect(() => {
    const useCase = container.resolve('getOnboardingStepsUseCase');
    useCase.execute().then((result) => {
      if (result.success) { setSlides(result.data.slides); setIsComplete(result.data.isComplete); }
      setIsLoading(false);
    });
  }, []);

  const complete = useCallback(async () => {
    const useCase = container.resolve('completeOnboardingUseCase');
    await useCase.execute();
    setIsComplete(true);
  }, []);

  const handleSlideChange = useCallback((index) => setCurrentIndex(index), []);

  return { slides, isComplete, isLoading, currentIndex, complete, handleSlideChange };
};
