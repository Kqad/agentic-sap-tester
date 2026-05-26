// Download-success assertion intercept. When an aiAssert instruction reads
// like "页面底部显示绿色√符号加download xxx文件即为成功" / "download success"
// we skip the AI assertion and instead poll the user's Downloads folder for
// a fresh file with a matching extension. Once a stable (size-unchanged)
// file appears, push a DownloadRecord into summary.downloads and report
// success. Ported from Desktop\saptest\src\lib\midscene.ts lines 1177–1311.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { sleep } from './helpers.js';

export const DOWNLOAD_CHECK_TIMEOUT_MS = 30_000;
export const DOWNLOAD_CHECK_POLL_MS = 1000;
export const DOWNLOAD_STABLE_WAIT_MS = 800;

const INCOMPLETE_DOWNLOAD_EXTS = new Set(['.crdownload', '.download', '.part', '.partial', '.tmp']);

// ── Instruction classification ──────────────────────────────────────────
export function isDownloadCheckInstruction(instruction) {
  if (!instruction) return false;
  return (
    (/下载/.test(instruction) && /成功/.test(instruction)) ||
    (/download/i.test(instruction) && /success|successful|succeed/i.test(instruction)) ||
    /(?:检查|确认|验证|等待|判断|查看).{0,24}(?:下载|文件).{0,40}(?:成功|完成|结束|存在|出现|生成|已下载|保存|落地|是否)/i.test(instruction) ||
    /(?:下载|文件).{0,40}(?:是否)?(?:成功|完成|已下载|存在|出现|生成|保存)/i.test(instruction) ||
    /(?:check|confirm|verify|validate|ensure|wait(?:\s+for)?|assert).{0,50}(?:download|file).{0,70}(?:success|successful|succeed|complete|completed|finished|exists?|appears?|created|saved|downloaded)/i.test(instruction) ||
    /(?:download|file).{0,70}(?:success|successful|succeed|complete|completed|finished|downloaded|exists?|saved)/i.test(instruction)
  );
}

export function expectedDownloadExtensions(instruction) {
  const lower = String(instruction ?? '').toLowerCase();
  const set = new Set();
  if (/excel|spreadsheet|xlsx|xls|表格/.test(lower)) { set.add('.xlsx'); set.add('.xls'); }
  if (/csv/.test(lower)) set.add('.csv');
  if (/pdf/.test(lower)) set.add('.pdf');
  if (/zip/.test(lower)) set.add('.zip');
  if (/txt|text/.test(lower)) set.add('.txt');
  if (/xml/.test(lower)) set.add('.xml');
  if (/json/.test(lower)) set.add('.json');
  if (/docx?/.test(lower)) { set.add('.doc'); set.add('.docx'); }
  return [...set];
}

// ── Download directory discovery ────────────────────────────────────────
function configuredDownloadDirectories() {
  const candidates = [
    process.env.MIDSCENE_DOWNLOAD_DIR,
    process.env.DOWNLOAD_DIR,
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Downloads') : null,
    path.join(homedir(), 'Downloads'),
  ].filter(Boolean);
  return [...new Set(candidates)].filter((d) => {
    try { return existsSync(d) && statSync(d).isDirectory(); } catch { return false; }
  });
}

// ── Scanning ────────────────────────────────────────────────────────────
function candidateDownloadFiles(sinceMs, expectedExtensions) {
  const wantedSet = new Set(expectedExtensions.map((e) => e.toLowerCase()));
  const out = [];
  for (const dir of configuredDownloadDirectories()) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path.join(dir, entry.name);
      const ext = path.extname(entry.name).toLowerCase();
      if (INCOMPLETE_DOWNLOAD_EXTS.has(ext)) continue;
      if (wantedSet.size > 0 && !wantedSet.has(ext)) continue;
      let stats;
      try { stats = statSync(filePath); } catch { continue; }
      if (stats.mtimeMs < sinceMs || stats.size <= 0) continue;
      const tempSibling = [...INCOMPLETE_DOWNLOAD_EXTS].some((s) => existsSync(`${filePath}${s}`));
      if (tempSibling) continue;
      out.push({
        fileName: entry.name,
        filePath,
        sizeBytes: stats.size,
        modifiedAt: stats.mtime.toISOString(),
        modifiedMs: stats.mtimeMs,
        matchedExtensions: expectedExtensions,
      });
    }
  }
  return out.sort((a, b) => b.modifiedMs - a.modifiedMs);
}

async function isStableDownloadedFile(filePath, sizeBytes) {
  await sleep(DOWNLOAD_STABLE_WAIT_MS);
  try {
    const stats = statSync(filePath);
    return stats.size === sizeBytes && stats.size > 0;
  } catch { return false; }
}

// ── Top-level entry point used by runner ────────────────────────────────
export async function waitForDownloadedFile(instruction, summary) {
  const expectedExtensions = expectedDownloadExtensions(instruction);
  const startedAt = Math.max(
    summary.downloadStartedAtMs - 5000,
    summary.lastDownloadCheckAtMs - 5000,
  );
  const deadline = Date.now() + DOWNLOAD_CHECK_TIMEOUT_MS;
  while (Date.now() <= deadline) {
    const [candidate] = candidateDownloadFiles(startedAt, expectedExtensions);
    if (candidate && await isStableDownloadedFile(candidate.filePath, candidate.sizeBytes)) {
      const record = {
        fileName: candidate.fileName,
        filePath: candidate.filePath,
        sizeBytes: candidate.sizeBytes,
        modifiedAt: candidate.modifiedAt,
        matchedExtensions: candidate.matchedExtensions,
      };
      summary.downloads.push(record);
      summary.lastDownloadCheckAtMs = Math.max(Date.now(), candidate.modifiedMs + 1);
      return record;
    }
    await sleep(DOWNLOAD_CHECK_POLL_MS);
  }
  const locations = configuredDownloadDirectories().join(', ') || '(no Downloads dir found)';
  const expected = expectedExtensions.length ? expectedExtensions.join(', ') : 'any completed file';
  throw new Error(
    `下载检测失败：${DOWNLOAD_CHECK_TIMEOUT_MS / 1000}s 内没有在 ${locations} 找到新的已完成文件（期望：${expected}）。`,
  );
}
