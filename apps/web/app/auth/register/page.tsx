'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { AuthResponse } from '@/lib/types';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: 'Password123!',
    displayName: '',
    birthDate: '2000-01-01',
    gender: 'female',
    interestedIn: 'everyone'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setSession(payload);
      window.location.href = '/profile/edit';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 620 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Tạo tài khoản mới</h1>
        <form onSubmit={onSubmit}>
          <div className="grid-2">
            <div className="field">
              <label>Email</label>
              <input className="input" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
            </div>
            <div className="field">
              <label>Tên hiển thị</label>
              <input className="input" value={form.displayName} onChange={(e) => updateField('displayName', e.target.value)} required />
            </div>
            <div className="field">
              <label>Mật khẩu</label>
              <input className="input" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} required />
            </div>
            <div className="field">
              <label>Ngày sinh</label>
              <input className="input" type="date" value={form.birthDate} onChange={(e) => updateField('birthDate', e.target.value)} required />
            </div>
            <div className="field">
              <label>Giới tính</label>
              <select className="select" value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
                <option value="female">Nữ</option>
                <option value="male">Nam</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div className="field">
              <label>Quan tâm tới</label>
              <select className="select" value={form.interestedIn} onChange={(e) => updateField('interestedIn', e.target.value)}>
                <option value="everyone">Mọi người</option>
                <option value="female">Nữ</option>
                <option value="male">Nam</option>
              </select>
            </div>
          </div>
          {error ? <p style={{ color: '#be123c' }}>{error}</p> : null}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button disabled={loading} className="btn btn-primary" type="submit">
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
            <Link className="btn btn-outline" href="/auth/login">Đã có tài khoản</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
