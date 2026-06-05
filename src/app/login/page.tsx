'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Błąd logowania');
      }

      window.location.href = '/'; // hard redirect to reload app state
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-body)'
    }}>
      <div className="card animate-fade-in" style={{
        width: '100%',
        maxWidth: 400,
        padding: 'var(--space-2xl)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <Image src="/images/logo.svg" alt="Tak Serwis" width={180} height={48} priority />
        </div>
        
        <h1 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Logowanie do systemu</h1>
        
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {error && (
            <div style={{ padding: '12px', background: 'var(--danger)', color: 'white', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Nazwa użytkownika</label>
            <input 
              className="form-input" 
              type="text" 
              required 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Hasło</label>
            <input 
              className="form-input" 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'var(--space-sm)' }}
            disabled={loading}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
        
        <div style={{ marginTop: 'var(--space-lg)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Jeśli to pierwsze logowanie (pusta baza), podane dane utworzą nowe konto administratora.
        </div>
      </div>
    </div>
  );
}
