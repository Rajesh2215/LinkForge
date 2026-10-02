import { useEffect, useState } from 'react';
import { Link2, Sparkles, Activity } from 'lucide-react';
import { api } from '../services/api';

type ServerStatus = 'checking' | 'online' | 'offline';

export default function Navbar() {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [uptime, setUptime] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkServer = async () => {
      const res = await api.checkHealth();
      if (!isMounted) return;

      if (res && res.status === 'ok') {
        setStatus('online');
        setUptime(Math.floor(res.uptime));
      } else {
        setStatus('offline');
        setUptime(null);
      }
    };

    checkServer();
    // Re-check health every 30 seconds
    const interval = setInterval(checkServer, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="navbar-wrapper">
      <div className="container">
        <nav className="navbar glass-panel">
          {/* Brand Logo */}
          <div className="navbar-brand">
            <div className="logo-icon">
              <Link2 size={20} className="icon-glow" />
            </div>
            <div className="brand-text">
              <span className="brand-title gradient-text">LinkForge</span>
              <span className="brand-badge">
                <Sparkles size={11} /> Redis • Kafka
              </span>
            </div>
          </div>

          {/* Right Controls / Live Status */}
          <div className="navbar-actions">
            {status === 'online' && (
              <div className="badge badge-success">
                <span className="badge-dot pulse" />
                <span>API Online</span>
                {uptime !== null && (
                  <span className="uptime-pill">{uptime}s</span>
                )}
              </div>
            )}

            {status === 'offline' && (
              <div className="badge badge-danger">
                <span className="badge-dot" />
                <span>API Offline</span>
              </div>
            )}

            {status === 'checking' && (
              <div className="badge badge-info">
                <Activity size={12} className="spin-slow" />
                <span>Connecting...</span>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
