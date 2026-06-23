// Patch @midscene/core's service-caller for the Bosch corp-proxy environment.
//
// Two related problems this fixes:
//   1. Upstream NTLM proxy closes the CONNECT tunnel at ~30 s idle.
//      Vision calls on SAP screens routinely think 40+ s, so non-streaming
//      calls die with UND_ERR_SOCKET / "other side closed" before the model
//      finishes.  → Force streaming by default so the model emits chunks
//      token-by-token, keeping bytes flowing.
//   2. Streaming alone isn't enough: time-to-first-token can also exceed
//      30 s (model still computing the first byte). Midscene's streaming
//      branch had NO retry loop (only the non-streaming branch did), so
//      one unlucky cold-start failure surfaced as a hard error.
//      → Wrap the streaming body in the same retry/interval loop as the
//      non-streaming branch.
//
// Run after every `npm install` (or whenever @midscene/core changes):
//   node scripts/patch-midscene-streaming.mjs

import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, '..', 'node_modules/@midscene/core/dist/es/ai-model/service-caller/index.mjs');

let src;
try { src = readFileSync(file, 'utf8'); }
catch (e) { console.error(`✗ Cannot read ${file}: ${e.message}`); process.exit(1); }

const MARKER_FULL = 'PATCHED (saptest1): wrap streaming branch';
if (src.includes(MARKER_FULL)) {
  console.log('✓ Already fully patched. Nothing to do.');
  process.exit(0);
}

const PATCHES = [
  {
    name: 'force streaming default',
    from: `    const isStreaming = options?.stream && options?.onChunk;`,
    to:
`    // PATCHED (saptest1 / Bosch corp proxy): default to streaming so the
    // upstream NTLM proxy doesn't close the CONNECT tunnel at ~30s idle
    // while the model is still thinking. Caller can opt out with
    // \`stream: false\`. onChunk is now optional — streaming path uses ?.
    const isStreaming = options?.stream !== false;`,
  },
  {
    name: 'wrap streaming branch in retry loop + guard onChunk',
    from:
`        if (isStreaming) {
            const { signal: streamSignal, cleanup: cleanupStreamSignal } = buildRequestAbortSignal(effectiveTimeoutMs, options?.abortSignal);
            try {
                const stream = await completion.create({
                    model: modelName,
                    messages: messagesWithImageDetail,
                    ...commonConfig,
                    ...reasoningEffortConfig,
                    ...extraBody
                }, {
                    stream: true,
                    signal: streamSignal
                });
                requestId = stream._request_id;
                for await (const chunk of stream){
                    const content = chunk.choices?.[0]?.delta?.content || '';
                    const reasoning_content = chunk.choices?.[0]?.delta?.reasoning_content || '';
                    if (chunk.usage) usage = chunk.usage;
                    if (content || reasoning_content) {
                        accumulated += content;
                        accumulatedReasoning += reasoning_content;
                        const chunkData = {
                            content,
                            reasoning_content,
                            accumulated,
                            isComplete: false,
                            usage: void 0
                        };
                        options.onChunk(chunkData);
                    }
                    if (chunk.choices?.[0]?.finish_reason) {
                        timeCost = Date.now() - startTime;
                        if (!usage) {
                            const estimatedTokens = Math.max(1, Math.floor(accumulated.length / 4));
                            usage = {
                                prompt_tokens: estimatedTokens,
                                completion_tokens: estimatedTokens,
                                total_tokens: 2 * estimatedTokens
                            };
                        }
                        const finalChunk = {
                            content: '',
                            accumulated,
                            reasoning_content: '',
                            isComplete: true,
                            usage: buildUsageInfo(usage, requestId)
                        };
                        options.onChunk(finalChunk);
                        break;
                    }
                }
            } finally{
                cleanupStreamSignal();
            }
            content = accumulated;
            debugProfileStats(\`streaming model, \${modelName}, mode, \${modelFamily || 'default'}, cost-ms, \${timeCost}, temperature, \${temperature ?? ''}\`);
        } else {`,
    to:
`        if (isStreaming) {
            // PATCHED (saptest1): wrap streaming branch in the same retry
            // loop the non-streaming branch has. The upstream Bosch corp
            // proxy occasionally closes the CONNECT tunnel at ~30s while
            // the model is still computing the FIRST token (streaming only
            // helps AFTER first token). Auto-retry on those transient
            // socket errors instead of bubbling up immediately.
            const retryCount = modelConfig.retryCount ?? 1;
            const retryInterval = modelConfig.retryInterval ?? 2000;
            const maxAttempts = retryCount + 1;
            let lastError;
            let streamingDone = false;
            for (let attempt = 1; attempt <= maxAttempts && !streamingDone; attempt++) {
                accumulated = '';
                accumulatedReasoning = '';
                usage = void 0;
                const { signal: streamSignal, cleanup: cleanupStreamSignal } = buildRequestAbortSignal(effectiveTimeoutMs, options?.abortSignal);
                try {
                    const stream = await completion.create({
                        model: modelName,
                        messages: messagesWithImageDetail,
                        ...commonConfig,
                        ...reasoningEffortConfig,
                        ...extraBody
                    }, {
                        stream: true,
                        signal: streamSignal
                    });
                    requestId = stream._request_id;
                    for await (const chunk of stream){
                        const content = chunk.choices?.[0]?.delta?.content || '';
                        const reasoning_content = chunk.choices?.[0]?.delta?.reasoning_content || '';
                        if (chunk.usage) usage = chunk.usage;
                        if (content || reasoning_content) {
                            accumulated += content;
                            accumulatedReasoning += reasoning_content;
                            const chunkData = {
                                content,
                                reasoning_content,
                                accumulated,
                                isComplete: false,
                                usage: void 0
                            };
                            options?.onChunk?.(chunkData);
                        }
                        if (chunk.choices?.[0]?.finish_reason) {
                            timeCost = Date.now() - startTime;
                            if (!usage) {
                                const estimatedTokens = Math.max(1, Math.floor(accumulated.length / 4));
                                usage = {
                                    prompt_tokens: estimatedTokens,
                                    completion_tokens: estimatedTokens,
                                    total_tokens: 2 * estimatedTokens
                                };
                            }
                            const finalChunk = {
                                content: '',
                                accumulated,
                                reasoning_content: '',
                                isComplete: true,
                                usage: buildUsageInfo(usage, requestId)
                            };
                            options?.onChunk?.(finalChunk);
                            break;
                        }
                    }
                    streamingDone = true;
                } catch (streamErr) {
                    lastError = streamErr;
                    if (attempt < maxAttempts) {
                        debugCall(\`AI streaming call failed (attempt \${attempt}/\${maxAttempts}), retrying in \${retryInterval}ms... Error: \${streamErr?.message}\`);
                        await new Promise(r => setTimeout(r, retryInterval));
                    }
                } finally {
                    cleanupStreamSignal();
                }
            }
            if (!streamingDone) throw lastError ?? new Error('Streaming call failed after retries');
            content = accumulated;
            debugProfileStats(\`streaming model, \${modelName}, mode, \${modelFamily || 'default'}, cost-ms, \${timeCost}, temperature, \${temperature ?? ''}\`);
        } else {`,
  },
];

let patched = src;
for (const p of PATCHES) {
  if (!patched.includes(p.from)) {
    console.error(`✗ Cannot find anchor for "${p.name}". Midscene source may have changed (or partial patch already applied).`);
    process.exit(1);
  }
  patched = patched.replace(p.from, p.to);
  console.log(`  · ${p.name}`);
}

writeFileSync(file, patched);
console.log(`\n✓ Patched ${file}`);
console.log(`  size: ${statSync(file).size} bytes`);
