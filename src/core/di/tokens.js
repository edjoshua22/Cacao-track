/**
 * @file tokens.js
 * @description String constant tokens used by the awilix DI container.
 * Using constants prevents typos when resolving dependencies.
 */

// ── Core ──────────────────────────────────────────────────────────────────────
export const TOKENS = {
  // Core services
  HTTP_CLIENT:     'httpClient',
  STORAGE_SERVICE: 'storageService',
  AUTH_SERVICE:    'authService',
  JSON_SERIALIZER: 'jsonSerializer',

  // ── Batch ─────────────────────────────────────────────────────────────────
  BATCH_REMOTE_DATA_SOURCE:  'batchRemoteDataSource',
  BATCH_LOCAL_DATA_SOURCE:   'batchLocalDataSource',
  BATCH_REPOSITORY:          'batchRepository',
  GET_BATCHES_USE_CASE:      'getBatchesUseCase',
  GET_BATCH_DETAIL_USE_CASE: 'getBatchDetailUseCase',
  CREATE_BATCH_USE_CASE:     'createBatchUseCase',
  INFER_BATCH_IMAGE_USE_CASE:'inferBatchImageUseCase',
  EXPORT_BATCH_IMAGE_USE_CASE:'exportBatchImageUseCase',

  // ── Fermentation ─────────────────────────────────────────────────────────
  FERMENTATION_REMOTE_DATA_SOURCE:     'fermentationRemoteDataSource',
  FERMENTATION_LOCAL_DATA_SOURCE:      'fermentationLocalDataSource',
  FERMENTATION_REPOSITORY:             'fermentationRepository',
  GET_FERMENTATION_HISTORY_USE_CASE:   'getFermentationHistoryUseCase',
  CALCULATE_FERMENTATION_USE_CASE:     'calculateFermentationUseCase',

  // ── Monitoring ────────────────────────────────────────────────────────────
  MONITORING_REMOTE_DATA_SOURCE: 'monitoringRemoteDataSource',
  MONITORING_LOCAL_DATA_SOURCE:  'monitoringLocalDataSource',
  MONITORING_REPOSITORY:         'monitoringRepository',
  GET_MONITORING_DATA_USE_CASE:  'getMonitoringDataUseCase',

  // ── Notification ──────────────────────────────────────────────────────────
  NOTIFICATION_REMOTE_DATA_SOURCE:    'notificationRemoteDataSource',
  NOTIFICATION_LOCAL_DATA_SOURCE:     'notificationLocalDataSource',
  NOTIFICATION_REPOSITORY:            'notificationRepository',
  GET_NOTIFICATIONS_USE_CASE:         'getNotificationsUseCase',
  MARK_NOTIFICATION_READ_USE_CASE:    'markNotificationReadUseCase',

  // ── Onboarding ────────────────────────────────────────────────────────────
  ONBOARDING_LOCAL_DATA_SOURCE:      'onboardingLocalDataSource',
  ONBOARDING_REPOSITORY:             'onboardingRepository',
  GET_ONBOARDING_STEPS_USE_CASE:     'getOnboardingStepsUseCase',
  COMPLETE_ONBOARDING_USE_CASE:      'completeOnboardingUseCase',

  // ── Timeline ──────────────────────────────────────────────────────────────
  TIMELINE_REMOTE_DATA_SOURCE: 'timelineRemoteDataSource',
  TIMELINE_LOCAL_DATA_SOURCE:  'timelineLocalDataSource',
  TIMELINE_REPOSITORY:         'timelineRepository',
  GET_TIMELINE_USE_CASE:       'getTimelineUseCase',
};
