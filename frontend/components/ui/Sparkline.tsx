import React, { useId } from "react";

interface SparklineProps {
  data: number[];
  color?: "blue" | "emerald" | "amber" | "violet" | "rose" | "cyan" | "indigo";
  height?: number;
  width?: number;
  className?: string;
}

const COLOR_MAP = {
  blue: {
    stroke: "#3b82f6",
    fillStart: "rgba(59, 130, 246, 0.35)",
    fillEnd: "rgba(59, 130, 246, 0.0)",
  },
  emerald: {
    stroke: "#10b981",
    fillStart: "rgba(16, 185, 129, 0.35)",
    fillEnd: "rgba(16, 185, 129, 0.0)",
  },
  amber: {
    stroke: "#6366f1",
    fillStart: "rgba(99, 102, 241, 0.35)",
    fillEnd: "rgba(99, 102, 241, 0.0)",
  },
  indigo: {
    stroke: "#6366f1",
    fillStart: "rgba(99, 102, 241, 0.35)",
    fillEnd: "rgba(99, 102, 241, 0.0)",
  },
  violet: {
    stroke: "#8b5cf6",
    fillStart: "rgba(139, 92, 246, 0.35)",
    fillEnd: "rgba(139, 92, 246, 0.0)",
  },
  rose: {
    stroke: "#f43f5e",
    fillStart: "rgba(244, 63, 94, 0.35)",
    fillEnd: "rgba(244, 63, 94, 0.0)",
  },
  cyan: {
    stroke: "#06b6d4",
    fillStart: "rgba(6, 182, 212, 0.35)",
    fillEnd: "rgba(6, 182, 212, 0.0)",
  },
};

export function Sparkline({
  data,
  color = "blue",
  height = 40,
  width = 120,
  className = "",
}: SparklineProps) {
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `spark-grad-${color}-${safeId}`;

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const paddingY = 4;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * (height - paddingY * 2);
    return { x, y };
  });

  // Construct smooth bezier SVG curve path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX1 = curr.x + (next.x - curr.x) / 2;
    const cpY1 = curr.y;
    const cpX2 = curr.x + (next.x - curr.x) / 2;
    const cpY2 = next.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
  }

  // Construct fill area path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const theme = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div className={`inline-block overflow-visible ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.fillStart} />
            <stop offset="100%" stopColor={theme.fillEnd} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={theme.stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glowing pulse dot at the last point */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="2.5"
          fill={theme.stroke}
          className="filter drop-shadow-[0_0_4px_rgba(255,255,255,0.7)]"
        />
      </svg>
    </div>
  );
}
