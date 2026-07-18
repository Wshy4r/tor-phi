import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const collectionUrl = "https://www.state.gov/remarks-and-releases-deputy-secretary-of-state";
const pageCount = Number(process.env.LANDAU_REMARKS_PAGES || 16);
const outJson = new URL("../public/source/foreign-ministry/landau-remarks-releases.json", import.meta.url);
const outModule = new URL("../src/landauRemarksReleases.js", import.meta.url);
const monthNumbers = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12"
};

function readerUrl(url) {
  return `https://r.jina.ai/http://r.jina.ai/http://${url}`;
}

function collectionPageUrl(page) {
  return page === 1 ? collectionUrl : `${collectionUrl}/page/${page}`;
}

function archiveCollectionPageUrl(page) {
  return `https://www.state.gov/bureaus-archive/deputy-secretary-of-state__trashed/page/${page}`;
}

function normalizeSpaces(value) {
  return `${value ?? ""}`.replace(/\s+/g, " ").trim();
}

function toIsoDate(value) {
  const match = `${value ?? ""}`.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\b/);
  if (!match) return `${value ?? ""}`.trim();
  const [, month, day, year] = match;
  return `${year}-${monthNumbers[month]}-${day.padStart(2, "0")}`;
}

function extractDateLabel(value) {
  return `${value ?? ""}`.match(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/)?.[0] || "";
}

async function fetchReaderMarkdown(url) {
  const response = await fetch(readerUrl(url), {
    headers: { "user-agent": "TOR-Phi-landau-remarks-importer/1.0" }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function fetchCollectionMarkdown(page) {
  const primary = collectionPageUrl(page);
  try {
    return await fetchReaderMarkdown(primary);
  } catch (error) {
    const fallback = archiveCollectionPageUrl(page);
    process.stdout.write(`Primary collection page failed (${error.message}); trying archive ${fallback}\n`);
    return fetchReaderMarkdown(fallback);
  }
}

function parseCollectionEntries(markdown) {
  const lines = markdown.split(/\r?\n/);
  const entries = [];

  for (let index = 0; index < lines.length; index += 1) {
    const typeMatch = lines[index].match(/^\*\s+(.+)$/);
    if (!typeMatch) continue;

    let cursor = index + 1;
    while (cursor < lines.length && !lines[cursor].trim()) cursor += 1;
    const linkMatch = lines[cursor]?.match(/^\[([^\]]+)\]\((https:\/\/www\.state\.gov\/[^)]+)\)(.*)$/);
    if (!linkMatch) continue;

    const [, title, url, metadata] = linkMatch;
    const searchable = `${title} ${metadata}`;
    if (!/Landau|Christopher Landau/i.test(searchable)) continue;

    const dateLabel = extractDateLabel(metadata);
    entries.push({
      date: toIsoDate(dateLabel),
      dateLabel,
      type: normalizeSpaces(typeMatch[1]),
      title: normalizeSpaces(title),
      url,
      metadata: normalizeSpaces(metadata)
    });
  }

  return entries;
}

function getMarkdownContent(markdown) {
  return markdown.includes("Markdown Content:")
    ? markdown.split("Markdown Content:").slice(1).join("Markdown Content:").trim()
    : markdown;
}

function getStateArticleBody(markdown) {
  let content = getMarkdownContent(markdown);
  const headingIndex = content.lastIndexOf("\nhide\n\n# ");
  if (headingIndex >= 0) content = content.slice(headingIndex);
  const tagsIndex = content.search(/\nTags\n/i);
  if (tagsIndex > 0) content = content.slice(0, tagsIndex);
  const backToTopIndex = content.search(/\nBack to Top\n/i);
  if (backToTopIndex > 0) content = content.slice(0, backToTopIndex);
  return content;
}

function cleanDetailLine(line) {
  return normalizeSpaces(
    line
      .replace(/^\*\s+/, "")
      .replace(/^#+\s*/, "")
      .replace(/\*\*/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  );
}

function detailParagraphs(markdown) {
  const content = getStateArticleBody(markdown);
  return content
    .split(/\n{2,}/)
    .map(cleanDetailLine)
    .filter(Boolean)
    .filter((line) => !/^(Cookie Settings|Skip to content|Back to Top|Privacy Policy|Accessibility Statement|Copyright Information|FOIA|No FEAR Act)$/i.test(line))
    .filter((line) => !/^(An official website of the United States Government|Here's how you know|Official websites use \.gov|Secure \.gov websites use HTTPS)$/i.test(line))
    .filter((line) => !/^(Functional|Preferences|Statistics|Marketing|Accept Deny View preferences Save preferences)$/i.test(line))
    .filter((line) => !/^hide$/i.test(line))
    .filter((line) => !/^We use cookies to make our website work better/i.test(line))
    .filter((line) => !/^URL Source:/i.test(line))
    .filter((line) => !/^Title:/i.test(line));
}

function summarizeDetail(entry, markdown) {
  const skip = new Set([
    entry.type.toLowerCase(),
    entry.dateLabel.toLowerCase(),
    "office of the spokesperson"
  ]);
  const paragraphs = detailParagraphs(markdown);
  const firstBody = paragraphs.find((paragraph) => {
    const key = paragraph.toLowerCase();
    if (skip.has(key)) return false;
    if (key === entry.title.toLowerCase()) return false;
    if (/^[a-z .,'-]+,\s+[a-z .,'-]+$/i.test(paragraph) && paragraph.length < 80) return false;
    if (/^\w+ \d{1,2}, \d{4}$/.test(paragraph)) return false;
    return paragraph.length > 40;
  });

  if (!firstBody) return `State Department ${entry.type.toLowerCase()} in the Deputy Secretary remarks and releases archive.`;
  return firstBody.length > 420 ? `${firstBody.slice(0, 417).trim()}...` : firstBody;
}

function makeFrame(entry, summary) {
  const text = `${entry.title} ${summary}`.toLowerCase();
  if (/iraq|iran|syria|turkiye|turkey|kurd|erbil|peshmerga|middle east|gulf|hormuz/.test(text)) {
    return "Regional policy signal";
  }
  if (/travel|meeting|readout/.test(`${entry.type} ${entry.title}`.toLowerCase())) {
    return "Diplomatic activity";
  }
  if (/remarks|briefing/.test(entry.type.toLowerCase())) return "Policy remarks";
  return "Deputy Secretary release archive";
}

async function main() {
  const byUrl = new Map();

  for (let page = 1; page <= pageCount; page += 1) {
    const url = collectionPageUrl(page);
    process.stdout.write(`Fetching collection page ${page}/${pageCount}: ${url}\n`);
    const markdown = await fetchCollectionMarkdown(page);
    for (const entry of parseCollectionEntries(markdown)) {
      if (!byUrl.has(entry.url)) byUrl.set(entry.url, entry);
    }
  }

  const entries = [];
  for (const [index, entry] of [...byUrl.values()].entries()) {
    process.stdout.write(`Fetching release ${index + 1}/${byUrl.size}: ${entry.title}\n`);
    let summary = `State Department ${entry.type.toLowerCase()} in the Deputy Secretary remarks and releases archive.`;
    try {
      const detailMarkdown = await fetchReaderMarkdown(entry.url);
      summary = summarizeDetail(entry, detailMarkdown);
    } catch {
      summary = `${summary}`;
    }

    entries.push({
      date: entry.date,
      type: entry.type,
      title: entry.title,
      source: "State.gov remarks and releases",
      summary,
      url: entry.url,
      frame: makeFrame(entry, summary)
    });
  }

  entries.sort((a, b) => `${b.date}`.localeCompare(`${a.date}`) || a.title.localeCompare(b.title));

  const payload = {
    generatedAt: new Date().toISOString(),
    source: collectionUrl,
    pageCount,
    records: entries
  };

  await mkdir(dirname(fileURLToPath(outJson)), { recursive: true });
  await writeFile(outJson, JSON.stringify(payload, null, 2) + "\n");
  await writeFile(
    outModule,
    `// Generated by scripts/import-landau-state-remarks.mjs. State Department Deputy Secretary remarks/releases for Christopher Landau.\nexport const landauRemarksAndReleases = ${JSON.stringify(entries, null, 2)};\n`
  );

  console.log(`Imported ${entries.length} Landau remarks/releases.`);
  console.log(`Wrote ${fileURLToPath(outJson)}`);
  console.log(`Wrote ${fileURLToPath(outModule)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
