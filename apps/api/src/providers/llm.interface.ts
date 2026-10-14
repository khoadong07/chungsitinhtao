export interface LlmProvider {
  complete(prompt: string, systemPrompt: string): Promise<string>;
  readonly providerName: string;
}
