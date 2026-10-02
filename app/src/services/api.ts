export interface ShortenedUrl {
  url: string;
  shortCode: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface MetricItem {
  name: string;
  count: number;
}

export interface RecentClick {
  timestamp: string;
  browser: string;
  device: string;
  referer: string;
  country?: string;
}

export interface AnalyticsData {
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  breakdown: {
    country: MetricItem[];
    browser: MetricItem[];
    device: MetricItem[];
    referer: MetricItem[];
    recentClicks: RecentClick[];
  };
}

export interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
}

export const api = {
  // Check backend server health
  async checkHealth(): Promise<HealthStatus | null> {
    try {
      const res = await fetch('/health');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Create a new shortened URL
  async createUrl(payload: {
    url: string;
    customAlias?: string;
    expiresAt?: string;
  }): Promise<ApiResponse<ShortenedUrl>> {
    const res = await fetch('/api/urls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to shorten URL');
    }
    return data;
  },

  // Get aggregated click analytics
  async getAnalytics(shortCode: string): Promise<AnalyticsData> {
    const res = await fetch(`/api/urls/${encodeURIComponent(shortCode)}/analytics`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to fetch analytics');
    }
    return data.data;
  },

  // Build the QR code image URL
  getQrCodeUrl(shortCode: string, format: 'png' | 'svg' = 'png'): string {
    return `/api/urls/${encodeURIComponent(shortCode)}/qr?format=${format}`;
  },

  // Build the public redirect URL
  getRedirectUrl(shortCode: string): string {
    return `${window.location.origin}/${shortCode}`;
  },
};
