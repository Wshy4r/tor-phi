import { readdir, readFile, writeFile } from "node:fs/promises";

const ACTIVITY_DIR = new URL("../public/source/tbmm-activity/", import.meta.url);
const SPEECH_LABELS = new Set(["General Assembly speeches", "Committee speeches"]);
const MAX_DETAILS = Number(process.env.MAX_SPEECH_DETAILS || "0");
const SPEECH_CONCURRENCY = Number(process.env.SPEECH_CONCURRENCY || "16");

function decodeHtml(value = "") {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value = "") {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchText(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "TOR Phi TBMM speech importer",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    if (attempt < 3) return fetchText(url, attempt + 1);
    throw new Error(`Failed ${response.status} ${url}`);
  }

  return response.text();
}

function parseSpeechDetail(html) {
  const tableBlock = html.match(/<table class="table table-striped"[^>]*>([\s\S]*?)<\/table>/i)?.[1] ?? "";
  const metadata = {};
  for (const row of tableBlock.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => stripTags(match[1]));
    const key = cells[0]?.replace(/:$/, "");
    const value = cells.length >= 3 && cells[1] === ":" ? cells[2] : cells[1];
    if (key && value) metadata[key] = value;
  }

  const contentBlock =
    html.match(/<div class="row content-p">([\s\S]*?)<\/div>/i)?.[1] ??
    html.match(/<div class="col-12"[^>]*text-align:justify[^>]*>([\s\S]*?)<\/div>/i)?.[1] ??
    "";
  const paragraphs = [...contentBlock.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
  const originalTurkish = paragraphs.length ? paragraphs.join("\n\n") : stripTags(contentBlock);

  return {
    metadata,
    originalTurkish,
    englishTranslation: "",
    translationStatus: "pending-translation-backend"
  };
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
  const speechFiles = files.filter((file) => file.endsWith(".json"));
  let imported = 0;
  let seen = 0;

  for (const file of speechFiles) {
    const fileUrl = new URL(file, ACTIVITY_DIR);
    const data = JSON.parse(await readFile(fileUrl, "utf8"));
    if (!SPEECH_LABELS.has(data.label)) continue;

    const recordsToFetch = data.records
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => record.url && !record.originalTurkish && record.importStatus !== "unavailable");

    const limited = MAX_DETAILS > 0 ? recordsToFetch.slice(0, Math.max(0, MAX_DETAILS - seen)) : recordsToFetch;
    if (limited.length === 0) continue;

    await mapWithConcurrency(limited, SPEECH_CONCURRENCY, async ({ record, index }) => {
      try {
        const html = await fetchText(record.url);
        const detail = parseSpeechDetail(html);
        data.records[index] = {
          ...record,
          ...detail,
          importStatus: detail.originalTurkish ? "imported" : "empty"
        };
      } catch (error) {
        data.records[index] = {
          ...record,
          originalTurkish: "",
          englishTranslation: "",
          translationStatus: "not-translated",
          importStatus: "unavailable",
          importError: error.message
        };
      }
      imported += 1;
      seen += 1;
      if (imported % 100 === 0) console.log(`Imported ${imported} speech details`);
    });

    await writeFile(fileUrl, JSON.stringify(data, null, 2));
    if (MAX_DETAILS > 0 && seen >= MAX_DETAILS) break;
  }

  console.log(`Imported ${imported} speech details`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
