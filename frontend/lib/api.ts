import { 
  Dataset, 
  DatasetPreview, 
  DatasetProfile, 
  QualityScore, 
  CleaningSuggestion, 
  CleaningLogEntry, 
  CleaningDiffPreview,
  Dashboard,
  DashboardCreate,
  DashboardUpdate, 
  AIInsights, 
  AskDataResponse, 
  Report,
  ForecastResult,
  UserProfileResponse,
  UserProfileUpdateRequest,
  DataExportResponse
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getAuthHeader(): HeadersInit {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("datapilot_token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    ...(getAuthHeader() as Record<string, string>),
    ...(options.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type if uploading FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errJson = await res.json();
      if (typeof errJson.detail === "string") {
        errorDetail = errJson.detail;
      } else if (errJson.detail) {
        errorDetail = JSON.stringify(errJson.detail);
      } else if (errJson.message) {
        errorDetail = typeof errJson.message === "string" ? errJson.message : JSON.stringify(errJson.message);
      } else {
        errorDetail = JSON.stringify(errJson);
      }
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  auth: {
    signup: (data: { email: string; password: string; full_name?: string }) =>
      request<{ access_token: string; user_id: string; email: string; full_name: string }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ access_token: string; user_id: string; email: string; full_name: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: () => request<{ id: string; email: string; full_name: string }>("/auth/me"),
    getProfile: () => request<UserProfileResponse>("/auth/profile"),
    updateProfile: (data: UserProfileUpdateRequest) =>
      request<UserProfileResponse>("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    exportData: () =>
      request<DataExportResponse>("/auth/export-data", {
        method: "POST",
      }),
  },

  datasets: {
    list: () => request<Dataset[]>("/datasets"),
    get: (id: string) => request<Dataset>(`/datasets/${id}`),
    upload: (file: File, name?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (name) formData.append("name", name);
      return request<Dataset>("/datasets/upload", {
        method: "POST",
        body: formData,
      });
    },
    loadDemo: () => request<Dataset>("/datasets/demo", { method: "POST" }),
    preview: (id: string, page = 1, pageSize = 50, search = "", sortBy = "", sortDesc = false) => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append("search", search);
      if (sortBy) {
        params.append("sort_by", sortBy);
        params.append("sort_desc", sortDesc ? "true" : "false");
      }
      return request<DatasetPreview>(`/datasets/${id}/preview?${params.toString()}`);
    },
    profile: (id: string) => request<DatasetProfile>(`/datasets/${id}/profile`),
    quality: (id: string) => request<QualityScore>(`/datasets/${id}/quality`),
    cleaningSuggestions: (id: string) => request<CleaningSuggestion[]>(`/datasets/${id}/cleaning-suggestions`),
    previewClean: (id: string, action: { action_type: string; column?: string; params?: Record<string, any> }) =>
      request<CleaningDiffPreview>(`/datasets/${id}/clean/preview`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    clean: (id: string, actions: any[], versionDescription?: string) =>
      request<{
        success: boolean;
        new_version_number: number;
        rows_before: number;
        rows_after: number;
        columns_before: number;
        columns_after: number;
        operations_performed: string[];
        message: string;
      }>(`/datasets/${id}/clean`, {
        method: "POST",
        body: JSON.stringify({ actions, version_description: versionDescription }),
      }),
    revert: (id: string, targetVersionNumber: number) =>
      request<{
        success: boolean;
        message: string;
        current_version: number;
        row_count: number;
        column_count: number;
      }>(`/datasets/${id}/revert`, {
        method: "POST",
        body: JSON.stringify({ target_version_number: targetVersionNumber }),
      }),
    history: (id: string) => request<CleaningLogEntry[]>(`/datasets/${id}/history`),
    getExportUrl: (id: string, format = "csv", version = "current", multitab = false) => {
      const params = new URLSearchParams({ format, version });
      if (multitab) params.append("multitab", "true");
      return `${API_BASE_URL}/datasets/${id}/export?${params.toString()}`;
    },
    delete: (id: string) => request<{ message: string }>(`/datasets/${id}`, { method: "DELETE" }),
  },

  analysis: {
    get: (datasetId: string) =>
      request<{
        dataset_id: string;
        quality: QualityScore;
        correlations: any;
        outliers: any[];
        eda: any;
        insights: AIInsights;
        intelligence?: any;
        analysis_plan?: any[];
      }>(`/analysis/${datasetId}`),
    refresh: (datasetId: string) =>
      request<{
        dataset_id: string;
        quality: QualityScore;
        correlations: any;
        outliers: any[];
        eda: any;
        insights: AIInsights;
        intelligence?: any;
        analysis_plan?: any[];
      }>(`/analysis/${datasetId}/refresh`, { method: "POST" }),
    regenerateInsights: (datasetId: string, focusPrompt?: string, detailLevel = "brief") =>
      request<AIInsights>(`/analysis/${datasetId}/insights/regenerate`, {
        method: "POST",
        body: JSON.stringify({ focus_prompt: focusPrompt, detail_level: detailLevel }),
      }),
    forecastEligibility: (datasetId: string) =>
      request<{
        is_eligible: boolean;
        reason: string;
        primary_date_column?: string;
        candidate_date_columns: string[];
        candidate_metrics: string[];
        sample_size: number;
        inferred_frequency?: string;
        inferred_frequency_label?: string;
      }>(`/analysis/${datasetId}/forecast/eligibility`),
    forecast: (
      datasetId: string,
      options: {
        date_column?: string;
        metric_column?: string;
        horizon?: string;
        model_type?: string;
      }
    ) =>
      request<ForecastResult>(`/analysis/${datasetId}/forecast`, {
        method: "POST",
        body: JSON.stringify(options),
      }),
  },

  dashboards: {
    getForDataset: (datasetId: string) => request<Dashboard>(`/dashboards/dataset/${datasetId}`),
    listAllForDataset: (datasetId: string) => request<Dashboard[]>(`/dashboards/dataset/${datasetId}/all`),
    getById: (id: string) => request<Dashboard>(`/dashboards/${id}`),
    create: (data: Partial<DashboardCreate>) =>
      request<Dashboard>("/dashboards", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<DashboardUpdate>) =>
      request<Dashboard>(`/dashboards/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    duplicate: (id: string) =>
      request<Dashboard>(`/dashboards/${id}/duplicate`, {
        method: "POST",
      }),
    regenerate: (datasetId: string) =>
      request<Dashboard>(`/dashboards/dataset/${datasetId}/regenerate`, {
        method: "POST",
      }),
    list: () => request<Dashboard[]>("/dashboards"),
    delete: (id: string) => request<{ message: string }>(`/dashboards/${id}`, { method: "DELETE" }),
  },

  askData: {
    ask: (datasetId: string, question: string, conversationId?: string) =>
      request<AskDataResponse>("/ask-data", {
        method: "POST",
        body: JSON.stringify({ dataset_id: datasetId, question, conversation_id: conversationId }),
      }),
    getConversations: (datasetId: string) => request<any[]>(`/ask-data/conversations/${datasetId}`),
  },

  reports: {
    generate: (
      datasetId: string,
      title?: string,
      includeSections?: string[],
      customNotes?: string
    ) =>
      request<Report>("/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          dataset_id: datasetId,
          title,
          include_sections: includeSections,
          custom_notes: customNotes,
        }),
      }),
    list: () => request<Report[]>("/reports"),
    get: (id: string) => request<Report>(`/reports/${id}`),
    getHtmlUrl: (id: string) => `${API_BASE_URL}/reports/${id}/html`,
  },

  relationships: {
    get: () => request<any[]>("/relationships"),
  },
};
