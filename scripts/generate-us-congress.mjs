import fs from "node:fs/promises";
import { parse } from "yaml";

const sourceUrl = "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml";
const committeesUrl = "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/committees-current.yaml";
const committeeMembershipUrl = "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/committee-membership-current.yaml";

const [legislatorResponse, committeeResponse, membershipResponse] = await Promise.all([
  fetch(sourceUrl),
  fetch(committeesUrl),
  fetch(committeeMembershipUrl)
]);

if (!legislatorResponse.ok) {
  throw new Error(`Unable to fetch current legislators: ${legislatorResponse.status} ${legislatorResponse.statusText}`);
}

if (!committeeResponse.ok) {
  throw new Error(`Unable to fetch committees: ${committeeResponse.status} ${committeeResponse.statusText}`);
}

if (!membershipResponse.ok) {
  throw new Error(`Unable to fetch committee membership: ${membershipResponse.status} ${membershipResponse.statusText}`);
}

const yamlText = await legislatorResponse.text();
const legislators = parse(yamlText);
const committees = parse(await committeeResponse.text());
const committeeMembership = parse(await membershipResponse.text());
const generatedAt = new Date().toISOString().slice(0, 10);
const committeeMap = buildCommitteeMap(committees);
const committeeAssignmentsByMember = buildCommitteeAssignmentsByMember(committeeMembership, committeeMap);
const leadershipByBioguide = new Map(Object.entries({
  J000299: {
    title: "Speaker of the House",
    chamber: "House",
    source: "https://www.house.gov/leadership",
    relevanceScore: 20,
    note: "Controls House floor agenda, recognition, institutional posture, and leadership-level letters or statements."
  },
  S001176: {
    title: "House Majority Leader",
    chamber: "House",
    source: "https://www.house.gov/leadership",
    relevanceScore: 18,
    note: "Controls majority floor scheduling and helps determine whether legislation or resolutions receive attention."
  },
  E000294: {
    title: "House Majority Whip",
    chamber: "House",
    source: "https://www.house.gov/leadership",
    relevanceScore: 16,
    note: "Counts and persuades majority votes; important for resolutions, sanctions, defense, and appropriations packages."
  },
  J000294: {
    title: "House Minority Leader",
    chamber: "House",
    source: "https://www.house.gov/leadership",
    relevanceScore: 18,
    note: "Sets opposition caucus posture and can elevate foreign-policy or human-rights issues."
  },
  C001101: {
    title: "House Minority Whip",
    chamber: "House",
    source: "https://www.house.gov/leadership",
    relevanceScore: 16,
    note: "Counts and persuades minority votes; relevant when Kurdistan-related measures need bipartisan support."
  },
  A000371: {
    title: "House Democratic Caucus Chair",
    chamber: "House",
    source: "https://www.house.gov/leadership",
    relevanceScore: 14,
    note: "Influences caucus messaging and member coordination."
  },
  T000250: {
    title: "Senate Majority Leader",
    chamber: "Senate",
    source: "https://www.senate.gov/senators/leadership.htm",
    relevanceScore: 20,
    note: "Controls Senate floor agenda and is central to confirmations, sanctions, defense authorization, and appropriations timing."
  },
  B001261: {
    title: "Senate Majority Whip",
    chamber: "Senate",
    source: "https://www.senate.gov/senators/leadership.htm",
    relevanceScore: 16,
    note: "Counts and persuades majority votes; useful for bipartisan packages and foreign-policy legislation."
  },
  C001095: {
    title: "Senate Republican Conference Chair",
    chamber: "Senate",
    source: "https://www.senate.gov/senators/leadership.htm",
    relevanceScore: 14,
    note: "Shapes majority conference messaging."
  },
  S000148: {
    title: "Senate Minority Leader",
    chamber: "Senate",
    source: "https://www.senate.gov/senators/leadership.htm",
    relevanceScore: 18,
    note: "Sets minority caucus posture and can elevate foreign-policy, human-rights, or defense issues."
  },
  D000563: {
    title: "Senate Minority Whip",
    chamber: "Senate",
    source: "https://www.senate.gov/senators/leadership.htm",
    relevanceScore: 16,
    note: "Counts and persuades minority votes; relevant for bipartisan letters, sanctions, and foreign assistance."
  },
  K000367: {
    title: "Senate Democratic Steering and Policy Committee Chair",
    chamber: "Senate",
    source: "https://www.senate.gov/senators/leadership.htm",
    relevanceScore: 13,
    note: "Influences minority policy coordination and caucus issue selection."
  }
}));

const members = legislators
  .map((legislator) => {
    const term = legislator.terms.at(-1);
    const firstTerm = legislator.terms.find((item) => item.type === "rep" || item.type === "sen") || term;
    const name = legislator.name.official_full || [legislator.name.first, legislator.name.middle, legislator.name.last].filter(Boolean).join(" ");
    const chamber = term.type === "sen" ? "Senate" : "House";
    const state = term.state;
    const district = term.type === "rep" ? term.district : null;
    const party = term.party || "Unknown";
    const bioguide = legislator.id.bioguide;
    const govtrack = legislator.id.govtrack;
    const opensecrets = legislator.id.opensecrets;
    const ballotpedia = legislator.id.ballotpedia;
    const wikipedia = legislator.id.wikipedia;
    const wikidata = legislator.id.wikidata;
    const officialUrl = term.url || null;
    const rssUrl = term.rss_url || null;
    const address = term.address || null;
    const phone = term.phone || null;
    const fax = term.fax || null;
    const contactForm = term.contact_form || null;
    const districtLabel = chamber === "Senate" ? `${state} senator` : `${state}-${district}`;
    const committeeAssignments = (committeeAssignmentsByMember.get(bioguide) || [])
      .sort((a, b) => b.relevanceScore - a.relevanceScore || a.name.localeCompare(b.name));
    const leadership = leadershipByBioguide.get(bioguide) || null;
    const relevance = buildForeignPolicyRelevance(committeeAssignments, chamber, leadership);
    const researchProfile = buildKurdistanResearchProfile({ chamber, state, districtLabel, party, committeeAssignments, leadership, relevance });
    const sourceLinks = [
      ["Official congressional website", officialUrl],
      ["Biographical Directory of the U.S. Congress", `https://bioguide.congress.gov/search/bio/${bioguide}`],
      ["Congress.gov member search", `https://www.congress.gov/member/${slugName(name)}/${bioguide}`],
      ["Congress.gov sponsored legislation", `https://www.congress.gov/member/${slugName(name)}/${bioguide}?q=%7B%22sponsorship%22%3A%22sponsored%22%7D`],
      ["Congress.gov cosponsored legislation", `https://www.congress.gov/member/${slugName(name)}/${bioguide}?q=%7B%22sponsorship%22%3A%22cosponsored%22%7D`],
      govtrack ? ["GovTrack profile", `https://www.govtrack.us/congress/members/${govtrack}`] : null,
      opensecrets ? ["OpenSecrets profile", `https://www.opensecrets.org/members-of-congress/summary?cid=${opensecrets}`] : null,
      ballotpedia ? ["Ballotpedia profile", `https://ballotpedia.org/${ballotpedia.replaceAll(" ", "_")}`] : null,
      wikipedia ? ["Wikipedia background", `https://en.wikipedia.org/wiki/${wikipedia.replaceAll(" ", "_")}`] : null,
      rssUrl ? ["Official press release RSS", rssUrl] : null
    ].filter((item) => item?.[1]);
    const committeeSourceLinks = committeeAssignments
      .filter((assignment) => assignment.url)
      .slice(0, 8)
      .map((assignment) => [`${assignment.name}${assignment.title ? ` / ${assignment.title}` : ""}`, assignment.url]);

    return {
      id: bioguide,
      name,
      sortName: `${legislator.name.last}, ${legislator.name.first}`,
      chamber,
      state,
      district,
      districtLabel,
      party,
      role: chamber === "Senate" ? `U.S. Senator for ${state}` : `U.S. Representative for ${districtLabel}`,
      currentTerm: {
        start: term.start,
        end: term.end,
        type: term.type,
        class: term.class || null
      },
      firstTermStart: firstTerm.start || term.start,
      officialUrl,
      contact: {
        address,
        phone,
        fax,
        contactForm,
        rssUrl
      },
      ids: {
        bioguide,
        govtrack,
        opensecrets,
        ballotpedia,
        wikipedia,
        wikidata
      },
      committees: committeeAssignments,
      leadership,
      committeeSourceLinks,
      foreignPolicyRelevance: relevance,
      kurdistanResearchProfile: researchProfile,
      sourceLinks,
      statementsOnKurdistan: [
        {
          date: generatedAt,
          stance: "Unreviewed",
          title: researchProfile.placeholderTitle,
          summary: researchProfile.placeholderSummary,
          url: `https://www.congress.gov/member/${slugName(name)}/${bioguide}`
        }
      ],
      monitoringTasks: researchProfile.monitoringTasks
    };
  })
  .sort((a, b) => a.chamber.localeCompare(b.chamber) || a.state.localeCompare(b.state) || String(a.district ?? "").localeCompare(String(b.district ?? "")) || a.sortName.localeCompare(b.sortName));

const senators = members.filter((member) => member.chamber === "Senate").length;
const representatives = members.filter((member) => member.chamber === "House").length;

const moduleText = `// Generated by scripts/generate-us-congress.mjs from ${sourceUrl}
// Generated on ${generatedAt}. Do not edit individual records by hand.

export const usCongressMetadata = ${JSON.stringify({ sourceUrl, committeesUrl, committeeMembershipUrl, generatedAt, total: members.length, senators, representatives }, null, 2)};

export const usCongressMembers = ${JSON.stringify(members, null, 2)};
`;

await fs.writeFile(new URL("../src/usCongress.js", import.meta.url), moduleText);

console.log(`Generated ${members.length} congressional profiles (${senators} senators, ${representatives} representatives).`);

function slugName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildCommitteeMap(committees) {
  const map = new Map();

  committees.forEach((committee) => {
    const base = {
      id: committee.thomas_id,
      parentId: committee.thomas_id,
      name: committee.name,
      chamber: committee.type === "senate" ? "Senate" : committee.type === "house" ? "House" : "Joint",
      type: "committee",
      url: committee.url || committee.minority_url || null,
      jurisdiction: committee.jurisdiction || "",
      relevanceScore: scoreCommitteeRelevance(committee.name, committee.jurisdiction || "")
    };

    map.set(committee.thomas_id, base);

    (committee.subcommittees || []).forEach((subcommittee) => {
      const id = `${committee.thomas_id}${subcommittee.thomas_id}`;
      const subName = `${committee.name}: ${subcommittee.name}`;
      map.set(id, {
        id,
        parentId: committee.thomas_id,
        name: subName,
        chamber: base.chamber,
        type: "subcommittee",
        url: committee.url || committee.minority_url || null,
        jurisdiction: committee.jurisdiction || "",
        relevanceScore: scoreCommitteeRelevance(subName, committee.jurisdiction || "")
      });
    });
  });

  return map;
}

function buildCommitteeAssignmentsByMember(membership, committeeMap) {
  const byMember = new Map();

  Object.entries(membership).forEach(([committeeId, members]) => {
    const committee = committeeMap.get(committeeId);
    if (!committee) return;

    members.forEach((member) => {
      if (!member.bioguide) return;
      const assignments = byMember.get(member.bioguide) || [];
      assignments.push({
        id: committee.id,
        parentId: committee.parentId,
        name: committee.name,
        chamber: committee.chamber,
        type: committee.type,
        url: committee.url,
        title: member.title || "",
        partyRole: member.party || "",
        rank: member.rank || null,
        jurisdiction: committee.jurisdiction,
        relevanceScore: committee.relevanceScore
      });
      byMember.set(member.bioguide, assignments);
    });
  });

  return byMember;
}

function scoreCommitteeRelevance(name, jurisdiction) {
  const nameText = sanitizeCommitteeText(name);
  const jurisdictionText = sanitizeCommitteeText(jurisdiction);
  const nameRules = [
    [18, ["foreign affairs", "foreign relations", "middle east", "near east", "iraq", "international organizations"]],
    [17, ["armed services", "defense", "intelligence"]],
    [16, ["foreign operations", "state and foreign", "department of state"]],
    [15, ["homeland security", "national security", "counterterrorism"]],
    [11, ["energy", "natural resources", "commerce", "finance", "banking", "trade", "ways and means"]],
    [8, ["oversight", "government reform", "budget", "rules"]],
    [7, ["appropriations"]],
    [6, ["judiciary"]],
    [5, ["veterans", "transportation", "agriculture", "education", "labor"]]
  ];
  const jurisdictionRules = [
    [8, ["middle east", "near east", "iraq", "foreign policy", "international organizations"]],
    [7, ["armed services", "defense policy", "intelligence community", "homeland security"]],
    [6, ["foreign operations", "department of state", "foreign assistance"]],
    [5, ["energy security", "sanctions", "international trade", "export controls", "human rights"]]
  ];

  const nameScore = nameRules.reduce((score, [weight, terms]) => (
    terms.some((term) => hasTerm(nameText, term)) ? Math.max(score, weight) : score
  ), 2);
  const jurisdictionScore = jurisdictionRules.reduce((score, [weight, terms]) => (
    terms.some((term) => hasTerm(jurisdictionText, term)) ? Math.max(score, weight) : score
  ), 2);

  return Math.max(nameScore, jurisdictionScore);
}

function sanitizeCommitteeText(value) {
  return (value || "")
    .toLowerCase()
    .replace(/\bartificial intelligence\b/g, "artificialintelligence");
}

function hasTerm(haystack, term) {
  return new RegExp(`(^|[^a-z])${escapeRegExp(term)}([^a-z]|$)`, "i").test(haystack);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildForeignPolicyRelevance(committees, chamber, leadershipRole) {
  const topScore = Math.max(
    leadershipRole?.relevanceScore || 0,
    committees.reduce((max, committee) => Math.max(max, committee.relevanceScore), 0)
  );
  const topCommittees = committees
    .filter((committee) => committee.relevanceScore >= Math.max(8, topScore - 3))
    .slice(0, 4)
    .map((committee) => committee.name);
  const committeeLeadership = committees
    .filter((committee) => committee.title)
    .slice(0, 5)
    .map((committee) => `${committee.title} / ${committee.name}`);
  const level = topScore >= 17 ? "Very high" : topScore >= 14 ? "High" : topScore >= 8 ? "Medium" : "Baseline";

  return {
    level,
    score: topScore,
    topCommittees,
    leadership: committeeLeadership,
    reason: buildRelevanceReason({ level, topCommittees, chamber, leadership: leadershipRole })
  };
}

function buildRelevanceReason({ level, topCommittees, chamber, leadership }) {
  if (leadership && topCommittees.length === 0) {
    return `${level} research priority because this member is ${leadership.title}. ${leadership.note}`;
  }

  if (leadership) {
    return `${level} research priority because this member is ${leadership.title} and is assigned to ${topCommittees.join("; ")}.`;
  }

  if (topCommittees.length === 0) {
    return `${chamber} member with no high-relevance committee assignment in the current structured data. Still monitor public statements, votes, letters, and caucus activity.`;
  }

  return `${level} research priority because of assignment${topCommittees.length > 1 ? "s" : ""} on ${topCommittees.join("; ")}.`;
}

function buildKurdistanResearchProfile({ committeeAssignments, leadership, relevance }) {
  const focusAreas = new Set();
  const watchTerms = new Set(["Kurdistan", "Kurdish", "KRG", "Iraqi Kurdistan", "Erbil", "Peshmerga", "Yazidi", "Iraq"]);

  committeeAssignments.forEach((assignment) => {
    const nameText = sanitizeCommitteeText(assignment.name);
    const jurisdictionText = sanitizeCommitteeText(assignment.jurisdiction);
    const fullText = `${nameText} ${jurisdictionText}`;
    if (
      ["foreign affairs", "foreign relations", "middle east", "near east", "international organizations"].some((term) => hasTerm(nameText, term)) ||
      ["middle east", "near east", "iraq"].some((term) => hasTerm(fullText, term))
    ) {
      focusAreas.add("foreign policy");
      ["Syria Kurds", "Iran", "Turkey", "Baghdad", "State Department"].forEach((term) => watchTerms.add(term));
    }
    if (["armed services", "defense", "intelligence", "national security", "homeland security", "counterterrorism"].some((term) => hasTerm(nameText, term))) {
      focusAreas.add("security and intelligence");
      ["ISIS", "CENTCOM", "Coalition", "drones", "militias"].forEach((term) => watchTerms.add(term));
    }
    if (["appropriations", "foreign operations", "state and foreign", "department of state"].some((term) => hasTerm(nameText, term))) {
      focusAreas.add("appropriations and aid");
      ["Peshmerga funding", "FMF", "CTEF", "State and Foreign Operations"].forEach((term) => watchTerms.add(term));
    }
    if (["budget"].some((term) => hasTerm(nameText, term))) {
      focusAreas.add("budget and fiscal scoring");
      ["foreign assistance", "defense topline", "aid offsets"].forEach((term) => watchTerms.add(term));
    }
    if (["energy", "natural resources", "commerce", "trade", "finance", "banking", "ways and means"].some((term) => hasTerm(nameText, term))) {
      focusAreas.add("energy, sanctions, and commerce");
      ["oil exports", "energy", "sanctions", "investment"].forEach((term) => watchTerms.add(term));
    }
    if (
      ["oversight", "government reform"].some((term) => hasTerm(nameText, term)) ||
      ["human rights", "religious freedom", "religious minorities", "refugees"].some((term) => hasTerm(fullText, term))
    ) {
      focusAreas.add("oversight, rights, and accountability");
      ["human rights", "religious minorities", "Yazidis", "refugees"].forEach((term) => watchTerms.add(term));
    }
    if (["judiciary"].some((term) => hasTerm(nameText, term))) {
      focusAreas.add("legal and immigration oversight");
      ["asylum", "visas", "foreign agent registration", "terrorism cases"].forEach((term) => watchTerms.add(term));
    }
  });

  if (leadership) {
    focusAreas.add("congressional leadership");
    ["floor schedule", "leadership statement", "bipartisan letter", "resolution"].forEach((term) => watchTerms.add(term));
  }

  if (focusAreas.size === 0) {
    focusAreas.add("public statements and votes");
  }

  return {
    priority: relevance.level,
    focusAreas: [...focusAreas],
    watchTerms: [...watchTerms],
    placeholderTitle: relevance.level === "Baseline"
      ? "No Kurdistan-specific record attached; baseline monitoring profile"
      : `No Kurdistan-specific record attached; ${relevance.level.toLowerCase()} committee-driven research priority`,
    placeholderSummary: `Committee data suggests focus on ${[...focusAreas].join(", ")}. Analyst should attach sourced statements, votes, letters, hearings, caucus records, delegation visits, or district/diaspora evidence before assigning a stance.`,
    monitoringTasks: [
      `Search official press releases for: ${[...watchTerms].slice(0, 10).join(", ")}`,
      "Review Congress.gov sponsored and cosponsored legislation for Iraq, Syria, Iran, defense, sanctions, energy, religious minorities, and foreign aid",
      "Review committee hearings, letters, delegation travel, NDAA amendments, appropriations language, and caucus membership",
      "Separate committee relevance from personal stance; do not rate support without a direct record",
      "Check KRG Representation in Washington, KRG Presidency, KRG Prime Minister, and DFR readouts for meetings or mentions"
    ]
  };
}
