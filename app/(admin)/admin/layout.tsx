import AdminNavbar from '@/components/AdminNavbar';
import Footer from '@/components/Footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--surface-0)' }}>
      <AdminNavbar />
      <main style={{ flex: 1, padding: 'clamp(1rem, 3vw, 3rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

