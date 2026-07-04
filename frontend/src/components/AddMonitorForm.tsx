import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

interface AddMonitorFormProps {
  onAdd: (url: string, name: string) => Promise<any>;
}

export function AddMonitorForm({ onAdd }: AddMonitorFormProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client validation
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName || !trimmedUrl) {
      setError("Both Name and URL are required.");
      return;
    }

    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return;
    }

    setSubmitting(true);
    try {
      await onAdd(trimmedUrl, trimmedName);
      setName("");
      setUrl("");
    } catch (err: any) {
      setError(err.message || "Failed to add target.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl mb-8">
      <h2 className="text-lg font-semibold mb-4 text-slate-100 flex items-center">
        <Plus className="w-5 h-5 mr-2 text-indigo-400" />
        Add New Monitor Target
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="monitor-name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Target Name
            </label>
            <input
              id="monitor-name"
              type="text"
              placeholder="e.g. Google Search"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>
          <div>
            <label htmlFor="monitor-url" className="block text-sm font-medium text-slate-300 mb-1.5">
              Target URL
            </label>
            <input
              id="monitor-url"
              type="text"
              placeholder="e.g. https://www.google.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm transition-all duration-200 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 disabled:bg-indigo-600/50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Target...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Target
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
