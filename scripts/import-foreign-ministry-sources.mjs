import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { foreignMinistryData } from "../src/foreignMinistries.js";

const root = new URL("../", import.meta.url);
const outJson = new URL("../public/source/foreign-ministry/source-snapshots.json", import.meta.url);
const outModule = new URL("../src/foreignMinistrySourceSnapshots.js", import.meta.url);
const maxCharacters = Number(process.env.FOREIGN_MINISTRY_SOURCE_MAX_CHARS || 40000);
const manualSourceOverrides = {
  "https://www.state.gov/biographies/christopher-landau/": {
    title: "Christopher Landau",
    description: "Official State Department biography for Christopher Landau, Deputy Secretary of State.",
    text: [
      "Christopher Landau was sworn in as the 23rd Deputy Secretary of State on March 25, 2025. Deputy Secretary Landau served as United States Ambassador to Mexico from 2019 to 2021 during President Trump's first administration. Before and after his tenure in Mexico, he was engaged in the private practice of law in Washington, D.C. for more than three decades.",
      "As Ambassador to Mexico, Deputy Secretary Landau presided over the United States' largest diplomatic mission and fostered unprecedented bilateral cooperation that yielded results including the ratification and entry into force of the U.S.-Mexico-Canada Free Trade Agreement, protection of border commerce and regional supply chains during the pandemic, and the lowest levels of illegal migration in years.",
      "Deputy Secretary Landau's legal practice focused on appellate litigation. He has briefed and argued cases involving a wide variety of topics in the U.S. Supreme Court and all of the federal courts of appeals.",
      "Deputy Secretary Landau was born in Madrid, Spain, where his father George Landau (later United States Ambassador to Paraguay, Chile, and Venezuela) was stationed with the U.S. Foreign Service. Deputy Secretary Landau brings his perspective as both a recent United States Ambassador and upbringing in the foreign service, as well as his extensive legal background, to his current position.",
      "A graduate of Harvard College and Harvard Law School, Deputy Secretary Landau clerked twice at the Supreme Court, first for Justice Antonin Scalia and then for Justice Clarence Thomas. He is fluent in Spanish and proficient in French. He is married to Caroline Bruce Landau, and they have two adult children, Nathaniel and Julia."
    ].join("\n\n"),
    sourceMethod: "Curated official biography text because State.gov returned a forbidden technical page to the automated importer."
  }
};

function readerUrl(url) {
  return `https://r.jina.ai/http://r.jina.ai/http://${url}`;
}

function decodeEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    ndash: "-",
    mdash: "-",
    quot: '"',
    rsquo: "'",
    lsquo: "'",
    rdquo: '"',
    ldquo: '"',
    hellip: "..."
  };

  return `${value ?? ""}`
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, name) => named[name.toLowerCase()] ?? `&${name};`);
}

function stripTags(value) {
  return decodeEntities(`${value ?? ""}`.replace(/<[^>]+>/g, " "));
}

function getFirstMatch(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return stripTags(match[1]).trim();
  }

  return "";
}

function selectReadableHtml(html) {
  const blocks = [
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<div\b[^>]+class=["'][^"']*(?:entry-content|post-content|field--name-body|region-content|content|body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i
  ];

  for (const pattern of blocks) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return html;
}

function cleanLine(line) {
  return line
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function shouldSkipLine(line) {
  if (!line) return true;
  if (line.length <= 1) return true;
  if (/^(skip to|main content|search|menu|close|home|share|print|email|subscribe|follow us|back to top)$/i.test(line)) return true;
  if (/^(facebook|twitter|x|linkedin|instagram|youtube)$/i.test(line)) return true;
  if (/^(official websites use|secure \.gov websites use|the site is secure|here's how you know)$/i.test(line)) return true;
  if (/^(ministry|news|press releases|speeches|biographies|contact us|privacy|accessibility)$/i.test(line)) return true;
  return false;
}

function htmlToReadableText(html) {
  const readable = selectReadableHtml(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<form\b[\s\S]*?<\/form>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header\b[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|li|h1|h2|h3|h4|h5|h6|blockquote|tr)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ");

  const text = stripTags(readable);
  const seen = new Set();
  const lines = text
    .split(/\n+/)
    .map(cleanLine)
    .filter((line) => {
      if (shouldSkipLine(line)) return false;
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return lines.join("\n\n").slice(0, maxCharacters).trim();
}

function getMarkdownContent(markdown) {
  return markdown.includes("Markdown Content:")
    ? markdown.split("Markdown Content:").slice(1).join("Markdown Content:").trim()
    : markdown;
}

function cleanMarkdownLine(line) {
  return decodeEntities(
    `${line ?? ""}`
      .replace(/!\[[^\]]*]\([^)]+\)/g, "")
      .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
      .replace(/\*\*/g, "")
      .replace(/^\*\s+/, "")
      .replace(/^#+\s*/, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function markdownToReadableText(markdown) {
  let content = getMarkdownContent(markdown);
  const headingIndex = content.lastIndexOf("\nhide\n\n# ");
  if (headingIndex >= 0) content = content.slice(headingIndex);
  const tagsIndex = content.search(/\nTags\n/i);
  if (tagsIndex > 0) content = content.slice(0, tagsIndex);
  const backToTopIndex = content.search(/\nBack to Top\n/i);
  if (backToTopIndex > 0) content = content.slice(0, backToTopIndex);

  const seen = new Set();
  return content
    .split(/\n+/)
    .map(cleanMarkdownLine)
    .filter((line) => {
      if (shouldSkipLine(line)) return false;
      if (/^(Cookie Settings|Functional|Preferences|Statistics|Marketing|Accept Deny View preferences Save preferences)$/i.test(line)) return false;
      if (/^hide$/i.test(line)) return false;
      if (/^We use cookies to make our website work better/i.test(line)) return false;
      if (/^(An official website of the United States Government|Here's how you know|Official websites use \.gov|Secure \.gov websites use HTTPS)$/i.test(line)) return false;
      if (/^Title:/i.test(line) || /^URL Source:/i.test(line) || /^Markdown Content:/i.test(line)) return false;
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n\n")
    .slice(0, maxCharacters)
    .trim();
}

function extractSnapshot(html, url) {
  const isReaderMarkdown = /^Title:\s+/m.test(html) && html.includes("Markdown Content:");
  const title = isReaderMarkdown
    ? html.match(/^Title:\s*(.+)$/m)?.[1]?.replace(/ - United States Department of State$/, "").trim() || ""
    : getFirstMatch(html, [
    /<meta\b[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<h1\b[^>]*>([\s\S]*?)<\/h1>/i,
    /<title\b[^>]*>([\s\S]*?)<\/title>/i
  ]);
  const description = getFirstMatch(html, [
    /<meta\b[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta\b[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i
  ]);
  const text = isReaderMarkdown ? markdownToReadableText(html) : htmlToReadableText(html);

  return {
    url,
    title,
    description,
    text,
    characterCount: text.length,
    importedAt: new Date().toISOString()
  };
}

async function fetchRawSource(url, useReader = false) {
  const response = await fetch(useReader ? readerUrl(url) : url, {
    headers: {
      "accept": "text/html,application/xhtml+xml,text/markdown,text/plain",
      "user-agent": "TOR-Phi-source-importer/1.0 (+local research archive)"
    }
  });
  const text = await response.text();
  return { response, text };
}

function isBlockedOrTechnicalSnapshot(snapshot) {
  return /technical difficulties|exception:\s*forbidden|access denied|request blocked|currently experiencing technical difficulties|ratelimittriggerederror|rate limit exceeded/i.test([
    snapshot.title,
    snapshot.description,
    snapshot.text
  ].join("\n"));
}

function collectSourceTargets() {
  const targets = new Map();
  for (const [countryId, ministry] of Object.entries(foreignMinistryData)) {
    for (const person of ministry.people ?? []) {
      for (const [index, record] of (person.records ?? []).entries()) {
        if (!record.url || !/^https?:\/\//i.test(record.url)) continue;
        const existing = targets.get(record.url) ?? {
          url: record.url,
          records: []
        };
        existing.records.push({
          countryId,
          ministry: ministry.shortName || ministry.ministryName,
          personId: person.id,
          personName: person.name,
          recordIndex: index,
          recordTitle: record.title,
          recordType: record.type,
          recordDate: record.date
        });
        targets.set(record.url, existing);
      }
    }
  }

  return [...targets.values()];
}

async function fetchSnapshot(target) {
  try {
    let { response, text: html } = await fetchRawSource(target.url);
    let snapshot = extractSnapshot(html, target.url);
    const override = manualSourceOverrides[target.url];
    if (override && (!snapshot.text || isBlockedOrTechnicalSnapshot(snapshot))) {
      snapshot = {
        ...snapshot,
        ...override,
        text: override.text.slice(0, maxCharacters),
        characterCount: override.text.slice(0, maxCharacters).length,
        importedAt: new Date().toISOString(),
        manualOverride: true
      };
    } else if (isBlockedOrTechnicalSnapshot(snapshot)) {
      try {
        const readerResult = await fetchRawSource(target.url, true);
        const readerSnapshot = extractSnapshot(readerResult.text, target.url);
        if (readerSnapshot.text && !isBlockedOrTechnicalSnapshot(readerSnapshot)) {
          response = readerResult.response;
          snapshot = {
            ...readerSnapshot,
            readerFallback: true
          };
        } else {
          snapshot = {
            ...snapshot,
            text: "",
            characterCount: 0,
            blocked: true
          };
        }
      } catch (error) {
        snapshot = {
          ...snapshot,
          text: "",
          characterCount: 0,
          blocked: true,
          readerError: error.message
        };
      }
    }
    return {
      ...snapshot,
      ok: response.ok,
      status: response.status,
      sourceRecords: target.records
    };
  } catch (error) {
    return {
      url: target.url,
      ok: false,
      status: 0,
      title: "",
      description: "",
      text: "",
      characterCount: 0,
      importedAt: new Date().toISOString(),
      error: error.message,
      sourceRecords: target.records
    };
  }
}

async function main() {
  const targets = collectSourceTargets();
  const snapshots = {};

  for (const [index, target] of targets.entries()) {
    process.stdout.write(`[${index + 1}/${targets.length}] ${target.url}\n`);
    snapshots[target.url] = await fetchSnapshot(target);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "scripts/import-foreign-ministry-sources.mjs",
    totalUrls: targets.length,
    snapshots
  };

  await mkdir(dirname(fileURLToPath(outJson)), { recursive: true });
  await writeFile(outJson, JSON.stringify(payload, null, 2) + "\n");
  await writeFile(
    outModule,
    `// Generated by scripts/import-foreign-ministry-sources.mjs. Local source snapshots for TOR Phi foreign-ministry records.\nexport const foreignMinistrySourceSnapshots = ${JSON.stringify(payload, null, 2)};\n`
  );

  const imported = Object.values(snapshots).filter((snapshot) => snapshot.text).length;
  console.log(`Imported ${imported}/${targets.length} foreign-ministry source snapshots.`);
  console.log(`Wrote ${fileURLToPath(new URL("./public/source/foreign-ministry/source-snapshots.json", root))}`);
  console.log(`Wrote ${fileURLToPath(outModule)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
