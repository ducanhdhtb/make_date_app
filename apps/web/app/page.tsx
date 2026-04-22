import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div>
          <h1>Tìm người phù hợp ở gần bạn, kết nối thật nhanh.</h1>
          <p>Bản MVP đã có frontend nối API thật, backend NestJS + Prisma + JWT, và upload ảnh Cloudinary cho avatar/story.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" href="/auth/login">Đăng nhập để bắt đầu</Link>
            <Link className="btn btn-outline" href="/auth/register">Tạo tài khoản mới</Link>
          </div>
        </div>
        <div className="card">
          <div style={{ background: '#fbcfe8', borderRadius: 24, padding: 18 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 16 }}>
              <div style={{ height: 260, borderRadius: 18, background: 'linear-gradient(135deg,#f9a8d4,#c4b5fd)' }} />
              <h3>Bản chạy thật MVP</h3>
              <p className="muted">Login, discover, xem profile, thả tim, xem match, đăng story, chỉnh hồ sơ.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link className="btn btn-outline" href="/discover">Xem discover</Link>
                <Link className="btn btn-primary" href="/profile/edit">Cập nhật hồ sơ</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid-3" style={{ marginTop: 28 }}>
        {['Prisma + PostgreSQL', 'JWT authentication', 'Cloudinary upload', 'Discover theo vị trí', 'Like và match', 'Story 24 giờ'].map((item) => (
          <div key={item} className="card">
            <h3 style={{ marginTop: 0 }}>{item}</h3>
            <p className="muted">Có thể dùng làm nền để dev tiếp features chat, push notification, moderation và premium.</p>
          </div>
        ))}
      </section>
    </>
  );
}
