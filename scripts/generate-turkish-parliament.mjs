import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = "https://www.tbmm.gov.tr";
const MEMBER_LIST_URL = `${BASE_URL}/milletvekili/AllList`;
const EMAIL_LIST_URL = `${BASE_URL}/milletvekili/eposta-liste`;
const OUTPUT_FILE = new URL("../src/turkishParliament.js", import.meta.url);
const ACTIVITY_OUTPUT_DIR = new URL("../public/source/tbmm-activity/", import.meta.url);
const ACTIVITY_LABELS = {
  "İlk İmza Sahibi Olduğu Kanun Teklifleri": "Bills where first signatory",
  "İmzası Bulunan Kanun Teklifleri": "Bills signed",
  "Sahibi Olduğu Yazılı Soru Önergeleri": "Written questions submitted",
  "İlk İmza Sahibi Olduğu Genel Görüşme Önergeleri": "General debate motions where first signatory",
  "İmzası Bulunan Genel Görüşme Önergeleri": "General debate motions signed",
  "İlk İmza Sahibi Olduğu Meclis Soruşturması Önergeleri": "Parliamentary investigation motions where first signatory",
  "İmzası Bulunan Meclis Soruşturması Önergeleri": "Parliamentary investigation motions signed",
  "İlk İmza Sahibi Olduğu Meclis Araştırması Önergeleri": "Parliamentary inquiry motions where first signatory",
  "İmzası Bulunan Meclis Araştırması Önergeleri": "Parliamentary inquiry motions signed",
  "Genel Kurul Konuşmaları": "General Assembly speeches",
  "Komisyon Konuşmaları": "Committee speeches"
};
const FIELD_LABELS = {
  "YY": "Legislative year",
  "Birleşim": "Sitting",
  "Tarih": "Date",
  "Konu Açıklaması": "Subject",
  "Ham Tut.Sf.": "Raw minutes page",
  "Basılmış Tut.Sf.": "Printed minutes page",
  "Tüm Metin": "Full text",
  "Partisi": "Party",
  "Esas No": "File number",
  "Başkanlığa Geliş Tarihi": "Submitted to Speaker",
  "Teklifin Başlığı": "Bill title",
  "İmza Sahipleri": "Signatories",
  "Son Durum": "Current status",
  "Önerge Sahibi": "Motion owner",
  "Önerge Konusu": "Motion subject",
  "Muhatabı": "Addressee",
  "Cevap Durumu": "Answer status",
  "Komisyon": "Committee"
};
const SECTION_LABELS = {
  "SON KONUŞMALAR": "Latest speeches",
  "BÜTÇE KANUNLARI İLE KESİN HESAP KANUNLARI VE BU KANUNLARDA DEĞİŞİKLİK YAPAN KANUN TEKLİFİ": "Budget laws, final account laws, and amendment bills",
  "KANUN TEKLİFLERİ": "Bills",
  "YAZILI SORU ÖNERGELERİ": "Written questions",
  "GENEL GÖRÜŞME ÖNERGELERİ": "General debate motions",
  "MECLİS ARAŞTIRMASI ÖNERGELERİ": "Parliamentary inquiry motions",
  "MECLİS SORUŞTURMASI ÖNERGELERİ": "Parliamentary investigation motions",
  "GENEL KURUL KONUŞMALARI": "General Assembly speeches",
  "KOMİSYON KONUŞMALARI": "Committee speeches"
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function normalizeKey(value = "") {
  return value
    .toLocaleUpperCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function titleCaseName(value = "") {
  const lowerParticles = new Set(["ve", "bin", "el"]);
  return value
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(Boolean)
    .map((part, index) => {
      if (index > 0 && lowerParticles.has(part)) return part;
      return part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1);
    })
    .join(" ");
}

function translateLabel(value = "") {
  const text = stripTags(value).replace(/\s+/g, " ").trim();
  return FIELD_LABELS[text] || SECTION_LABELS[text] || ACTIVITY_LABELS[text] || text;
}

async function fetchText(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "TOR Phi research database generator; contact: local analyst project",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    if (attempt < 3) {
      await sleep(500 * attempt);
      return fetchText(url, attempt + 1);
    }
    throw new Error(`Failed ${response.status} ${url}`);
  }

  return response.text();
}

function parseEmailRoster(html) {
  const emails = new Map();
  const rowPattern = /<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gis;
  let match;

  while ((match = rowPattern.exec(html))) {
    const name = stripTags(match[1]);
    const party = stripTags(match[2]);
    const province = stripTags(match[3]);
    const email = stripTags(match[4]);
    if (!name || !email.includes("@")) continue;
    emails.set(`${normalizeKey(name)}|${normalizeKey(province)}`, { email, party, province });
    emails.set(normalizeKey(name), { email, party, province });
  }

  return emails;
}

function parseMemberList(html, emailRoster) {
  const members = [];
  const blocks = html.split(/<li\s+class="list-group-item active tbmm-list-item-active"[^>]*>/i).slice(1);

  blocks.forEach((block) => {
    const province = stripTags(block.match(/([\s\S]*?)<\/li>/i)?.[1] ?? "");
    const provinceBody = block.split(/<li\s+class="list-group-item active tbmm-list-item-active"[^>]*>/i)[0];
    const rows = [...provinceBody.matchAll(/<li\s+class="list-group-item[^"]*"[^>]*>\s*<div\s+class="row">\s*<div\s+class="col-md-8">\s*<a\s+href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>\s*<\/div>\s*<div\s+class="col-md-4 text-right">\s*([\s\S]*?)\s*<\/div>\s*<\/div>\s*<\/li>/gi)];

    rows.forEach((row) => {
      const relativeHref = decodeHtml(row[1]);
      const rawName = stripTags(row[2]);
      const party = stripTags(row[3]);
      const detailUrl = new URL(relativeHref, BASE_URL).href;
      const params = new URL(detailUrl).searchParams;
      const memberId = params.get("Id") || normalizeKey(rawName).toLowerCase().replace(/\s+/g, "-");
      const periodId = params.get("DonemId") || "";
      const emailRecord = emailRoster.get(`${normalizeKey(rawName)}|${normalizeKey(province)}`) || emailRoster.get(normalizeKey(rawName));

      members.push({
        id: memberId,
        periodId,
        name: titleCaseName(rawName),
        party: emailRecord?.party || party,
        province: emailRecord?.province || province,
        email: emailRecord?.email || "",
        detailUrl
      });
    });
  });

  return members;
}

function parseDetailPage(html, member) {
  const imageMatch = html.match(/<img[^>]+class="profile-image"[^>]+src="([^"]+)"/i) || html.match(/<img[^>]+src="([^"]+)"[^>]+class="profile-image"/i);
  const committeeBlock = html.match(/<div[^>]+class="[^"]*\bprofil-komisyon-div\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "";
  const bioBlock = html.match(/<div[^>]+class="[^"]*\bprofile-ozgecmis-div\b[^"]*"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "";
  const activityBlock = html.match(/YASAMA FAALİYETLERİ([\s\S]*?)<\/ul>/i)?.[1] ?? "";
  const contactRows = [...html.matchAll(/<tr>\s*<td[^>]*>\s*<strong>\s*([^<]+?)\s*<\/strong>\s*<\/td>\s*<td[^>]*>\s*:?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi)];
  const contacts = {};
  const social = parseSocialLinks(html);

  contactRows.forEach((row) => {
    const key = stripTags(row[1]).replace(/:$/, "");
    const value = stripTags(row[2]);
    if (key && value) contacts[key] = value;
  });

  const activityLinks = [...activityBlock.matchAll(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      label: stripTags(match[2]),
      url: new URL(decodeHtml(match[1]), member.detailUrl).href
    }))
    .filter((item) => item.label && item.url);

  return {
    imageUrl: imageMatch ? new URL(decodeHtml(imageMatch[1]), BASE_URL).href : "",
    biography: stripTags(bioBlock),
    committees: stripTags(committeeBlock)
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean),
    contacts,
    social,
    activityLinks
  };
}

function parseSocialLinks(html) {
  const socialBlock = html.match(/<div[^>]+class="[^"]*\bprofile-sosyal-medya\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "";
  const candidates = socialBlock || html;
  const links = [...candidates.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => {
      const url = decodeHtml(match[1]);
      const labelText = stripTags(match[2]) || url;
      if (!/twitter\.com|x\.com|facebook\.com|instagram\.com|youtube\.com|linkedin\.com/i.test(url)) return null;
      return [normalizeSocialLabel(labelText, url), url.startsWith("http") ? url : new URL(url, BASE_URL).href];
    })
    .filter(Boolean);

  return uniqueBy(links, (item) => item[1]);
}

function normalizeSocialLabel(label, url) {
  if (/twitter\.com|x\.com/i.test(url)) return "X / Twitter";
  if (/facebook\.com/i.test(url)) return "Facebook";
  if (/instagram\.com/i.test(url)) return "Instagram";
  if (/youtube\.com/i.test(url)) return "YouTube";
  if (/linkedin\.com/i.test(url)) return "LinkedIn";
  return stripTags(label) || "Social profile";
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractTableBlocks(html) {
  const body = html.match(/<div class="blog-content tbmm-div-list">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/i)?.[1] ?? html;
  const blocks = [];
  let currentSection = "Records";
  const pattern = /<div[^>]*tbmm-div-sayfa-ici-baslik[^>]*>([\s\S]*?)<\/div>|<table[^>]*>([\s\S]*?)<\/table>/gi;
  let match;

  while ((match = pattern.exec(body))) {
    if (match[1]) {
      currentSection = translateLabel(match[1]);
      continue;
    }

    if (match[2]) {
      blocks.push({ section: currentSection, tableHtml: match[2] });
    }
  }

  return blocks;
}

function parseCells(rowHtml, tagName) {
  return [...rowHtml.matchAll(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi"))].map((match) => match[1]);
}

function parseActivityPage(html, sourceUrl) {
  const blocks = extractTableBlocks(html);
  const records = [];

  blocks.forEach(({ section, tableHtml }) => {
    const headerRow = tableHtml.match(/<thead[^>]*>[\s\S]*?<tr[^>]*>([\s\S]*?)<\/tr>[\s\S]*?<\/thead>/i)?.[1] ?? "";
    const headers = parseCells(headerRow, "th").concat(parseCells(headerRow, "td")).map(translateLabel);
    const body = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] ?? "";
    const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

    rows.forEach((row) => {
      const rawCells = parseCells(row[1], "td");
      if (rawCells.length === 0) return;

      const fields = {};
      let title = "";
      let url = "";
      let date = "";

      rawCells.forEach((cellHtml, index) => {
        const label = headers[index] || `Field ${index + 1}`;
        const link = cellHtml.match(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        const value = stripTags(link?.[2] ?? cellHtml);
        if (!value) return;

        fields[label] = value;
        if (label === "Date") date = value;
        if (!title && (label === "Subject" || label.includes("title") || link)) title = value;
        if (link && !url) url = new URL(decodeHtml(link[1]), sourceUrl).href;
      });

      if (Object.keys(fields).length === 0) return;
      records.push({
        section,
        title: title || Object.values(fields).find(Boolean) || "Record",
        date,
        url,
        fields
      });
    });
  });

  return records;
}

async function enrichMemberActivity(member) {
  if (!member.activityLinks?.length) return [];

  return mapWithConcurrency(member.activityLinks, 4, async (link) => {
    const label = ACTIVITY_LABELS[link.label] || link.label;
    try {
      const html = await fetchText(link.url);
      const records = parseActivityPage(html, link.url);
      return {
        type: link.label,
        label,
        sourceUrl: link.url,
        count: records.length,
        records
      };
    } catch (error) {
      console.warn(`Activity failed for ${member.name} / ${label}: ${error.message}`);
      return {
        type: link.label,
        label,
        sourceUrl: link.url,
        count: 0,
        records: []
      };
    }
  });
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

function summarizePartyCounts(members) {
  return Object.entries(
    members.reduce((counts, member) => {
      counts[member.party] = (counts[member.party] || 0) + 1;
      return counts;
    }, {})
  )
    .map(([party, count]) => ({ party, count }))
    .sort((a, b) => b.count - a.count || a.party.localeCompare(b.party));
}

async function main() {
  console.log("Fetching TBMM rosters...");
  const [listHtml, emailHtml] = await Promise.all([fetchText(MEMBER_LIST_URL), fetchText(EMAIL_LIST_URL)]);
  const emailRoster = parseEmailRoster(emailHtml);
  const baseMembers = parseMemberList(listHtml, emailRoster);
  console.log(`Found ${baseMembers.length} members. Fetching detail pages...`);

  const members = await mapWithConcurrency(baseMembers, 10, async (member, index) => {
    try {
      const html = await fetchText(member.detailUrl);
      const detail = parseDetailPage(html, member);
      if ((index + 1) % 50 === 0) console.log(`Enriched ${index + 1}/${baseMembers.length}`);
      return { ...member, ...detail };
    } catch (error) {
      console.warn(`Detail failed for ${member.name}: ${error.message}`);
      return { ...member, imageUrl: "", biography: "", committees: [], contacts: {}, activityLinks: [] };
    }
  });

  console.log("Importing TBMM legislative activity pages...");
  await mkdir(ACTIVITY_OUTPUT_DIR, { recursive: true });
  const enrichedMembers = await mapWithConcurrency(members, 6, async (member, index) => {
    const activity = await enrichMemberActivity(member);
    const activitySummaries = await Promise.all(activity.map(async (item, itemIndex) => {
      const filename = `${member.id}-${String(itemIndex + 1).padStart(2, "0")}.json`;
      const publicPath = `/source/tbmm-activity/${filename}`;
      await writeFile(new URL(filename, ACTIVITY_OUTPUT_DIR), JSON.stringify({
        memberId: member.id,
        memberName: member.name,
        ...item
      }, null, 2));
      return {
        type: item.type,
        label: item.label,
        sourceUrl: item.sourceUrl,
        count: item.count,
        file: publicPath
      };
    }));
    if ((index + 1) % 25 === 0) console.log(`Imported activity ${index + 1}/${members.length}`);
    return {
      ...member,
      parliamentaryActivity: activitySummaries
    };
  });

  const metadata = {
    sourceDate: new Date().toISOString().slice(0, 10),
    total: enrichedMembers.length,
    parties: summarizePartyCounts(enrichedMembers),
    provinces: [...new Set(enrichedMembers.map((member) => member.province))].sort((a, b) => a.localeCompare(b)),
    importedActivityRecords: enrichedMembers.reduce((sum, member) => sum + (member.parliamentaryActivity ?? []).reduce((innerSum, item) => innerSum + item.count, 0), 0),
    sources: {
      currentList: "https://www.tbmm.gov.tr/milletvekili/liste",
      englishDeputies: "https://www.tbmm.gov.tr/deputies",
      emailRoster: EMAIL_LIST_URL,
      allListEndpoint: MEMBER_LIST_URL
    }
  };

  const source = `// Generated by scripts/generate-turkish-parliament.mjs from official TBMM pages.\nexport const turkishParliamentMetadata = ${JSON.stringify(metadata, null, 2)};\n\nexport const turkishParliamentMembers = ${JSON.stringify(enrichedMembers, null, 2)};\n`;
  await writeFile(OUTPUT_FILE, source);
  console.log(`Wrote ${enrichedMembers.length} TBMM member profiles and ${metadata.importedActivityRecords} imported activity records to ${OUTPUT_FILE.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
