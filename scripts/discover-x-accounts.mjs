import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { actorProfiles, countries } from "../src/data.js";
import { foreignMinistryData } from "../src/foreignMinistries.js";
import { franceParliamentMembers } from "../src/franceParliament.js";
import { iranParliamentMembers } from "../src/iranParliament.js";
import { turkishParliamentMembers } from "../src/turkishParliament.js";
import { ukParliamentMembers } from "../src/ukParliament.js";
import { additionalMediaAuthors, additionalThinkTankPeople } from "../src/countryInfluenceNetworks.js";
import { usCongressMembers } from "../src/usCongress.js";
import { usMediaAuthors } from "../src/usMedia.js";
import { usThinkTankPeople } from "../src/usThinkTanks.js";
import { allSocialAccounts } from "../src/socialAccounts.js";

const discoveryJsonUrl = new URL("../public/source/social/x-account-discovery.json", import.meta.url);
const discoveryJsUrl = new URL("../src/socialDiscoveredAccounts.js", import.meta.url);
const cacheUrl = new URL("../data/x-account-discovery-cache.json", import.meta.url);
const analyzerConfigUrl = new URL("../Social Analyzer/backend/config.json", import.meta.url);
const xBearerToken = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
const delayMs = Number(process.env.TORPHI_DISCOVERY_DELAY_MS || 850);
const verifiedThreshold = Number(process.env.TORPHI_DISCOVERY_VERIFIED_THRESHOLD || 78);
const candidateThreshold = Number(process.env.TORPHI_DISCOVERY_CANDIDATE_THRESHOLD || 52);
const args = parseArgs(process.argv.slice(2));

const cache = await readJson(cacheUrl, { searches: {}, profiles: {}, typeahead: {} });
cache.searches ??= {};
cache.profiles ??= {};
cache.typeahead ??= {};
const xConfig = await readJson(analyzerConfigUrl, {});
const previousDiscovery = await readJson(discoveryJsonUrl, { results: [] });
const previousByHref = new Map((previousDiscovery.results ?? []).map((item) => [item.profileHref, item]));
const targets = buildTargets();
const existingByHref = groupBy(
  allSocialAccounts.filter((account) => account.profileHref && account.label !== "Discovered X"),
  "profileHref"
);
const missingTargets = targets.filter((target) => !existingByHref.has(target.profileHref));
const filteredTargets = missingTargets
  .filter((target) => !args.country.length || args.country.includes(target.countryId))
  .filter((target) => !args.ownerType.length || args.ownerType.includes(target.ownerType.toLowerCase()))
  .filter((target) => !args.onlyMissingCandidates || !previousByHref.get(target.profileHref)?.bestCandidate)
  .slice(args.offset, args.all ? undefined : args.offset + args.limit);

console.log(`[TOR Phi] Profiles: ${targets.length}`);
console.log(`[TOR Phi] Already mapped: ${targets.length - missingTargets.length}`);
console.log(`[TOR Phi] Missing X account: ${missingTargets.length}`);
console.log(`[TOR Phi] Discovery targets this run: ${filteredTargets.length}`);

const newResults = [];
for (const [index, target] of filteredTargets.entries()) {
  console.log(`[TOR Phi] ${index + 1}/${filteredTargets.length} ${target.countryId} / ${target.ownerType} / ${target.ownerName}`);
  let result;
  try {
    result = await discoverTarget(target);
  } catch (error) {
    result = {
      ...target,
      checkedAt: new Date().toISOString(),
      status: "error",
      error: error.message,
      bestCandidate: null,
      candidates: [],
      queries: []
    };
  }
  newResults.push(result);
  if ((index + 1) % 50 === 0) {
    const checkpoint = await writeDiscoveryOutputs(newResults);
    console.log(`[TOR Phi] Checkpoint saved: ${checkpoint.verifiedAccounts.length} verified, ${checkpoint.summary.candidate} candidates.`);
  }
  if (index < filteredTargets.length - 1) await sleep(delayMs);
}

const { summary, verifiedAccounts } = await writeDiscoveryOutputs(newResults);

console.log(`[TOR Phi] Verified discovered accounts: ${verifiedAccounts.length}`);
console.log(`[TOR Phi] Candidate-only profiles: ${summary.candidate}`);
console.log(`[TOR Phi] Review file: public/source/social/x-account-discovery.json`);

async function writeDiscoveryOutputs(results) {
  const merged = mergeResults(previousDiscovery.results ?? [], results);
  const verifiedAccounts = merged
    .filter((item) => item.status === "verified" && item.bestCandidate && item.bestCandidate.confidence >= verifiedThreshold)
    .map((item) => ({
      countryId: item.countryId,
      ownerName: item.ownerName,
      ownerType: item.ownerType,
      role: item.role || "Discovered X account",
      profileHref: item.profileHref,
      handle: item.bestCandidate.handle,
      url: `https://x.com/${item.bestCandidate.handle}`,
      label: "Discovered X",
      status: "verified",
      confidence: item.bestCandidate.confidence,
      source: item.bestCandidate.source,
      verifiedAt: item.checkedAt
    }));

  const summary = summarizeDiscovery(merged, targets, missingTargets, verifiedAccounts);
  const discovery = {
    generatedAt: new Date().toISOString(),
    method: "X account typeahead search using the local authenticated Social Analyzer request pattern, plus DuckDuckGo web search fallback over x.com/twitter.com results and profile-title checks. Existing official registry accounts are not duplicated. Low-confidence matches are kept as candidates for review.",
    thresholds: {
      verified: verifiedThreshold,
      candidate: candidateThreshold
    },
    totals: summary,
    results: merged,
    verifiedAccounts
  };

  await fs.mkdir(new URL("../public/source/social/", import.meta.url), { recursive: true });
  await fs.mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await fs.writeFile(discoveryJsonUrl, JSON.stringify(discovery, null, 2) + "\n");
  await fs.writeFile(cacheUrl, JSON.stringify(cache, null, 2) + "\n");
  await fs.writeFile(
    discoveryJsUrl,
    `// Generated by scripts/discover-x-accounts.mjs. Do not edit by hand.\nexport const discoveredSocialAccounts = ${JSON.stringify(verifiedAccounts, null, 2)};\n`
  );
  return { summary, verifiedAccounts };
}

function parseArgs(values) {
  const parsed = {
    all: false,
    limit: 60,
    offset: 0,
    country: [],
    ownerType: [],
    onlyMissingCandidates: false,
    webFallback: false,
    extraTypeaheadQueries: false
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--all") parsed.all = true;
    else if (value === "--limit") parsed.limit = Number(values[++index] || parsed.limit);
    else if (value === "--offset") parsed.offset = Number(values[++index] || 0);
    else if (value === "--country") parsed.country.push(`${values[++index] || ""}`.toLowerCase());
    else if (value === "--owner-type") parsed.ownerType.push(`${values[++index] || ""}`.toLowerCase());
    else if (value === "--only-missing-candidates") parsed.onlyMissingCandidates = true;
    else if (value === "--web-fallback") parsed.webFallback = true;
    else if (value === "--extra-typeahead-queries") parsed.extraTypeaheadQueries = true;
  }
  return parsed;
}

function buildTargets() {
  const profiles = [];
  const add = (entry) => profiles.push({
    countryId: entry.countryId,
    ownerName: entry.ownerName,
    ownerType: entry.ownerType,
    role: entry.role || "",
    profileHref: entry.profileHref,
    searchContext: entry.searchContext || ""
  });

  countries.forEach((country) => {
    country.actors.forEach((actor) => add({
      countryId: country.id,
      ownerName: actor.name,
      ownerType: "Country profile actor",
      role: actor.role,
      profileHref: `${countryHref(country.id)}/profile/${slugify(actor.name)}`,
      searchContext: `${country.name} ${actor.institution} ${actor.role}`
    }));
  });

  Object.entries(actorProfiles).forEach(([name, profile]) => {
    const countryId = countryIdFromName(profile.country);
    if (!countryId) return;
    add({
      countryId,
      ownerName: name,
      ownerType: "Profile",
      role: profile.currentRole || profile.kind,
      profileHref: `${countryHref(countryId)}/profile/${slugify(name)}`,
      searchContext: `${profile.country} ${profile.currentRole || ""}`
    });
  });

  Object.entries(foreignMinistryData).forEach(([countryId, ministry]) => {
    ministry.people.forEach((person) => add({
      countryId,
      ownerName: person.name,
      ownerType: "Foreign ministry",
      role: person.title,
      profileHref: `${countryHref(countryId)}/foreign-ministry/${slugify(person.name)}`,
      searchContext: `${ministry.shortName} ${ministry.ministryName} ${person.title}`
    }));
  });

  usCongressMembers.forEach((member) => add({
    countryId: "usa",
    ownerName: member.name,
    ownerType: "Congress",
    role: member.role,
    profileHref: `/country/usa/congress/${slugify(member.name)}`,
    searchContext: `${member.chamber} ${member.party} ${member.districtLabel} Congress`
  }));

  franceParliamentMembers.forEach((member) => add({
    countryId: "france",
    ownerName: member.name,
    ownerType: "Parliament",
    role: member.group?.shortLabel || "Deputy",
    profileHref: `/country/france/parliament/${member.slug || slugify(member.name)}`,
    searchContext: `French National Assembly ${member.group?.label || ""} ${member.constituency?.label || ""}`
  }));

  ukParliamentMembers.forEach((member) => add({
    countryId: "uk",
    ownerName: member.name,
    ownerType: "Parliament",
    role: member.party || "MP",
    profileHref: `/country/uk/parliament/${member.slug || slugify(member.name)}`,
    searchContext: `UK Parliament MP ${member.party || ""} ${member.constituency || ""}`
  }));

  iranParliamentMembers.forEach((member) => add({
    countryId: "iran",
    ownerName: member.name,
    ownerType: "Parliament",
    role: member.faction || "Majlis member",
    profileHref: `/country/iran/parliament/${member.slug || slugify(member.name)}`,
    searchContext: `Iran Majlis parliament ${member.faction || ""} ${member.province || ""}`
  }));

  turkishParliamentMembers.forEach((member) => add({
    countryId: "turkey",
    ownerName: member.name,
    ownerType: "Parliament",
    role: member.party || "TBMM member",
    profileHref: `/country/turkey/parliament/${member.slug || slugify(member.name)}`,
    searchContext: `TBMM Grand National Assembly Türkiye ${member.party || ""} ${member.province || ""}`
  }));

  [...usMediaAuthors, ...additionalMediaAuthors].forEach((author) => add({
    countryId: author.countryId || "usa",
    ownerName: author.name,
    ownerType: "Media",
    role: author.role || author.outlet,
    profileHref: `/country/${author.countryId || "usa"}/media/${slugify(author.name)}`,
    searchContext: `${author.outlet} journalist ${author.role || ""}`
  }));

  [...usThinkTankPeople, ...additionalThinkTankPeople].forEach((person) => add({
    countryId: person.countryId || "usa",
    ownerName: person.name,
    ownerType: "Think tank",
    role: person.role || person.organization,
    profileHref: `/country/${person.countryId || "usa"}/think-tanks/${slugify(person.name)}`,
    searchContext: `${person.organization} ${person.role || ""} think tank`
  }));

  return [...new Map(profiles.map((profile) => [profile.profileHref, profile])).values()]
    .sort((a, b) => priorityScore(a) - priorityScore(b) || a.countryId.localeCompare(b.countryId) || a.ownerName.localeCompare(b.ownerName));
}

async function discoverTarget(target) {
  const queries = buildQueries(target);
  const handles = new Map();
  const rawResults = [];

  const typeaheadQueries = buildTypeaheadQueries(target);
  for (const query of typeaheadQueries) {
    const users = await searchXTypeahead(query);
    rawResults.push({ method: "X typeahead", query, count: users.length });
    users.forEach((user, rank) => {
      const handle = `${user.screen_name || ""}`.replace(/^@/, "");
      if (!handle) return;
      const key = handle.toLowerCase();
      const entry = handles.get(key) || { handle, urls: [], titles: [], snippets: [], typeaheadUsers: [] };
      entry.urls.push(`https://x.com/${handle}`);
      entry.titles.push(user.name || handle);
      entry.snippets.push([user.description, user.location, user.ext_verified_type].filter(Boolean).join(" "));
      entry.typeaheadUsers.push({ ...user, rank, query });
      handles.set(key, entry);
    });
    await sleep(120);
  }

  if (args.webFallback) {
    for (const query of queries) {
      const results = await searchDuckDuckGo(query);
      rawResults.push({ method: "DuckDuckGo", query, count: results.length });
      for (const result of results) {
        const handle = extractXHandle(result.url);
        if (!handle) continue;
        const key = handle.toLowerCase();
        const entry = handles.get(key) || { handle, urls: [], titles: [], snippets: [], typeaheadUsers: [] };
        entry.urls.push(result.url);
        entry.titles.push(result.title);
        entry.snippets.push(result.snippet);
        handles.set(key, entry);
      }
    }
  } else {
    rawResults.push({ method: "DuckDuckGo", query: "skipped; pass --web-fallback to run web search", count: 0 });
  }

  const candidates = [];
  for (const candidate of handles.values()) {
    const profile = candidate.typeaheadUsers?.length
      ? profileFromTypeahead(candidate)
      : await fetchXProfile(candidate.handle);
    const scored = scoreCandidate(target, candidate, profile);
    candidates.push(scored);
    if (!candidate.typeaheadUsers?.length) await sleep(120);
  }

  candidates.sort((a, b) => b.confidence - a.confidence || a.handle.localeCompare(b.handle));
  const bestCandidate = candidates[0] || null;
  const status = bestCandidate?.confidence >= verifiedThreshold
    ? "verified"
    : bestCandidate?.confidence >= candidateThreshold
      ? "candidate"
      : "not-found";

  return {
    ...target,
    checkedAt: new Date().toISOString(),
    status,
    bestCandidate,
    candidates: candidates.slice(0, 6),
    queries: rawResults
  };
}

function profileFromTypeahead(candidate) {
  const user = candidate.typeaheadUsers?.sort((a, b) => a.rank - b.rank)[0] || {};
  return {
    ok: true,
    status: 200,
    handle: candidate.handle,
    title: `${user.name || candidate.handle} (@${candidate.handle}) / X`,
    ogTitle: `${user.name || candidate.handle} (@${candidate.handle})`,
    displayName: user.name || candidate.handle,
    description: user.description || "",
    url: `https://x.com/${candidate.handle}`
  };
}

function buildQueries(target) {
  const name = quote(target.ownerName);
  const context = target.searchContext ? ` ${quote(shortContext(target.searchContext))}` : "";
  const ownerHint = target.ownerType === "Parliament" ? " parliament" : target.ownerType === "Congress" ? " Congress" : "";
  return [
    `site:x.com ${name}${ownerHint}`,
    `site:twitter.com ${name}${ownerHint}`,
    `${name} X Twitter${context}`
  ];
}

function buildTypeaheadQueries(target) {
  const cleanedName = cleanSearchName(target.ownerName);
  const queries = [cleanedName];
  if (args.extraTypeaheadQueries) {
    if (target.ownerType === "Parliament" && target.countryId === "uk") queries.push(`${cleanedName} MP`);
    if (target.ownerType === "Congress") queries.push(`${cleanedName} Congress`);
    if (/minister|secretary|ambassador|envoy|spokesperson/i.test(target.role)) {
      queries.push(`${cleanedName} ${target.role.split(/\s+/).slice(0, 3).join(" ")}`);
    }
  }
  return [...new Set(queries.filter(Boolean))].slice(0, 2);
}

function cleanSearchName(value) {
  return `${value ?? ""}`
    .replace(/\b(the\s+)?rt\.?\s+hon\.?\b/gi, "")
    .replace(/\b(mr|mrs|ms|miss|dr|sir|dame|lord|lady)\.?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchXTypeahead(query) {
  const key = query.toLowerCase();
  if (cache.typeahead[key]) return cache.typeahead[key];
  if (!xConfig?.ct0 || !xConfig?.auth_token) {
    cache.typeahead[key] = [];
    return [];
  }

  const url = `https://x.com/i/api/1.1/search/typeahead.json?${new URLSearchParams({
    include_ext_is_blue_verified: "1",
    include_ext_verified_type: "1",
    include_ext_profile_image_shape: "1",
    q: query,
    src: "search_box",
    result_type: "users"
  })}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: xHeaders(), signal: AbortSignal.timeout(18000) });
    if (response.status === 429) {
      console.warn(`[TOR Phi] X typeahead rate limit for '${query}'.`);
      return [];
    }
    if (!response.ok) {
      console.warn(`[TOR Phi] X typeahead failed for '${query}': ${response.status}`);
      cache.typeahead[key] = [];
      return [];
    }
    const data = await response.json();
    const users = (data.users ?? [])
      .filter((user) => user?.screen_name)
      .map((user) => ({
        id: user.id_str || `${user.id || ""}`,
        name: user.name || "",
        screen_name: user.screen_name || "",
        description: user.description || "",
        location: user.location || "",
        followers_count: Number(user.followers_count || 0),
        friends_count: Number(user.friends_count || 0),
        statuses_count: Number(user.statuses_count || 0),
        verified: Boolean(user.verified),
        ext_is_blue_verified: Boolean(user.ext_is_blue_verified),
        ext_verified_type: user.ext_verified_type || "",
        is_protected: Boolean(user.is_protected),
        profile_image_url_https: user.profile_image_url_https || ""
      }));
    cache.typeahead[key] = users;
    return users;
    } catch (error) {
      if (attempt === 2) {
        console.warn(`[TOR Phi] X typeahead failed for '${query}': ${error.message}`);
        return [];
      }
      await sleep(750 + attempt * 1250);
    }
  }
  return [];
}

function xHeaders() {
  return {
    authorization: `Bearer ${xBearerToken}`,
    "x-csrf-token": xConfig.ct0,
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-client-language": "en",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    referer: "https://x.com/",
    cookie: `ct0=${xConfig.ct0}; auth_token=${xConfig.auth_token}`
  };
}

async function searchDuckDuckGo(query) {
  const key = query.toLowerCase();
  if (cache.searches[key]) return cache.searches[key];
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      headers: {
        "accept-language": "en-US,en;q=0.9",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      }
    });
    const html = await response.text();
    const results = parseDuckDuckGo(html);
    cache.searches[key] = results;
    return results;
  } catch (error) {
    console.warn(`[TOR Phi] Search failed for '${query}': ${error.message}`);
    cache.searches[key] = [];
    return [];
  }
}

function parseDuckDuckGo(html) {
  const anchors = [...html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const snippets = [...html.matchAll(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)].map((match) => cleanHtml(match[1]));
  return anchors.map((match, index) => {
    const href = decodeSearchHref(match[1].replace(/&amp;/g, "&"));
    return {
      url: href,
      title: cleanHtml(match[2]),
      snippet: snippets[index] || ""
    };
  }).filter((item) => /(^https?:\/\/)?(x|twitter)\.com\//i.test(item.url));
}

function decodeSearchHref(href) {
  try {
    const url = new URL(href.startsWith("//") ? `https:${href}` : href);
    const uddg = url.searchParams.get("uddg");
    return uddg ? decodeURIComponent(uddg) : href;
  } catch {
    return href;
  }
}

async function fetchXProfile(handle) {
  const key = handle.toLowerCase();
  if (cache.profiles[key]) return cache.profiles[key];
  const url = `https://x.com/${handle}`;
  try {
    const response = await fetch(url, {
      headers: {
        "accept-language": "en-US,en;q=0.9",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      }
    });
    const html = await response.text();
    const title = decodeEntities(html.match(/<title>(.*?)<\/title>/)?.[1] || "");
    const ogTitle = decodeEntities(html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || "");
    const ogDescription = decodeEntities(html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] || "");
    const displayName = extractDisplayName(ogTitle || title);
    const profile = {
      ok: response.ok,
      status: response.status,
      handle,
      title,
      ogTitle,
      displayName,
      description: ogDescription,
      url
    };
    cache.profiles[key] = profile;
    return profile;
  } catch (error) {
    return { ok: false, handle, error: error.message, url };
  }
}

function scoreCandidate(target, candidate, profile) {
  const targetName = normalizeName(target.ownerName);
  const displayName = normalizeName(profile.displayName || "");
  const profileText = normalizeName([profile.title, profile.ogTitle, profile.description].join(" "));
  const searchText = normalizeName([...candidate.titles, ...candidate.snippets].join(" "));
  const targetTokens = nameTokens(target.ownerName);
  const typeaheadUser = candidate.typeaheadUsers?.sort((a, b) => a.rank - b.rank)[0] || null;
  const typeaheadText = normalizeName([
    typeaheadUser?.name,
    typeaheadUser?.screen_name,
    typeaheadUser?.description,
    typeaheadUser?.location,
    typeaheadUser?.ext_verified_type
  ].join(" "));
  const roleSignal = roleMatches(target, profileText) || roleMatches(target, searchText);
  const handleSignal = handleLooksPersonalForName(candidate.handle, target.ownerName);
  const officeSignal = isLegislativeProfile(target) && hasLegislativeOfficeSignal(typeaheadText);
  const verificationSignal = Boolean(typeaheadUser?.ext_verified_type);
  let confidence = 0;
  const reasons = [];

  if (displayName && displayName === targetName) {
    confidence += 62;
    reasons.push("X profile display name exactly matches target");
  } else if (displayName && allImportantTokensPresent(targetTokens, displayName)) {
    confidence += 46;
    reasons.push("X profile display name contains target name tokens");
  } else if (containsNamePhrase(profileText, targetName)) {
    confidence += 34;
    reasons.push("X profile metadata contains target name");
  }

  if (typeaheadUser) {
    const typeaheadName = normalizeName(typeaheadUser.name || "");
    if (typeaheadName === targetName) {
      confidence += 22;
      reasons.push("X account search result has exact display name");
    } else if (allImportantTokensPresent(targetTokens, typeaheadName)) {
      confidence += 16;
      reasons.push("X account search result contains target name tokens");
    }
    if (typeaheadUser.rank === 0) {
      confidence += 8;
      reasons.push("X account search returned this handle as top result");
    }
    if (typeaheadUser.ext_verified_type) {
      confidence += typeaheadUser.ext_verified_type === "Government" ? 8 : 4;
      reasons.push(`X account has ${typeaheadUser.ext_verified_type} verification type`);
    } else if (typeaheadUser.ext_is_blue_verified || typeaheadUser.verified) {
      confidence += 3;
      reasons.push("X account is verified/blue-verified");
    }
    if (typeaheadUser.is_protected) {
      confidence -= 4;
      reasons.push("X account is protected");
    }
  }

  if (!typeaheadUser && containsNamePhrase(searchText, targetName)) {
    confidence += 15;
    reasons.push("Search result text contains target name");
  }
  if (!typeaheadUser && candidate.urls.some((url) => !/\/status\//i.test(url))) {
    confidence += 8;
    reasons.push("Search result includes profile URL");
  }
  if (roleSignal) {
    confidence += 10;
    reasons.push("Role or institution context matches");
  }
  if (officeSignal) {
    confidence += 10;
    reasons.push("Legislative office signal matches this profile type");
  }
  if (handleSignal) {
    confidence += 6;
    reasons.push("Handle contains a personal-name signal");
  }
  if (candidate.urls.length > 1) {
    confidence += Math.min(candidate.urls.length, 5);
    reasons.push("Multiple search hits point to same handle");
  }
  if (/fan|parody|archive|news|intel|updates|supporter|unofficial/i.test([profile.title, profile.description, candidate.handle].join(" "))) {
    confidence -= 30;
    reasons.push("Possible fan/news/parody/unofficial account");
  }
  if (isInstitutionalProfile(target) && !roleMatches(target, profileText) && !profileText.includes(targetName)) {
    confidence -= 12;
    reasons.push("Institutional context not visible in profile metadata");
  }
  if (typeaheadUser && confidence >= verifiedThreshold && !roleSignal && !handleSignal && !officeSignal && !verificationSignal) {
    confidence = Math.min(confidence, 68);
    reasons.push("Held below verified: exact-name match lacks role, verification, office, or personal-handle signal");
  }

  confidence = Math.max(0, Math.min(100, Math.round(confidence)));
  return {
    handle: candidate.handle,
    url: `https://x.com/${candidate.handle}`,
    confidence,
    status: confidence >= verifiedThreshold ? "verified" : confidence >= candidateThreshold ? "candidate" : "weak",
    source: typeaheadUser ? "X typeahead + profile title" : "DuckDuckGo + X profile title",
    profile,
    typeahead: typeaheadUser,
    reasons,
    searchHitCount: candidate.urls.length,
    sampleUrls: [...new Set(candidate.urls)].slice(0, 4)
  };
}

function mergeResults(previous, next) {
  const map = new Map(previous.map((item) => [item.profileHref, item]));
  next.forEach((item) => map.set(item.profileHref, item));
  return [...map.values()].sort((a, b) => priorityScore(a) - priorityScore(b) || a.countryId.localeCompare(b.countryId) || a.ownerName.localeCompare(b.ownerName));
}

function summarizeDiscovery(results, targets, missingTargets, verifiedAccounts) {
  const counts = results.reduce((items, item) => {
    items[item.status] = (items[item.status] || 0) + 1;
    return items;
  }, {});
  return {
    profiles: targets.length,
    missingProfiles: missingTargets.length,
    searchedProfiles: results.length,
    verified: counts.verified || 0,
    candidate: counts.candidate || 0,
    notFound: counts["not-found"] || 0,
    verifiedAccounts: verifiedAccounts.length,
    byStatus: counts
  };
}

function groupBy(items, key) {
  const groups = new Map();
  items.forEach((item) => {
    const value = item[key];
    groups.set(value, [...(groups.get(value) ?? []), item]);
  });
  return groups;
}

function priorityScore(target) {
  const typeScore = {
    "Country profile actor": 0,
    "Foreign ministry": 1,
    "Congress": 2,
    "Think tank": 3,
    "Media": 4,
    "Parliament": 5,
    "Profile": 6
  };
  const countryScore = { usa: 0, turkey: 1, france: 2, uk: 3, iran: 4 };
  return (typeScore[target.ownerType] ?? 9) * 10 + (countryScore[target.countryId] ?? 8);
}

function countryIdFromName(name) {
  const normalized = `${name ?? ""}`.toLowerCase();
  return countries.find((country) => country.name.toLowerCase() === normalized || country.id === normalized)?.id || null;
}

function extractXHandle(value) {
  if (!value) return "";
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value.replace(/^\/\//, "")}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!["x.com", "twitter.com"].includes(host)) return "";
    const handle = decodeURIComponent(url.pathname.split("/").filter(Boolean)[0] || "").replace(/^@/, "");
    if (!handle || /^(home|search|share|intent|i|hashtag|messages|settings|compose|notifications)$/i.test(handle)) return "";
    return handle;
  } catch {
    return "";
  }
}

function extractDisplayName(title) {
  return `${title ?? ""}`
    .replace(/\s+on X$/i, "")
    .replace(/\s+\/ X$/i, "")
    .replace(/\s+\(@[^)]+\).*$/i, "")
    .trim();
}

function roleMatches(target, text) {
  const value = normalizeName(text);
  const role = normalizeName(target.role);
  const context = normalizeName(target.searchContext);
  const terms = [
    ...role.split(" ").filter((term) => term.length > 3),
    ...context.split(" ").filter((term) => term.length > 4)
  ];
  return terms.some((term) => term && value.includes(term));
}

function isLegislativeProfile(target) {
  return target.ownerType === "Parliament" || target.ownerType === "Congress";
}

function hasLegislativeOfficeSignal(text) {
  return /\b(mp|mps|senator|representative|rep|congress|congressman|congresswoman|parliament|assembly|deputy|depute|senate|house|tbmm|meclis|milletvekili|majlis|assemblee|nationale)\b/.test(text);
}

function isInstitutionalProfile(target) {
  return /ministry|government|caucus|department|embassy|representation/i.test(`${target.ownerType} ${target.ownerName} ${target.role}`);
}

function allImportantTokensPresent(tokens, text) {
  const words = text.split(" ");
  return tokens.length > 0 && tokens.every((token) => words.includes(token));
}

function containsNamePhrase(text, phrase) {
  const words = text.split(" ");
  const tokens = phrase.split(" ").filter(Boolean);
  if (!tokens.length || words.length < tokens.length) return false;
  return words.some((_, index) => tokens.every((token, tokenIndex) => words[index + tokenIndex] === token));
}

function handleLooksPersonalForName(handle, name) {
  const handleText = normalizeName(handle).replace(/\s+/g, "");
  const tokens = nameTokens(name);
  if (!handleText || !tokens.length) return false;
  const last = tokens[tokens.length - 1];
  if (tokens.length === 1) return last?.length >= 4 && handleText.includes(last);
  const first = tokens[0];
  const fullNameRun = `${first || ""}${last || ""}`;
  const leadingInitialsRun = `${tokens.slice(0, -1).map((token) => token[0] || "").join("")}${last || ""}`;
  if (fullNameRun.length >= 6 && handleText.includes(fullNameRun)) return true;
  if (leadingInitialsRun.length >= 4 && handleText.includes(leadingInitialsRun)) return true;
  if (last?.length >= 4 && /^(sec|rep|sen|amb|mp|mep|minister|gov|dr)/.test(handleText) && handleText.includes(last)) return true;
  return false;
}

function nameTokens(name) {
  return normalizeName(name)
    .split(" ")
    .filter((token) => token.length > 2 && !["the", "for", "and", "bin", "van", "jr", "sr"].includes(token));
}

function normalizeName(value) {
  return `${value ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function shortContext(value) {
  return `${value ?? ""}`.split(/\s+/).filter(Boolean).slice(0, 8).join(" ");
}

function quote(value) {
  return `"${`${value ?? ""}`.replace(/"/g, "")}"`;
}

function countryHref(countryId) {
  return `/country/${encodeURIComponent(countryId)}`;
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

function cleanHtml(value) {
  return decodeEntities(`${value ?? ""}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeEntities(value) {
  return `${value ?? ""}`
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function readJson(url, fallback) {
  if (!existsSync(url)) return fallback;
  try {
    return JSON.parse(await fs.readFile(url, "utf8"));
  } catch {
    return fallback;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
