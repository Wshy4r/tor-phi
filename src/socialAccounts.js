import { actorProfiles, countries } from "./data.js";
import { foreignMinistryData } from "./foreignMinistries.js";
import { franceParliamentMembers } from "./franceParliament.js";
import { iranParliamentMembers } from "./iranParliament.js";
import { turkishParliamentMembers } from "./turkishParliament.js";
import { ukParliamentMembers } from "./ukParliament.js";
import { additionalMediaAuthors, additionalThinkTankPeople } from "./countryInfluenceNetworks.js";
import { usCongressMembers } from "./usCongress.js";
import { usCongressSocialByBioguide } from "./usCongressSocial.js";
import { usMediaAuthors } from "./usMedia.js";
import { usThinkTankPeople } from "./usThinkTanks.js";
import { discoveredSocialAccounts } from "./socialDiscoveredAccounts.js";

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

function countryHref(countryId) {
  return `/country/${encodeURIComponent(countryId)}`;
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

function personalNameTokens(name) {
  return normalizeName(name)
    .split(" ")
    .filter((token) => token.length > 2 && !["mr", "mrs", "ms", "dr", "sir", "dame", "the", "rt", "hon", "jr", "sr"].includes(token));
}

const institutionalHandleProfiles = {
  "usa:statedept": {
    ownerName: "U.S. Department of State",
    ownerType: "Foreign ministry",
    role: "Official ministry X account",
    profileHref: `${countryHref("usa")}/foreign-ministry`,
    label: "Official X"
  },
  "usa:whitehouse": {
    ownerName: "The White House",
    ownerType: "Government office",
    role: "Official White House X account",
    profileHref: countryHref("usa"),
    label: "Official X"
  },
  "usa:vp": {
    ownerName: "Office of the Vice President",
    ownerType: "Government office",
    role: "Official Vice President X account",
    profileHref: countryHref("usa"),
    label: "Official X"
  },
  "usa:usembassyturkey": {
    ownerName: "U.S. Embassy Turkiye",
    ownerType: "Foreign ministry",
    role: "Official U.S. embassy X account",
    profileHref: `${countryHref("usa")}/foreign-ministry`,
    label: "Official X"
  },
  "iran:irimfa_en": {
    ownerName: "Ministry of Foreign Affairs of Iran",
    ownerType: "Foreign ministry",
    role: "Official ministry X account",
    profileHref: `${countryHref("iran")}/foreign-ministry`,
    label: "Official X"
  }
};

const excludedSocialHandles = new Set([
  "usa:krg_usa"
]);

const excludedSocialAccountKeys = new Set([
  "usa:christopher h smith:csmith201269",
  "usa:chuck edwards:repedwards",
  "usa:clay fuller:theclayfuller",
  "usa:david mccormick:dm4senate",
  "usa:elissa slotkin:repslotkin"
]);

const congressSocialHandleOverrides = {
  E000246: "ChuckEdwards4NC",
  F000485: "Clay4MainStreet",
  M001243: "DaveMcCormickPA",
  S000522: null,
  S001208: "ElissaSlotkin"
};

function countryIdFromName(name) {
  const normalized = `${name ?? ""}`.toLowerCase();
  const country = countries.find((item) => item.name.toLowerCase() === normalized || item.id === normalized);
  return country?.id || null;
}

export function extractXHandle(value) {
  if (!value) return null;
  const raw = typeof value === "string" ? value : value.url || value.href || "";
  if (!raw) return null;

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "x.com" && host !== "twitter.com") return null;
    const handle = decodeURIComponent(url.pathname.split("/").filter(Boolean)[0] || "")
      .replace(/^x@/i, "")
      .replace(/^@/, "")
      .trim();
    if (!handle || /^(home|search|share|intent|i|hashtag|messages|settings|compose)$/i.test(handle)) return null;
    return handle;
  } catch {
    return null;
  }
}

function addAccount(accounts, seen, entry) {
  const handle = extractXHandle(entry.url);
  if (!handle || !entry.countryId || !entry.ownerName) return;
  if (excludedSocialHandles.has(`${entry.countryId}:${handle.toLowerCase()}`)) return;
  if (excludedSocialAccountKeys.has(`${entry.countryId}:${normalizeName(entry.ownerName)}:${handle.toLowerCase()}`)) return;

  const institutionalProfile = institutionalHandleProfiles[`${entry.countryId}:${handle.toLowerCase()}`];
  const accountEntry = institutionalProfile ? { ...entry, ...institutionalProfile } : entry;
  const key = institutionalProfile
    ? `${entry.countryId}:${handle.toLowerCase()}`
    : `${entry.countryId}:${handle.toLowerCase()}:${entry.ownerName.toLowerCase()}:${entry.profileHref || ""}`;
  if (seen.has(key)) return;
  seen.add(key);

  accounts.push({
    ...accountEntry,
    handle,
    url: `https://x.com/${handle}`
  });
}

function addSocialList(accounts, seen, { countryId, ownerName, ownerType, role, profileHref, social }) {
  (social ?? []).forEach((item) => {
    const label = Array.isArray(item) ? item[0] : item.label || "X";
    const url = Array.isArray(item) ? item[1] : item.url;
    addAccount(accounts, seen, { countryId, ownerName, ownerType, role, profileHref, label, url });
  });
}

function buildProfileTargets() {
  const profiles = [];
  const add = (entry) => profiles.push(entry);

  countries.forEach((country) => {
    country.actors.forEach((actor) => add({
      countryId: country.id,
      ownerName: actor.name,
      ownerType: "Country profile actor",
      role: actor.role,
      profileHref: `${countryHref(country.id)}/profile/${encodeURIComponent(slugify(actor.name))}`
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
      profileHref: `${countryHref(countryId)}/profile/${encodeURIComponent(slugify(name))}`
    });
  });

  Object.entries(foreignMinistryData).forEach(([countryId, ministry]) => {
    ministry.people.forEach((person) => add({
      countryId,
      ownerName: person.name,
      ownerType: "Foreign ministry",
      role: person.title,
      profileHref: `${countryHref(countryId)}/foreign-ministry/${encodeURIComponent(slugify(person.name))}`
    }));
  });

  usCongressMembers.forEach((member) => add({
    countryId: "usa",
    ownerName: member.name,
    ownerType: "Congress",
    role: member.role || member.chamber,
    profileHref: `${countryHref("usa")}/congress/${encodeURIComponent(slugify(member.name))}`
  }));

  franceParliamentMembers.forEach((member) => add({
    countryId: "france",
    ownerName: member.name,
    ownerType: "Parliament",
    role: member.role || member.group?.shortLabel || "Deputy",
    profileHref: `${countryHref("france")}/parliament/${encodeURIComponent(member.slug || slugify(member.name))}`
  }));

  ukParliamentMembers.forEach((member) => add({
    countryId: "uk",
    ownerName: member.name,
    ownerType: "Parliament",
    role: member.party || "MP",
    profileHref: `${countryHref("uk")}/parliament/${encodeURIComponent(member.slug || slugify(member.name))}`
  }));

  iranParliamentMembers.forEach((member) => add({
    countryId: "iran",
    ownerName: member.name,
    ownerType: "Parliament",
    role: member.faction || "Majlis member",
    profileHref: `${countryHref("iran")}/parliament/${encodeURIComponent(member.slug || slugify(member.name))}`
  }));

  turkishParliamentMembers.forEach((member) => add({
    countryId: "turkey",
    ownerName: member.name,
    ownerType: "Parliament",
    role: member.party || "TBMM member",
    profileHref: `${countryHref("turkey")}/parliament/${encodeURIComponent(member.slug || slugify(member.name))}`
  }));

  [...usMediaAuthors, ...additionalMediaAuthors].forEach((author) => add({
    countryId: author.countryId || "usa",
    ownerName: author.name,
    ownerType: "Media",
    role: author.role || author.outlet,
    profileHref: `${countryHref(author.countryId || "usa")}/media/${encodeURIComponent(slugify(author.name))}`
  }));

  [...usThinkTankPeople, ...additionalThinkTankPeople].forEach((person) => add({
    countryId: person.countryId || "usa",
    ownerName: person.name,
    ownerType: "Think tank",
    role: person.role || person.organization,
    profileHref: `${countryHref(person.countryId || "usa")}/think-tanks/${encodeURIComponent(slugify(person.name))}`
  }));

  return [...new Map(profiles.map((profile) => [profile.profileHref, profile])).values()];
}

function handleLooksPersonalForName(handle, name) {
  const handleText = normalizeName(handle).replace(/\s+/g, "");
  const tokens = personalNameTokens(name);
  if (!handleText || !tokens.length) return false;
  const last = tokens[tokens.length - 1];
  if (tokens.length === 1) return last && last.length >= 4 && handleText.includes(last);
  const first = tokens[0];
  const fullNameRun = `${first || ""}${last || ""}`;
  const leadingInitialsRun = `${tokens.slice(0, -1).map((token) => token[0] || "").join("")}${last || ""}`;
  if (fullNameRun.length >= 6 && handleText.includes(fullNameRun)) return true;
  if (leadingInitialsRun.length >= 4 && handleText.includes(leadingInitialsRun)) return true;
  if (last && last.length >= 4 && /^(sec|rep|sen|amb|mp|mep|minister|gov|dr)/.test(handleText) && handleText.includes(last)) return true;
  return false;
}

function addInheritedProfileAccounts(accounts, seen) {
  const byPerson = new Map();
  accounts.forEach((account) => {
    if (!account.profileHref || !handleLooksPersonalForName(account.handle, account.ownerName)) return;
    const key = `${account.countryId}:${normalizeName(account.ownerName)}`;
    byPerson.set(key, [...(byPerson.get(key) ?? []), account]);
  });

  buildProfileTargets().forEach((target) => {
    const knownForProfile = accounts.some((account) => account.profileHref === target.profileHref);
    if (knownForProfile) return;
    const key = `${target.countryId}:${normalizeName(target.ownerName)}`;
    const inherited = byPerson.get(key) ?? [];
    inherited.forEach((account) => addAccount(accounts, seen, {
      countryId: target.countryId,
      ownerName: target.ownerName,
      ownerType: target.ownerType,
      role: target.role || account.role,
      profileHref: target.profileHref,
      label: account.label || "Inherited X",
      url: account.url
    }));
  });
}

function buildSocialAccounts() {
  const accounts = [];
  const seen = new Set();

  countries.forEach((country) => {
    country.actors.forEach((actor) => {
      const profile = actorProfiles[actor.name];
      addSocialList(accounts, seen, {
        countryId: country.id,
        ownerName: actor.name,
        ownerType: "Country profile actor",
        role: actor.role,
        profileHref: `${countryHref(country.id)}/profile/${encodeURIComponent(slugify(actor.name))}`,
        social: profile?.social
      });
      addAccount(accounts, seen, {
        countryId: country.id,
        ownerName: actor.name,
        ownerType: "Country profile actor",
        role: actor.role,
        profileHref: `${countryHref(country.id)}/profile/${encodeURIComponent(slugify(actor.name))}`,
        label: "X",
        url: actor.url
      });
    });
  });

  Object.entries(actorProfiles).forEach(([name, profile]) => {
    const countryId = countryIdFromName(profile.country);
    if (!countryId) return;
    addSocialList(accounts, seen, {
      countryId,
      ownerName: name,
      ownerType: "Profile",
      role: profile.currentRole || profile.kind,
      profileHref: `${countryHref(countryId)}/profile/${encodeURIComponent(slugify(name))}`,
      social: profile.social
    });
  });

  Object.entries(foreignMinistryData).forEach(([countryId, ministry]) => {
    ministry.people.forEach((person) => {
      addSocialList(accounts, seen, {
        countryId,
        ownerName: person.name,
        ownerType: "Foreign ministry",
        role: person.title,
        profileHref: `${countryHref(countryId)}/foreign-ministry/${encodeURIComponent(slugify(person.name))}`,
        social: person.social
      });
    });
  });

  franceParliamentMembers.forEach((member) => {
    addSocialList(accounts, seen, {
      countryId: "france",
      ownerName: member.name,
      ownerType: "Parliament",
      role: member.role || member.group?.shortLabel || "Deputy",
      profileHref: `${countryHref("france")}/parliament/${encodeURIComponent(member.slug || slugify(member.name))}`,
      social: member.contact?.social
    });
  });

  ukParliamentMembers.forEach((member) => {
    addSocialList(accounts, seen, {
      countryId: "uk",
      ownerName: member.name,
      ownerType: "Parliament",
      role: member.party || "MP",
      profileHref: `${countryHref("uk")}/parliament/${encodeURIComponent(member.slug || slugify(member.name))}`,
      social: member.contact?.social
    });
  });

  iranParliamentMembers.forEach((member) => {
    addSocialList(accounts, seen, {
      countryId: "iran",
      ownerName: member.name,
      ownerType: "Parliament",
      role: member.faction || "Majlis member",
      profileHref: `${countryHref("iran")}/parliament/${encodeURIComponent(member.slug || slugify(member.name))}`,
      social: member.contact?.social || member.social
    });
  });

  turkishParliamentMembers.forEach((member) => {
    addSocialList(accounts, seen, {
      countryId: "turkey",
      ownerName: member.name,
      ownerType: "Parliament",
      role: member.party || "TBMM member",
      profileHref: `${countryHref("turkey")}/parliament/${encodeURIComponent(member.slug || slugify(member.name))}`,
      social: member.contact?.social || member.contacts?.social || member.social
    });
  });

  usCongressMembers.forEach((member) => {
    const social = usCongressSocialByBioguide[member.id]?.social;
    const override = Object.prototype.hasOwnProperty.call(congressSocialHandleOverrides, member.id)
      ? congressSocialHandleOverrides[member.id]
      : undefined;
    const twitter = override !== undefined ? override : social?.twitter;
    if (!twitter) return;
    addAccount(accounts, seen, {
      countryId: "usa",
      ownerName: member.name,
      ownerType: "Congress",
      role: member.role || member.chamber,
      profileHref: `${countryHref("usa")}/congress/${encodeURIComponent(slugify(member.name))}`,
      label: "Official legislative X",
      url: `https://x.com/${twitter}`
    });
  });

  [...usMediaAuthors, ...additionalMediaAuthors].forEach((author) => {
    addAccount(accounts, seen, {
      countryId: author.countryId || "usa",
      ownerName: author.name,
      ownerType: "Media",
      role: author.role || author.outlet,
      profileHref: `${countryHref(author.countryId || "usa")}/media/${encodeURIComponent(slugify(author.name))}`,
      label: "X",
      url: author.profileUrl
    });
  });

  [...usThinkTankPeople, ...additionalThinkTankPeople].forEach((person) => {
    addAccount(accounts, seen, {
      countryId: person.countryId || "usa",
      ownerName: person.name,
      ownerType: "Think tank",
      role: person.role || person.organization,
      profileHref: `${countryHref(person.countryId || "usa")}/think-tanks/${encodeURIComponent(slugify(person.name))}`,
      label: "X",
      url: person.url
    });
  });

  (discoveredSocialAccounts ?? [])
    .filter((account) => account.status === "verified" && Number(account.confidence || 0) >= 75)
    .forEach((account) => addAccount(accounts, seen, {
      countryId: account.countryId,
      ownerName: account.ownerName,
      ownerType: account.ownerType,
      role: account.role || "Discovered X account",
      profileHref: account.profileHref,
      label: account.label || "Discovered X",
      url: account.url
    }));

  addInheritedProfileAccounts(accounts, seen);

  return accounts.sort((a, b) => a.countryId.localeCompare(b.countryId) || a.ownerName.localeCompare(b.ownerName));
}

export const allSocialAccounts = buildSocialAccounts();

export function getSocialAccountsForCountry(countryId) {
  return allSocialAccounts.filter((account) => account.countryId === countryId);
}

export function getSocialAccountStats(countryId, snapshot) {
  const accounts = getSocialAccountsForCountry(countryId);
  const captured = new Set((snapshot?.users ?? []).map((user) => `${user.username ?? ""}`.toLowerCase()));
  const matched = accounts.filter((account) => captured.has(account.handle.toLowerCase()));
  const parliamentAccounts = accounts.filter((account) => account.ownerType === "Parliament" || account.ownerType === "Congress");
  const parliamentMatched = parliamentAccounts.filter((account) => captured.has(account.handle.toLowerCase()));
  return {
    accounts,
    matched,
    parliamentAccounts,
    parliamentMatched,
    accountCount: accounts.length,
    matchedCount: matched.length,
    parliamentAccountCount: parliamentAccounts.length,
    parliamentMatchedCount: parliamentMatched.length
  };
}
