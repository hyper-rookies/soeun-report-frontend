export type { DashboardSummaryResponse } from '@/services/api'

export interface AdCostCardProps {
  title: string;
  value: string;
  changeRate?: number;
  changeLabel?: string;
  valueSizeClass?: string;
}

export interface MediaPieData {
  name: string;
  value: number;
  color?: string;
}

export interface ConversionLineData {
  date: string;
  conversions: number;
  clicks?: number;
}
