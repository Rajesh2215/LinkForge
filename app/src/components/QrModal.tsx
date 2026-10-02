import { useState } from 'react';
import { X, Download, QrCode, Check, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

interface QrModalProps {
  shortCode: string;
  onClose: () => void;
}

export default function QrModal({ shortCode, onClose }: QrModalProps) {
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [downloading, setDownloading] = useState(false);

  const qrUrl = api.getQrCodeUrl(shortCode, format);
  const targetUrl = api.getRedirectUrl(shortCode);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${shortCode}-qr.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download QR code:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="logo-icon modal-icon">
              <QrCode size={18} />
            </div>
            <div>
              <h3>Dynamic QR Code</h3>
              <p className="modal-subtitle">Encodes <code>{targetUrl}?src=qr</code></p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Format Pill Switcher */}
        <div className="format-toggle-bar">
          <button
            type="button"
            className={`pill-btn ${format === 'png' ? 'active' : ''}`}
            onClick={() => setFormat('png')}
          >
            PNG (Bitmap)
          </button>
          <button
            type="button"
            className={`pill-btn ${format === 'svg' ? 'active' : ''}`}
            onClick={() => setFormat('svg')}
          >
            SVG (Vector Math)
          </button>
        </div>

        {/* QR Display Frame */}
        <div className="qr-preview-frame">
          <img
            key={`${shortCode}-${format}`}
            src={qrUrl}
            alt={`QR code for ${shortCode}`}
            className="qr-image"
          />
        </div>

        {/* Attribution Notice */}
        <div className="attribution-note">
          <span>✨ Includes <code>?src=qr</code> for Kafka scan tracking</span>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="btn btn-primary w-full"
          >
            <Download size={16} />
            <span>{downloading ? 'Downloading...' : `Download ${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
