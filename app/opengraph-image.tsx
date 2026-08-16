import { ImageResponse } from 'next/og';

// Generated at build time instead of committing a binary — public/ was empty, so
// the previously referenced /og-image.png 404'd on every social preview.
export const runtime = 'edge';
export const alt = 'ThesisMaps: Visual Research Intelligence for Graduate Researchers';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          border: '16px solid #000000',
          padding: '72px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#0066FF',
            }}
          >
            ThesisMaps
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 36,
              fontSize: 82,
              lineHeight: 1.05,
              fontWeight: 700,
              color: '#000000',
              maxWidth: 900,
            }}
          >
            Visual Research Intelligence for Graduate Researchers
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 30, color: '#666666', maxWidth: 720 }}>
            Map your literature. Find the gaps. Write with confidence.
          </div>
          <div style={{ display: 'flex', width: 120, height: 24, background: '#0066FF' }} />
        </div>
      </div>
    ),
    size
  );
}
