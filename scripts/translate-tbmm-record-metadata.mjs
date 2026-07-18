import { readdir, readFile, writeFile } from "node:fs/promises";
import crypto from "node:crypto";

const ACTIVITY_DIR = new URL("../public/source/tbmm-activity/", import.meta.url);
const SPEECH_LABELS = new Set(["General Assembly speeches", "Committee speeches"]);
const TRANSLATABLE_FIELD_LABELS = new Set([
  "Kanun Teklifi Başlığı ve Özeti",
  "Önergenin Başlığı ve Özeti",
  "Önergenin Özeti"
]);
const MANUAL_TRANSLATIONS = new Map([
  ["Diğer Bilgiler", "Other Information"]
]);
const TRANSLATE_LIMIT = Number(process.env.TRANSLATE_LIMIT || "0");
const TRANSLATE_CONCURRENCY = Number(process.env.TRANSLATE_CONCURRENCY || "8");
const BATCH_SIZE = Number(process.env.TRANSLATE_BATCH_SIZE || "4200");
const REQUEST_DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS || "80");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function hashText(text) {
  return crypto.createHash("sha1").update(text).digest("hex");
}

function shouldTranslateTitle(title) {
  const clean = `${title ?? ""}`.trim();
  return clean && !/^[\d/.-]+$/.test(clean);
}

async function translateText(text, attempt = 1) {
  await sleep(REQUEST_DELAY_MS);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (attempt < 5) {
      await sleep(750 * attempt);
      return translateText(text, attempt + 1);
    }
    throw new Error(`Translate HTTP ${response.status}`);
  }

  const data = await response.json();
  return (data?.[0] ?? []).map((part) => part?.[0] ?? "").join("").trim();
}

function packTexts(texts) {
  const batches = [];
  let current = [];
  let currentLength = 0;

  texts.forEach((text) => {
    const marker = `<<<TORPHI_${current.length}>>>`;
    const entryLength = marker.length + text.length + 2;
    if (current.length > 0 && currentLength + entryLength > BATCH_SIZE) {
      batches.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(text);
    currentLength += entryLength;
  });

  if (current.length > 0) batches.push(current);
  return batches;
}

function makeBatchText(batch) {
  return batch.map((text, index) => `<<<TORPHI_${index}>>>\n${text}`).join("\n\n");
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
  const translatedBatch = await translateText(makeBatchText(batch));
  const split = splitBatchTranslation(translatedBatch, batch.length);
  if (split) return split;

  const fallback = [];
  for (const text of batch) fallback.push(await translateText(text));
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

function collectRecordTexts(record, texts) {
  if (shouldTranslateTitle(record.title) && !record.englishTitle) texts.add(record.title.trim());

  Object.entries(record.fields ?? {}).forEach(([label, value]) => {
    const clean = `${value ?? ""}`.trim();
    if (TRANSLATABLE_FIELD_LABELS.has(label) && clean && !record.englishFields?.[label]) texts.add(clean);
  });
}

function applyRecordTranslations(record, translations) {
  let changed = false;

  if (shouldTranslateTitle(record.title)) {
    const originalTitle = record.title.trim();
    const englishTitle = MANUAL_TRANSLATIONS.get(originalTitle) || translations.get(originalTitle);
    if (englishTitle && record.englishTitle !== englishTitle) {
      record.englishTitle = englishTitle;
      record.titleTranslationStatus = "translated-google-public";
      record.titleTranslationHash = hashText(originalTitle);
      changed = true;
    }
  }

  const englishFields = { ...(record.englishFields ?? {}) };
  Object.entries(record.fields ?? {}).forEach(([label, value]) => {
    const clean = `${value ?? ""}`.trim();
    const translated = TRANSLATABLE_FIELD_LABELS.has(label) ? MANUAL_TRANSLATIONS.get(clean) || translations.get(clean) : "";
    if (translated && englishFields[label] !== translated) {
      englishFields[label] = translated;
      changed = true;
    }
  });
  if (Object.keys(englishFields).length > 0) record.englishFields = englishFields;

  return changed;
}

async function main() {
  const files = (await readdir(ACTIVITY_DIR)).filter((item) => item.endsWith(".json")).sort();
  const loadedFiles = [];
  const texts = new Set();

  for (const file of files) {
    const fileUrl = new URL(file, ACTIVITY_DIR);
    const data = JSON.parse(await readFile(fileUrl, "utf8"));
    if (SPEECH_LABELS.has(data.label)) continue;

    for (const record of data.records ?? []) collectRecordTexts(record, texts);
    loadedFiles.push({ fileUrl, data });
  }

  const textsToTranslate = [...texts].slice(0, TRANSLATE_LIMIT > 0 ? TRANSLATE_LIMIT : undefined);
  const translations = new Map(MANUAL_TRANSLATIONS);
  const errors = [];

  await mapWithConcurrency(packTexts(textsToTranslate.filter((text) => !MANUAL_TRANSLATIONS.has(text))), TRANSLATE_CONCURRENCY, async (batch) => {
    try {
      const translated = await translateBatch(batch);
      translated.forEach((text, index) => translations.set(batch[index], text));
    } catch (error) {
      batch.forEach((text) => errors.push({ text, error: error.message }));
    }
  });

  let changedFiles = 0;
  let changedRecords = 0;

  for (const { fileUrl, data } of loadedFiles) {
    let fileChanged = false;
    for (const record of data.records ?? []) {
      if (applyRecordTranslations(record, translations)) {
        fileChanged = true;
        changedRecords += 1;
      }
    }

    if (fileChanged) {
      await writeFile(fileUrl, JSON.stringify(data, null, 2));
      changedFiles += 1;
    }
  }

  console.log(JSON.stringify({
    uniqueTexts: texts.size,
    translatedTexts: translations.size,
    changedFiles,
    changedRecords,
    errors: errors.length
  }, null, 2));

  if (errors.length > 0) {
    console.error(errors.slice(0, 10));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
