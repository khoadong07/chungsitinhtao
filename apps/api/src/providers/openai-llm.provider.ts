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
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new AppError('LLM_API_ERROR', `OpenAI API error: ${res.status}`, 502);
      }

      const data = await res.json() as { choices: Array<{ message: { content: string } }> };
      return data.choices[0]?.message?.content ?? '';
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
