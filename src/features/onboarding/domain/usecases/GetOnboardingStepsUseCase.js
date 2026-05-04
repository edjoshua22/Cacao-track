import { UseCase } from '../../../../core/utils/UseCase';
import { ok, fail } from '../../../../core/utils/Result';
import { Failure }  from '../../../../core/error/Failure';

const SLIDES = [
  { key: '1', title: 'Welcome to CacaoTrack!',          text: 'Track your cacao fermentation process with real-time insights and expert guidance.',                          animationKey: 'Welcome' },
  { key: '2', title: 'Monitor Fermentation Batches',    text: 'Easily track cacao batch, fermentation stages, temperature, humidity, moisture and progress.',              animationKey: 'WelcomeAnimation' },
  { key: '3', title: 'Stay Updated',                    text: 'Receive instant notifications about fermentation milestones, quality checks, and alerts.',                   animationKey: 'Notifications' },
];

export class GetOnboardingStepsUseCase extends UseCase {
  constructor({ onboardingRepository }) { super(); this._repo = onboardingRepository; }
  async execute() {
    try {
      const isComplete = await this._repo.isOnboardingComplete();
      return ok({ slides: SLIDES, isComplete });
    } catch (e) { return fail(new Failure(e.message, e)); }
  }
}
