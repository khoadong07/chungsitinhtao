'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type FieldType = 'text' | 'number' | 'select';
interface KeyMeta { label: string; description: string; type: FieldType; options?: string[] }

const KEY_LABELS: Record<string, KeyMeta> = {
  LLM_PROVIDER:         { label: 'LLM Provider',        description: 'AI model provider',           type: 'select', options: ['openai', 'anthropic', 'none'] },
  LLM_MODEL:            { label: 'LLM Model',            description: 'Model ID (e.g. deepseek-ai/DeepSeek-V4-Flash)', type: 'text' },
  LLM_BASE_URL:         { label: 'LLM Base URL',         description: 'Custom API endpoint (để trống = mặc định)', type: 'text' },
  LLM_TIMEOUT_MS:       { label: 'LLM Timeout (ms)',     description: 'Request timeout milliseconds', type: 'number' },
  MARKET_DATA_PROVIDER: { label: 'Market Data Provider', description: 'Nguồn dữ liệu thị trường',   type: 'select', options: ['rest', 'mock'] },
  DEFAULT_LOOKBACK:     { label: 'Default Lookback',     description: 'Số nến mặc định (30–500)',    type: 'number' },
  DEFAULT_SYMBOL:       { label: 'Default Symbol',       description: 'Mã CP mặc định khi mở app',  type: 'text' },
};

interface ConfigResponse {
  config: Record<string, string>;
  editableKeys: string[];
}

interface Toast { id: number; message: string; type: 'success' | 'error' }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, add };
}

function ConfigRow({
  configKey,
  savedValue,
  token,
  onSaved,
  onError,
}: {
  configKey: string;
  savedValue: string;
  token: string;
  onSaved: (key: string, val: string) => void;
  onError: (msg: string) => void;
}) {
  const meta = KEY_LABELS[configKey];
  const [value, setValue] = useState(savedValue);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleChange = (v: string) => { setValue(v); setDirty(v !== savedValue); };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: configKey, value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? 'Lưu thất bại');
      }
      onSaved(configKey, value);
      setDirty(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  if (!meta) return null;

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{ background: '#0E1223', border: `1px solid ${dirty ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.06)'}` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-300 mb-0.5">{meta.label}</p>
          <p className="text-[11px] text-slate-600">{meta.description}</p>
        </div>
        <div className="flex items-center gap-2 sm:w-auto w-full">
          {meta.type === 'select' && meta.options ? (
            <select
              value={value}
              onChange={e => handleChange(e.target.value)}
              className="flex-1 sm:w-40 px-3 py-1.5 rounded-lg text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {meta.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type={meta.type === 'number' ? 'number' : 'text'}
              value={value}
              onChange={e => handleChange(e.target.value)}
              className="flex-1 sm:w-64 px-3 py-1.5 rounded-lg text-sm text-white placeholder-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 font-mono"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              placeholder={`Enter ${meta.label.toLowerCase()}...`}
            />
          )}
          <button
            onClick={save}
            disabled={saving || !dirty}
            aria-label={`Save ${meta.label}`}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            style={{
              background: dirty ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.05)',
              color: dirty ? 'white' : '#475569',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {saving ? (
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const { toasts, add: addToast } = useToast();

  useEffect(() => {
    const t = sessionStorage.getItem('admin_token') ?? '';
    if (!t) { router.replace('/admin/login'); return; }
    setToken(t);

    fetch(`${API}/api/v1/admin/config`, { headers: { Authorization: `Bearer ${t}` } })
      .then(async res => {
        if (res.status === 401) { sessionStorage.removeItem('admin_token'); router.replace('/admin/login'); return; }
        if (!res.ok) throw new Error('Không tải được cấu hình');
        return res.json() as Promise<ConfigResponse>;
      })
      .then(data => {
        if (!data) return;
        setConfig(data.config);
        setKeys(data.editableKeys);
      })
      .catch(err => setFetchError(err instanceof Error ? err.message : 'Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    sessionStorage.removeItem('admin_token');
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse 100% 40% at 50% 0%, rgba(124,58,237,0.08) 0%, #020617 50%)' }}>
      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg anim-fade-up"
            style={{
              background: t.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: t.type === 'success' ? '#86efac' : '#fca5a5',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{ background: 'rgba(2,6,23,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" aria-label="Về trang chủ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="text-xs hidden sm:block">Dashboard</span>
            </Link>
            <span className="text-slate-800">|</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#22d3ee)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">Cấu hình hệ thống</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-rose-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Cấu hình</h1>
          <p className="text-sm text-slate-500 mt-1">Thay đổi sẽ có hiệu lực ngay sau khi lưu (không cần restart)</p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="skeleton h-[72px] rounded-xl" />
            ))}
          </div>
        )}

        {fetchError && !loading && (
          <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-rose-400 font-semibold mb-1">Không thể kết nối backend</p>
            <p className="text-rose-400/60 text-sm">{fetchError}</p>
          </div>
        )}

        {!loading && !fetchError && (
          <div className="space-y-2.5">
            {/* LLM section */}
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest pt-2 pb-1">AI / LLM</p>
            {['LLM_PROVIDER', 'LLM_MODEL', 'LLM_BASE_URL', 'LLM_TIMEOUT_MS'].filter(k => keys.includes(k)).map(k => (
              <ConfigRow
                key={k}
                configKey={k}
                savedValue={config[k] ?? ''}
                token={token}
                onSaved={(key, val) => {
                  setConfig(prev => ({ ...prev, [key]: val }));
                  addToast(`Đã lưu ${KEY_LABELS[key]?.label ?? key}`, 'success');
                }}
                onError={msg => addToast(msg, 'error')}
              />
            ))}

            {/* Market data section */}
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest pt-4 pb-1">Dữ liệu thị trường</p>
            {['MARKET_DATA_PROVIDER'].filter(k => keys.includes(k)).map(k => (
              <ConfigRow
                key={k}
                configKey={k}
                savedValue={config[k] ?? ''}
                token={token}
                onSaved={(key, val) => {
                  setConfig(prev => ({ ...prev, [key]: val }));
                  addToast(`Đã lưu ${KEY_LABELS[key]?.label ?? key}`, 'success');
                }}
                onError={msg => addToast(msg, 'error')}
              />
            ))}

            {/* App defaults section */}
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest pt-4 pb-1">Mặc định ứng dụng</p>
            {['DEFAULT_LOOKBACK', 'DEFAULT_SYMBOL'].filter(k => keys.includes(k)).map(k => (
              <ConfigRow
                key={k}
                configKey={k}
                savedValue={config[k] ?? ''}
                token={token}
                onSaved={(key, val) => {
                  setConfig(prev => ({ ...prev, [key]: val }));
                  addToast(`Đã lưu ${KEY_LABELS[key]?.label ?? key}`, 'success');
                }}
                onError={msg => addToast(msg, 'error')}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-slate-800 text-center mt-10">
          API Key và secrets được quản lý qua biến môi trường .env — không hiển thị tại đây vì lý do bảo mật
        </p>
      </main>
    </div>
  );
}
