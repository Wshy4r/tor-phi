import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { turkishParliamentMembers } from "../src/turkishParliament.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputFile = path.join(projectRoot, "public/source/tbmm-kurdistan-briefs.json");

const kurdistanLensTerms = [
  { label: "Kurdistan", patterns: ["kurdistan", "kürdistan", "kurdish", "kürt"] },
  { label: "KRG / IKBY", patterns: ["krg", "ikby", "kürdistan bölgesel yönetimi", "kurdistan regional government"] },
  { label: "Erbil", patterns: ["erbil", "hewler", "hawler"] },
  { label: "Northern Iraq", patterns: ["northern iraq", "north iraq", "north of iraq", "kuzey irak", "kuzey ırak"] },
  { label: "Iraq", patterns: ["iraq", "irak", "baghdad", "bağdat", "mosul", "musul", "kirkuk", "kerkük"] },
  { label: "Syria", patterns: ["syria", "suriye", "rojava"] },
  { label: "PKK", patterns: ["pkk", "p.k.k"] },
  { label: "YPG / SDF", patterns: ["ypg", "sdf", "sdg", "suriye demokratik güçleri"] },
  { label: "Peshmerga", patterns: ["peshmerga", "peşmerge"] },
  { label: "Yazidi / Sinjar", patterns: ["yazidi", "yezidi", "ezidi", "yezidî", "sinjar", "şengal", "sincar"] },
  { label: "Border / Security", patterns: ["border", "sınır", "security", "güvenlik", "terror", "terör", "operation", "operasyon"] },
  { label: "Oil / Energy", patterns: ["oil", "petrol", "energy", "enerji", "pipeline", "boru hattı"] }
];

const directTerms = ["Kurdistan", "KRG / IKBY", "Northern Iraq", "Erbil", "Peshmerga"];
const iraqTerms = ["Iraq", "Northern Iraq", "KRG / IKBY", "Erbil", "Peshmerga"];
const securityTerms = ["PKK", "YPG / SDF", "Border / Security"];
const syriaTerms = ["Syria", "YPG / SDF"];
const energyTerms = ["Oil / Energy"];
const minorityTerms = ["Yazidi / Sinjar"];
const constructivePatterns = [
  "cooperation", "dialogue", "relations", "trade", "partnership", "support", "peace", "solution",
  "federal", "autonomy", "rights", "democracy", "democratic", "stability", "humanitarian",
  "iş birliği", "barış", "çözüm", "insan hakları", "demokrasi", "istikrar"
];
const securityPatterns = [
  "terror", "terrorist", "counterterror", "operation", "threat", "separatist", "security",
  "border", "terör", "operasyon", "tehdit", "bölücü", "güvenlik", "sınır"
];
const rightsPatterns = [
  "kurdish people", "kurdish language", "mother tongue", "identity", "rights", "equality",
  "oppression", "democracy", "peace process", "kürt halk", "kürtçe", "ana dil", "kimlik", "eşitlik"
];
const negativePatterns = [
  "so-called", "separatist", "terror corridor", "puppet", "illegal", "bölücü", "sözde", "terör koridoru"
];

const partyNames = {
  "BAĞIMSIZ": "Independent",
  "AK Parti": "AK Party",
  "DEM PARTİ": "DEM Party",
  "İYİ Parti": "Good Party",
  "YENİ YOL": "New Path",
  "HÜDA PAR": "Huda Par",
  "DEVA": "DEVA Party",
  "TİP": "Workers' Party of Turkey",
  "EMEP": "Labor Party"
};

const committeeNames = [
  ["Dışişleri", "Foreign Affairs Committee"],
  ["Milli Savunma", "National Defense Committee"],
  ["Güvenlik Ve İstihbarat", "Security and Intelligence Committee"],
  ["İçişleri", "Interior Committee"],
  ["İnsan Hak", "Human Rights Inquiry Committee"],
  ["Adalet", "Justice Committee"],
  ["Anayasa", "Constitution Committee"],
  ["Plan Ve Bütçe", "Planning and Budget Committee"],
  ["Sanayi, Ticaret, Enerji", "Industry, Trade, Energy, Natural Resources, Information and Technology Committee"]
];

function normalizeSearchText(value) {
  return `${value ?? ""}`.toLowerCase().replace(/ü/g, "u").replace(/[^a-z0-9]+/g, " ").trim();
}

function compactText(value, limit = 320) {
  const text = `${value ?? ""}`.replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).replace(/\s+\S*$/, "").trim()}...`;
}

function getMatches(text) {
  const normalized = normalizeSearchText(text);
  return kurdistanLensTerms
    .filter((term) => term.patterns.some((pattern) => normalized.includes(normalizeSearchText(pattern))))
    .map((term) => term.label);
}

function makeSnippet(text, matchedTerms) {
  const normalized = normalizeSearchText(text);
  const pattern = kurdistanLensTerms
    .filter((term) => matchedTerms.includes(term.label))
    .flatMap((term) => term.patterns)
    .find((item) => normalized.includes(normalizeSearchText(item)));

  if (!pattern) return compactText(text, 360);

  const index = normalized.indexOf(normalizeSearchText(pattern));
  const start = Math.max(0, index - 180);
  const end = Math.min(`${text ?? ""}`.length, index + 260);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < `${text ?? ""}`.length ? "..." : "";
  return `${prefix}${`${text ?? ""}`.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`;
}

function getSpeechTitle(record) {
  return record.englishTitle || record.title || "Untitled speech";
}

function getRecordTitle(record) {
  const labels = [
    "Kanun Teklifi Başlığı ve Özeti",
    "Önergenin Başlığı ve Özeti",
    "Önergenin Özeti",
    "Subject"
  ];
  const label = labels.find((item) => record.englishFields?.[item] || record.fields?.[item]);
  return record.englishTitle
    || (label ? record.englishFields?.[label] || record.fields?.[label] : "")
    || record.title
    || "Untitled record";
}

function getActivityDate(record) {
  return record.date
    || record.fields?.Tarihi
    || record.fields?.["Submitted to Speaker"]
    || record.fields?.["Birleşim Tarihi"]
    || record.fields?.Date
    || record.metadata?.Tarih
    || "";
}

function getRecordReference(record) {
  return record.fields?.["Taksim/ Esas No"]
    || record.fields?.["Taksim/Esas No"]
    || (/^[\d/.-]+$/.test(record.title || "") ? record.title : "");
}

function extractYear(value) {
  return `${value ?? ""}`.match(/\b(19|20)\d{2}\b/)?.[0] ?? "";
}

function sortableYear(value) {
  return Number(extractYear(value) || "2100");
}

function isPrimaryEvidence(record) {
  const source = record.sourceLabel || "";
  return record.kind === "speech" || /written questions submitted|first signatory/i.test(source);
}

function isSharedEvidence(record) {
  const source = record.sourceLabel || "";
  return !isPrimaryEvidence(record) && /signed/i.test(source);
}

function hasTextPattern(record, patterns) {
  const haystack = normalizeSearchText([
    record.title,
    record.summary,
    record.analysisText,
    record.snippet,
    record.sourceLabel
  ].join(" "));
  return patterns.some((pattern) => haystack.includes(normalizeSearchText(pattern)));
}

function countTerms(records, terms) {
  return records.filter((record) => terms.some((term) => record.matchedTerms.includes(term))).length;
}

function countPatterns(records, patterns) {
  return records.filter((record) => hasTextPattern(record, patterns)).length;
}

function scoreAnchor(record, terms) {
  const termScore = terms.reduce((score, term) => score + (record.matchedTerms.includes(term) ? 3 : 0), 0);
  const basisScore = isPrimaryEvidence(record) ? 20 : 0;
  const speechScore = record.kind === "speech" ? 6 : 0;
  const detailScore = (record.snippet || record.summary || "").length > 120 ? 4 : 0;
  return basisScore + speechScore + detailScore + termScore + (sortableYear(record.date) / 1000);
}

function findAnchor(records, terms, ...exclude) {
  const excluded = new Set(exclude.filter(Boolean));
  return [...records]
    .filter((record) => !excluded.has(record) && terms.some((term) => record.matchedTerms.includes(term)))
    .sort((a, b) => scoreAnchor(b, terms) - scoreAnchor(a, terms))[0];
}

function findTextAnchor(records, patterns, ...exclude) {
  const excluded = new Set(exclude.filter(Boolean));
  return [...records]
    .filter((record) => !excluded.has(record) && hasTextPattern(record, patterns))
    .sort((a, b) => scoreAnchor(b, []) - scoreAnchor(a, []))[0];
}

function evidenceKey(item) {
  return [item?.kind, item?.activityType, item?.recordIndex, item?.title, item?.date].join("|");
}

function makeEvidence(item, role) {
  if (!item) return null;
  return {
    role,
    kind: item.kind,
    activityType: item.activityType,
    recordIndex: item.recordIndex,
    sourceLabel: item.sourceLabel,
    title: item.title,
    date: item.date,
    reference: item.reference,
    snippet: compactText(item.snippet || item.summary, 360),
    matchedTerms: item.matchedTerms ?? []
  };
}

function uniqueEvidence(items) {
  const seen = new Set();
  return items.filter(Boolean).filter((item) => {
    const key = evidenceKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function refsFor(citationSources, ...items) {
  const refs = items.map((item) => {
    const evidence = makeEvidence(item, "");
    if (!evidence) return null;
    return citationSources.find((source) => evidenceKey(source) === evidenceKey(evidence))?.number ?? null;
  }).filter(Boolean);
  return [...new Set(refs)];
}

function formatTerms(terms = []) {
  return terms.slice(0, 4).join(", ") || "matched";
}

function partyName(party) {
  return partyNames[party] || party || "Unknown party";
}

function committeeContext(member) {
  const translated = (member.committees || [])
    .map((committee) => committeeNames.find(([needle]) => committee.includes(needle))?.[1])
    .filter(Boolean);
  return [...new Set(translated)].slice(0, 2);
}

function sourceSplit(records) {
  const counts = new Map();
  records.forEach((record) => {
    const label = record.kind === "speech" ? "Speeches" : simplifySource(record.sourceLabel);
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function simplifySource(label) {
  if (/question/i.test(label)) return "Written questions";
  if (/bill/i.test(label)) return "Bills";
  if (/inquiry/i.test(label)) return "Inquiry motions";
  if (/debate/i.test(label)) return "Debate motions";
  if (/investigation/i.test(label)) return "Investigation motions";
  return label || "Other records";
}

function describeFrame(metrics) {
  if (metrics.directCount === 0 && (metrics.iraqCount > 0 || metrics.syriaCount > 0)) return "indirect Iraq/Syria policy";
  if (metrics.securityFrameCount >= Math.max(1, metrics.constructiveCount, metrics.rightsCount)) return "security, PKK/YPG, border, and counterterrorism";
  if (metrics.rightsCount > metrics.securityFrameCount && metrics.rightsCount >= metrics.constructiveCount) return "Kurdish rights, identity, and democratic recognition";
  if (metrics.energyCount > 0 && metrics.energyCount >= metrics.constructiveCount) return "energy, pipelines, trade, or economic leverage";
  if (metrics.minorityCount > 0) return "humanitarian or minority protection";
  if (metrics.constructiveCount > 0) return "cooperation, dialogue, rights, or regional stability";
  if (metrics.directCount > 0) return "direct but mixed Kurdistan/Northern Iraq relevance";
  return "regional adjacency";
}

function assessPosture(member, metrics) {
  const party = partyName(member.party);
  if (metrics.total === 0) {
    return { posture: "No local source basis", friendliness: "Unrated", confidence: "None" };
  }

  let posture = "No clear Kurdistan posture";
  let friendliness = "Unclear";

  if (metrics.directCount > 0 && metrics.securityFrameCount >= Math.max(4, metrics.constructiveCount * 1.25, metrics.rightsCount * 1.25)) {
    posture = "Critical / securitized toward Kurdish-region issues";
    friendliness = "Low";
  } else if (metrics.negativeCount > 0 && metrics.securityFrameCount >= metrics.constructiveCount) {
    posture = "Critical / securitized toward Kurdish-region issues";
    friendliness = "Low";
  } else if (metrics.directCount > 0 && metrics.constructiveCount >= metrics.securityFrameCount && metrics.constructiveCount > 0) {
    posture = "Constructive or pragmatic toward KRG/Kurdistan";
    friendliness = "Medium to high";
  } else if (metrics.rightsCount > metrics.securityFrameCount && metrics.rightsCount > 0) {
    posture = "Kurdish-rights oriented, KRG stance indirect";
    friendliness = "Medium, but not necessarily KRG-specific";
  } else if (metrics.securityFrameCount > metrics.directCount || metrics.securityFrameCount > metrics.constructiveCount) {
    posture = "Security-first / threat-focused";
    friendliness = "Low to unclear";
  } else if (metrics.energyCount > 0 && metrics.directCount > 0) {
    posture = "Transactional / economic-interest focused";
    friendliness = "Pragmatic, not ideological";
  } else if (metrics.directCount > 0) {
    posture = "Directly Kurdistan-facing, stance mixed or unclear";
    friendliness = "Unclear to medium";
  } else if (metrics.iraqCount > 0 || metrics.syriaCount > 0) {
    posture = "Kurdistan-adjacent through Iraq/Syria";
    friendliness = "Unclear";
  }

  if (party === "DEM Party" && metrics.rightsCount > 0 && metrics.securityFrameCount <= metrics.rightsCount * 1.5) {
    posture = "Kurdish-rights oriented, KRG stance indirect";
    friendliness = metrics.directCount > 0 ? "Medium" : "Medium, but not necessarily KRG-specific";
  }

  if (["MHP", "Good Party"].includes(party) && metrics.securityFrameCount > 0 && metrics.constructiveCount === 0) {
    posture = "National-security first toward Kurdish-region issues";
    friendliness = "Low to unclear";
  }

  const confidence = metrics.primaryCount === 0 ? "Low"
    : metrics.evidenceCount >= 15 && metrics.directCount > 0 ? "Medium-high"
      : metrics.evidenceCount >= 6 ? "Medium"
        : "Low";

  return { posture, friendliness, confidence };
}

function postureForSentence(posture) {
  const map = {
    "No local source basis": "having no local source basis",
    "Critical / securitized toward Kurdish-region issues": "critical / securitized toward Kurdish-region issues",
    "Constructive or pragmatic toward KRG/Kurdistan": "constructive or pragmatic toward KRG/Kurdistan",
    "Kurdish-rights oriented, KRG stance indirect": "Kurdish-rights oriented, with an indirect KRG stance",
    "National-security first toward Kurdish-region issues": "national-security first toward Kurdish-region issues",
    "Security-first / threat-focused": "security-first / threat-focused",
    "Transactional / economic-interest focused": "transactional / economic-interest focused",
    "Directly Kurdistan-facing, stance mixed or unclear": "directly Kurdistan-facing, with a mixed or unclear stance",
    "Kurdistan-adjacent through Iraq/Syria": "Kurdistan-adjacent through Iraq/Syria",
    "No clear Kurdistan posture": "unclear on Kurdistan"
  };
  return map[posture] || posture;
}

function sourceName(anchor) {
  if (!anchor) return "the imported archive";
  const date = anchor.date ? `${anchor.date} ` : "";
  const title = cleanSourceTitle(anchor.title);
  return title ? `${date}${anchor.sourceLabel}: ${title}` : `${date}${anchor.sourceLabel}`.trim();
}

function cleanSourceTitle(title = "") {
  return `${title ?? ""}`
    .replace(/\s+/g, " ")
    .replace(/^Minute Text$/i, "committee minutes")
    .trim();
}

function sourceTopic(anchor) {
  const text = normalizeSearchText([anchor?.title, anchor?.snippet, anchor?.summary, anchor?.sourceLabel].join(" "));
  if (!anchor) return "the archive";
  if (text.includes("dem party")) return "DEM Party proposal debates";
  if (text.includes("pkk") || text.includes("ypg") || text.includes("sdf") || text.includes("terror")) return "PKK/YPG and counterterrorism debates";
  if (text.includes("northern iraq") || text.includes("kuzey irak") || text.includes("iraq") || text.includes("irak")) return "the Iraq/Northern Iraq file";
  if (text.includes("oil") || text.includes("petrol") || text.includes("pipeline") || text.includes("energy")) return "oil, energy, or pipeline issues";
  if (text.includes("yazidi") || text.includes("sinjar") || text.includes("yezidi") || text.includes("sincar")) return "Yazidi/Sinjar and minority-protection issues";
  if (text.includes("budget") || text.includes("bütçe")) return "budget and executive-accountability debate";
  if (anchor.kind === "speech") return `${anchor.sourceLabel.toLowerCase()} rhetoric`;
  return `${anchor.sourceLabel.toLowerCase()} activity`;
}

function evidenceMode({ speechCount, recordCount, sourceMode }) {
  if (speechCount >= recordCount * 3 && speechCount >= 5) return sourceMode === "Speeches" ? "speech-led" : `speech-led, with ${sourceMode.toLowerCase()} also visible`;
  if (recordCount > speechCount) return `record-led, especially ${sourceMode.toLowerCase()}`;
  return `mixed between speeches and formal records, with ${sourceMode.toLowerCase()} slightly ahead`;
}

function contrastCounts(primary, secondary, primaryLabel, secondaryLabel) {
  return `${primary.toLocaleString()} ${primaryLabel} against ${secondary.toLocaleString()} ${secondaryLabel}`;
}

function postureReason({ posture, friendliness, dominantFrame, metrics, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor }) {
  const constructiveTotal = metrics.constructiveCount + metrics.rightsCount;
  if (/Critical|security|threat|National-security/i.test(posture)) {
    return `Posture driver: ${contrastCounts(metrics.securityFrameCount, metrics.directCount, "security-frame hits", "direct Kurdistan/Northern Iraq hits")}. That imbalance keeps the friendliness score at ${friendliness.toLowerCase()}, with ${sourceName(securityAnchor)} as the clearest security source.`;
  }
  if (/Constructive|pragmatic/i.test(posture)) {
    return `Posture driver: constructive, rights, cooperation, or stability language is not incidental; ${constructiveTotal.toLocaleString()} constructive/rights hits sit alongside ${metrics.directCount.toLocaleString()} direct Kurdistan/Northern Iraq hits, lifting the friendliness score to ${friendliness.toLowerCase()}.`;
  }
  if (/rights/i.test(posture)) {
    return `The profile is rights-led more than KRG-institution-led: ${metrics.rightsCount.toLocaleString()} rights/identity hits outweigh the direct KRG signal, and the best source is ${sourceName(rightsAnchor || constructiveAnchor)}.`;
  }
  if (/Transactional|economic/i.test(posture)) {
    return `The practical layer is economic: ${metrics.energyCount.toLocaleString()} oil, energy, pipeline, or trade hits keep the file in a transactional lane rather than an identity-only lane.`;
  }
  if (directAnchor) {
    return `The direct source makes the member relevant to Kurdistan monitoring, but the dominant frame is still ${dominantFrame}, so the friendliness score stays cautious.`;
  }
  return `The profile stays indirect because the archive reaches Kurdistan through neighboring Iraq/Syria, security, energy, or minority files rather than direct KRG language.`;
}

function buildAnalystPoints({
  member,
  party,
  committees,
  posture,
  friendliness,
  confidence,
  dominantFrame,
  metrics,
  directAnchor,
  securityAnchor,
  constructiveAnchor,
  rightsAnchor,
  iraqAnchor,
  energyAnchor,
  minorityAnchor,
  negativeAnchor,
  recentAnchor,
  sourceMode,
  speechCount,
  recordCount,
  sharedRecords,
  sourceBaseLabel,
  cite
}) {
  const committeeText = committees.length > 0
    ? ` His committee exposure (${committees.join(" and ")}) matters because it gives him a formal lane into the legal, security, rights, budget, or foreign-policy side of the file.`
    : "";
  const directTermsText = directAnchor ? `direct terms: ${formatTerms(directAnchor.matchedTerms)}` : "no direct KRG/Kurdistan terms";
  const pressureTermsText = securityAnchor ? `pressure terms: ${formatTerms(securityAnchor.matchedTerms)}` : "no dominant security terms";
  const strongestPair = directAnchor && securityAnchor
    ? `The lead direct source is ${sourceName(directAnchor)} (${directTermsText}); the lead pressure source is ${sourceName(securityAnchor)} (${pressureTermsText}).`
    : directAnchor
      ? `The strongest source is ${sourceName(directAnchor)} (${directTermsText}), which puts the Kurdistan/Northern Iraq file directly on the page.`
      : securityAnchor
        ? `The strongest source is ${sourceName(securityAnchor)} (${pressureTermsText}), so the profile enters the Kurdistan Lens through ${sourceTopic(securityAnchor)} rather than through an Erbil-facing relationship.`
        : `The strongest available evidence comes from ${sourceMode.toLowerCase()}, but it does not give a clean KRG-facing source.`;
  const opening = `${member.name}'s Kurdistan Lens profile is ${evidenceMode({ speechCount, recordCount, sourceMode })}. ${strongestPair} The evidence base is ${sourceBaseLabel}, giving ${confidence.toLowerCase()} confidence in a ${friendliness.toLowerCase()} KRG-friendliness score.${committeeText}`;

  const directPoint = directAnchor
    ? `Direct signal: ${metrics.directCount.toLocaleString()} individual-basis hits name Kurdistan, KRG/IKBY, Northern Iraq, Erbil, or Peshmerga. The best example is tied to ${sourceTopic(directAnchor)}, so the database should mark the member as KRG-relevant; the source itself does not establish a cooperative Erbil relationship.`
    : `Direct signal: weak. No strong individual-basis source names KRG, Kurdistan, Northern Iraq, Erbil, or Peshmerga, so the assessment has to run through adjacent Iraq/Syria, security, energy, or minority files.`;

  const posturePoint = postureReason({ posture, friendliness, dominantFrame, metrics, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor });
  const nuanceAnchor = energyAnchor || minorityAnchor || constructiveAnchor || rightsAnchor || iraqAnchor;
  const nuancePoint = nuanceAnchor
    ? `The nuance is ${sourceTopic(nuanceAnchor)}. That source prevents the profile from being read only through the headline posture: it shows whether the member's Kurdistan relevance is practical, humanitarian, rights-based, Iraqi-federal, or simply security-adjacent.`
    : `There is little nuance in the imported matches: no separate energy, minority, constructive-rights, or Iraq-federal source stands out strongly enough to soften the headline posture.`;
  const sharedText = sharedRecords.length > 0
    ? ` The brief discounts ${sharedRecords.length.toLocaleString()} co-signed/shared hits because those same texts can appear under other deputies.`
    : "";
  const evidenceSignal = speechCount >= recordCount
    ? "public parliamentary language rather than private diplomacy"
    : "formal parliamentary activity rather than personal rhetoric alone";
  const handlingPoint = `Handling note: use this as a TBMM-record assessment, not a complete personality profile. The individual evidence base is ${speechCount.toLocaleString()} speech hit${speechCount === 1 ? "" : "s"} and ${recordCount.toLocaleString()} non-speech parliamentary hit${recordCount === 1 ? "" : "s"}, so the strongest signal is ${evidenceSignal}.${sharedText}`;

  return [
    { text: opening, refs: cite(directAnchor, securityAnchor, constructiveAnchor || rightsAnchor) },
    { text: directPoint, refs: cite(directAnchor, iraqAnchor) },
    { text: posturePoint, refs: cite(securityAnchor || constructiveAnchor || rightsAnchor || directAnchor, negativeAnchor) },
    { text: nuancePoint, refs: cite(nuanceAnchor) },
    { text: handlingPoint, refs: cite(recentAnchor, directAnchor, securityAnchor) }
  ];
}

function buildLensRecords(member) {
  return (member.parliamentaryActivity || []).flatMap((activity) => {
    if (!activity.file || activity.count <= 0) return [];
    const filePath = path.join(projectRoot, "public", activity.file);
    return { activity, filePath };
  });
}

async function readLensRecords(member) {
  const groups = buildLensRecords(member);

  const chunks = await Promise.all(groups.map(async (group) => {
    let data;
    try {
      data = JSON.parse(await fs.readFile(group.filePath, "utf8"));
    } catch {
      return [];
    }

    const items = [];
    const isSpeech = ["General Assembly speeches", "Committee speeches"].includes(group.activity.label);
    (data.records || []).forEach((record, recordIndex) => {
      const title = isSpeech ? getSpeechTitle(record) : getRecordTitle(record);
      const turkishTitle = record.title || title;
      const searchableText = [
        title,
        isSpeech ? record.englishTranslation : getRecordTitle(record),
        turkishTitle,
        isSpeech ? record.originalTurkish : record.title,
        ...Object.values(record.fields ?? {}),
        ...Object.values(record.englishFields ?? {})
      ].filter(Boolean).join("\n\n");
      const matchedTerms = getMatches(searchableText);
      if (matchedTerms.length === 0) return;

      items.push({
        kind: isSpeech ? "speech" : "record",
        activityType: group.activity.type,
        recordIndex,
        sourceLabel: group.activity.label,
        title,
        summary: isSpeech ? (record.englishTranslation || title) : getRecordTitle(record),
        analysisText: searchableText,
        snippet: makeSnippet(searchableText, matchedTerms),
        matchedTerms,
        date: getActivityDate(record),
        reference: isSpeech ? record.section || "" : getRecordReference(record),
        url: record.url
      });
    });

    return items;
  }));

  const all = chunks.flat();
  return all.sort((a, b) => sortableYear(b.date) - sortableYear(a.date));
}

function buildNoEvidenceBrief(member) {
  const party = partyName(member.party);
  const committees = committeeContext(member);
  const roleContext = committees.length > 0 ? ` Their institutional exposure is ${committees.join(" and ")}.` : "";
  const text = `${member.name} (${party}, ${member.province}) has no imported local TBMM hit for Kurdistan, KRG/IKBY, Northern Iraq, Erbil, Peshmerga, Iraq/Syria, PKK/YPG, border/security, oil, or Yazidi/Sinjar terms.${roleContext} The responsible reading is to leave the KRG posture unscored until the archive contains direct speeches, questions, motions, committee text, or public statements.`;
  return {
    memberId: member.id,
    memberName: member.name,
    generatedAt: new Date().toISOString(),
    posture: "No local source basis",
    friendliness: "Unrated",
    confidence: "None",
    points: [{ text, refs: [] }],
    paragraphs: [text],
    citationSources: [],
    anchors: [],
    factors: [
      {
        title: "KRG friendliness reading",
        count: 0,
        reading: "No evidence-backed friendliness score should be assigned from the imported TBMM archive.",
        refs: []
      }
    ],
    caution: "No-source profiles are intentionally conservative. Add source material before using this person in a briefing."
  };
}

function buildBrief(member, records) {
  if (records.length === 0) return buildNoEvidenceBrief(member);

  const primaryRecords = records.filter(isPrimaryEvidence);
  const sharedRecords = records.filter(isSharedEvidence);
  const evidenceBase = primaryRecords.length > 0 ? primaryRecords : records;
  const split = sourceSplit(evidenceBase);
  const directAnchor = findAnchor(evidenceBase, directTerms) || findAnchor(records, directTerms);
  const securityAnchor = findAnchor(evidenceBase, securityTerms, directAnchor)
    || findTextAnchor(evidenceBase, securityPatterns, directAnchor)
    || findAnchor(records, securityTerms, directAnchor)
    || findTextAnchor(records, securityPatterns, directAnchor);
  const constructiveAnchor = findTextAnchor(evidenceBase, constructivePatterns, directAnchor, securityAnchor)
    || findTextAnchor(records, constructivePatterns, directAnchor, securityAnchor);
  const rightsAnchor = findTextAnchor(evidenceBase, rightsPatterns, directAnchor, securityAnchor, constructiveAnchor)
    || findTextAnchor(records, rightsPatterns, directAnchor, securityAnchor, constructiveAnchor);
  const negativeAnchor = findTextAnchor(evidenceBase, negativePatterns, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor)
    || findTextAnchor(records, negativePatterns, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor);
  const iraqAnchor = findAnchor(evidenceBase, iraqTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor)
    || findAnchor(records, iraqTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor);
  const energyAnchor = findAnchor(evidenceBase, energyTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor, iraqAnchor)
    || findAnchor(records, energyTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor, iraqAnchor);
  const minorityAnchor = findAnchor(evidenceBase, minorityTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor, iraqAnchor, energyAnchor)
    || findAnchor(records, minorityTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor, iraqAnchor, energyAnchor);
  const recentAnchor = evidenceBase.find((record) => ![directAnchor, securityAnchor, constructiveAnchor, rightsAnchor, iraqAnchor, energyAnchor, minorityAnchor].includes(record));

  const metrics = {
    total: records.length,
    evidenceCount: evidenceBase.length,
    primaryCount: primaryRecords.length,
    sharedCount: sharedRecords.length,
    directCount: countTerms(evidenceBase, directTerms),
    allDirectCount: countTerms(records, directTerms),
    securityCount: countTerms(evidenceBase, securityTerms),
    allSecurityCount: countTerms(records, securityTerms),
    iraqCount: countTerms(evidenceBase, iraqTerms),
    syriaCount: countTerms(evidenceBase, syriaTerms),
    energyCount: countTerms(evidenceBase, energyTerms),
    minorityCount: countTerms(evidenceBase, minorityTerms),
    constructiveCount: countPatterns(evidenceBase, constructivePatterns),
    rightsCount: countPatterns(evidenceBase, rightsPatterns),
    negativeCount: countPatterns(evidenceBase, negativePatterns)
  };
  metrics.securityFrameCount = Math.max(metrics.securityCount, countPatterns(evidenceBase, securityPatterns));
  metrics.allSecurityFrameCount = Math.max(metrics.allSecurityCount, countPatterns(records, securityPatterns));

  const { posture, friendliness, confidence } = assessPosture(member, metrics);
  const dominantFrame = describeFrame(metrics);
  const party = partyName(member.party);
  const committees = committeeContext(member);
  const sourceBaseLabel = primaryRecords.length > 0
    ? `${primaryRecords.length.toLocaleString()} personal speeches, written questions, or lead-signatory records`
    : `${records.length.toLocaleString()} shared or co-signed records`;
  const sourceMode = split[0]?.label || "local TBMM records";
  const speechCount = evidenceBase.filter((record) => record.kind === "speech").length;
  const recordCount = evidenceBase.length - speechCount;
  const citationSources = uniqueEvidence([
    makeEvidence(directAnchor, "Direct Kurdistan source"),
    makeEvidence(securityAnchor, "Security-frame source"),
    makeEvidence(constructiveAnchor || rightsAnchor, "Constructive or rights source"),
    makeEvidence(negativeAnchor, "Critical-language source"),
    makeEvidence(iraqAnchor, "Iraq/Northern Iraq source"),
    makeEvidence(energyAnchor, "Economic source"),
    makeEvidence(minorityAnchor, "Humanitarian source"),
    makeEvidence(recentAnchor, "Recent source")
  ]).slice(0, 8).map((item, index) => ({ ...item, number: index + 1 }));
  const cite = (...items) => refsFor(citationSources, ...items);
  const points = buildAnalystPoints({
    member,
    party,
    committees,
    posture,
    friendliness,
    confidence,
    dominantFrame,
    metrics,
    directAnchor,
    securityAnchor,
    constructiveAnchor,
    rightsAnchor,
    iraqAnchor,
    energyAnchor,
    minorityAnchor,
    negativeAnchor,
    recentAnchor,
    sourceMode,
    speechCount,
    recordCount,
    sharedRecords,
    sourceBaseLabel,
    cite
  });

  return {
    memberId: member.id,
    memberName: member.name,
    generatedAt: new Date().toISOString(),
    posture,
    friendliness,
    confidence,
    metrics,
    points,
    paragraphs: points.map((point) => point.text),
    citationSources,
    anchors: citationSources,
    factors: [
      {
        title: "Bottom line for KRG",
        count: metrics.directCount,
        reading: `${friendliness} KRG-friendliness. The controlling frame is ${dominantFrame}; strongest evidence is ${sourceName(directAnchor || securityAnchor || constructiveAnchor || rightsAnchor)}.`,
        refs: cite(directAnchor, securityAnchor, constructiveAnchor || rightsAnchor)
      },
      {
        title: "How they name the file",
        count: metrics.directCount,
        reading: directAnchor
          ? `Directly relevant: matched ${formatTerms(directAnchor.matchedTerms)}. Keep the member in Kurdistan/KRG monitoring.`
          : "Indirect only: watch Iraq, Syria, security, energy, or minority references before assigning a direct KRG position.",
        refs: cite(directAnchor, iraqAnchor)
      },
      {
        title: "Security pressure",
        count: metrics.securityFrameCount,
        reading: securityAnchor
          ? `Security language is a major driver, especially ${formatTerms(securityAnchor.matchedTerms)}. This lowers the friendliness reading unless balanced by rights or cooperation sources.`
          : "No strong security citation appears in the individual evidence base.",
        refs: cite(securityAnchor, negativeAnchor)
      },
      {
        title: "Constructive opening",
        count: metrics.constructiveCount + metrics.rightsCount,
        reading: constructiveAnchor || rightsAnchor
          ? "There is a constructive or rights-based opening, but it should be read beside the security evidence before calling the member KRG-friendly."
          : "No clear cooperation, rights, humanitarian, dialogue, trade, or stability signal appears in the stronger individual basis.",
        refs: cite(constructiveAnchor, rightsAnchor, securityAnchor)
      },
      {
        title: "Economic / humanitarian angle",
        count: metrics.energyCount + metrics.minorityCount,
        reading: energyAnchor || minorityAnchor
          ? "Energy, economic, Yazidi/Sinjar, or humanitarian language gives the profile a practical or humanitarian layer beyond pure security."
          : "No distinct oil, pipeline, trade, Yazidi/Sinjar, or minority-protection citation appears in the stronger individual basis.",
        refs: cite(energyAnchor, minorityAnchor)
      },
      {
        title: "Evidence quality",
        count: metrics.evidenceCount,
        reading: `Confidence is ${confidence.toLowerCase()}; ${sourceMode.toLowerCase()} dominates, and shared records are secondary.`,
        refs: cite(recentAnchor, directAnchor, securityAnchor)
      }
    ],
    caution:
      "This is a person-specific parliamentary brief generated from the imported TBMM archive. It should still be checked against party line, public interviews, government office, committee role, and non-TBMM sources before use in a formal diplomatic memo."
  };
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
      completed += 1;
      if (completed % 25 === 0 || completed === items.length) {
        console.log(`Processed ${completed}/${items.length} members`);
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

const briefs = {};
let withEvidence = 0;

const rows = await mapLimit(turkishParliamentMembers, 10, async (member) => {
  const records = await readLensRecords(member);
  return {
    id: member.id,
    hasEvidence: records.length > 0,
    brief: buildBrief(member, records)
  };
});

rows.forEach((row) => {
  if (row.hasEvidence) withEvidence += 1;
  briefs[row.id] = row.brief;
});

const payload = {
  generatedAt: new Date().toISOString(),
  memberCount: turkishParliamentMembers.length,
  membersWithEvidence: withEvidence,
  method:
    "Person-specific Kurdistan Lens briefs generated from imported TBMM speeches, written questions, bills, motions, and translated metadata. Personal speeches, written questions, and first-signatory records are weighted before co-signed/shared records.",
  briefs
};

await fs.writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${Object.keys(briefs).length} TBMM Kurdistan briefs to ${path.relative(projectRoot, outputFile)} (${withEvidence} with evidence).`);
