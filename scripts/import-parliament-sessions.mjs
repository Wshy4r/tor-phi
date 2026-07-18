import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicOutDir = path.join(rootDir, "public", "source", "parliament-sessions");
const publicOutFile = path.join(publicOutDir, "index.json");
const moduleOutFile = path.join(rootDir, "src", "parliamentSessions.js");
const maxPerCountry = 120;
const liveSourceLimit = Number(process.env.PARLIAMENT_SESSIONS_LIVE_LIMIT || "30");
const enableLiveSources = process.env.PARLIAMENT_SESSIONS_LIVE !== "0";
const writeModule = process.env.PARLIAMENT_SESSIONS_WRITE_MODULE !== "0";

const parliamentConnectors = {
  usa: [
    {
      label: "House Clerk roll call archive",
      url: "https://clerk.house.gov/Votes",
      kind: "official vote/session archive",
      refreshUse: "Pull House roll calls after each floor day and group them as proceeding records."
    },
    {
      label: "House Clerk recent member votes",
      url: "https://clerk.house.gov/Members/ViewRecentVotes",
      kind: "official member vote table",
      refreshUse: "Current TOR Phi import reads member-level recent-vote rows and deduplicates them by roll call."
    },
    {
      label: "Congress.gov API",
      url: "https://api.congress.gov/",
      kind: "official legislative API",
      refreshUse: "Use with CONGRESS_GOV_API_KEY for bill, amendment, committee, and member action enrichment."
    },
    {
      label: "Senate floor votes",
      url: "https://www.senate.gov/legislative/votes_new.htm",
      kind: "official vote archive",
      refreshUse: "Add Senate roll calls into the same normalized session index."
    }
  ],
  turkey: [
    {
      label: "TBMM General Assembly speeches",
      url: "https://www.tbmm.gov.tr/milletvekili/UyeGenelKurulKonusma",
      kind: "official speech/session archive",
      refreshUse: "Current TOR Phi import groups General Assembly speech rows by legislative year, sitting, and date."
    },
    {
      label: "TBMM minutes search",
      url: "https://www.tbmm.gov.tr/Tutanaklar/TutanakSorgu",
      kind: "official minutes archive",
      refreshUse: "Use this as the deeper session transcript source when expanding beyond member speech rows."
    }
  ],
  france: [
    {
      label: "Assemblee nationale public votes",
      url: "https://www.assemblee-nationale.fr/dyn/17/scrutins",
      kind: "official vote archive",
      refreshUse: "Current TOR Phi import reads deputy vote positions and deduplicates by public vote number."
    },
    {
      label: "Assemblee nationale open data",
      url: "https://data.assemblee-nationale.fr/",
      kind: "official open-data portal",
      refreshUse: "Use for richer agenda, dossier, organ, and sitting metadata."
    },
    {
      label: "Assemblee agenda",
      url: "https://www.assemblee-nationale.fr/dyn/agenda",
      kind: "official agenda",
      refreshUse: "Use to add future and same-day sessions before vote rows exist."
    }
  ],
  uk: [
    {
      label: "Commons Votes API",
      url: "https://commonsvotes-api.parliament.uk/",
      kind: "official division API",
      refreshUse: "Current TOR Phi import reads member voting rows and deduplicates by division id."
    },
    {
      label: "Hansard",
      url: "https://hansard.parliament.uk/",
      kind: "official debate archive",
      refreshUse: "Use to attach transcript text and debate sections to each sitting."
    },
    {
      label: "UK Parliament developer hub",
      url: "https://developer.parliament.uk/",
      kind: "official API directory",
      refreshUse: "Use for members, questions, registered interests, bills, committees, and sitting metadata."
    }
  ],
  iran: [
    {
      label: "Islamic Consultative Assembly",
      url: "https://en.parliran.ir/",
      kind: "official parliament portal",
      refreshUse: "Use when reachable for official session, member, and chamber records."
    },
    {
      label: "ICANA / Khaneh Mellat",
      url: "https://icana.ir/",
      kind: "official parliament news service",
      refreshUse: "Use as the practical source for speeches, member statements, committees, and session news."
    },
    {
      label: "Majlis Research Center",
      url: "https://rc.majlis.ir/fa",
      kind: "official research/legal portal",
      refreshUse: "Use for bills, research papers, legal texts, and issue framing."
    }
  ]
};

const countryLabels = {
  usa: {
    countryName: "United States",
    parliamentName: "U.S. Congress",
    defaultChamber: "House of Representatives"
  },
  turkey: {
    countryName: "Turkiye",
    parliamentName: "Grand National Assembly of Turkiye",
    defaultChamber: "General Assembly"
  },
  france: {
    countryName: "France",
    parliamentName: "French National Assembly",
    defaultChamber: "National Assembly"
  },
  uk: {
    countryName: "United Kingdom",
    parliamentName: "UK Parliament",
    defaultChamber: "House of Commons"
  },
  iran: {
    countryName: "Iran",
    parliamentName: "Islamic Consultative Assembly / Majlis",
    defaultChamber: "Majlis"
  }
};

const tagPatterns = [
  {
    tag: "Kurdistan / KRG",
    lane: "kurdistan",
    pattern: /kurdistan|krg|ikby|erbil|irbil|peshmerga|barzani|northern iraq|sinjar|yazid|ezidi|kurdish/i
  },
  {
    tag: "Iraq",
    lane: "iraq",
    pattern: /iraq|iraqi|baghdad|mosul|kirkuk|basra|daesh|isis|islamic state/i
  },
  {
    tag: "Syria / YPG-SDF",
    lane: "iraq",
    pattern: /syria|syrian|ypg|sdf|rojava|manbij|kobani|hasakah|qamishli/i
  },
  {
    tag: "Security / border",
    lane: "iraq",
    pattern: /pkk|terror|security|border|operation|military|armed|surveillance|sanction|war powers/i
  },
  {
    tag: "Energy / trade",
    lane: "iraq",
    pattern: /oil|gas|energy|pipeline|trade|customs|water|electricity|investment|budget|appropriation/i
  },
  {
    tag: "Diplomacy / foreign policy",
    lane: "global",
    pattern: /foreign|diplomacy|treaty|minister|embassy|sanction|defense|defence|eu|nato|united nations/i
  }
];

await fs.mkdir(publicOutDir, { recursive: true });

const rawSessions = [
  ...(enableLiveSources ? await buildLiveUsHouseSessions() : []),
  ...(enableLiveSources ? await buildLiveUkSessions() : []),
  ...(await buildUsSessions()),
  ...(await buildTurkeySessions()),
  ...(await buildFranceSessions()),
  ...(await buildUkSessions()),
  ...(await buildIranSourceSlots())
];

const sessions = dedupeRawSessions(rawSessions).map((session) => refineSession(session));

const sessionsByCountry = groupBy(sessions, (session) => session.countryId);
for (const [countryId, items] of Object.entries(sessionsByCountry)) {
  sessionsByCountry[countryId] = sortSessionItems(items).slice(0, maxPerCountry);
}

const finalSessions = Object.values(sessionsByCountry).flat();
const metadata = {
  generatedAt: new Date().toISOString(),
  total: finalSessions.length,
  countries: Object.fromEntries(Object.entries(countryLabels).map(([countryId, labels]) => {
    const countrySessions = sessionsByCountry[countryId] ?? [];
    const imported = countrySessions.filter((item) => item.recordKind !== "source-slot");
    const slots = countrySessions.filter((item) => item.recordKind === "source-slot");
    return [countryId, {
      ...labels,
      count: countrySessions.length,
      importedCount: imported.length,
      sourceSlotCount: slots.length,
      latestDate: imported.map((item) => item.date).filter(Boolean).sort().at(-1) || "",
      kurdistanCount: countrySessions.filter((item) => item.lane?.kurdistan).length,
      iraqCount: countrySessions.filter((item) => item.lane?.iraq).length,
      connectors: parliamentConnectors[countryId] ?? []
    }];
  }))
};

const archive = {
  metadata,
  sessions: finalSessions
};

await fs.writeFile(publicOutFile, `${JSON.stringify(archive, null, 2)}\n`);
if (writeModule) {
  await fs.writeFile(moduleOutFile, [
    "/* Generated by scripts/import-parliament-sessions.mjs. Do not edit by hand. */",
    `export const parliamentSessionMetadata = ${JSON.stringify(metadata, null, 2)};`,
    `export const parliamentSessions = ${JSON.stringify(finalSessions, null, 2)};`,
    "export const parliamentSessionsByCountry = parliamentSessions.reduce((groups, session) => {",
    "  groups[session.countryId] = groups[session.countryId] || [];",
    "  groups[session.countryId].push(session);",
    "  return groups;",
    "}, {});",
    ""
  ].join("\n"));
}

console.log(`Imported ${finalSessions.length} parliament session records into ${path.relative(rootDir, publicOutFile)}${writeModule ? " and src/parliamentSessions.js" : ""}.`);

async function buildLiveUsHouseSessions() {
  const url = "https://clerk.house.gov/Votes/MemberVotes?Page=1&CongressNum=119&Session=2nd";
  const result = await fetchText(url);
  if (!result.ok) return [];
  const blocks = result.body.match(/<div class="role-call-vote">[\s\S]*?(?=<div class="role-call-vote">|$)/g) ?? [];
  const checkedAt = new Date().toISOString();

  return blocks.slice(0, liveSourceLimit).map((block) => {
    const rollCallNumber = cleanText(block.match(/Roll Call Number:\s*<a[^>]*>([\s\S]*?)<\/a>/i)?.[1]);
    const billNumber = cleanText(block.match(/Bill Number:\s*<a[^>]*>([\s\S]*?)<\/a>/i)?.[1]);
    const billTitle = cleanText(block.match(/class="billdesc">([\s\S]*?)<\/span>/i)?.[1]);
    const voteQuestion = cleanText(block.match(/class="roll-call-description votequestion"[^>]*>[\s\S]*?<label>Vote Question:<\/label>([\s\S]*?)<\/p>/i)?.[1]);
    const voteType = cleanText(block.match(/<label>Vote Type:<\/label>([\s\S]*?)<\/p>/i)?.[1]);
    const status = cleanText(block.match(/<label>Status:<\/label>([\s\S]*?)<\/p>/i)?.[1]);
    const detailHref = block.match(/href="(\/Votes\/\d+[^"]*)"/i)?.[1] || "";
    const rowDateText = cleanText(block.match(/<div class="first-row row-comment">([\s\S]*?)<\/div>/i)?.[1]).split("|")[0]?.trim() || "";
    const date = normalizeDate(rowDateText, "us");
    if (!rollCallNumber || !date) return null;

    return {
      id: `usa-house-${date}-${rollCallNumber}`,
      countryId: "usa",
      parliament: countryLabels.usa.parliamentName,
      chamber: "House of Representatives",
      date,
      title: `${billNumber ? `${billNumber}: ` : ""}${billTitle || `House roll call ${rollCallNumber}`}`,
      originalTitle: billTitle || "",
      sessionType: "House floor vote",
      recordKind: "imported-session",
      sourceLabel: "Office of the Clerk",
      sourceType: "official House live vote endpoint",
      sourceUrl: detailHref ? new URL(detailHref, "https://clerk.house.gov").href : "https://clerk.house.gov/Votes",
      localHref: "/source/parliament-sessions/index.json",
      liveCheckedAt: checkedAt,
      localArchiveBacked: false,
      summary:
        `Live House Clerk roll call ${rollCallNumber}${status ? ` ${status.toLowerCase()}` : ""}. ` +
        `${voteQuestion ? `Vote question: ${voteQuestion}. ` : ""}` +
        `${voteType ? `Vote type: ${voteType}. ` : ""}` +
        "This record came from the Clerk vote endpoint and will be enriched by member-level imports when those run.",
      vote: {
        rollCallNumber,
        billNumber,
        status,
        voteQuestion,
        voteType,
        positions: {}
      },
      membersSample: []
    };
  }).filter(Boolean);
}

async function buildLiveUkSessions() {
  const url = `https://commonsvotes-api.parliament.uk/data/divisions.json/search?queryParameters.skip=0&queryParameters.take=${liveSourceLimit}`;
  const rows = await fetchJson(url).catch(() => []);
  if (!Array.isArray(rows)) return [];
  const checkedAt = new Date().toISOString();

  return rows.map((row) => {
    const date = normalizeDate(row.Date);
    const id = row.DivisionId || row.Id || "";
    if (!id || !date) return null;
    return {
      id: `uk-commons-division-${id}`,
      countryId: "uk",
      parliament: countryLabels.uk.parliamentName,
      chamber: "House of Commons",
      date,
      title: `Commons division ${row.Number || ""}: ${row.FriendlyTitle || row.Title || "Division record"}`,
      originalTitle: row.Title || "",
      sessionType: "Commons division / floor proceeding",
      recordKind: "imported-session",
      sourceLabel: "UK Parliament Commons Votes",
      sourceType: "official live division API",
      sourceUrl: `https://votes.parliament.uk/Votes/Commons/Division/${id}`,
      localHref: "/source/parliament-sessions/index.json",
      liveCheckedAt: checkedAt,
      localArchiveBacked: false,
      summary:
        `Live Commons Votes API division ${row.Number || id} with official result counts of ${row.AyeCount ?? "?"} Aye and ${row.NoCount ?? "?"} No. ` +
        `${row.IsDeferred ? "Marked as deferred. " : ""}` +
        "This record came from the live division search endpoint and will be enriched by member-level imports when those run.",
      vote: {
        id,
        number: row.Number || "",
        ayeCount: row.AyeCount ?? null,
        noCount: row.NoCount ?? null,
        deferred: Boolean(row.IsDeferred),
        publicationUpdated: row.PublicationUpdated || "",
        positions: {}
      },
      membersSample: []
    };
  }).filter(Boolean);
}

async function buildUsSessions() {
  const files = await listJsonFiles(path.join(rootDir, "public", "source", "us-congress-official", "members"));
  const byVote = new Map();

  for (const file of files) {
    const json = await readJson(file);
    const member = json.member ?? {};
    const rows = Array.isArray(json.houseClerk?.recentVotes) ? json.houseClerk.recentVotes : [];
    for (const row of rows) {
      const date = normalizeDate(row.date, "us");
      const key = `usa-house-${date}-${row.rollCallNumber || slugify(row.billTitle || row.sourceUrl)}`;
      const current = byVote.get(key) ?? {
        id: key,
        countryId: "usa",
        parliament: countryLabels.usa.parliamentName,
        chamber: "House of Representatives",
        date,
        title: `${row.billNumber ? `${row.billNumber}: ` : ""}${row.billTitle || `House roll call ${row.rollCallNumber}`}`,
        originalTitle: row.billTitle || "",
        sessionType: "House floor vote",
        recordKind: "imported-session",
        sourceLabel: "Office of the Clerk",
        sourceType: "official House vote archive",
        sourceUrl: row.sourceUrl || "https://clerk.house.gov/Votes",
        localHref: "/source/parliament-sessions/index.json",
        localArchiveBacked: true,
        summary: "",
        vote: {
          rollCallNumber: row.rollCallNumber || "",
          billNumber: row.billNumber || "",
          status: row.status || "",
          positions: {}
        },
        membersSample: []
      };
      if (row.vote) current.vote.positions[row.vote] = (current.vote.positions[row.vote] || 0) + 1;
      if (member.name && current.membersSample.length < 6) {
        current.membersSample.push(`${member.name}: ${row.vote || "position not listed"}`);
      }
      byVote.set(key, current);
    }
  }

  return sortSessionItems([...byVote.values()].map((item) => {
    const positionSummary = Object.entries(item.vote.positions)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => `${count} ${label}`)
      .join(", ");
    return {
      ...item,
      summary:
        `House roll call ${item.vote.rollCallNumber || "record"}${item.vote.status ? ` ${item.vote.status.toLowerCase()}` : ""}. ` +
        `TOR Phi deduplicated this from member vote rows; visible positions in the local archive: ${positionSummary || "position counts pending"}.`
    };
  })).slice(0, maxPerCountry);
}

async function buildTurkeySessions() {
  const dir = path.join(rootDir, "public", "source", "tbmm-activity");
  const files = (await listJsonFiles(dir)).filter((file) => file.endsWith("-10.json"));
  const bySitting = new Map();

  for (const file of files) {
    const json = await readJson(file);
    if (!Array.isArray(json.records)) continue;
    for (const record of json.records) {
      const fields = record.fields ?? {};
      const date = normalizeDate(fields.Date || fields.Tarih || record.date || record.metadata?.Tarih);
      if (!date) continue;
      const legislativeYear = fields["Legislative year"] || record.metadata?.["Yasama Yılı"] || "";
      const sitting = fields.Sitting || record.metadata?.["Birleşim"] || "";
      const key = `turkey-tbmm-${date}-${legislativeYear || "year"}-${sitting || slugify(record.title || "sitting")}`;
      const subject = record.englishFields?.Subject || record.englishTitle || fields.Subject || record.title || "General Assembly speech";
      const originalSubject = fields.Subject || record.title || "";
      const current = bySitting.get(key) ?? {
        id: key,
        countryId: "turkey",
        parliament: countryLabels.turkey.parliamentName,
        chamber: "General Assembly",
        date,
        title: `TBMM sitting ${sitting || "record"}: ${subject}`,
        originalTitle: originalSubject,
        sessionType: "General Assembly sitting",
        recordKind: "imported-session",
        sourceLabel: "TBMM",
        sourceType: "official speech/session archive",
        sourceUrl: record.url || json.sourceUrl || "https://www.tbmm.gov.tr/Tutanaklar/TutanakSorgu",
        localHref: "/source/parliament-sessions/index.json",
        localArchiveBacked: true,
        summary: "",
        legislativeYear,
        sitting,
        topicCounts: {},
        speakers: new Set(),
        sourceRows: []
      };
      current.topicCounts[subject] = (current.topicCounts[subject] || 0) + 1;
      if (json.memberName) current.speakers.add(json.memberName);
      if (current.sourceRows.length < 8) {
        current.sourceRows.push({
          memberName: json.memberName || "",
          title: subject,
          originalTitle: originalSubject,
          url: record.url || json.sourceUrl || ""
        });
      }
      bySitting.set(key, current);
    }
  }

  return sortSessionItems([...bySitting.values()].map((item) => {
    const topics = Object.entries(item.topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([title]) => title);
    const speakers = [...item.speakers];
    return {
      ...item,
      speakers: speakers.slice(0, 12),
      speakerCount: speakers.length,
      topics,
      summary:
        `TBMM General Assembly sitting ${item.sitting || "record"} in legislative year ${item.legislativeYear || "not listed"}. ` +
        `TOR Phi grouped ${Object.values(item.topicCounts).reduce((sum, count) => sum + count, 0)} speech rows from ${speakers.length} member${speakers.length === 1 ? "" : "s"}. ` +
        `Main topics: ${topics.join("; ") || "topic metadata pending"}.`
    };
  })).slice(0, maxPerCountry);
}

async function buildFranceSessions() {
  const files = await listJsonFiles(path.join(rootDir, "public", "source", "france-parliament", "members"));
  const byVote = new Map();

  for (const file of files) {
    const json = await readJson(file);
    const member = json.member ?? {};
    const rows = Array.isArray(json.votes?.recent) ? json.votes.recent : [];
    for (const row of rows) {
      const date = normalizeDate(row.date);
      const key = `france-vote-${row.id || row.number || `${date}-${slugify(row.title || row.sourceUrl)}`}`;
      const current = byVote.get(key) ?? {
        id: key,
        countryId: "france",
        parliament: countryLabels.france.parliamentName,
        chamber: "National Assembly",
        date,
        title: `National Assembly vote ${row.number || ""}: ${englishFranceVoteTitle(row)}`,
        originalTitle: row.title || row.object || "",
        sessionType: "Public vote / plenary proceeding",
        recordKind: "imported-session",
        sourceLabel: "Assemblee nationale",
        sourceType: "official public vote archive",
        sourceUrl: row.sourceUrl || "https://www.assemblee-nationale.fr/dyn/17/scrutins",
        localHref: "/source/parliament-sessions/index.json",
        localArchiveBacked: true,
        summary: "",
        vote: {
          number: row.number || "",
          type: row.type || "",
          result: row.result || "",
          counts: row.counts || {},
          positions: {}
        },
        membersSample: []
      };
      if (row.position) current.vote.positions[row.position] = (current.vote.positions[row.position] || 0) + 1;
      if (member.name && current.membersSample.length < 6) {
        current.membersSample.push(`${member.name}: ${row.position || "position not listed"}`);
      }
      byVote.set(key, current);
    }
  }

  return sortSessionItems([...byVote.values()].map((item) => {
    const positions = Object.entries(item.vote.positions)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => `${count} ${label}`)
      .join(", ");
    const counts = item.vote.counts || {};
    return {
      ...item,
      summary:
        `${item.vote.type || "Public vote"}${item.vote.result ? `; result: ${item.vote.result}` : ""}. ` +
        `Official counts: ${counts.for || "?"} for, ${counts.against || "?"} against, ${counts.abstentions || "?"} abstentions. ` +
        `TOR Phi local member positions in this archive: ${positions || "position counts pending"}.`
    };
  })).slice(0, maxPerCountry);
}

async function buildUkSessions() {
  const files = await listJsonFiles(path.join(rootDir, "public", "source", "uk-parliament", "members"));
  const byDivision = new Map();

  for (const file of files) {
    const json = await readJson(file);
    const member = json.member ?? {};
    const rows = Array.isArray(json.records?.votes?.recent) ? json.records.votes.recent : [];
    for (const row of rows) {
      const date = normalizeDate(row.date);
      const key = `uk-commons-division-${row.id || row.number || `${date}-${slugify(row.title || row.sourceUrl)}`}`;
      const current = byDivision.get(key) ?? {
        id: key,
        countryId: "uk",
        parliament: countryLabels.uk.parliamentName,
        chamber: "House of Commons",
        date,
        title: `Commons division ${row.number || ""}: ${row.title || "Division record"}`,
        originalTitle: row.title || "",
        sessionType: "Commons division / floor proceeding",
        recordKind: "imported-session",
        sourceLabel: "UK Parliament Commons Votes",
        sourceType: "official division API",
        sourceUrl: row.sourceUrl || "https://votes.parliament.uk/",
        localHref: "/source/parliament-sessions/index.json",
        localArchiveBacked: true,
        summary: "",
        vote: {
          id: row.id || "",
          number: row.number || "",
          ayeCount: row.ayeCount ?? null,
          noCount: row.noCount ?? null,
          deferred: Boolean(row.deferred),
          positions: {}
        },
        membersSample: []
      };
      if (row.position) current.vote.positions[row.position] = (current.vote.positions[row.position] || 0) + 1;
      if (member.name && current.membersSample.length < 6) {
        current.membersSample.push(`${member.name}: ${row.position || "position not listed"}`);
      }
      byDivision.set(key, current);
    }
  }

  return sortSessionItems([...byDivision.values()].map((item) => {
    const positions = Object.entries(item.vote.positions)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => `${count} ${label}`)
      .join(", ");
    return {
      ...item,
      summary:
        `Commons division ${item.vote.number || item.vote.id || "record"} with official result counts of ${item.vote.ayeCount ?? "?"} Aye and ${item.vote.noCount ?? "?"} No. ` +
        `${item.vote.deferred ? "Marked as deferred. " : ""}` +
        `TOR Phi local member positions in this archive: ${positions || "position counts pending"}.`
    };
  })).slice(0, maxPerCountry);
}

async function buildIranSourceSlots() {
  return [
    {
      id: "iran-majlis-session-api-slot",
      countryId: "iran",
      parliament: countryLabels.iran.parliamentName,
      chamber: "Majlis",
      date: "Watch",
      title: "Majlis session connector slot",
      originalTitle: "",
      sessionType: "Session API watch slot",
      recordKind: "source-slot",
      sourceLabel: "ParlIran / ICANA",
      sourceType: "official portal watch",
      sourceUrl: "https://en.parliran.ir/",
      localHref: "/source/parliament-sessions/index.json",
      summary:
        "The Iran parliament roster is present, but session-level official records are not imported yet. TOR Phi should connect ParlIran, ICANA, and the Majlis Research Center when the source host is reachable, then normalize sittings, speeches, questions, bills, and committee news into this same record shape."
    }
  ];
}

function refineSession(session) {
  const haystack = [
    session.title,
    session.originalTitle,
    session.summary,
    session.sourceLabel,
    session.sessionType,
    ...(session.topics ?? []),
    ...(session.sourceRows ?? []).map((row) => `${row.title} ${row.originalTitle}`)
  ].join(" ");
  const tags = tagPatterns.filter((item) => item.pattern.test(haystack)).map((item) => item.tag);
  const lane = {
    global: true,
    iraq: tags.some((tag) => ["Kurdistan / KRG", "Iraq", "Syria / YPG-SDF", "Security / border", "Energy / trade"].includes(tag)),
    kurdistan: tags.includes("Kurdistan / KRG")
  };
  const priority = lane.kurdistan ? "Kurdistan direct" : lane.iraq ? "Iraq / regional watch" : "Global parliament watch";
  const sourceConfidence = session.recordKind === "source-slot"
    ? "Connector needed"
    : session.liveCheckedAt && session.localArchiveBacked
    ? "Official live source + local archive"
    : session.liveCheckedAt
    ? "Official live source"
    : "Official local archive";

  return {
    ...session,
    tags,
    lane,
    priority,
    sourceConfidence,
    refined: buildRefinedBrief({ ...session, tags, lane, priority, sourceConfidence })
  };
}

function dedupeRawSessions(items) {
  const byId = new Map();
  for (const item of items) {
    if (!item?.id) continue;
    const existing = byId.get(item.id);
    byId.set(item.id, existing ? mergeSessionRecords(existing, item) : item);
  }
  return [...byId.values()];
}

function mergeSessionRecords(existing, incoming) {
  const summary = `${incoming.summary ?? ""}`.length > `${existing.summary ?? ""}`.length
    ? incoming.summary
    : existing.summary;
  return {
    ...existing,
    ...incoming,
    summary,
    localArchiveBacked: Boolean(existing.localArchiveBacked || incoming.localArchiveBacked),
    liveCheckedAt: existing.liveCheckedAt || incoming.liveCheckedAt || "",
    liveSourceUrl: existing.liveSourceUrl || incoming.liveSourceUrl || incoming.sourceUrl || existing.sourceUrl || "",
    vote: mergeObjects(existing.vote, incoming.vote),
    membersSample: unionStrings(existing.membersSample, incoming.membersSample).slice(0, 10),
    speakers: unionStrings(existing.speakers, incoming.speakers).slice(0, 12),
    topics: unionStrings(existing.topics, incoming.topics).slice(0, 8),
    sourceRows: [...(existing.sourceRows ?? []), ...(incoming.sourceRows ?? [])].slice(0, 10)
  };
}

function mergeObjects(left, right) {
  if (!left && !right) return undefined;
  const merged = { ...(left ?? {}), ...(right ?? {}) };
  if (left?.positions || right?.positions) {
    merged.positions = { ...(left?.positions ?? {}), ...(right?.positions ?? {}) };
  }
  if (left?.counts || right?.counts) {
    merged.counts = { ...(left?.counts ?? {}), ...(right?.counts ?? {}) };
  }
  return merged;
}

function unionStrings(left = [], right = []) {
  return [...new Set([...left, ...right].filter(Boolean))];
}

function buildRefinedBrief(session) {
  if (session.recordKind === "source-slot") {
    return {
      oneLine: "API connector slot: no session rows imported yet.",
      whyItMatters: "This source is reserved so future official session rows can enter the daily country brief and parliament page without redesigning the data model.",
      analystUse: "Use this as a collection task, not as evidence of a parliamentary position.",
      nextAction: "Connect the official portal/API, import rows, then rerun npm run import:parliament-sessions.",
      watchTerms: ["Kurdistan", "Iraq", "Erbil", "border", "security", "energy"]
    };
  }

  if (session.lane?.kurdistan) {
    return {
      oneLine: "Direct Kurdistan/KRG language appears in the session/proceeding metadata or transcript-linked rows.",
      whyItMatters:
        "This should be pulled into the country brief because it may reveal how parliament is framing Kurdistan, the KRG, Erbil, Kurdish actors, Peshmerga, Northern Iraq, Sinjar, or related regional files.",
      analystUse:
        "Read the official source and linked member records before scoring tone. Separate direct KRG/Erbil language from broader Kurdish, PKK/YPG, Syria, or security language.",
      nextAction: "Attach transcript excerpts, named speakers, vote positions, and any government response.",
      watchTerms: ["Kurdistan", "KRG", "Erbil", "Peshmerga", "Northern Iraq", "Sinjar", "Yazidi"]
    };
  }

  if (session.lane?.iraq) {
    return {
      oneLine: "Iraq or regional-security relevance is present, but direct KRG language is not confirmed in the metadata.",
      whyItMatters:
        "Iraq-facing records can still shape Kurdistan policy through Baghdad, Mosul, Kirkuk, border security, energy, anti-ISIS policy, sanctions, or Syria/YPG debates.",
      analystUse:
        "Use this as a watch item. It should not be called KRG-friendly or KRG-critical until the speech text, amendment text, vote context, and party line are checked.",
      nextAction: "Check whether the record mentions the Kurdistan Region indirectly through Iraq, Northern Iraq, border operations, energy, or security language.",
      watchTerms: ["Iraq", "Baghdad", "Mosul", "Kirkuk", "ISIS", "border", "energy"]
    };
  }

  return {
    oneLine: "General parliamentary proceeding with no Kurdistan/Iraq trigger in the local metadata.",
    whyItMatters:
      "It still belongs in the daily country home because a complete parliament timeline lets TOR Phi see what the chamber was doing when foreign-policy signals appeared elsewhere.",
    analystUse:
      "Keep it as background unless later transcript text, committee action, media framing, or social posts connect it to Iraq, Kurdistan, Syria, Iran, security, energy, or foreign policy.",
    nextAction: "Enrich with transcript text and committee/government links when available.",
    watchTerms: ["foreign policy", "defense", "security", "Middle East", "Iraq", "Kurdistan"]
  };
}

function englishFranceVoteTitle(row) {
  const source = row.dossier || row.object || row.title || "public vote";
  return source
    .replace(/^l['’]ensemble de la proposition de loi visant à\s+/i, "bill to ")
    .replace(/^l['’]ensemble de la proposition de loi\s+/i, "bill ")
    .replace(/^l['’]ensemble du projet de loi visant à\s+/i, "government bill to ")
    .replace(/\(première lecture\)/gi, "(first reading)")
    .replace(/\(nouvelle lecture\)/gi, "(new reading)")
    .replace(/\s+/g, " ")
    .trim();
}

function sortSessionItems(items) {
  return items.sort((a, b) => {
    const dateCompare = timestampForSort(b.date) - timestampForSort(a.date);
    if (dateCompare) return dateCompare;
    return `${a.title}`.localeCompare(`${b.title}`);
  });
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

async function listJsonFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.filter((file) => file.endsWith(".json")).map((file) => path.join(dir, file));
  } catch {
    return [];
  }
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "TORPhi/1.0 parliament-session-refresh"
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": "TORPhi/1.0 parliament-session-refresh"
      }
    });
    return {
      ok: response.ok,
      status: response.status,
      body: response.ok ? await response.text() : ""
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: "",
      error: error.message
    };
  }
}

function normalizeDate(value, mode = "default") {
  if (!value) return "";
  const text = `${value}`.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const dot = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dot) return `${dot[3]}-${dot[2].padStart(2, "0")}-${dot[1].padStart(2, "0")}`;
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const month = mode === "us" ? slash[1] : slash[2];
    const day = mode === "us" ? slash[2] : slash[1];
    return `${slash[3]}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : text;
}

function timestampForSort(value) {
  const timestamp = Date.parse(normalizeDate(value));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function slugify(value) {
  return `${value ?? ""}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "record";
}

function cleanText(value) {
  return decodeHtml(stripTags(`${value ?? ""}`))
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return `${value ?? ""}`.replace(/<[^>]+>/g, " ");
}

function decodeHtml(value) {
  return `${value ?? ""}`
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}
