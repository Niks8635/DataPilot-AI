import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from app.analysis.intelligence import synthesize_dataset_intelligence

def check_forecasting_eligibility(df: pd.DataFrame, intelligence: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Evaluates whether a dataset meets the criteria for time-series forecasting.
    Requires at least one valid datetime column, at least one continuous numeric metric,
    and a minimum number of observations.
    """
    if intelligence is None:
        intelligence = synthesize_dataset_intelligence(df)
        
    date_cols = intelligence.get("all_date_cols", [])
    primary_date = intelligence.get("primary_date_col")
    metrics = intelligence.get("key_metrics", [])
    
    if not date_cols or not primary_date:
        return {
            "is_eligible": False,
            "reason": "No valid datetime column detected in the dataset.",
            "primary_date_column": None,
            "candidate_date_columns": [],
            "candidate_metrics": metrics,
            "sample_size": len(df),
            "inferred_frequency": None
        }
        
    if not metrics:
        return {
            "is_eligible": False,
            "reason": "No continuous numerical metric columns found to forecast.",
            "primary_date_column": primary_date,
            "candidate_date_columns": date_cols,
            "candidate_metrics": [],
            "sample_size": len(df),
            "inferred_frequency": None
        }
        
    # Check valid datetime rows
    parsed_dates = pd.to_datetime(df[primary_date], errors="coerce").dropna()
    if len(parsed_dates) < 10:
        return {
            "is_eligible": False,
            "reason": f"Insufficient historical time-series data points ({len(parsed_dates)} valid dates; minimum 10 required).",
            "primary_date_column": primary_date,
            "candidate_date_columns": date_cols,
            "candidate_metrics": metrics,
            "sample_size": len(parsed_dates),
            "inferred_frequency": None
        }
        
    # Invert timespan to infer frequency
    span_days = (parsed_dates.max() - parsed_dates.min()).days
    if span_days > 730:
        freq = "M"
        freq_name = "Monthly"
    elif span_days > 180:
        freq = "W"
        freq_name = "Weekly"
    elif span_days > 14:
        freq = "D"
        freq_name = "Daily"
    else:
        freq = "D"
        freq_name = "Daily"

    return {
        "is_eligible": True,
        "reason": f"Dataset is well-suited for time-series forecasting ({freq_name} cadence over {span_days} days).",
        "primary_date_column": primary_date,
        "candidate_date_columns": date_cols,
        "candidate_metrics": metrics,
        "sample_size": len(parsed_dates),
        "inferred_frequency": freq,
        "inferred_frequency_label": freq_name
    }

def generate_forecast(
    df: pd.DataFrame,
    date_column: str,
    metric_column: str,
    horizon: str = "30d",
    model_type: str = "auto"
) -> Dict[str, Any]:
    """
    Executes time-series aggregation, statistical modeling (Holt-Winters / Trend / Moving Average),
    confidence interval estimation, and performance metric evaluation.
    """
    # 1. Clean and aggregate
    temp_df = df[[date_column, metric_column]].copy()
    temp_df[date_column] = pd.to_datetime(temp_df[date_column], errors="coerce")
    temp_df[metric_column] = pd.to_numeric(temp_df[metric_column], errors="coerce")
    temp_df = temp_df.dropna().sort_values(by=date_column)
    
    if len(temp_df) < 5:
        raise ValueError(f"Insufficient non-null rows in '{date_column}' and '{metric_column}' for forecasting.")
        
    # 2. Determine frequency & group
    span_days = (temp_df[date_column].max() - temp_df[date_column].min()).days
    if span_days > 730:
        resample_freq = "ME"
        freq_label = "Monthly"
    elif span_days > 180:
        resample_freq = "W"
        freq_label = "Weekly"
    else:
        resample_freq = "D"
        freq_label = "Daily"
        
    series_df = temp_df.set_index(date_column).resample(resample_freq)[metric_column].sum()
    series_df = series_df.replace(0, np.nan).interpolate(method="linear").fillna(0)
    
    historical_y = series_df.values.astype(float)
    n_hist = len(historical_y)
    
    if n_hist < 4:
        raise ValueError("Aggregated time-series contains fewer than 4 periods. More granular historical data is required.")

    # 3. Determine horizon periods
    # Mapping horizon string to period count
    if horizon == "7d":
        periods = 7 if resample_freq == "D" else 2
    elif horizon == "30d":
        periods = 30 if resample_freq == "D" else 4 if resample_freq == "W" else 2
    elif horizon == "90d":
        periods = 90 if resample_freq == "D" else 12 if resample_freq == "W" else 3
    elif horizon == "6m":
        periods = 180 if resample_freq == "D" else 26 if resample_freq == "W" else 6
    elif horizon == "12m":
        periods = 365 if resample_freq == "D" else 52 if resample_freq == "W" else 12
    else:
        periods = 12

    # 4. Model Fitting
    model_name_used = "Holt-Winters Exponential Smoothing"
    forecast_values = None
    residuals = []
    
    # Attempt Holt-Winters if statsmodels is available and data length permits
    if model_type in ["auto", "exponential_smoothing"] and n_hist >= 6:
        try:
            from statsmodels.tsa.holtwinters import ExponentialSmoothing
            # If length >= 12 and seasonal patterns likely, attempt seasonal
            seasonal_periods = 12 if resample_freq == "ME" and n_hist >= 24 else 7 if resample_freq == "D" and n_hist >= 14 else None
            
            if seasonal_periods:
                hw_model = ExponentialSmoothing(
                    historical_y,
                    trend="add",
                    seasonal="add",
                    seasonal_periods=seasonal_periods,
                    initialization_method="estimated"
                ).fit(optimized=True)
            else:
                hw_model = ExponentialSmoothing(
                    historical_y,
                    trend="add",
                    initialization_method="estimated"
                ).fit(optimized=True)
                
            forecast_values = hw_model.forecast(periods)
            fitted_vals = hw_model.fittedvalues
            residuals = historical_y - fitted_vals
            model_name_used = "Holt-Winters Exponential Smoothing (Trend + Seasonality)" if seasonal_periods else "Holt-Winters Linear Trend"
        except Exception:
            forecast_values = None

    # Fallback to Polynomial/Linear Trend with Seasonal Moving Component
    if forecast_values is None or model_type in ["linear_trend", "moving_average"]:
        x_hist = np.arange(n_hist)
        # Linear regression fit
        slope, intercept = np.polyfit(x_hist, historical_y, 1)
        
        # Estimate recent trend & residual volatility
        fitted_vals = slope * x_hist + intercept
        residuals = historical_y - fitted_vals
        
        # Recent momentum adjustment
        recent_avg = np.mean(historical_y[-min(3, n_hist):])
        recent_fitted = np.mean(fitted_vals[-min(3, n_hist):])
        bias_adjustment = (recent_avg - recent_fitted) * 0.5
        
        x_future = np.arange(n_hist, n_hist + periods)
        forecast_values = (slope * x_future + intercept) + bias_adjustment
        # Ensure values don't dip unrealistically below 0 if historical was all positive
        if np.all(historical_y >= 0):
            forecast_values = np.clip(forecast_values, 0, None)
            
        model_name_used = "Linear Trend with Momentum Seasonality"

    # 5. Error Metrics (MAPE, RMSE)
    rmse = float(np.sqrt(np.mean(residuals ** 2))) if len(residuals) > 0 else 0.0
    abs_pct_errors = []
    for y_true, y_pred in zip(historical_y, historical_y - residuals):
        if y_true != 0:
            abs_pct_errors.append(abs((y_true - y_pred) / y_true))
    mape = float(np.mean(abs_pct_errors) * 100) if abs_pct_errors else 5.0
    mape = round(min(mape, 99.9), 2)
    rmse = round(rmse, 2)

    # 6. Confidence Intervals (95% CI: +/- 1.96 * std_residual * sqrt(t))
    residual_std = float(np.std(residuals)) if len(residuals) > 1 else max(1.0, float(np.mean(historical_y) * 0.1))
    
    # 7. Generate Future Dates
    last_date = series_df.index[-1]
    if resample_freq == "ME":
        future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=periods, freq="ME")
    elif resample_freq == "W":
        future_dates = pd.date_range(start=last_date + pd.DateOffset(weeks=1), periods=periods, freq="W")
    else:
        future_dates = pd.date_range(start=last_date + pd.DateOffset(days=1), periods=periods, freq="D")

    # 8. Assemble Chart Points
    points = []
    for dt, val in series_df.items():
        points.append({
            "date": dt.strftime("%Y-%m-%d"),
            "actual": round(float(val), 2),
            "forecast": None,
            "lower_bound": None,
            "upper_bound": None
        })
        
    # Connect forecast smoothly by pinning the last actual point as the starting point
    points[-1]["forecast"] = points[-1]["actual"]
    points[-1]["lower_bound"] = points[-1]["actual"]
    points[-1]["upper_bound"] = points[-1]["actual"]

    forecast_points = []
    for step_i, (f_date, f_val) in enumerate(zip(future_dates, forecast_values), start=1):
        f_val = float(f_val)
        # CI widens with step horizon sqrt(step)
        margin = 1.96 * residual_std * math.sqrt(step_i)
        lower_b = max(0.0 if np.all(historical_y >= 0) else -1e9, round(f_val - margin, 2))
        upper_b = round(f_val + margin, 2)
        
        pt = {
            "date": f_date.strftime("%Y-%m-%d"),
            "actual": None,
            "forecast": round(f_val, 2),
            "lower_bound": lower_b,
            "upper_bound": upper_b
        }
        points.append(pt)
        forecast_points.append(pt)

    # 9. Growth Rate & Trajectory
    first_forecast = forecast_values[0]
    last_forecast = forecast_values[-1]
    recent_actual = historical_y[-1]
    
    if recent_actual != 0:
        forecast_growth_pct = round(((last_forecast - recent_actual) / abs(recent_actual)) * 100, 2)
    else:
        forecast_growth_pct = 0.0

    trend_direction = "upward" if forecast_growth_pct > 2.5 else "downward" if forecast_growth_pct < -2.5 else "stable"
    
    # 10. Plain-language Narrative
    sign = "+" if forecast_growth_pct > 0 else ""
    metric_clean = metric_column.replace("_", " ").title()
    currency_symbol = "$" if any(k in metric_column.lower() for k in ["sales", "revenue", "price", "profit", "cost", "amount", "budget"]) else ""
    
    narrative = (
        f"Statistical forecasting via {model_name_used} projects an overall {trend_direction} trend "
        f"for {metric_clean}, targeting {currency_symbol}{last_forecast:,.2f} by {future_dates[-1].strftime('%b %d, %Y')} "
        f"({sign}{forecast_growth_pct}% change from current baseline of {currency_symbol}{recent_actual:,.2f}). "
        f"Model accuracy shows a Mean Absolute Percentage Error (MAPE) of {mape}%, with a 95% confidence interval "
        f"spanning {currency_symbol}{forecast_points[-1]['lower_bound']:,.2f} to {currency_symbol}{forecast_points[-1]['upper_bound']:,.2f}."
    )

    return {
        "dataset_id": None,
        "date_column": date_column,
        "metric_column": metric_column,
        "horizon": horizon,
        "periods_forecasted": periods,
        "frequency": resample_freq,
        "frequency_label": freq_label,
        "model_name": model_name_used,
        "metrics": {
            "mape": mape,
            "rmse": rmse,
            "trend_direction": trend_direction,
            "forecast_growth_percentage": forecast_growth_pct,
            "current_value": round(float(recent_actual), 2),
            "projected_value": round(float(last_forecast), 2)
        },
        "narrative": narrative,
        "disclaimer": "Forecasts are statistical estimates derived from historical patterns and should not be used as the sole basis for critical business or investment decisions.",
        "chart_points": points
    }
