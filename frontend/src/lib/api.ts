const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface LatestCheck {
  status_code: number | null;
  response_time: number | null;
  is_up: boolean;
  checked_at: string;
}

export interface Monitor {
  id: number;
  url: string;
  name: string;
  is_active: boolean;
  created_at: string;
  latest_check: LatestCheck | null;
}

export interface Check {
  id: number;
  status_code: number | null;
  response_time: number | null;
  is_up: boolean;
  error: string | null;
  checked_at: string;
}

export interface CheckHistoryResponse {
  total: number;
  items: Check[];
}

export async function getMonitors(): Promise<Monitor[]> {
  const response = await fetch(`${API_BASE_URL}/monitors`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch monitors: ${response.statusText}`);
  }
  return response.json();
}

export async function createMonitor(url: string, name: string): Promise<Monitor> {
  const response = await fetch(`${API_BASE_URL}/monitors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, name }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Failed to create monitor: ${response.statusText}`;
    // If it's a validation error array, convert to readable string
    if (Array.isArray(message)) {
      throw new Error(message.map(err => `${err.loc.join('.')}: ${err.msg}`).join(", "));
    }
    throw new Error(message);
  }
  return response.json();
}

export async function deleteMonitor(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/monitors/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete monitor: ${response.statusText}`);
  }
}

export async function getMonitorChecks(id: number, limit = 50, offset = 0): Promise<CheckHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/monitors/${id}/checks?limit=${limit}&offset=${offset}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch checks: ${response.statusText}`);
  }
  return response.json();
}
