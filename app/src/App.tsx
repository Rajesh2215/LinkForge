import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import UrlShortener from './components/UrlShortener';
import QrModal from './components/QrModal';
import AnalyticsDashboard from './components/AnalyticsDashboard';

export default function App() {
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <UrlShortener
                onOpenQr={(code) => setActiveQrCode(code)}
                onSelectAnalytics={(code) => navigate(`/analytics/${code}`)}
              />
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

