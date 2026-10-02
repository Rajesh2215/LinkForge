import { useState } from 'react';
import Navbar from './components/Navbar';
import UrlShortener from './components/UrlShortener';
import QrModal from './components/QrModal';
import AnalyticsDashboard from './components/AnalyicsDashboard';

export default function App() {
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  const [activeAnalyticsCode, setActiveAnalyticsCode] = useState<string | null>(null);

  return (
    <>
      <Navbar />
      <main>
        <UrlShortener
          onOpenQr={(code) => setActiveQrCode(code)}
          onSelectAnalytics={(code) => setActiveAnalyticsCode(code)}
        />

        {/* Analytics View */}
        {activeAnalyticsCode && (
          <AnalyticsDashboard
            shortCode={activeAnalyticsCode}
            onClose={() => setActiveAnalyticsCode(null)}
          />
        )}

        {/* QR Modal */}
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
