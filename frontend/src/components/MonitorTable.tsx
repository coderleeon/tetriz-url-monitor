import React, { useState } from "react";
import { Monitor, Check, getMonitorChecks } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { Trash2, History, ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";

interface MonitorTableProps {
  monitors: Monitor[];
  onDelete: (id: number) => Promise<void>;
}

export function MonitorTable({ monitors, onDelete }: MonitorTableProps) {
  const [expandedMonitorId, setExpandedMonitorId] = useState<number | null>(null);
  const [history, setHistory] = useState<Check[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const handleToggleExpand = async (monitorId: number) => {
    if (expandedMonitorId === monitorId) {
      setExpandedMonitorId(null);
      setHistory([]);
      return;
    }

    setExpandedMonitorId(monitorId);
    setLoadingHistory(true);
    try {
      const response = await getMonitorChecks(monitorId, 10);
      setHistory(response.items);
    } catch (err) {
      console.error("Failed to load checks history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const refreshHistory = async (monitorId: number) => {
    setLoadingHistory(true);
    try {
      const response = await getMonitorChecks(monitorId, 10);
      setHistory(response.items);
    } catch (err) {
      console.error("Failed to load checks history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteClick = async (monitorId: number) => {
    if (!confirm("Are you sure you want to delete this monitor and all of its history?")) {
      return;
    }

    setDeletingIds(prev => [...prev, monitorId]);
    try {
      await onDelete(monitorId);
      if (expandedMonitorId === monitorId) {
        setExpandedMonitorId(null);
        setHistory([]);
      }
    } catch (err) {
      alert("Failed to delete monitor target.");
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== monitorId));
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/40">
              <th className="py-4 px-6">Target</th>
              <th className="py-4 px-6 text-center">Status</th>
              <th className="py-4 px-6 text-right">Latest Latency</th>
              <th className="py-4 px-6 text-right">Last Checked</th>
              <th className="py-4 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {monitors.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No monitor targets registered. Add a target URL above to start monitoring.
                </td>
              </tr>
            ) : (
              monitors.map((monitor) => {
                const isExpanded = expandedMonitorId === monitor.id;
                const isDeleting = deletingIds.includes(monitor.id);
                const check = monitor.latest_check;
                
                return (
                  <React.Fragment key={monitor.id}>
                    <tr className={`transition-colors hover:bg-slate-900/20 ${isExpanded ? 'bg-slate-900/30' : ''}`}>
                      {/* Target info */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-100">{monitor.name}</div>
                        <a 
                          href={monitor.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline inline-block mt-0.5 truncate max-w-xs md:max-w-md"
                        >
                          {monitor.url}
                        </a>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <StatusBadge isUp={check ? check.is_up : null} />
                      </td>

                      {/* Latency */}
                      <td className="py-4 px-6 text-right">
                        {check && check.response_time !== null ? (
                          <span className={`font-mono font-semibold ${
                            check.response_time < 200 ? 'text-emerald-400' :
                            check.response_time < 500 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {Math.round(check.response_time)} ms
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">-</span>
                        )}
                      </td>

                      {/* Last Checked */}
                      <td className="py-4 px-6 text-right text-slate-300 font-mono text-xs">
                        {check ? formatTime(check.checked_at) : "Never"}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleToggleExpand(monitor.id)}
                            className={`p-2 rounded-lg transition-colors border ${
                              isExpanded 
                                ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300' 
                                : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            } cursor-pointer`}
                            title="View History Logs"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteClick(monitor.id)}
                            disabled={isDeleting}
                            className="p-2 rounded-lg bg-rose-950/10 border border-rose-900/20 text-rose-400 hover:bg-rose-950/30 hover:border-rose-900/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            title="Delete Target"
                          >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline history expansion */}
                    {isExpanded && (
                      <tr className="bg-slate-950/40">
                        <td colSpan={5} className="py-4 px-6">
                          <div className="border border-slate-800/80 rounded-xl p-4 bg-slate-900/20">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center">
                                <History className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                                Recent Performance Logs (Last 10 Pings)
                              </h4>
                              <button
                                onClick={() => refreshHistory(monitor.id)}
                                disabled={loadingHistory}
                                className="flex items-center text-xs text-slate-400 hover:text-slate-200 cursor-pointer disabled:opacity-40"
                              >
                                <RefreshCw className={`w-3 h-3 mr-1 ${loadingHistory ? 'animate-spin' : ''}`} />
                                Refresh History
                              </button>
                            </div>

                            {loadingHistory ? (
                              <div className="flex items-center justify-center py-6 text-slate-500 text-xs">
                                <Loader2 className="w-4 h-4 animate-spin mr-2 text-indigo-500" />
                                Loading history data...
                              </div>
                            ) : history.length === 0 ? (
                              <div className="text-center py-6 text-xs text-slate-500">
                                No check history found. Checks occur automatically every minute.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {history.map((h) => (
                                  <div 
                                    key={h.id} 
                                    className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                                      h.is_up 
                                        ? 'bg-emerald-950/5 border-emerald-900/10' 
                                        : 'bg-rose-950/5 border-rose-900/10'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        h.is_up ? 'bg-emerald-500' : 'bg-rose-500'
                                      }`}></span>
                                      <span className="font-mono text-slate-400">{formatTime(h.checked_at)}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      {h.is_up ? (
                                        <>
                                          <span className="text-slate-400 font-mono">Code: {h.status_code}</span>
                                          <span className="font-mono font-semibold text-emerald-400">
                                            {h.response_time !== null ? `${Math.round(h.response_time)}ms` : "N/A"}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-rose-400 font-medium font-mono truncate max-w-[150px] md:max-w-[200px]" title={h.error || "Unknown error"}>
                                          {h.error || `HTTP ${h.status_code || 'Err'}`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
