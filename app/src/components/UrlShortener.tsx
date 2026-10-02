import React, { useState } from 'react';
import {
  Link2, Sparkles, ChevronDown, ChevronUp, Copy, Check,
  QrCode, BarChart3, ExternalLink, Calendar, AlertCircle, ArrowRight
} from 'lucide-react';
import { api, type ShortenedUrl } from '../services/api';
import './UrlShortener.css';

interface UrlShortenerProps {
  onOpenQr?: (shortCode: string) => void;
  onSelectAnalytics?: (shortCode: string) => void;
}

export default function UrlShortener({ onOpenQr, onSelectAnalytics }: UrlShortenerProps) {
  const [url, setUrl] = useState('https://github.com/react');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShortenedUrl | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await api.createUrl({
        url: url.trim(),
        customAlias: customAlias.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });

      if (res.data) {
        setResult(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const shortLink = `${window.location.origin}/${result.shortCode}`;
    navigator.clipboard.writeText(shortLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="shortener-section">
      <div className="container">
        {/* Hero Headline */}
        <div className="hero-text text-center">
          <div className="badge badge-info mb-3">
            <Sparkles size={12} /> Sub-2ms Redirects • Kafka Click Stream
          </div>
          <h1 className="hero-title">
            Shorten Links. Analyze Traffic. <br />
            <span className="gradient-text">Zero Latency.</span>
          </h1>
          <p className="hero-subtitle">
            Enterprise URL shortener backed by Redis Cache-Aside, BullMQ cron expiry,
            and real-time Kafka event streaming.
          </p>
        </div>

        {/* Shortener Card */}
        <div className="shortener-card glass-panel">
          <form onSubmit={handleSubmit}>
            <div className="input-row">
              <div className="main-input-wrap">
                <Link2 className="input-icon" size={20} />
                <input
                  type="url"
                  required
                  placeholder="Paste your long link here (e.g. https://example.com/very-long-url)..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-field main-url-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="btn btn-primary shorten-submit-btn"
              >
                {loading ? (
                  <span>Shortening...</span>
                ) : (
                  <>
                    <span>Shorten</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            {/* Advanced Options Toggle */}
            <div className="options-toggle-row">
              <button
                type="button"
                className="options-toggle-btn"
                onClick={() => setShowOptions(!showOptions)}
              >
                <span>Advanced Options (Custom Alias & Expiry)</span>
                {showOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Expandable Options */}
            {showOptions && (
              <div className="options-grid animate-fade-in">
                <div className="input-group">
                  <label className="input-label">Custom Alias (Optional)</label>
                  <div className="alias-input-wrap">
                    <span className="alias-domain">linkforge.io/</span>
                    <input
                      type="text"
                      placeholder="my-link"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                      className="input-field alias-input"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </form>

          {/* Error Message */}
          {error && (
            <div className="error-banner animate-fade-in">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Shortened Result Card */}
        {result && (
          <div className="result-card glass-panel animate-fade-in">
            <div className="result-header">
              <span className="badge badge-success">
                <Check size={12} /> Link Created Successfully
              </span>
              {result.expiresAt && (
                <span className="badge badge-info">
                  Expires: {new Date(result.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="result-body">
              <div className="result-url-box">
                <span className="short-url-text">
                  {window.location.origin}/
                  <strong className="gradient-text">{result.shortCode}</strong>
                </span>
                <span className="original-url-text" title={result.url}>
                  → {result.url}
                </span>
              </div>

              <div className="result-actions">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`btn ${copied ? 'btn-copied' : 'btn-primary'}`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>

                {onOpenQr && (
                  <button
                    type="button"
                    onClick={() => onOpenQr(result.shortCode)}
                    className="btn btn-secondary"
                  >
                    <QrCode size={16} />
                    <span>QR Code</span>
                  </button>
                )}

                {onSelectAnalytics && (
                  <button
                    type="button"
                    onClick={() => onSelectAnalytics(result.shortCode)}
                    className="btn btn-secondary"
                  >
                    <BarChart3 size={16} />
                    <span>Analytics</span>
                  </button>
                )}

                <a
                  href={`/${result.shortCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-icon-only"
                  title="Visit Link"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
