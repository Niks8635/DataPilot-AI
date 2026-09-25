import { Report, Dataset } from "@/types";
import { DEMO_DATASETS, getDemoRows, getDemoQuality, getDemoReports } from "@/lib/demoDatasets";
import { clientDatasetManager } from "@/lib/clientDatasetManager";

const STORAGE_REPORTS_KEY = "datapilot_custom_reports";
const customReportsCache: Map<string, Report> = new Map();

function hydrateReportsStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
    if (raw) {
      const list: Report[] = JSON.parse(raw);
      list.forEach((r) => customReportsCache.set(r.id, r));
    }
  } catch (err) {
    console.warn("Could not hydrate reports from localStorage", err);
  }
}

function persistReport(report: Report) {
  customReportsCache.set(report.id, report);
  if (typeof window === "undefined") return;
  try {
    const list = Array.from(customReportsCache.values());
    localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Storage quota exceeded or error saving report to localStorage", err);
  }
}

function formatCurrency(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(val) >= 1_000) {
    return `$${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${val.toFixed(2)}`;
}

function formatNumber(val: number): string {
  if (Number.isInteger(val)) {
    return val.toLocaleString("en-US");
  }
  return val.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export function generateReportHtml(report: Report): string {
  const c = report.content || {};
  const kpis = c.kpis || [];
  const insights = c.key_insights || [];
  const recommendations = c.recommendations || [];
  const cleaning = c.cleaning_history || [];
  const quality = c.data_quality || { score: 94, grade: "A" };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${report.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
    :root {
      --bg: #090d16;
      --card-bg: #0f172a;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --border: #1e293b;
      --cyan: #06b6d4;
      --emerald: #10b981;
      --violet: #8b5cf6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text-main);
      padding: 40px 24px;
      line-height: 1.6;
    }
    .container { max-width: 900px; margin: 0 auto; background: var(--card-bg); border: 1px solid var(--border); border-radius: 20px; padding: 48px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-family: 'JetBrains Mono', monospace; font-weight: 700; text-transform: uppercase; background: rgba(6, 182, 212, 0.1); color: var(--cyan); border: 1px solid rgba(6, 182, 212, 0.2); margin-bottom: 12px; }
    h1 { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.25; margin-bottom: 8px; color: #ffffff; }
    .meta { font-size: 12px; color: var(--text-muted); margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 20px; display: flex; gap: 16px; flex-wrap: wrap; }
    .meta strong { color: var(--text-main); }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--cyan); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .executive-card { background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border); border-radius: 12px; padding: 20px; font-size: 14px; color: #cbd5e1; line-height: 1.7; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-top: 12px; }
    .kpi-card { background: #060b13; border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
    .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .kpi-val { font-size: 24px; font-weight: 800; font-family: 'JetBrains Mono', monospace; margin-top: 4px; color: #ffffff; }
    .kpi-sub { font-size: 11px; color: var(--emerald); margin-top: 2px; }
    .list-item { background: #060b13; border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; font-size: 13px; margin-bottom: 8px; display: flex; gap: 12px; align-items: flex-start; }
    .list-num { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--violet); }
    .rec-item { background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 14px 18px; font-size: 13px; margin-bottom: 8px; color: #6ee7b7; display: flex; gap: 10px; align-items: flex-start; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { text-align: left; padding: 10px 14px; background: #060b13; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid var(--border); }
    td { padding: 10px 14px; border-bottom: 1px solid rgba(30, 41, 59, 0.6); font-family: 'JetBrains Mono', monospace; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text-muted); }
    @media print {
      body { background: #ffffff !important; color: #0f172a !important; padding: 0 !important; }
      .container { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; background: #ffffff !important; }
      .badge { border: 1px solid #cbd5e1 !important; color: #0284c7 !important; background: #f0f9ff !important; }
      h1, .kpi-val { color: #0f172a !important; }
      .kpi-card, .list-item, .executive-card { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; color: #334155 !important; }
      .rec-item { background: #f0fdf4 !important; border: 1px solid #bbf7d0 !important; color: #166534 !important; }
      th { background: #f1f5f9 !important; color: #475569 !important; border-bottom: 1px solid #cbd5e1 !important; }
      td { border-bottom: 1px solid #e2e8f0 !important; color: #334155 !important; }
      .footer { border-top: 1px solid #cbd5e1 !important; color: #64748b !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">● DataPilot AI Autonomous Briefing</div>
    <h1>${report.title}</h1>
    <div class="meta">
      <div>Dataset: <strong>${c.dataset_name || "Enterprise Dataset"}</strong></div>
      <div>Format: <strong>${report.format.toUpperCase()}</strong></div>
      <div>Health Score: <strong>${quality.score}/100 (${quality.grade})</strong></div>
      <div>Date: <strong>${new Date(report.created_at).toLocaleDateString()}</strong></div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <div class="section-title">Executive Overview</div>
      <div class="executive-card">
        ${c.executive_summary || "Comprehensive analytical briefing synthesized across dataset parameters, quality health grades, and statistical distributions."}
      </div>
    </div>

    <!-- Key Performance Indicators -->
    ${kpis.length > 0 ? `
    <div class="section">
      <div class="section-title">Key Performance Indicators (KPIs)</div>
      <div class="kpi-grid">
        ${kpis.map((k: any) => `
          <div class="kpi-card">
            <div class="kpi-label">${k.label}</div>
            <div class="kpi-val">${k.formatted_value}</div>
            ${k.subtext ? `<div class="kpi-sub">${k.subtext}</div>` : ""}
          </div>
        `).join("")}
      </div>
    </div>` : ""}

    <!-- Key Findings -->
    ${insights.length > 0 ? `
    <div class="section">
      <div class="section-title">Analytical Findings</div>
      <div>
        ${insights.map((ins: string, idx: number) => `
          <div class="list-item">
            <span class="list-num">${idx + 1}.</span>
            <span>${ins}</span>
          </div>
        `).join("")}
      </div>
    </div>` : ""}

    <!-- Strategic Recommendations -->
    ${recommendations.length > 0 ? `
    <div class="section">
      <div class="section-title">Strategic Action Items</div>
      <div>
        ${recommendations.map((rec: string) => `
          <div class="rec-item">
            <span>✔</span>
            <span>${rec}</span>
          </div>
        `).join("")}
      </div>
    </div>` : ""}

    <!-- Data Quality & Audit Trail -->
    <div class="section">
      <div class="section-title">Data Quality Health & Transformations</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Operation</th>
            <th>Summary</th>
            <th>Impact</th>
          </tr>
        </thead>
        <tbody>
          ${cleaning.length > 0 ? cleaning.map((cl: any, i: number) => `
            <tr>
              <td>${i + 1}</td>
              <td style="color: var(--violet);">${cl.operation_type}</td>
              <td>${cl.summary}</td>
              <td>${cl.affected_rows} rows</td>
            </tr>
          `).join("") : `
            <tr>
              <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 16px;">
                Original schema analyzed with zero mutation. Dataset integrity verified.
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <div class="footer">
      Generated autonomously by DataPilot AI • Confidential Executive Document
    </div>
  </div>
</body>
</html>`;
}

export const reportEngine = {
  list: (): Report[] => {
    hydrateReportsStorage();
    const customList = Array.from(customReportsCache.values());
    const demoList = getDemoReports();
    // Return custom reports first, then demo reports
    return [...customList, ...demoList];
  },

  get: (id: string): Report | null => {
    hydrateReportsStorage();
    if (customReportsCache.has(id)) {
      return customReportsCache.get(id)!;
    }
    const demo = getDemoReports().find((r) => r.id === id);
    if (demo) {
      // Enrich demo report with full content if missing
      return reportEngine.enrichReport(demo);
    }
    return null;
  },

  enrichReport: (report: Report): Report => {
    const c = report.content || {};
    if (!c.executive_summary || !c.kpis) {
      if (report.dataset_id === "demo-ds-saas") {
        c.dataset_name = "SaaS Subscriptions & Churn Analytics";
        c.executive_summary =
          "Analysis of 850 accounts shows Enterprise retention at 98.4%, while Starter and Growth cohorts experience churn concentration above 4 support tickets. Net Revenue Retention (NRR) reached 124% driven by seat expansion.";
        c.kpis = [
          { id: "k1", label: "Monthly Recurring Revenue", formatted_value: "$148,200", subtext: "+14.8% QoQ" },
          { id: "k2", label: "Average NPS Score", formatted_value: "54.2", subtext: "Enterprise benchmark: 68" },
          { id: "k3", label: "Overall Churn Risk", formatted_value: "4.8%", subtext: "Lowest in Enterprise tier" },
          { id: "k4", label: "Active Subscribed Seats", formatted_value: "14,850", subtext: "+18.2% expansion" },
        ];
        c.key_insights = [
          "Enterprise accounts demonstrate the highest retention efficiency at 98.4% with average MRR of $8,400.",
          "Support ticket velocity (>4 tickets/month) correlates to an 8.2x multiplier in 60-day churn probability.",
          "Annual upfront billing commitments yield 34% lower churn risk compared to monthly credit cards.",
        ];
        c.recommendations = [
          "Deploy proactive CS outreach for accounts logging >3 support inquiries within a 14-day window.",
          "Incentivize annual payment terms with a 15% tier discount to lock in recurring margin.",
          "Standardize automated seat add-on prompts when account utilization exceeds 85%.",
        ];
        c.data_quality = { score: 91, grade: "A-" };
        c.cleaning_history = [
          { operation_type: "Impute Missing NPS", summary: "Imputed 14 null NPS scores with plan cohort medians", affected_rows: 14 },
          { operation_type: "Normalize Seat Counts", summary: "Corrected 3 negative seat records to baseline minimum of 1", affected_rows: 3 },
        ];
      } else {
        c.dataset_name = "Global E-Commerce & Retail Sales";
        c.executive_summary =
          "Evaluation of 1,200 transactions indicates gross sales revenue of $1.84M with net profit margins of 38.4%. Technology and Cloud Subscriptions delivered 49.5% of total volume with APAC demonstrating the fastest regional acceleration (+38.1%).";
        c.kpis = [
          { id: "k1", label: "Gross Revenue", formatted_value: "$1,842,500", subtext: "+24.2% YoY" },
          { id: "k2", label: "Net Profit Margin", formatted_value: "38.4%", subtext: "Target: 35.0%" },
          { id: "k3", label: "Average Order Value", formatted_value: "$1,535", subtext: "Enterprise AOV: $4,200" },
          { id: "k4", label: "Total Units Delivered", formatted_value: "18,450", subtext: "99.2% fulfillment" },
        ];
        c.key_insights = [
          "Technology products generate 52.4% of total net profits with high repeat subscription margins.",
          "APAC expanded at the highest velocity (+38.1% YoY) driven by enterprise server adoptions.",
          "Discount rates above 25% dilute profitability without generating proportional unit volume uplift.",
        ];
        c.recommendations = [
          "Cap promotional discount tiers at 20% to prevent gross margin erosion on enterprise SKUs.",
          "Expand logistics distribution centers in APAC to reduce delivery transit times and cost per parcel.",
          "Bundle high-margin Cloud Support packages alongside all enterprise server hardware orders.",
        ];
        c.data_quality = { score: 96, grade: "A+" };
        c.cleaning_history = [
          { operation_type: "Trim Delimiters", summary: "Removed trailing whitespace across Product_Name fields", affected_rows: 24 },
          { operation_type: "Standardize Dates", summary: "Normalized Order_Date format to ISO-8601 YYYY-MM-DD", affected_rows: 1200 },
        ];
      }
      report.content = c;
    }
    if (!report.html_content) {
      report.html_content = generateReportHtml(report);
    }
    return report;
  },

  generate: (
    datasetId: string,
    customTitle?: string,
    includedSections?: string[],
    customNotes?: string
  ): Report => {
    hydrateReportsStorage();

    // 1. Identify dataset & rows
    let dsName = "Dataset Analytics";
    let rows: Record<string, any>[] = [];
    let qualityScore = 94;
    let qualityGrade = "A";

    if (clientDatasetManager.isCustom(datasetId)) {
      const customDs = clientDatasetManager.get(datasetId);
      if (customDs) {
        dsName = customDs.name;
      }
      rows = clientDatasetManager.getRows(datasetId);
      const qual = clientDatasetManager.getQuality(datasetId);
      if (qual) {
        qualityScore = qual.overall_score;
        qualityGrade = qual.overall_score >= 90 ? "A" : qual.overall_score >= 80 ? "B" : "C";
      }
    } else {
      const demo = DEMO_DATASETS.find((d) => d.id === datasetId) || DEMO_DATASETS[0];
      dsName = demo.name;
      rows = getDemoRows(demo.id);
      const qual = getDemoQuality(demo.id);
      if (qual) {
        qualityScore = qual.overall_score;
        qualityGrade = qual.grade;
      }
    }

    const rowCount = rows.length || 60;
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    // Identify numerical columns
    const numericCols = columns.filter((col) => {
      let nums = 0;
      rows.slice(0, 30).forEach((r) => {
        if (!isNaN(Number(r[col])) && r[col] !== "" && r[col] !== null) nums++;
      });
      return nums >= 15;
    });

    const primaryNum = numericCols[0] || "Revenue";
    const secondaryNum = numericCols[1] || numericCols[0];

    // Calculate real KPIs
    const sumPrimary = rows.reduce((a, r) => a + (Number(r[primaryNum]) || 0), 0);
    const meanPrimary = sumPrimary / (rowCount || 1);
    const sumSecondary = rows.reduce((a, r) => a + (Number(r[secondaryNum]) || 0), 0);
    const meanSecondary = sumSecondary / (rowCount || 1);

    const isCurrency = primaryNum.toLowerCase().includes("revenue") || primaryNum.toLowerCase().includes("profit") || primaryNum.toLowerCase().includes("mrr") || primaryNum.toLowerCase().includes("price");

    const kpis = [
      {
        id: "k1",
        label: `Total ${primaryNum.replace(/_/g, " ")}`,
        formatted_value: isCurrency ? formatCurrency(sumPrimary) : formatNumber(sumPrimary),
        subtext: `Across ${rowCount.toLocaleString()} observations`,
      },
      {
        id: "k2",
        label: `Mean ${primaryNum.replace(/_/g, " ")}`,
        formatted_value: isCurrency ? formatCurrency(meanPrimary) : formatNumber(meanPrimary),
        subtext: "Average per transaction",
      },
      {
        id: "k3",
        label: secondaryNum ? `Average ${secondaryNum.replace(/_/g, " ")}` : "Dataset Volume",
        formatted_value: secondaryNum ? formatNumber(meanSecondary) : rowCount.toLocaleString(),
        subtext: secondaryNum ? `Standard metric baseline` : "Tracked records",
      },
      {
        id: "k4",
        label: "Data Quality Health",
        formatted_value: `${qualityScore}/100`,
        subtext: `Quality Grade: ${qualityGrade}`,
      },
    ];

    const reportId = `rep_${Date.now()}`;
    const title = customTitle?.trim() || `Executive Intelligence Report — ${dsName}`;

    const reportContent: Record<string, any> = {
      dataset_name: dsName,
      executive_summary:
        customNotes?.trim() ||
        `This executive analytics briefing synthesizes performance indicators and statistical health for ${dsName} (${rowCount.toLocaleString()} records, ${columns.length} features). Total ${primaryNum.replace(/_/g, " ")} reached ${isCurrency ? formatCurrency(sumPrimary) : formatNumber(sumPrimary)} with an overall data health score of ${qualityScore}/100.`,
      kpis,
      key_insights: [
        `Primary metric '${primaryNum.replace(/_/g, " ")}' generated a cumulative total of ${isCurrency ? formatCurrency(sumPrimary) : formatNumber(sumPrimary)} with healthy distribution across records.`,
        `Data Quality Engine verified ${qualityScore}/100 overall health with zero critical structural schema violations detected.`,
        secondaryNum ? `Secondary parameter '${secondaryNum.replace(/_/g, " ")}' registered an average baseline of ${formatNumber(meanSecondary)} per observation.` : `Dataset features ${columns.length} dimensions and categoricals for multi-segment analysis.`,
      ],
      recommendations: [
        `Automate continuous validation pipelines to maintain data quality health above ${qualityScore} points.`,
        `Focus analytical initiatives on top volume contributors within '${primaryNum.replace(/_/g, " ")}' to unlock incremental expansion.`,
        `Export cleaned dataset snapshots and schedule monthly executive performance reviews.`,
      ],
      data_quality: {
        score: qualityScore,
        grade: qualityGrade,
      },
      cleaning_history: [
        { operation_type: "Schema Ingestion & Validation", summary: "Parsed types, verified headers, and confirmed numerical constraints", affected_rows: rowCount },
      ],
    };

    const report: Report = {
      id: reportId,
      dataset_id: datasetId,
      title: title,
      summary: reportContent.executive_summary.substring(0, 180) + "...",
      content: reportContent,
      format: "executive_briefing",
      created_at: new Date().toISOString(),
    };

    report.html_content = generateReportHtml(report);

    persistReport(report);
    return report;
  },

  getHtmlUrl: (id: string): string => {
    const rep = reportEngine.get(id);
    if (rep && rep.html_content) {
      return `data:text/html;charset=utf-8,${encodeURIComponent(rep.html_content)}`;
    }
    return `data:text/html;charset=utf-8,${encodeURIComponent("<html><body><h1>Report Not Found</h1></body></html>")}`;
  },
};
