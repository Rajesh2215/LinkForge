import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BarChart3, Globe, Smartphone, Monitor, QrCode,
  RefreshCw, ArrowUpRight, Clock, ShieldCheck, Activity,
  ArrowLeft, Link2, ChevronDown
} from 'lucide-react';
import { api, type AnalyticsData } from '../services/api';
import { useRecentLinks } from '../hooks/useRecentLinks';
import './AnalyticsDashboard.css';

// Country code to flag emoji helper
const getCountryFlag = (code: string) => {
  if (!code || code === 'Unknown' || code === 'Localhost') return '🌐';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default function AnalyticsDashboard() {
  const { shortCode: paramCode } = useParams<{ shortCode?: string }>();
  const navigate = useNavigate();
  const { links } = useRecentLinks();

  const activeCode = paramCode || (links.length > 0 ? links[0].shortCode : 'V3ZTpC');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (codeToFetch: string, isManual = false) => {
    if (!codeToFetch.trim()) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.getAnalytics(codeToFetch.trim());
      setData(res);
    } catch (err: any) {
      setError(err.message || `No analytics found for "/${codeToFetch}"`);
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeCode);
  }, [activeCode]);

  // Derived metrics
  const totalClicks = data?.totalClicks || 0;
  const qrClicks = data?.breakdown.referer.find((r) => r.name === 'qr-code')?.count || 0;
  const qrPercentage = totalClicks > 0 ? Math.round((qrClicks / totalClicks) * 100) : 0;
  const topCountry = data?.breakdown.country[0]?.name || 'N/A';
  const topDevice = data?.breakdown.device[0]?.name || 'N/A';

  return (
    <section className="analytics-section animate-fade-in">
      <div className="container">
        {/* Navigation Breadcrumb Bar */}
        <div className="analytics-nav-bar">
          <Link to="/" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            <span>Back to Shortener</span>
          </Link>
        </div>

        {/* Top Header Card */}
        <div className="analytics-header glass-panel">
          <div className="analytics-header-left">
            <div className="logo-icon analytics-icon">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="analytics-title-row">
                <h2>Telemetry & Click Analytics</h2>
                <span className="badge badge-info">Real-Time</span>
              </div>
              <p className="analytics-subtitle">
                Short link: <code>/{activeCode}</code> {data?.originalUrl && (
                  <>→ <a href={data.originalUrl} target="_blank" rel="noreferrer">{data.originalUrl} <ArrowUpRight size={12} /></a></>
                )}
              </p>
            </div>
          </div>

          <div className="analytics-header-actions">
            {/* Created Links Dropdown */}
            <div className="recent-links-dropdown-wrap" title="Select created short code">
              <Link2 size={13} className="dropdown-left-icon" />
              <select
                value={activeCode}
                onChange={(e) => {
                  if (e.target.value) {
                    navigate(`/analytics/${e.target.value}`);
                  }
                }}
                disabled={links.length === 0}
                className="input-field recent-links-select"
                aria-label="Select short code"
              >
                {links.length === 0 ? (
                  <option value="" disabled>
                    No links created
                  </option>
                ) : (
                  <>
                    {!links.some((l) => l.shortCode === activeCode) && (
                      <option value={activeCode}>{activeCode}</option>
                    )}
                    {links.map((link) => (
                      <option key={link.shortCode} value={link.shortCode}>
                        {link.shortCode}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown size={13} className="dropdown-chevron" />
            </div>

            <button
              type="button"
              onClick={() => fetchAnalytics(activeCode, true)}
              disabled={refreshing || loading}
              className="btn btn-secondary btn-sm"
              title="Refresh Analytics"
            >
              <RefreshCw size={14} className={refreshing ? 'spin-slow' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="loading-card glass-panel">
            <Activity size={24} className="spin-slow" />
            <p>Loading analytics data...</p>
          </div>
        )}

        {error && (
          <div className="error-banner mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && data && (
          <>
            {/* KPI Cards Row */}
            <div className="kpi-grid">
              <div className="card kpi-card">
                <div className="kpi-icon-wrap kpi-gradient-purple">
                  <Activity size={20} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Total Clicks</span>
                  <strong className="kpi-value gradient-text">{totalClicks.toLocaleString()}</strong>
                  <span className="kpi-subtext">Total recorded visits</span>
                </div>
              </div>

              <div className="card kpi-card">
                <div className="kpi-icon-wrap kpi-gradient-cyan">
                  <Globe size={20} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Top Location</span>
                  <strong className="kpi-value">
                    {getCountryFlag(topCountry)} {topCountry}
                  </strong>
                  <span className="kpi-subtext">Top visitor country</span>
                </div>
              </div>

              <div className="card kpi-card">
                <div className="kpi-icon-wrap kpi-gradient-emerald">
                  <QrCode size={20} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">QR Code Scans</span>
                  <strong className="kpi-value">
                    {qrClicks} <span className="kpi-pill">({qrPercentage}%)</span>
                  </strong>
                  <span className="kpi-subtext">Camera & QR attribution</span>
                </div>
              </div>

              <div className="card kpi-card">
                <div className="kpi-icon-wrap kpi-gradient-amber">
                  <Monitor size={20} />
                </div>
                <div className="kpi-data">
                  <span className="kpi-label">Primary Device</span>
                  <strong className="kpi-value">{topDevice}</strong>
                  <span className="kpi-subtext">Most active platform</span>
                </div>
              </div>
            </div>

            {/* Breakdowns 2-Column Grid */}
            <div className="breakdown-grid">
              {/* Geographic Breakdown */}
              <div className="card">
                <div className="breakdown-header">
                  <div className="breakdown-title">
                    <Globe size={18} className="text-cyan" />
                    <h3>Geographic Breakdown</h3>
                  </div>
                  <span className="badge badge-info">{data.breakdown.country.length} Regions</span>
                </div>

                <div className="progress-list">
                  {data.breakdown.country.length === 0 ? (
                    <p className="empty-text">No geographic clicks recorded yet.</p>
                  ) : (
                    data.breakdown.country.map((c) => {
                      const pct = totalClicks > 0 ? Math.round((c.count / totalClicks) * 100) : 0;
                      return (
                        <div key={c.name} className="progress-item">
                          <div className="progress-info">
                            <span className="progress-name">
                              {getCountryFlag(c.name)} {c.name}
                            </span>
                            <span className="progress-count">{c.count} ({pct}%)</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill fill-cyan" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Referrer & Channel Breakdown */}
              <div className="card">
                <div className="breakdown-header">
                  <div className="breakdown-title">
                    <ShieldCheck size={18} className="text-emerald" />
                    <h3>Referral Sources</h3>
                  </div>
                  <span className="badge badge-success">Scan vs Direct</span>
                </div>

                <div className="progress-list">
                  {data.breakdown.referer.length === 0 ? (
                    <p className="empty-text">No referral data recorded yet.</p>
                  ) : (
                    data.breakdown.referer.map((r) => {
                      const pct = totalClicks > 0 ? Math.round((r.count / totalClicks) * 100) : 0;
                      const isQr = r.name === 'qr-code';
                      return (
                        <div key={r.name} className="progress-item">
                          <div className="progress-info">
                            <span className="progress-name">
                              {isQr ? <span className="qr-tag"><QrCode size={12} /> QR Scan</span> : r.name}
                            </span>
                            <span className="progress-count">{r.count} ({pct}%)</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className={`progress-bar-fill ${isQr ? 'fill-emerald' : 'fill-purple'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Recent Clicks Table */}
            <div className="card mt-4">
              <div className="breakdown-header">
                <div className="breakdown-title">
                  <Clock size={18} className="text-purple" />
                  <h3>Recent Clicks</h3>
                </div>
                <span className="badge badge-info">Latest 10 Visits</span>
              </div>

              <div className="table-responsive">
                <table className="recent-clicks-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Location</th>
                      <th>Device & Browser</th>
                      <th>Referral Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.breakdown.recentClicks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 empty-text">
                          No recent clicks yet. Click or scan the link to see events appear!
                        </td>
                      </tr>
                    ) : (
                      data.breakdown.recentClicks.map((click, idx) => (
                        <tr key={idx} className="table-row">
                          <td className="time-cell">
                            {new Date(click.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="location-cell">
                            {getCountryFlag(click.country || 'Unknown')} {click.country || 'Unknown'}
                          </td>
                          <td className="device-cell">
                            {click.device === 'Mobile' ? <Smartphone size={14} /> : <Monitor size={14} />}
                            <span>{click.device} • {click.browser}</span>
                          </td>
                          <td>
                            {click.referer === 'qr-code' ? (
                              <span className="badge badge-success">
                                <QrCode size={11} /> QR Code
                              </span>
                            ) : (
                              <span className="badge badge-secondary">{click.referer}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
