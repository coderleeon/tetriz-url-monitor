import { useState, useEffect, useCallback, useRef } from "react";
import { Monitor, getMonitors, createMonitor, deleteMonitor } from "@/lib/api";

interface UseMonitorsResult {
  monitors: Monitor[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (url: string, name: string) => Promise<Monitor>;
  remove: (id: number) => Promise<void>;
}

export function useMonitors(pollIntervalMs = 5000): UseMonitorsResult {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track active fetch to avoid race conditions
  const fetchCounter = useRef(0);

  const refresh = useCallback(async () => {
    const currentFetchId = ++fetchCounter.current;
    try {
      const data = await getMonitors();
      // Only set state if this was the latest initiated fetch
      if (currentFetchId === fetchCounter.current) {
        setMonitors(data);
        setError(null);
      }
    } catch (err: any) {
      if (currentFetchId === fetchCounter.current) {
        setError(err.message || "Failed to fetch monitors");
      }
    } finally {
      if (currentFetchId === fetchCounter.current) {
        setLoading(false);
      }
    }
  }, []);

  // Poll setup
  useEffect(() => {
    refresh(); // initial fetch

    const timer = setInterval(() => {
      refresh();
    }, pollIntervalMs);

    return () => clearInterval(timer);
  }, [refresh, pollIntervalMs]);

  const add = async (url: string, name: string): Promise<Monitor> => {
    try {
      const newMonitor = await createMonitor(url, name);
      // Optimistic UI updates / trigger refresh
      setMonitors(prev => [
        { ...newMonitor, latest_check: null },
        ...prev
      ]);
      await refresh();
      return newMonitor;
    } catch (err: any) {
      throw err;
    }
  };

  const remove = async (id: number): Promise<void> => {
    // Save previous state for rollback on error
    const prevMonitors = [...monitors];
    try {
      // Optimistically remove from state
      setMonitors(prev => prev.filter(m => m.id !== id));
      await deleteMonitor(id);
    } catch (err: any) {
      // Rollback on error
      setMonitors(prevMonitors);
      throw err;
    }
  };

  return {
    monitors,
    loading,
    error,
    refresh,
    add,
    remove,
  };
}
