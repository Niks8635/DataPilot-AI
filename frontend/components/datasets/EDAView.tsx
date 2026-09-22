"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  BarChart2, 
  Activity, 
  Sparkles, 
  ArrowUpRight, 
  Layers, 
  PieChart as PieIcon,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DynamicChart } from "@/components/charts/DynamicChart";

interface EDAViewProps {
  eda: any;
  correlations: any;
  outliers: any[];
}

export function EDAView({ eda, correlations, outliers }: EDAViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"bivariate" | "trends" | "correlations" | "outliers">("bivariate");

  if (!eda) {
    return <div className="p-16 text-center text-xs text-slate-400">Loading EDA calculations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Sub-Navigation for EDA */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab("bivariate")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeSubTab === "bivariate"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          Category Comparisons & Aggregations
        </button>
        <button
          onClick={() => setActiveSubTab("trends")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeSubTab === "trends"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          Time-Series & Growth Trends
        </button>
        <button
          onClick={() => setActiveSubTab("correlations")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeSubTab === "correlations"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          Statistical Correlations
        </button>
        <button
          onClick={() => setActiveSubTab("outliers")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeSubTab === "outliers"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          Outliers & Extreme Detection ({outliers?.length || 0})
        </button>
      </div>

      {/* 1. Bivariate Aggregations */}
      {activeSubTab === "bivariate" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {eda.bivariate_aggregations?.map((biv: any, idx: number) => {
              const items = biv.top_performers || [];
              const chartConfig: any = {
                chart_id: `biv_${idx}`,
                chart_type: items.length > 5 ? "horizontal_bar" : "bar",
                title: `${biv.numerical_col} by ${biv.category_col}`,
                subtitle: `Aggregated sum breakdown across top ${items.length} segments`,
                x_data: items.map((i: any) => i.category),
                y_data: items.map((i: any) => i.sum),
                series: [{ name: biv.numerical_col, data: items.map((i: any) => i.sum) }],
              };

              return (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle>
                      <BarChart2 className="w-4 h-4 text-blue-400" />
                      {biv.numerical_col} by {biv.category_col}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DynamicChart config={chartConfig} height={240} />
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Top Contributing Categories
                      </div>
                      <div className="space-y-1.5">
                        {items.slice(0, 4).map((item: any, iIdx: number) => (
                          <div key={iIdx} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 truncate max-w-[160px]">{item.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-white">${item.sum.toLocaleString()}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {item.percentage}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Time-Series & Growth Trends */}
      {activeSubTab === "trends" && (
        <div className="space-y-6">
          {eda.time_series_trends?.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No datetime columns detected for chronological trend analysis.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {eda.time_series_trends?.map((trend: any, idx: number) => {
                const pts = trend.points || [];
                const chartConfig: any = {
                  chart_id: `trend_${idx}`,
                  chart_type: "line",
                  title: `${trend.numerical_col} Timeline`,
                  subtitle: `Chronological resampled movement (Growth: ${trend.growth_rate_percentage}%)`,
                  x_data: pts.map((p: any) => p.date),
                  y_data: pts.map((p: any) => p.value),
                  series: [{ name: trend.numerical_col, data: pts.map((p: any) => p.value) }],
                };

                return (
                  <Card key={idx}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        {trend.numerical_col} Chronological Trend
                      </CardTitle>
                      <Badge variant={trend.growth_rate_percentage >= 0 ? "success" : "danger"}>
                        {trend.growth_rate_percentage >= 0 ? "+" : ""}
                        {trend.growth_rate_percentage}%
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <DynamicChart config={chartConfig} height={260} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Statistical Correlations */}
      {activeSubTab === "correlations" && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Activity className="w-4 h-4 text-blue-400" />
              Pairwise Pearson Correlation Matrix
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Measures linear dependency between numerical variables (-1.00 to +1.00).
            </p>
          </CardHeader>
          <CardContent>
            {correlations?.top_correlations?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                At least two numerical columns are required to compute statistical correlation.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {correlations.top_correlations.map((corr: any, idx: number) => {
                  const isPositive = corr.pearson > 0;
                  const absVal = Math.abs(corr.pearson);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={
                            absVal >= 0.7
                              ? isPositive ? "success" : "danger"
                              : absVal >= 0.4
                              ? "info"
                              : "default"
                          }
                        >
                          {corr.strength.replace("_", " ")}
                        </Badge>
                        <span className="font-mono text-base font-bold text-white">
                          r = {corr.pearson > 0 ? `+${corr.pearson}` : corr.pearson}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 mt-2">
                        {corr.column_x} <span className="text-slate-500 font-normal">↔</span> {corr.column_y}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        {absVal >= 0.7
                          ? `Strong ${isPositive ? "concordant" : "inverse"} relationship. Changes in one strongly track the other.`
                          : absVal >= 0.4
                          ? `Moderate association between ${corr.column_x} and ${corr.column_y}.`
                          : "Weak statistical correlation."}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. Outlier Analysis */}
      {activeSubTab === "outliers" && (
        <Card>
          <CardHeader>
            <CardTitle>
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Statistical Outlier Detections (IQR & Z-score)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outliers.length === 0 ? (
              <div className="p-12 text-center text-xs text-emerald-400">
                No extreme outliers identified outside standard statistical thresholds (1.5x IQR / |Z| &gt; 3).
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {outliers.map((out, idx) => (
                  <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        {out.column}
                        <Badge variant="warning">
                          {out.iqr_outliers_count} IQR Outliers
                        </Badge>
                        <Badge variant="outline">
                          {out.zscore_outliers_count} Z-Score (&gt;3σ)
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Expected Normal Range: <span className="font-mono text-slate-300">[{out.lower_bound}, {out.upper_bound}]</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                        Extreme Values Observed
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {out.sample_outlier_values?.map((v: number, vIdx: number) => (
                          <span
                            key={vIdx}
                            className="font-mono text-[11px] px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40"
                          >
                            {v.toLocaleString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
