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
import { 
  DEMO_DATASETS, 
  getDemoPreview, 
  getDemoProfile, 
  getDemoQuality, 
  getDemoSuggestions, 
  getDemoPreviewClean, 
  getDemoAnalysis, 
  getDemoForecast, 
  getDemoDashboard, 
  getDemoAskDataAnswer, 
  getDemoRelationships, 
  getDemoReports 
} from "@/lib/demoDatasets";

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
    list: async (): Promise<Dataset[]> => {
      try {
        const res = await request<Dataset[]>("/datasets");
        if (Array.isArray(res) && res.length > 0) {
          const customOnly = res.filter((d) => !d.id.startsWith("demo-ds-"));
          return [...customOnly, ...DEMO_DATASETS];
        }
      } catch (err) {
        // Fallback to rich pre-configured demo datasets on standalone deployments
      }
      return DEMO_DATASETS;
    },
    get: async (id: string): Promise<Dataset> => {
      const demo = DEMO_DATASETS.find((d) => d.id === id);
      if (demo) return demo;
      try {
        return await request<Dataset>(`/datasets/${id}`);
      } catch (err) {
        if (demo) return demo;
        return DEMO_DATASETS[0];
      }
    },
    upload: (file: File, name?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (name) formData.append("name", name);
      return request<Dataset>("/datasets/upload", {
        method: "POST",
        body: formData,
      });
    },
    loadDemo: async (demoType = "sales"): Promise<Dataset> => {
      try {
        return await request<Dataset>(`/datasets/demo?type=${demoType}`, { method: "POST" });
      } catch {
        if (demoType === "saas") return DEMO_DATASETS[1];
        if (demoType === "clinical") return DEMO_DATASETS[2];
        return DEMO_DATASETS[0];
      }
    },
    preview: async (id: string, page = 1, pageSize = 50, search = "", sortBy = "", sortDesc = false): Promise<DatasetPreview> => {
      if (id.startsWith("demo-ds-")) {
        return getDemoPreview(id, page, pageSize, search, sortBy, sortDesc);
      }
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: pageSize.toString(),
        });
        if (search) params.append("search", search);
        if (sortBy) {
          params.append("sort_by", sortBy);
          params.append("sort_desc", sortDesc ? "true" : "false");
        }
        return await request<DatasetPreview>(`/datasets/${id}/preview?${params.toString()}`);
      } catch {
        return getDemoPreview(id, page, pageSize, search, sortBy, sortDesc);
      }
    },
    profile: async (id: string): Promise<DatasetProfile> => {
      if (id.startsWith("demo-ds-")) {
        return getDemoProfile(id);
      }
      try {
        return await request<DatasetProfile>(`/datasets/${id}/profile`);
      } catch {
        return getDemoProfile(id);
      }
    },
    quality: async (id: string): Promise<QualityScore> => {
      if (id.startsWith("demo-ds-")) {
        return getDemoQuality(id);
      }
      try {
        return await request<QualityScore>(`/datasets/${id}/quality`);
      } catch {
        return getDemoQuality(id);
      }
    },
    cleaningSuggestions: async (id: string): Promise<CleaningSuggestion[]> => {
      if (id.startsWith("demo-ds-")) {
        return getDemoSuggestions(id);
      }
      try {
        return await request<CleaningSuggestion[]>(`/datasets/${id}/cleaning-suggestions`);
      } catch {
        return getDemoSuggestions(id);
      }
    },
    previewClean: async (id: string, action: { action_type: string; column?: string; params?: Record<string, any> }): Promise<CleaningDiffPreview> => {
      if (id.startsWith("demo-ds-")) {
        return getDemoPreviewClean(id, action);
      }
      try {
        return await request<CleaningDiffPreview>(`/datasets/${id}/clean/preview`, {
          method: "POST",
          body: JSON.stringify({ action }),
        });
      } catch {
        return getDemoPreviewClean(id, action);
      }
    },
    clean: async (id: string, actions: any[], versionDescription?: string) => {
      if (id.startsWith("demo-ds-")) {
        return {
          success: true,
          new_version_number: 2,
          rows_before: id === "demo-ds-sales" ? 1200 : id === "demo-ds-saas" ? 850 : 500,
          rows_after: id === "demo-ds-sales" ? 1197 : id === "demo-ds-saas" ? 850 : 500,
          columns_before: 12,
          columns_after: 12,
          operations_performed: actions.map((a) => `${a.action_type} on ${a.column || "all"}`),
          message: "Data cleaned successfully and new version recorded.",
        };
      }
      return request<{
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
      });
    },
    revert: async (id: string, targetVersionNumber: number) => {
      if (id.startsWith("demo-ds-")) {
        return {
          success: true,
          message: `Reverted to version ${targetVersionNumber}`,
          current_version: targetVersionNumber,
          row_count: id === "demo-ds-sales" ? 1200 : id === "demo-ds-saas" ? 850 : 500,
          column_count: 12,
        };
      }
      return request<{
        success: boolean;
        message: string;
        current_version: number;
        row_count: number;
        column_count: number;
      }>(`/datasets/${id}/revert`, {
        method: "POST",
        body: JSON.stringify({ target_version_number: targetVersionNumber }),
      });
    },
    history: async (id: string): Promise<CleaningLogEntry[]> => {
      if (id.startsWith("demo-ds-")) {
        return [
          {
            id: "hist_1",
            operation_type: "initial_upload",
            summary: "Original ingestion, deterministic typing, and AST profiling pass",
            affected_rows: 1200,
            created_at: "2026-09-20T10:00:00Z",
          },
        ];
      }
      try {
        return await request<CleaningLogEntry[]>(`/datasets/${id}/history`);
      } catch {
        return [];
      }
    },
    getExportUrl: (id: string, format = "csv", version = "current", multitab = false) => {
      const params = new URLSearchParams({ format, version });
      if (multitab) params.append("multitab", "true");
      return `${API_BASE_URL}/datasets/${id}/export?${params.toString()}`;
    },
    delete: async (id: string) => {
      if (id.startsWith("demo-ds-")) {
        return { message: "Demo dataset reset successfully" };
      }
      return request<{ message: string }>(`/datasets/${id}`, { method: "DELETE" });
    },
  },

  analysis: {
    get: async (datasetId: string) => {
      if (datasetId.startsWith("demo-ds-")) {
        return getDemoAnalysis(datasetId);
      }
      try {
        return await request<any>(`/analysis/${datasetId}`);
      } catch {
        return getDemoAnalysis(datasetId);
      }
    },
    refresh: async (datasetId: string) => {
      if (datasetId.startsWith("demo-ds-")) {
        return getDemoAnalysis(datasetId);
      }
      try {
        return await request<any>(`/analysis/${datasetId}/refresh`, { method: "POST" });
      } catch {
        return getDemoAnalysis(datasetId);
      }
    },
    regenerateInsights: async (datasetId: string, focusPrompt?: string, detailLevel = "brief") => {
      if (datasetId.startsWith("demo-ds-")) {
        const base = getDemoAnalysis(datasetId).insights;
        return {
          ...base,
          focus_prompt: focusPrompt,
          detail_level: detailLevel as any,
          executive_summary: focusPrompt 
            ? `Refined analysis for prompt: "${focusPrompt}". ${base.executive_summary}`
            : base.executive_summary,
        };
      }
      try {
        return await request<AIInsights>(`/analysis/${datasetId}/insights/regenerate`, {
          method: "POST",
          body: JSON.stringify({ focus_prompt: focusPrompt, detail_level: detailLevel }),
        });
      } catch {
        return getDemoAnalysis(datasetId).insights;
      }
    },
    forecastEligibility: async (datasetId: string) => {
      if (datasetId.startsWith("demo-ds-")) {
        const isSaas = datasetId === "demo-ds-saas";
        const isClinical = datasetId === "demo-ds-clinical";
        return {
          is_eligible: true,
          reason: "Continuous temporal column detected",
          primary_date_column: isClinical ? "Admission_Date" : isSaas ? "Signup_Date" : "Order_Date",
          candidate_date_columns: [isClinical ? "Admission_Date" : isSaas ? "Signup_Date" : "Order_Date"],
          candidate_metrics: isClinical ? ["Efficacy_Score", "Systolic_BP"] : isSaas ? ["MRR", "Active_Seats"] : ["Revenue", "Net_Profit", "Units_Sold"],
          sample_size: 60,
          inferred_frequency: "M",
          inferred_frequency_label: "Monthly",
        };
      }
      try {
        return await request<{
          is_eligible: boolean;
          reason: string;
          primary_date_column?: string;
          candidate_date_columns: string[];
          candidate_metrics: string[];
          sample_size: number;
          inferred_frequency?: string;
          inferred_frequency_label?: string;
        }>(`/analysis/${datasetId}/forecast/eligibility`);
      } catch {
        return {
          is_eligible: true,
          reason: "Continuous temporal column detected",
          primary_date_column: "Order_Date",
          candidate_date_columns: ["Order_Date"],
          candidate_metrics: ["Revenue", "Net_Profit"],
          sample_size: 60,
          inferred_frequency: "M",
          inferred_frequency_label: "Monthly",
        };
      }
    },
    forecast: async (
      datasetId: string,
      options: {
        date_column?: string;
        metric_column?: string;
        horizon?: string;
        model_type?: string;
      }
    ) => {
      if (datasetId.startsWith("demo-ds-")) {
        return getDemoForecast(datasetId);
      }
      try {
        return await request<ForecastResult>(`/analysis/${datasetId}/forecast`, {
          method: "POST",
          body: JSON.stringify(options),
        });
      } catch {
        return getDemoForecast(datasetId);
      }
    },
  },

  dashboards: {
    getForDataset: async (datasetId: string): Promise<Dashboard> => {
      if (datasetId.startsWith("demo-ds-")) {
        return getDemoDashboard(datasetId);
      }
      try {
        return await request<Dashboard>(`/dashboards/dataset/${datasetId}`);
      } catch {
        return getDemoDashboard(datasetId);
      }
    },
    listAllForDataset: async (datasetId: string): Promise<Dashboard[]> => {
      if (datasetId.startsWith("demo-ds-")) {
        return [getDemoDashboard(datasetId)];
      }
      try {
        return await request<Dashboard[]>(`/dashboards/dataset/${datasetId}/all`);
      } catch {
        return [getDemoDashboard(datasetId)];
      }
    },
    getById: async (id: string): Promise<Dashboard> => {
      if (id.includes("saas")) return getDemoDashboard("demo-ds-saas");
      if (id.includes("clinical")) return getDemoDashboard("demo-ds-clinical");
      if (id.includes("sales") || id.startsWith("dash-demo")) return getDemoDashboard("demo-ds-sales");
      try {
        return await request<Dashboard>(`/dashboards/${id}`);
      } catch {
        return getDemoDashboard("demo-ds-sales");
      }
    },
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
    regenerate: async (datasetId: string) => {
      if (datasetId.startsWith("demo-ds-")) {
        return getDemoDashboard(datasetId);
      }
      try {
        return await request<Dashboard>(`/dashboards/dataset/${datasetId}/regenerate`, {
          method: "POST",
        });
      } catch {
        return getDemoDashboard(datasetId);
      }
    },
    list: async (): Promise<Dashboard[]> => {
      try {
        const list = await request<Dashboard[]>("/dashboards");
        if (Array.isArray(list) && list.length > 0) return list;
      } catch {}
      return DEMO_DATASETS.map((d) => getDemoDashboard(d.id));
    },
    delete: (id: string) => request<{ message: string }>(`/dashboards/${id}`, { method: "DELETE" }),
  },

  askData: {
    ask: async (datasetId: string, question: string, conversationId?: string): Promise<AskDataResponse> => {
      if (datasetId.startsWith("demo-ds-")) {
        return getDemoAskDataAnswer(datasetId, question);
      }
      try {
        return await request<AskDataResponse>("/ask-data", {
          method: "POST",
          body: JSON.stringify({ dataset_id: datasetId, question, conversation_id: conversationId }),
        });
      } catch {
        return getDemoAskDataAnswer(datasetId, question);
      }
    },
    getConversations: async (datasetId: string) => {
      try {
        return await request<any[]>(`/ask-data/conversations/${datasetId}`);
      } catch {
        return [];
      }
    },
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
    list: async (): Promise<Report[]> => {
      try {
        const list = await request<Report[]>("/reports");
        if (Array.isArray(list) && list.length > 0) return list;
      } catch {}
      return getDemoReports();
    },
    get: async (id: string): Promise<Report> => {
      try {
        return await request<Report>(`/reports/${id}`);
      } catch {
        const rep = getDemoReports().find((r) => r.id === id);
        return rep || getDemoReports()[0];
      }
    },
    getHtmlUrl: (id: string) => `${API_BASE_URL}/reports/${id}/html`,
  },

  relationships: {
    get: async () => {
      try {
        const rels = await request<any[]>("/relationships");
        if (Array.isArray(rels) && rels.length > 0) return rels;
      } catch {}
      return getDemoRelationships();
    },
  },
};
