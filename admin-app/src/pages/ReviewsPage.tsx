import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type ReviewItem } from '../api/client';
import { Alert } from '../components/ui/Alert';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

type StatusFilter = 'all' | 'unread' | 'read';

const LANG_LABELS: Record<string, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
};

const CATEGORY_LABELS = {
  service: 'Servis',
  taste: 'Lezzet',
  cleanliness: 'Temizlik',
} as const;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatRelative(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'Az önce';
  if (minutes < 60) return `${minutes} dk önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;

  return formatDate(value);
}

function averageRating(review: ReviewItem): number {
  return Math.round(((review.service + review.taste + review.cleanliness) / 3) * 10) / 10;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function scoreTone(value: number): 'high' | 'mid' | 'low' {
  if (value >= 4) return 'high';
  if (value >= 3) return 'mid';
  return 'low';
}

function StarRow({ value, max = 5, size = 'md' }: { value: number; max?: number; size?: 'sm' | 'md' }) {
  return (
    <span className={`hb-star-row hb-star-row--${size}`} aria-label={`${value} / ${max}`}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} className={index < Math.round(value) ? 'hb-star is-filled' : 'hb-star'}>
          ★
        </span>
      ))}
    </span>
  );
}

function ScoreMeter({
  label,
  value,
  max = 5,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="hb-score-meter">
      <div className="hb-score-meter__head">
        <span>{label}</span>
        <strong>{value > 0 ? value.toFixed(1) : '—'}</strong>
      </div>
      <div className="hb-score-meter__track">
        <span
          className={`hb-score-meter__fill is-${scoreTone(value)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ReviewOverview({
  stats,
  overallAverage,
}: {
  stats: {
    total: number;
    read: number;
    unread: number;
    avg_service: number;
    avg_taste: number;
    avg_cleanliness: number;
  };
  overallAverage: number;
}) {
  const readRate = stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;

  return (
    <div className="hb-reviews-overview">
      <div className={`hb-reviews-hero is-${scoreTone(overallAverage)}`}>
        <div className="hb-reviews-hero__score">
          <span className="hb-reviews-hero__value">{overallAverage > 0 ? overallAverage.toFixed(1) : '—'}</span>
          <span className="hb-reviews-hero__max">/ 5</span>
        </div>
        {overallAverage > 0 && <StarRow value={overallAverage} size="md" />}
        <p className="hb-reviews-hero__label">Genel memnuniyet</p>
        <div className="hb-reviews-hero__chips">
          <span className="hb-reviews-chip">{stats.total} yorum</span>
          {stats.unread > 0 && (
            <span className="hb-reviews-chip is-alert">{stats.unread} okunmamış</span>
          )}
          <span className="hb-reviews-chip is-muted">%{readRate} okundu</span>
        </div>
      </div>

      <div className="hb-reviews-breakdown">
        <ScoreMeter label={CATEGORY_LABELS.service} value={stats.avg_service} />
        <ScoreMeter label={CATEGORY_LABELS.taste} value={stats.avg_taste} />
        <ScoreMeter label={CATEGORY_LABELS.cleanliness} value={stats.avg_cleanliness} />
      </div>
    </div>
  );
}

function ReviewSkeletonList() {
  return (
    <div className="hb-review-skeleton-list">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="hb-review-skeleton" />
      ))}
    </div>
  );
}

function ReviewItemCard({
  review,
  expanded,
  onToggleExpand,
  onMarkRead,
  onDelete,
}: {
  review: ReviewItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const avg = averageRating(review);
  const isUnread = Number(review.is_read) === 0;
  const displayName = review.customer_name || 'Anonim müşteri';
  const isLongComment = review.comment.length > 180;

  return (
    <article className={`hb-review-item${isUnread ? ' is-unread' : ''}`}>
      <div className={`hb-review-item__score is-${scoreTone(avg)}`}>
        <span className="hb-review-item__score-value">{avg}</span>
        <StarRow value={avg} size="sm" />
      </div>

      <div className="hb-review-item__main">
        <div className="hb-review-item__header">
          <div className="hb-review-item__person">
            <span className="hb-review-avatar" aria-hidden>
              {getInitials(displayName)}
            </span>
            <div className="hb-review-item__identity">
              <div className="hb-review-item__name-row">
                <strong>{displayName}</strong>
                <span className="hb-lang-badge">
                  {LANG_LABELS[review.language] || review.language.toUpperCase()}
                </span>
                {isUnread ? (
                  <span className="hb-status-badge is-unread">Yeni</span>
                ) : (
                  <span className="hb-status-badge is-read">Okundu</span>
                )}
              </div>
              {review.customer_email && (
                <a className="hb-review-item__email" href={`mailto:${review.customer_email}`}>
                  {review.customer_email}
                </a>
              )}
            </div>
          </div>

          <time className="hb-review-item__date" dateTime={review.created_at} title={formatDate(review.created_at)}>
            {formatRelative(review.created_at)}
          </time>
        </div>

        <div className="hb-review-item__metrics">
          <span className="hb-metric-pill">
            <span>Servis</span>
            <strong>{review.service}</strong>
          </span>
          <span className="hb-metric-pill">
            <span>Lezzet</span>
            <strong>{review.taste}</strong>
          </span>
          <span className="hb-metric-pill">
            <span>Temizlik</span>
            <strong>{review.cleanliness}</strong>
          </span>
        </div>

        <div className="hb-review-item__comment-wrap">
          <p className={`hb-review-item__comment${expanded ? ' is-expanded' : ''}`}>{review.comment}</p>
          {isLongComment && (
            <button type="button" className="hb-review-item__toggle" onClick={onToggleExpand}>
              {expanded ? 'Daha az göster' : 'Devamını oku'}
            </button>
          )}
        </div>
      </div>

      <div className="hb-review-item__actions">
        {isUnread && (
          <button type="button" className="button button-small" onClick={onMarkRead}>
            Okundu
          </button>
        )}
        <button type="button" className="button button-small hb-btn-danger" onClick={onDelete}>
          Sil
        </button>
      </div>
    </article>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    read: 0,
    unread: 0,
    avg_service: 0,
    avg_taste: 0,
    avg_cleanliness: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const overallAverage = useMemo(() => {
    const values = [stats.avg_service, stats.avg_taste, stats.avg_cleanliness].filter((v) => v > 0);
    if (!values.length) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }, [stats]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getReviews({ page, search, status });
      setReviews(response.data.reviews);
      setStats(response.data.stats);
      setTotalPages(response.data.pagination.total_pages);
      setExpandedId(null);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Yüklenemedi.' });
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: number) => {
    try {
      await api.markReviewRead(id);
      await load();
      setMessage({ type: 'success', text: 'Yorum okundu olarak işaretlendi.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Güncellenemedi.' });
    }
  };

  const markAllRead = async () => {
    if (stats.unread === 0) return;
    try {
      const response = await api.markAllReviewsRead();
      await load();
      setMessage({
        type: 'success',
        text: `${response.data.updated} yorum okundu olarak işaretlendi.`,
      });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Güncellenemedi.' });
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Bu yorumu kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteReview(id);
      await load();
      setMessage({ type: 'success', text: 'Yorum silindi.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Silinemedi.' });
    }
  };

  const filterOptions: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tümü', count: stats.total },
    { id: 'unread', label: 'Okunmamış', count: stats.unread },
    { id: 'read', label: 'Okunmuş', count: stats.read },
  ];

  return (
    <div className="hb-admin hb-admin--reviews">
      <PageHeader
        title="Müşteri Yorumları"
        description="QR menüden gelen değerlendirmeleri inceleyin, yanıtlayın ve yönetin."
        actions={
          stats.unread > 0 ? (
            <button type="button" className="button button-primary" onClick={markAllRead}>
              Tümünü okundu işaretle
            </button>
          ) : undefined
        }
      />

      {message && (
        <Alert type={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <ReviewOverview stats={stats} overallAverage={overallAverage} />

      <SectionCard
        title="Yorum listesi"
        description="En yeni değerlendirmeler üstte görünür."
      >
        <div className="hb-review-panel">
          <div className="hb-review-toolbar">
            <div className="hb-review-search">
              <span className="hb-review-search__icon" aria-hidden>
                ⌕
              </span>
              <input
                className="hb-input hb-review-search__input"
                placeholder="İsim, e-posta veya yorum metninde ara..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  className="hb-review-search__clear"
                  onClick={() => setSearchInput('')}
                  aria-label="Aramayı temizle"
                >
                  ×
                </button>
              )}
            </div>

            <div className="hb-filter-tabs">
              {filterOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`hb-filter-tab${status === item.id ? ' is-active' : ''}`}
                  onClick={() => {
                    setStatus(item.id);
                    setPage(1);
                  }}
                >
                  {item.label}
                  <span className="hb-filter-tab__count">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <ReviewSkeletonList />
          ) : reviews.length === 0 ? (
            <div className="hb-empty hb-empty--reviews">
              <div className="hb-empty__icon">💬</div>
              <h3>Yorum bulunamadı</h3>
              <p className="hb-muted">
                {search
                  ? 'Arama kriterlerinize uygun sonuç yok. Farklı bir kelime deneyin.'
                  : 'Bu filtrede henüz yorum yok. Müşteriler menüden değerlendirme bıraktığında burada görünecek.'}
              </p>
            </div>
          ) : (
            <div className="hb-review-items">
              {reviews.map((review) => (
                <ReviewItemCard
                  key={review.id}
                  review={review}
                  expanded={expandedId === review.id}
                  onToggleExpand={() =>
                    setExpandedId((current) => (current === review.id ? null : review.id))
                  }
                  onMarkRead={() => markRead(review.id)}
                  onDelete={() => remove(review.id)}
                />
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="hb-pagination hb-pagination--reviews">
              <button
                type="button"
                className="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Önceki
              </button>
              <span className="hb-muted">
                Sayfa {page} / {totalPages}
              </span>
              <button
                type="button"
                className="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki →
              </button>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
