import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--surface-0)' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '3rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '600px' }}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
