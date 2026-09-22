"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Layers, 
  FileSpreadsheet,
  AlertTriangle
} from "lucide-react";
import { DatasetPreview, ColumnSummary } from "@/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface DataGridProps {
  datasetId: string;
  onRefresh?: () => void;
}

export function DataGrid({ datasetId }: DataGridProps) {
  const [data, setData] = useState<DatasetPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortDesc, setSortDesc] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const preview = await api.datasets.preview(datasetId, page, pageSize, search, sortBy, sortDesc);
      setData(preview);
    } catch (err: any) {
      setError(err.message || "Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [datasetId, page, pageSize, sortBy, sortDesc]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleSort = (colName: string) => {
    if (sortBy === colName) {
      if (sortDesc) {
        setSortBy("");
        setSortDesc(false);
      } else {
        setSortDesc(true);
      }
    } else {
      setSortBy(colName);
      setSortDesc(false);
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "numerical": return "info";
      case "datetime": return "purple";
      case "categorical": return "default";
      case "boolean": return "success";
      case "id": return "warning";
      default: return "outline";
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Grid Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across all cells..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">Filter</Button>
        </form>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400">
            {data ? (
              <span>
                Showing <strong className="text-white">{data.rows.length}</strong> of{" "}
                <strong className="text-white">{data.total_rows.toLocaleString()}</strong> rows ({data.total_columns} columns)
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <a
              href={api.datasets.getExportUrl(datasetId, "csv")}
              download
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <Download className="w-3 h-3" />
              CSV
            </a>
            <a
              href={api.datasets.getExportUrl(datasetId, "xlsx")}
              download
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <Download className="w-3 h-3" />
              Excel
            </a>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table View */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 shadow-lg flex-1 min-h-[400px] flex flex-col justify-between">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center p-20 text-xs text-slate-400 gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading records...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-xs text-rose-400 flex flex-col items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              <span>{error}</span>
            </div>
          ) : !data || data.rows.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500">
              No matching records found.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/90 sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-400 w-12 border-r border-slate-800/80 text-center">
                    #
                  </th>
                  {data.columns.map((col) => (
                    <th
                      key={col.name}
                      onClick={() => handleSort(col.name)}
                      className="py-2.5 px-3 font-semibold text-slate-200 border-r border-slate-800/80 cursor-pointer hover:bg-slate-800/60 transition select-none group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-white">{col.name}</span>
                          <Badge variant={getTypeBadgeVariant(col.inferred_type)} className="text-[9px] py-0 px-1">
                            {col.inferred_type}
                          </Badge>
                        </div>
                        <span className="text-slate-500 group-hover:text-slate-300">
                          {sortBy === col.name ? (
                            sortDesc ? <ArrowDown className="w-3 h-3 text-blue-400" /> : <ArrowUp className="w-3 h-3 text-blue-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                          )}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.rows.map((row, rowIdx) => {
                  const absoluteRowIdx = (page - 1) * pageSize + rowIdx + 1;
                  return (
                    <tr key={rowIdx} className="hover:bg-slate-900/40 transition">
                      <td className="py-2 px-3 text-center text-[10px] text-slate-500 border-r border-slate-800/60 font-mono">
                        {absoluteRowIdx}
                      </td>
                      {data.columns.map((col) => {
                        const cellVal = row[col.name];
                        const isNull = cellVal === null || cellVal === undefined;

                        return (
                          <td
                            key={col.name}
                            className="py-2 px-3 border-r border-slate-800/50 text-slate-300 whitespace-nowrap font-mono text-[11px]"
                          >
                            {isNull ? (
                              <span className="text-rose-400/70 italic text-[10px]">null</span>
                            ) : (
                              String(cellVal)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Grid Pagination Footer */}
        {data && data.total_pages > 1 && (
          <div className="p-3 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <strong className="text-white">{page}</strong> of <strong className="text-white">{data.total_pages}</strong>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
