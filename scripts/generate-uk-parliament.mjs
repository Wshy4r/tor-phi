import { mkdir, writeFile } from "node:fs/promises";

const MEMBERS_API = "https://members-api.parliament.uk/api";
const COMMONS_VOTES_API = "https://commonsvotes-api.parliament.uk/data";
const PAGE_SIZE = Number(process.env.UK_PARLIAMENT_PAGE_SIZE || "20");
const WRITTEN_QUESTION_LIMIT = Number(process.env.UK_PARLIAMENT_WRITTEN_QUESTION_LIMIT || "20");
const VOTE_LIMIT = Number(process.env.UK_PARLIAMENT_VOTE_LIMIT || "60");
const INTEREST_LIMIT = Number(process.env.UK_PARLIAMENT_INTEREST_LIMIT || "40");
const CONCURRENCY = Number(process.env.UK_PARLIAMENT_CONCURRENCY || "8");

const outModule = new URL("../src/ukParliament.js", import.meta.url);
const outDir = new URL("../public/source/uk-parliament/", import.meta.url);
const memberDir = new URL("members/", outDir);
const generatedAt = new Date().toISOString();

await mkdir(memberDir, { recursive: true });

const searchUrl = `${MEMBERS_API}/Members/Search?House=Commons&IsCurrentMember=true&skip=0&take=${PAGE_SIZE}`;
const search = await fetchJson(searchUrl);
const sourceMembers = await loadAllCurrentCommonsMembers(search);
const members = sourceMembers
  .map(compactMember)
  .sort((a, b) => a.sortName.localeCompare(b.sortName));

const parties = summarizeCount(members, (member) => member.party || "No party listed")
  .map(([party, count]) => ({ party, count }));
const constituencies = summarizeCount(members, (member) => member.constituency || "Not listed")
  .map(([constituency, count]) => ({ constituency, count }));

const metadata = {
  generatedAt,
  sourceDate: generatedAt.slice(0, 10),
  total: members.length,
  house: "House of Commons",
  parties,
  constituencies,
  writtenQuestionLimit: WRITTEN_QUESTION_LIMIT,
  voteLimit: VOTE_LIMIT,
  interestLimit: INTEREST_LIMIT,
  sources: {
    developerHub: "https://developer.parliament.uk/",
    membersApi: "https://members-api.parliament.uk/index.html",
    membersSearch: searchUrl,
    commonsVotesApi: "https://commonsvotes-api.parliament.uk/index.html"
  }
};

const index = {
  generatedAt,
  metadata,
  sourceRegistry: [
    {
      label: "UK Parliament Members API",
      url: "https://members-api.parliament.uk/index.html",
      note: "Official UK Parliament API used for current Commons members, contact fields, synopsis, written questions, and register-of-interests categories."
    },
    {
      label: "UK Parliament Commons Votes API",
      url: "https://commonsvotes-api.parliament.uk/index.html",
      note: "Official Commons voting API used for each MP's recent division positions."
    },
    {
      label: "UK Parliament developer hub",
      url: "https://developer.parliament.uk/",
      note: "Official directory describing the supported public APIs."
    }
  ],
  counts: {
    members: members.length,
    parties: parties.length,
    constituencies: constituencies.length,
    writtenQuestions: 0,
    votePositions: 0,
    registeredInterestItems: 0
  },
  members: []
};

await runLimited(members, CONCURRENCY, async (member, indexInList) => {
  const [contact, synopsis, writtenQuestions, voting, registeredInterests] = await Promise.all([
    fetchJson(`${MEMBERS_API}/Members/${member.id}/Contact`).catch((error) => skipped(error)),
    fetchJson(`${MEMBERS_API}/Members/${member.id}/Synopsis`).catch((error) => skipped(error)),
    fetchJson(`${MEMBERS_API}/Members/${member.id}/WrittenQuestions?skip=0&take=${WRITTEN_QUESTION_LIMIT}`).catch((error) => skipped(error)),
    fetchJson(`${COMMONS_VOTES_API}/divisions.json/membervoting?queryParameters.memberId=${member.id}`).catch((error) => skipped(error)),
    fetchJson(`${MEMBERS_API}/Members/${member.id}/RegisteredInterests`).catch((error) => skipped(error))
  ]);

  const contactInfo = normalizeContact(contact.value ?? []);
  const questions = normalizeWrittenQuestions(writtenQuestions.items ?? []);
  const votes = normalizeVotes(Array.isArray(voting) ? voting : []);
  const interests = normalizeInterests(registeredInterests.value ?? []);
  const sourceLinks = buildSourceLinks(member);

  member.contact = contactInfo;
  member.synopsis = stripHtml(synopsis.value || "");
  member.writtenQuestionCount = questions.length;
  member.latestQuestionDate = questions[0]?.dateTabled || "";
  member.votePositionCount = votes.length;
  member.latestVoteDate = votes[0]?.date || "";
  member.registeredInterestCount = interests.reduce((sum, group) => sum + group.items.length, 0);
  member.sourceLinks = sourceLinks;

  const archive = {
    member,
    generatedAt,
    officialSourceNotes: [
      "Current member identity, party, constituency, thumbnail, contact information, synopsis, written questions, and registered interests are generated from the official UK Parliament Members API.",
      "Recent Commons division positions are generated from the official UK Parliament Commons Votes API.",
      "External official links are retained as citations; TOR Phi profile and record navigation remains internal."
    ],
    sourceUrls: sourceLinks.map(([label, url]) => ({ label, url })),
    records: {
      writtenQuestions: questions,
      votes: {
        totalPositions: votes.length,
        latestDate: votes[0]?.date || "",
        totals: summarizeVotePositions(votes),
        recent: votes.slice(0, VOTE_LIMIT),
        watch: votes.filter(isForeignPolicyWatchRecord).slice(0, VOTE_LIMIT)
      },
      registeredInterests: interests,
      watch: buildWatchRecords(questions, votes, interests)
    },
    sourceStatus: {
      contact: contact.status ? contact.status : "imported",
      synopsis: synopsis.status ? synopsis.status : "imported",
      writtenQuestions: writtenQuestions.status ? writtenQuestions.status : "imported",
      voting: voting.status ? voting.status : "imported",
      registeredInterests: registeredInterests.status ? registeredInterests.status : "imported"
    }
  };

  index.counts.writtenQuestions += questions.length;
  index.counts.votePositions += votes.length;
  index.counts.registeredInterestItems += member.registeredInterestCount;
  index.members[indexInList] = {
    id: member.id,
    name: member.name,
    slug: member.slug,
    party: member.party,
    constituency: member.constituency,
    officialUrl: member.officialUrl,
    recordUrl: member.recordUrl,
    votePositionCount: member.votePositionCount,
    latestVoteDate: member.latestVoteDate,
    writtenQuestionCount: member.writtenQuestionCount,
    registeredInterestCount: member.registeredInterestCount
  };

  await writeFile(new URL(`${member.id}.json`, memberDir), `${JSON.stringify(archive, null, 2)}\n`);
});

index.members = index.members.filter(Boolean);
await writeFile(new URL("index.json", outDir), `${JSON.stringify(index, null, 2)}\n`);
await writeFile(outModule, renderModule(metadata, members));

console.log(`Wrote ${members.length} UK Commons member profiles.`);
console.log(`Indexed ${index.counts.votePositions.toLocaleString()} vote positions and ${index.counts.writtenQuestions.toLocaleString()} written-question rows.`);

function compactMember(value) {
  const id = String(value.id);
  const constituency = cleanText(value.latestHouseMembership?.membershipFrom || "");
  const party = cleanText(value.latestParty?.name || "");
  const partyAbbreviation = cleanText(value.latestParty?.abbreviation || party);
  const name = cleanMemberName(value.nameDisplayAs || value.nameFullTitle || value.nameListAs || `Member ${id}`);
  const slug = slugify(name);

  return {
    id,
    slug,
    name,
    sortName: cleanText(value.nameListAs || name),
    fullTitle: cleanText(value.nameFullTitle || name),
    party,
    partyAbbreviation,
    partyColor: value.latestParty?.backgroundColour ? `#${value.latestParty.backgroundColour}` : "",
    constituency,
    house: "House of Commons",
    role: `MP for ${constituency || "constituency not listed"}`,
    officialUrl: `https://members.parliament.uk/member/${id}/contact`,
    recordUrl: `/country/uk/parliament/${encodeURIComponent(slug)}/records`,
    imageUrl: value.thumbnailUrl || `${MEMBERS_API}/Members/${id}/Thumbnail`,
    currentMembership: {
      constituency,
      constituencyId: value.latestHouseMembership?.membershipFromId || "",
      startDate: toDate(value.latestHouseMembership?.membershipStartDate),
      statusStartDate: toDate(value.latestHouseMembership?.membershipStatus?.statusStartDate),
      status: value.latestHouseMembership?.membershipStatus?.statusDescription || "Current Member"
    },
    contact: {},
    synopsis: "",
    sourceLinks: [],
    votePositionCount: 0,
    latestVoteDate: "",
    writtenQuestionCount: 0,
    latestQuestionDate: "",
    registeredInterestCount: 0
  };
}

function normalizeContact(items) {
  const emails = [];
  const phones = [];
  const addresses = [];
  const websites = [];
  const social = [];

  for (const item of items) {
    if (item.email) emails.push(item.email);
    if (item.phone) phones.push(item.phone);
    const address = [item.line1, item.line2, item.line3, item.line4, item.line5, item.postcode].map(cleanText).filter(Boolean).join(", ");
    if (address) addresses.push(address);
    const url = normalizeWebsite(item.website || item.line1);
    if (item.isWebAddress && url) {
      if (/twitter|x\.com|facebook|instagram|youtube|linkedin|bsky|threads/i.test(url)) {
        social.push([cleanText(item.type || "Social profile"), url]);
      } else {
        websites.push(url);
      }
    }
  }

  return {
    emails: unique(emails),
    phones: unique(phones),
    addresses: unique(addresses),
    websites: unique(websites),
    social: uniqueBy(social, (item) => item[1])
  };
}

function normalizeWrittenQuestions(items) {
  return items
    .map((item) => item.value || item)
    .map((value) => ({
      id: value.id,
      uin: cleanText(value.uin),
      heading: cleanText(value.heading || "Written question"),
      questionText: stripHtml(value.questionText || ""),
      answerText: stripHtml(value.answerText || ""),
      answeringBody: cleanText(value.answeringBody?.name || value.answeringBody?.shortName || ""),
      answeringMember: cleanMemberName(value.answeringMember?.nameDisplayAs || ""),
      dateTabled: toDate(value.dateTabled),
      dateForAnswer: toDate(value.dateForAnswer),
      dateAnswered: toDate(value.dateAnswered),
      memberHasInterest: Boolean(value.memberHasInterest),
      sourceUrl: value.id ? `https://questions-statements.parliament.uk/written-questions/detail/${toDate(value.dateTabled)}/${value.uin}` : "https://questions-statements.parliament.uk/"
    }))
    .sort((a, b) => String(b.dateTabled).localeCompare(String(a.dateTabled)));
}

function normalizeVotes(items) {
  return items
    .map((item) => {
      const division = item.PublishedDivision || {};
      const position = item.MemberVotedAye ? "Aye" : item.MemberVotedNo ? "No" : item.MemberWasTeller ? "Teller" : "No vote recorded";
      return {
        id: division.DivisionId || "",
        number: division.Number || "",
        date: toDate(division.Date),
        title: cleanText(division.FriendlyTitle || division.Title || "Commons division"),
        description: cleanText(division.FriendlyDescription || ""),
        position,
        wasTeller: Boolean(item.MemberWasTeller),
        ayeCount: division.AyeCount ?? "",
        noCount: division.NoCount ?? "",
        deferred: Boolean(division.IsDeferred),
        sourceUrl: division.DivisionId ? `https://votes.parliament.uk/Votes/Commons/Division/${division.DivisionId}` : "https://votes.parliament.uk/"
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || Number(b.number || 0) - Number(a.number || 0));
}

function normalizeInterests(groups) {
  return groups
    .map((group) => ({
      id: group.id,
      category: cleanText(group.name),
      items: (group.interests ?? [])
        .flatMap((interest) => [interest, ...(interest.childInterests ?? [])])
        .slice(0, INTEREST_LIMIT)
        .map((interest) => ({
          id: interest.id,
          text: stripHtml(interest.interest),
          createdWhen: toDate(interest.createdWhen),
          amendedWhen: toDate(interest.lastAmendedWhen),
          isCorrection: Boolean(interest.isCorrection)
        }))
    }))
    .filter((group) => group.items.length > 0);
}

function buildWatchRecords(questions, votes, interests) {
  return [
    ...questions.filter(isForeignPolicyWatchRecord).map((item) => ({ kind: "Written question", title: item.heading, date: item.dateTabled, summary: item.questionText, sourceUrl: item.sourceUrl })),
    ...votes.filter(isForeignPolicyWatchRecord).map((item) => ({ kind: "Vote", title: item.title, date: item.date, summary: `${item.position}; Ayes ${item.ayeCount}, Noes ${item.noCount}.`, sourceUrl: item.sourceUrl })),
    ...interests.flatMap((group) => group.items.map((item) => ({ kind: "Registered interest", title: group.category, date: item.amendedWhen || item.createdWhen, summary: item.text, sourceUrl: "https://members.parliament.uk/members/commons/interests" }))).filter(isForeignPolicyWatchRecord)
  ].slice(0, 80);
}

function isForeignPolicyWatchRecord(record) {
  return /iraq|kurd|kurdistan|krg|erbil|peshmerga|syria|turkey|turkiye|iran|isis|daesh|defence|defense|security|terror|sanction|foreign|refugee|asylum|yazidi|yezidi|oil|energy/i.test([
    record.title,
    record.heading,
    record.questionText,
    record.answerText,
    record.summary,
    record.description
  ].join(" "));
}

function summarizeVotePositions(votes) {
  return votes.reduce((totals, vote) => {
    totals[vote.position] = (totals[vote.position] || 0) + 1;
    return totals;
  }, {});
}

function buildSourceLinks(member) {
  return [
    ["TOR Phi records", `/country/uk/parliament/${encodeURIComponent(member.slug)}/records`],
    ["UK Parliament member profile", member.officialUrl],
    ["Members API member detail", `${MEMBERS_API}/Members/${member.id}`],
    ["Members API contact", `${MEMBERS_API}/Members/${member.id}/Contact`],
    ["Members API synopsis", `${MEMBERS_API}/Members/${member.id}/Synopsis`],
    ["Members API registered interests", `${MEMBERS_API}/Members/${member.id}/RegisteredInterests`],
    ["Members API written questions", `${MEMBERS_API}/Members/${member.id}/WrittenQuestions?skip=0&take=${WRITTEN_QUESTION_LIMIT}`],
    ["Commons Votes member positions", `${COMMONS_VOTES_API}/divisions.json/membervoting?queryParameters.memberId=${member.id}`],
    ["UK Parliament developer hub", "https://developer.parliament.uk/"]
  ];
}

function renderModule(metadata, members) {
  const moduleMembers = members.map((member) => ({
    id: member.id,
    slug: member.slug,
    name: member.name,
    sortName: member.sortName,
    fullTitle: member.fullTitle,
    party: member.party,
    partyAbbreviation: member.partyAbbreviation,
    partyColor: member.partyColor,
    constituency: member.constituency,
    house: member.house,
    role: member.role,
    officialUrl: member.officialUrl,
    recordUrl: member.recordUrl,
    imageUrl: member.imageUrl,
    currentMembership: member.currentMembership,
    contact: member.contact,
    synopsis: member.synopsis,
    sourceLinks: member.sourceLinks,
    votePositionCount: member.votePositionCount,
    latestVoteDate: member.latestVoteDate,
    writtenQuestionCount: member.writtenQuestionCount,
    latestQuestionDate: member.latestQuestionDate,
    registeredInterestCount: member.registeredInterestCount
  }));

  return `// Generated by scripts/generate-uk-parliament.mjs from official UK Parliament APIs.\n// Generated on ${metadata.sourceDate}. Do not edit individual records by hand.\n\nexport const ukParliamentMetadata = ${JSON.stringify(metadata, null, 2)};\n\nexport const ukParliamentMembers = ${JSON.stringify(moduleMembers, null, 2)};\n`;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "TORPhi/1.0" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function loadAllCurrentCommonsMembers(firstPage) {
  const total = Number(firstPage.totalResults || 0);
  const pages = [firstPage];
  for (let skip = PAGE_SIZE; skip < total; skip += PAGE_SIZE) {
    pages.push(await fetchJson(`${MEMBERS_API}/Members/Search?House=Commons&IsCurrentMember=true&skip=${skip}&take=${PAGE_SIZE}`));
  }

  return pages.flatMap((page) => page.items ?? [])
    .map((item) => item.value)
    .filter(Boolean);
}

function skipped(error) {
  return { status: "skipped", error: error.message };
}

async function runLimited(items, concurrency, worker) {
  let index = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      await worker(items[current], current);
    }
  });
  await Promise.all(runners);
}

function summarizeCount(items, getter) {
  const counts = new Map();
  for (const item of items) {
    const key = getter(item) || "Not listed";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function cleanMemberName(value) {
  return cleanText(value)
    .replace(/\s+MP$/i, "")
    .replace(/^The\s+/, "");
}

function stripHtml(value) {
  return cleanText(`${value ?? ""}`
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&pound;/g, "GBP "));
}

function cleanText(value) {
  return `${value ?? ""}`.replace(/\s+/g, " ").trim();
}

function toDate(value) {
  return value ? String(value).slice(0, 10) : "";
}

function normalizeWebsite(value) {
  const raw = cleanText(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(raw)) return `https://${raw}`;
  return "";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueBy(items, getter) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getter(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function slugify(value) {
  return `${value ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
