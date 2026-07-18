import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { usCongressMembers } from "../src/usCongress.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const sources = [
  {
    chamber: "House",
    label: "Library of Congress 119th Congress House book guide",
    url: "https://guides.loc.gov/119th-congress-book-list/house-of-representatives"
  },
  {
    chamber: "Senate",
    label: "Library of Congress 119th Congress Senate book guide",
    url: "https://guides.loc.gov/119th-congress-book-list/senate",
    crossCheckUrl: "https://www.senate.gov/senators/BooksWrittenbySittingSenators.htm"
  }
];

const sourceRequestHeaders = {
  "user-agent": "TOR Phi congressional book importer; research bibliography import"
};

function decodeHtml(value = "") {
  return `${value}`
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&colon;/g, ":");
}

function cleanText(value = "") {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value = "") {
  return `${value}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function normalizeName(value = "") {
  return `${value}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(Congresswoman|Congressman|Representative|Senator|Rep|Sen)\.?\b/gi, " ")
    .replace(/\b(Jr|Sr|III|II|IV)\.?\b/gi, " ")
    .replace(/\b[A-Z]\.?\b/g, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\bshultz\b/gi, "schultz")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function lastName(value = "") {
  return normalizeName(value).split(" ").at(-1) || "";
}

function extract(pattern, block) {
  const match = block.match(pattern);
  return match ? cleanText(match[1]) : "";
}

function extractAttr(pattern, block) {
  const match = block.match(pattern);
  return match ? decodeHtml(match[1]).trim() : "";
}

function normalizeUrl(url = "") {
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

function parseMemberHeading(heading) {
  const match = cleanText(heading).match(/^(.*?)\s*\(([A-Z]{2})\)$/);
  if (!match) return null;
  return {
    name: match[1].trim(),
    state: match[2].trim()
  };
}

function findCurrentMember({ name, state }, chamber) {
  const candidates = usCongressMembers.filter((member) => member.chamber === chamber && member.state === state);
  const normalizedHeading = normalizeName(name);
  const exact = candidates.find((member) => normalizeName(member.name) === normalizedHeading);
  if (exact) return exact;

  const noInitialExact = candidates.find((member) => normalizeName(member.name).replace(/\s+/g, " ") === normalizedHeading);
  if (noInitialExact) return noInitialExact;

  const headingLast = lastName(name);
  const lastMatches = candidates.filter((member) => lastName(member.name) === headingLast || lastName(member.ids?.wikipedia) === headingLast);
  if (lastMatches.length === 1) return lastMatches[0];

  const containsMatches = candidates.filter((member) => {
    const memberName = normalizeName(member.name);
    return memberName.includes(normalizedHeading) || normalizedHeading.includes(memberName);
  });
  if (containsMatches.length === 1) return containsMatches[0];

  return null;
}

function parseBookItems(sectionBody, source) {
  return [...sectionBody.matchAll(/<li[\s\S]*?<\/li>/gi)]
    .map(([item]) => {
      if (!/s-lg-book-title/i.test(item)) return null;

      const title = extract(/<span[^>]+class="s-lg-book-title"[^>]*>([\s\S]*?)<\/span>/i, item);
      if (!title) return null;

      const href = normalizeUrl(extractAttr(/<a\s+href="([^"]+)"/i, item));
      const posterUrl = normalizeUrl(extractAttr(/<img[^>]+src="([^"]+)"/i, item));
      const authorLine = extract(/<span[^>]+class="s-lg-book-author"[^>]*>([\s\S]*?)<\/span>/i, item);
      const callNumber = extract(/<div[^>]+class="s-lg-book-prop-callno"[^>]*>([\s\S]*?)<\/div>/i, item).replace(/^Call Number:\s*/i, "");
      const isbn = extract(/<div[^>]+class="s-lg-book-prop-isbn"[^>]*>([\s\S]*?)<\/div>/i, item).replace(/^ISBN:\s*/i, "");
      const published = extract(/<div[^>]+class="s-lg-book-prop-pubdate"[^>]*>([\s\S]*?)<\/div>/i, item).replace(/^Published\/Created:\s*/i, "");

      return {
        title,
        authorLine,
        callNumber,
        isbn,
        published,
        sourceUrl: href || source.url,
        posterUrl
      };
    })
    .filter(Boolean);
}

function parseLocGuide(html, source) {
  const sections = [...html.matchAll(/<h2[^>]+class="s-lib-box-title"[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]+class="s-lib-box-title"|$)/gi)];
  const records = [];
  const unmatched = [];

  for (const [, headingHtml, body] of sections) {
    const heading = parseMemberHeading(headingHtml);
    if (!heading) continue;

    const member = findCurrentMember(heading, source.chamber);
    const books = parseBookItems(body, source);
    if (!member) {
      unmatched.push({ source: source.label, chamber: source.chamber, heading, bookCount: books.length });
      continue;
    }

    for (const book of books) {
      records.push(makeBookRecord(member, heading, book, source));
    }
  }

  return { records, unmatched };
}

function classifyBook(title = "") {
  const text = title.toLowerCase();

  if (/iraq|war|army|soldier|arlington|armed|terror|jihad|superpower|american power|foreign policy|nuclear|china|defense|defence|military|peril/.test(text)) {
    return {
      className: "security / foreign-policy text",
      middleEastRelevance:
        "Treat this as high-priority for foreign-policy review once a PDF or OCR text is attached. The title itself signals security, war, military service, great-power competition, or international strategy, which can shape how the member thinks about Iraq, Syria, Iran, Turkiye, force posture, partner forces, and the Kurdistan file."
    };
  }

  if (/constitution|court|justice|supreme|law|legal|impeach|democracy|filibuster|senate|declaration|founders|government|rights/.test(text)) {
    return {
      className: "constitutional / institutional argument",
      middleEastRelevance:
        "The direct Kurdistan relevance is usually indirect, but this kind of book matters for how the member thinks about executive power, congressional authority, oversight, sanctions, war powers, human-rights language, and the rules used to justify foreign-policy action."
    };
  }

  if (/capitalism|socialism|antitrust|big tech|monopoly|economy|worker|working|migrant|families|immigrant|equity|opportunity|common good/.test(text)) {
    return {
      className: "domestic political-economy text",
      middleEastRelevance:
        "The Kurdistan link is indirect. Use it to understand the member's economic worldview before reading their positions on energy, migration, sanctions, reconstruction, trade, aid, and U.S. commercial engagement in Iraq and the Kurdistan Region."
    };
  }

  if (/memoir|story|gift|life|journey|home|heart|courage|resilience|travels|believed|called us|unfettered|stand|united/.test(text)) {
    return {
      className: "memoir / political self-presentation",
      middleEastRelevance:
        "The direct Kurdistan relevance depends on the text. As a profile source, it matters because memoirs often reveal formative networks, military experience, religious language, identity politics, and the public story the member wants voters and elites to remember."
    };
  }

  if (/women|vote|children|girl|mother|family|faith|prayer|virtue/.test(text)) {
    return {
      className: "values / social-policy text",
      middleEastRelevance:
        "The direct Kurdistan relevance is likely low unless the text discusses minorities, religious freedom, humanitarian protection, displacement, or U.S. engagement abroad. It still helps profile the member's moral vocabulary and coalition politics."
    };
  }

  return {
    className: "authored congressional book",
    middleEastRelevance:
      "The direct Kurdistan relevance is unverified until the text is OCR-read. Keep it as authorship and worldview evidence, then search the text for Kurdistan, Kurds, Iraq, Syria, Iran, Turkiye, PKK, YPG, Peshmerga, Erbil, Mosul, Kirkuk, oil, and sanctions."
  };
}

function withArticle(phrase) {
  return /^[aeiou]/i.test(phrase) ? `an ${phrase}` : `a ${phrase}`;
}

function makeBookRecord(member, heading, book, source) {
  const titleSlug = slugify(book.title);
  const year = book.published.match(/\b(19|20)\d{2}\b/)?.[0] || "";
  const classification = classifyBook(book.title);
  const memberLabel = `${member.name}, current U.S. ${member.chamber === "Senate" ? "senator" : "representative"} from ${member.state}`;
  const sourceLinks = [
    [source.label, source.url]
  ];

  if (source.crossCheckUrl) {
    sourceLinks.push(["U.S. Senate official sitting-senator bibliography", source.crossCheckUrl]);
  }

  if (book.sourceUrl && book.sourceUrl !== source.url) {
    sourceLinks.push(["Library of Congress catalog record", book.sourceUrl]);
  }

  return {
    id: `congress-book-${member.id.toLowerCase()}-${titleSlug}`,
    countryId: "usa",
    personId: member.id.toLowerCase(),
    personName: member.name,
    title: book.title,
    documentType: "Congressional book / authored text",
    publisher: "Library of Congress 119th Congress bibliography",
    date: year || book.published || "Current bibliography",
    publicationDate: book.published,
    localPdfPath: `/source/books/us-congress/${member.id}/${titleSlug}.pdf`,
    localPdfAvailable: false,
    posterUrl: book.posterUrl || undefined,
    posterCredit: book.posterUrl ? "Library of Congress guide catalog cover image" : undefined,
    sourceUrl: book.sourceUrl || source.url,
    sourceLinks,
    ocrStatus:
      "PDF slot ready; bibliographic record imported from official congressional/library sources. Add a local PDF to generate OCR-backed summaries.",
    sourceBasis:
      `Case-by-case official bibliography import from ${source.label}. This record is not a generic search result.`,
    description:
      `${book.title} is listed by the Library of Congress as an authored book connected to ${memberLabel}. TOR Phi keeps this as an internal book profile so the title can later receive a local PDF, OCR text, deep summaries, and Kurdistan Lens review.`,
    summaries: {
      bookSummary:
        `${book.title} is ${withArticle(classification.className)} attributed in the official 119th Congress bibliography to ${member.name}. The imported source gives the member heading, author line${book.authorLine ? ` (${book.authorLine})` : ""}${book.isbn ? `, ISBN ${book.isbn}` : ""}${book.callNumber ? `, call number ${book.callNumber}` : ""}${book.published ? `, and published/created date ${book.published}` : ""}. Until a local PDF is attached, TOR Phi treats this as a verified bibliographic profile rather than a full-text interpretation.`,
      personInsight:
        `For ${member.name}, this title should be read as worldview evidence alongside votes, sponsored bills, speeches, committee work, social posts, and foreign-policy statements. The book profile is useful because long-form authored work often reveals durable themes that do not appear in short press statements: what problems the member thinks are central, who they blame, what kind of state power they trust, and which audiences they are trying to persuade.`,
      middleEastKurdistanRelevance:
        classification.middleEastRelevance
    },
    tags: [
      "U.S. Congress",
      member.chamber,
      member.party,
      member.state,
      classification.className,
      "congressional book",
      "PDF needed"
    ].filter(Boolean),
    metadata: {
      bioguideId: member.id,
      chamber: member.chamber,
      state: member.state,
      party: member.party,
      headingName: heading.name,
      authorLine: book.authorLine,
      isbn: book.isbn,
      callNumber: book.callNumber,
      publicationDate: book.published
    }
  };
}

function dedupeRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = `${record.personId}:${record.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchSource(source) {
  const response = await fetch(source.url, { headers: sourceRequestHeaders });
  if (!response.ok) throw new Error(`Failed to fetch ${source.url}: ${response.status}`);
  return response.text();
}

async function main() {
  const allRecords = [];
  const allUnmatched = [];

  for (const source of sources) {
    const html = await fetchSource(source);
    const { records, unmatched } = parseLocGuide(html, source);
    allRecords.push(...records);
    allUnmatched.push(...unmatched);
  }

  const records = dedupeRecords(allRecords).sort((a, b) => (
    a.metadata.chamber.localeCompare(b.metadata.chamber) ||
    a.personName.localeCompare(b.personName) ||
    a.title.localeCompare(b.title)
  ));

  const moduleHeader = [
    "// Generated by npm run import:congress-books.",
    "// Source basis: Library of Congress 119th Congress book guides and the Senate official sitting-senator bibliography.",
    ""
  ].join("\n");
  const moduleBody = `export const congressionalBookRecords = ${JSON.stringify(records, null, 2)};\n`;

  await writeFile(path.join(rootDir, "src", "congressionalBookDocuments.js"), moduleHeader + moduleBody);

  const publicDir = path.join(rootDir, "public", "source");
  await mkdir(publicDir, { recursive: true });
  await writeFile(
    path.join(publicDir, "us-congress-books.json"),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      sources,
      records,
      unmatched: allUnmatched
    }, null, 2)
  );

  const membersWithBooks = new Set(records.map((record) => record.personId));
  console.log(`Imported ${records.length} congressional book records for ${membersWithBooks.size} current members.`);
  if (allUnmatched.length) {
    console.log(`Unmatched member headings: ${allUnmatched.length}`);
    for (const item of allUnmatched.slice(0, 20)) {
      console.log(`- ${item.chamber}: ${item.heading.name} (${item.heading.state}) with ${item.bookCount} books`);
    }
  }
}

await main();
