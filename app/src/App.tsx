import Navbar from './components/Navbar';
import UrlShortener from './components/UrlShortener';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <UrlShortener
          onOpenQr={(code) => console.log('Open QR for:', code)}
          onSelectAnalytics={(code) => console.log('View analytics for:', code)}
        />
      </main>
    </>
  );
}
