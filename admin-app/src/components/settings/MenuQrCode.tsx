import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import type { QRCodeErrorCorrectionLevel, QRCodeToDataURLOptions } from 'qrcode';
import { t } from '../../i18n';

const DOWNLOAD_SIZE = 1024;
const PREVIEW_SIZE = 180;
const DEFAULT_FOREGROUND = '#1d2327';
const DEFAULT_BACKGROUND = '#ffffff';

type MarginOption = 0 | 1 | 2 | 4;

interface MenuQrCodeProps {
  url: string;
  brandColor?: string;
}

interface QrStyle {
  foreground: string;
  background: string;
  margin: MarginOption;
  errorCorrectionLevel: QRCodeErrorCorrectionLevel;
}

function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return fallback;
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

function buildQrOptions(style: QrStyle, width: number) {
  return {
    width,
    margin: style.margin,
    errorCorrectionLevel: style.errorCorrectionLevel,
    color: {
      dark: style.foreground,
      light: style.background,
    },
  };
}

export function MenuQrCode({ url, brandColor }: MenuQrCodeProps) {
  const [previewSvg, setPreviewSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<'svg' | 'png' | null>(null);
  const [style, setStyle] = useState<QrStyle>({
    foreground: DEFAULT_FOREGROUND,
    background: DEFAULT_BACKGROUND,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  const normalizedUrl = url.trim();
  const qrOptions = useMemo(() => buildQrOptions(style, PREVIEW_SIZE), [style]);

  useEffect(() => {
    if (!normalizedUrl) {
      setPreviewSvg('');
      return;
    }

    let cancelled = false;
    setLoading(true);

    QRCode.toString(normalizedUrl, {
      type: 'svg',
      ...qrOptions,
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
  }, [normalizedUrl, qrOptions]);

  const downloadQr = async (format: 'svg' | 'png') => {
    if (!normalizedUrl) return;

    setDownloading(format);
    try {
      const exportOptions = buildQrOptions(style, DOWNLOAD_SIZE);

      if (format === 'svg') {
        const svg = await QRCode.toString(normalizedUrl, {
          type: 'svg',
          ...exportOptions,
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
        return;
      }

      const dataUrl = await QRCode.toDataURL(normalizedUrl, {
        ...exportOptions,
        type: 'image/png',
      } as QRCodeToDataURLOptions);

      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = 'menu-qr-code.png';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } finally {
      setDownloading(null);
    }
  };

  const applyBrandColor = () => {
    const next = normalizeHexColor(brandColor || '', style.foreground);
    if (next === style.foreground) return;
    setStyle((current) => ({ ...current, foreground: next }));
  };

  if (!normalizedUrl) {
    return null;
  }

  return (
    <div className="hb-qr-block">
      <p className="hb-qr-block__label">{t('qr.label')}</p>

      <div className="hb-qr-block__layout">
        <div
          className="hb-qr-block__preview"
          style={{ background: style.background }}
          aria-hidden={loading}
        >
          {loading ? (
            <span className="hb-spinner" />
          ) : previewSvg ? (
            <div className="hb-qr-block__svg" dangerouslySetInnerHTML={{ __html: previewSvg }} />
          ) : (
            <span className="hb-qr-block__error">{t('qr.error')}</span>
          )}
        </div>

        <div className="hb-qr-block__controls">
          <div className="hb-qr-block__field-row">
            <label className="hb-qr-block__field">
              <span>{t('qr.foreground')}</span>
              <span className="hb-qr-block__color-input">
                <input
                  type="color"
                  value={style.foreground}
                  onChange={(e) =>
                    setStyle((current) => ({
                      ...current,
                      foreground: normalizeHexColor(e.target.value, current.foreground),
                    }))
                  }
                />
                <input
                  className="hb-input hb-input--compact"
                  value={style.foreground}
                  onChange={(e) =>
                    setStyle((current) => ({
                      ...current,
                      foreground: normalizeHexColor(e.target.value, current.foreground),
                    }))
                  }
                />
              </span>
            </label>

            <label className="hb-qr-block__field">
              <span>{t('qr.background')}</span>
              <span className="hb-qr-block__color-input">
                <input
                  type="color"
                  value={style.background}
                  onChange={(e) =>
                    setStyle((current) => ({
                      ...current,
                      background: normalizeHexColor(e.target.value, current.background),
                    }))
                  }
                />
                <input
                  className="hb-input hb-input--compact"
                  value={style.background}
                  onChange={(e) =>
                    setStyle((current) => ({
                      ...current,
                      background: normalizeHexColor(e.target.value, current.background),
                    }))
                  }
                />
              </span>
            </label>
          </div>

          {brandColor ? (
            <button type="button" className="button button-small hb-btn-ghost" onClick={applyBrandColor}>
              {t('qr.useBrandColor')}
            </button>
          ) : null}

          <div className="hb-qr-block__field-row">
            <label className="hb-qr-block__field">
              <span>{t('qr.margin')}</span>
              <select
                className="hb-input hb-input--compact"
                value={style.margin}
                onChange={(e) =>
                  setStyle((current) => ({
                    ...current,
                    margin: Number(e.target.value) as MarginOption,
                  }))
                }
              >
                <option value={0}>{t('qr.marginNone')}</option>
                <option value={1}>{t('qr.marginSmall')}</option>
                <option value={2}>{t('qr.marginMedium')}</option>
                <option value={4}>{t('qr.marginLarge')}</option>
              </select>
            </label>

            <label className="hb-qr-block__field">
              <span>{t('qr.errorCorrection')}</span>
              <select
                className="hb-input hb-input--compact"
                value={style.errorCorrectionLevel}
                onChange={(e) =>
                  setStyle((current) => ({
                    ...current,
                    errorCorrectionLevel: e.target.value as QRCodeErrorCorrectionLevel,
                  }))
                }
              >
                <option value="L">{t('qr.errorLow')}</option>
                <option value="M">{t('qr.errorMedium')}</option>
                <option value="Q">{t('qr.errorQuartile')}</option>
                <option value="H">{t('qr.errorHigh')}</option>
              </select>
            </label>
          </div>

          <p className="hb-qr-block__hint">{t('qr.hint')}</p>
        </div>
      </div>

      <div className="hb-qr-block__actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => downloadQr('svg')}
          disabled={!previewSvg || downloading !== null}
        >
          {downloading === 'svg' ? t('qr.downloading') : t('qr.downloadSvg')}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => downloadQr('png')}
          disabled={!previewSvg || downloading !== null}
        >
          {downloading === 'png' ? t('qr.downloading') : t('qr.downloadPng')}
        </button>
      </div>
    </div>
  );
}
