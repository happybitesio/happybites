import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const DOWNLOAD_SIZE = 1024;
const PREVIEW_SIZE = 180;

interface MenuQrCodeProps {
  url: string;
}

function ensureSvgDimensions(svg: string, size: number): string {
  if (new RegExp(`width="${size}"`, 'i').test(svg) && new RegExp(`height="${size}"`, 'i').test(svg)) {
    return svg;
  }

  return svg.replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
    const cleaned = attrs.replace(/\s(width|height)="[^"]*"/gi, '');
    return `<svg${cleaned} width="${size}" height="${size}">`;
  });
}

export function MenuQrCode({ url }: MenuQrCodeProps) {
  const [previewSvg, setPreviewSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const normalizedUrl = url.trim();

  useEffect(() => {
    if (!normalizedUrl) {
      setPreviewSvg('');
      return;
    }

    let cancelled = false;
    setLoading(true);

    QRCode.toString(normalizedUrl, {
      type: 'svg',
      width: PREVIEW_SIZE,
      margin: 1,
      color: {
        dark: '#1d2327',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (!cancelled) {
          setPreviewSvg(svg);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewSvg('');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedUrl]);

  const downloadSvg = async () => {
    if (!normalizedUrl) return;

    setDownloading(true);
    try {
      const svg = await QRCode.toString(normalizedUrl, {
        type: 'svg',
        width: DOWNLOAD_SIZE,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      const sizedSvg = ensureSvgDimensions(svg, DOWNLOAD_SIZE);
      const blob = new Blob([sizedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = 'menu-qr-code.svg';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(false);
    }
  };

  if (!normalizedUrl) {
    return null;
  }

  return (
    <div className="hb-qr-block">
      <p className="hb-qr-block__label">Menü QR Kodu</p>
      <div className="hb-qr-block__preview" aria-hidden={loading}>
        {loading ? (
          <span className="hb-spinner" />
        ) : previewSvg ? (
          <div className="hb-qr-block__svg" dangerouslySetInnerHTML={{ __html: previewSvg }} />
        ) : (
          <span className="hb-qr-block__error">QR kodu oluşturulamadı.</span>
        )}
      </div>
      <button
        type="button"
        className="button button-secondary"
        onClick={downloadSvg}
        disabled={!previewSvg || downloading}
      >
        {downloading ? 'İndiriliyor...' : 'SVG İndir (1024×1024)'}
      </button>
    </div>
  );
}
