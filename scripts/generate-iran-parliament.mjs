import { mkdir, writeFile } from "node:fs/promises";

const WIKI_API = "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_Iran%27s_parliament_representatives_(12th_term)&prop=text&format=json&origin=*";
const WIKI_PAGE = "https://en.wikipedia.org/wiki/List_of_Iran%27s_parliament_representatives_(12th_term)";
const OFFICIAL_PARLIAMENT = "https://en.parliran.ir/";
const ICANA = "https://icana.ir/";
const IPU_PAGE = "https://data.ipu.org/parliament/IR/IR-LC01/";

const outModule = new URL("../src/iranParliament.js", import.meta.url);
const outDir = new URL("../public/source/iran-parliament/", import.meta.url);
const memberDir = new URL("members/", outDir);
const generatedAt = new Date().toISOString();

await mkdir(memberDir, { recursive: true });

const html = await fetchWikipediaHtml();
const members = parseMemberTable(html)
  .map(compactMember)
  .sort((a, b) => a.sortName.localeCompare(b.sortName));

const factions = summarizeCount(members, (member) => member.faction || "Not listed")
  .map(([faction, count]) => ({ faction, count }));
const provinces = summarizeCount(members, (member) => member.province || "Not listed")
  .map(([province, count]) => ({ province, count }));

const metadata = {
  generatedAt,
  sourceDate: generatedAt.slice(0, 10),
  total: members.length,
  house: "Islamic Consultative Assembly / Majlis",
  legislature: "12th term",
  factions,
  provinces,
  sources: {
    officialParliament: OFFICIAL_PARLIAMENT,
    ipuParline: IPU_PAGE,
    icana: ICANA,
    publicRoster: WIKI_PAGE,
    publicRosterApi: WIKI_API
  },
  sourceLimitations: [
    "The official ParlIran host timed out or did not resolve from this environment during generation.",
    "The roster is generated from the current public 12th-term list and kept in TOR Phi as a refreshable local archive.",
    "Records pages preserve official Majlis, IPU, ICANA, and Majlis Research Center source paths for later official import."
  ]
};

const index = {
  generatedAt,
  metadata,
  sourceRegistry: [
    {
      label: "Islamic Consultative Assembly official website",
      url: OFFICIAL_PARLIAMENT,
      note: "Official parliamentary website. It was retained as the first official source, but the host was unreachable from this environment during generation."
    },
    {
      label: "IPU Parline Iran parliament profile",
      url: IPU_PAGE,
      note: "Inter-Parliamentary Union profile that links the official parliament and member-list source paths."
    },
    {
      label: "ICANA / Khaneh Mellat",
      url: ICANA,
      note: "Official parliament news service used as the record-search layer for member mentions, attendance reports, voting-participation reports, and parliamentary statements."
    },
    {
      label: "Public 12th-term roster",
      url: WIKI_PAGE,
      note: "Public machine-readable roster used to seed all member profiles when the official ParlIran site was unreachable."
    }
  ],
  counts: {
    members: members.length,
    factions: factions.length,
    provinces: provinces.length,
    recordSearchSlots: 0
  },
  members: []
};

for (const member of members) {
  const sourceLinks = buildSourceLinks(member);
  member.sourceLinks = sourceLinks;
  member.recordSearchCount = member.records.sourceSearches.length;
  index.counts.recordSearchSlots += member.recordSearchCount;
  index.members.push({
    id: member.id,
    name: member.name,
    slug: member.slug,
    province: member.province,
    constituency: member.constituency,
    faction: member.faction,
    officialUrl: member.officialUrl,
    recordUrl: member.recordUrl,
    recordSearchCount: member.recordSearchCount
  });

  const archive = {
    member,
    generatedAt,
    officialSourceNotes: [
      "The official ParlIran host was unreachable during generation, so this local profile is seeded from a public 12th-term roster and official-source search slots.",
      "The records page keeps official Majlis, IPU, ICANA, and Majlis Research Center paths visible so analysts can replace public-list fields with official profile and vote data when the official host is reachable.",
      "TOR Phi profile and record navigation remains internal."
    ],
    sourceUrls: sourceLinks.map(([label, url]) => ({ label, url })),
    records: member.records,
    sourceStatus: {
      roster: "seeded-public-current-list",
      officialParliamentHost: "unreachable-during-generation",
      icanaSearchSlots: "registered",
      voteDetailImport: "not-publicly-imported-yet"
    }
  };

  await writeFile(new URL(`${member.id}.json`, memberDir), `${JSON.stringify(archive, null, 2)}\n`);
}

await writeFile(new URL("index.json", outDir), `${JSON.stringify(index, null, 2)}\n`);
await writeFile(outModule, renderModule(metadata, members));

console.log(`Wrote ${members.length} Iranian Majlis member profiles.`);
console.log(`Registered ${index.counts.recordSearchSlots.toLocaleString()} official-source search slots.`);

async function fetchWikipediaHtml() {
  const response = await fetch(WIKI_API, { headers: { accept: "application/json", "user-agent": "TORPhi/1.0" } });
  if (!response.ok) throw new Error(`Failed to fetch roster: HTTP ${response.status}`);
  const data = await response.json();
  return data.parse?.text?.["*"] || "";
}

function parseMemberTable(html) {
  const table = (html.match(/<table class="wikitable"[\s\S]*?<\/table>/i) || [])[0] || "";
  const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const parsed = [];
  const rowspans = [];

  for (const row of rows.slice(1)) {
    const rawCells = [...row.matchAll(/<(td|th)([^>]*)>([\s\S]*?)<\/\1>/gi)].map((match) => ({
      attrs: match[2] || "",
      html: match[3] || ""
    }));
    if (rawCells.length === 0) continue;

    const cells = [];
    let rawIndex = 0;
    for (let column = 0; column < 10; column += 1) {
      if (rowspans[column]?.remaining > 0) {
        cells[column] = rowspans[column].value;
        rowspans[column].remaining -= 1;
        continue;
      }
      const raw = rawCells[rawIndex];
      rawIndex += 1;
      if (!raw) break;
      const value = stripHtml(raw.html);
      cells[column] = value;
      const span = Number((raw.attrs.match(/rowspan=["']?(\d+)/i) || [])[1] || "1");
      if (span > 1) rowspans[column] = { value, remaining: span - 1 };
    }

    const number = cleanText(cells[0]);
    const name = cleanText(cells[3]);
    if (!/^\d+$/.test(number) || !name || /vacant/i.test(name)) continue;

    parsed.push({
      number: Number(number),
      province: cleanText(cells[1]),
      constituency: cleanText(cells[2]),
      name,
      faction: normalizeFaction(cleanText(cells[4])),
      list: cells.slice(5).map(cleanText).filter(Boolean).join(" / ")
    });
  }

  return parsed;
}

function compactMember(row) {
  const slug = slugify(row.name);
  const id = `ir-majlis-${String(row.number).padStart(3, "0")}-${slug}`;
  const icanaQuery = encodeURIComponent(row.name);
  const constituencyQuery = encodeURIComponent(`${row.name} ${row.constituency}`);
  const kurdistanQuery = encodeURIComponent(`${row.name} کردستان عراق اقلیم کردستان اربیل`);

  return {
    id,
    slug,
    number: row.number,
    name: row.name,
    sortName: row.name,
    province: row.province,
    constituency: row.constituency,
    faction: row.faction || "Not listed",
    list: row.list,
    house: "Islamic Consultative Assembly / Majlis",
    legislature: "12th term",
    role: `Majlis representative for ${row.constituency}`,
    officialUrl: OFFICIAL_PARLIAMENT,
    recordUrl: `/country/iran/parliament/${encodeURIComponent(slug)}/records`,
    imageUrl: "",
    sourceLinks: [],
    records: {
      profileSeed: {
        source: WIKI_PAGE,
        sourceType: "Public current roster seed",
        limitation: "Replace with official ParlIran profile fields when the official host is reachable."
      },
      sourceSearches: [
        {
          label: "ICANA member mention search",
          url: `${ICANA}search?q=${icanaQuery}`,
          note: "Search the official parliament news service for this member's statements and record mentions."
        },
        {
          label: "ICANA constituency search",
          url: `${ICANA}search?q=${constituencyQuery}`,
          note: "Search constituency and member together to reduce false positives."
        },
        {
          label: "ICANA Kurdistan / Iraq watch search",
          url: `${ICANA}search?q=${kurdistanQuery}`,
          note: "Search for Kurdistan Region, Iraq, Erbil, and Kurdish-Iranian relevance."
        },
        {
          label: "Majlis Research Center search",
          url: `https://rc.majlis.ir/fa/search?q=${icanaQuery}`,
          note: "Search research reports, legal texts, and parliamentary research references."
        }
      ],
      watchFrames: buildWatchFrames(row),
      votingRecords: [],
      speeches: [],
      questions: []
    },
    recordSearchCount: 4
  };
}

function buildWatchFrames(row) {
  const isKurdishProvince = /Kurdistan|Kermanshah|West Azerbaijan|Ilam/i.test(row.province);
  return [
    {
      title: "Direct Kurdistan-region relevance",
      status: isKurdishProvince ? "High geographic watch" : "Issue watch",
      summary: isKurdishProvince
        ? `${row.name} represents ${row.constituency} in ${row.province}, making Kurdish domestic politics, border security, Iraq, and KRG-related rhetoric especially important to monitor.`
        : `${row.name}'s Kurdistan relevance should be established through official statements, committee activity, border/security language, Iraq policy, or ICANA/Majlis records before scoring.`
    },
    {
      title: "Foreign-policy and security records",
      status: "Pending official import",
      summary: "Track official references to Iraq, KRG, Erbil, Kurdish opposition groups, border incidents, security agreements, trade crossings, sanctions, energy, and minority issues."
    },
    {
      title: "Faction signal",
      status: row.faction || "Not listed",
      summary: "Faction labels are a weak proxy in Iran; use them as a starting filter, not a final stance."
    }
  ];
}

function buildSourceLinks(member) {
  return [
    ["TOR Phi records", `/country/iran/parliament/${encodeURIComponent(member.slug)}/records`],
    ["Islamic Consultative Assembly official website", OFFICIAL_PARLIAMENT],
    ["IPU Parline Iran parliament profile", IPU_PAGE],
    ["ICANA / Khaneh Mellat", ICANA],
    ["Public 12th-term roster seed", WIKI_PAGE],
    ...member.records.sourceSearches.map((item) => [item.label, item.url])
  ];
}

function normalizeFaction(value) {
  return value.replace(/Principlists/i, "Principlist").trim();
}

function renderModule(metadata, members) {
  const moduleMembers = members.map((member) => ({
    id: member.id,
    slug: member.slug,
    number: member.number,
    name: member.name,
    sortName: member.sortName,
    province: member.province,
    constituency: member.constituency,
    faction: member.faction,
    list: member.list,
    house: member.house,
    legislature: member.legislature,
    role: member.role,
    officialUrl: member.officialUrl,
    recordUrl: member.recordUrl,
    imageUrl: member.imageUrl,
    sourceLinks: member.sourceLinks,
    recordSearchCount: member.recordSearchCount,
    records: {
      watchFrames: member.records.watchFrames
    }
  }));

  return `// Generated by scripts/generate-iran-parliament.mjs from a current public Majlis roster seed plus official source paths.\n// Generated on ${metadata.sourceDate}. Do not edit individual records by hand.\n\nexport const iranParliamentMetadata = ${JSON.stringify(metadata, null, 2)};\n\nexport const iranParliamentMembers = ${JSON.stringify(moduleMembers, null, 2)};\n`;
}

function stripHtml(value) {
  return cleanText(`${value ?? ""}`
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<sup[\s\S]*?<\/sup>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'"));
}

function summarizeCount(items, getter) {
  const counts = new Map();
  for (const item of items) {
    const key = getter(item) || "Not listed";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function cleanText(value) {
  return `${value ?? ""}`.replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return `${value ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
