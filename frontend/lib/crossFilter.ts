// Real-time client-side cross-filtering & aggregation engine
export interface ActiveFilters {
  [column: string]: string[];
}

export interface ActiveDateFilter {
  date_col?: string;
  preset?: string;
  start_date?: string;
  end_date?: string;
}

export function applyFilters(
  rows: Record<string, any>[],
  categoricalFilters: ActiveFilters,
  dateFilter?: ActiveDateFilter
): Record<string, any>[] {
  if (!rows || rows.length === 0) return [];

  return rows.filter((row) => {
    // 1. Check Categorical Filters
    for (const [col, selectedVals] of Object.entries(categoricalFilters)) {
      if (!selectedVals || selectedVals.length === 0) continue;
      const cellVal = String(row[col] ?? "").trim();
      const match = selectedVals.some(
        (v) => String(v).trim().toLowerCase() === cellVal.toLowerCase()
      );
      if (!match) return false;
    }

    // 2. Check Date Filter
    if (dateFilter && dateFilter.date_col && row[dateFilter.date_col]) {
      const rowDateVal = new Date(row[dateFilter.date_col]).getTime();
      if (isNaN(rowDateVal)) return true;

      if (dateFilter.preset && dateFilter.preset !== "all" && dateFilter.preset !== "custom") {
        const now = new Date().getTime();
        let cutoff = 0;
        if (dateFilter.preset === "7d") cutoff = now - 7 * 24 * 60 * 60 * 1000;
        else if (dateFilter.preset === "30d") cutoff = now - 30 * 24 * 60 * 1000;
        else if (dateFilter.preset === "90d") cutoff = now - 90 * 24 * 60 * 1000;
        else if (dateFilter.preset === "ytd") {
          cutoff = new Date(new Date().getFullYear(), 0, 1).getTime();
        }
        if (cutoff > 0 && rowDateVal < cutoff) return false;
      } else if (dateFilter.start_date || dateFilter.end_date) {
        if (dateFilter.start_date) {
          const startTs = new Date(dateFilter.start_date).getTime();
          if (!isNaN(startTs) && rowDateVal < startTs) return false;
        }
        if (dateFilter.end_date) {
          const endTs = new Date(dateFilter.end_date).getTime();
          if (!isNaN(endTs) && rowDateVal > endTs) return false;
        }
      }
    }

    return true;
  });
}

export function computeMetric(
  rows: Record<string, any>[],
  column: string,
  agg: "sum" | "mean" | "count" | "min" | "max" = "sum"
): number {
  if (!rows || rows.length === 0) return 0;
  if (agg === "count") return rows.length;

  const numericVals = rows
    .map((r) => Number(r[column]))
    .filter((v) => !isNaN(v) && isFinite(v));

  if (numericVals.length === 0) return 0;

  switch (agg) {
    case "sum":
      return numericVals.reduce((a, b) => a + b, 0);
    case "mean":
      return numericVals.reduce((a, b) => a + b, 0) / numericVals.length;
    case "min":
      return Math.min(...numericVals);
    case "max":
      return Math.max(...numericVals);
    default:
      return numericVals.reduce((a, b) => a + b, 0);
  }
}

export function formatMetricValue(
  value: number,
  format: "currency" | "number" | "percentage" = "currency"
): string {
  if (value === undefined || value === null || isNaN(value)) return "—";

  if (format === "currency") {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (format === "percentage") {
    return `${value.toFixed(1)}%`;
  } else {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

export function computeGroupedData(
  rows: Record<string, any>[],
  xCol: string,
  yCol: string,
  agg: "sum" | "mean" | "count" | "min" | "max" = "sum",
  limit = 10
): { name: string; value: number }[] {
  if (!rows || rows.length === 0 || !xCol) return [];

  const groups: Record<string, number[]> = {};
  rows.forEach((r) => {
    const key = String(r[xCol] ?? "Unspecified");
    if (!groups[key]) groups[key] = [];
    const val = Number(r[yCol]);
    if (!isNaN(val) && isFinite(val)) {
      groups[key].push(val);
    }
  });

  const result = Object.entries(groups).map(([name, vals]) => {
    let computed = 0;
    if (agg === "count") computed = vals.length;
    else if (vals.length > 0) {
      if (agg === "sum") computed = vals.reduce((a, b) => a + b, 0);
      else if (agg === "mean") computed = vals.reduce((a, b) => a + b, 0) / vals.length;
      else if (agg === "min") computed = Math.min(...vals);
      else if (agg === "max") computed = Math.max(...vals);
    }
    return { name, value: Math.round(computed * 100) / 100 };
  });

  // Sort descending by value
  result.sort((a, b) => b.value - a.value);
  return result.slice(0, limit);
}

export function getUniqueValues(
  rows: Record<string, any>[],
  column: string,
  maxItems = 30
): string[] {
  if (!rows || rows.length === 0 || !column) return [];
  const set = new Set<string>();
  rows.forEach((r) => {
    const val = r[column];
    if (val !== null && val !== undefined && String(val).trim() !== "") {
      set.add(String(val).trim());
    }
  });
  return Array.from(set).slice(0, maxItems);
}
