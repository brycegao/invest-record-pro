/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: Ollama fetch mock 共享 helper
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

/**
 * Creates a JavaScript string to inject via page.addInitScript().
 * Monkey-patches window.fetch to intercept Ollama API calls.
 *
 * @param options.tagsAvailable - Whether /api/tags returns model list (default: true)
 * @param options.tagsError    - Whether /api/tags throws connection error (default: false)
 * @param options.generateResponse - Response text for /api/generate (default: '')
 */
export function createFetchMockScript(options: {
  tagsAvailable?: boolean
  tagsError?: boolean
  generateResponse?: string
}): string {
  const { tagsAvailable = true, tagsError = false, generateResponse = '' } = options

  const tagsHandler = tagsError
    ? `throw new Error('Connection refused')`
    : tagsAvailable
      ? `return new Response(JSON.stringify({ models: [{ name: 'qwen2.5:7b', model: 'qwen2.5:7b', modified_at: '2026-01-01', size: 4700000000 }] }), { status: 200, headers: { 'Content-Type': 'application/json' } })`
      : `return new Response(JSON.stringify({ models: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })`

  return `
    (function() {
      const originalFetch = window.fetch;
      window.fetch = function(url, options) {
        const urlStr = typeof url === 'string' ? url : url.url;

        // Ollama API calls
        if (urlStr.includes('/api/tags')) {
          ${tagsHandler}
        }

        if (urlStr.includes('/api/generate')) {
          return new Response(JSON.stringify({
            model: 'qwen2.5:7b',
            response: ${JSON.stringify(generateResponse)},
            done: true,
            total_duration: 5000000000,
            eval_count: 100
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Non-Ollama calls go through original fetch (for Vite HMR etc.)
        return originalFetch.apply(this, arguments);
      };
      console.log('[Fetch Mock] Injected');
    })();
  `
}
