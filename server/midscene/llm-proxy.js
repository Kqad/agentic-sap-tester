// Configure undici's global dispatcher to route Midscene's LLM calls through
// the corporate proxy. Ported (1:1) from Desktop\saptest\src\lib\llm-proxy.ts.
//
// saptest1 already runs tests with HTTPS_PROXY=http://localhost:3128 (see
// package.json scripts). This module makes the same wiring available inside
// the Express process when it calls Midscene in-process.

import { Agent, ProxyAgent, setGlobalDispatcher } from 'undici';

let configuredProxyUrl = '';

const LONG_LIVED_TIMEOUTS = {
  headersTimeout: 10 * 60 * 1000,
  bodyTimeout: 10 * 60 * 1000,
  keepAliveTimeout: 60 * 1000,
  keepAliveMaxTimeout: 10 * 60 * 1000,
};

export function getLlmProxyUrl() {
  return (
    process.env.LLM_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.ALL_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy ||
    process.env.all_proxy ||
    ''
  ).trim();
}

export function configureLlmProxy() {
  const proxyUrl = getLlmProxyUrl();
  if (!proxyUrl || proxyUrl === configuredProxyUrl) return;
  setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl, ...LONG_LIVED_TIMEOUTS }));
  configuredProxyUrl = proxyUrl;
}

export function buildLongLivedDispatcher({ bypassProxy = false } = {}) {
  const proxyUrl = getLlmProxyUrl();
  if (bypassProxy || !proxyUrl) return new Agent({ ...LONG_LIVED_TIMEOUTS });
  return new ProxyAgent({ uri: proxyUrl, ...LONG_LIVED_TIMEOUTS });
}

export function llmProxyEnvPatch() {
  const proxyUrl = getLlmProxyUrl();
  if (!proxyUrl) return {};
  return {
    HTTP_PROXY: proxyUrl,
    HTTPS_PROXY: proxyUrl,
    ALL_PROXY: proxyUrl,
    http_proxy: proxyUrl,
    https_proxy: proxyUrl,
    all_proxy: proxyUrl,
    MIDSCENE_MODEL_HTTP_PROXY: proxyUrl,
    MIDSCENE_INSIGHT_MODEL_HTTP_PROXY: proxyUrl,
    MIDSCENE_PLANNING_MODEL_HTTP_PROXY: proxyUrl,
  };
}
