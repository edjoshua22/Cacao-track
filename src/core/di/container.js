/**
 * @file container.js
 * @description Awilix DI container — registers every service, repository, and use case.
 * Bootstrap this BEFORE rendering any React component.
 *
 * Awilix resolves dependencies automatically by matching constructor parameter
 * names to registered tokens. Class names must match token keys exactly.
 */
import { createContainer, asClass, Lifetime } from 'awilix';

// ── Core ──────────────────────────────────────────────────────────────────────
import { HttpClientImpl }      from '../network/HttpClientImpl';
import { AsyncStorageImpl }    from '../storage/AsyncStorageImpl';
import { AuthServiceImpl }     from '../auth/AuthServiceImpl';
import { JsonSerializerImpl }  from '../serialization/JsonSerializerImpl';

// ── Batch ─────────────────────────────────────────────────────────────────────
import { BatchRemoteDataSourceImpl } from '../../features/batch/data/datasources/BatchRemoteDataSourceImpl';
import { BatchLocalDataSourceImpl  } from '../../features/batch/data/datasources/BatchLocalDataSourceImpl';
import { BatchRepositoryImpl       } from '../../features/batch/data/repositories/BatchRepositoryImpl';
import { GetBatchesUseCase         } from '../../features/batch/domain/usecases/GetBatchesUseCase';
import { GetBatchDetailUseCase     } from '../../features/batch/domain/usecases/GetBatchDetailUseCase';
import { CreateBatchUseCase        } from '../../features/batch/domain/usecases/CreateBatchUseCase';
import { InferBatchImageUseCase    } from '../../features/batch/domain/usecases/InferBatchImageUseCase';
import { ExportBatchImageUseCase   } from '../../features/batch/domain/usecases/ExportBatchImageUseCase';

// ── Fermentation ──────────────────────────────────────────────────────────────
import { FermentationRemoteDataSourceImpl } from '../../features/fermentation/data/datasources/FermentationRemoteDataSourceImpl';
import { FermentationLocalDataSourceImpl  } from '../../features/fermentation/data/datasources/FermentationLocalDataSourceImpl';
import { FermentationRepositoryImpl       } from '../../features/fermentation/data/repositories/FermentationRepositoryImpl';
import { GetFermentationHistoryUseCase    } from '../../features/fermentation/domain/usecases/GetFermentationHistoryUseCase';
import { CalculateFermentationUseCase     } from '../../features/fermentation/domain/usecases/CalculateFermentationUseCase';

// ── Monitoring ────────────────────────────────────────────────────────────────
import { MonitoringRemoteDataSourceImpl } from '../../features/monitoring/data/datasources/MonitoringRemoteDataSourceImpl';
import { MonitoringLocalDataSourceImpl  } from '../../features/monitoring/data/datasources/MonitoringLocalDataSourceImpl';
import { MonitoringRepositoryImpl       } from '../../features/monitoring/data/repositories/MonitoringRepositoryImpl';
import { GetMonitoringDataUseCase       } from '../../features/monitoring/domain/usecases/GetMonitoringDataUseCase';

// ── Notification ──────────────────────────────────────────────────────────────
import { NotificationRemoteDataSourceImpl } from '../../features/notification/data/datasources/NotificationRemoteDataSourceImpl';
import { NotificationLocalDataSourceImpl  } from '../../features/notification/data/datasources/NotificationLocalDataSourceImpl';
import { NotificationRepositoryImpl       } from '../../features/notification/data/repositories/NotificationRepositoryImpl';
import { GetNotificationsUseCase          } from '../../features/notification/domain/usecases/GetNotificationsUseCase';
import { MarkNotificationReadUseCase      } from '../../features/notification/domain/usecases/MarkNotificationReadUseCase';

// ── Onboarding ────────────────────────────────────────────────────────────────
import { OnboardingLocalDataSourceImpl  } from '../../features/onboarding/data/datasources/OnboardingLocalDataSourceImpl';
import { OnboardingRepositoryImpl       } from '../../features/onboarding/data/repositories/OnboardingRepositoryImpl';
import { GetOnboardingStepsUseCase      } from '../../features/onboarding/domain/usecases/GetOnboardingStepsUseCase';
import { CompleteOnboardingUseCase      } from '../../features/onboarding/domain/usecases/CompleteOnboardingUseCase';

// ── Timeline ──────────────────────────────────────────────────────────────────
import { TimelineRemoteDataSourceImpl } from '../../features/timeline/data/datasources/TimelineRemoteDataSourceImpl';
import { TimelineLocalDataSourceImpl  } from '../../features/timeline/data/datasources/TimelineLocalDataSourceImpl';
import { TimelineRepositoryImpl       } from '../../features/timeline/data/repositories/TimelineRepositoryImpl';
import { GetTimelineUseCase           } from '../../features/timeline/domain/usecases/GetTimelineUseCase';

// ── Analytics ─────────────────────────────────────────────────────────────────
import { AnalyticsRemoteDataSourceImpl } from '../../features/analytics/data/datasources/AnalyticsRemoteDataSourceImpl';
import { AnalyticsRepositoryImpl       } from '../../features/analytics/data/repositories/AnalyticsRepositoryImpl';
import { GetAnalyticsDataUseCase       } from '../../features/analytics/domain/usecases/GetAnalyticsDataUseCase';

// ─────────────────────────────────────────────────────────────────────────────

const container = createContainer();

container.register({
  // Core (singletons — shared across the app)
  httpClient:     asClass(HttpClientImpl,     { lifetime: Lifetime.SINGLETON }),
  storageService: asClass(AsyncStorageImpl,   { lifetime: Lifetime.SINGLETON }),
  authService:    asClass(AuthServiceImpl,    { lifetime: Lifetime.SINGLETON }),
  jsonSerializer: asClass(JsonSerializerImpl, { lifetime: Lifetime.SINGLETON }),

  // Batch
  batchRemoteDataSource:   asClass(BatchRemoteDataSourceImpl),
  batchLocalDataSource:    asClass(BatchLocalDataSourceImpl),
  batchRepository:         asClass(BatchRepositoryImpl),
  getBatchesUseCase:       asClass(GetBatchesUseCase),
  getBatchDetailUseCase:   asClass(GetBatchDetailUseCase),
  createBatchUseCase:      asClass(CreateBatchUseCase),
  inferBatchImageUseCase:  asClass(InferBatchImageUseCase),
  exportBatchImageUseCase: asClass(ExportBatchImageUseCase),

  // Fermentation
  fermentationRemoteDataSource:   asClass(FermentationRemoteDataSourceImpl),
  fermentationLocalDataSource:    asClass(FermentationLocalDataSourceImpl),
  fermentationRepository:         asClass(FermentationRepositoryImpl),
  getFermentationHistoryUseCase:  asClass(GetFermentationHistoryUseCase),
  calculateFermentationUseCase:   asClass(CalculateFermentationUseCase),

  // Monitoring
  monitoringRemoteDataSource: asClass(MonitoringRemoteDataSourceImpl),
  monitoringLocalDataSource:  asClass(MonitoringLocalDataSourceImpl),
  monitoringRepository:       asClass(MonitoringRepositoryImpl),
  getMonitoringDataUseCase:   asClass(GetMonitoringDataUseCase),

  // Notification
  notificationRemoteDataSource: asClass(NotificationRemoteDataSourceImpl),
  notificationLocalDataSource:  asClass(NotificationLocalDataSourceImpl),
  notificationRepository:       asClass(NotificationRepositoryImpl),
  getNotificationsUseCase:      asClass(GetNotificationsUseCase),
  markNotificationReadUseCase:  asClass(MarkNotificationReadUseCase),

  // Onboarding
  onboardingLocalDataSource:  asClass(OnboardingLocalDataSourceImpl),
  onboardingRepository:       asClass(OnboardingRepositoryImpl),
  getOnboardingStepsUseCase:  asClass(GetOnboardingStepsUseCase),
  completeOnboardingUseCase:  asClass(CompleteOnboardingUseCase),

  // Timeline
  timelineRemoteDataSource: asClass(TimelineRemoteDataSourceImpl),
  timelineLocalDataSource:  asClass(TimelineLocalDataSourceImpl),
  timelineRepository:       asClass(TimelineRepositoryImpl),
  getTimelineUseCase:       asClass(GetTimelineUseCase),

  // Analytics
  analyticsRemoteDataSource: asClass(AnalyticsRemoteDataSourceImpl),
  analyticsRepository:       asClass(AnalyticsRepositoryImpl),
  getAnalyticsDataUseCase:   asClass(GetAnalyticsDataUseCase),
});

export default container;
