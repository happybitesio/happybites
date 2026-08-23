import { useEffect, useMemo, useState } from 'react';
import { api, type McpSettingsData } from '../../api/client';
import { Alert } from '../ui/Alert';
import { FormField } from '../ui/FormField';
import { SectionCard } from '../ui/SectionCard';
import { Toggle } from '../ui/Toggle';

function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('tr-TR');
}

function buildAgentConfig(data: McpSettingsData, token: string): string {
  const payload = {
    mcpServers: {
      happybites: {
        url: data.mcp_url,
        headers: {
          Authorization: `Bearer ${token || 'YOUR_TOKEN_HERE'}`,
        },
      },
    },
  };

  return JSON.stringify(payload, null, 2);
}

export function McpSettingsSection() {
  const [data, setData] = useState<McpSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [freshToken, setFreshToken] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const agentConfig = useMemo(() => {
    if (!data) return '';
    return buildAgentConfig(data, freshToken);
  }, [data, freshToken]);

  useEffect(() => {
    api
      .getMcpSettings()
      .then((response) => setData(response.data))
      .catch((error) => setMessage({ type: 'error', text: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const updateEnabled = async (enabled: boolean) => {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await api.updateMcpSettings({ enabled });
      setData(response.data);
      setMessage({ type: 'success', text: enabled ? 'MCP erişimi açıldı.' : 'MCP erişimi kapatıldı.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Güncelleme başarısız.',
      });
    } finally {
      setSaving(false);
    }
  };

  const rotateToken = async () => {
    if (!window.confirm('Yeni token oluşturulacak. Eski token geçersiz olur. Devam edilsin mi?')) {
      return;
    }

    setRotating(true);
    setMessage(null);
    try {
      const response = await api.rotateMcpToken();
      setData(response.data);
      setFreshToken(response.data.token || '');
      setMessage({
        type: 'success',
        text: response.message || 'Yeni token oluşturuldu. Şimdi kopyalayın; tekrar gösterilmeyecek.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Token oluşturulamadı.',
      });
    } finally {
      setRotating(false);
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: `${label} panoya kopyalandı.` });
    } catch {
      setMessage({ type: 'error', text: 'Kopyalama başarısız.' });
    }
  };

  if (loading || !data) {
    return (
      <SectionCard title="MCP Bağlantısı" description="Model Context Protocol ayarları yükleniyor...">
        <div className="hb-loading">
          <span className="hb-spinner" />
          Yükleniyor...
        </div>
      </SectionCard>
    );
  }

  return (
    <>
      {message && (
        <Alert type={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <SectionCard
        title="MCP Bağlantısı"
        description="MCP sunucusu sitenizde otomatik çalışır. Token oluşturup aşağıdaki yapılandırmayı AI agent&apos;ınıza eklemeniz yeterlidir."
      >
        <Toggle
          label="MCP erişimini etkinleştir"
          checked={data.enabled}
          disabled={saving}
          onChange={updateEnabled}
        />

        <div className="hb-field-row" style={{ marginTop: '1rem' }}>
          <FormField label="Token durumu">
            <input className="hb-input" value={data.has_token ? data.token_prefix : 'Henüz token yok'} readOnly />
          </FormField>
          <FormField label="Oluşturulma">
            <input className="hb-input" value={formatDate(data.created_at)} readOnly />
          </FormField>
          <FormField label="Son kullanım">
            <input className="hb-input" value={formatDate(data.last_used_at)} readOnly />
          </FormField>
        </div>

        <div className="hb-input-group" style={{ marginTop: '1rem' }}>
          <button type="button" className="button button-primary" onClick={rotateToken} disabled={rotating}>
            {rotating ? 'Oluşturuluyor...' : data.has_token ? 'Tokeni yenile' : 'Token oluştur'}
          </button>
        </div>

        {freshToken && (
          <FormField
            label="Yeni token"
            hint="Bu token yalnızca bir kez gösterilir. Agent yapılandırmanıza ekleyin."
            className="hb-field--spaced"
          >
            <div className="hb-input-group">
              <input className="hb-input" value={freshToken} readOnly />
              <button type="button" className="button" onClick={() => copyText(freshToken, 'Token')}>
                Kopyala
              </button>
            </div>
          </FormField>
        )}
      </SectionCard>

      <SectionCard
        title="Agent yapılandırması"
        description="Aşağıdaki JSON'u agent MCP ayarlarınıza ekleyin veya mevcut mcpServers bloğuna happybites girdisini ekleyin."
      >
        <FormField label="mcp.json örneği">
          <textarea className="hb-input" rows={14} value={agentConfig} readOnly />
        </FormField>

        <div className="hb-input-group">
          <button type="button" className="button" onClick={() => copyText(agentConfig, 'mcp.json')}>
            Yapılandırmayı kopyala
          </button>
        </div>

        <p className="hb-field-hint" style={{ marginTop: '1rem' }}>
          Token oluşturduktan sonra yapılandırmayı AI agent&apos;ınıza ekleyin. Tokeni yenilediğinizde eski token
          geçersiz olur; yeni tokenı agent ayarlarınıza tekrar girmeniz gerekir.
        </p>
      </SectionCard>
    </>
  );
}
