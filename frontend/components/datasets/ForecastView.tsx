"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Target, 
  Layers, 
  Sparkles, 
  RefreshCw,
  Info,
  CheckCircle2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { ForecastResult, DatasetProfile } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface ForecastViewProps {
  datasetId: string;
  profile?: DatasetProfile | null;
}

export function ForecastView({ datasetId, profile }: ForecastViewProps) {
  const [eligibility, setEligibility] = useState<any>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(true);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [forecasting, setForecasting] = useState(false);

  // Form parameters
  const [selectedDateCol, setSelectedDateCol] = useState("");
  const [selectedMetricCol, setSelectedMetricCol] = useState("");
  const [selectedHorizon, setSelectedHorizon] = useState("30d");
  const [selectedModel, setSelectedModel] = useState("auto");

  useEffect(() => {
    async function checkEligibility() {
      try {
        setLoadingEligibility(true);
        const elig = await api.analysis.forecastEligibility(datasetId);
        setEligibility(elig);
        if (elig.is_eligible) {
          setSelectedDateCol(elig.primary_date_column || elig.candidate_date_columns[0] || "");
          setSelectedMetricCol(elig.candidate_metrics[0] || "");
        }
      } catch (err) {
        console.error("Failed to check forecasting eligibility", err);
      } finally {
        setLoadingEligibility(false);
      }
    }
    checkEligibility();
  }, [datasetId]);

  const handleRunForecast = async () => {
    if (!selectedDateCol || !selectedMetricCol) return;
    try {
      setForecasting(true);
      const res = await api.analysis.forecast(datasetId, {
        date_column: selectedDateCol,
        metric_column: selectedMetricCol,
        horizon: selectedHorizon,
        model_type: selectedModel
      });
      setForecastResult(res);
    } catch (err: any) {
      alert("Failed to compute forecast: " + err.message);
    } finally {
      setForecasting(false);
    }
  };

  // Auto-run once eligibility is confirmed
  useEffect(() => {
    if (eligibility?.is_eligible && selectedDateCol && selectedMetricCol && !forecastResult && !forecasting) {
      handleRunForecast();
    }
  }, [eligibility, selectedDateCol, selectedMetricCol]);

  if (loadingEligibility) {
    return (
      <div className="p-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        Checking time-series forecasting eligibility...
      </div>
    );
  }

  if (!eligibility?.is_eligible) {
    return (
      <div className="p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Dataset Ineligible for Time-Series Forecasting</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {eligibility?.reason || "Forecasting requires at least one valid datetime column and a continuous numerical metric with a minimum of 10 chronological observations."}
        </p>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs text-slate-400 space-y-2">
          <div className="font-semibold text-slate-300">Requirements for Time-Series Forecasting:</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>A recognized date or timestamp column (e.g. <code>order_date</code>, <code>created_at</code>)</li>
            <li>A measurable continuous metric (e.g. <code>sales</code>, <code>revenue</code>, <code>temperature</code>)</li>
            <li>At least 10 observations to construct robust statistical trend lines</li>
          </ul>
        </div>
      </div>
    );
  }

  const chartPoints = forecastResult?.chart_points || [];

  return (
    <div className="space-y-6">
      {/* Forecasting Control Panel */}
      <Card className="p-5 border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Date Column */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Date Column
            </label>
            <select
              value={selectedDateCol}
              onChange={(e) => setSelectedDateCol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              {eligibility.candidate_date_columns.map((c: string) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Column */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              Forecast Metric
            </label>
            <select
              value={selectedMetricCol}
              onChange={(e) => setSelectedMetricCol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              {eligibility.candidate_metrics.map((m: string) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Horizon */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Forecast Horizon
            </label>
            <select
              value={selectedHorizon}
              onChange={(e) => setSelectedHorizon(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="7d">Next 7 Days</option>
              <option value="30d">Next 30 Days (1 Month)</option>
              <option value="90d">Next 90 Days (1 Quarter)</option>
              <option value="6m">Next 6 Months</option>
              <option value="12m">Next 12 Months (1 Year)</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Statistical Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="auto">Auto (Holt-Winters / Trend)</option>
              <option value="exponential_smoothing">Holt-Winters Exponential Smoothing</option>
              <option value="linear_trend">Linear Trend + Seasonality</option>
            </select>
          </div>

          {/* Action Button */}
          <div>
            <Button
              variant="primary"
              size="md"
              className="w-full text-xs font-semibold"
              onClick={handleRunForecast}
              loading={forecasting}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Generate Forecast
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Forecast Results Presentation */}
      {forecastResult && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 bg-slate-900 border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Projected Target</div>
              <div className="text-2xl font-bold text-white mt-1 font-mono">
                ${forecastResult.metrics.projected_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Baseline: ${forecastResult.metrics.current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </Card>

            <Card className="p-4 bg-slate-900 border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Expected Growth</div>
              <div className={`text-2xl font-bold mt-1 font-mono ${
                forecastResult.metrics.forecast_growth_percentage > 0 ? "text-emerald-400" :
                forecastResult.metrics.forecast_growth_percentage < 0 ? "text-rose-400" : "text-slate-200"
              }`}>
                {forecastResult.metrics.forecast_growth_percentage > 0 ? "+" : ""}
                {forecastResult.metrics.forecast_growth_percentage}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1 capitalize">
                Trajectory: {forecastResult.metrics.trend_direction}
              </div>
            </Card>

            <Card className="p-4 bg-slate-900 border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Model Accuracy</div>
              <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">
                {forecastResult.metrics.mape}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                MAPE (Mean Abs % Error)
              </div>
            </Card>

            <Card className="p-4 bg-slate-900 border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">RMSE Dispersion</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
                {forecastResult.metrics.rmse}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Root Mean Squared Error
              </div>
            </Card>
          </div>

          {/* Interactive Recharts Forecast Visualization */}
          <Card className="p-6 border-slate-800 bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Actual vs Projected Trajectory with 95% Confidence Bounds
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Model: {forecastResult.model_name} • Cadence: {forecastResult.frequency_label} • Horizon: {forecastResult.periods_forecasted} periods
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-3 h-0.5 bg-blue-500 inline-block" /> Actual Data
                </span>
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-3 h-0.5 bg-cyan-400 border-b border-dashed border-cyan-300 inline-block" /> Forecast
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-2 bg-cyan-500/20 rounded inline-block" /> 95% CI Band
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartPoints} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    tickFormatter={(val) => val ? val.slice(5) : ""}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    tickFormatter={(val) => `$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: any, name: any) => [
                      value !== null && value !== undefined ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-",
                      name === "actual" ? "Actual" : name === "forecast" ? "Forecast" : name === "upper_bound" ? "Upper 95% CI" : "Lower 95% CI"
                    ]}
                  />

                  {/* 95% CI Shaded Area */}
                  <Area
                    type="monotone"
                    dataKey="upper_bound"
                    stroke="none"
                    fill="#06b6d4"
                    fillOpacity={0.15}
                    name="upper_bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower_bound"
                    stroke="none"
                    fill="#020617"
                    fillOpacity={0.8}
                    name="lower_bound"
                  />

                  {/* Solid line for historical actuals */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: "#3b82f6" }}
                    name="actual"
                  />

                  {/* Dashed line for forecast points */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: "#06b6d4" }}
                    name="forecast"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Plain-Language Narrative & Disclaimer */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <Info className="w-4 h-4" />
              Executive Forecast Narrative
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {forecastResult.narrative}
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>{forecastResult.disclaimer}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
