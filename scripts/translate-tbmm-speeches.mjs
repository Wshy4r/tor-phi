import { readdir, readFile, writeFile } from "node:fs/promises";
import crypto from "node:crypto";

const ACTIVITY_DIR = new URL("../public/source/tbmm-activity/", import.meta.url);
const SPEECH_LABELS = new Set(["General Assembly speeches", "Committee speeches"]);
const TRANSLATE_LIMIT = Number(process.env.TRANSLATE_LIMIT || "0");
const TRANSLATE_CONCURRENCY = Number(process.env.TRANSLATE_CONCURRENCY || "4");
const CHUNK_SIZE = Number(process.env.TRANSLATE_CHUNK_SIZE || "3200");
const BATCH_SIZE = Number(process.env.TRANSLATE_BATCH_SIZE || "4200");
const REQUEST_DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS || "80");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chunkText(text) {
  const paragraphs = `${text ?? ""}`.split(/\n{2,}/);
  const chunks = [];
  let current = "";

  function pushCurrent() {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  }

  for (const paragraph of paragraphs) {
    const clean = paragraph.trim();
    if (!clean) continue;

    if (clean.length > CHUNK_SIZE) {
      pushCurrent();
      const sentences = clean.match(/[^.!?。؟]+[.!?。؟]?\s*/g) ?? [clean];
      for (const sentence of sentences) {
        if ((current + sentence).length > CHUNK_SIZE) pushCurrent();
        if (sentence.length > CHUNK_SIZE) {
          for (let index = 0; index < sentence.length; index += CHUNK_SIZE) {
            chunks.push(sentence.slice(index, index + CHUNK_SIZE).trim());
          }
        } else {
          current += sentence;
        }
      }
      pushCurrent();
      continue;
    }

    if ((current + "\n\n" + clean).length > CHUNK_SIZE) pushCurrent();
    current = current ? `${current}\n\n${clean}` : clean;
  }

  pushCurrent();
  return chunks;
}

async function translateChunk(chunk, attempt = 1) {
  await sleep(REQUEST_DELAY_MS);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl=en&dt=t&q=${encodeURIComponent(chunk)}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (attempt < 5) {
      await sleep(750 * attempt);
      return translateChunk(chunk, attempt + 1);
    }
    throw new Error(`Translate HTTP ${response.status}`);
  }

  const data = await response.json();
  return (data?.[0] ?? []).map((part) => part?.[0] ?? "").join("");
}

async function translateText(text) {
  const chunks = chunkText(text);
  const translated = [];

  for (const chunk of chunks) {
    translated.push(await translateChunk(chunk));
  }

  return translated.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

function makeSegments(targets) {
  const segments = [];

  targets.forEach(({ record, index }) => {
    const hash = crypto.createHash("sha1").update(record.originalTurkish).digest("hex");
    chunkText(record.originalTurkish).forEach((text, partIndex) => {
      segments.push({ recordIndex: index, hash, partIndex, text });
    });
  });

  return segments;
}

function packSegments(segments) {
  const batches = [];
  let current = [];
  let currentLength = 0;

  segments.forEach((segment) => {
    const marker = `<<<TORPHI_${current.length}>>>`;
    const entryLength = marker.length + segment.text.length + 2;

    if (current.length > 0 && currentLength + entryLength > BATCH_SIZE) {
      batches.push(current);
      current = [];
      currentLength = 0;
    }

    current.push(segment);
    currentLength += entryLength;
  });

  if (current.length > 0) batches.push(current);
  return batches;
}

function makeBatchText(batch) {
  return batch.map((segment, index) => `<<<TORPHI_${index}>>>\n${segment.text}`).join("\n\n");
}

function splitBatchTranslation(translatedText, expectedCount) {
  const markerPattern = /<<<TORPHI_(\d+)>>>/g;
  const matches = [...translatedText.matchAll(markerPattern)];
  if (matches.length !== expectedCount) return null;

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? translatedText.length;
    return translatedText.slice(start, end).trim();
  });
}

async function translateBatch(batch) {
  const translatedBatch = await translateChunk(makeBatchText(batch));
  const split = splitBatchTranslation(translatedBatch, batch.length);
  if (split) return split;

  const fallback = [];
  for (const segment of batch) {
    fallback.push(await translateText(segment.text));
  }
  return fallback;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  const files = await readdir(ACTIVITY_DIR);
  let translatedCount = 0;
  let consideredCount = 0;

  for (const file of files.filter((item) => item.endsWith(".json")).sort()) {
    const fileUrl = new URL(file, ACTIVITY_DIR);
    const data = JSON.parse(await readFile(fileUrl, "utf8"));
    if (!SPEECH_LABELS.has(data.label)) continue;

    const targets = data.records
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => record.originalTurkish && !record.englishTranslation);
    const remainingLimit = TRANSLATE_LIMIT > 0 ? TRANSLATE_LIMIT - consideredCount : Infinity;
    const limitedTargets = targets.slice(0, Math.max(0, remainingLimit));
    if (limitedTargets.length === 0) continue;

    const segments = makeSegments(limitedTargets);
    const batches = packSegments(segments);
    const translatedPartsByRecord = new Map();
    const errorsByRecord = new Map();

    await mapWithConcurrency(batches, TRANSLATE_CONCURRENCY, async (batch) => {
      try {
        const translatedParts = await translateBatch(batch);
        translatedParts.forEach((text, partIndex) => {
          const segment = batch[partIndex];
          if (!translatedPartsByRecord.has(segment.recordIndex)) translatedPartsByRecord.set(segment.recordIndex, []);
          translatedPartsByRecord.get(segment.recordIndex)[segment.partIndex] = text;
        });
      } catch (error) {
        batch.forEach((segment) => errorsByRecord.set(segment.recordIndex, error.message));
      }
    });

    limitedTargets.forEach(({ record, index }) => {
      const hash = crypto.createHash("sha1").update(record.originalTurkish).digest("hex");
      const translatedParts = translatedPartsByRecord.get(index);
      if (translatedParts?.length) {
        data.records[index] = {
          ...record,
          englishTranslation: translatedParts.filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n").trim(),
          translationStatus: "translated-google-public",
          translationHash: hash
        };
      } else {
        data.records[index] = {
          ...record,
          translationStatus: "translation-error",
          translationError: errorsByRecord.get(index) || "No translated parts returned",
          translationHash: hash
        };
      }
      translatedCount += 1;
      consideredCount += 1;
      if (translatedCount % 250 === 0) console.log(`Translated ${translatedCount} speeches`);
    });

    await writeFile(fileUrl, JSON.stringify(data, null, 2));
    if (TRANSLATE_LIMIT > 0 && consideredCount >= TRANSLATE_LIMIT) break;
  }

  console.log(`Translated or attempted ${translatedCount} speeches`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
