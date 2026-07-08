// Minimal docx → plain text extractor for SAP SOP conversion.
// Reads word/document.xml, joins <w:t> runs, adds newlines for <w:p>.
// No dependencies — walks the zip central directory + inflates deflated
// entries manually. Enough for these SOP docs (no images / tables we care about).

import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function readU32LE(buf, off) { return buf.readUInt32LE(off); }
function readU16LE(buf, off) { return buf.readUInt16LE(off); }

function extractDocumentXml(zipPath) {
  const buf = fs.readFileSync(zipPath);
  // Find End of Central Directory (EOCD) — signature 0x06054b50.
  // Full-file scan is fine for the doc sizes we work with. Some
  // exporters emit long trailing content that pushes EOCD past the
  // usual 65KB search window.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('no EOCD in ' + zipPath);
  const cdOffset = readU32LE(buf, eocd + 16);
  const cdCount  = readU16LE(buf, eocd + 10);
  let off = cdOffset;
  for (let i = 0; i < cdCount; i += 1) {
    if (readU32LE(buf, off) !== 0x02014b50) throw new Error('bad CD sig');
    const method     = readU16LE(buf, off + 10);
    const compSize   = readU32LE(buf, off + 20);
    const uncompSize = readU32LE(buf, off + 24);
    const nameLen    = readU16LE(buf, off + 28);
    const extraLen   = readU16LE(buf, off + 30);
    const commLen    = readU16LE(buf, off + 32);
    const localOff   = readU32LE(buf, off + 42);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString('utf8');
    if (name === 'word/document.xml') {
      // Local file header at localOff
      if (readU32LE(buf, localOff) !== 0x04034b50) throw new Error('bad LFH');
      const lNameLen  = readU16LE(buf, localOff + 26);
      const lExtraLen = readU16LE(buf, localOff + 28);
      const dataStart = localOff + 30 + lNameLen + lExtraLen;
      const data = buf.slice(dataStart, dataStart + compSize);
      const xml = method === 0 ? data : zlib.inflateRawSync(data);
      return xml.toString('utf8');
    }
    off += 46 + nameLen + extraLen + commLen;
  }
  throw new Error('word/document.xml not found in ' + zipPath);
}

function xmlToText(xml) {
  // Replace <w:tab/> with tabs, </w:p> with newlines, then strip all tags
  // and unescape XML entities. Keeps ordering because we operate on the
  // raw string in document order.
  let s = xml;
  s = s.replace(/<w:tab\s*\/?>/g, '\t');
  s = s.replace(/<w:br\s*\/?>/g, '\n');
  s = s.replace(/<\/w:p>/g, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(+d));
  // Collapse runs of empty lines
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: node docx-to-text.mjs <file.docx> [more...]');
  process.exit(1);
}
for (const a of args) {
  console.log('\n===== ' + path.basename(a) + ' =====');
  try {
    const xml = extractDocumentXml(a);
    console.log(xmlToText(xml));
  } catch (e) {
    console.error('[fail] ' + a + ': ' + e.message);
  }
}
