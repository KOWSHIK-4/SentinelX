import { api } from './client';

export interface AnalyticsOverview {
  totalIncidents: number;
  openIncidents: number;
  inProgressIncidents: number;
  resolvedIncidents: number;
  closedIncidents: number;
  criticalIncidents: number;
  highIncidents: number;
  mediumIncidents: number;
  lowIncidents: number;
  totalAssets: number;
  activeAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
  criticalAssets: number;
  totalUsers: number;
}

export interface AnalyticsOverviewResponse {
  success: boolean;
  data: AnalyticsOverview;
}

export interface SeverityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface StatusDistribution {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface AnalyticsIncidents {
  severityDistribution: SeverityDistribution;
  statusDistribution: StatusDistribution;
}

export interface AnalyticsIncidentsResponse {
  success: boolean;
  data: AnalyticsIncidents;
}

export interface AssetsByType {
  server: number;
  workstation: number;
  laptop: number;
  firewall: number;
  switch: number;
  router: number;
  cloud_vm: number;
  database: number;
  other: number;
}

export interface TopAffectedAsset {
  id: string;
  assetName: string;
  assetType: string;
  ipAddress: string | null;
  criticality: string;
  status: string;
  location: string | null;
  incidentCount: number;
}

export interface AnalyticsAssets {
  assetsByType: AssetsByType;
  topAffectedAssets: TopAffectedAsset[];
}

export interface AnalyticsAssetsResponse {
  success: boolean;
  data: AnalyticsAssets;
}

export interface TrendDataPoint {
  month: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AnalyticsTrends {
  trend: TrendDataPoint[];
  recentActivity: RecentActivityItem[];
}

export interface AnalyticsTrendsResponse {
  success: boolean;
  data: AnalyticsTrends;
}

export const analyticsApi = {
  getOverview: () =>
    api<AnalyticsOverviewResponse>('/analytics/overview', { cacheTTL: 30000 }),

  getIncidents: () =>
    api<AnalyticsIncidentsResponse>('/analytics/incidents', { cacheTTL: 30000 }),

  getAssets: () =>
    api<AnalyticsAssetsResponse>('/analytics/assets', { cacheTTL: 30000 }),

  getTrends: () =>
    api<AnalyticsTrendsResponse>('/analytics/trends', { cacheTTL: 30000 }),
};
