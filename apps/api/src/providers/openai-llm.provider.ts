import type { LlmProvider } from './llm.interface.js';
import { AppError } from '../utils/errors.js';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export class OpenAiLlmProvider implements LlmProvider {
  readonly providerName = 'openai';

  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly timeoutMs: number,
    baseUrl?: string,
  ) {
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  }

  async complete(userPrompt: string, systemPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after');
        // Cap wait at 10s so total backend time stays within frontend's 3min poll window
        const waitMs = Math.min(retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000, 10000);
        process.stderr.write(`[llm] 429 rate limit — retrying after ${waitMs}ms\n`);
        await new Promise(r => setTimeout(r, waitMs));
        throw new AppError('LLM_RATE_LIMIT', 'Rate limited — will retry', 429);
      }
      if (!res.ok) {
        throw new AppError('LLM_API_ERROR', `OpenAI API error: ${res.status}`, 502);
      }

      const data = await res.json() as { choices: Array<{ message: { content: string }; finish_reason: string }> };
      const choice = data.choices[0];
      if (choice?.finish_reason === 'length') {
        process.stderr.write('[llm] OpenAI response truncated (finish_reason=length) — increase max_tokens\n');
      }
      return choice?.message?.content ?? '';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AppError('LLM_TIMEOUT', 'LLM request timed out', 504);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
