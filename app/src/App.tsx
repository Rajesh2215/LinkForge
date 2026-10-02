import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import UrlShortener from './components/UrlShortener';
import RecentLinks from './components/RecentLinks';
import QrModal from './components/QrModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { useRecentLinks } from './hooks/useRecentLinks';

export default function App() {
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    links,
    refreshing,
    addLink,
    removeLink,
    clearAllLinks,
    refreshClicks,
  } = useRecentLinks();

  // Refresh latest click counts on app load
  useEffect(() => {
    refreshClicks();
  }, [refreshClicks]);

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <UrlShortener
                  onOpenQr={(code) => setActiveQrCode(code)}
                  onSelectAnalytics={(code) => navigate(`/analytics/${code}`)}
                  onLinkCreated={(newLink) => {
                    addLink({
                      shortCode: newLink.shortCode,
                      originalUrl: newLink.url,
                      createdAt: newLink.createdAt,
                      expiresAt: newLink.expiresAt,
                    });
                  }}
                />
                <RecentLinks
                  links={links}
                  refreshing={refreshing}
                  onRefreshClicks={refreshClicks}
                  onRemoveLink={removeLink}
                  onClearAll={clearAllLinks}
                  onOpenQr={(code) => setActiveQrCode(code)}
                  onSelectAnalytics={(code) => navigate(`/analytics/${code}`)}
                />
              </>
            }
          />
          <Route path="/analytics/:shortCode" element={<AnalyticsDashboard />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>

        {/* Global QR Modal */}
        {activeQrCode && (
          <QrModal
            shortCode={activeQrCode}
            onClose={() => setActiveQrCode(null)}
          />
        )}
      </main>
    </>
  );
}

