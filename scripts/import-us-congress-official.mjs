import { mkdir, writeFile } from "node:fs/promises";
import { usCongressMembers, usCongressMetadata } from "../src/usCongress.js";

const HAS_CONGRESS_GOV_API_KEY = Boolean(process.env.CONGRESS_GOV_API_KEY);
const USE_CONGRESS_GOV_API = HAS_CONGRESS_GOV_API_KEY || process.env.US_CONGRESS_USE_DEMO_KEY === "1";
const API_KEY = process.env.CONGRESS_GOV_API_KEY || "DEMO_KEY";
const IMPORT_LIMIT = Number(process.env.US_CONGRESS_IMPORT_LIMIT || "0");
const CONCURRENCY = Number(process.env.US_CONGRESS_CONCURRENCY || "4");
const LEGISLATION_LIMIT = Number(process.env.US_CONGRESS_LEGISLATION_LIMIT || "25");
const HOUSE_RECENT_VOTE_PAGES = Number(process.env.US_CONGRESS_HOUSE_VOTE_PAGES || "2");
const OUT_DIR = new URL("../public/source/us-congress-official/", import.meta.url);
const MEMBER_DIR = new URL("members/", OUT_DIR);
const generatedAt = new Date().toISOString();

const senateSourceRegistry = [
  ["Senate XML source directory", "https://www.senate.gov/general/common/generic/XML_Availability.htm", "Catalog of Senate XML/HTML feeds."],
  ["Current senators contact list", "https://www.senate.gov/general/contact_information/senators_cfm.cfm", "Official senator contact directory."],
  ["Current senators contact XML", "https://www.senate.gov/general/contact_information/senators_cfm.xml", "Official XML contact feed where accessible."],
  ["Senators with full committee assignments", "https://www.senate.gov/general/committee_assignments/assignments.htm", "Official Senate assignment page."],
  ["Senators with full committee assignments XML", "https://www.senate.gov/general/committee_assignments/assignments.xml", "Official XML assignment feed where accessible."],
  ["Senate committee hearings and meetings", "https://www.senate.gov/committees/hearings_meetings.htm", "Official committee schedule."],
  ["Senate floor schedule", "https://www.senate.gov/legislative/calendars.htm", "Official floor calendar surface."],
  ["Senate roll call vote lists", "https://www.senate.gov/legislative/votes_new.htm", "Official Senate vote entry point."],
  ["119th Congress, 2nd session vote list", "https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_2.htm", "Current Congress/session vote list."]
];

const houseSourceRegistry = [
  ["House Clerk member profiles", "https://clerk.house.gov/Members", "Official House member profile directory."],
  ["House roll call votes", "https://clerk.house.gov/Votes", "Official House roll call vote surface."],
  ["Official House member list", "https://clerk.house.gov/member_info/mcapdir.html", "Official list of members by state."],
  ["Official House telephone directory", "https://directory.house.gov/", "House member and office directory."],
  ["House committee profiles", "https://clerk.house.gov/Committees", "Official House committee profile directory."],
  ["House committee repository", "https://docs.house.gov/committee", "Committee hearings, meetings, and materials repository."],
  ["House disclosure reports", "https://disclosures-clerk.house.gov/", "Official public-disclosure portal."]
];

const congressGovSourceRegistry = [
  ["Congress.gov API", "https://api.congress.gov/", "Structured official API from Congress.gov."],
  ["Congress.gov members", "https://www.congress.gov/members", "Official member browsing surface."],
  ["Congressional Record", "https://www.congress.gov/congressional-record", "Official Congressional Record search surface."],
  ["Committees on Congress.gov", "https://www.congress.gov/committees", "Official committee search surface."],
  ["Public laws on Congress.gov", "https://www.congress.gov/public-laws", "Official public-law browsing surface."]
];

const bioguideSourceRegistry = [
  ["Biographical Directory of the U.S. Congress", "https://bioguide.congress.gov/", "Official historical biography/service directory."]
];

await mkdir(MEMBER_DIR, { recursive: true });

const membersToImport = IMPORT_LIMIT > 0 ? usCongressMembers.slice(0, IMPORT_LIMIT) : usCongressMembers;
const importCount = membersToImport.length;
const index = {
  generatedAt,
  importScope: {
    requestedMembers: importCount,
    totalMembersInCongressDataset: usCongressMembers.length,
    congressGovLegislationLimitPerList: LEGISLATION_LIMIT,
    houseRecentVotePagesPerMember: HOUSE_RECENT_VOTE_PAGES,
    congressGovApiMode: USE_CONGRESS_GOV_API ? "enabled" : "skipped-no-api-key"
  },
  upstreamDataset: usCongressMetadata,
  sourceRegistry: {
    congressGov: congressGovSourceRegistry.map(toRegistryRecord),
    house: houseSourceRegistry.map(toRegistryRecord),
    senate: senateSourceRegistry.map(toRegistryRecord),
    bioguide: bioguideSourceRegistry.map(toRegistryRecord)
  },
  counts: {
    members: 0,
    houseMembers: 0,
    senators: 0,
    congressGovDetailsImported: 0,
    sponsoredLegislationListsImported: 0,
    cosponsoredLegislationListsImported: 0,
    congressGovApiSkipped: 0,
    houseClerkProfilesImported: 0,
    houseRecentVoteListsImported: 0,
    errors: 0
  },
  members: []
};

await mapWithConcurrency(membersToImport, CONCURRENCY, async (member, indexNumber) => {
  const record = await importMember(member);
  await writeFile(new URL(`${member.id}.json`, MEMBER_DIR), JSON.stringify(record, null, 2));
  index.members.push(summarizeMemberRecord(member, record));
  updateIndexCounts(record);

  if ((indexNumber + 1) % 25 === 0 || indexNumber + 1 === importCount) {
    console.log(`Imported ${indexNumber + 1}/${importCount} official Congress member archives`);
  }
});

index.members.sort((a, b) => a.chamber.localeCompare(b.chamber) || a.state.localeCompare(b.state) || String(a.district ?? "").localeCompare(String(b.district ?? "")) || a.name.localeCompare(b.name));
await writeFile(new URL("index.json", OUT_DIR), JSON.stringify(index, null, 2));

console.log(`Wrote ${index.members.length} official U.S. Congress archive records to public/source/us-congress-official/`);

async function importMember(member) {
  const congressGovProfileUrl = congressGovApiUrl(`/member/${member.id}`);
  const sponsoredUrl = congressGovApiUrl(`/member/${member.id}/sponsored-legislation`, { limit: LEGISLATION_LIMIT });
  const cosponsoredUrl = congressGovApiUrl(`/member/${member.id}/cosponsored-legislation`, { limit: LEGISLATION_LIMIT });

  const [profileResult, sponsoredResult, cosponsoredResult] = USE_CONGRESS_GOV_API
    ? await Promise.all([
        fetchJson(congressGovProfileUrl),
        fetchJson(sponsoredUrl),
        fetchJson(cosponsoredUrl)
      ])
    : [
        skippedCongressGovResult(congressGovProfileUrl.publicUrl),
        skippedCongressGovResult(sponsoredUrl.publicUrl),
        skippedCongressGovResult(cosponsoredUrl.publicUrl)
      ];

  const houseClerk = member.chamber === "House" ? await importHouseClerk(member) : null;

  return {
    member: {
      id: member.id,
      name: member.name,
      chamber: member.chamber,
      party: member.party,
      state: member.state,
      district: member.district,
      districtLabel: member.districtLabel,
      role: member.role,
      currentTerm: member.currentTerm,
      firstTermStart: member.firstTermStart,
      officialWebsite: member.officialUrl,
      contact: member.contact,
      identifiers: member.ids
    },
    generatedAt,
    officialSourceNotes: [
      "Congress.gov data is stored from the official public API. API keys are used only during fetch and are not saved in this archive.",
      "House member records include House Clerk profile fields and the latest available recent-vote pages where the House Clerk endpoint returned HTML.",
      "Senate records include official source registry links. Some Senate XML endpoints can block automated clients; the URLs are retained for analyst follow-up."
    ],
    sourceUrls: buildSourceUrls(member),
    congressGov: {
      profile: normalizeApiResult(profileResult, "member"),
      sponsoredLegislation: normalizeApiResult(sponsoredResult, "sponsoredLegislation"),
      cosponsoredLegislation: normalizeApiResult(cosponsoredResult, "cosponsoredLegislation")
    },
    houseClerk,
    senate: member.chamber === "Senate" ? buildSenateSourceEnvelope(member) : null
  };
}

async function importHouseClerk(member) {
  const profileUrl = `https://clerk.house.gov/members/${member.id}`;
  const recentVotesBaseUrl = `https://clerk.house.gov/Members/ViewRecentVotes?memberID=${member.id}`;
  const profileResult = await fetchText(profileUrl);
  const recentVoteResults = await Promise.all(
    Array.from({ length: HOUSE_RECENT_VOTE_PAGES }, (_, index) => fetchText(`${recentVotesBaseUrl}&page=${index + 1}`))
  );

  return {
    profileUrl,
    profile: profileResult.ok ? parseHouseClerkProfile(profileResult.body, member) : null,
    profileFetch: omitBody(profileResult),
    recentVotesUrl: `${recentVotesBaseUrl}&page=1`,
    recentVotes: recentVoteResults.flatMap((result, pageIndex) => result.ok ? parseHouseRecentVotes(result.body, pageIndex + 1) : []),
    recentVoteFetches: recentVoteResults.map(omitBody)
  };
}

function buildSourceUrls(member) {
  const sourceUrls = [
    ["TOR Phi local archive record", `/source/us-congress-official/members/${member.id}.json`],
    ["Congress.gov API member detail", congressGovApiUrl(`/member/${member.id}`).publicUrl],
    ["Congress.gov API sponsored legislation", congressGovApiUrl(`/member/${member.id}/sponsored-legislation`, { limit: LEGISLATION_LIMIT }).publicUrl],
    ["Congress.gov API cosponsored legislation", congressGovApiUrl(`/member/${member.id}/cosponsored-legislation`, { limit: LEGISLATION_LIMIT }).publicUrl],
    ["Congress.gov member page", `https://www.congress.gov/member/${slugName(member.name)}/${member.id}`],
    ["Biographical Directory profile", `https://bioguide.congress.gov/search/bio/${member.id}`],
    member.officialUrl ? ["Official congressional website", member.officialUrl] : null,
    member.contact?.rssUrl ? ["Official press release RSS", member.contact.rssUrl] : null
  ].filter(Boolean);

  if (member.chamber === "House") {
    sourceUrls.push(
      ["House Clerk member profile", `https://clerk.house.gov/members/${member.id}`],
      ["House Clerk recent votes", `https://clerk.house.gov/Members/ViewRecentVotes?memberID=${member.id}&page=1`],
      ["House Clerk roll call votes", "https://clerk.house.gov/Votes"],
      ["House committee repository", "https://docs.house.gov/committee"],
      ["House disclosures", "https://disclosures-clerk.house.gov/"]
    );
  } else {
    sourceUrls.push(
      ["Senate current senators", "https://www.senate.gov/senators/senators-contact.htm"],
      ["Senate committee assignments", "https://www.senate.gov/general/committee_assignments/assignments.htm"],
      ["Senate roll call votes", "https://www.senate.gov/legislative/votes_new.htm"],
      ["Senate XML source catalog", "https://www.senate.gov/general/common/generic/XML_Availability.htm"]
    );
  }

  return sourceUrls.map(([label, url]) => ({ label, url }));
}

function buildSenateSourceEnvelope(member) {
  return {
    sourceStatus: "registered-not-fully-harvested",
    note: "This local archive records official Senate source surfaces for follow-up import. Congress.gov member and legislation records above are already harvested.",
    memberOfficialWebsite: member.officialUrl,
    officialSources: senateSourceRegistry.map(toRegistryRecord)
  };
}

function normalizeApiResult(result, dataKey) {
  if (result.skipped) {
    return {
      sourceUrl: result.publicUrl,
      ok: null,
      status: "skipped",
      reason: result.reason
    };
  }

  if (!result.ok) {
    return {
      sourceUrl: result.publicUrl,
      ok: false,
      status: result.status,
      error: result.error
    };
  }

  const data = result.data?.[dataKey] ?? null;
  const pagination = result.data?.pagination ?? null;
  const request = result.data?.request ?? null;

  return {
    sourceUrl: result.publicUrl,
    ok: true,
    status: result.status,
    importedAt: generatedAt,
    count: Array.isArray(data) ? data.length : data?.count ?? null,
    pagination,
    request,
    data
  };
}

function parseHouseClerkProfile(html, member) {
  const imageMatch = html.match(/<img[^>]+src=["']?([^"'\s>]+\/images\/members\/[^"'\s>]+|\/images\/members\/[^"'\s>]+)["']?[^>]*>/i);
  const contactBlock = html.match(/<section class="overviewAndContact">([\s\S]*?)<\/section>/i)?.[1] ?? "";
  const committeeBlock = html.match(/<section class="subcommittees">([\s\S]*?)<\/section>/i)?.[1] ?? html;
  const committeeMatches = [...committeeBlock.matchAll(/<a[^>]+class="[^"]*library-committeePanel-subItems[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const phone = stripTags(contactBlock.match(/<span class="phone"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "").replace(/^Phone:\s*/i, "");
  const contactLines = [...contactBlock.matchAll(/<span[^>]*aria-label="[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/span>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);

  return {
    source: "Office of the Clerk, U.S. House of Representatives",
    name: stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? member.name) || member.name,
    photoUrl: imageMatch ? new URL(decodeHtml(imageMatch[1]), "https://clerk.house.gov").href : "",
    contactLines,
    phone,
    committeesAndSubcommittees: committeeMatches.map((match) => ({
      name: stripTags(match[2]),
      url: new URL(decodeHtml(match[1]), "https://clerk.house.gov").href
    }))
  };
}

function parseHouseRecentVotes(html, page) {
  const rows = [...html.matchAll(/<tr>\s*([\s\S]*?)<\/tr>/gi)];

  return rows
    .map((row) => {
      const cells = [...row[1].matchAll(/<td[^>]*data-label="([^"]+)"[^>]*>([\s\S]*?)<\/td>/gi)];
      if (cells.length === 0) return null;

      const values = Object.fromEntries(cells.map(([, label, value]) => [label, stripTags(value)]));
      const rollCallLink = row[1].match(/href="([^"]*\/Votes\/[^"]+)"/i)?.[1] ?? "";
      const billNumber = stripTags(row[1].match(/<span class="legisNum"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? values["Bill Number"] ?? "");

      return {
        page,
        date: values.Date ?? "",
        rollCallNumber: values["Roll Call Number"] ?? "",
        billNumber,
        billTitle: values["Bill Title"] ?? "",
        vote: values.Vote ?? "",
        status: values.Status ?? "",
        sourceUrl: rollCallLink ? new URL(decodeHtml(rollCallLink), "https://clerk.house.gov").href : ""
      };
    })
    .filter((record) => record?.rollCallNumber || record?.billTitle);
}

function summarizeMemberRecord(member, record) {
  const sponsoredCount = record.congressGov.sponsoredLegislation?.data?.length ?? 0;
  const cosponsoredCount = record.congressGov.cosponsoredLegislation?.data?.length ?? 0;
  const houseRecentVoteCount = record.houseClerk?.recentVotes?.length ?? 0;

  return {
    id: member.id,
    name: member.name,
    chamber: member.chamber,
    party: member.party,
    state: member.state,
    district: member.district,
    districtLabel: member.districtLabel,
    file: `/source/us-congress-official/members/${member.id}.json`,
    statuses: {
      congressGovProfile: Boolean(record.congressGov.profile?.ok),
      sponsoredLegislation: Boolean(record.congressGov.sponsoredLegislation?.ok),
      cosponsoredLegislation: Boolean(record.congressGov.cosponsoredLegislation?.ok),
      congressGovApiSkipped: record.congressGov.profile?.status === "skipped",
      houseClerkProfile: member.chamber === "House" ? Boolean(record.houseClerk?.profileFetch?.ok) : null,
      houseRecentVotes: member.chamber === "House" ? houseRecentVoteCount > 0 : null,
      senateOfficialSourcesRegistered: member.chamber === "Senate"
    },
    importedCounts: {
      sponsoredLegislation: sponsoredCount,
      cosponsoredLegislation: cosponsoredCount,
      houseRecentVotes: houseRecentVoteCount
    }
  };
}

function updateIndexCounts(record) {
  index.counts.members += 1;
  if (record.member.chamber === "House") index.counts.houseMembers += 1;
  if (record.member.chamber === "Senate") index.counts.senators += 1;
  if (record.congressGov.profile?.ok) index.counts.congressGovDetailsImported += 1;
  if (record.congressGov.sponsoredLegislation?.ok) index.counts.sponsoredLegislationListsImported += 1;
  if (record.congressGov.cosponsoredLegislation?.ok) index.counts.cosponsoredLegislationListsImported += 1;
  if (record.congressGov.profile?.status === "skipped") index.counts.congressGovApiSkipped += 1;
  if (record.houseClerk?.profileFetch?.ok) index.counts.houseClerkProfilesImported += 1;
  if (record.houseClerk?.recentVotes?.length) index.counts.houseRecentVoteListsImported += 1;

  const hasError = [
    record.congressGov.profile,
    record.congressGov.sponsoredLegislation,
    record.congressGov.cosponsoredLegislation,
    record.houseClerk?.profileFetch,
    ...(record.houseClerk?.recentVoteFetches ?? [])
  ].some((item) => item && item.ok === false);
  if (hasError) index.counts.errors += 1;
}

function skippedCongressGovResult(publicUrl) {
  return {
    skipped: true,
    publicUrl,
    reason: "Set CONGRESS_GOV_API_KEY to import this official API record at scale. The public DEMO_KEY is intentionally not used by default because it rate-limits after a few requests."
  };
}

function congressGovApiUrl(pathname, params = {}) {
  const url = new URL(`https://api.congress.gov/v3${pathname}`);
  url.searchParams.set("format", "json");
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  return {
    fetchUrl: withApiKey(url).href,
    publicUrl: stripApiKey(url).href
  };
}

async function fetchJson(source) {
  const sourceUrl = typeof source === "string" ? { fetchUrl: source, publicUrl: source } : source;

  try {
    const response = await fetch(sourceUrl.fetchUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "TOR Phi official Congress importer"
      }
    });
    const body = await response.text();

    if (!response.ok) {
      return { ok: false, status: response.status, publicUrl: sourceUrl.publicUrl, error: body.slice(0, 700) };
    }

    return { ok: true, status: response.status, publicUrl: sourceUrl.publicUrl, data: JSON.parse(body) };
  } catch (error) {
    return { ok: false, status: 0, publicUrl: sourceUrl.publicUrl, error: error.message };
  }
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": "TOR Phi official Congress importer"
      }
    });
    const body = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      url,
      body,
      error: response.ok ? "" : body.slice(0, 700)
    };
  } catch (error) {
    return { ok: false, status: 0, url, body: "", error: error.message };
  }
}

function omitBody(result) {
  return {
    ok: result.ok,
    status: result.status,
    url: result.url,
    error: result.error || ""
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const queue = items.map((item, indexNumber) => ({ item, indexNumber }));
  let nextIndex = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (nextIndex < queue.length) {
      const queueIndex = nextIndex;
      nextIndex += 1;
      const { item, indexNumber } = queue[queueIndex];
      await mapper(item, indexNumber);
    }
  });

  await Promise.all(workers);
}

function withApiKey(url) {
  const nextUrl = new URL(url.href);
  nextUrl.searchParams.set("api_key", API_KEY);
  return nextUrl;
}

function stripApiKey(url) {
  const nextUrl = new URL(url.href);
  nextUrl.searchParams.delete("api_key");
  return nextUrl;
}

function toRegistryRecord([label, url, note]) {
  return { label, url, note };
}

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
      .replace(/<\/(p|div|li|tr|h\d|span)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
