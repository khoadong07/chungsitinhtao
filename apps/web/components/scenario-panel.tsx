import type { Scenario } from '../lib/types';

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const isBullish = scenario.name === 'bullish';
  const color = isBullish ? '#10b981' : '#f43f5e';
  const bg = isBullish ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)';
  const border = isBullish ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)';
  const iconBg = isBullish ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)';

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: iconBg }}>
          {isBullish ? '▲' : '▼'}
        </div>
        <h4 className="font-semibold text-sm" style={{ color }}>
          {isBullish ? 'Kịch bản tăng' : 'Kịch bản giảm'}
        </h4>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Kích hoạt khi', text: scenario.trigger },
          { label: 'Vô hiệu hoá khi', text: scenario.invalidation },
        ].map(({ label, text }) => (
          <div key={label}>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
          </div>
        ))}

        {scenario.rationale.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Cơ sở phân tích</p>
            <ul className="space-y-1.5">
              {scenario.rationale.map((r, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
                  <span className="shrink-0" style={{ color }}>›</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScenarioPanel({ scenarios }: { scenarios: Scenario[] }) {
  const bullish = scenarios.find(s => s.name === 'bullish');
  const bearish = scenarios.find(s => s.name === 'bearish');
  if (!bullish && !bearish) return <p className="text-slate-500 text-sm">Không đủ dữ liệu để tạo kịch bản.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {bullish && <ScenarioCard scenario={bullish} />}
      {bearish && <ScenarioCard scenario={bearish} />}
    </div>
  );
}
