import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DEPUTIES_ZIP_URL = "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_mandats_actifs_organes/AMO10_deputes_actifs_mandats_actifs_organes.json.zip";
const VOTES_ZIP_URL = "https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip";
const DEPUTIES_PAGE_URL = "https://data.assemblee-nationale.fr/acteurs/deputes-en-exercice";
const VOTES_PAGE_URL = "https://data.assemblee-nationale.fr/travaux-parlementaires/votes";
const OFFICIAL_PROFILE_BASE = "https://www.assemblee-nationale.fr/dyn/deputes";
const PHOTO_BASE = "https://www.assemblee-nationale.fr/dyn/static/tribun/17/photos/carre";
const RECENT_VOTE_LIMIT = Number(process.env.FRANCE_PARLIAMENT_RECENT_VOTE_LIMIT || "320");
const WATCH_VOTE_LIMIT = Number(process.env.FRANCE_PARLIAMENT_WATCH_VOTE_LIMIT || "160");

const outModule = new URL("../src/franceParliament.js", import.meta.url);
const outDir = new URL("../public/source/france-parliament/", import.meta.url);
const memberDir = new URL("members/", outDir);
const generatedAt = new Date().toISOString();

const tmpRoot = await mkdtemp(path.join(tmpdir(), "tor-phi-france-parliament-"));
const deputiesZip = path.join(tmpRoot, "deputies.zip");
const votesZip = path.join(tmpRoot, "votes.zip");
const deputiesDir = path.join(tmpRoot, "deputies");
const votesDir = path.join(tmpRoot, "votes");

try {
  await mkdir(memberDir, { recursive: true });
  await downloadFile(DEPUTIES_ZIP_URL, deputiesZip);
  await downloadFile(VOTES_ZIP_URL, votesZip);
  await unzip(deputiesZip, deputiesDir);
  await unzip(votesZip, votesDir);

  const orgMap = await loadOrgans(path.join(deputiesDir, "json", "organe"));
  const members = (await loadActors(path.join(deputiesDir, "json", "acteur"), orgMap))
    .sort((a, b) => a.sortName.localeCompare(b.sortName));
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const ethicsByMember = await loadEthicsRecusals(path.join(deputiesDir, "json", "deport"), memberMap);
  const votesByMember = await loadVotes(path.join(votesDir, "json"), memberMap);

  const parties = summarizeCount(members, (member) => member.group?.shortLabel || member.group?.label || "No group listed")
    .map(([group, count]) => ({ group, count }));
  const departments = summarizeCount(members, (member) => member.constituency?.department || "Not listed")
    .map(([department, count]) => ({ department, count }));

  const metadata = {
    generatedAt,
    sourceDate: generatedAt.slice(0, 10),
    total: members.length,
    parties,
    departments,
    recentVoteLimit: RECENT_VOTE_LIMIT,
    watchVoteLimit: WATCH_VOTE_LIMIT,
    sources: {
      activeDeputiesPage: DEPUTIES_PAGE_URL,
      activeDeputiesZip: DEPUTIES_ZIP_URL,
      votesPage: VOTES_PAGE_URL,
      votesZip: VOTES_ZIP_URL
    }
  };

  const index = {
    generatedAt,
    metadata,
    sourceRegistry: [
      {
        label: "Active deputies open data",
        url: DEPUTIES_PAGE_URL,
        note: "Official Assemblee nationale current-deputy profile, mandate, organ, contact, and constituency data."
      },
      {
        label: "Active deputies JSON zip",
        url: DEPUTIES_ZIP_URL,
        note: "Machine-readable source used by the TOR Phi generator."
      },
      {
        label: "Votes open data",
        url: VOTES_PAGE_URL,
        note: "Official voting-position dataset for public votes in the current legislature."
      },
      {
        label: "Votes JSON zip",
        url: VOTES_ZIP_URL,
        note: "Machine-readable voting-position source used by the TOR Phi generator."
      }
    ],
    counts: {
      members: members.length,
      groups: parties.length,
      departments: departments.length,
      votePositions: 0,
      ethicsRecusals: 0
    },
    members: []
  };

  for (const member of members) {
    const voteRecord = votesByMember.get(member.id) || emptyVoteRecord();
    const ethicsRecusals = ethicsByMember.get(member.id) || [];
    member.votePositionCount = voteRecord.totalPositions;
    member.latestVoteDate = voteRecord.latestDate;
    member.ethicsRecusalCount = ethicsRecusals.length;

    const archive = {
      member,
      generatedAt,
      officialSourceNotes: [
        "Deputy profile, constituency, group, contact, and active mandates are generated from the official Assemblee nationale active-deputies open-data package.",
        "Vote records are generated from the official public-votes package. The local archive keeps counts for all matched positions and stores the latest positions plus foreign-policy watch hits for fast in-app review.",
        "External official links are retained as citations; TOR Phi navigation for profiles and record pages stays internal."
      ],
      sourceUrls: buildSourceUrls(member),
      mandates: member.mandates,
      votes: voteRecord,
      ethicsRecusals
    };

    index.counts.votePositions += voteRecord.totalPositions;
    index.counts.ethicsRecusals += ethicsRecusals.length;
    index.members.push({
      id: member.id,
      name: member.name,
      slug: member.slug,
      group: member.group,
      party: member.party,
      constituency: member.constituency,
      recordUrl: member.recordUrl,
      officialUrl: member.officialUrl,
      votePositionCount: voteRecord.totalPositions,
      latestVoteDate: voteRecord.latestDate,
      ethicsRecusalCount: ethicsRecusals.length
    });

    await writeFile(new URL(`${member.id}.json`, memberDir), `${JSON.stringify(archive, null, 2)}\n`);
  }

  await writeFile(new URL("index.json", outDir), `${JSON.stringify(index, null, 2)}\n`);
  await writeFile(outModule, renderModule(metadata, members));

  console.log(`Wrote ${members.length} French National Assembly member profiles.`);
  console.log(`Indexed ${index.counts.votePositions.toLocaleString()} matched vote positions; stored latest and watch-list rows in per-member local archives.`);
} finally {
  await rm(tmpRoot, { recursive: true, force: true });
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }

  await mkdir(path.dirname(destination), { recursive: true });
  const stream = createWriteStream(destination);
  await new Promise((resolve, reject) => {
    response.body.pipeTo(new WritableStream({
      write(chunk) {
        stream.write(Buffer.from(chunk));
      },
      close() {
        stream.end(resolve);
      },
      abort(error) {
        stream.destroy(error);
        reject(error);
      }
    })).catch(reject);
  });
}

async function unzip(zipFile, destination) {
  await mkdir(destination, { recursive: true });
  await execFileAsync("unzip", ["-q", zipFile, "-d", destination]);
}

async function loadOrgans(directory) {
  const files = await listJsonFiles(directory);
  const organs = new Map();

  for (const file of files) {
    const root = JSON.parse(await readFile(file, "utf8"));
    const org = root.organe || root;
    if (!org?.uid) continue;
    organs.set(getText(org.uid), {
      id: getText(org.uid),
      type: org.codeType || "",
      label: cleanText(org.libelle),
      shortLabel: cleanText(org.libelleAbrege || org.libelleAbrev || org.viMoDe?.dateDebut || ""),
      abbreviation: cleanText(org.libelleAbrev || org.libelleAbrege || ""),
      startDate: org.viMoDe?.dateDebut || "",
      endDate: org.viMoDe?.dateFin || ""
    });
  }

  return organs;
}

async function loadActors(directory, orgMap) {
  const files = await listJsonFiles(directory);
  const members = [];

  for (const file of files) {
    const root = JSON.parse(await readFile(file, "utf8"));
    const actor = root.acteur || root;
    const member = normalizeMember(actor, orgMap);
    if (member) members.push(member);
  }

  return members;
}

function normalizeMember(actor, orgMap) {
  const id = getText(actor.uid);
  if (!id) return null;

  const ident = actor.etatCivil?.ident || {};
  const name = cleanText([ident.prenom, ident.nom].filter(Boolean).join(" "));
  const sortName = cleanText([ident.nom, ident.prenom].filter(Boolean).join(", "));
  const officialUrl = `${OFFICIAL_PROFILE_BASE}/${id}`;
  const numericId = id.replace(/^PA/i, "");
  const mandates = toArray(actor.mandats?.mandat)
    .filter((mandate) => !mandate.dateFin)
    .map((mandate) => normalizeMandate(mandate, orgMap))
    .filter(Boolean);
  const assemblyMandate = mandates.find((mandate) => mandate.type === "ASSEMBLEE") || null;
  const groupMandate = latestMandate(mandates, "GP");
  const partyMandate = latestMandate(mandates, "PARPOL");
  const committeeMandates = mandates
    .filter((mandate) => ["COMPER", "COMNL", "COMSENAT", "DELEG", "MISINFO", "MISINFOCOM", "MISINFOPRE", "CNPE"].includes(mandate.type))
    .sort((a, b) => a.label.localeCompare(b.label) || a.quality.localeCompare(b.quality));
  const addresses = toArray(actor.adresses?.adresse);
  const contact = normalizeContact(addresses);
  const slug = slugify(name);
  const region = assemblyMandate?.election?.region || "";
  const department = assemblyMandate?.election?.departement || "";
  const departmentNumber = assemblyMandate?.election?.numDepartement || "";
  const constituencyNumber = assemblyMandate?.election?.numCirco || "";
  const constituencyLabel = department && constituencyNumber
    ? `${department} (${formatOrdinalEnglish(constituencyNumber)} constituency)`
    : department || "Constituency not listed";
  const birth = actor.etatCivil?.infoNaissance || {};
  const profession = cleanText(actor.profession?.libelleCourant || "");

  return {
    id,
    slug,
    name,
    sortName,
    title: ident.civ || "",
    officialUrl,
    recordUrl: `/country/france/parliament/${encodeURIComponent(slug)}/records`,
    imageUrl: `${PHOTO_BASE}/${numericId}.jpg`,
    group: groupMandate ? {
      id: groupMandate.orgId,
      label: groupMandate.label,
      shortLabel: groupMandate.shortLabel || groupMandate.abbreviation || groupMandate.label
    } : null,
    party: partyMandate ? {
      id: partyMandate.orgId,
      label: partyMandate.label,
      shortLabel: partyMandate.shortLabel || partyMandate.abbreviation || partyMandate.label
    } : null,
    constituency: {
      label: constituencyLabel,
      region,
      department,
      departmentNumber,
      number: constituencyNumber,
      seat: assemblyMandate?.seat || ""
    },
    currentMandate: {
      startDate: assemblyMandate?.startDate || "",
      takingOfficeDate: assemblyMandate?.mandature?.datePriseFonction || "",
      legislature: assemblyMandate?.legislature || "17",
      cause: assemblyMandate?.election?.causeMandat || "",
      seat: assemblyMandate?.seat || ""
    },
    birth: {
      date: birth.dateNais || "",
      city: cleanText(birth.villeNais || ""),
      department: cleanText(birth.depNais || ""),
      country: cleanText(birth.paysNais || "")
    },
    profession,
    contact,
    committees: committeeMandates,
    mandates,
    sourceLinks: buildSourceLinks({ id, slug, name, officialUrl }),
    votePositionCount: 0,
    latestVoteDate: "",
    ethicsRecusalCount: 0
  };
}

function normalizeMandate(mandate, orgMap) {
  const orgRef = getText(mandate.organes?.organeRef);
  const org = orgMap.get(orgRef) || {};
  const election = mandate.election?.lieu ? {
    region: cleanText(mandate.election.lieu.region),
    department: cleanText(mandate.election.lieu.departement),
    departmentNumber: cleanText(mandate.election.lieu.numDepartement),
    constituencyNumber: cleanText(mandate.election.lieu.numCirco),
    causeMandat: cleanText(mandate.election.causeMandat)
  } : null;

  return {
    id: getText(mandate.uid),
    type: mandate.typeOrgane || org.type || "",
    orgId: orgRef,
    label: org.label || orgRef || mandate.typeOrgane || "Unlabelled organ",
    shortLabel: org.shortLabel || "",
    abbreviation: org.abbreviation || "",
    quality: cleanText(mandate.infosQualite?.libQualiteSex || mandate.infosQualite?.libQualite || ""),
    startDate: mandate.dateDebut || "",
    publicationDate: mandate.datePublication || "",
    legislature: mandate.legislature || "",
    main: String(mandate.nominPrincipale || "") === "1",
    election,
    mandature: mandate.mandature || null,
    seat: mandate.mandature?.placeHemicycle || ""
  };
}

function latestMandate(mandates, type) {
  return mandates
    .filter((mandate) => mandate.type === type)
    .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))[0] || null;
}

function normalizeContact(addresses) {
  const officialAddress = addresses.find((item) => item.type === "0") || null;
  const constituencyAddress = addresses.find((item) => item.type === "2") || null;
  const emails = unique(addresses.filter((item) => item.type === "15").map((item) => item.valElec).filter(Boolean));
  const phones = unique(addresses.filter((item) => item.type === "11").map((item) => item.valElec).filter(Boolean));
  const websites = unique(addresses.filter((item) => item.type === "22").map((item) => normalizeWebsite(item.valElec)).filter(Boolean));
  const social = addresses
    .filter((item) => ["24", "25", "29", "30"].includes(String(item.type)))
    .map((item) => ({
      label: normalizeSocialLabel(item.typeLibelle),
      url: normalizeSocialUrl(item.typeLibelle, item.valElec)
    }))
    .filter((item) => item.url);

  return {
    officialAddress: formatAddress(officialAddress),
    constituencyAddress: formatAddress(constituencyAddress),
    emails,
    phones,
    websites,
    social: uniqueBy(social, (item) => item.url)
  };
}

function formatAddress(address) {
  if (!address) return "";
  return [
    address.intitule,
    address.numeroRue,
    address.nomRue,
    address.complementAdresse,
    [address.codePostal, address.ville].filter(Boolean).join(" ")
  ].map(cleanText).filter(Boolean).join(" ");
}

async function loadEthicsRecusals(directory, memberMap) {
  const files = await listJsonFiles(directory);
  const byMember = new Map();

  for (const file of files) {
    const root = JSON.parse(await readFile(file, "utf8"));
    const deport = root.deport || root;
    const memberId = deport.refActeur;
    if (!memberMap.has(memberId)) continue;
    const record = {
      id: deport.uid,
      legislature: deport.legislature || "",
      createdAt: deport.dateCreation || "",
      publishedAt: deport.datePublication || "",
      scope: cleanText(deport.portee?.libelle || deport.portee?.code || ""),
      reading: cleanText(deport.lecture?.libelle || deport.lecture?.code || ""),
      instance: cleanText(deport.instance?.libelle || deport.instance?.code || ""),
      targetType: cleanText(deport.cible?.type?.libelle || deport.cible?.type?.code || ""),
      target: cleanText(deport.cible?.referenceTextuelle || ""),
      explanation: stripHtml(deport.explication || "")
    };
    if (!byMember.has(memberId)) byMember.set(memberId, []);
    byMember.get(memberId).push(record);
  }

  for (const records of byMember.values()) {
    records.sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt)));
  }

  return byMember;
}

async function loadVotes(directory, memberMap) {
  const files = await listJsonFiles(directory);
  const byMember = new Map();
  const memberIds = new Set(memberMap.keys());

  for (const file of files) {
    const root = JSON.parse(await readFile(file, "utf8"));
    const scrutin = root.scrutin || root;
    const baseRecord = normalizeVote(scrutin);

    for (const group of toArray(scrutin.ventilationVotes?.organe?.groupes?.groupe)) {
      const nominative = group.vote?.decompteNominatif || {};
      addVoters(byMember, memberIds, nominative.pours, "For", baseRecord);
      addVoters(byMember, memberIds, nominative.contres, "Against", baseRecord);
      addVoters(byMember, memberIds, nominative.abstentions, "Abstention", baseRecord);
      addVoters(byMember, memberIds, nominative.nonVotants, "Not voting", baseRecord);
      addVoters(byMember, memberIds, nominative.nonVotantsVolontaires, "Voluntary non-voting", baseRecord);
    }
  }

  for (const [memberId, record] of byMember.entries()) {
    record.all.sort(compareVotesDesc);
    record.latestDate = record.all[0]?.date || "";
    record.recent = record.all.slice(0, RECENT_VOTE_LIMIT);
    record.watch = record.all.filter(isForeignPolicyWatchVote).slice(0, WATCH_VOTE_LIMIT);
    delete record.all;
    record.sourceUrl = VOTES_PAGE_URL;
    record.sourceDatasetUrl = VOTES_ZIP_URL;
    byMember.set(memberId, record);
  }

  return byMember;
}

function emptyVoteRecord() {
  return {
    totalPositions: 0,
    latestDate: "",
    totals: {},
    recent: [],
    watch: [],
    sourceUrl: VOTES_PAGE_URL,
    sourceDatasetUrl: VOTES_ZIP_URL
  };
}

function normalizeVote(scrutin) {
  const number = String(scrutin.numero || "").trim();
  return {
    id: scrutin.uid || number,
    number,
    legislature: scrutin.legislature || "17",
    date: scrutin.dateScrutin || "",
    type: cleanText(scrutin.typeVote?.libelleTypeVote || scrutin.typeVote?.codeTypeVote || ""),
    majority: cleanText(scrutin.typeVote?.typeMajorite || ""),
    result: cleanText(scrutin.sort?.libelle || scrutin.sort?.code || ""),
    title: cleanText(scrutin.titre || scrutin.objet?.libelle || ""),
    object: cleanText(scrutin.objet?.libelle || scrutin.titre || ""),
    dossier: cleanText(scrutin.objet?.dossierLegislatif?.libelle || ""),
    counts: {
      voters: scrutin.syntheseVote?.nombreVotants || "",
      expressed: scrutin.syntheseVote?.suffragesExprimes || "",
      required: scrutin.syntheseVote?.nbrSuffragesRequis || "",
      for: scrutin.syntheseVote?.decompte?.pour || "",
      against: scrutin.syntheseVote?.decompte?.contre || "",
      abstentions: scrutin.syntheseVote?.decompte?.abstentions || "",
      notVoting: scrutin.syntheseVote?.decompte?.nonVotants || ""
    },
    sourceUrl: number ? `https://www.assemblee-nationale.fr/dyn/17/scrutins/${number}` : VOTES_PAGE_URL
  };
}

function addVoters(byMember, memberIds, bucket, position, baseRecord) {
  for (const voter of toArray(bucket?.votant)) {
    const memberId = voter.acteurRef;
    if (!memberIds.has(memberId)) continue;
    if (!byMember.has(memberId)) {
      byMember.set(memberId, {
        totalPositions: 0,
        latestDate: "",
        totals: {},
        all: []
      });
    }
    const record = byMember.get(memberId);
    record.totalPositions += 1;
    record.totals[position] = (record.totals[position] || 0) + 1;
    record.all.push({
      ...baseRecord,
      position,
      delegated: String(voter.parDelegation || "") === "true",
      seat: voter.numPlace || "",
      cause: voter.causePositionVote || ""
    });
  }
}

function compareVotesDesc(a, b) {
  return String(b.date).localeCompare(String(a.date)) || Number(b.number || 0) - Number(a.number || 0);
}

function isForeignPolicyWatchVote(vote) {
  return /irak|iraq|kurd|kurde|kurdistan|syrie|syria|turquie|turkey|iran|defense|defence|securite|terror|terrorisme|frontiere|etranger|foreign|otan|nato|yazidi|yezidi|pechmerga|peshmerga|daech|isis/i.test([
    vote.title,
    vote.object,
    vote.dossier,
    vote.type,
    vote.result
  ].join(" "));
}

function buildSourceLinks({ slug, officialUrl }) {
  return [
    ["TOR Phi records", `/country/france/parliament/${encodeURIComponent(slug)}/records`],
    ["Assemblee nationale official deputy profile", officialUrl],
    ["Official vote positions", `${officialUrl}/positions-de-vote`],
    ["Official questions page", `${officialUrl}/questions`],
    ["Official documents page", `${officialUrl}/documents`],
    ["Official interventions page", `${officialUrl}/interventions`],
    ["Active deputies open data", DEPUTIES_PAGE_URL],
    ["Votes open data", VOTES_PAGE_URL]
  ];
}

function buildSourceUrls(member) {
  return buildSourceLinks(member).map(([label, url]) => ({ label, url }));
}

function renderModule(metadata, members) {
  const moduleMembers = members.map(compactMemberForModule);
  return `// Generated by scripts/generate-france-parliament.mjs from official Assemblee nationale open data.\n// Generated on ${metadata.sourceDate}. Do not edit individual records by hand.\n\nexport const franceParliamentMetadata = ${JSON.stringify(metadata, null, 2)};\n\nexport const franceParliamentMembers = ${JSON.stringify(moduleMembers, null, 2)};\n`;
}

function compactMemberForModule(member) {
  return {
    id: member.id,
    slug: member.slug,
    name: member.name,
    sortName: member.sortName,
    title: member.title,
    officialUrl: member.officialUrl,
    recordUrl: member.recordUrl,
    imageUrl: member.imageUrl,
    group: member.group,
    party: member.party,
    constituency: member.constituency,
    currentMandate: member.currentMandate,
    birth: member.birth,
    profession: member.profession,
    contact: member.contact,
    committees: (member.committees ?? []).map((committee) => ({
      id: committee.id,
      type: committee.type,
      orgId: committee.orgId,
      label: committee.label,
      shortLabel: committee.shortLabel,
      abbreviation: committee.abbreviation,
      quality: committee.quality,
      startDate: committee.startDate
    })),
    mandateCount: member.mandates?.length || 0,
    sourceLinks: member.sourceLinks,
    votePositionCount: member.votePositionCount,
    latestVoteDate: member.latestVoteDate,
    ethicsRecusalCount: member.ethicsRecusalCount
  };
}

async function listJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const next = path.join(directory, entry.name);
    if (entry.isDirectory()) return listJsonFiles(next);
    return entry.isFile() && entry.name.endsWith(".json") ? [next] : [];
  }));
  return files.flat();
}

function summarizeCount(items, getter) {
  const counts = new Map();
  for (const item of items) {
    const key = getter(item) || "Not listed";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function getText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return value["#text"] || value.uid || "";
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanText(value) {
  return `${value ?? ""}`
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value) {
  return cleanText(`${value ?? ""}`
    .replace(/<[^>]+>/g, " ")
    .replace(/&eacute;/g, "e")
    .replace(/&Eacute;/g, "E")
    .replace(/&egrave;/g, "e")
    .replace(/&ecirc;/g, "e")
    .replace(/&agrave;/g, "a")
    .replace(/&ccedil;/g, "c")
    .replace(/&ocirc;/g, "o")
    .replace(/&ugrave;/g, "u")
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&"));
}

function normalizeWebsite(value) {
  const url = cleanText(value);
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

function normalizeSocialLabel(label) {
  if (/twitter/i.test(label)) return "X / Twitter";
  if (/facebook/i.test(label)) return "Facebook";
  if (/instagram/i.test(label)) return "Instagram";
  if (/linkedin/i.test(label)) return "LinkedIn";
  return cleanText(label);
}

function normalizeSocialUrl(label, value) {
  const cleaned = cleanText(value);
  if (!cleaned) return "";
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  const handle = cleaned.replace(/^@/, "");
  if (/twitter/i.test(label)) return `https://x.com/${handle}`;
  if (/facebook/i.test(label)) return `https://www.facebook.com/${handle}`;
  if (/instagram/i.test(label)) return `https://www.instagram.com/${handle}`;
  if (/linkedin/i.test(label)) return `https://www.linkedin.com/in/${handle}`;
  return normalizeWebsite(cleaned);
}

function unique(items) {
  return [...new Set(items)];
}

function uniqueBy(items, getter) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getter(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function slugify(value) {
  return `${value ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatOrdinalEnglish(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return `${value}`;
  const lastTwo = number % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13
    ? "th"
    : number % 10 === 1
      ? "st"
      : number % 10 === 2
        ? "nd"
        : number % 10 === 3
          ? "rd"
          : "th";
  return `${number}${suffix}`;
}
