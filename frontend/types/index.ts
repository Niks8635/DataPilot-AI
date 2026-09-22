export interface Dataset {
  id: string;
  user_id: string;
  project_id?: string;
  name: string;
  original_filename: string;
  file_type: string;
  row_count: number;
  column_count: number;
  file_size_bytes: number;
  status: "uploading" | "parsing" | "profiling" | "ready" | "error";
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface ColumnSummary {
  name: string;
  data_type: string;
  inferred_type: "numerical" | "categorical" | "datetime" | "boolean" | "id" | "text";
  semantic_role?: "percentage" | "currency" | "geographic" | "boolean" | "target" | "identifier" | "dimension" | "metric";
  null_count: number;
  null_percentage: number;
  unique_count: number;
  sample_values: any[];
}

export interface DatasetPreview {
  id: string;
  name: string;
  total_rows: number;
  total_columns: number;
  page: number;
  page_size: number;
  total_pages: number;
  columns: ColumnSummary[];
  rows: Record<string, any>[];
}

export interface NumericalStats {
  count: number;
  null_count: number;
  null_percentage: number;
  mean?: number;
  median?: number;
  mode?: number;
  std?: number;
  variance?: number;
  min?: number;
  max?: number;
  q25?: number;
  q75?: number;
  iqr?: number;
  skewness?: number;
  kurtosis?: number;
  outliers_iqr_count: number;
  outliers_zscore_count: number;
  histogram_bins: number[];
  histogram_counts: number[];
}

export interface CategoricalStats {
  count: number;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  is_cardinal: boolean;
  mode?: string;
  top_values: { value: string; count: number; percentage: number }[];
}

export interface DatetimeStats {
  count: number;
  null_count: number;
  null_percentage: number;
  min_date?: string;
  max_date?: string;
  timespan_days?: number;
}

export interface ColumnProfile {
  name: string;
  index: number;
  raw_type: string;
  inferred_type: string;
  semantic_role?: string;
  is_id: boolean;
  is_constant: boolean;
  is_empty: boolean;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  unique_ratio: number;
  numerical_stats?: NumericalStats;
  categorical_stats?: CategoricalStats;
  datetime_stats?: DatetimeStats;
}

export interface DomainInfo {
  domain: string;
  confidence: number;
  matched_indicators: string[];
  description: string;
  recommended_metrics: string[];
  recommended_dimensions: string[];
}

export interface DatasetIntelligence {
  business_domain: DomainInfo;
  primary_date_col?: string;
  all_date_cols: string[];
  target_variable?: string;
  key_dimensions: string[];
  key_metrics: string[];
  id_columns: string[];
  geo_columns: string[];
  category_columns: string[];
  entity_column?: string;
}

export interface DatasetProfile {
  dataset_id: string;
  row_count: number;
  column_count: number;
  file_size_bytes: number;
  memory_usage_bytes: number;
  duplicate_rows_count: number;
  duplicate_rows_percentage: number;
  total_missing_values: number;
  overall_missing_percentage: number;
  columns: ColumnProfile[];
  column_types_breakdown: Record<string, number>;
  semantic_roles_breakdown?: Record<string, number>;
  intelligence?: DatasetIntelligence;
  domain_info?: DomainInfo;
}

export interface QualityIssue {
  type: string;
  column?: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  impact_count: number;
  score_deduction: number;
}

export interface QualityScore {
  overall_score: number;
  grade: string;
  summary_badges: string[];
  structural_health: number;
  completeness_score: number;
  uniqueness_score: number;
  consistency_score: number;
  issues: QualityIssue[];
}

export interface CleaningSuggestion {
  id: string;
  column?: string;
  action_type: string;
  title: string;
  description: string;
  impact_estimate: string;
  suggested_params: Record<string, any>;
  severity: "critical" | "warning" | "info";
}

export interface CleaningLogEntry {
  id: string;
  operation_type: string;
  summary: string;
  affected_rows: number;
  created_at: string;
  parameters?: Record<string, any>;
}

export interface ChangedCell {
  row_idx: number;
  column: string;
  old_value: any;
  new_value: any;
}

export interface MetricsDiff {
  rows_before: number;
  rows_after: number;
  columns_before: number;
  columns_after: number;
  nulls_before: number;
  nulls_after: number;
  memory_before: number;
  memory_after: number;
}

export interface CleaningDiffPreview {
  success: boolean;
  operation_type: string;
  column?: string;
  summary: string;
  affected_rows_count: number;
  sample_before: Record<string, any>[];
  sample_after: Record<string, any>[];
  changed_cells: ChangedCell[];
  metrics_diff: MetricsDiff;
}

export interface ChartConfig {
  chart_id: string;
  chart_type: "bar" | "horizontal_bar" | "line" | "area" | "pie" | "donut" | "scatter" | "histogram";
  title: string;
  subtitle?: string;
  x_axis_title?: string;
  y_axis_title?: string;
  x_data?: any[];
  y_data?: any[];
  series?: { name: string; data: any[] }[];
  summary_text?: string;
}

export interface KPICardData {
  id: string;
  label: string;
  value: string | number;
  formatted_value: string;
  change_percentage?: number;
  subtext?: string;
  trend_direction?: "up" | "down" | "neutral";
  icon_name?: string;
}

export interface TableWidgetConfig {
  columns: string[];
  page_size: number;
  sort_by?: string;
  sort_desc?: boolean;
  show_totals?: boolean;
}

export interface SlicerWidgetConfig {
  column: string;
  multi_select: boolean;
  selected_values: string[];
  available_values?: string[];
}

export interface DateFilterWidgetConfig {
  date_col: string;
  preset: string; // all, 7d, 30d, 90d, ytd, custom
  start_date?: string;
  end_date?: string;
}

export interface DashboardWidget {
  id: string;
  widget_type: "kpi" | "chart" | "table" | "slicer" | "date_filter";
  title: string;
  subtitle?: string;
  page_id?: string;
  kpi_data?: KPICardData;
  chart_config?: ChartConfig;
  table_config?: TableWidgetConfig;
  slicer_config?: SlicerWidgetConfig;
  date_filter_config?: DateFilterWidgetConfig;
  color_palette?: "blue" | "emerald" | "violet" | "amber" | "rose" | "monochrome" | string;
  grid_w: number;
  grid_h: number;
}

export interface DashboardPage {
  id: string;
  title: string;
  description?: string;
  widget_ids: string[];
  local_filters?: Record<string, any>;
}

export interface DashboardLayoutConfig {
  theme: "dark" | "light";
  active_page_id: string;
  pages: DashboardPage[];
  global_filters?: Record<string, any>;
}

export interface Dashboard {
  id: string;
  dataset_id: string;
  user_id?: string;
  title: string;
  description?: string;
  is_default: boolean;
  layout_config?: DashboardLayoutConfig;
  widgets: DashboardWidget[];
  created_at: string;
  updated_at: string;
}

export interface DashboardCreate {
  dataset_id: string;
  title: string;
  description?: string;
  is_default?: boolean;
  layout_config?: DashboardLayoutConfig;
  widgets: DashboardWidget[];
}

export interface DashboardUpdate {
  title?: string;
  description?: string;
  is_default?: boolean;
  layout_config?: DashboardLayoutConfig;
  widgets?: DashboardWidget[];
}

export interface StructuredInsightItem {
  title: string;
  type: "finding" | "trend" | "anomaly" | "opportunity" | "risk" | "recommendation";
  description: string;
  metric: string;
  value: string | number;
  comparison: string;
  severity: "critical" | "warning" | "positive" | "neutral";
  source_columns: string[];
  calculation_reference: string;
}

export interface AIInsights {
  executive_summary: string;
  key_insights: string[];
  trends: string[];
  anomalies: string[];
  business_recommendations: string[];
  potential_questions: string[];
  structured_insights?: StructuredInsightItem[];
  detail_level?: "brief" | "deep";
  focus_prompt?: string;
}

export interface AnalysisPlanStep {
  step_number: number;
  name: string;
  status: "completed" | "in_progress" | "pending";
  description: string;
  execution_time_ms: number;
}

export interface ForecastPoint {
  date: string;
  actual?: number | null;
  forecast?: number | null;
  lower_bound?: number | null;
  upper_bound?: number | null;
}

export interface ForecastMetrics {
  mape: number;
  rmse: number;
  trend_direction: "upward" | "downward" | "stable";
  forecast_growth_percentage: number;
  current_value: number;
  projected_value: number;
}

export interface ForecastResult {
  dataset_id?: string;
  date_column: string;
  metric_column: string;
  horizon: string;
  periods_forecasted: number;
  frequency: string;
  frequency_label: string;
  model_name: string;
  metrics: ForecastMetrics;
  narrative: string;
  disclaimer: string;
  chart_points: ForecastPoint[];
}

export interface AskDataResponse {
  conversation_id: string;
  message_id: string;
  question: string;
  answer_text: string;
  confidence_score: number;
  analysis_steps: { step_number: number; description: string; operation: string }[];
  executed_code?: string;
  tabular_result?: Record<string, any>[];
  result_columns?: string[];
  chart_config?: ChartConfig;
  suggestions: string[];
  queried_columns?: string[];
  filter_explanation?: string;
  calculation_details?: Record<string, any>;
}

export interface Report {
  id: string;
  dataset_id: string;
  title: string;
  summary?: string;
  content: Record<string, any>;
  html_content?: string;
  format: string;
  created_at: string;
}

export interface UserProfileStats {
  total_datasets: number;
  total_rows: number;
  total_columns: number;
  total_storage_bytes: number;
  storage_quota_bytes: number;
  total_dashboards: number;
  total_reports: number;
  total_ai_queries: number;
  avg_quality_score: number;
}

export interface UserDatasetSummary {
  id: string;
  name: string;
  file_type: string;
  row_count: number;
  column_count: number;
  file_size_bytes: number;
  current_version: number;
  quality_score: number;
  created_at?: string;
}

export interface UserActivityItem {
  id: string;
  title: string;
  description: string;
  type: string;
  timestamp: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  full_name: string;
  organization: string;
  role: string;
  tier: string;
  created_at: string;
  api_key: string;
  stats: UserProfileStats;
  datasets: UserDatasetSummary[];
  recent_activity: UserActivityItem[];
  security: {
    ast_sandbox: string;
    encryption: string;
    air_gapped_os: boolean;
    zero_retention_training: boolean;
    session_valid: boolean;
  };
}

export interface UserProfileUpdateRequest {
  full_name?: string;
  organization?: string;
  role?: string;
}

export interface DataExportResponse {
  exported_at: string;
  user: Record<string, any>;
  stats: Record<string, any>;
  datasets: Record<string, any>[];
  dashboards: Record<string, any>[];
  reports: Record<string, any>[];
}

