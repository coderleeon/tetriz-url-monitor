import React from "react";
import { Monitor } from "@/lib/api";
import { Activity, Server, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface StatsBarProps {
  monitors: Monitor[];
}

export function StatsBar({ monitors }: StatsBarProps) {
  const total = monitors.length;
  const up = monitors.filter(m => m.latest_check?.is_up === true).length;
  const down = monitors.filter(m => m.latest_check?.is_up === false).length;
  const pending = monitors.filter(m => m.latest_check === null).length;

  // Calculate average response time of all UP monitors
  const responseTimes = monitors
    .map(m => m.latest_check?.response_time)
    .filter((t): t is number => typeof t === "number" && t > 0);
  
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((acc, curr) => acc + curr, 0) / responseTimes.length)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Card */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:border-slate-700">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Targets</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-100">{total}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Server className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Up Card */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:border-slate-700">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Online</p>
            <h3 className="text-3xl font-bold mt-1 text-emerald-400">{up}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <ArrowUpCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Down Card */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:border-slate-700">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Offline</p>
            <h3 className="text-3xl font-bold mt-1 text-rose-400">{down}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Avg Latency Card */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:border-slate-700">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Latency</p>
            <h3 className="text-3xl font-bold mt-1 text-amber-400">
              {avgResponseTime > 0 ? `${avgResponseTime}ms` : "N/A"}
            </h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
