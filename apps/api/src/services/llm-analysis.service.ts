import { env } from '../config/env.js';
import { OpenAiLlmProvider } from '../providers/openai-llm.provider.js';
import { AnthropicLlmProvider } from '../providers/anthropic-llm.provider.js';
import type { LlmProvider } from '../providers/llm.interface.js';
import { analysisReportSchema, type AnalysisReport } from '../schemas/analysis.schema.js';
import type { AnalysisOutput } from './analysis-orchestrator.service.js';

export const PROMPT_VERSION = '1.0.0';

// Extract JSON from LLM response, handling markdown fences and surrounding text
function extractJson(raw: string): unknown {
  // Strip markdown code fences at start/end
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(stripped); } catch {}
  // Find outermost {...} block if LLM added surrounding text
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  throw new SyntaxError('No valid JSON object found in LLM response');
}

let _llmProvider: LlmProvider | null | undefined = undefined;

function getLlmProvider(): LlmProvider | null {
  if (env.LLM_PROVIDER === 'none') return null;
  if (_llmProvider !== undefined) return _llmProvider;
  if (env.LLM_PROVIDER === 'openai') {
    if (!env.LLM_API_KEY) throw new Error('LLM_API_KEY required for openai provider');
    const model = env.LLM_MODEL ?? 'gpt-4o-mini';
    _llmProvider = new OpenAiLlmProvider(env.LLM_API_KEY, model, env.LLM_TIMEOUT_MS, env.LLM_BASE_URL);
  } else if (env.LLM_PROVIDER === 'anthropic') {
    if (!env.LLM_API_KEY) throw new Error('LLM_API_KEY required for anthropic provider');
    const model = env.LLM_MODEL ?? 'claude-opus-5-5';
    _llmProvider = new AnthropicLlmProvider(env.LLM_API_KEY, model, env.LLM_TIMEOUT_MS);
  } else {
    _llmProvider = null;
  }
  return _llmProvider;
}

export function resetLlmProvider(): void {
  _llmProvider = undefined;
}

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích kỹ thuật chứng khoán. Hãy phân tích dữ liệu kỹ thuật được cung cấp và trả về báo cáo JSON theo đúng schema được yêu cầu.

Quy tắc bắt buộc:
1. Trả lời bằng tiếng Việt cho tất cả các trường văn bản
2. Chỉ sử dụng dữ liệu được cung cấp — không bịa đặt giá hay chỉ số
3. Giữ nguyên các giá trị số chính xác từ dữ liệu đầu vào
4. Tách biệt quan sát và diễn giải
5. Trình bày cả bằng chứng tăng và giảm
6. Dùng ngôn ngữ có điều kiện cho các kịch bản ("nếu", "khi", "có thể")
7. Không đưa ra cam kết hoặc mục tiêu giá chắc chắn
8. Tiết lộ rõ nếu dữ liệu là mock hoặc không đầy đủ
9. Trả về JSON hợp lệ theo đúng schema sau:

{
  "symbol": string,
  "asOf": string (ISO 8601),
  "timeframe": "1D",
  "summary": string (tóm tắt 2-3 câu),
  "trend": { "classification": "bullish"|"bearish"|"mixed"|"insufficient_data", "reasons": string[] },
  "momentum": { "classification": "improving"|"weakening"|"bullish"|"bearish"|"neutral"|"insufficient_data", "reasons": string[] },
  "bullishFactors": string[],
  "bearishFactors": string[],
  "setup": { "classification": "potential_entry"|"wait_for_confirmation"|"hold_watch"|"risk_elevated"|"insufficient_data", "explanation": string },
  "scenarios": [
    { "name": "bullish", "trigger": string, "invalidation": string, "rationale": string[] },
    { "name": "bearish", "trigger": string, "invalidation": string, "rationale": string[] }
  ],
  "risks": string[],
  "limitations": string[]
}`;

function buildUserPrompt(analysis: AnalysisOutput): string {
  const { symbol, asOf, dataSource, technical, decision, priceZones, warnings } = analysis;
  const { snapshot, dataQuality } = technical;

  return `Phân tích kỹ thuật cho ${symbol} (${asOf})

NGUỒN DỮ LIỆU:
- Provider: ${dataSource.provider}${dataSource.isMock ? ' (DỮ LIỆU MÔ PHỎNG)' : ''}
- Số nến: ${dataQuality.totalCandles}
- Đơn vị giá: ${dataSource.priceUnit}

CHỈ SỐ KỸ THUẬT (snapshot mới nhất):
- Giá đóng cửa: ${snapshot.close}
- EMA20: ${snapshot.ema20 ?? 'N/A'}
- EMA50: ${snapshot.ema50 ?? 'N/A'}
- EMA200: ${snapshot.ema200 ?? 'N/A'}
- RSI14: ${snapshot.rsi14 ?? 'N/A'}
- MACD: ${snapshot.macd ?? 'N/A'} | Signal: ${snapshot.macdSignal ?? 'N/A'} | Histogram: ${snapshot.macdHistogram ?? 'N/A'}
- ATR14: ${snapshot.atr14 ?? 'N/A'}
- Volume SMA20: ${snapshot.volumeSma20 ?? 'N/A'}
- Volume Ratio: ${snapshot.volumeRatio20 ?? 'N/A'}

PHÂN LOẠI TỪ RULE ENGINE:
- Xu hướng: ${decision.trend.classification} — ${decision.trend.reasons.join('; ')}
- Động lượng: ${decision.momentum.classification} — ${decision.momentum.reasons.join('; ')}
- Khối lượng: ${decision.volume.classification} — ${decision.volume.reasons.join('; ')}
- Setup: ${decision.setup.classification} — ${decision.setup.explanation}

KỊCH BẢN:
${decision.scenarios.map(s => `- ${s.name.toUpperCase()}: Trigger: ${s.trigger} | Invalidation: ${s.invalidation}`).join('\n')}

VÙNG HỖ TRỢ/KHÁNG CỰ:
${priceZones.length > 0 ? priceZones.map(z => `- ${z.type}: ${z.lower}–${z.upper} (bằng chứng: ${z.evidenceCount})`).join('\n') : 'Không có đủ bằng chứng'}

CẢNH BÁO:
${warnings.length > 0 ? warnings.join('\n') : 'Không có'}
${analysis.fundamental ? `
DỮ LIỆU CƠ BẢN (BSI):
- Ngành: ${analysis.fundamental.filter.industry}
- Vốn hóa: ${analysis.fundamental.filter.marketCapBillion.toFixed(0)} tỷ VND
- PE: ${analysis.fundamental.filter.pe > 0 ? analysis.fundamental.filter.pe.toFixed(2) : 'N/A'} | PB: ${analysis.fundamental.filter.pb > 0 ? analysis.fundamental.filter.pb.toFixed(2) : 'N/A'} | PS: ${analysis.fundamental.filter.ps > 0 ? analysis.fundamental.filter.ps.toFixed(2) : 'N/A'}
- EPS: ${analysis.fundamental.filter.eps > 0 ? analysis.fundamental.filter.eps.toFixed(0) : 'N/A'} | BVPS: ${analysis.fundamental.filter.bvps > 0 ? analysis.fundamental.filter.bvps.toFixed(0) : 'N/A'}
- ROE: ${analysis.fundamental.filter.roe.toFixed(2)}% | ROA: ${analysis.fundamental.filter.roa.toFixed(2)}%
- Beta: ${analysis.fundamental.filter.beta.toFixed(2)}
- Sở hữu NĐTNN: ${analysis.fundamental.filter.foreignOwnershipPct.toFixed(2)}%
- 52W High/Low: ${analysis.fundamental.filter.high52W} / ${analysis.fundamental.filter.low52W}
- Hiệu suất: 1D=${analysis.fundamental.filter.perChange1D}% | 1M=${analysis.fundamental.filter.perChange1M}% | 1Y=${analysis.fundamental.filter.perChange1Y}%
- Tín hiệu BSI: ${JSON.stringify(analysis.fundamental.filter.generalSignal)} (negative/neutral/positive)${analysis.fundamental.valuation.peFairValue ? `\n- Giá hợp lý theo PE: ${analysis.fundamental.valuation.peFairValue.toFixed(0)} VND` : ''}${analysis.fundamental.valuation.pbFairValue ? `\n- Giá hợp lý theo PB: ${analysis.fundamental.valuation.pbFairValue.toFixed(0)} VND` : ''}` : ''}

Hãy phân tích và trả về JSON theo schema đã cho. QUAN TRỌNG: trend.classification và momentum.classification PHẢI khớp với giá trị từ rule engine ở trên, trừ khi có lý do kỹ thuật rõ ràng để khác biệt.`;
}

export function buildFallbackReport(analysis: AnalysisOutput): AnalysisReport {
  const { symbol, asOf, decision, priceZones, warnings } = analysis;
  const { trend, momentum, setup, scenarios } = decision;

  const limitations: string[] = [
    'Báo cáo này được tạo tự động không có LLM.',
    ...warnings,
  ];

  const supportZones = priceZones.filter(z => z.type === 'support');
  const resistanceZones = priceZones.filter(z => z.type === 'resistance');

  return {
    symbol,
    asOf,
    timeframe: '1D' as const,
    summary: `${symbol}: Xu hướng ${trend.classification}, động lượng ${momentum.classification}. Setup: ${setup.classification}.`,
    trend,
    momentum,
    bullishFactors: scenarios.find(s => s.name === 'bullish')?.rationale ?? [],
    bearishFactors: scenarios.find(s => s.name === 'bearish')?.rationale ?? [],
    setup,
    scenarios: scenarios as AnalysisReport['scenarios'],
    risks: [
      'Phân tích kỹ thuật không đảm bảo kết quả trong tương lai.',
      supportZones.length > 0
        ? `Hỗ trợ gần nhất: ${supportZones[0].lower}–${supportZones[0].upper}`
        : 'Không xác định được vùng hỗ trợ.',
      resistanceZones.length > 0
        ? `Kháng cự gần nhất: ${resistanceZones[0].lower}–${resistanceZones[0].upper}`
        : 'Không xác định được vùng kháng cự.',
    ],
    limitations,
  };
}

export async function generateReport(
  analysis: AnalysisOutput,
): Promise<{ report: AnalysisReport; promptVersion: string; model: string | null }> {
  const provider = getLlmProvider();

  if (!provider) {
    return {
      report: buildFallbackReport(analysis),
      promptVersion: PROMPT_VERSION,
      model: null,
    };
  }

  const userPrompt = buildUserPrompt(analysis);

  // Metadata we already know — inject after parsing so LLM doesn't need to return them correctly
  const knownMeta = { symbol: analysis.symbol, asOf: analysis.asOf, timeframe: '1D' as const };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await provider.complete(userPrompt, SYSTEM_PROMPT);
      process.stderr.write(`[llm] attempt ${attempt + 1} raw (first 300): ${raw.slice(0, 300)}\n`);
      const parsed = extractJson(raw);
      // Collect candidates: root object + any direct child objects (handles model wrapping)
      const candidates = [parsed, ...(typeof parsed === 'object' && parsed !== null
        ? Object.values(parsed as Record<string, unknown>).filter(v => typeof v === 'object' && v !== null)
        : [])];
      let lastErr: unknown;
      for (const candidate of candidates) {
        try {
          // Merge known metadata before validating so LLM doesn't need to return them correctly
          const merged = typeof candidate === 'object' && candidate !== null
            ? { ...knownMeta, ...(candidate as Record<string, unknown>) }
            : candidate;
          const validated = analysisReportSchema.parse(merged);
          return { report: validated, promptVersion: PROMPT_VERSION, model: provider.providerName };
        } catch (e) { lastErr = e; }
      }
      throw lastErr;
    } catch (err) {
      process.stderr.write(`[llm] attempt ${attempt + 1} failed: ${err instanceof Error ? err.message : String(err)}\n`);
      if (attempt === 1) break;
    }
  }

  return {
    report: buildFallbackReport(analysis),
    promptVersion: PROMPT_VERSION,
    model: null,
  };
}
