import Anthropic from '@anthropic-ai/sdk';
import type { LlmProvider } from './llm.interface.js';
import { AppError } from '../utils/errors.js';

export class AnthropicLlmProvider implements LlmProvider {
  readonly providerName = 'anthropic';

  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
    private readonly timeoutMs: number,
  ) {
    this.client = new Anthropic({ apiKey, timeout: timeoutMs });
  }

  async complete(userPrompt: string, systemPrompt: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find(b => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new AppError('LLM_EMPTY_RESPONSE', 'Anthropic returned no text content', 502);
      }

      return textBlock.text;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof Anthropic.APIConnectionTimeoutError) {
        throw new AppError('LLM_TIMEOUT', 'LLM request timed out', 504);
      }
      if (err instanceof Anthropic.APIError) {
        throw new AppError('LLM_API_ERROR', `Anthropic API error: ${err.status} ${err.message}`, 502);
      }
      throw err;
    }
  }
}
