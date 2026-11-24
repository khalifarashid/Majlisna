/**
 * Key handling with no SDK import, so the Anthropic SDK and zod are only downloaded
 * when a viewer has actually added a Claude key.
 */

export const MODEL = 'claude-opus-5-5';
const KEY_STORAGE = 'majlisna.aiKey';

export type AiErrorCode = 'no_key' | 'bad_key' | 'rate_limited' | 'refused' | 'network' | 'unknown';

export class AiError extends Error {
  readonly code: AiErrorCode;
  constructor(code: AiErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AiError';
    this.code = code;
  }
}

export function getAiKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setAiKey(key: string | null): void {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* storage blocked: AI stays off */
  }
  window.dispatchEvent(new Event('majlisna-ai-key'));
}

export function hasAiKey(): boolean {
  return !!getAiKey();
}
