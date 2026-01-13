/**
 * Email Confirmation Page
 * 
 * This page is shown when users click the email confirmation link
 * Customize this page to match your Framer design
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    // Supabase sends tokens in the URL hash, not query params
    // Format: #access_token=xxx&type=signup&expires_in=3600
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const token = hashParams.get('access_token');
    const type = hashParams.get('type');
    const redirectTo = searchParams.get('redirect_to');

    if (!token || type !== 'signup') {
      setStatus('error');
      setMessage('Invalid confirmation link.');
      return;
    }

    // Exchange token for session
    const confirmEmail = async () => {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const response = await fetch(`${appUrl}/api/auth/confirm-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            redirect_to: redirectTo,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.requires_signin) {
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting to sign in...');
            
            // Redirect to sign in after 2 seconds
            setTimeout(() => {
              window.location.href = '/signin';
            }, 2000);
          } else if (data.session) {
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting...');
            
            // Store session
            if (typeof window !== 'undefined') {
              localStorage.setItem('supabase_access_token', data.session.access_token);
              localStorage.setItem('supabase_refresh_token', data.session.refresh_token);
            }

            // Redirect after 2 seconds
            setTimeout(() => {
              if (redirectTo) {
                window.location.href = redirectTo;
              } else {
                // Redirect based on user role
                const dashboard = data.user?.role === 'agent' ? '/dashboard/agent' : '/dashboard/buyer';
                window.location.href = dashboard;
              }
            }, 2000);
          } else {
            setStatus('success');
            setMessage(data.message || 'Email confirmed successfully!');
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to confirm email. The link may have expired.');
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('An error occurred while confirming your email.');
      }
    };

    confirmEmail();
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h1 style={{ margin: '0 0 10px', color: '#333' }}>Confirming Your Email</h1>
            <p style={{ color: '#666', margin: 0 }}>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 style={{ margin: '0 0 10px', color: '#10b981' }}>Email Confirmed!</h1>
            <p style={{ color: '#666', margin: 0 }}>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 style={{ margin: '0 0 10px', color: '#ef4444' }}>Confirmation Failed</h1>
            <p style={{ color: '#666', margin: '0 0 20px' }}>{message}</p>
            <button
              onClick={() => router.push('/')}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              Go to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div>Loading...</div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
