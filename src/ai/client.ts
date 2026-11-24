import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { z } from 'zod';
import { AiError, getAiKey, MODEL } from './key';

/**
 * Claude access for a static site. There is no server, so each viewer pastes their own
 * Anthropic API key in Settings; it is kept only in that browser's localStorage and is
 * sent only to api.anthropic.com. This module is loaded lazily (see features.ts).
 */

/**
 * Server-side refusal fallback: if Claude Opus 5.5 declines a request, the API re-runs it
 * on a fallback model inside the same call.
 */
const FALLBACK: { betas: Anthropic.Beta.AnthropicBeta[]; fallbacks: 'default' } = {
  betas: ['server-side-fallback-2026-07-01'],
  fallbacks: 'default',
};

let cached: { key: string; client: Anthropic } | null = null;

function client(): Anthropic {
  const key = getAiKey();
  if (!key) throw new AiError('no_key');
  if (cached?.key === key) return cached.client;
  const c = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 90_000 });
  cached = { key, client: c };
  return c;
}

export function toAiError(e: unknown): AiError {
  if (e instanceof AiError) return e;
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return new AiError('bad_key');
  if (e instanceof Anthropic.RateLimitError) return new AiError('rate_limited');
  if (e instanceof Anthropic.APIConnectionError) return new AiError('network');
  if (e instanceof Anthropic.APIError) return new AiError('unknown', e.message);
  return new AiError('unknown', e instanceof Error ? e.message : String(e));
}

/** One structured-output call. Returns the parsed object or throws AiError. */
export async function askJson<T>(schema: z.ZodType<T>, system: string, user: string, effort: 'low' | 'medium' = 'low'): Promise<T> {
  try {
    const res = await client().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      ...FALLBACK,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { effort, format: betaZodOutputFormat(schema) },
    });
    if (res.stop_reason === 'refusal') throw new AiError('refused');
    if (res.parsed_output == null) throw new AiError('unknown', 'The AI reply could not be read.');
    return res.parsed_output as T;
  } catch (e) {
    throw toAiError(e);
  }
}

/** Streaming chat. `onText` receives the whole answer so far on every delta. */
export async function streamChat(
  system: string,
  messages: Anthropic.Beta.BetaMessageParam[],
  onText: (full: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const stream = client().beta.messages.stream(
      { model: MODEL, max_tokens: 16000, ...FALLBACK, system, messages, output_config: { effort: 'low' } },
      { signal },
    );
    let text = '';
    stream.on('text', (delta) => {
      text += delta;
      onText(text);
    });
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') throw new AiError('refused');
    return text;
  } catch (e) {
    throw toAiError(e);
  }
}

/** Cheap call used by Settings to check a pasted key (token counting is free). */
export async function testKey(): Promise<void> {
  try {
    await client().messages.countTokens({ model: MODEL, messages: [{ role: 'user', content: 'ping' }] });
  } catch (e) {
    throw toAiError(e);
  }
}
