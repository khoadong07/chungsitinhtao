import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Chứng Sĩ Tỉnh Táo — Phân tích chứng khoán Việt Nam bằng AI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(139,92,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.07) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Glow orbs */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -120,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(109,40,217,0.25) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            zIndex: 1,
            padding: '0 80px',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.35)',
              borderRadius: 100,
              padding: '8px 20px',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#22c55e',
              }}
            />
            <span style={{ color: '#a78bfa', fontSize: 16, fontWeight: 600, letterSpacing: 2 }}>
              AI · VIETNAM STOCKS
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: 'white',
              letterSpacing: -2,
              lineHeight: 1.1,
              textAlign: 'center',
            }}
          >
            Chứng Sĩ Tỉnh Táo
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 26,
              color: '#94a3b8',
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: 760,
            }}
          >
            Đừng nghe tiếng lòng, hãy nghe dữ liệu.
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {['EMA · RSI · MACD', 'Vùng hỗ trợ / kháng cự', 'Tin tức FireAnt', 'LLM phân tích'].map((label) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  color: '#cbd5e1',
                  fontSize: 15,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #7c3aed, #22d3ee)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
