import Link from 'next/link';

export default function PendingPaymentPage() {
  return (
    <div className="card text-center py-10">
      <div 
        style={{ 
          fontSize: '3rem', 
          marginBottom: '1rem',
          display: 'inline-flex',
          background: 'var(--surface-2)',
          padding: '1.5rem',
          borderRadius: '50%'
        }}
      >
        ⏳
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        Payment Under Review
      </h1>
      <p className="text-secondary mb-6 max-w-md mx-auto line-height-relaxed">
        We have received your payment submission. Our team is currently verifying the details. 
        This usually takes between 1-12 hours during business days.
      </p>
      
      <div className="alert-info text-sm mb-6 inline-block text-left">
        Once verified, your account will automatically unlock and you will receive an email confirmation.
      </div>

      <div>
        <Link 
          href="/api/auth/signout?callbackUrl=/" 
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--brand-400)' }}
        >
          Sign out for now
        </Link>
      </div>
    </div>
  );
}
