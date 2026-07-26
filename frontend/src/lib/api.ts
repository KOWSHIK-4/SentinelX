export { api, clearApiCache, clearCacheForPattern } from './client';
export type { ApiOptions } from './client';

export { authApi } from './auth';
export type { AuthResponseData, ProfileResponseData } from './auth';

export { incidentApi } from './incidents';
export type {
  Incident, IncidentUser, PaginationInfo,
  IncidentListResponse, IncidentResponse,
  DashboardStats, DashboardStatsResponse,
} from './incidents';

export { assetApi } from './assets';
export type {
  Asset, AssetListResponse, AssetResponse, AssetDetailResponse,
  AssetDashboardStats, AssetDashboardStatsResponse,
} from './assets';

export { analyticsApi } from './analytics';
export type {
  AnalyticsOverview, AnalyticsOverviewResponse,
  AnalyticsIncidents, AnalyticsIncidentsResponse,
  AnalyticsAssets, AnalyticsAssetsResponse,
  AnalyticsTrends, AnalyticsTrendsResponse,
  SeverityDistribution, StatusDistribution,
  AssetsByType, TopAffectedAsset,
  TrendDataPoint, RecentActivityItem,
} from './analytics';

export { reportsApi } from './reports';
export type {
  ReportFilters, SeverityBreakdown, StatusBreakdown,
  AssetTypeBreakdown, CriticalityBreakdown,
  IncidentsReport, AssetsReport, SummaryReport,
  ReportsIncidentsResponse, ReportsAssetsResponse,
  ReportsSummaryResponse, ExportResponse,
} from './reports';

export { notificationApi } from './notifications';
export type { Notification, NotificationListResponse, NotificationResponse, DeleteResponse } from './notifications';

export { auditApi } from './audit';
export type { AuditLog, AuditListResponse, AuditResponse, AuditDeleteResponse } from './audit';

export { settingsApi } from './settings';
export type { SettingsData, SettingsResponse, SystemInfo, SystemInfoResponse, LogoUploadResponse } from './settings';

export { teamApi } from './users';
export type { TeamMember, TeamListResponse, TeamMemberResponse } from './users';
