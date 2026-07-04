"use client";

import React from "react";
import { useMonitors } from "@/hooks/useMonitors";
import { StatsBar } from "@/components/StatsBar";
import { AddMonitorForm } from "@/components/AddMonitorForm";
import { MonitorTable } from "@/components/MonitorTable";
import { Activity, AlertCircle, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const { monitors, loading, error, add, remove, refresh } = useMonitors(5000);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Tetriz URL Monitor
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1.5 ml-0.5">
            Real-time server uptime, responsiveness, and performance checker.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          {/* Status Indicator */}
          <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-slate-400 uppercase bg-slate-900/50 px-3.5 py-2 rounded-xl border border-slate-800/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Polling (5s)</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refresh()}
            className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Force Reload Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main error handling */}
      {error && (
        <div className="mb-6 flex items-start space-x-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Dashboard Connection Error</h4>
            <p className="text-xs text-rose-300/80 mt-1">
              Could not communicate with the API backend: "{error}". Please make sure your FastAPI backend service is running and accessible.
            </p>
          </div>
        </div>
      )}

      {loading && monitors.length === 0 ? (
        <div className="space-y-6">
          {/* Skeleton loading placeholders */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-panel h-24 rounded-2xl animate-pulse"></div>
            ))}
          </div>
          <div className="glass-panel h-48 rounded-2xl animate-pulse"></div>
          <div className="glass-panel h-64 rounded-2xl animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* Overview Statistics Cards */}
          <StatsBar monitors={monitors} />

          {/* Form to Add Target */}
          <AddMonitorForm onAdd={add} />

          {/* Table displaying monitor lists */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-200">Monitored Webpages</h3>
              <span className="text-xs text-slate-400">{monitors.length} active configurations</span>
            </div>
            <MonitorTable monitors={monitors} onDelete={remove} />
          </section>
        </>
      )}
    </div>
  );
}
