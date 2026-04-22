'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { AuthResponse } from '@/lib/types';

export default function LoginPage() {
  const [email, setEmail] = useState('linh@example.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setSession(payload);
      window.location.href = '/discover';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <div className="brand" style={{ marginBottom: 16 }}>NearMatch</div>
        <h1 style={{ marginTop: 0 }}>Đăng nhập</h1>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Mật khẩu</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <p style={{ color: '#be123c' }}>{error}</p> : null}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button disabled={loading} className="btn btn-primary" type="submit">
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
            <Link className="btn btn-outline" href="/auth/register">Tạo tài khoản</Link>
          </div>
        </form>
        <p className="muted">Tài khoản seed: linh@example.com / Password123!</p>
      </div>
    </div>
  );
}
