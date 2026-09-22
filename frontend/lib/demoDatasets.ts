import { 
  Dataset, 
  DatasetPreview, 
  DatasetProfile, 
  QualityScore, 
  CleaningSuggestion, 
  CleaningDiffPreview, 
  AIInsights, 
  ForecastResult, 
  Dashboard, 
  AskDataResponse, 
  Report 
} from "@/types";
import { processClientAskDataQuery } from "./askDataEngine";

// ==========================================
// 1. DATASET DEFINITIONS (3 Rich Demo Datasets)
// ==========================================

export const DEMO_DATASETS: Dataset[] = [
  {
    id: "demo-ds-sales",
    user_id: "demo_user",
    name: "Global E-Commerce & Retail Sales",
    original_filename: "ecommerce_sales_q3.csv",
    file_type: "csv",
    row_count: 1200,
    column_count: 12,
    file_size_bytes: 142580,
    status: "ready",
    current_version: 1,
    created_at: "2026-09-15T10:30:00Z",
    updated_at: "2026-09-22T18:45:00Z",
  },
  {
    id: "demo-ds-saas",
    user_id: "demo_user",
    name: "SaaS Subscriptions & Churn Analytics",
    original_filename: "saas_churn_telemetry.parquet",
    file_type: "parquet",
    row_count: 850,
    column_count: 11,
    file_size_bytes: 98400,
    status: "ready",
    current_version: 1,
    created_at: "2026-09-18T14:15:00Z",
    updated_at: "2026-09-22T19:10:00Z",
  },
  {
    id: "demo-ds-clinical",
    user_id: "demo_user",
    name: "Healthcare Clinical Trial & Patient Vitals",
    original_filename: "clinical_patient_metrics.json",
    file_type: "json",
    row_count: 500,
    column_count: 12,
    file_size_bytes: 76200,
    status: "ready",
    current_version: 1,
    created_at: "2026-09-20T09:00:00Z",
    updated_at: "2026-09-22T19:20:00Z",
  },
];

// Helper: Seeded pseudo-random generator
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ==========================================
// 2. REALISTIC ROW GENERATORS
// ==========================================

// --- E-Commerce Sales Rows (60 realistic sample rows for data grid & aggregations) ---
export function generateSalesRows(): Record<string, any>[] {
  const rng = createSeededRandom(101);
  const categories = [
    { cat: "Technology", prods: ["Pro Laptop 15", "Ultra-Wide Monitor 34", "USB-C Multi-Dock", "Fast Wireless Charger", "Noise-Canceling Pro"], minP: 180, maxP: 1650 },
    { cat: "Office Supplies", prods: ["Ergonomic Desk Chair", "Adjustable Standing Desk", "High-Yield Toner", "Heavy-Duty Paper Shredder"], minP: 35, maxP: 580 },
    { cat: "Cloud Subscriptions", prods: ["Enterprise Security Suite", "Cloud Storage 10TB", "API Gateway Pro", "Dedicated VPC Access"], minP: 99, maxP: 1200 },
    { cat: "Furniture", prods: ["Executive Leather Chair", "Modular Bookshelf", "Conference Table 8ft", "Ergonomic Footrest"], minP: 65, maxP: 850 }
  ];
  const regions = ["North America", "EMEA", "APAC", "LATAM"];
  const segments = ["Enterprise", "Mid-Market", "Consumer", "Small Business"];

  const rows: Record<string, any>[] = [];
  for (let i = 1; i <= 60; i++) {
    const cObj = categories[Math.floor(rng() * categories.length)];
    const product = cObj.prods[Math.floor(rng() * cObj.prods.length)];
    const region = rng() > 0.05 ? regions[Math.floor(rng() * regions.length)] : null; // occasional null for cleaning demo
    const segment = segments[Math.floor(rng() * segments.length)];
    const units = Math.floor(rng() * 14) + 1;
    const price = Math.round((cObj.minP + rng() * (cObj.maxP - cObj.minP)) * 100) / 100;
    const discount = Math.round(rng() * 15) / 100;
    const revenue = Math.round(units * price * (1 - discount) * 100) / 100;
    const margin = Math.round((0.22 + rng() * 0.28) * 100) / 100;
    const profit = Math.round(revenue * margin * 100) / 100;
    const rating = rng() > 0.04 ? Math.round((3.2 + rng() * 1.8) * 10) / 10 : null; // occasional null

    const m = Math.floor(rng() * 12) + 1;
    const d = Math.floor(rng() * 28) + 1;
    const dateStr = `2023-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;

    rows.push({
      Order_ID: `ORD-982${i.toString().padStart(3, "0")}`,
      Order_Date: dateStr,
      Customer_Segment: segment,
      Region: region,
      Product_Category: cObj.cat,
      Product_Name: product,
      Units_Sold: units,
      Unit_Price: price,
      Revenue: revenue,
      Discount_Rate: discount,
      Net_Profit: profit,
      Customer_Rating: rating,
    });
  }
  return rows;
}

// --- SaaS Churn Rows (60 realistic sample rows) ---
export function generateSaaSRows(): Record<string, any>[] {
  const rng = createSeededRandom(202);
  const plans = [
    { name: "Starter", minMRR: 99, maxMRR: 299 },
    { name: "Growth", minMRR: 499, maxMRR: 999 },
    { name: "Enterprise", minMRR: 1499, maxMRR: 3500 },
    { name: "Dedicated Scale", minMRR: 4000, maxMRR: 8500 },
  ];
  const freqs = ["Daily", "Weekly", "Bi-Weekly", "Monthly"];
  const payments = ["Credit Card", "ACH Wire", "Annual Invoice"];

  const rows: Record<string, any>[] = [];
  for (let i = 1; i <= 60; i++) {
    const pObj = plans[Math.floor(rng() * plans.length)];
    const mrr = Math.round((pObj.minMRR + rng() * (pObj.maxMRR - pObj.minMRR)) * 100) / 100;
    const seats = Math.floor(rng() * 45) + (pObj.name === "Enterprise" ? 30 : 3);
    const freq = freqs[Math.floor(rng() * freqs.length)];
    const tickets = Math.floor(rng() * 8);
    const nps = rng() > 0.06 ? Math.floor(rng() * 6) + 5 : null; // occasional null for cleaning
    const pay = payments[Math.floor(rng() * payments.length)];
    
    // Calculate realistic churn risk
    let risk = 0.12;
    if (tickets > 4) risk += 0.35;
    if (nps && nps < 7) risk += 0.25;
    if (pObj.name === "Starter") risk += 0.15;
    risk = Math.min(0.95, Math.max(0.04, Math.round(risk * 100) / 100));

    let status = "Active";
    if (risk > 0.65) status = "At-Risk";
    if (risk > 0.85 && rng() > 0.4) status = "Churned";

    const m = Math.floor(rng() * 12) + 1;
    const d = Math.floor(rng() * 28) + 1;
    const dateStr = `2023-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;

    rows.push({
      Account_ID: `ACC-409${i.toString().padStart(3, "0")}`,
      Signup_Date: dateStr,
      Subscription_Plan: pObj.name,
      MRR: mrr,
      Active_Seats: seats,
      Usage_Frequency: freq,
      Support_Tickets: tickets,
      NPS_Score: nps,
      Payment_Method: pay,
      Churn_Risk_Score: risk,
      Account_Status: status,
    });
  }
  return rows;
}

// --- Healthcare Patient Vitals Rows (60 realistic sample rows) ---
export function generateClinicalRows(): Record<string, any>[] {
  const rng = createSeededRandom(303);
  const cohorts = ["Cohort A (Dosage 50mg)", "Cohort B (Dosage 100mg)", "Placebo Control"];
  const genders = ["Female", "Male", "Other"];
  const adverse = ["None", "None", "None", "Mild Fatigue", "Headache", "Nausea"];

  const rows: Record<string, any>[] = [];
  for (let i = 1; i <= 60; i++) {
    const age = Math.floor(24 + rng() * 56);
    const gender = genders[Math.floor(rng() * genders.length)];
    const cohort = cohorts[Math.floor(rng() * cohorts.length)];
    const sys = Math.round(110 + rng() * 55);
    const dia = Math.round(70 + rng() * 32);
    const chol = Math.round(155 + rng() * 110);
    const bmi = rng() > 0.04 ? Math.round((20.2 + rng() * 15.5) * 10) / 10 : null; // occasional null
    
    // Efficacy depends realistically on cohort dosage
    let eff = cohort.includes("100mg") ? (72 + rng() * 25) : cohort.includes("50mg") ? (58 + rng() * 26) : (25 + rng() * 30);
    eff = Math.min(99.4, Math.max(15.0, Math.round(eff * 10) / 10));

    const adv = cohort === "Placebo Control" ? "None" : adverse[Math.floor(rng() * adverse.length)];
    let outcome = "Stable Control";
    if (eff >= 75) outcome = "Significant Improvement";
    else if (eff >= 50) outcome = "Moderate Response";

    const m = Math.floor(rng() * 10) + 1;
    const d = Math.floor(rng() * 28) + 1;
    const dateStr = `2023-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;

    rows.push({
      Patient_ID: `PAT-701${i.toString().padStart(3, "0")}`,
      Admission_Date: dateStr,
      Age: age,
      Gender: gender,
      Treatment_Cohort: cohort,
      Systolic_BP: sys,
      Diastolic_BP: dia,
      Cholesterol_mg_dL: chol,
      BMI: bmi,
      Efficacy_Score: eff,
      Adverse_Event: adv,
      Outcome_Status: outcome,
    });
  }
  return rows;
}

// In-memory cache for demo rows
let salesRowsCache: Record<string, any>[] | null = null;
let saasRowsCache: Record<string, any>[] | null = null;
let clinicalRowsCache: Record<string, any>[] | null = null;

export function getDemoRows(id: string): Record<string, any>[] {
  if (id === "demo-ds-saas") {
    if (!saasRowsCache) saasRowsCache = generateSaaSRows();
    return saasRowsCache;
  }
  if (id === "demo-ds-clinical") {
    if (!clinicalRowsCache) clinicalRowsCache = generateClinicalRows();
    return clinicalRowsCache;
  }
  // Default to sales
  if (!salesRowsCache) salesRowsCache = generateSalesRows();
  return salesRowsCache;
}

// ==========================================
// 3. DATASET PREVIEWS (Columns + Pagination)
// ==========================================

export function getDemoPreview(
  id: string, 
  page = 1, 
  pageSize = 50, 
  search = "", 
  sortBy = "", 
  sortDesc = false
): DatasetPreview {
  const ds = DEMO_DATASETS.find((d) => d.id === id) || DEMO_DATASETS[0];
  let rows = [...getDemoRows(ds.id)];

  if (search.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter((r) =>
      Object.values(r).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }

  if (sortBy) {
    rows.sort((a, b) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      return sortDesc ? (va < vb ? 1 : -1) : (va > vb ? 1 : -1);
    });
  }

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const sampleRow = rows[0] || {};
  const columns = Object.keys(sampleRow).map((key) => {
    const val = sampleRow[key];
    const isNum = typeof val === "number";
    const isDate = key.toLowerCase().includes("date");
    const isId = key.toLowerCase().includes("id");
    return {
      name: key,
      data_type: isNum ? "float64" : isDate ? "datetime64[ns]" : "object",
      inferred_type: isId ? "id" : isDate ? "datetime" : isNum ? "numerical" : "categorical",
      null_count: rows.filter((r) => r[key] === null || r[key] === undefined).length,
      null_percentage: Math.round((rows.filter((r) => r[key] === null).length / totalRows) * 100),
      unique_count: new Set(rows.map((r) => r[key])).size,
      sample_values: rows.slice(0, 3).map((r) => r[key]),
    };
  });

  return {
    id: ds.id,
    name: ds.name,
    total_rows: totalRows,
    total_columns: columns.length,
    page,
    page_size: pageSize,
    total_pages: totalPages,
    columns: columns as any,
    rows: pagedRows,
  };
}

// ==========================================
// 4. DATASET PROFILES (Column Distributions)
// ==========================================

export function getDemoProfile(id: string): DatasetProfile {
  const ds = DEMO_DATASETS.find((d) => d.id === id) || DEMO_DATASETS[0];
  const rows = getDemoRows(ds.id);
  const sampleRow = rows[0] || {};
  const colKeys = Object.keys(sampleRow);

  const columns = colKeys.map((col, idx) => {
    const values = rows.map((r) => r[col]);
    const nonNulls = values.filter((v) => v !== null && v !== undefined);
    const isNum = typeof nonNulls[0] === "number";
    const isDate = col.toLowerCase().includes("date");
    const isId = col.toLowerCase().includes("id");

    const nullCount = rows.length - nonNulls.length;
    const uniqueValues = Array.from(new Set(nonNulls));

    let numerical_stats = undefined;
    let categorical_stats = undefined;
    let datetime_stats = undefined;

    if (isNum) {
      const numVals = nonNulls as number[];
      const sum = numVals.reduce((acc, v) => acc + v, 0);
      const mean = Math.round((sum / numVals.length) * 100) / 100;
      const min = Math.min(...numVals);
      const max = Math.max(...numVals);
      numerical_stats = {
        count: numVals.length,
        null_count: nullCount,
        null_percentage: Math.round((nullCount / rows.length) * 100),
        mean,
        median: mean,
        min,
        max,
        std: Math.round(((max - min) / 4) * 100) / 100,
        outliers_iqr_count: col.includes("Revenue") || col.includes("Tickets") ? 2 : 0,
        outliers_zscore_count: 1,
        histogram_bins: [min, min + (max - min) * 0.25, min + (max - min) * 0.5, min + (max - min) * 0.75, max],
        histogram_counts: [12, 28, 14, 6],
      };
    } else if (isDate) {
      datetime_stats = {
        count: nonNulls.length,
        null_count: nullCount,
        null_percentage: 0,
        min_date: "2023-01-15",
        max_date: "2023-12-28",
        timespan_days: 347,
      };
    } else {
      const counts: Record<string, number> = {};
      nonNulls.forEach((v) => {
        counts[String(v)] = (counts[String(v)] || 0) + 1;
      });
      categorical_stats = {
        count: nonNulls.length,
        null_count: nullCount,
        null_percentage: Math.round((nullCount / rows.length) * 100),
        unique_count: uniqueValues.length,
        is_cardinal: uniqueValues.length > 25,
        top_values: Object.entries(counts)
          .slice(0, 5)
          .map(([val, cnt]) => ({
            value: val,
            count: cnt,
            percentage: Math.round((cnt / nonNulls.length) * 100),
          })),
      };
    }

    return {
      name: col,
      index: idx,
      raw_type: isNum ? "float64" : isDate ? "datetime64" : "string",
      inferred_type: isId ? "id" : isDate ? "datetime" : isNum ? "numerical" : "categorical",
      is_id: isId,
      is_constant: false,
      is_empty: false,
      null_count: nullCount,
      null_percentage: Math.round((nullCount / rows.length) * 100),
      unique_count: uniqueValues.length,
      unique_ratio: Math.round((uniqueValues.length / rows.length) * 100) / 100,
      numerical_stats,
      categorical_stats,
      datetime_stats,
    };
  });

  return {
    dataset_id: ds.id,
    row_count: ds.row_count,
    column_count: ds.column_count,
    file_size_bytes: ds.file_size_bytes,
    memory_usage_bytes: ds.file_size_bytes * 2,
    duplicate_rows_count: ds.id === "demo-ds-sales" ? 3 : 1,
    duplicate_rows_percentage: 0.3,
    total_missing_values: ds.id === "demo-ds-sales" ? 7 : ds.id === "demo-ds-saas" ? 5 : 2,
    overall_missing_percentage: 0.8,
    columns,
    column_types_breakdown: {
      numerical: columns.filter((c) => c.inferred_type === "numerical").length,
      categorical: columns.filter((c) => c.inferred_type === "categorical").length,
      datetime: columns.filter((c) => c.inferred_type === "datetime").length,
      id: columns.filter((c) => c.inferred_type === "id").length,
    },
    domain_info: {
      domain: ds.id === "demo-ds-sales" ? "Retail & E-Commerce" : ds.id === "demo-ds-saas" ? "SaaS & Subscriptions" : "Healthcare & Clinical Trials",
      confidence: 0.98,
      matched_indicators: ["revenue", "order_date", "customer", "cohort", "mrr"],
      description: `Automated AST profiling parsed ${ds.name} into verified continuous distributions.`,
      recommended_metrics: ds.id === "demo-ds-sales" ? ["Revenue", "Net_Profit", "Units_Sold"] : ds.id === "demo-ds-saas" ? ["MRR", "Active_Seats", "Churn_Risk_Score"] : ["Efficacy_Score", "Systolic_BP", "BMI"],
      recommended_dimensions: ds.id === "demo-ds-sales" ? ["Product_Category", "Region", "Customer_Segment"] : ds.id === "demo-ds-saas" ? ["Subscription_Plan", "Usage_Frequency", "Account_Status"] : ["Treatment_Cohort", "Gender", "Outcome_Status"],
    },
  };
}

// ==========================================
// 5. QUALITY SCORES & CLEANING SUGGESTIONS
// ==========================================

export function getDemoQuality(id: string): QualityScore {
  if (id === "demo-ds-saas") {
    return {
      overall_score: 91,
      grade: "A-",
      summary_badges: ["98.2% Completeness", "0 Type Violations", "2 Outliers Detected"],
      structural_health: 95,
      completeness_score: 92,
      uniqueness_score: 97,
      consistency_score: 89,
      issues: [
        {
          type: "missing_values",
          column: "NPS_Score",
          severity: "medium",
          message: "5 accounts have missing NPS scores (newly onboarded within 30 days).",
          impact_count: 5,
          score_deduction: 4,
        },
        {
          type: "outliers",
          column: "Support_Tickets",
          severity: "low",
          message: "2 accounts show anomalous spike in support tickets (>10 tickets).",
          impact_count: 2,
          score_deduction: 3,
        },
      ],
    };
  }

  if (id === "demo-ds-clinical") {
    return {
      overall_score: 96,
      grade: "A+",
      summary_badges: ["99.4% Completeness", "GCP Certified Compliance", "Consistent ISO Vitals"],
      structural_health: 98,
      completeness_score: 97,
      uniqueness_score: 99,
      consistency_score: 95,
      issues: [
        {
          type: "missing_values",
          column: "BMI",
          severity: "low",
          message: "2 patients have missing baseline BMI records.",
          impact_count: 2,
          score_deduction: 2,
        },
      ],
    };
  }

  // Default: E-Commerce Sales
  return {
    overall_score: 94,
    grade: "A",
    summary_badges: ["97.8% Completeness", "Deterministic Schema Verified", "3 Duplicate Rows"],
    structural_health: 96,
    completeness_score: 93,
    uniqueness_score: 94,
    consistency_score: 95,
    issues: [
      {
        type: "missing_values",
        column: "Region",
        severity: "medium",
        message: "4 orders have missing geographic territory codes.",
        impact_count: 4,
        score_deduction: 3,
      },
      {
        type: "duplicate_rows",
        severity: "medium",
        message: "3 identical transaction records detected from retry webhooks.",
        impact_count: 3,
        score_deduction: 3,
      },
    ],
  };
}

export function getDemoSuggestions(id: string): CleaningSuggestion[] {
  if (id === "demo-ds-saas") {
    return [
      {
        id: "clean-1",
        column: "NPS_Score",
        action_type: "impute",
        title: "Impute Missing NPS Scores",
        description: "Fill missing NPS values using cohort median (8.0) to prevent evaluation bias.",
        impact_estimate: "Recovers 5 missing values across Active accounts",
        suggested_params: { method: "median" },
        severity: "warning",
      },
      {
        id: "clean-2",
        column: "Support_Tickets",
        action_type: "cap_outliers",
        title: "Cap IQR Outliers on Support Tickets",
        description: "Bound extreme support ticket counts exceeding the 99th percentile (capped at 9).",
        impact_estimate: "Normalizes 2 accounts with uncharacteristic webhook spam",
        suggested_params: { threshold: 9 },
        severity: "info",
      },
    ];
  }

  if (id === "demo-ds-clinical") {
    return [
      {
        id: "clean-1",
        column: "BMI",
        action_type: "impute",
        title: "Impute Missing Patient BMI",
        description: "Impute missing BMI using gender-stratified clinical median (25.4).",
        impact_estimate: "Completes vital metric for 2 baseline observations",
        suggested_params: { method: "median" },
        severity: "info",
      },
    ];
  }

  // E-Commerce Sales
  return [
    {
      id: "clean-1",
      action_type: "drop_duplicates",
      title: "Remove Redundant Duplicate Records",
      description: "Purge 3 exact duplicate orders resulting from idempotent API retries.",
      impact_estimate: "Removes 3 redundant records without data loss",
      suggested_params: { keep: "first" },
      severity: "critical",
    },
    {
      id: "clean-2",
      column: "Region",
      action_type: "impute",
      title: "Impute Missing Geographic Region",
      description: "Assign most frequent territory ('North America') to null region entries.",
      impact_estimate: "Repairs 4 null cells in regional revenue reports",
      suggested_params: { method: "mode" },
      severity: "warning",
    },
    {
      id: "clean-3",
      column: "Customer_Rating",
      action_type: "impute",
      title: "Fill Missing Customer Ratings",
      description: "Replace unrated purchase reviews with product category average rating.",
      impact_estimate: "Standardizes 3 satisfaction score entries",
      suggested_params: { method: "mean" },
      severity: "info",
    },
  ];
}

export function getDemoPreviewClean(id: string, action: any): CleaningDiffPreview {
  const ds = DEMO_DATASETS.find((d) => d.id === id) || DEMO_DATASETS[0];
  const rows = getDemoRows(ds.id);
  const sample = rows.slice(0, 4);
  const sampleAfter = sample.map((r) => {
    const copy = { ...r };
    if (action.action_type === "impute" && action.column) {
      if (copy[action.column] === null || copy[action.column] === undefined) {
        copy[action.column] = action.column === "Region" ? "North America" : action.column === "NPS_Score" ? 8 : 25.4;
      }
    }
    return copy;
  });

  return {
    success: true,
    operation_type: action.action_type || "clean",
    column: action.column,
    summary: `Simulated ${action.action_type} on ${action.column || "all columns"} across ${ds.name}.`,
    affected_rows_count: 4,
    sample_before: sample,
    sample_after: sampleAfter,
    changed_cells: [
      { row_idx: 2, column: action.column || "Region", old_value: null, new_value: "North America" }
    ],
    metrics_diff: {
      rows_before: ds.row_count,
      rows_after: action.action_type === "drop_duplicates" ? ds.row_count - 3 : ds.row_count,
      columns_before: ds.column_count,
      columns_after: ds.column_count,
      nulls_before: 7,
      nulls_after: 3,
      memory_before: ds.file_size_bytes,
      memory_after: Math.round(ds.file_size_bytes * 0.98),
    },
  };
}

// ==========================================
// 6. ANALYSIS, INSIGHTS & FORECAST
// ==========================================

export function getDemoAnalysis(id: string) {
  const quality = getDemoQuality(id);

  if (id === "demo-ds-saas") {
    return {
      dataset_id: id,
      quality,
      correlations: {
        matrix: {
          MRR: { MRR: 1.0, Active_Seats: 0.84, Support_Tickets: -0.12, Churn_Risk_Score: -0.34 },
          Active_Seats: { MRR: 0.84, Active_Seats: 1.0, Support_Tickets: 0.08, Churn_Risk_Score: -0.42 },
          Support_Tickets: { MRR: -0.12, Active_Seats: 0.08, Support_Tickets: 1.0, Churn_Risk_Score: 0.72 },
          Churn_Risk_Score: { MRR: -0.34, Active_Seats: -0.42, Support_Tickets: 0.72, Churn_Risk_Score: 1.0 },
        },
      },
      outliers: [
        { column: "Support_Tickets", row_index: 18, value: 14, reason: "IQR Bound Exceeded" },
      ],
      eda: {
        summary: "SaaS cohort telemetry reveals strong expansion velocity in Enterprise tiers, counterbalanced by support-ticket-driven churn in Starter tiers.",
      },
      insights: {
        executive_summary: "Enterprise accounts exhibit a 98.4% retention rate with an average MRR of $2,480. High churn risk concentrates in Starter tiers where accounts submit >4 support tickets within their first 60 days.",
        key_insights: [
          "Enterprise accounts drive 68.2% of total MRR while representing only 22% of total client volume.",
          "Strong positive correlation (r = +0.72) between Support Tickets (>4) and elevated Churn Risk Score.",
          "Dedicated Scale tier accounts demonstrate near-zero voluntary churn (0.8% annual).",
        ],
        trends: [
          "Annual invoice customers demonstrate 3.4x higher lifetime retention compared to monthly credit cards.",
          "Net Revenue Retention (NRR) reached 124% driven by seat expansion.",
        ],
        anomalies: [
          "2 Starter accounts had an anomalous spike of 12+ tickets in under 2 weeks.",
        ],
        business_recommendations: [
          "Introduce a specialized Customer Success onboarding manager for Starter accounts submitting >2 tickets in week 1.",
          "Incentivize annual payment terms with a 15% discount to slash involuntary churn.",
        ],
        potential_questions: [
          "What is the average MRR by subscription plan?",
          "Which payment method has the lowest churn risk?",
          "How does seat count correlate with support ticket volume?",
        ],
        structured_insights: [
          {
            title: "Support Ticket Churn Trigger",
            type: "risk",
            description: "Accounts with >4 support tickets exhibit a 72% probability of churning within 90 days.",
            metric: "Churn Risk Score",
            value: "+72%",
            comparison: "vs 8% baseline for <2 tickets",
            severity: "critical",
            source_columns: ["Support_Tickets", "Churn_Risk_Score"],
            calculation_reference: "Pearson Correlation r=0.72",
          },
          {
            title: "Enterprise Revenue Dominance",
            type: "trend",
            description: "Enterprise and Dedicated tiers generate the overwhelming majority of revenue with minimal attrition.",
            metric: "Enterprise MRR Share",
            value: "68.2%",
            comparison: "+14% YoY",
            severity: "positive",
            source_columns: ["Subscription_Plan", "MRR"],
            calculation_reference: "Cohort Revenue Contribution",
          },
        ],
      },
    };
  }

  if (id === "demo-ds-clinical") {
    return {
      dataset_id: id,
      quality,
      correlations: {
        matrix: {
          Age: { Age: 1.0, Systolic_BP: 0.62, Cholesterol_mg_dL: 0.45, Efficacy_Score: -0.12 },
          Systolic_BP: { Age: 0.62, Systolic_BP: 1.0, Cholesterol_mg_dL: 0.58, Efficacy_Score: -0.22 },
          Efficacy_Score: { Age: -0.12, Systolic_BP: -0.22, Cholesterol_mg_dL: -0.18, Efficacy_Score: 1.0 },
        },
      },
      outliers: [],
      eda: {
        summary: "Clinical trial cohort data confirms statistically significant efficacy for Cohort B (Dosage 100mg) relative to Placebo control.",
      },
      insights: {
        executive_summary: "Cohort B (100mg dosage) demonstrated an 84.6% mean efficacy score, exceeding target regulatory endpoints (p < 0.001). Adverse events were mild and non-systemic.",
        key_insights: [
          "Dosage 100mg delivered a +58.4% improvement in clinical outcome metrics over Placebo.",
          "Systolic blood pressure normalized by an average of -14.2 mmHg in the high-dosage cohort.",
          "Reported adverse events (mild fatigue, occasional headache) occurred in under 12% of participants.",
        ],
        trends: [
          "Patient recovery trajectories accelerated significantly between days 14 and 45 of treatment.",
          "Efficacy demonstrated consistent robustness across all age brackets (24 to 82 years).",
        ],
        anomalies: [
          "No severe adverse drug reactions (ADRs) detected across any monitored cohort.",
        ],
        business_recommendations: [
          "Proceed to Phase III trial registration based on high efficacy and clean safety profile.",
          "Maintain current dosage protocols while expanding patient demographic diversity.",
        ],
        potential_questions: [
          "What is the mean efficacy score by treatment cohort?",
          "Are adverse events correlated with higher patient age?",
          "How does systolic blood pressure vary across cohorts?",
        ],
        structured_insights: [
          {
            title: "Statistically Verified Cohort Efficacy",
            type: "finding",
            description: "High dosage cohort demonstrated superior efficacy exceeding placebo controls by 58.4%.",
            metric: "Mean Efficacy",
            value: "84.6%",
            comparison: "vs 26.2% Placebo",
            severity: "positive",
            source_columns: ["Treatment_Cohort", "Efficacy_Score"],
            calculation_reference: "Two-tailed t-test (p < 0.001)",
          },
        ],
      },
    };
  }

  // Default: E-Commerce Sales
  return {
    dataset_id: id,
    quality,
    correlations: {
      matrix: {
        Revenue: { Revenue: 1.0, Net_Profit: 0.88, Units_Sold: 0.64, Unit_Price: 0.76 },
        Net_Profit: { Revenue: 0.88, Net_Profit: 1.0, Units_Sold: 0.52, Unit_Price: 0.71 },
        Units_Sold: { Revenue: 0.64, Net_Profit: 0.52, Units_Sold: 1.0, Unit_Price: -0.15 },
        Unit_Price: { Revenue: 0.76, Net_Profit: 0.71, Units_Sold: -0.15, Unit_Price: 1.0 },
      },
    },
    outliers: [
      { column: "Units_Sold", row_index: 4, value: 24, reason: "IQR Upper Fence Exceeded" },
    ],
    eda: {
      summary: "E-Commerce sales analysis highlights Technology and Cloud Subscriptions as the primary margin engines, with North America representing 52% of total transaction volume.",
    },
    insights: {
      executive_summary: "Total revenue reached $1,842,500 with a 31.4% net profit margin. Technology products delivered the highest revenue share ($912K), while APAC expanded at the fastest rate (+38.1% YoY).",
      key_insights: [
        "Technology category contributed 49.5% of total gross revenue with a 38% average gross margin.",
        "North America represents the largest regional market ($958K), followed by EMEA ($524K).",
        "Enterprise customer segment generates 3.2x higher average order value ($4,120) compared to Consumer orders ($1,280).",
      ],
      trends: [
        "Q3 monthly revenue grew steadily from $540K (July) to $685K (September).",
        "Customer satisfaction rating averaged 4.6/5.0 for premium enterprise tiers.",
      ],
      anomalies: [
        "2 bulk purchase orders skewed Units_Sold upwards in the Furniture category.",
      ],
      business_recommendations: [
        "Expand Enterprise sales headcount in APAC to capture accelerating high-margin cloud expansion.",
        "Bundle Cloud Subscriptions with Technology hardware purchases to boost repeat lifetime value.",
      ],
      potential_questions: [
        "What is total revenue broken down by region?",
        "Which product category delivers the highest net profit margin?",
        "What is the average order value across customer segments?",
      ],
      structured_insights: [
        {
          title: "Technology Revenue Engine",
          type: "trend",
          description: "Hardware and cloud technology continue to outperform standard office supplies in both revenue and margin.",
          metric: "Category Revenue",
          value: "$912,400",
          comparison: "+24.2% YoY",
          severity: "positive",
          source_columns: ["Product_Category", "Revenue"],
          calculation_reference: "Aggregated Gross Volume",
        },
        {
          title: "Enterprise Order Size Advantage",
          type: "opportunity",
          description: "Enterprise buyers order significantly higher quantities with minimal discount price elasticity.",
          metric: "Enterprise AOV",
          value: "$4,120",
          comparison: "3.2x vs Consumer",
          severity: "positive",
          source_columns: ["Customer_Segment", "Revenue"],
          calculation_reference: "Mean Revenue by Segment",
        },
      ],
    },
  };
}

export function getDemoForecast(id: string): ForecastResult {
  const isSaas = id === "demo-ds-saas";
  const isClinical = id === "demo-ds-clinical";

  return {
    dataset_id: id,
    date_column: isClinical ? "Admission_Date" : isSaas ? "Signup_Date" : "Order_Date",
    metric_column: isClinical ? "Efficacy_Score" : isSaas ? "MRR" : "Revenue",
    horizon: "6m",
    periods_forecasted: 6,
    frequency: "M",
    frequency_label: "Monthly",
    model_name: "Holt-Winters Exponential Smoothing (Additive Seasonality)",
    metrics: {
      mape: 3.8,
      rmse: 1420.5,
      trend_direction: "upward",
      forecast_growth_percentage: 18.4,
      current_value: isClinical ? 82.4 : isSaas ? 142500 : 685000,
      projected_value: isClinical ? 94.2 : isSaas ? 168700 : 811000,
    },
    narrative: `Predictive model indicates a consistent +18.4% upward trajectory over the next 6 periods with high historical confidence (MAPE: 3.8%).`,
    disclaimer: "Forecast generated using AST-sandboxed statistical time series modeling.",
    chart_points: [
      { date: "2023-05", actual: isSaas ? 108000 : 510000, forecast: null, lower_bound: null, upper_bound: null },
      { date: "2023-06", actual: isSaas ? 116000 : 545000, forecast: null, lower_bound: null, upper_bound: null },
      { date: "2023-07", actual: isSaas ? 124000 : 580000, forecast: null, lower_bound: null, upper_bound: null },
      { date: "2023-08", actual: isSaas ? 133000 : 625000, forecast: null, lower_bound: null, upper_bound: null },
      { date: "2023-09", actual: isSaas ? 142500 : 685000, forecast: 142500, lower_bound: 142500, upper_bound: 142500 },
      { date: "2023-10", actual: null, forecast: isSaas ? 149000 : 715000, lower_bound: isSaas ? 142000 : 685000, upper_bound: isSaas ? 156000 : 745000 },
      { date: "2023-11", actual: null, forecast: isSaas ? 155000 : 748000, lower_bound: isSaas ? 146000 : 710000, upper_bound: isSaas ? 164000 : 786000 },
      { date: "2023-12", actual: null, forecast: isSaas ? 162000 : 782000, lower_bound: isSaas ? 151000 : 735000, upper_bound: isSaas ? 173000 : 829000 },
      { date: "2024-01", actual: null, forecast: isSaas ? 168700 : 811000, lower_bound: isSaas ? 155000 : 755000, upper_bound: isSaas ? 182000 : 867000 },
    ],
  };
}

// ==========================================
// 7. DASHBOARD STUDIO CONFIGURATIONS
// ==========================================

export function getDemoDashboard(id: string): Dashboard {
  const isSaas = id === "demo-ds-saas";
  const isClinical = id === "demo-ds-clinical";

  if (isSaas) {
    return {
      id: "dash-demo-saas",
      dataset_id: id,
      title: "SaaS Retention & Churn Executive Canvas",
      description: "Live telemetry, MRR breakdown, and cohort churn risk monitoring",
      is_default: true,
      created_at: "2026-09-18T14:30:00Z",
      updated_at: "2026-09-22T19:30:00Z",
      layout_config: {
        theme: "dark",
        active_page_id: "page_saas_overview",
        pages: [
          {
            id: "page_saas_overview",
            title: "Revenue & Cohort Health",
            widget_ids: ["w_saas_kpi1", "w_saas_kpi2", "w_saas_kpi3", "w_saas_kpi4", "w_saas_chart1", "w_saas_chart2"],
          },
        ],
      },
      widgets: [
        {
          id: "w_saas_kpi1",
          widget_type: "kpi",
          title: "Total Monthly MRR",
          grid_w: 3,
          grid_h: 2,
          color_palette: "violet",
          kpi_data: {
            id: "kpi_mrr",
            label: "Total MRR",
            value: 142500,
            formatted_value: "$142,500",
            change_percentage: 16.4,
            trend_direction: "up",
            subtext: "vs prior month run rate",
          },
        },
        {
          id: "w_saas_kpi2",
          widget_type: "kpi",
          title: "Active Accounts",
          grid_w: 3,
          grid_h: 2,
          color_palette: "blue",
          kpi_data: {
            id: "kpi_accounts",
            label: "Subscribed Accounts",
            value: 850,
            formatted_value: "850",
            change_percentage: 8.2,
            trend_direction: "up",
            subtext: "across 4 plan tiers",
          },
        },
        {
          id: "w_saas_kpi3",
          widget_type: "kpi",
          title: "Net Revenue Retention",
          grid_w: 3,
          grid_h: 2,
          color_palette: "emerald",
          kpi_data: {
            id: "kpi_nrr",
            label: "NRR Rate",
            value: 124,
            formatted_value: "124%",
            change_percentage: 4.1,
            trend_direction: "up",
            subtext: "seat expansion velocity",
          },
        },
        {
          id: "w_saas_kpi4",
          widget_type: "kpi",
          title: "Mean NPS Score",
          grid_w: 3,
          grid_h: 2,
          color_palette: "amber",
          kpi_data: {
            id: "kpi_nps",
            label: "Net Promoter Score",
            value: 8.4,
            formatted_value: "8.4 / 10",
            change_percentage: 2.5,
            trend_direction: "up",
            subtext: "verified customer rating",
          },
        },
        {
          id: "w_saas_chart1",
          widget_type: "chart",
          title: "MRR Contribution by Subscription Plan",
          grid_w: 6,
          grid_h: 4,
          color_palette: "violet",
          chart_config: {
            chart_id: "c_saas_plan",
            chart_type: "bar",
            title: "MRR Contribution by Subscription Plan",
            x_data: ["Starter", "Growth", "Enterprise", "Dedicated Scale"],
            y_data: [14200, 31200, 58400, 38700],
          },
        },
        {
          id: "w_saas_chart2",
          widget_type: "chart",
          title: "Account Status Breakdown",
          grid_w: 6,
          grid_h: 4,
          color_palette: "emerald",
          chart_config: {
            chart_id: "c_saas_status",
            chart_type: "donut",
            title: "Account Status Breakdown",
            series: [
              { name: "Active", data: [620] },
              { name: "Renewed", data: [145] },
              { name: "At-Risk", data: [65] },
              { name: "Churned", data: [20] },
            ],
          },
        },
      ],
    };
  }

  if (isClinical) {
    return {
      id: "dash-demo-clinical",
      dataset_id: id,
      title: "Clinical Trial Patient Vitals & Efficacy",
      description: "Real-time vitals monitoring and cohort dosage statistical outcomes",
      is_default: true,
      created_at: "2026-09-20T09:30:00Z",
      updated_at: "2026-09-22T19:30:00Z",
      layout_config: {
        theme: "dark",
        active_page_id: "page_clinical_overview",
        pages: [
          {
            id: "page_clinical_overview",
            title: "Efficacy & Safety",
            widget_ids: ["w_clin_kpi1", "w_clin_kpi2", "w_clin_kpi3", "w_clin_kpi4", "w_clin_chart1", "w_clin_chart2"],
          },
        ],
      },
      widgets: [
        {
          id: "w_clin_kpi1",
          widget_type: "kpi",
          title: "Total Monitored Patients",
          grid_w: 3,
          grid_h: 2,
          color_palette: "blue",
          kpi_data: {
            id: "kpi_patients",
            label: "Enrolled Patients",
            value: 500,
            formatted_value: "500",
            change_percentage: 0,
            trend_direction: "neutral",
            subtext: "100% Phase II cohort",
          },
        },
        {
          id: "w_clin_kpi2",
          widget_type: "kpi",
          title: "Cohort B Efficacy",
          grid_w: 3,
          grid_h: 2,
          color_palette: "emerald",
          kpi_data: {
            id: "kpi_eff",
            label: "100mg Mean Efficacy",
            value: 84.6,
            formatted_value: "84.6%",
            change_percentage: 58.4,
            trend_direction: "up",
            subtext: "superior vs placebo (p<0.001)",
          },
        },
        {
          id: "w_clin_kpi3",
          widget_type: "kpi",
          title: "Mean Systolic Reduction",
          grid_w: 3,
          grid_h: 2,
          color_palette: "violet",
          kpi_data: {
            id: "kpi_bp",
            label: "Blood Pressure Drop",
            value: -14.2,
            formatted_value: "-14.2 mmHg",
            change_percentage: 10.4,
            trend_direction: "up",
            subtext: "normalized vascular response",
          },
        },
        {
          id: "w_clin_kpi4",
          widget_type: "kpi",
          title: "Safety Compliance",
          grid_w: 3,
          grid_h: 2,
          color_palette: "emerald",
          kpi_data: {
            id: "kpi_safety",
            label: "Zero Serious Events",
            value: 100,
            formatted_value: "100%",
            change_percentage: 0,
            trend_direction: "neutral",
            subtext: "GCP regulatory benchmark",
          },
        },
        {
          id: "w_clin_chart1",
          widget_type: "chart",
          title: "Mean Efficacy Score by Treatment Cohort",
          grid_w: 6,
          grid_h: 4,
          color_palette: "emerald",
          chart_config: {
            chart_id: "c_clin_eff",
            chart_type: "bar",
            title: "Mean Efficacy Score by Treatment Cohort",
            x_data: ["Placebo Control", "Cohort A (50mg)", "Cohort B (100mg)"],
            y_data: [26.2, 58.4, 84.6],
          },
        },
        {
          id: "w_clin_chart2",
          widget_type: "chart",
          title: "Reported Adverse Events Distribution",
          grid_w: 6,
          grid_h: 4,
          color_palette: "blue",
          chart_config: {
            chart_id: "c_clin_adv",
            chart_type: "pie",
            title: "Reported Adverse Events Distribution",
            series: [
              { name: "None", data: [385] },
              { name: "Mild Fatigue", data: [58] },
              { name: "Headache", data: [37] },
              { name: "Nausea", data: [20] },
            ],
          },
        },
      ],
    };
  }

  // Default: E-Commerce Sales
  return {
    id: "dash-demo-sales",
    dataset_id: id,
    title: "Global E-Commerce Revenue Intelligence",
    description: "Multi-dimensional performance across technology, office supplies, and regional sales",
    is_default: true,
    created_at: "2026-09-15T11:00:00Z",
    updated_at: "2026-09-22T19:30:00Z",
    layout_config: {
      theme: "dark",
      active_page_id: "page_sales_overview",
      pages: [
        {
          id: "page_sales_overview",
          title: "Executive Revenue Overview",
          widget_ids: ["w_sales_kpi1", "w_sales_kpi2", "w_sales_kpi3", "w_sales_kpi4", "w_sales_chart1", "w_sales_chart2"],
        },
      ],
    },
    widgets: [
      {
        id: "w_sales_kpi1",
        widget_type: "kpi",
        title: "Total Gross Revenue",
        grid_w: 3,
        grid_h: 2,
        color_palette: "blue",
        kpi_data: {
          id: "kpi_rev",
          label: "Total Gross Revenue",
          value: 1842500,
          formatted_value: "$1,842,500",
          change_percentage: 24.2,
          trend_direction: "up",
          subtext: "vs prior year baseline",
        },
      },
      {
        id: "w_sales_kpi2",
        widget_type: "kpi",
        title: "Total Transactions",
        grid_w: 3,
        grid_h: 2,
        color_palette: "emerald",
        kpi_data: {
          id: "kpi_orders",
          label: "Orders Processed",
          value: 1200,
          formatted_value: "1,200",
          change_percentage: 12.8,
          trend_direction: "up",
          subtext: "100% order fulfillment",
        },
      },
      {
        id: "w_sales_kpi3",
        widget_type: "kpi",
        title: "Net Profit Margin",
        grid_w: 3,
        grid_h: 2,
        color_palette: "violet",
        kpi_data: {
          id: "kpi_profit",
          label: "Net Profit Margin",
          value: 31.4,
          formatted_value: "31.4%",
          change_percentage: 3.5,
          trend_direction: "up",
          subtext: "$578,545 net earnings",
        },
      },
      {
        id: "w_sales_kpi4",
        widget_type: "kpi",
        title: "Data Quality Score",
        grid_w: 3,
        grid_h: 2,
        color_palette: "amber",
        kpi_data: {
          id: "kpi_qual",
          label: "Verified Health Score",
          value: 94,
          formatted_value: "94 / 100",
          change_percentage: 0,
          trend_direction: "neutral",
          subtext: "Deterministic AST pass",
        },
      },
      {
        id: "w_sales_chart1",
        widget_type: "chart",
        title: "Revenue by Product Category",
        grid_w: 6,
        grid_h: 4,
        color_palette: "violet",
        chart_config: {
          chart_id: "c_sales_cat",
          chart_type: "bar",
          title: "Revenue by Product Category",
          x_data: ["Technology", "Cloud Subscriptions", "Furniture", "Office Supplies"],
          y_data: [912400, 482500, 265200, 182400],
        },
      },
      {
        id: "w_sales_chart2",
        widget_type: "chart",
        title: "Regional Market Share",
        grid_w: 6,
        grid_h: 4,
        color_palette: "blue",
        chart_config: {
          chart_id: "c_sales_reg",
          chart_type: "donut",
          title: "Regional Market Share",
          series: [
            { name: "North America", data: [958000] },
            { name: "EMEA", data: [524000] },
            { name: "APAC", data: [248000] },
            { name: "LATAM", data: [112500] },
          ],
        },
      },
    ],
  };
}

// ==========================================
// 8. ASK DATA INTELLIGENT RESPONDER
// ==========================================

export function getDemoAskDataAnswer(id: string, question: string): AskDataResponse {
  const rows = getDemoRows(id);
  const ds = DEMO_DATASETS.find((d) => d.id === id) || DEMO_DATASETS[0];
  return processClientAskDataQuery(id, question, rows, ds.name);
}

// ==========================================
// 9. RELATIONSHIPS & REPORTS
// ==========================================

export function getDemoRelationships(): any[] {
  return [
    {
      source_dataset_id: "demo-ds-sales",
      target_dataset_id: "demo-ds-saas",
      source_column: "Customer_Segment",
      target_column: "Subscription_Plan",
      relationship_type: "one_to_many",
      overlap_count: 850,
      overlap_percentage: 92.4,
      confidence: 0.94,
      recommendation: "Cross-dataset join detected between E-Commerce Enterprise transactions and SaaS Account Telemetry",
    },
  ];
}

export function getDemoReports(): Report[] {
  return [
    {
      id: "rep-demo-sales-q3",
      dataset_id: "demo-ds-sales",
      title: "Q3 Global Enterprise Revenue Briefing",
      summary: "Executive analysis of multi-regional sales, category margins, and APAC growth momentum.",
      format: "executive_briefing",
      content: {
        highlights: [
          "Gross Revenue reached $1.84M (+24.2% YoY)",
          "Technology products delivered 49.5% of total volume",
          "APAC expanded at the highest velocity (+38.1%)",
        ],
      },
      created_at: "2026-09-21T14:00:00Z",
    },
    {
      id: "rep-demo-saas-churn",
      dataset_id: "demo-ds-saas",
      title: "SaaS Retention & Churn Cohort Synthesis",
      summary: "Analysis of churn triggers, support ticket thresholds, and enterprise expansion.",
      format: "board_slides",
      content: {
        highlights: [
          "Enterprise retention at 98.4%",
          "Support ticket threshold (>4) is primary churn risk indicator",
          "NRR achieved 124% via seat expansion",
        ],
      },
      created_at: "2026-09-22T11:30:00Z",
    },
  ];
}
