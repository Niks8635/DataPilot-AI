"use client";

import React, { useState, useMemo } from "react";
import { Table, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { TableWidgetConfig } from "@/types";

interface TableWidgetProps {
  title: string;
  config: TableWidgetConfig;
  rows: Record<string, any>[];
  theme?: "dark" | "light";
  onRowClick?: (row: Record<string, any>) => void;
}

export function TableWidget({
  title,
  config,
  rows,
  theme = "dark",
  onRowClick,
}: TableWidgetProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>(config.sort_by || "");
  const [sortDesc, setSortDesc] = useState<boolean>(config.sort_desc || false);

  const isDark = theme === "dark";
  const pageSize = config.page_size || 5;

  const displayColumns = useMemo(() => {
    if (config.columns && config.columns.length > 0) return config.columns;
    if (rows && rows.length > 0) return Object.keys(rows[0]).slice(0, 6);
    return [];
  }, [config.columns, rows]);

  // Filter & Sort
  const processedRows = useMemo(() => {
    let list = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        displayColumns.some((c) => String(r[c] ?? "").toLowerCase().includes(q))
      );
    }

    if (sortBy) {
      list.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (typeof valA === "number" && typeof valB === "number") {
          return sortDesc ? valB - valA : valA - valB;
        }
        return sortDesc
          ? String(valB ?? "").localeCompare(String(valA ?? ""))
          : String(valA ?? "").localeCompare(String(valB ?? ""));
      });
    }

    return list;
  }, [rows, search, sortBy, sortDesc, displayColumns]);

  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const pageRows = processedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(col);
      setSortDesc(false);
    }
  };

  // Compute column totals for numeric columns
  const columnTotals = useMemo(() => {
    if (!config.show_totals) return null;
    const totals: Record<string, number | null> = {};
    displayColumns.forEach((c) => {
      const numericVals = processedRows
        .map((r) => Number(r[c]))
        .filter((v) => !isNaN(v) && isFinite(v));
      if (numericVals.length > 0 && numericVals.length === processedRows.length) {
        totals[c] = numericVals.reduce((a, b) => a + b, 0);
      } else {
        totals[c] = null;
      }
    });
    return totals;
  }, [processedRows, displayColumns, config.show_totals]);

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header & In-Table Search */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Table className="w-3.5 h-3.5 text-blue-400" />
          <span>{title || "Data Table"}</span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({processedRows.length.toLocaleString()} rows)
          </span>
        </div>

        <div className="relative w-40">
          <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
          <input
            type="text"
            placeholder="Search table..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full pl-6 pr-2 py-1 rounded text-[11px] outline-none border transition-colors ${
              isDark
                ? "bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500"
                : "bg-slate-100 border-slate-300 text-slate-900 focus:border-blue-500"
            }`}
          />
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-60 rounded-lg border border-slate-800/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead
            className={`sticky top-0 z-10 text-[11px] font-semibold uppercase tracking-wider ${
              isDark ? "bg-slate-950 text-slate-400" : "bg-slate-100 text-slate-600"
            }`}
          >
            <tr className="border-b border-slate-800/80">
              {displayColumns.map((col, idx) => (
                <th
                  key={`th-${col}-${idx}`}
                  onClick={() => handleSort(col)}
                  className="py-2 px-3 cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>{col}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`divide-y text-[11px] font-mono ${
              isDark ? "divide-slate-800/50 text-slate-300" : "divide-slate-200 text-slate-700"
            }`}
          >
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={displayColumns.length} className="text-center py-6 text-slate-500 italic font-sans">
                  No records matching filter
                </td>
              </tr>
            ) : (
              pageRows.map((row, rIdx) => (
                <tr
                  key={`row-${rIdx}`}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors cursor-pointer ${
                    isDark ? "hover:bg-slate-800/60" : "hover:bg-slate-100"
                  }`}
                >
                  {displayColumns.map((col, cIdx) => {
                    const val = row[col];
                    const isNum = typeof val === "number";
                    return (
                      <td key={`cell-${rIdx}-${col}-${cIdx}`} className="py-2 px-3 whitespace-nowrap">
                        {isNum ? val.toLocaleString() : String(val ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>

          {/* Optional Totals Footer */}
          {columnTotals && processedRows.length > 0 && (
            <tfoot
              className={`sticky bottom-0 font-semibold text-[11px] font-mono border-t ${
                isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-300 text-slate-900"
              }`}
            >
              <tr>
                {displayColumns.map((col, cIdx) => (
                  <td key={`tot-${col}-${cIdx}`} className="py-2 px-3 whitespace-nowrap">
                    {cIdx === 0
                      ? `Total (${processedRows.length})`
                      : columnTotals[col] !== null
                      ? columnTotals[col]?.toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2 mt-1 text-[11px] text-slate-400">
        <span>
          Showing {Math.min((currentPage - 1) * pageSize + 1, processedRows.length)}–
          {Math.min(currentPage * pageSize, processedRows.length)} of {processedRows.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-slate-300 px-1">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
