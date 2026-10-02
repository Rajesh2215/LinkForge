import React, { useState } from 'react';
import {
  Link2, Copy, Check, QrCode, BarChart3, ExternalLink,
  Trash2, RefreshCw, Clock, ArrowUpRight
} from 'lucide-react';
import type { RecentLink } from '../hooks/useRecentLinks';
import './RecentLinks.css';

interface RecentLinksProps {
  links: RecentLink[];
  refreshing: boolean;
  onRefreshClicks: () => void;
  onRemoveLink: (shortCode: string) => void;
  onClearAll: () => void;
  onOpenQr: (shortCode: string) => void;
  onSelectAnalytics: (shortCode: string) => void;
}

export default function RecentLinks({
  links,
  refreshing,
  onRefreshClicks,
  onRemoveLink,
  onClearAll,
  onOpenQr,
  onSelectAnalytics,
}: RecentLinksProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (shortCode: string) => {
    const fullUrl = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(shortCode);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  if (links.length === 0) {
    return (
      <section className="recent-links-section">
        <div className="container">
          <div className="recent-links-card">
            <div className="recent-links-empty">
              <div className="empty-icon-wrap">
                <Link2 size={24} />
              </div>
              <h3 className="empty-title">No Links Created Yet</h3>
              <p className="empty-desc">
                Shorten your first link above. Your history will be preserved right here in your browser,
                no account or sign-in required!
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="recent-links-section">
      <div className="container">
        <div className="recent-links-card">
          {/* Header */}
          <div className="recent-links-header">
            <div className="recent-links-title-wrap">
              <h2 className="recent-links-title">
                <Clock size={20} className="text-primary" />
                <span>Your Recent Links</span>
              </h2>
              <span className="recent-links-count">{links.length} {links.length === 1 ? 'link' : 'links'}</span>
            </div>

            <div className="recent-links-controls">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onRefreshClicks}
                disabled={refreshing}
                title="Refresh latest click counts"
              >
                <RefreshCw size={14} className={refreshing ? 'spin-icon' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh Stats'}</span>
              </button>

              <button
                type="button"
                className="btn-danger-ghost btn-sm"
                onClick={() => {
                  if (window.confirm('Clear all your saved link history from this browser?')) {
                    onClearAll();
                  }
                }}
                title="Clear local history"
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* List of Links */}
          <div className="recent-links-list">
            {links.map((link) => {
              const isCopied = copiedCode === link.shortCode;

              return (
                <div key={link.shortCode} className="recent-link-item">
                  <div className="recent-link-main">
                    <div className="recent-link-short-row">
                      <button
                        type="button"
                        className="recent-link-code"
                        onClick={() => handleCopy(link.shortCode)}
                        title="Click to copy"
                      >
                        <span>/{link.shortCode}</span>
                        {isCopied ? <Check size={14} color="#34d399" /> : <Copy size={13} />}
                      </button>

                      {/* Clicks badge */}
                      <span className="clicks-badge" title="Total clicks recorded">
                        <BarChart3 size={12} />
                        <span>{link.clicks ?? 0} {link.clicks === 1 ? 'click' : 'clicks'}</span>
                      </span>

                      {/* Created date/time */}
                      <span className="recent-link-meta">
                        • {formatTime(link.createdAt)}
                      </span>

                      {/* Expiration badge if set */}
                      {link.expiresAt && (
                        <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                          Exp: {new Date(link.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Original Destination URL */}
                    <div className="recent-link-original" title={link.originalUrl}>
                      → {link.originalUrl}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="recent-link-actions">
                    <button
                      type="button"
                      className={`action-btn ${isCopied ? 'btn-copied-icon' : ''}`}
                      onClick={() => handleCopy(link.shortCode)}
                      title={isCopied ? 'Copied!' : 'Copy short link'}
                    >
                      {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>

                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => onOpenQr(link.shortCode)}
                      title="View & Download QR Code"
                    >
                      <QrCode size={16} />
                    </button>

                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => onSelectAnalytics(link.shortCode)}
                      title="View Full Analytics Dashboard"
                    >
                      <BarChart3 size={16} />
                    </button>

                    <a
                      href={`/${link.shortCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="action-btn"
                      title="Test Redirect"
                    >
                      <ArrowUpRight size={16} />
                    </a>

                    <button
                      type="button"
                      className="action-btn btn-remove"
                      onClick={() => onRemoveLink(link.shortCode)}
                      title="Remove from history"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
