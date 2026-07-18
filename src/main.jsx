import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowLeft,
  AtSign,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarClock,
  Database,
  Download,
  ExternalLink,
  FileText,
  FileSearch,
  Globe2,
  Landmark,
  LineChart,
  Link2,
  MessageSquareQuote,
  Network,
  Newspaper,
  Quote,
  Play,
  RefreshCw,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Radar,
  Square,
  UserRound,
  UserRoundCheck,
  UsersRound
} from "lucide-react";
import { actorProfiles, countries, questions } from "./data";
import { intelligenceFiles } from "./intelligenceData";
import { foreignMinistrySourceSnapshots } from "./foreignMinistrySourceSnapshots";
import { foreignMinistryData } from "./foreignMinistries";
import { foreignPolicyDocuments, getDocumentBySlug, getDocumentsForActorName } from "./foreignPolicyDocuments";
import { franceParliamentMembers, franceParliamentMetadata } from "./franceParliament";
import { iranParliamentMembers, iranParliamentMetadata } from "./iranParliament";
import { turkishParliamentMembers, turkishParliamentMetadata } from "./turkishParliament";
import { ukParliamentMembers, ukParliamentMetadata } from "./ukParliament";
import { usCongressMembers, usCongressMetadata } from "./usCongress";
import { mediaMethodology, usMediaAuthors, usMediaMentions, usMediaOutlets } from "./usMedia";
import { getVerifiedProfileImage } from "./profileImages";
import { getConfirmedWritingRecords } from "./profileResearch";
import {
  additionalMediaAuthors,
  additionalMediaMentions,
  additionalMediaOutlets,
  additionalThinkTankPeople,
  additionalThinkTanks
} from "./countryInfluenceNetworks";
import { dailyBriefSourceFeeds, dailyBriefTabs } from "./dailyBriefingData";
import { parliamentSessionMetadata, parliamentSessionsByCountry } from "./parliamentSessions";
import { thinkTankMethodology, usThinkTankPeople, usThinkTanks } from "./usThinkTanks";
import { socialArchiveSnapshot } from "./socialArchiveSnapshot";
import { socialProfileArchive } from "./socialProfileArchive";
import { getSocialAccountStats } from "./socialAccounts";
import "./styles.css";

const baseline = 50;
const allThinkTanks = [...usThinkTanks.map((tank) => ({ ...tank, countryId: tank.countryId || "usa" })), ...additionalThinkTanks];
const allThinkTankPeople = [...usThinkTankPeople.map((person) => ({ ...person, countryId: person.countryId || "usa" })), ...additionalThinkTankPeople];
const allMediaOutlets = [...usMediaOutlets.map((outlet) => ({ ...outlet, countryId: outlet.countryId || "usa" })), ...additionalMediaOutlets];
const allMediaAuthors = [...usMediaAuthors.map((author) => ({ ...author, countryId: author.countryId || "usa" })), ...additionalMediaAuthors];
const allMediaMentions = [...usMediaMentions.map((mention) => ({ ...mention, countryId: mention.countryId || "usa" })), ...additionalMediaMentions];
const thinkTankPeopleById = new Map(allThinkTankPeople.map((person) => [person.id, person]));
const thinkTankFocusOptions = ["All", "Very high proximity", "Kurdistan specific", "Iraq specific", "Restraint / withdrawal", "Trump / Republican network"];
const mediaAuthorsById = new Map(allMediaAuthors.map((author) => [author.id, author]));
const mediaOutletsById = new Map(allMediaOutlets.map((outlet) => [outlet.id, outlet]));
const mediaFramingOptions = ["All", "Favorable", "Critical", "Mixed", "Unscored"];
const watchlistFilterOptions = [
  { key: "all", label: "All Signals" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "high", label: "High Priority" },
  { key: "kurdistan", label: "Kurdistan Direct" },
  { key: "regional", label: "Iraq / Region" },
  { key: "official", label: "Official Records" },
  { key: "media", label: "Media" },
  { key: "think-tanks", label: "Think Tanks" },
  { key: "needs-research", label: "Needs Research" }
];
const franceParliamentMembersById = new Map(franceParliamentMembers.map((member) => [member.id, member]));
const ukParliamentMembersById = new Map(ukParliamentMembers.map((member) => [member.id, member]));
const iranParliamentMembersById = new Map(iranParliamentMembers.map((member) => [member.id, member]));
const turkishParliamentMembersById = new Map(turkishParliamentMembers.map((member) => [member.id, member]));
const turkishParliamentName = "Grand National Assembly of Turkiye";
const activityDataCache = new Map();
const congressArchiveCache = new Map();
const franceParliamentArchiveCache = new Map();
const nationalParliamentArchiveCache = new Map();
const initialParliamentSessionArchive = {
  metadata: parliamentSessionMetadata,
  sessionsByCountry: parliamentSessionsByCountry
};
const parliamentSessionPollMs = 60000;
const nationalParliamentData = {
  uk: {
    members: ukParliamentMembers,
    metadata: ukParliamentMetadata,
    byId: ukParliamentMembersById,
    label: "UK House of Commons",
    filterLabel: "Party",
    filterKey: "party",
    regionLabel: "Constituency",
    regionKey: "constituency"
  },
  iran: {
    members: iranParliamentMembers,
    metadata: iranParliamentMetadata,
    byId: iranParliamentMembersById,
    label: "Iranian Majlis",
    filterLabel: "Faction",
    filterKey: "faction",
    regionLabel: "Province",
    regionKey: "province"
  }
};
let tbmmKurdistanBriefsPromise = null;

function loadActivityData(file, fallback) {
  if (!file) return Promise.resolve({ ...fallback, records: [] });
  if (!activityDataCache.has(file)) {
    activityDataCache.set(
      file,
      fetch(file)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
        .catch(() => ({ ...fallback, records: [] }))
    );
  }
  return activityDataCache.get(file);
}

function loadTbmmKurdistanBrief(memberId) {
  if (!memberId) return Promise.resolve(null);
  if (!tbmmKurdistanBriefsPromise) {
    tbmmKurdistanBriefsPromise = fetch("/source/tbmm-kurdistan-briefs.json")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .catch(() => ({ briefs: {} }));
  }

  return tbmmKurdistanBriefsPromise.then((data) => data.briefs?.[memberId] ?? null);
}

function loadCongressArchive(memberId) {
  if (!memberId) return Promise.resolve(null);
  if (!congressArchiveCache.has(memberId)) {
    congressArchiveCache.set(
      memberId,
      fetch(`/source/us-congress-official/members/${memberId}.json`)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
        .catch(() => null)
    );
  }
  return congressArchiveCache.get(memberId);
}

function loadFranceParliamentArchive(memberId) {
  if (!memberId) return Promise.resolve(null);
  if (!franceParliamentArchiveCache.has(memberId)) {
    franceParliamentArchiveCache.set(
      memberId,
      fetch(`/source/france-parliament/members/${memberId}.json`)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
        .catch(() => null)
    );
  }
  return franceParliamentArchiveCache.get(memberId);
}

function loadNationalParliamentArchive(countryId, memberId) {
  if (!countryId || !memberId) return Promise.resolve(null);
  const key = `${countryId}:${memberId}`;
  if (!nationalParliamentArchiveCache.has(key)) {
    nationalParliamentArchiveCache.set(
      key,
      fetch(`/source/${countryId}-parliament/members/${memberId}.json`)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
        .catch(() => null)
    );
  }
  return nationalParliamentArchiveCache.get(key);
}

function useParliamentSessionArchive() {
  const [archive, setArchive] = useState(initialParliamentSessionArchive);

  useEffect(() => {
    let stopped = false;
    const controller = new AbortController();

    const refresh = () => {
      fetch(`/source/parliament-sessions/index.json?ts=${Date.now()}`, {
        cache: "no-store",
        signal: controller.signal
      })
        .then((response) => response.ok ? response.json() : null)
        .then((payload) => {
          if (stopped || !payload?.metadata || !Array.isArray(payload.sessions)) return;
          const nextArchive = {
            metadata: payload.metadata,
            sessionsByCountry: payload.sessions.reduce((groups, session) => {
              groups[session.countryId] = groups[session.countryId] || [];
              groups[session.countryId].push(session);
              return groups;
            }, {})
          };
          setArchive((current) => {
            const currentKey = `${current.metadata?.generatedAt || ""}:${current.metadata?.total || 0}`;
            const nextKey = `${nextArchive.metadata?.generatedAt || ""}:${nextArchive.metadata?.total || 0}`;
            return currentKey === nextKey ? current : nextArchive;
          });
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.warn("Parliament session refresh failed", error);
          }
        });
    };

    refresh();
    const timer = window.setInterval(refresh, parliamentSessionPollMs);

    return () => {
      stopped = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  return archive;
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

function countryHref(country) {
  return `/country/${encodeURIComponent(country.id)}`;
}

function countrySessionHref(country) {
  return `${countryHref(country)}/sessions`;
}

function documentHref(document) {
  return `${countryHref({ id: document.countryId })}/documents/${encodeURIComponent(document.slug || slugify(document.title))}`;
}

function App() {
  const [routeState, setRouteState] = useState(() => getRouteState());
  const [selectedId, setSelectedId] = useState(routeState.countryId);
  const pendingTabScrollY = useRef(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("briefing");
  const [searchTerm, setSearchTerm] = useState("");
  const [congressQuery, setCongressQuery] = useState("");
  const [congressChamber, setCongressChamber] = useState("All");
  const [congressState, setCongressState] = useState("All");
  const [franceParliamentQuery, setFranceParliamentQuery] = useState("");
  const [franceParliamentGroup, setFranceParliamentGroup] = useState("All");
  const [franceParliamentDepartment, setFranceParliamentDepartment] = useState("All");
  const [workspaceTool, setWorkspaceTool] = useState("");

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    function syncRouteFromLocation() {
      const nextRoute = getRouteState();
      setRouteState(nextRoute);
      setSelectedId(nextRoute.countryId);
      setWorkspaceTool("");
    }

    function handleDocumentClick(event) {
      const link = event.target.closest?.("a[href]");
      if (!link) return;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target || link.hasAttribute("download")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (!url.pathname.startsWith("/country/")) return;

      event.preventDefault();
      if (link.closest(".profile-subnav")) pendingTabScrollY.current = window.scrollY;
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl !== currentUrl) window.history.pushState({}, "", nextUrl);
      syncRouteFromLocation();
    }

    window.addEventListener("popstate", syncRouteFromLocation);
    document.addEventListener("click", handleDocumentClick);
    return () => {
      window.removeEventListener("popstate", syncRouteFromLocation);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  useLayoutEffect(() => {
    if (pendingTabScrollY.current === null) return undefined;
    const scrollY = pendingTabScrollY.current;
    pendingTabScrollY.current = null;
    let frame = 0;
    let timeout = 0;
    let attempts = 0;

    function restoreScroll() {
      window.scrollTo({ top: scrollY, left: window.scrollX });
      attempts += 1;
      if (attempts < 8) frame = requestAnimationFrame(restoreScroll);
    }

    restoreScroll();
    timeout = window.setTimeout(restoreScroll, 250);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [routeState]);

  const country = countries.find((item) => item.id === selectedId) ?? countries[0];
  const intelligenceFile = intelligenceFiles[country.id] ?? { agencies: [], documents: [], analysisAxes: [] };
  const score = useMemo(() => calculateScore(country), [country]);
  const answer = useMemo(() => makeAnswer(country, query || questions[0], mode, score), [country, query, mode, score]);
  const peopleSearchResults = useMemo(
    () => buildPeopleSearchResults(searchTerm, selectedId),
    [searchTerm, selectedId]
  );
  const routeDocument = routeState.documentSlug ? getDocumentBySlug(routeState.documentSlug) : null;
  const routeActor = routeState.foreignMinistryPerson
    ? makeForeignMinistryPersonActor(routeState.foreignMinistryCountryId, findForeignMinistryPerson(routeState.foreignMinistryCountryId, routeState.foreignMinistryPerson))
    : routeState.mediaPerson
    ? makeMediaAuthorActor(findMediaAuthor(routeState.countryId, routeState.mediaPerson), routeState.countryId)
    : routeState.thinkPerson
      ? makeThinkTankPersonActor(findThinkTankPerson(routeState.countryId, routeState.thinkPerson), routeState.countryId)
      : routeState.tbmmMember
      ? makeTurkishParliamentMemberActor(turkishParliamentMembersById.get(routeState.tbmmMember) || turkishParliamentMembers.find((member) => slugify(member.name) === routeState.tbmmMember))
      : routeState.franceParliamentMember
        ? makeFranceParliamentMemberActor(franceParliamentMembersById.get(routeState.franceParliamentMember) || franceParliamentMembers.find((member) => member.slug === routeState.franceParliamentMember || slugify(member.name) === routeState.franceParliamentMember))
        : routeState.nationalParliamentMember
          ? makeNationalParliamentMemberActor(routeState.nationalParliamentCountryId, findNationalParliamentMember(routeState.nationalParliamentCountryId, routeState.nationalParliamentMember))
          : routeState.bioguide
            ? makeCongressActor(usCongressMembers.find((member) => member.id === routeState.bioguide || slugify(member.name) === routeState.bioguide))
            : routeState.actorName
              ? findProfileActor(routeState.actorName, country)
              : null;

  if (routeDocument) {
    return <DocumentProfilePage document={routeDocument} country={countries.find((item) => item.id === routeDocument.countryId) ?? country} />;
  }

  if (routeActor && routeState.speechPage && routeActor.turkishParliamentMember) {
    return <SpeechReaderPage actor={routeActor} country={country} targetType={routeState.activityType} targetRecordIndex={routeState.recordIndex} />;
  }

  if (routeActor && routeState.recordsPage && routeActor.turkishParliamentMember) {
    return <ParliamentaryRecordsPage actor={routeActor} country={country} targetType={routeState.activityType} targetRecordIndex={routeState.recordIndex} />;
  }

  if (routeActor && routeState.lensPage) {
    return <KurdistanLensPage actor={routeActor} country={country} />;
  }

  if (routeActor && routeState.congressRecordsPage && routeActor.congressMember) {
    return <CongressRecordsPage actor={routeActor} country={country} />;
  }

  if (routeActor && routeState.recordsPage && routeActor.franceParliamentMember) {
    return <FranceParliamentRecordsPage actor={routeActor} country={country} />;
  }

  if (routeActor && routeState.recordsPage && routeActor.nationalParliamentMember) {
    return <NationalParliamentRecordsPage actor={routeActor} country={country} />;
  }

  if (routeActor && routeState.foreignMinistryRecordSlug && routeActor.foreignMinistryPerson) {
    return <ForeignMinistryRecordDetailPage actor={routeActor} country={country} recordSlug={routeState.foreignMinistryRecordSlug} />;
  }

  if (routeActor && routeState.recordsPage && routeActor.foreignMinistryPerson) {
    return <ForeignMinistryRecordsPage actor={routeActor} country={country} />;
  }

  if (routeState.congressListPage && country.id === "usa") {
    return <CongressDirectoryPage country={country} />;
  }

  if (routeState.foreignMinistryPage) {
    return <ForeignMinistryDirectoryPage country={country} />;
  }

  if (routeState.parliamentPage) {
    return <ParliamentDirectoryPage country={country} />;
  }

  if (routeState.sessionArchivePage) {
    return <CountrySessionArchivePage country={country} />;
  }

  if (routeState.thinkTankPage) {
    return <ThinkTankDirectoryPage country={country} />;
  }

  if (routeState.declassifiedPage) {
    return <DeclassifiedDirectoryPage country={country} file={intelligenceFile} />;
  }

  if (routeState.mediaPage) {
    return <MediaDirectoryPage country={country} />;
  }

  if (routeState.watchlistPage) {
    return <CountryWatchlistPage country={country} />;
  }

  if (routeState.influenceChainPage) {
    return <InfluenceChainPage country={country} />;
  }

  if (routeActor) {
    return <ActorProfilePage actor={routeActor} country={country} />;
  }

  const filteredCountries = countries.filter((item) => {
    const haystack = [
      item.name,
      item.region,
      item.posture,
      ...item.actors.map((actor) => actor.name),
      ...(item.id === "usa"
        ? [
            "congress members representatives senators legislative records committees votes"
          ]
        : []),
      ...[
            ...getThinkTankNetwork(item.id).tanks.map((tank) => [
              tank.name,
              tank.shortName,
              tank.type,
              tank.proximityLabel,
              tank.middleEastPolicy,
              tank.iraqPolicy,
              tank.kurdistanPolicy,
              ...tank.sources.map(([label]) => label)
            ].join(" ")),
            ...getThinkTankNetwork(item.id).people.map((person) => [
              person.name,
              person.organization,
              person.role,
              person.adminConnection,
              person.policySignal,
              ...person.expertise
            ].join(" ")),
            ...getMediaNetwork(item.id).outlets.map((outlet) => [
              outlet.name,
              outlet.shortName,
              outlet.type,
              outlet.favorabilityLabel,
              outlet.coveragePattern,
              outlet.rationale,
              ...outlet.watchTerms
            ].join(" ")),
            ...getMediaNetwork(item.id).authors.map((author) => [
              author.name,
              author.outlet,
              author.role,
              author.stanceSignal,
              ...author.beat
            ].join(" ")),
            ...getMediaNetwork(item.id).mentions.map((mention) => [
              mention.title,
              mention.framing,
              mention.summary,
              mention.evidenceNote,
              ...mention.topics
            ].join(" "))
          ],
      ...(item.id === "turkey"
        ? [
            turkishParliamentName,
            "parliament TBMM deputies legislative records speeches questions committees"
          ]
        : []),
      ...(item.id === "france"
        ? ["parliament National Assembly deputies vote positions mandates committees groups"]
        : []),
      ...(nationalParliamentData[item.id]
        ? [`parliament ${nationalParliamentData[item.id].label} members records votes questions source archive`]
        : []),
      ...(foreignMinistryData[item.id]
        ? [
            foreignMinistryData[item.id].ministryName,
            foreignMinistryData[item.id].shortName,
            foreignMinistryData[item.id].description,
            ...foreignMinistryData[item.id].people.map((person) => [
              person.name,
              person.title,
              person.bureau,
              person.category,
              person.importance,
              person.summary,
              person.kurdistanAssessment,
              ...(person.tags ?? [])
            ].join(" "))
          ]
        : []),
      ...item.evidence.map((evidence) => evidence.claim)
    ].join(" ").toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });
  const parliamentEntry = getParliamentEntry(country);
  const foreignMinistryEntry = getForeignMinistryEntry(country);
  const countryDocuments = getCountryDocuments(country.id);
  const countryCoverage = getCountryCoverageLanes({
    country,
    score,
    intelligenceFile,
    parliamentEntry,
    foreignMinistryEntry,
    documents: countryDocuments
  });
  function downloadProfile() {
    const payload = JSON.stringify({ country, score }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${country.id}-foreign-relations-profile.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Globe2 size={22} /></div>
          <div>
            <strong>TOR Φ</strong>
            <span>Foreign Relations Evidence Graph</span>
          </div>
        </div>

        <label className="search-box">
          <Search size={18} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search country, person, source..."
          />
        </label>

        {searchTerm.trim() ? (
          <div className="people-search-results">
            <div className="nav-label">People Results</div>
            {peopleSearchResults.length > 0 ? (
              peopleSearchResults.map((result) => (
                <a href={result.href} target="_blank" rel="noreferrer" key={result.key}>
                  <span>
                    <strong>{result.name}</strong>
                    <small>{result.type} / {result.detail}</small>
                  </span>
                  <UserRound size={15} />
                </a>
              ))
            ) : (
              <p>No people match yet.</p>
            )}
          </div>
        ) : null}

        <div className="nav-label">Strategic Countries</div>
        <div className="country-list">
          {filteredCountries.map((item) => (
            <button
              className={item.id === selectedId ? "country-button active" : "country-button"}
              key={item.id}
              onClick={() => {
                setSelectedId(item.id);
                setWorkspaceTool("");
                window.history.replaceState(null, "", countryHref(item));
              }}
            >
              <span>
                <strong>{item.name}</strong>
                <small>{item.priority} priority</small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>

        <div className="source-health">
          <ShieldCheck size={18} />
          <div>
            <strong>No black-box score</strong>
            <span>Every result is linked to people, evidence, confidence, and a visible calculation.</span>
          </div>
        </div>

        <SidebarSocialCaptureDock active={workspaceTool === "social-capture"} onOpen={() => setWorkspaceTool("social-capture")} />
      </aside>

      {workspaceTool === "social-capture" ? (
        <SocialCaptureWorkspace initialCountry={country} onBack={() => setWorkspaceTool("")} />
      ) : (
        <section className="workspace country-workspace">
          <CountryProfileHero
            country={country}
            score={score}
            parliamentEntry={parliamentEntry}
            foreignMinistryEntry={foreignMinistryEntry}
            documents={countryDocuments}
            intelligenceFile={intelligenceFile}
            onDownload={downloadProfile}
          />

          <CountryCommandDeck country={country} score={score} coverage={countryCoverage} />

          <CountryDossierTab
            country={country}
            score={score}
            answer={answer}
            query={query}
            setQuery={setQuery}
            mode={mode}
            setMode={setMode}
            parliamentEntry={parliamentEntry}
            foreignMinistryEntry={foreignMinistryEntry}
            documents={countryDocuments}
            coverage={countryCoverage}
            intelligenceFile={intelligenceFile}
          />
        </section>
      )}
    </main>
  );
}

function CountryProfileHero({ country, score, parliamentEntry, foreignMinistryEntry, documents, intelligenceFile, onDownload }) {
  const primaryActions = [
    parliamentEntry ? { label: getLegislatureShortLabel(country), href: parliamentEntry.href, icon: Landmark } : null,
    foreignMinistryEntry ? { label: "Foreign Ministry", href: foreignMinistryEntry.href, icon: Building2 } : null,
    { label: "Watchlist", href: `${countryHref(country)}/watchlist`, icon: Radar },
    getThinkTankNetwork(country.id).tanks.length ? { label: "Think Tanks", href: `${countryHref(country)}/think-tanks`, icon: Network } : null,
    getMediaNetwork(country.id).outlets.length ? { label: "Media", href: `${countryHref(country)}/media`, icon: Newspaper } : null,
    (intelligenceFile?.documents ?? []).length ? { label: "Declassified", href: `${countryHref(country)}/declassified`, icon: FileSearch } : null,
    { label: "Influence Chain", href: `${countryHref(country)}/influence-chain`, icon: LineChart },
    documents.length > 0 ? { label: "Books / Documents", href: "#country-documents", icon: BookOpenCheck } : null
  ].filter(Boolean);

  return (
    <header className="country-file-hero">
      <div className="country-hero-main">
        <p className="eyebrow">TOR Phi Country File</p>
        <div className="country-title-row">
          <h1>{country.name}</h1>
          <span className="country-trend-badge">{country.trend}</span>
        </div>
        <h2>{country.posture}</h2>
        <p>{country.summary}</p>

        <div className="country-meta-grid">
          <span>{country.region}</span>
          <span>{country.capital}</span>
          <span>{country.system}</span>
          <span>{country.priority} priority</span>
        </div>

        <div className="country-hero-actions">
          {primaryActions.map((action) => {
            const Icon = action.icon;

            return (
              <a href={action.href} key={action.label}>
                <Icon size={17} /> {action.label}
              </a>
            );
          })}
        </div>
      </div>

      <aside className="country-index-card">
        <LineChart size={24} />
        <span>Kurdistan Stance Index</span>
        <strong>{score.value}</strong>
        <div className="country-index-meter" aria-hidden="true">
          <i style={{ width: `${score.value}%` }} />
        </div>
        <small>{country.scoreLabel}</small>
        <button type="button" onClick={onDownload}>
          <Download size={16} /> Export JSON
        </button>
      </aside>
    </header>
  );
}

function CountryCommandDeck({ country, score, coverage }) {
  const activeCoverage = coverage.filter((item) => item.enabled).length;
  const stats = [
    {
      icon: Calculator,
      label: "Score Logic",
      value: `50 ${formatSigned(score.delta)}`,
      detail: "neutral baseline plus evidence-weighted movement"
    },
    {
      icon: Database,
      label: "Evidence",
      value: country.evidence.length.toLocaleString(),
      detail: "linked records in the country file"
    },
    {
      icon: UserRoundCheck,
      label: "Known Actors",
      value: getNamedActorCount(country).toLocaleString(),
      detail: "people and institutions across attached databases"
    },
    {
      icon: Radar,
      label: "Coverage",
      value: `${activeCoverage}/${coverage.length}`,
      detail: "active collection lanes for this country"
    }
  ];

  return (
    <section className="country-command-deck">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <article key={item.label}>
            <Icon size={20} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </article>
        );
      })}
    </section>
  );
}

function CountryDossierTab({
  country,
  score,
  answer,
  query,
  setQuery,
  mode,
  setMode,
  parliamentEntry,
  foreignMinistryEntry,
  documents,
  coverage,
  intelligenceFile
}) {
  return (
    <section className="country-dossier">
      <CountryDailyBrief country={country} documents={documents} intelligenceFile={intelligenceFile} />

      <div className="country-primary-grid">
        <CountryBriefingConsole
          answer={answer}
          query={query}
          setQuery={setQuery}
          mode={mode}
          setMode={setMode}
          score={score}
        />
        <CountryCoverageBoard coverage={coverage} />
      </div>

      <CountryDocumentShelf country={country} documents={documents} />

      <div className="country-content-grid">
        <CountryGovernmentPanel country={country} />
        <CountryActorsPanel country={country} />
      </div>

      <div className="country-content-grid country-content-grid-balanced">
        <CountryTimelinePanel country={country} />
        <CountryRelationshipPanel country={country} />
      </div>

      <CountryScoreEvidencePanel country={country} score={score} />

      <div className="country-content-grid country-content-grid-balanced">
        <CountryNarrativePanel country={country} />
        <CountryVerificationPanel country={country} />
      </div>
    </section>
  );
}

function CountryDailyBrief({ country, documents, intelligenceFile }) {
  const [activeFeed, setActiveFeed] = useState("global");
  const sessionArchive = useParliamentSessionArchive();
  const brief = useMemo(
    () => buildCountryDailyBrief(country, documents, intelligenceFile, sessionArchive),
    [country, documents, intelligenceFile, sessionArchive]
  );
  const currentTab = dailyBriefTabs.find((tab) => tab.key === activeFeed) ?? dailyBriefTabs[0];
  const lane = brief.lanes[activeFeed] ?? brief.lanes.global;
  const legislatureLabel = getLegislatureShortLabel(country);
  const matchedHandles = new Set(brief.accountStats.matched.map((account) => account.handle.toLowerCase()));
  const priorityAccounts = [
    ...brief.accountStats.matched,
    ...brief.accountStats.accounts.filter((account) => !matchedHandles.has(account.handle.toLowerCase()))
  ].slice(0, 12);

  return (
    <section className="daily-brief-section">
      <header className="daily-brief-header">
        <div>
          <p className="eyebrow">Daily Country Desk</p>
          <h3>{country.name} Daily Brief</h3>
          <p>{brief.statusLine}</p>
        </div>
        <div className="daily-brief-date-card">
          <CalendarClock size={22} />
          <strong>{brief.todayLabel}</strong>
          <span>{brief.todayCount} local item{brief.todayCount === 1 ? "" : "s"} stamped today</span>
          {brief.sessionStats?.generatedAt ? <small>sessions refreshed {formatDailyDateTime(brief.sessionStats.generatedAt)}</small> : null}
        </div>
      </header>

      <div className="daily-brief-stats">
        <span><strong>{brief.accountStats.accountCount.toLocaleString()}</strong> X accounts mapped</span>
        <span><strong>{brief.accountStats.matchedCount.toLocaleString()}</strong> captured by TOR Phi</span>
        <span><strong>{formatCoveragePair(brief.parliamentCoverage?.membersWithSocial, brief.parliamentCoverage?.memberCount)}</strong> {legislatureLabel} handles</span>
        <span><strong>{formatCoveragePair(brief.accountStats.parliamentMatchedCount, brief.accountStats.parliamentAccountCount)}</strong> {legislatureLabel} captured</span>
        <span><strong>{(brief.sessionStats?.importedCount ?? 0).toLocaleString()}</strong> session records</span>
        <span><strong>{(brief.sessionStats?.iraqCount ?? 0).toLocaleString()}</strong> Iraq/Kurdistan flags</span>
        <span><strong>{socialArchiveSnapshot.totals?.tweets?.toLocaleString?.() ?? 0}</strong> TOR Phi tweets</span>
        <span><strong>{socialArchiveSnapshot.auth?.twitterCookiesConfigured ? "Ready" : "Missing"}</strong> cookie status</span>
      </div>

      {brief.parliamentCoverage ? (
        <div className="daily-account-strip daily-coverage-strip">
          <strong>{legislatureLabel} feed</strong>
          <p>
            {brief.parliamentCoverage.membersWithSocial.toLocaleString()} of {brief.parliamentCoverage.memberCount.toLocaleString()} members have verified X handles from the current source layer. {brief.parliamentCoverage.source}
          </p>
        </div>
      ) : null}

      {priorityAccounts.length ? (
        <div className="daily-account-strip">
          <strong>Priority accounts</strong>
          <div>
            {priorityAccounts.map((account) => (
              <a
                className={matchedHandles.has(account.handle.toLowerCase()) ? "captured" : ""}
                href={account.profileHref || account.url}
                target="_blank"
                rel="noreferrer"
                key={`${account.ownerName}-${account.handle}`}
                title={`${account.ownerName} / ${account.ownerType}${matchedHandles.has(account.handle.toLowerCase()) ? " / captured" : " / scrape needed"}`}
              >
                @{account.handle}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="daily-brief-tabs" role="tablist" aria-label={`${country.name} daily brief filters`}>
        {dailyBriefTabs.map((tab) => (
          <button
            className={activeFeed === tab.key ? "active" : ""}
            key={tab.key}
            onClick={() => setActiveFeed(tab.key)}
            type="button"
            title={tab.description}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="daily-feed-context">
        <strong>{currentTab.label}</strong>
        <span>{currentTab.description}</span>
      </div>

      <div className="daily-feed-grid">
        <DailyFeedColumn
          icon={<Landmark size={18} />}
          title="Official Updates"
          empty="No matching official update in the local country file yet."
          items={lane.updates}
        />
        <DailyFeedColumn
          icon={<Newspaper size={18} />}
          title="Media Updates"
          empty="No matching media record is attached to this filter yet."
          items={lane.media}
        />
        <DailyFeedColumn
          icon={<FileSearch size={18} />}
          title="Reports And Declassified"
          empty="No matching report or declassified slot attached yet."
          items={lane.reports}
        />
        <DailyFeedColumn
          icon={<CalendarClock size={18} />}
          title={getLegislatureSessionLabel(country)}
          empty="No matching proceeding has been imported into the local session index yet."
          items={lane.sessions}
        />
        <section className="daily-feed-column">
          <div className="daily-feed-column-title">
            <AtSign size={18} />
            <h4>Tweets</h4>
          </div>
          {lane.tweets.length ? (
            <div className="daily-tweet-list">
              {lane.tweets.map((tweet) => <DailyTweetCard tweet={tweet} key={tweet.id} />)}
            </div>
          ) : (
            <p className="brief-empty">
              No captured tweet from this country's mapped accounts matches this filter yet. Run a deeper country capture, then refresh the social snapshot.
            </p>
          )}
        </section>
      </div>

      <div className="daily-watch-portals">
        <div>
          <strong>Watch Portals</strong>
          <span>Open these when refreshing today&apos;s file.</span>
        </div>
        <div>
          {lane.feeds.map(([label, url]) => (
            <a href={url} target="_blank" rel="noreferrer" key={`${label}-${url}`}>
              {label}<ExternalLink size={12} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function DailyFeedColumn({ icon, title, items, empty }) {
  return (
    <section className="daily-feed-column">
      <div className="daily-feed-column-title">
        {icon}
        <h4>{title}</h4>
      </div>
      {items.length ? (
        <div className="daily-feed-list">
          {items.map((item) => <DailyFeedCard item={item} key={`${item.type}-${item.title}-${item.url || item.date}`} />)}
        </div>
      ) : (
        <p className="brief-empty">{empty}</p>
      )}
    </section>
  );
}

const socialControlApiBase = "http://127.0.0.1:8787";

function SidebarSocialCaptureDock({ active, onOpen }) {
  return (
    <div className="sidebar-capture-dock">
      <button className={active ? "sidebar-capture-toggle active" : "sidebar-capture-toggle"} type="button" onClick={onOpen}>
        <Settings size={15} />
        <span>Social Capture</span>
        <small>{active ? "Open" : "Tool"}</small>
      </button>
    </div>
  );
}

function SocialCaptureWorkspace({ initialCountry, onBack }) {
  return (
    <section className="workspace social-capture-workspace">
      <header className="tool-workspace-hero">
        <button type="button" className="back-link button-back" onClick={onBack}>
          <ArrowLeft size={16} /> Back to {initialCountry.name} file
        </button>
        <div>
          <p className="eyebrow">TOR Phi Operations</p>
          <h1>Social Capture Control</h1>
          <p>
            Scrape mapped X/Twitter accounts by country, institution type, or specific handle.
            Fill Shallow captures accounts below the selected depth; Refresh Latest revisits accounts but the archive dedupes tweet IDs.
          </p>
        </div>
      </header>
      <SocialCaptureControl initialCountry={initialCountry} />
    </section>
  );
}

function SocialCaptureControl({ initialCountry }) {
  const [targetCountryId, setTargetCountryId] = useState(initialCountry?.id || "all");
  const [status, setStatus] = useState(null);
  const [githubStatus, setGithubStatus] = useState(null);
  const [githubStatusError, setGithubStatusError] = useState("");
  const [error, setError] = useState("");
  const [handle, setHandle] = useState("");
  const [ownerType, setOwnerType] = useState(getDefaultSocialOwnerType(initialCountry));
  const [accountStatusFilter, setAccountStatusFilter] = useState("all");
  const [accountQuery, setAccountQuery] = useState("");
  const [source, setSource] = useState("auto");
  const [pages, setPages] = useState(5);
  const [harvestMode, setHarvestMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const targetCountry = countries.find((item) => item.id === targetCountryId) ?? null;
  const activeJob = status?.activeJob;
  const lastJob = status?.lastJob;
  const displayedJob = activeJob || lastJob;
  const scopedCounts = getSocialControlScopedCounts(status, targetCountryId, ownerType);
  const accountRows = useMemo(
    () => filterSocialControlAccounts(status?.accounts ?? [], {
      countryId: targetCountryId,
      ownerType,
      status: accountStatusFilter,
      query: accountQuery
    }),
    [status?.accounts, targetCountryId, ownerType, accountStatusFilter, accountQuery]
  );
  const visibleAccounts = accountRows.slice(0, 160);
  const liveTweetTotal = status?.liveTotals?.tweets ?? status?.snapshot?.totals?.tweets ?? socialArchiveSnapshot.totals?.tweets ?? 0;

  useEffect(() => {
    setOwnerType(getDefaultSocialOwnerType(targetCountry));
  }, [targetCountryId]);

  const refreshStatus = () => {
    fetch(`${socialControlApiBase}/status`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((data) => {
        setStatus(data);
        setError("");
      })
      .catch((caught) => {
        setError(`Social control API is offline. Start TOR Phi with start-tor.command or run npm run social:control. ${caught.message}`);
      });
  };

  const refreshGithubStatus = () => {
    fetch("http://127.0.0.1:8788/github-status")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((data) => {
        setGithubStatus(data);
        setGithubStatusError("");
      })
      .catch((caught) => {
        setGithubStatusError(`GitHub status API is offline. Start TOR Phi with start-tor.command or run npm run github:status. ${caught.message}`);
      });
  };

  useEffect(() => {
    refreshStatus();
    const interval = window.setInterval(refreshStatus, activeJob ? 2500 : 8000);
    return () => window.clearInterval(interval);
  }, [activeJob?.id]);

  useEffect(() => {
    refreshGithubStatus();
    const interval = window.setInterval(refreshGithubStatus, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const startCapture = (mode, explicitHandle = "") => {
    const payload = {
      mode,
      country: targetCountryId,
      ownerType,
      handle: explicitHandle,
      source,
      pages,
      pause: source === "graphql" ? 1.2 : 0.7,
      harvestMode,
      stopAfterRateLimits: harvestMode ? 0 : 6
    };
    setLoading(true);
    fetch(`${socialControlApiBase}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((response) => response.json().then((data) => response.ok ? data : Promise.reject(new Error(data.error || `HTTP ${response.status}`))))
      .then((data) => {
        setStatus((previous) => ({ ...(previous ?? {}), activeJob: data.activeJob }));
        setError("");
      })
      .catch((caught) => setError(caught.message))
      .finally(() => setLoading(false));
  };

  const stopCapture = () => {
    fetch(`${socialControlApiBase}/stop`, { method: "POST" })
      .then(() => refreshStatus())
      .catch((caught) => setError(caught.message));
  };

  return (
    <section className="social-capture-panel">
      <div className="social-capture-header">
        <div>
          <strong>Tweet Capture Control</strong>
          <span>{targetCountry?.name || "All countries"} / {ownerType === "all" ? "all mapped accounts" : ownerType}</span>
        </div>
        <button type="button" onClick={refreshStatus}>
          <RefreshCw size={14} /> Status
        </button>
      </div>

      {error ? <p className="social-capture-error">{error}</p> : null}

      <div className="social-capture-stats">
        <span><strong>{scopedCounts.captured.toLocaleString()}</strong> captured</span>
        <span><strong>{scopedCounts.pending.toLocaleString()}</strong> pending</span>
        <span><strong>{scopedCounts.error.toLocaleString()}</strong> errors</span>
        <span><strong>{Number(liveTweetTotal).toLocaleString()}</strong> live archived tweets</span>
      </div>

      <GitHubSocialStatusPanel status={githubStatus} error={githubStatusError} onRefresh={refreshGithubStatus} />

      <div className="social-capture-tabs">
        <div>
          <strong>Countries</strong>
          <button type="button" className={targetCountryId === "all" ? "active" : ""} onClick={() => setTargetCountryId("all")}>All</button>
          {countries.map((item) => (
            <button type="button" className={targetCountryId === item.id ? "active" : ""} onClick={() => setTargetCountryId(item.id)} key={item.id}>
              {item.name}
            </button>
          ))}
        </div>
        <div>
          <strong>Account Types</strong>
          {getSocialOwnerTypeTabs(status?.accounts ?? [], targetCountryId).map((type) => (
            <button type="button" className={ownerType === type ? "active" : ""} onClick={() => setOwnerType(type)} key={type}>
              {type === "all" ? "All" : type}
            </button>
          ))}
        </div>
        <div>
          <strong>Status</strong>
          {["all", "captured", "pending", "error"].map((item) => (
            <button type="button" className={accountStatusFilter === item ? "active" : ""} onClick={() => setAccountStatusFilter(item)} key={item}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="social-capture-controls">
        <label>
          Country
          <select value={targetCountryId} onChange={(event) => setTargetCountryId(event.target.value)}>
            <option value="all">All countries</option>
            {countries.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>
          Scope
          <select value={ownerType} onChange={(event) => setOwnerType(event.target.value)}>
            <option value={getDefaultSocialOwnerType(targetCountry)}>{getDefaultSocialOwnerType(targetCountry)}</option>
            <option value="all">All mapped types</option>
            <option value="Congress">Congress</option>
            <option value="Parliament">Parliament</option>
            <option value="Foreign ministry">Foreign ministry</option>
            <option value="Think tank">Think tank</option>
            <option value="Media">Media</option>
          </select>
        </label>
        <label>
          Source
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="auto">Auto deep capture</option>
            <option value="graphql">Authenticated GraphQL, deepest</option>
            <option value="syndication">Syndication, shallow fallback</option>
          </select>
        </label>
        <label>
          Pages
          <input type="number" min="1" max="8" value={pages} onChange={(event) => setPages(Number(event.target.value) || 5)} />
        </label>
        <label>
          Specific handle
          <input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@repnickbegich" />
        </label>
        <label className="social-capture-check">
          <input type="checkbox" checked={harvestMode} onChange={(event) => setHarvestMode(event.target.checked)} />
          <span>Harvest mode</span>
          <small>Keep waiting/resuming through rate limits for bulk runs.</small>
        </label>
      </div>

      <div className="social-capture-actions">
        <button type="button" disabled={Boolean(activeJob) || loading} onClick={() => startCapture("missing")}>
          <Play size={14} /> Fill Shallow
        </button>
        <button type="button" disabled={Boolean(activeJob) || loading} onClick={() => startCapture("refresh")}>
          <RefreshCw size={14} /> Refresh Latest
        </button>
        <button type="button" disabled={Boolean(activeJob) || loading || !normalizeHandleInput(handle)} onClick={() => startCapture("refresh", normalizeHandleInput(handle))}>
          <AtSign size={14} /> Capture Handle
        </button>
        <button type="button" disabled={!activeJob} onClick={stopCapture}>
          <Square size={14} /> Stop
        </button>
      </div>

      {displayedJob?.parsed ? <SocialCaptureRuntimeStatus job={displayedJob} /> : null}

      <p className="social-capture-note">
        Harvest mode is for hundreds of accounts: it keeps waiting through X rate limits until you stop it. Fill Shallow targets accounts below the selected depth, so old 20-tweet captures can be deepened. Refresh Latest can revisit captured accounts, but duplicate tweet IDs are ignored by the SQLite archive.
        After every completed job, TOR Phi exports refreshed public JSON without forcing the app to reload; refresh the page when you want to load the new tweet cards into the visible dashboard.
      </p>

      <div className="social-account-browser">
        <div className="social-account-browser-head">
          <div>
            <strong>Mapped Accounts</strong>
            <span>{accountRows.length.toLocaleString()} matching account{accountRows.length === 1 ? "" : "s"} / showing {visibleAccounts.length.toLocaleString()}</span>
          </div>
          <label>
            <Search size={14} />
            <input value={accountQuery} onChange={(event) => setAccountQuery(event.target.value)} placeholder="Search handle, person, role..." />
          </label>
        </div>
        <div className="social-account-table">
          <div className="social-account-table-head">
            <span>Account</span>
            <span>Owner</span>
            <span>Scope</span>
            <span>Status</span>
            <span>Tweets</span>
            <span>Action</span>
          </div>
          {visibleAccounts.map((account) => (
            <article className="social-account-row" key={`${account.countryId}-${account.ownerType}-${account.handle}`}>
              <a href={account.url || `https://x.com/${account.handle}`} target="_blank" rel="noreferrer">@{account.displayHandle || account.handle}</a>
              <div>
                <strong>{account.ownerName || "Unassigned"}</strong>
                <small>{account.role || account.profileHref || "No local role attached"}</small>
              </div>
              <span>{getCountryName(account.countryId)} / {account.ownerType || "Account"}</span>
              <span className={`capture-status ${normalizeCaptureStatus(account.status)}`}>{normalizeCaptureStatus(account.status)}</span>
              <span>{Number(account.tweetCount || 0).toLocaleString()}</span>
              <button type="button" disabled={Boolean(activeJob) || loading} onClick={() => startCapture("refresh", account.handle)}>
                <AtSign size={13} /> Scrape
              </button>
              {account.lastError ? <p>{shortenText(account.lastError, 180)}</p> : null}
            </article>
          ))}
        </div>
      </div>

      {displayedJob ? (
        <div className="social-capture-job">
          <div>
            <strong>{activeJob ? "Running" : "Last job"}: {displayedJob.status}</strong>
            <span>{displayedJob.command}</span>
          </div>
          <pre>{displayedJob.output || "Waiting for output..."}</pre>
        </div>
      ) : null}

      {status?.recentErrors?.length ? (
        <div className="social-capture-errors">
          <strong>Recent capture errors</strong>
          {status.recentErrors.map((item) => (
            <span key={`${item.handle}-${item.lastError}`}>@{item.handle}: {shortenText(item.lastError, 110)}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function GitHubSocialStatusPanel({ status, error, onRefresh }) {
  const latest = status?.latest ?? null;
  const state = latest?.status === "completed"
    ? latest.conclusion || "completed"
    : latest?.status || (error ? "offline" : "unknown");
  const statusClass = state === "success" || state === "completed"
    ? "success"
    : state === "in_progress" || state === "queued"
      ? "running"
      : state === "offline" || state === "failure" || state === "cancelled"
        ? "error"
        : "neutral";

  return (
    <div className={`github-social-status ${statusClass}`}>
      <div>
        <strong>GitHub Online Scraper</strong>
        <span>{status?.repo || "Wshy4r/tor-phi"} / {status?.workflow || "TOR Phi Social Harvest"}</span>
      </div>
      <div className="github-social-status-grid">
        <span><strong>{formatGithubRunState(state)}</strong> latest run</span>
        <span><strong>{latest?.event || "unknown"}</strong> trigger</span>
        <span><strong>{latest?.updatedAt ? formatDailyDateTime(latest.updatedAt) : "not checked"}</strong> updated</span>
        <span><strong>{status?.checkedAt ? formatDailyDateTime(status.checkedAt) : "not checked"}</strong> local check</span>
      </div>
      {error ? <p>{error}</p> : null}
      {latest?.url ? (
        <a href={latest.url} target="_blank" rel="noreferrer">
          Open latest GitHub run <ExternalLink size={13} />
        </a>
      ) : (
        <a href="https://github.com/Wshy4r/tor-phi/actions" target="_blank" rel="noreferrer">
          Open GitHub Actions <ExternalLink size={13} />
        </a>
      )}
      <button type="button" onClick={onRefresh}>
        <RefreshCw size={13} /> Check GitHub now
      </button>
    </div>
  );
}

function formatGithubRunState(state) {
  if (!state) return "Unknown";
  return `${state}`.replace(/_/g, " ");
}

function SocialCaptureRuntimeStatus({ job }) {
  const parsed = job.parsed || {};
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!parsed.waitUntil) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [parsed.waitUntil]);

  const waitMs = parsed.waitUntil ? Math.max(new Date(parsed.waitUntil).getTime() - now, 0) : 0;
  const waitSeconds = Math.ceil(waitMs / 1000);
  const pct = parsed.total ? Math.min(100, Math.round((Number(parsed.completed || 0) / parsed.total) * 100)) : 0;

  return (
    <div className={parsed.isRateLimited ? "social-runtime-status rate-limited" : "social-runtime-status"}>
      <div>
        <strong>{parsed.isRateLimited ? "X rate limit active" : "Capture progress"}</strong>
        <span>
          {parsed.total
            ? `${Number(parsed.completed || 0).toLocaleString()} completed / ${parsed.total.toLocaleString()} total / ${Number(parsed.remaining || 0).toLocaleString()} remaining`
            : "Waiting for account progress..."}
        </span>
      </div>
      {parsed.total ? (
        <div className="social-runtime-meter">
          <span style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      <div className="social-runtime-grid">
        <span><strong>{parsed.currentHandle ? `@${parsed.currentHandle}` : "None yet"}</strong> current account</span>
        <span><strong>{parsed.rateLimitCounter || "0"}</strong> rate-limit count</span>
        <span><strong>{parsed.waitUntil ? (waitSeconds > 0 ? `${waitSeconds}s` : "ready") : "none"}</strong> wait left</span>
        <span><strong>{parsed.waitUntil ? formatDailyDateTime(parsed.waitUntil) : "not scheduled"}</strong> retry time</span>
      </div>
      {parsed.stoppedForRateLimit ? (
        <p>Stopped because the configured consecutive rate-limit limit was reached. Start the same Fill Shallow job later; accounts already at the selected depth will be skipped.</p>
      ) : null}
    </div>
  );
}

function getDefaultSocialOwnerType(country) {
  if (!country) return "all";
  return country.id === "usa" ? "Congress" : ["france", "uk", "turkey", "iran"].includes(country.id) ? "Parliament" : "all";
}

function getSocialOwnerTypeTabs(accounts, countryId) {
  const types = [...new Set(accounts
    .filter((account) => countryId === "all" || account.countryId === countryId)
    .map((account) => account.ownerType)
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  return ["all", ...types];
}

function filterSocialControlAccounts(accounts, filters) {
  const query = normalizeSearchText(filters.query);
  return accounts.filter((account) => {
    if (filters.countryId !== "all" && account.countryId !== filters.countryId) return false;
    if (filters.ownerType !== "all" && account.ownerType !== filters.ownerType) return false;
    if (filters.status !== "all" && normalizeCaptureStatus(account.status) !== filters.status) return false;
    if (!query) return true;
    const haystack = normalizeSearchText([
      account.handle,
      account.displayHandle,
      account.ownerName,
      account.ownerType,
      account.countryId,
      account.role,
      account.profileHref,
      account.lastError
    ].join(" "));
    return haystack.includes(query);
  });
}

function normalizeCaptureStatus(status) {
  if (status === "captured" || status === "search-captured") return "captured";
  if (status === "error") return "error";
  return "pending";
}

function getCountryName(countryId) {
  return countries.find((country) => country.id === countryId)?.name || countryId || "Unknown";
}

function normalizeHandleInput(value) {
  return `${value || ""}`.trim().replace(/^@/, "");
}

function getSocialControlScopedCounts(status, countryId, ownerType) {
  const rows = status?.accountRows ?? [];
  const counts = { captured: 0, pending: 0, error: 0 };
  rows.forEach((row) => {
    if (countryId !== "all" && row.countryId !== countryId) return;
    if (ownerType !== "all" && row.ownerType !== ownerType) return;
    const key = row.status === "captured" || row.status === "search-captured" ? "captured" : row.status === "error" ? "error" : "pending";
    counts[key] += Number(row.count || 0);
  });
  return counts;
}

function DailyFeedCard({ item }) {
  return (
    <article className="daily-feed-card">
      <div className="daily-feed-meta">
        <span>{item.type}</span>
        <time>{formatDailyDate(item.date)}</time>
      </div>
      <strong>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> : item.title}</strong>
      <p>{shortenText(item.summary, 210)}</p>
      <small>{item.priority ? `${item.priority} / ${item.source}` : item.source}</small>
      {item.sourceUrl ? (
        <a className="daily-original-source" href={item.sourceUrl} target="_blank" rel="noreferrer">
          Original source <ExternalLink size={12} />
        </a>
      ) : null}
    </article>
  );
}

function DailyTweetCard({ tweet }) {
  return (
    <article className="daily-tweet-card">
      <div className="daily-feed-meta">
        <span>
          {tweet.profileHref ? <a className="daily-tweet-owner" href={tweet.profileHref}>@{tweet.username}</a> : `@${tweet.username}`}
        </span>
        <time>{formatDailyDate(tweet.createdAt)}</time>
      </div>
      {tweet.ownerName ? <strong>{tweet.ownerName}{tweet.ownerType ? ` / ${tweet.ownerType}` : ""}</strong> : null}
      <p>{shortenText(tweet.text, 220)}</p>
      <div className="daily-tweet-footer">
        <span>{(tweet.tags ?? []).slice(0, 3).join(" / ") || tweet.tweetType || "tweet"}</span>
        {tweet.url ? <a href={tweet.url} target="_blank" rel="noreferrer">Open tweet<ExternalLink size={12} /></a> : null}
      </div>
    </article>
  );
}

function SocialProfileArchivePanel({ archive, actor, country, congressArchive }) {
  const readout = buildPersonSocialPoliticalReadout({ archive, actor, country, congressArchive });
  const mentions = archive.kurdistanMentions ?? [];
  const recentTweets = archive.recentTweets ?? [];
  const visibleRecent = mentions.length ? recentTweets.filter((tweet) => !mentions.some((mention) => mention.id === tweet.id)).slice(0, 4) : recentTweets.slice(0, 6);

  return (
    <div className="social-profile-archive">
      <div className="social-archive-stats">
        <div>
          <strong>{formatStatNumber(archive.tweetCount)}</strong>
          <span>captured tweets</span>
        </div>
        <div>
          <strong>{formatStatNumber(archive.kurdistanMentionCount)}</strong>
          <span>Kurdistan social hits</span>
        </div>
        <div>
          <strong>{archive.latestTweetAt ? formatDailyDate(archive.latestTweetAt) : "Not captured"}</strong>
          <span>latest captured post</span>
        </div>
      </div>

      {readout ? (
        <div className="person-readout">
          <div className="person-readout-header">
            <div>
              <span>Person analysis</span>
              <strong>{readout.headline}</strong>
            </div>
            <small>{readout.confidence}</small>
          </div>
          {readout.paragraphs.map((paragraph, index) => (
            <p key={`${archive.key}-readout-${index}`}>{paragraph}</p>
          ))}
          {readout.issueLanes.length > 0 ? (
            <div className="person-issue-grid">
              {readout.issueLanes.slice(0, 6).map((lane) => (
                <article key={`${archive.key}-${lane.key}`}>
                  <div>
                    <strong>{lane.label}</strong>
                    <span>{lane.count} signal{lane.count === 1 ? "" : "s"}</span>
                  </div>
                  <p>{lane.reading}</p>
                  {lane.evidence ? (
                    lane.evidence.url ? (
                      <a href={lane.evidence.url} target="_blank" rel="noreferrer">
                        {lane.evidence.label}<ExternalLink size={12} />
                      </a>
                    ) : (
                      <small>{lane.evidence.label}</small>
                    )
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
          <div className="person-readout-footnotes">
            {readout.notes.map((note) => <span key={`${archive.key}-${note}`}>{note}</span>)}
          </div>
        </div>
      ) : null}

      <div className="social-archive-assessment">
        <strong>{archive.tweetCount ? "Captured X/Twitter evidence" : getSocialCaptureStatusTitle(archive)}</strong>
        <p>
          {archive.tweetCount
            ? "Captured posts are treated as one evidence stream beside votes, committees, official records, books, speeches, interviews, and media records. Kurdistan Lens uses only the posts that actually match Lens terms."
            : getSocialCaptureStatusMessage(archive)}
        </p>
        {archive.assessment?.whatItWasLike && mentions.length > 0 ? <p>{archive.assessment.whatItWasLike}</p> : null}
      </div>

      <div className="social-account-strip">
        {(archive.accounts ?? []).map((account) => (
          <a href={account.url} target="_blank" rel="noreferrer" key={`${archive.key}-${account.handle}`}>
            <AtSign size={13} />
            <span>@{account.handle}</span>
            <small>{account.status || "pending"}</small>
          </a>
        ))}
      </div>

      {mentions.length > 0 ? (
        <div className="social-tweet-block">
          <h4>Kurdistan / Kurds / Northern Iraq Mentions</h4>
          <SocialTweetList tweets={mentions.slice(0, 8)} />
        </div>
      ) : (
        <p className="empty-note">No captured post in this profile window matches Kurdistan Lens terms yet. This only limits the social-media part of Kurdistan Lens; the broader person assessment still uses committees, votes, official records, authored texts, speeches, and other imported sources.</p>
      )}

      {visibleRecent.length > 0 ? (
        <div className="social-tweet-block">
          <h4>Latest Captured Posts</h4>
          <SocialTweetList tweets={visibleRecent} />
        </div>
      ) : null}

      {archive.archiveUrl ? (
        <a className="social-archive-local-link" href={archive.archiveUrl} target="_blank" rel="noreferrer">
          Open local archive JSON <ArrowRight size={14} />
        </a>
      ) : null}
    </div>
  );
}

function SocialTweetList({ tweets }) {
  return (
    <div className="social-tweet-list">
      {tweets.map((tweet) => (
        <article id={`social-tweet-${tweet.id}`} className="social-tweet-card" key={tweet.id}>
          <div className="social-tweet-meta">
            <span>@{tweet.username || tweet.handle}</span>
            <time>{formatDailyDate(tweet.createdAt)}</time>
          </div>
          <p>{tweet.text}</p>
          <div className="social-tweet-tags">
            {(tweet.kurdistanTerms?.length ? tweet.kurdistanTerms : tweet.frames ?? []).slice(0, 5).map((tag) => <span key={`${tweet.id}-${tag}`}>{tag}</span>)}
          </div>
          <a href={tweet.url} target="_blank" rel="noreferrer">
            Open tweet <ExternalLink size={12} />
          </a>
        </article>
      ))}
    </div>
  );
}

function getSocialCaptureError(archive) {
  return (archive?.accounts ?? []).find((account) => account.lastError)?.lastError || "";
}

function getSocialCaptureStatusTitle(archive) {
  const error = getSocialCaptureError(archive);
  if (/429|too many requests|rate limit/i.test(error)) return "Mapped X/Twitter account, rate-limited by X";
  if (error) return "Mapped X/Twitter account, capture error";
  return "Mapped X/Twitter account, capture pending";
}

function getSocialCaptureStatusMessage(archive) {
  const error = getSocialCaptureError(archive);
  if (/429|too many requests|rate limit/i.test(error)) {
    return "No tweet text has been captured into this profile window yet because the latest capture attempt was blocked by X rate limits. That is a collection-status problem, not a political conclusion; TOR Phi should use official records now and retry social capture after cooldown.";
  }
  if (error) {
    return `No tweet text has been captured into this profile window yet because the latest capture attempt failed: ${error}. TOR Phi should still analyze the person from official records while social capture is retried.`;
  }
  return "No tweet text has been captured into this profile window yet. That does not mean the person has no positions; it means TOR Phi should analyze them from official records now and refresh the social archive for their public-post history.";
}

const personIssueCatalog = [
  {
    key: "energy",
    label: "Energy, resources, and infrastructure",
    pattern: /energy|oil|gas|pipeline|mineral|mining|natural resources|drilling|lng|electric|grid|infrastructure|transportation|rail|aviation|maritime|hazardous materials/i,
    reading: "The record points to material economic power: energy, resources, infrastructure, transportation, or pipeline policy. For foreign-policy work, this often matters through sanctions, export routes, strategic minerals, energy security, and district economic interests."
  },
  {
    key: "security",
    label: "Defense, security, and oversight",
    pattern: /defense|military|security|border|terror|isis|war|veteran|intelligence|surveillance|oversight|investigation|homeland|coast guard|china|russia|iran|sanction/i,
    reading: "The record has a security or oversight center of gravity. That usually means foreign files are filtered through threat, accountability, military posture, border control, sanctions, or institutional oversight."
  },
  {
    key: "foreign",
    label: "Foreign policy and alliances",
    pattern: /foreign|state department|diplomacy|alliance|nato|ukraine|israel|gaza|iraq|syria|turkey|turkiye|kurd|krg|middle east|aid|embassy|human rights|religious freedom/i,
    reading: "The record touches foreign-policy or alliance language. These signals are the best starting points for assessing whether the person thinks internationally or only engages foreign files when they affect domestic politics."
  },
  {
    key: "fiscal",
    label: "Spending, regulation, and government power",
    pattern: /budget|spending|tax|debt|deficit|appropriation|regulation|federal|agency|bureaucracy|waste|fraud|accountability|shutdown|rule/i,
    reading: "The record emphasizes government scope, spending, regulation, or accountability. This helps predict whether they will approach foreign aid, sanctions, agencies, and international programs through a cost-control or oversight lens."
  },
  {
    key: "local",
    label: "District and constituent service",
    pattern: /district|alaska|community|constituent|local|jobs|fish|fisheries|native|tribal|rural|veterans|airport|port|water|disaster|grant/i,
    reading: "The evidence is strongly local or constituent-facing. That does not make the person irrelevant internationally; it means foreign-policy positions may be activated when they connect to district economics, local identity, security, veterans, or resource questions."
  },
  {
    key: "social",
    label: "Culture, rights, and social controversy",
    pattern: /abortion|gender|woke|education|school|crime|police|second amendment|gun|religious|faith|speech|censorship|immigration|illegal|cartel|fentanyl/i,
    reading: "The record includes culture-war, rights, crime, immigration, or public-order signals. These can be controversy indicators and may shape how the person frames refugees, minorities, international human-rights issues, or domestic security debates."
  },
  {
    key: "technology",
    label: "Technology, science, and modernization",
    pattern: /science|space|technology|ai|cyber|research|innovation|nasa|weather|environmental research|laborator|broadband|data/i,
    reading: "The record shows science, technology, research, or modernization relevance. This can matter for strategic competition, cyber policy, energy innovation, space, infrastructure, and long-term state capacity."
  }
];

function buildPersonSocialPoliticalReadout({ archive, actor, country, congressArchive }) {
  if (!archive && !actor) return null;
  const member = actor?.congressMember;
  const tweets = archive?.recentTweets ?? [];
  const mentions = archive?.kurdistanMentions ?? [];
  const committees = member?.committees ?? [];
  const votes = congressArchive?.houseClerk?.recentVotes ?? [];
  const socialInputs = tweets.map((tweet) => ({
    type: "tweet",
    text: `${tweet.text ?? ""} ${(tweet.tags ?? []).join(" ")} ${(tweet.frames ?? []).join(" ")}`,
    label: tweet.text ? `Post: ${shortenText(tweet.text, 72)}` : `@${tweet.username || "account"} post`,
    url: tweet.url
  }));
  const committeeInputs = committees.map((committee) => ({
    type: "committee",
    text: [committee.name, committee.title, committee.type, committee.jurisdiction, committee.relevanceReason].filter(Boolean).join(" "),
    label: committee.title ? `${committee.title} / ${committee.name}` : committee.name,
    url: committee.url
  }));
  const voteInputs = votes.map((vote) => ({
    type: "vote",
    text: [vote.billNumber, vote.billTitle, vote.vote, vote.status, vote.date].filter(Boolean).join(" "),
    label: `${vote.billNumber || "Vote"}: ${shortenText(vote.billTitle || vote.vote || "House vote", 80)}`,
    url: vote.sourceUrl
  }));
  const inputs = [...socialInputs, ...committeeInputs, ...voteInputs];
  const issueLanes = personIssueCatalog.map((lane) => {
    const matches = inputs.filter((input) => lane.pattern.test(input.text));
    return {
      ...lane,
      count: matches.length,
      evidence: matches[0] ? {
        label: matches[0].label,
        url: matches[0].url
      } : null,
      sourceTypes: [...new Set(matches.map((match) => match.type))]
    };
  }).filter((lane) => lane.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const topLane = issueLanes[0];
  const secondLane = issueLanes[1];
  const capturedTweetCount = archive?.tweetCount ?? 0;
  const capturedWindowCount = tweets.length;
  const recentVoteCount = votes.length;
  const billStatus = getCongressBillImportStatus(congressArchive);
  const committeeLeadership = committees.filter((committee) => committee.title).slice(0, 3);
  const confidence = capturedTweetCount > 0 && recentVoteCount > 0
    ? "Medium confidence: social posts and official vote rows are both present"
    : capturedTweetCount > 0
      ? "Low-medium confidence: captured posts are present, official bill/vote depth is limited"
      : recentVoteCount > 0 || committees.length > 0
        ? "Low-medium confidence: official role/committee/vote evidence is present, social capture is missing"
        : "Low confidence: mapped account exists but local evidence is thin";
  const headline = makePersonReadoutHeadline(actor, topLane, secondLane, capturedTweetCount, recentVoteCount);
  const paragraphs = [
    makePersonReadoutSocialParagraph(archive, mentions, capturedWindowCount),
    makePersonReadoutInstitutionParagraph(actor, country, committees, committeeLeadership, recentVoteCount, billStatus),
    makePersonReadoutInterpretationParagraph(actor, topLane, secondLane, issueLanes)
  ].filter(Boolean);
  const notes = [
    capturedTweetCount ? `${capturedTweetCount.toLocaleString()} captured tweet${capturedTweetCount === 1 ? "" : "s"}` : "tweet capture pending",
    `${committees.length.toLocaleString()} committee signal${committees.length === 1 ? "" : "s"}`,
    recentVoteCount ? `${recentVoteCount.toLocaleString()} recent vote row${recentVoteCount === 1 ? "" : "s"}` : "vote rows not loaded or not applicable",
    billStatus.short
  ];

  return {
    headline,
    confidence,
    paragraphs,
    issueLanes,
    notes
  };
}

function getCongressBillImportStatus(congressArchive) {
  if (!congressArchive?.congressGov) {
    return {
      short: "bill source not loaded",
      long: "Congress.gov bill endpoints are not loaded in this profile view yet."
    };
  }
  const sponsored = congressArchive.congressGov.sponsoredLegislation;
  const cosponsored = congressArchive.congressGov.cosponsoredLegislation;
  const skipped = [sponsored?.status, cosponsored?.status].includes("skipped");
  if (sponsored?.ok || cosponsored?.ok) {
    return {
      short: "bill data imported",
      long: "Congress.gov sponsored or cosponsored legislation data is imported into the local official archive."
    };
  }
  if (skipped) {
    return {
      short: "bill endpoints registered",
      long: "Congress.gov sponsored and cosponsored legislation endpoints are registered, but bulk import is skipped until a Congress.gov API key is configured."
    };
  }
  return {
    short: "bill import pending",
    long: "Congress.gov bill endpoints are registered, but structured bill data has not been imported for this member yet."
  };
}

function makePersonReadoutHeadline(actor, topLane, secondLane, capturedTweetCount, recentVoteCount) {
  const name = actor?.name || "This person";
  if (topLane && secondLane) {
    return `${name}: ${topLane.label.toLowerCase()} first, with ${secondLane.label.toLowerCase()} as a secondary lane`;
  }
  if (topLane) return `${name}: strongest visible lane is ${topLane.label.toLowerCase()}`;
  if (capturedTweetCount > 0) return `${name}: social capture present, issue pattern still thin`;
  if (recentVoteCount > 0) return `${name}: official vote record present, social capture pending`;
  return `${name}: account mapped, person analysis needs deeper capture`;
}

function makePersonReadoutSocialParagraph(archive, mentions, capturedWindowCount) {
  const capturedTweetCount = archive?.tweetCount ?? 0;
  if (capturedTweetCount > 0) {
    return `The social file has ${capturedTweetCount.toLocaleString()} captured post${capturedTweetCount === 1 ? "" : "s"} for the mapped account${capturedWindowCount ? `, with ${capturedWindowCount.toLocaleString()} recent post${capturedWindowCount === 1 ? "" : "s"} visible in this profile window` : ""}. ${mentions.length ? `${mentions.length.toLocaleString()} captured post${mentions.length === 1 ? "" : "s"} match Kurdistan Lens terms, so those should be read separately from the person's general social posture.` : "None of the visible captured posts match Kurdistan Lens terms, so Kurdistan should not be inferred from social media alone."}`;
  }
  return "The X/Twitter account is mapped, but no tweet text has been captured into this local profile window yet. That is a collection gap, not a political conclusion; until capture is refreshed, the readout has to lean on official role, committees, votes, authored texts, speeches, and other records.";
}

function makePersonReadoutInstitutionParagraph(actor, country, committees, committeeLeadership, recentVoteCount, billStatus) {
  if (!actor?.congressMember) return "";
  const member = actor.congressMember;
  const leadershipText = committeeLeadership.length
    ? ` Committee leadership is visible in ${committeeLeadership.map((committee) => committee.title ? `${committee.title} on ${committee.name}` : committee.name).join("; ")}.`
    : "";
  return `${member.name} is a ${member.party} ${member.chamber === "Senate" ? "senator" : "representative"} for ${member.districtLabel || member.state}, so the institutional baseline is ${member.party} politics plus the demands of ${member.state || country?.name || "their constituency"}. The strongest imported official structure is committee-based: ${committees.length.toLocaleString()} committee or subcommittee assignment${committees.length === 1 ? "" : "s"} are attached.${leadershipText} ${recentVoteCount.toLocaleString()} recent House vote row${recentVoteCount === 1 ? " is" : "s are"} available in the local official archive. ${billStatus.long}`;
}

function makePersonReadoutInterpretationParagraph(actor, topLane, secondLane, issueLanes) {
  if (!topLane) {
    return "There is not enough local text to write a serious ideology profile yet. The correct next step is not a template judgment; it is targeted capture of posts, press releases, bills, committee hearings, interviews, and controversy records for this specific person.";
  }
  const name = actor?.name || "This person";
  const secondary = secondLane ? ` The secondary lane is ${secondLane.label.toLowerCase()}, which prevents the profile from being reduced to a single issue.` : "";
  const controversyLane = issueLanes.find((lane) => lane.key === "social" || lane.key === "security");
  const controversy = controversyLane
    ? ` Controversy analysis should start in the ${controversyLane.label.toLowerCase()} lane, then verify whether the evidence is personal language, party-line messaging, a vote, or committee jurisdiction.`
    : " I do not see a strong controversy lane in the currently visible local evidence, so controversy analysis should wait for more posts, media records, and votes.";
  return `${name}'s current readout is not a fit-all template: it is being driven by the strongest imported signals. The first lane is ${topLane.label.toLowerCase()}, meaning the profile should be read through that policy world before assigning wider foreign-policy meaning.${secondary}${controversy}`;
}

function buildCountryDailyBrief(country, documents, intelligenceFile, sessionArchive = initialParliamentSessionArchive) {
  const accountStats = getSocialAccountStats(country.id, socialArchiveSnapshot);
  const parliamentCoverage = socialArchiveSnapshot.registry?.parliamentCoverage?.[country.id] || null;
  const sessionStats = {
    ...(sessionArchive.metadata?.countries?.[country.id] || {}),
    generatedAt: sessionArchive.metadata?.generatedAt || ""
  };
  const officialUpdates = buildDailyOfficialUpdates(country);
  const mediaItems = buildDailyMediaItems(country);
  const reports = buildDailyReportItems(country, documents, intelligenceFile);
  const parliamentSessions = buildDailyParliamentSessionItems(country, sessionArchive);
  const tweets = buildDailyTweetItems(country, accountStats.accounts);
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayCount = [...officialUpdates, ...mediaItems, ...reports, ...parliamentSessions].filter((item) => `${item.date ?? ""}`.startsWith(todayIso)).length
    + tweets.filter((tweet) => `${tweet.createdAt ?? ""}`.startsWith(todayIso)).length;
  const todayLabel = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date());

  const lanes = Object.fromEntries(dailyBriefTabs.map((tab) => {
    const updates = filterDailyItemsForLane(officialUpdates, tab.key).slice(0, 7);
    const media = filterDailyItemsForLane(mediaItems, tab.key).slice(0, 6);
    const laneReports = filterDailyItemsForLane(reports, tab.key).slice(0, 6);
    const sessions = filterDailyItemsForLane(parliamentSessions, tab.key).slice(0, 6);
    const laneTweets = filterDailyTweetsForLane(tweets, tab.key).slice(0, 6);
    const feeds = dailyBriefSourceFeeds[country.id]?.[tab.key] ?? dailyBriefSourceFeeds[country.id]?.global ?? [];

    return [tab.key, { updates, media, reports: laneReports, sessions, tweets: laneTweets, feeds }];
  }));

  const statusLine = todayCount
    ? `${todayCount} local item${todayCount === 1 ? "" : "s"} are stamped today. Use the watch portals to refresh live official pages, reports, and social accounts.`
    : "No local item is stamped today yet, so this dashboard is showing the latest attached records plus the portals to refresh today's file.";

  return {
    accountStats,
    parliamentCoverage,
    sessionStats,
    todayCount,
    todayLabel,
    statusLine,
    lanes
  };
}

function formatCoveragePair(value, total) {
  if (typeof value !== "number" || typeof total !== "number") return "0/0";
  return `${value.toLocaleString()}/${total.toLocaleString()}`;
}

function buildDailyOfficialUpdates(country) {
  const ministry = foreignMinistryData[country.id];
  const ministryRecords = (ministry?.people ?? []).flatMap((person) =>
    (person.records ?? []).map((record, index) => makeDailyItem({
      type: "Foreign ministry",
      date: record.date,
      title: `${person.name}: ${record.title}`,
      summary: record.summary,
      source: record.source || ministry.shortName,
      url: foreignMinistryRecordHref(country.id, person, record, index),
      sourceUrl: record.url,
      haystack: [person.name, person.title, record.type, record.title, record.summary, record.frame].join(" ")
    }))
  );

  const countryEvidence = (country.evidence ?? []).filter((item) => isCountryOwnedOfficialEvidence(country, item)).map((item) => makeDailyItem({
    type: item.category || "Country evidence",
    date: item.date,
    title: item.claim,
    summary: item.reading || item.sourceTitle,
    source: item.sourceTitle || item.sourceType || "Country file",
    url: countryHref(country),
    sourceUrl: item.url,
    haystack: [item.category, item.claim, item.reading, item.sourceTitle, item.sourceType].join(" ")
  }));

  return sortDailyItems([...countryEvidence, ...ministryRecords]);
}

function buildDailyMediaItems(country) {
  const mediaMentions = getMediaNetwork(country.id).mentions.map((mention) => {
    const outlet = mediaOutletsById.get(mention.outletId);
    const author = (mention.authorIds ?? []).map((id) => mediaAuthorsById.get(id)).find(Boolean);
    return makeDailyItem({
      type: "Media monitor",
      date: mention.date || "Current",
      title: mention.title,
      summary: mention.summary || mention.framing,
      source: outlet?.name || "Media database",
      url: author ? profileHref(country, makeMediaAuthorActor(author, country.id)) : `${countryHref(country)}/media`,
      sourceUrl: mention.url,
      haystack: [mention.title, mention.summary, mention.framing, mention.evidenceNote, ...(mention.topics ?? [])].join(" ")
    });
  });

  return sortDailyItems(mediaMentions);
}

function buildDailyReportItems(country, documents, intelligenceFile) {
  const attachedDocuments = documents.map((document) => makeDailyItem({
    type: document.documentType || document.type || "Book / document",
    date: document.date || document.year || "Profiled",
    title: document.title,
    summary: document.summaries?.middleEastKurdistanRelevance || document.summaries?.bookSummary || document.description || document.note,
    source: document.publisher || document.sourceBasis || "Document profile",
    url: documentHref(document),
    haystack: [
      document.title,
      document.description,
      document.note,
      document.summaries?.bookSummary,
      document.summaries?.personInsight,
      document.summaries?.middleEastKurdistanRelevance
    ].join(" ")
  }));

  const declassified = (intelligenceFile?.documents ?? []).map((doc) => makeDailyItem({
    type: doc.classificationStatus === "Source slot" ? "Declassified slot" : "Declassified record",
    date: doc.documentDate || doc.releaseDate || doc.year || "To collect",
    title: doc.title,
    summary: doc.whatItMeans || doc.whatItSays || doc.analystNotes,
    source: `${doc.agency} / ${doc.sourceType}`,
    url: `${countryHref(country)}/declassified`,
    sourceUrl: doc.url,
    haystack: [doc.title, doc.agency, doc.sourceType, doc.whatItSays, doc.whatItMeans, ...(doc.themes ?? [])].join(" ")
  }));

  const thinkTankReports = getThinkTankNetwork(country.id).tanks.flatMap((tank) =>
    (tank.sources ?? []).slice(0, 2).map(([label, url]) => makeDailyItem({
      type: "Think tank",
      date: "Watch",
      title: `${tank.shortName || tank.name}: ${label}`,
      summary: tank.kurdistanPolicy || tank.iraqPolicy || tank.middleEastPolicy,
      source: tank.name,
      url: `${countryHref(country)}/think-tanks`,
      sourceUrl: url,
      haystack: [tank.name, label, tank.kurdistanPolicy, tank.iraqPolicy, tank.middleEastPolicy, ...(tank.focus ?? [])].join(" ")
    }))
  );

  return sortDailyItems([...attachedDocuments, ...declassified, ...thinkTankReports]);
}

function buildDailyParliamentSessionItems(country, sessionArchive = initialParliamentSessionArchive) {
  return sortDailyItems((sessionArchive.sessionsByCountry?.[country.id] ?? []).map((session) => makeDailyItem({
    type: session.recordKind === "source-slot" ? "API connector slot" : session.sessionType || getLegislatureSessionLabel(country),
    date: session.date,
    title: session.title,
    summary: getSessionDailySummary(session, country),
    source: `${session.sourceLabel || session.parliament} / ${session.sourceConfidence || session.sourceType}`,
    url: `${countrySessionHref(country)}#${encodeURIComponent(session.id)}`,
    sourceUrl: session.sourceUrl || session.liveSourceUrl,
    priority: formatSessionPriority(session.priority, country),
    lane: session.lane,
    haystack: [
      session.title,
      session.originalTitle,
      sanitizeSessionClassificationText(session.summary),
      sanitizeSessionClassificationText(session.refined?.oneLine),
      sanitizeSessionClassificationText(session.refined?.whyItMatters),
      session.sourceLabel,
      session.sessionType,
      ...(session.tags ?? [])
    ].join(" ")
  })));
}

function getSessionDailySummary(session, country) {
  const genericGlobal = !session.lane?.iraq && !session.lane?.kurdistan && /no\s+kurdistan\/iraq\s+trigger|no\s+iraq\/kurdistan\s+trigger/i.test(session.refined?.oneLine || "");
  const firstLine = genericGlobal
    ? `${getLegislatureShortLabel(country)} proceeding recorded in the local session archive.`
    : sanitizeSessionDisplayText(session.refined?.oneLine);
  return [firstLine, sanitizeSessionDisplayText(session.summary)].filter(Boolean).join(" ");
}

function formatSessionPriority(priority, country) {
  if (/global parliament watch/i.test(priority || "")) return getLegislatureWatchLabel(country);
  return priority || getLegislatureWatchLabel(country);
}

function sanitizeSessionDisplayText(value) {
  return `${value ?? ""}`
    .replace(/General parliamentary proceeding with no Kurdistan\/Iraq trigger in the local metadata\.?/gi, "General proceeding recorded in the local archive.")
    .replace(/General parliamentary proceeding with no Iraq\/Kurdistan trigger in the local metadata\.?/gi, "General proceeding recorded in the local archive.")
    .trim();
}

function sanitizeSessionClassificationText(value) {
  return sanitizeSessionDisplayText(value)
    .replace(/\bKurdistan\b/gi, "")
    .replace(/\bIraq\b/gi, "")
    .replace(/\bKRG\b/gi, "")
    .trim();
}

function buildDailyTweetItems(country, accounts) {
  const accountHandles = new Set(accounts.map((account) => account.handle.toLowerCase()));
  return (socialArchiveSnapshot.tweets ?? [])
    .filter((tweet) => {
      const username = `${tweet.username ?? ""}`.toLowerCase();
      return tweet.countryId === country.id || accountHandles.has(username);
    })
    .sort((a, b) => getDailyTimestamp(b.createdAt || b.timestamp) - getDailyTimestamp(a.createdAt || a.timestamp));
}

function getSocialProfileArchiveForActor(actor, country) {
  if (!actor) return null;
  const profiles = socialProfileArchive.profiles ?? [];
  const hrefs = new Set();
  try {
    hrefs.add(profileHref(country, actor));
  } catch {
    // Some synthetic actors do not have a stable route while the page is assembling.
  }
  if (actor.mediaCountryId) hrefs.add(profileHref({ id: actor.mediaCountryId }, actor));
  if (actor.thinkTankCountryId) hrefs.add(profileHref({ id: actor.thinkTankCountryId }, actor));
  if (actor.foreignMinistryCountryId) hrefs.add(profileHref({ id: actor.foreignMinistryCountryId }, actor));
  if (actor.nationalParliamentCountryId) hrefs.add(profileHref({ id: actor.nationalParliamentCountryId }, actor));

  for (const href of hrefs) {
    const index = socialProfileArchive.hrefIndex?.[href];
    if (Number.isInteger(index) && profiles[index]) return profiles[index];
  }

  const handles = new Set();
  collectActorSocialUrls(actor).forEach((url) => {
    const handle = extractXHandleFromUrl(url);
    if (handle) handles.add(handle.toLowerCase());
  });

  for (const handle of handles) {
    const index = socialProfileArchive.handleIndex?.[handle];
    if (Number.isInteger(index) && profiles[index]) return profiles[index];
  }

  return profiles.find((profile) =>
    normalizeSearchText(profile.ownerName) === normalizeSearchText(actor.name)
    && (!profile.countryId || !country?.id || profile.countryId === country.id)
  ) ?? null;
}

function collectActorSocialUrls(actor) {
  const profile = actor ? getActorProfile(actor) : null;
  return [
    actor?.url,
    actor?.officialUrl,
    ...(profile?.social ?? []).map((item) => Array.isArray(item) ? item[1] : item?.url),
    ...(profile?.officialProfiles ?? []).map((item) => Array.isArray(item) ? item[1] : item?.url)
  ].filter(Boolean);
}

function extractXHandleFromUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(`${value}`.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!["x.com", "twitter.com"].includes(host)) return "";
    const handle = decodeURIComponent(url.pathname.split("/").filter(Boolean)[0] || "").replace(/^@/, "");
    if (!handle || /^(home|search|share|intent|i|hashtag|messages|settings|compose)$/i.test(handle)) return "";
    return handle;
  } catch {
    return "";
  }
}

function getCountryDailyTerms(country) {
  const base = [
    country.name,
    country.id,
    country.capital,
    ...(country.government ?? []).map((item) => item.value)
  ].filter(Boolean).map((item) => `${item}`.toLowerCase());
  const aliases = {
    usa: ["united states", "u.s.", "us ", "america", "washington", "state department", "white house"],
    turkey: ["turkey", "turkiye", "türkiye", "ankara", "hakan fidan", "mit"],
    france: ["france", "paris", "elysee", "elysée", "france diplomacy"],
    uk: ["united kingdom", "britain", "london", "fcdo", "foreign office"],
    iran: ["iran", "tehran", "iranian"]
  };
  return [...new Set([...base, ...(aliases[country.id] ?? [])])].filter((term) => term.trim().length > 2);
}

const countryOfficialSourcePatterns = {
  usa: /(whitehouse\.gov|state\.gov|defense\.gov|congress\.gov|senate\.gov|house\.gov|clerk\.house\.gov|usembassy\.gov|usa\.gov)/i,
  turkey: /(tccb\.gov\.tr|mfa\.gov\.tr|tbmm\.gov\.tr|mit\.gov\.tr|turkiye\.gov\.tr)/i,
  france: /(elysee\.fr|diplomatie\.gouv\.fr|assemblee-nationale\.fr|gouvernement\.fr|senat\.fr)/i,
  uk: /(gov\.uk|parliament\.uk|hansard\.parliament\.uk|commonsvotes-api\.parliament\.uk)/i,
  iran: /(mfa\.gov\.ir|president\.ir|parliran\.ir|icana\.ir|majlis\.ir)/i
};

function isCountryOwnedOfficialEvidence(country, item) {
  const text = [item?.url, item?.sourceTitle, item?.sourceType, item?.claim].filter(Boolean).join(" ");
  if (!text.trim()) return true;
  if (country?.id !== "kurdistan" && /(presidency\.gov\.krd|gov\.krd|krg\.org|kurdistan region presidency)/i.test(text)) return false;
  const pattern = countryOfficialSourcePatterns[country?.id];
  if (!pattern) return true;
  if (item?.url) return pattern.test(item.url);
  return pattern.test(text) || /official|government|ministry|parliament|congress|assembly|presidency/i.test(text);
}

function makeDailyItem(item) {
  const lane = item.lane ? normalizeDailyLane(item.lane) : classifyDailyLane(item.haystack || [item.title, item.summary, item.source].join(" "));
  return { ...item, lane };
}

function normalizeDailyLane(lane) {
  return {
    global: true,
    iraq: Boolean(lane?.iraq),
    kurdistan: Boolean(lane?.kurdistan)
  };
}

function classifyDailyLane(value) {
  const text = `${value ?? ""}`.toLowerCase();
  const kurdistan = /kurdistan|krg|ikby|erbil|irbil|peshmerga|barzani|northern iraq|sinjar|yazidi|ezidi|kirkuk|kurdish/.test(text);
  const iraq = kurdistan || /iraq|iraqi|baghdad|mosul|basra|daesh|isis/.test(text);
  return { global: true, iraq, kurdistan };
}

function filterDailyItemsForLane(items, lane) {
  if (lane === "global") return items;
  return items.filter((item) => item.lane?.[lane]);
}

function filterDailyTweetsForLane(tweets, lane) {
  if (lane === "global") return tweets;
  return tweets.filter((tweet) => {
    const tags = new Set((tweet.tags ?? []).map((tag) => `${tag}`.toLowerCase()));
    if (lane === "kurdistan") return tags.has("kurdistan") || classifyDailyLane(tweet.text).kurdistan;
    if (lane === "iraq") return tags.has("iraq") || classifyDailyLane(tweet.text).iraq;
    return true;
  });
}

function sortDailyItems(items) {
  return items.sort((a, b) => getDailyTimestamp(b.date) - getDailyTimestamp(a.date));
}

function getDailyTimestamp(value) {
  if (typeof value === "number") return value > 10000000000 ? value : value * 1000;
  if (!value) return 0;
  const normalized = `${value}`.match(/^\d{4}$/) ? `${value}-01-01` : `${value}`;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDailyDate(value) {
  const timestamp = getDailyTimestamp(value);
  if (!timestamp) return `${value || "Undated"}`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
}

function formatDailyDateTime(value) {
  const timestamp = getDailyTimestamp(value);
  if (!timestamp) return `${value || "not yet"}`;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function buildCountryWatchlist(country, sessionArchive = initialParliamentSessionArchive) {
  const ministry = foreignMinistryData[country.id];
  const documents = getCountryDocuments(country.id);
  const intelligenceFile = intelligenceFiles[country.id] ?? { documents: [] };
  const mediaNetwork = getMediaNetwork(country.id);
  const thinkNetwork = getThinkTankNetwork(country.id);
  const accountStats = getSocialAccountStats(country.id, socialArchiveSnapshot);
  const tweets = buildDailyTweetItems(country, accountStats.accounts);
  const candidates = [];

  (country.evidence ?? []).forEach((evidence, index) => {
    candidates.push({
      id: `country-evidence-${evidence.id || index}`,
      entity: country.name,
      entityType: "Country file",
      laneType: "official",
      sourceKind: "Official record",
      date: evidence.date,
      title: evidence.claim,
      summary: evidence.reading || evidence.sourceTitle,
      internalHref: countryHref(country),
      sourceHref: evidence.url,
      sourceLabel: evidence.sourceTitle || evidence.sourceType || "Country evidence",
      influence: 18 + Math.abs(Number(evidence.impact) || 0) * 5,
      sourceStrength: Math.round((Number(evidence.confidence) || 0.68) * 100),
      haystack: [evidence.category, evidence.claim, evidence.reading, evidence.sourceTitle, evidence.sourceType].join(" ")
    });
  });

  (ministry?.people ?? []).forEach((person) => {
    const actor = makeForeignMinistryPersonActor(country.id, { ...person, countryId: country.id });
    const internalHref = actor ? profileHref(country, actor) : `${countryHref(country)}/foreign-ministry`;

    (person.records ?? []).forEach((record, index) => {
      const recordInternalHref = foreignMinistryRecordHref(country.id, person, record, index);
      candidates.push({
        id: `ministry-${person.id}-${index}`,
        entity: person.name,
        entityType: person.title || ministry.shortName || "Foreign ministry",
        laneType: "official",
        sourceKind: "Foreign ministry",
        date: record.date,
        title: record.title,
        summary: record.summary || person.kurdistanAssessment || person.summary,
        internalHref: recordInternalHref,
        relatedHref: internalHref,
        sourceHref: record.url || person.officialUrl,
        sourceLabel: record.source || ministry.shortName || ministry.ministryName,
        influence: /secretary|minister|deputy|under secretary|director|ambassador|envoy/i.test(`${person.title} ${person.category}`) ? 30 : 20,
        sourceStrength: 84,
        haystack: [
          person.name,
          person.title,
          person.category,
          person.importance,
          person.kurdistanAssessment,
          record.type,
          record.title,
          record.summary,
          record.frame,
          ...(person.tags ?? [])
        ].join(" ")
      });
    });

    if ((person.monitoringTasks ?? []).length) {
      candidates.push({
        id: `ministry-monitor-${person.id}`,
        entity: person.name,
        entityType: person.title || ministry.shortName || "Foreign ministry",
        laneType: "official",
        sourceKind: "Monitoring record",
        date: "Watch",
        title: `${person.name}: monitoring tasks`,
        summary: person.monitoringTasks.slice(0, 2).join(" "),
        internalHref,
        sourceHref: person.officialUrl,
        sourceLabel: ministry.shortName || ministry.ministryName,
        influence: 18,
        sourceStrength: 58,
        needsResearch: true,
        researchOnly: true,
        lane: { global: true, iraq: false, kurdistan: false },
        evidenceText: [person.name, person.title, person.summary].join(" "),
        haystack: [person.name, person.title, person.summary, ...(person.monitoringTasks ?? [])].join(" ")
      });
    }
  });

  documents.forEach((document) => {
    const actor = findProfileActor(document.personName, country);
    const documentInternalHref = documentHref(document);
    candidates.push({
      id: `document-${document.id || document.slug}`,
      entity: document.personName || document.publisher || "Document",
      entityType: document.documentType || "Book / document",
      laneType: "documents",
      sourceKind: "Book / document",
      date: document.date || document.year,
      title: document.title,
      summary: document.summaries?.middleEastKurdistanRelevance || document.summaries?.personInsight || document.summaries?.bookSummary || document.description,
      internalHref: documentInternalHref,
      relatedHref: actor ? profileHref(country, actor) : "",
      sourceHref: document.sourceUrl || document.sourceLinks?.[0]?.[1] || document.localPdfPath,
      sourceLabel: document.publisher || document.sourceBasis || "Document profile",
      influence: document.localPdfAvailable ? 26 : 17,
      sourceStrength: document.localPdfAvailable ? 88 : 62,
      needsResearch: !document.localPdfAvailable || /pdf needed|ocr pending|slot ready/i.test([document.ocrStatus, ...(document.tags ?? [])].join(" ")),
      haystack: [
        document.personName,
        document.title,
        document.documentType,
        document.publisher,
        document.description,
        document.ocrStatus,
        document.sourceBasis,
        document.summaries?.bookSummary,
        document.summaries?.personInsight,
        document.summaries?.middleEastKurdistanRelevance,
        ...(document.tags ?? [])
      ].join(" ")
    });
  });

  (sessionArchive.sessionsByCountry?.[country.id] ?? []).slice(0, 80).forEach((session) => {
    candidates.push({
      id: `session-${session.id}`,
      entity: session.parliament || getParliamentEntry(country)?.title || getLegislatureShortLabel(country),
      entityType: session.chamber || session.sessionType || getLegislatureSessionLabel(country),
      laneType: "official",
      sourceKind: getLegislatureSessionLabel(country),
      date: session.date,
      title: session.title,
      summary: getSessionDailySummary(session, country),
      internalHref: `${countrySessionHref(country)}#${encodeURIComponent(session.id)}`,
      sourceHref: session.sourceUrl || session.liveSourceUrl,
      sourceLabel: session.sourceLabel || session.sourceType || session.parliament,
      influence: session.priority === "Kurdistan direct" ? 34 : session.priority === "Iraq / regional watch" ? 25 : 14,
      sourceStrength: session.localArchiveBacked ? 86 : 66,
      needsResearch: session.recordKind === "source-slot" || /check|attach|enrich|source-slot/i.test([session.summary, session.refined?.nextAction].join(" ")),
      lane: session.recordKind === "source-slot" ? { global: true, iraq: false, kurdistan: false } : session.lane,
      researchOnly: session.recordKind === "source-slot",
      haystack: [
        session.title,
        session.originalTitle,
        sanitizeSessionClassificationText(session.summary),
        sanitizeSessionClassificationText(session.refined?.oneLine),
        sanitizeSessionClassificationText(session.refined?.whyItMatters),
        session.priority,
        ...(session.tags ?? [])
      ].join(" ")
    });
  });

  tweets.slice(0, 120).forEach((tweet) => {
    candidates.push({
      id: `tweet-${tweet.id}`,
      entity: tweet.ownerName || tweet.displayName || `@${tweet.username || tweet.handle}`,
      entityType: tweet.ownerType || "X account",
      laneType: "social",
      sourceKind: "X update",
      date: tweet.createdAt || tweet.timestamp,
      title: `X update from ${tweet.ownerName || `@${tweet.username || tweet.handle}`}`,
      summary: tweet.text,
      internalHref: tweet.profileHref || countryHref(country),
      sourceHref: tweet.url,
      sourceLabel: `@${tweet.username || tweet.handle}`,
      influence: 12 + getTweetReachScore(tweet),
      sourceStrength: 62,
      haystack: [
        tweet.ownerName,
        tweet.ownerType,
        tweet.text,
        ...(tweet.tags ?? []),
        ...(tweet.kurdistanTerms ?? []),
        ...(tweet.frames ?? [])
      ].join(" ")
    });
  });

  mediaNetwork.mentions.forEach((mention) => {
    const outlet = mediaOutletsById.get(mention.outletId);
    const author = (mention.authorIds ?? []).map((id) => mediaAuthorsById.get(id)).find(Boolean);
    candidates.push({
      id: `media-${mention.id}`,
      entity: outlet?.name || mention.outlet || "Media monitor",
      entityType: mention.framing || "Media mention",
      laneType: "media",
      sourceKind: "Media mention",
      date: mention.date,
      title: mention.title,
      summary: mention.summary || mention.evidenceNote || outlet?.coveragePattern,
      internalHref: author ? profileHref(country, makeMediaAuthorActor(author, country.id)) : `${countryHref(country)}/media`,
      sourceHref: mention.url,
      sourceLabel: outlet?.name || author?.outlet || "Media monitor",
      influence: 16 + Math.min(18, Math.abs(Number(mention.score) || 0) / 5),
      sourceStrength: mention.url ? 72 : 55,
      needsResearch: !mention.url || /intake|full article|corroboration|should be added/i.test([mention.evidenceNote, mention.summary].join(" ")),
      haystack: [
        mention.title,
        mention.framing,
        mention.summary,
        mention.evidenceNote,
        outlet?.coveragePattern,
        outlet?.rationale,
        ...(mention.topics ?? [])
      ].join(" ")
    });
  });

  thinkNetwork.tanks.forEach((tank) => {
    candidates.push({
      id: `thinktank-${tank.id}`,
      entity: tank.name,
      entityType: tank.type || "Think tank",
      laneType: "think-tanks",
      sourceKind: "Think tank",
      date: "Watch",
      title: `${tank.shortName || tank.name}: policy influence file`,
      summary: tank.kurdistanPolicy || tank.iraqPolicy || tank.middleEastPolicy || tank.rationale,
      internalHref: `${countryHref(country)}/think-tanks`,
      sourceHref: tank.sources?.[0]?.[1],
      sourceLabel: tank.sources?.[0]?.[0] || tank.name,
      influence: Math.round((Number(tank.proximityScore) || 45) / 3),
      sourceStrength: tank.sources?.length ? 66 : 48,
      needsResearch: !tank.kurdistanPolicy || /track|needs|watch|not yet|source/i.test(`${tank.specificity ?? ""}`),
      haystack: [
        tank.name,
        tank.type,
        tank.proximityLabel,
        tank.specificity,
        tank.rationale,
        tank.middleEastPolicy,
        tank.iraqPolicy,
        tank.kurdistanPolicy,
        ...(tank.focus ?? []),
        ...(tank.sources ?? []).map(([label]) => label)
      ].join(" ")
    });
  });

  thinkNetwork.people.slice(0, 80).forEach((person) => {
    candidates.push({
      id: `thinkperson-${person.id}`,
      entity: person.name,
      entityType: `${person.organization} / ${person.role}`,
      laneType: "think-tanks",
      sourceKind: "Policy person",
      date: "Watch",
      title: `${person.name}: policy-network proximity`,
      summary: [person.policySignal, person.adminConnection].filter(Boolean).join(" "),
      internalHref: profileHref(country, makeThinkTankPersonActor(person, country.id)),
      sourceHref: person.url,
      sourceLabel: person.organization,
      influence: /administration|white house|state|defense|campaign|advisor|appointed/i.test(`${person.adminConnection} ${person.policySignal}`) ? 24 : 14,
      sourceStrength: person.url ? 61 : 44,
      needsResearch: true,
      haystack: [
        person.name,
        person.organization,
        person.role,
        person.adminConnection,
        person.policySignal,
        ...(person.expertise ?? [])
      ].join(" ")
    });
  });

  (intelligenceFile.documents ?? []).forEach((doc, index) => {
    candidates.push({
      id: `declassified-${doc.id || index}`,
      entity: doc.agency || "Declassified file",
      entityType: doc.classificationStatus || "Declassified record",
      laneType: "declassified",
      sourceKind: "Declassified",
      date: doc.documentDate || doc.releaseDate || doc.year,
      title: doc.title,
      summary: doc.whatItMeans || doc.whatItSays || doc.analystNotes,
      internalHref: `${countryHref(country)}#declassified`,
      sourceHref: doc.url,
      sourceLabel: `${doc.agency || "Agency"} / ${doc.sourceType || "source"}`,
      influence: doc.classificationStatus === "Source slot" ? 13 : 22,
      sourceStrength: doc.classificationStatus === "Source slot" ? 46 : 70,
      needsResearch: doc.classificationStatus === "Source slot" || /slot|collect|ocr|interpret/i.test([doc.whatItMeans, doc.analystNotes].join(" ")),
      researchOnly: doc.classificationStatus === "Source slot",
      lane: doc.classificationStatus === "Source slot" ? { global: true, iraq: false, kurdistan: false } : undefined,
      evidenceText: [doc.title, doc.agency, doc.sourceType, doc.whatItSays, doc.whatItMeans].join(" "),
      haystack: [doc.title, doc.agency, doc.sourceType, doc.whatItSays, doc.whatItMeans, doc.analystNotes, ...(doc.themes ?? [])].join(" ")
    });
  });

  return dedupeWatchlistItems(candidates)
    .map((item) => makeWatchlistItem(country, item))
    .sort((a, b) => b.score - a.score || getDailyTimestamp(b.date) - getDailyTimestamp(a.date))
    .slice(0, 90);
}

function makeWatchlistItem(country, item) {
  const text = [item.entity, item.entityType, item.title, item.summary, item.haystack].join(" ");
  const evidenceText = item.evidenceText || [item.entity, item.entityType, item.title, item.summary, item.haystack].join(" ");
  const lane = item.lane ? normalizeDailyLane(item.lane) : (item.researchOnly ? normalizeDailyLane({ global: true }) : classifyDailyLane(evidenceText));
  const topics = getWatchlistTopics(item.researchOnly ? [item.entity, item.entityType, item.title, item.sourceKind].join(" ") : evidenceText);
  const reasons = [];
  let score = 12;

  if (lane.kurdistan && !item.researchOnly) {
    score += 38;
    reasons.push("direct Kurdistan/KRG/Northern Iraq language");
  } else if (lane.iraq && !item.researchOnly) {
    score += 21;
    reasons.push("Iraq or regional-security relevance");
  } else {
    reasons.push("country-file context");
  }

  const sourceWeight = getWatchlistSourceWeight(item);
  score += sourceWeight;
  reasons.push(`${formatSourceKind(item.sourceKind)} source`);

  const ageWeight = getWatchlistAgeWeight(item.date);
  score += ageWeight;
  if (ageWeight >= 16) reasons.push("fresh today");
  else if (ageWeight >= 10) reasons.push("fresh this week");
  else if (ageWeight > 0) reasons.push("dated source");

  const influence = clamp(Math.round(Number(item.influence) || 0), 0, 34);
  score += influence;
  if (influence >= 24) reasons.push("high-authority or high-influence actor");
  else if (influence >= 12) reasons.push("policy-relevant actor");

  if (item.needsResearch) {
    score += 8;
    reasons.push("research gap to close");
  }

  const sourceStrength = clamp(Math.round(Number(item.sourceStrength) || 50), 0, 100);
  if (sourceStrength >= 80) score += 6;

  const finalScore = clamp(Math.round(score), 0, 100);
  const urgency = finalScore >= 76 ? "high" : finalScore >= 52 ? "medium" : "low";

  return {
    ...item,
    lane,
    topics,
    reasons: [...new Set(reasons)].slice(0, 5),
    score: finalScore,
    urgency,
    confidence: getWatchlistConfidence(sourceStrength, item.needsResearch),
    action: item.action || getWatchlistAction({ lane, item, country }),
    searchableText: [text, topics.join(" "), item.sourceLabel, item.sourceKind, item.entityType].join(" ").toLowerCase()
  };
}

function dedupeWatchlistItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = [slugify(item.entity), slugify(item.title), `${item.date ?? ""}`.slice(0, 10)].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return item.title && item.summary;
  });
}

function getWatchlistSourceWeight(item) {
  if (/foreign ministry|official record|parliament/i.test(item.sourceKind)) return 18;
  if (/declassified/i.test(item.sourceKind)) return 17;
  if (/book|document/i.test(item.sourceKind)) return 15;
  if (/x update/i.test(item.sourceKind)) return 13;
  if (/media/i.test(item.sourceKind)) return 12;
  if (/think tank|policy person/i.test(item.sourceKind)) return 11;
  return 9;
}

function getWatchlistAgeWeight(value) {
  const timestamp = getDailyTimestamp(value);
  if (!timestamp) return 1;
  const ageDays = (Date.now() - timestamp) / 86400000;
  if (ageDays <= 1) return 18;
  if (ageDays <= 7) return 12;
  if (ageDays <= 31) return 7;
  if (ageDays <= 365) return 4;
  return 2;
}

function getTweetReachScore(tweet) {
  const metrics = tweet.metrics ?? {};
  const views = Number(metrics.view_count) || 0;
  const likes = Number(metrics.like_count) || 0;
  const reposts = Number(metrics.retweet_count) || 0;
  const replies = Number(metrics.reply_count) || 0;
  const raw = Math.log10(Math.max(1, views + likes * 35 + reposts * 80 + replies * 45));
  return clamp(Math.round(raw * 3), 0, 18);
}

function getWatchlistTopics(value) {
  const text = `${value ?? ""}`.toLowerCase();
  const topicRules = [
    ["Kurdistan / KRG", /kurdistan|krg|ikby|erbil|irbil|peshmerga|barzani|northern iraq/],
    ["Iraq / Baghdad", /iraq|iraqi|baghdad|mosul|kirkuk|basra/],
    ["Syria / SDF-YPG", /syria|syrian|sdf|ypg|rojava/],
    ["PKK / Border Security", /pkk|terror|counterterror|border|security operation/],
    ["Iran", /iran|iranian|tehran|irgc/],
    ["Turkiye", /turkey|turkiye|türkiye|ankara/],
    ["Energy / Oil", /oil|gas|pipeline|energy|revenue|exports/],
    ["Minorities / Yazidis", /yazidi|ezidi|sinjar|minority|christian|assyrian/],
    ["Sanctions / War Powers", /sanction|war powers|hostilities|military aid|arms/],
    ["Media Frame", /media|outlet|journalist|article|transcript|coverage|framing/],
    ["Parliament", /parliament|congress|assembly|majlis|vote|bill|session|committee/],
    ["Book / OCR", /book|thesis|dissertation|ocr|pdf|document/]
  ];
  const topics = topicRules.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  return topics.length ? topics.slice(0, 6) : ["Country context"];
}

function getWatchlistConfidence(sourceStrength, needsResearch) {
  if (sourceStrength >= 82 && !needsResearch) return "High";
  if (sourceStrength >= 62) return needsResearch ? "Medium, research gap" : "Medium";
  return "Low, needs verification";
}

function getWatchlistAction({ lane, item, country }) {
  if (lane.kurdistan) {
    return `Add this to the ${country.name} Kurdistan Lens, compare it with the actor's older record, and note whether it is cooperation, security, rights, energy, or pressure language.`;
  }
  if (lane.iraq) {
    return "Check whether the Iraq wording is actually KRG-relevant: Northern Iraq, Erbil, Kirkuk, Mosul, energy, Baghdad-Erbil relations, anti-ISIS, or border security.";
  }
  if (item.needsResearch) {
    return "Close the source gap first: import/OCR the missing text, attach the official record, then re-score the actor or institution.";
  }
  if (item.laneType === "media") {
    return "Compare the framing with other outlets before calling it favorable or critical; identify the sources quoted in the piece.";
  }
  if (item.laneType === "think-tanks") {
    return "Look for testimony, op-eds, event transcripts, staff movement, and administration links that could move this idea toward policy.";
  }
  return "Keep this in the country watch file and promote it only if new evidence connects it to Iraq, Kurdistan, Syria, Iran, energy, or security.";
}

function formatSourceKind(value) {
  const label = `${value || "record"}`;
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

function filterWatchlistItems(items, filter, query) {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesQuery = !q || item.searchableText.includes(q);
    if (!matchesQuery) return false;
    if (filter === "all") return true;
    if (filter === "today") return getWatchlistAgeWeight(item.date) >= 16;
    if (filter === "week") return getWatchlistAgeWeight(item.date) >= 10;
    if (filter === "high") return item.urgency === "high";
    if (filter === "kurdistan") return item.lane.kurdistan;
    if (filter === "regional") return item.lane.iraq;
    if (filter === "official") return item.laneType === "official" || /official|parliament|foreign ministry/i.test(item.sourceKind);
    if (filter === "media") return item.laneType === "media";
    if (filter === "think-tanks") return item.laneType === "think-tanks";
    if (filter === "needs-research") return item.needsResearch;
    return true;
  });
}

function getWatchlistStats(items) {
  return {
    total: items.length,
    high: items.filter((item) => item.urgency === "high").length,
    kurdistan: items.filter((item) => item.lane.kurdistan).length,
    regional: items.filter((item) => item.lane.iraq).length,
    official: items.filter((item) => item.laneType === "official").length,
    research: items.filter((item) => item.needsResearch).length
  };
}

function getWatchlistSignalMap(items) {
  const counts = new Map();
  items.forEach((item) => {
    item.topics.forEach((topic) => counts.set(topic, (counts.get(topic) || 0) + 1));
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function getWatchlistSourceMix(items) {
  const counts = new Map();
  items.forEach((item) => {
    const label = item.laneType === "official" ? "Official" : item.laneType === "think-tanks" ? "Think tanks" : formatSourceKind(item.laneType);
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function CountryBriefingConsole({ answer, query, setQuery, mode, setMode, score }) {
  return (
    <section className="country-briefing-console">
      <div className="country-section-heading">
        <div>
          <p className="eyebrow">Analyst Console</p>
          <h3>Build A Briefing From The File</h3>
        </div>
        <Sparkles size={21} />
      </div>
      <div className="mode-tabs">
        {["briefing", "people", "score"].map((item) => (
          <button className={mode === item ? "active" : ""} key={item} onClick={() => setMode(item)}>
            {item}
          </button>
        ))}
      </div>
      <label className="ask-box">
        <FileText size={20} />
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask for a briefing, important people, or why the score is what it is..."
        />
      </label>
      <div className="question-chips">
        {questions.map((item) => (
          <button key={item} onClick={() => setQuery(item)}>{item}</button>
        ))}
      </div>
      <article className="country-answer-brief">
        <div className="answer-head">
          <BookOpenCheck size={18} />
          <strong>Draft With Evidence Trail</strong>
        </div>
        {answer.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <div className="source-strip">
          {score.topDrivers.slice(0, 4).map((item) => (
            <SourcePill key={item.id} item={item} />
          ))}
        </div>
      </article>
    </section>
  );
}

function CountryCoverageBoard({ coverage }) {
  return (
    <section className="country-coverage-board">
      <div className="country-section-heading">
        <div>
          <p className="eyebrow">Coverage Snapshot</p>
          <h3>Data Attached</h3>
        </div>
        <Radar size={21} />
      </div>
      <div className="coverage-lane-list">
        {coverage.map((lane) => {
          const Icon = lane.icon;
          const className = lane.enabled ? "coverage-lane active" : "coverage-lane";
          const content = (
            <>
              <span className={lane.enabled ? "lane-status active" : "lane-status"}>{lane.status}</span>
              <div>
                <Icon size={18} />
                <strong>{lane.label}</strong>
                <em>{lane.value}</em>
              </div>
            </>
          );

          return lane.href ? (
            <a className={className} href={lane.href} title={lane.description} key={lane.label}>
              {content}
            </a>
          ) : (
            <article className={className} title={lane.description} key={lane.label}>
              {content}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CountryDocumentShelf({ country, documents }) {
  if (documents.length === 0) return null;
  const featured = documents.slice(0, 5);

  return (
    <section className="country-documents-section" id="country-documents">
      <div className="country-section-heading">
        <div>
          <p className="eyebrow">Books / Theses / Papers</p>
          <h3>Document Profiles Attached To {country.name}</h3>
        </div>
        <BookOpenCheck size={21} />
      </div>
      <div className="country-document-shelf">
        {featured.map((document) => (
          <a className="country-document-card" href={documentHref(document)} key={document.slug}>
            <DocumentPoster document={document} className="country-document-poster" />
            <span>{document.documentType || document.type || "Document"}</span>
            <strong>{document.title}</strong>
            <p>{shortenText(document.description || document.summaries?.bookSummary, 190)}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function CountryGovernmentPanel({ country }) {
  return (
    <section className="country-panel country-government-panel">
      <div className="country-section-heading">
        <div>
          <p className="eyebrow">Executive Map</p>
          <h3>Government Names</h3>
        </div>
        <Landmark size={21} />
      </div>
      <dl className="country-government-list">
        {country.government.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd><GovernmentNameLink item={item} country={country} /></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function CountryActorsPanel({ country }) {
  return (
    <section className="country-panel country-actors-panel">
      <div className="country-section-heading">
        <div>
          <p className="eyebrow">Named Actors</p>
          <h3>People And Institutions In This File</h3>
        </div>
        <UsersRound size={21} />
      </div>
      <div className="country-actor-list">
        {country.actors.map((actor) => (
          <article className="country-actor-row" key={actor.name}>
            <div>
              <a className="profile-name-link" href={profileHref(country, actor)} target="_blank" rel="noreferrer">
                {actor.name}
              </a>
              <span>{actor.institution}</span>
            </div>
            <p>{actor.role}</p>
            <small>{actor.stance}</small>
            <EvidenceIds country={country} ids={actor.evidenceIds} />
          </article>
        ))}
      </div>
    </section>
  );
}

function CountryTimelinePanel({ country }) {
  return (
    <section className="country-panel">
      <div className="country-section-heading">
        <div>
          <p className="eyebrow">Change Over Time</p>
          <h3>Stance Timeline</h3>
        </div>
        <CalendarClock size={21} />
      </div>
      <div className="country-timeline">
        {country.timeline.map((item) => (
          <div className="country-timeline-row" key={item.year}>
            <span>{item.year}</span>
            <div>
              <p>{item.event}</p>
              <div className="bar"><i style={{ width: `${item.stance}%` }} /></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CountryRelationshipPanel({ country }) {
  return (
    <section className="country-panel">
      <div className="country-section-heading">
        <div>
          <p className="eyebrow">Network</p>
          <h3>Relationship Map</h3>
        </div>
        <Network size={21} />
      </div>
      <div className="country-relation-list">
        {country.relationships.map((relation) => (
          <div className="country-relation" key={`${relation.from}-${relation.to}`}>
            <div>
              <strong>{relation.from}</strong>
              <span>{relation.label}</span>
              <strong>{relation.to}</strong>
            </div>
            <div className="relation-strength"><i style={{ width: `${relation.strength}%` }} /></div>
            <EvidenceIds country={country} ids={relation.evidenceIds} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CountryScoreEvidencePanel({ country, score }) {
  return (
    <section className="country-panel evidence-panel">
      <div className="country-section-heading">
        <div>
          <p className="eyebrow">Explainability</p>
          <h3>Why The Score Is {score.value}</h3>
        </div>
        <Scale size={21} />
      </div>
      <div className="country-score-layout">
        <div className="country-score-ledger">
          {score.contributions.map((item) => (
            <a className="country-score-row" key={item.id} href={item.url} target="_blank" rel="noreferrer">
              <span>{item.category}</span>
              <strong>{item.claim}</strong>
              <em>{Math.round(item.confidence * 100)}% confidence</em>
              <b className={item.weighted >= 0 ? "positive" : "negative"}>{formatSigned(item.weighted)}</b>
            </a>
          ))}
        </div>
        <div className="country-evidence-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Claim Area</th>
                <th>Source</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              {country.evidence.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>
                    <strong>{item.category}</strong>
                    <span>{item.reading}</span>
                  </td>
                  <td>
                    <a href={item.url} target="_blank" rel="noreferrer">{item.sourceTitle}<ExternalLink size={13} /></a>
                    <small>{item.sourceType}</small>
                  </td>
                  <td className={item.impact >= 0 ? "positive" : "negative"}>{formatSigned(item.impact)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function CountryNarrativePanel({ country }) {
  return (
    <section className="country-panel">
      <div className="country-section-heading">
        <div>
          <p className="eyebrow">Narrative Layer</p>
          <h3>Media And Influence Signals</h3>
        </div>
        <MessageSquareQuote size={21} />
      </div>
      <div className="country-narrative-grid">
        <div>
          <h4>Media Narrative</h4>
          {country.media.map((outlet) => (
            <article key={outlet.name}>
              <strong><a href={outlet.url} target="_blank" rel="noreferrer">{outlet.name}<ExternalLink size={13} /></a></strong>
              <span>{outlet.influence}</span>
              <small>{outlet.tendency}</small>
            </article>
          ))}
        </div>
        <div>
          <h4>Influence Layer</h4>
          {country.influences.map((item) => (
            <article key={item.name}>
              <strong>{item.name}</strong>
              <span>{item.type} / {item.confidence} confidence</span>
              <p>{item.relevance}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CountryVerificationPanel({ country }) {
  return (
    <section className="country-panel">
      <div className="country-section-heading">
        <div>
          <p className="eyebrow">Analyst Caution</p>
          <h3>Verify Before Use</h3>
        </div>
        <Link2 size={21} />
      </div>
      <p className="country-panel-copy">
        These are the places where an analyst should gather fresher or stronger evidence before giving the briefing to a senior official.
      </p>
      <div className="verification-list">
        {country.verification.map((item) => <span key={item}>{item}</span>)}
      </div>
    </section>
  );
}

function BrainIcon() {
  return <ShieldCheck size={19} />;
}

function ThinkTankDirectoryPage({ country }) {
  const network = getThinkTankNetwork(country.id);

  return (
    <main className="profile-page parliament-directory-page influence-directory-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>
      <InfluenceDirectoryHero
        country={country}
        eyebrow="TOR Phi Influence Database"
        title="Think Tanks And Policy Networks"
        description={`Track ${country.name}'s policy institutions, expert networks, proximity signals, Iraq/Kurdistan framing, and source trails as a dedicated database.`}
        icon={<Network size={44} />}
        stats={[
          { value: network.tanks.length.toLocaleString(), label: "institutions" },
          { value: network.people.length.toLocaleString(), label: "people" },
          { value: network.tanks.reduce((sum, tank) => sum + tank.sources.length, 0).toLocaleString(), label: "sources" }
        ]}
      />
      <section className="parliament-dashboard">
        <ThinkTankSection country={country} />
      </section>
    </main>
  );
}

function MediaDirectoryPage({ country }) {
  const network = getMediaNetwork(country.id);

  return (
    <main className="profile-page parliament-directory-page influence-directory-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>
      <InfluenceDirectoryHero
        country={country}
        eyebrow="TOR Phi Media Database"
        title="Media Monitor"
        description={`Track ${country.name}'s outlets, journalists, desks, archive intake slots, mention records, and favorable or critical Kurdistan framing.`}
        icon={<Newspaper size={44} />}
        stats={[
          { value: network.outlets.length.toLocaleString(), label: "outlets" },
          { value: network.authors.length.toLocaleString(), label: "people / desks" },
          { value: network.mentions.length.toLocaleString(), label: "records" }
        ]}
      />
      <section className="parliament-dashboard">
        <MediaDatabaseSection country={country} network={network} />
      </section>
    </main>
  );
}

function CountryWatchlistPage({ country }) {
  const sessionArchive = useParliamentSessionArchive();
  const [activeFilter, setActiveFilter] = useState("all");
  const [watchQuery, setWatchQuery] = useState("");
  const items = useMemo(() => buildCountryWatchlist(country, sessionArchive), [country, sessionArchive]);
  const filteredItems = useMemo(
    () => filterWatchlistItems(items, activeFilter, watchQuery),
    [items, activeFilter, watchQuery]
  );
  const stats = getWatchlistStats(items);
  const signalMap = getWatchlistSignalMap(items);
  const sourceMix = getWatchlistSourceMix(items);
  const actionQueue = items.filter((item) => item.urgency === "high" || item.needsResearch).slice(0, 6);
  const maxSignal = Math.max(1, ...signalMap.map((item) => item.count));
  const maxSource = Math.max(1, ...sourceMix.map((item) => item.count));

  return (
    <main className="profile-page watchlist-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>

      <section className="profile-hero watchlist-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">TOR Phi Watchlist</p>
          <h1>What Needs Attention Now</h1>
          <span>{country.name}</span>
          <p>
            A triage board for the strongest current signals in this country file. It combines official records, ministry people,
            parliament sessions, books, declassified slots, media framing, think-tank influence, and captured X updates, then shows why each item was promoted.
          </p>
          <div className="profile-tags">
            <span>{stats.total} scored signals</span>
            <span>{stats.high} high priority</span>
            <span>{stats.kurdistan} Kurdistan direct</span>
            <span>{stats.research} research gaps</span>
          </div>
        </div>
        <div className="profile-hero-card">
          <Radar size={44} />
          <strong>Signal Triage</strong>
          <span>{country.name}</span>
          <small>Rule-based ranking from visible TOR Phi evidence, not a black-box result.</small>
        </div>
      </section>

      <section className="watchlist-dashboard">
        <div className="watchlist-summary-grid">
          <div>
            <Radar size={20} />
            <strong>{stats.high}</strong>
            <span>high priority</span>
          </div>
          <div>
            <Globe2 size={20} />
            <strong>{stats.kurdistan}</strong>
            <span>Kurdistan direct</span>
          </div>
          <div>
            <Landmark size={20} />
            <strong>{stats.official}</strong>
            <span>official records</span>
          </div>
          <div>
            <FileSearch size={20} />
            <strong>{stats.research}</strong>
            <span>needs research</span>
          </div>
        </div>

        <div className="watchlist-controls">
          <label className="watchlist-search">
            <Search size={18} />
            <input
              value={watchQuery}
              onChange={(event) => setWatchQuery(event.target.value)}
              placeholder="Search signal, person, topic, source..."
            />
          </label>
          <div className="watchlist-filter-row" aria-label="Watchlist filters">
            {watchlistFilterOptions.map((option) => (
              <button
                type="button"
                className={activeFilter === option.key ? "active" : ""}
                key={option.key}
                onClick={() => setActiveFilter(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="watchlist-layout">
          <section className="watchlist-list" aria-label="Watchlist signals">
            {filteredItems.length ? (
              filteredItems.slice(0, 36).map((item) => <WatchlistCard item={item} key={item.id} />)
            ) : (
              <div className="watchlist-empty">
                <Radar size={22} />
                <strong>No signals match this filter.</strong>
                <span>Try All Signals or clear the search field.</span>
              </div>
            )}
          </section>

          <aside className="watchlist-side">
            <section className="watchlist-side-panel">
              <div className="compact-title">
                <p className="eyebrow">Signal Map</p>
                <h3>Topics Pulling Attention</h3>
              </div>
              <div className="watchlist-bar-list">
                {signalMap.map((item) => (
                  <div className="watchlist-bar-row" key={item.label}>
                    <span>{item.label}</span>
                    <i><b style={{ width: `${Math.max(8, (item.count / maxSignal) * 100)}%` }} /></i>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="watchlist-side-panel">
              <div className="compact-title">
                <p className="eyebrow">Source Mix</p>
                <h3>Where Signals Come From</h3>
              </div>
              <div className="watchlist-source-mix">
                {sourceMix.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <i><b style={{ width: `${Math.max(8, (item.count / maxSource) * 100)}%` }} /></i>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="watchlist-side-panel">
              <div className="compact-title">
                <p className="eyebrow">Action Queue</p>
                <h3>What To Check First</h3>
              </div>
              <div className="watchlist-queue">
                {actionQueue.map((item) => (
                  <a href={item.internalHref || countryHref(country)} key={`queue-${item.id}`}>
                    <span>{item.urgency === "high" ? "High" : "Research"}</span>
                    <strong>{shortenText(item.title, 82)}</strong>
                  </a>
                ))}
              </div>
            </section>

            <section className="watchlist-side-panel watchlist-method">
              <Sparkles size={20} />
              <p>
                Score reasons are intentionally visible. The page lifts direct Kurdistan/KRG language first, then Iraq-region relevance,
                source authority, freshness, actor influence, social reach, and missing-source gaps.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function WatchlistCard({ item }) {
  const sourceExternal = /^https?:\/\//i.test(item.sourceHref || "");

  return (
    <article className={`watchlist-card ${item.urgency}`}>
      <header>
        <div>
          <p className="eyebrow">{item.sourceKind} / {item.entityType}</p>
          <h2><a href={item.internalHref || item.sourceHref}>{item.title}</a></h2>
          <div className="watchlist-card-meta">
            <a href={item.internalHref || "#"}>{item.entity}</a>
            <time>{formatDailyDate(item.date)}</time>
            <span>{item.confidence}</span>
          </div>
        </div>
        <div className={`watchlist-score ${item.urgency}`}>
          <strong>{item.score}</strong>
          <span>{item.urgency}</span>
        </div>
      </header>

      <p>{shortenText(item.summary, 420)}</p>

      <div className="watchlist-topic-row">
        {item.topics.map((topic) => <span key={`${item.id}-${topic}`}>{topic}</span>)}
      </div>

      <div className="watchlist-reason-grid">
        {item.reasons.map((reason) => <span key={`${item.id}-${reason}`}>{reason}</span>)}
      </div>

      <div className="watchlist-action">
        <strong>Analyst move</strong>
        <p>{item.action}</p>
      </div>

      <footer>
        {item.internalHref ? (
          <a href={item.internalHref}>
            Internal file <ArrowRight size={14} />
          </a>
        ) : null}
        {item.relatedHref ? (
          <a href={item.relatedHref}>
            Related profile <UserRound size={14} />
          </a>
        ) : null}
        {item.sourceHref ? (
          <a href={item.sourceHref} target={sourceExternal ? "_blank" : undefined} rel={sourceExternal ? "noreferrer" : undefined}>
            Source <ExternalLink size={14} />
          </a>
        ) : null}
      </footer>
    </article>
  );
}

function InfluenceChainPage({ country }) {
  const chains = getInfluenceChains(country);
  const thinkNetwork = getThinkTankNetwork(country.id);
  const mediaNetwork = getMediaNetwork(country.id);
  const sourceCount = chains.reduce((sum, chain) => sum + chain.nodes.filter((node) => node.href).length, 0);

  return (
    <main className="profile-page influence-chain-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>

      <section className="profile-hero influence-chain-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">TOR Phi Influence Chain</p>
          <h1>How Ideas Move Into Policy</h1>
          <span>{country.name}</span>
          <p>
            This page connects think-tank language, media framing, official records, and diplomatic action. It is designed to answer: who shaped the idea, who amplified it, where it entered public policy, and what KRG should do next.
          </p>
          <div className="profile-tags">
            <span>{thinkNetwork.tanks.length} think tanks</span>
            <span>{mediaNetwork.outlets.length} outlets</span>
            <span>{country.evidence.length} evidence records</span>
            <span>{sourceCount} evidence links</span>
          </div>
        </div>
        <div className="profile-hero-card">
          <LineChart size={44} />
          <strong>Policy Signal Chain</strong>
          <span>Idea to narrative to official signal</span>
          <small>Every chain is generated from attached TOR Phi data and keeps the evidence trail visible.</small>
        </div>
      </section>

      <section className="influence-chain-dashboard">
        <div className="influence-chain-summary">
          <div>
            <strong>{chains.length}</strong>
            <span>Generated chains</span>
          </div>
          <div>
            <strong>{thinkNetwork.people.length}</strong>
            <span>Policy actors</span>
          </div>
          <div>
            <strong>{mediaNetwork.mentions.length}</strong>
            <span>Media records</span>
          </div>
          <div>
            <strong>{sourceCount}</strong>
            <span>Source links</span>
          </div>
        </div>

        <div className="influence-chain-list">
          {chains.map((chain) => (
            <article className="influence-chain-card" key={chain.id}>
              <header>
                <div>
                  <p className="eyebrow">{chain.frame}</p>
                  <h2>{chain.title}</h2>
                  <p>{chain.thesis}</p>
                </div>
                <span className={chain.confidence >= 70 ? "chain-confidence high" : "chain-confidence"}>
                  {chain.confidence}% confidence
                </span>
              </header>

              <div className="chain-node-track">
                {chain.nodes.map((node, index) => (
                  <div className="chain-node-wrap" key={`${chain.id}-${node.type}-${index}`}>
                    <InfluenceChainNode node={node} />
                    {index < chain.nodes.length - 1 ? <ArrowRight className="chain-arrow" size={18} /> : null}
                  </div>
                ))}
              </div>

              <div className="chain-action-grid">
                <section>
                  <h3>What This Means</h3>
                  <p>{chain.meaning}</p>
                </section>
                <section>
                  <h3>Diplomatic Move</h3>
                  <p>{chain.action}</p>
                </section>
                <section>
                  <h3>Watch Next</h3>
                  <p>{chain.watch}</p>
                </section>
              </div>

              <DepthDossier items={getChainDepthDossier(chain)} compact />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function InfluenceChainNode({ node }) {
  const Icon = node.icon;
  const content = (
    <>
      <span>{node.type}</span>
      <div>
        <Icon size={18} />
        <strong>{node.title}</strong>
      </div>
      <p>{node.summary}</p>
      {node.meta ? <small>{node.meta}</small> : null}
    </>
  );

  return node.href ? (
    <a className="chain-node" href={node.href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <article className="chain-node">
      {content}
    </article>
  );
}

function DepthDossier({ items, compact = false }) {
  const visibleItems = (items ?? []).filter((item) => item?.title && item?.body);
  if (visibleItems.length === 0) return null;

  return (
    <div className={compact ? "depth-dossier compact" : "depth-dossier"}>
      {visibleItems.map((item) => {
        const Icon = item.icon || FileSearch;

        return (
          <article key={item.title}>
            <div>
              <Icon size={15} />
              <strong>{item.title}</strong>
            </div>
            <p>{item.body}</p>
            {item.tags?.length ? (
              <div className="depth-tags">
                {item.tags.map((tag, index) => <span key={`${item.title}-${tag}-${index}`}>{tag}</span>)}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function InfluenceDirectoryHero({ country, eyebrow, title, description, icon, stats }) {
  return (
    <section className="profile-hero parliament-hero influence-hero">
      <div className="profile-hero-main">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <span>{country.name}</span>
        <p>{description}</p>
        <div className="profile-tags">
          {stats.map((stat) => <span key={stat.label}>{stat.value} {stat.label}</span>)}
        </div>
      </div>
      <div className="profile-hero-card">
        {icon}
        <strong>Influence Layer</strong>
        <span>{country.name}</span>
        <small>Source-backed directory with internal profiles and explicit uncertainty.</small>
      </div>
    </section>
  );
}

function MediaDatabaseSection({ country, network }) {
  const [query, setQuery] = useState("");
  const [outletFilter, setOutletFilter] = useState("All");
  const [framingFilter, setFramingFilter] = useState("All");
  const [feedLane, setFeedLane] = useState("global");
  const outletOptions = useMemo(() => ["All", ...network.outlets.map((outlet) => outlet.shortName)], [network.outlets]);
  const framingOptions = useMemo(() => ["All", ...new Set(network.mentions.map((mention) => mention.framing).filter(Boolean))], [network.mentions]);
  const mediaFeedSources = useMemo(() => getMediaFeedSources(country, network, feedLane), [country, network, feedLane]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredMentions = useMemo(() => {
    return network.mentions.filter((mention) => {
      const outlet = mediaOutletsById.get(mention.outletId);
      const authors = mention.authorIds.map((id) => mediaAuthorsById.get(id)).filter(Boolean);
      const haystack = [
        mention.title,
        mention.framing,
        mention.summary,
        mention.evidenceNote,
        outlet?.name,
        outlet?.shortName,
        ...mention.topics,
        ...authors.flatMap((author) => [author.name, author.outlet, author.role, author.stanceSignal, ...author.beat])
      ].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesOutlet = outletFilter === "All" || outlet?.shortName === outletFilter;
      const matchesFraming = framingFilter === "All" || mention.framing === framingFilter;
      return matchesQuery && matchesOutlet && matchesFraming;
    });
  }, [network.mentions, normalizedQuery, outletFilter, framingFilter]);
  const averageScore = network.mentions.length
    ? Math.round(network.mentions.reduce((sum, mention) => sum + mention.score, 0) / network.mentions.length)
    : 0;

  return (
    <div className="panel wide media-register-panel media-directory-panel">
      <div className="panel-title">
        <Newspaper size={19} />
        <h3>{country.name} Media Monitor</h3>
      </div>

      <div className="media-summary">
        <div>
          <strong>{network.outlets.length.toLocaleString()}</strong>
          <span>Outlets</span>
        </div>
        <div>
          <strong>{network.authors.length.toLocaleString()}</strong>
          <span>People / desks</span>
        </div>
        <div>
          <strong>{network.mentions.length.toLocaleString()}</strong>
          <span>Records</span>
        </div>
        <div>
          <strong>{formatMediaScore(averageScore)}</strong>
          <span>Average frame</span>
        </div>
      </div>

      <div className="media-controls">
        <label>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search outlet, author, Kurdistan, KRG, PKK, Iraq..." />
        </label>
        <select value={outletFilter} onChange={(event) => setOutletFilter(event.target.value)}>
          {outletOptions.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={framingFilter} onChange={(event) => setFramingFilter(event.target.value)}>
          {framingOptions.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <section className="media-feed-panel">
        <div className="panel-title compact-title">
          <Newspaper size={17} />
          <h3>Daily Media Feed Sources</h3>
        </div>
        <div className="media-feed-head">
          <p>
            Use these source portals to refresh daily media intake. All Country is the broad stream; Iraq and Kurdistan are focused searches for extraction into the country brief.
          </p>
          <div className="daily-brief-tabs compact-tabs" role="tablist" aria-label={`${country.name} media feed filters`}>
            {dailyBriefTabs.map((tab) => (
              <button className={feedLane === tab.key ? "active" : ""} key={tab.key} onClick={() => setFeedLane(tab.key)} type="button">
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="media-intake-grid">
          {mediaFeedSources.map((source) => (
            <a href={source.url} target="_blank" rel="noreferrer" key={`${feedLane}-${source.label}-${source.url}`}>
              <strong>{source.label}</strong>
              <span>{source.kind}</span>
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
      </section>

      <div className="media-directory-layout">
        <section>
          <div className="panel-title compact-title">
            <Globe2 size={17} />
            <h3>Outlets</h3>
          </div>
          <div className="media-outlet-grid">
            {network.outlets.map((outlet) => (
              <article className="media-outlet-card" key={outlet.id}>
                <header>
                  <div>
                    <strong>{outlet.name}</strong>
                    <span>{outlet.type}</span>
                  </div>
                  <small className={getFramingClass(outlet.favorabilityScore)}>{outlet.favorabilityLabel}</small>
                </header>
                <p>{outlet.coveragePattern}</p>
                <div className="media-outlet-meta">
                  <span>{formatMediaScore(outlet.favorabilityScore)}</span>
                  <span>{outlet.influence}</span>
                </div>
                <a href={outlet.archiveUrl} target="_blank" rel="noreferrer">
                  Archive source <ExternalLink size={13} />
                </a>
                <DepthDossier items={getMediaOutletDepthDossier(outlet, network.mentions.filter((mention) => mention.outletId === outlet.id), country)} compact />
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="panel-title compact-title">
            <UsersRound size={17} />
            <h3>People And Desks</h3>
          </div>
          <div className="media-author-grid">
            {network.authors.map((author) => (
              <a className="media-author-card" href={profileHref(country, makeMediaAuthorActor(author, country.id))} target="_blank" rel="noreferrer" key={author.id}>
                <strong>{author.name}</strong>
                <span>{author.outlet} / {author.role}</span>
                <p>{author.stanceSignal}</p>
                <small>{author.beat.join(", ")}</small>
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="panel-title compact-title media-record-title">
        <FileSearch size={17} />
        <h3>Mention Records And Intake Slots</h3>
      </div>
      <div className="media-mention-list">
        {filteredMentions.map((mention) => {
          const outlet = mediaOutletsById.get(mention.outletId);
          const authors = mention.authorIds.map((id) => mediaAuthorsById.get(id)).filter(Boolean);

          return (
            <article className="media-mention-card" key={mention.id}>
              <header>
                <div>
                  <strong>{mention.title}</strong>
                  <span>{outlet?.name ?? "Outlet not listed"} / {mention.date}</span>
                </div>
                <small className={getFramingClass(mention.score)}>{mention.framing} {formatMediaScore(mention.score)}</small>
              </header>
              <p>{mention.summary}</p>
              <div className="media-topic-row">
                {mention.topics.map((topic) => <span key={`${mention.id}-${topic}`}>{topic}</span>)}
              </div>
              <div className="media-mention-footer">
                <div className="media-author-links">
                  {authors.map((author) => (
                    <a href={profileHref(country, makeMediaAuthorActor(author, country.id))} target="_blank" rel="noreferrer" key={`${mention.id}-${author.id}`}>
                      {author.name} <UserRound size={13} />
                    </a>
                  ))}
                </div>
                <a className="inline-link" href={mention.url} target="_blank" rel="noreferrer">
                  Source <ExternalLink size={13} />
                </a>
              </div>
              <small className="media-evidence-note">{mention.evidenceNote}</small>
              <DepthDossier items={getMediaMentionDepthDossier(mention, outlet, authors, country)} compact />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DeclassifiedDirectoryPage({ country, file }) {
  return (
    <main className="profile-page intelligence-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>
      <section className="profile-hero parliament-hero intelligence-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">TOR Phi Declassified Archive</p>
          <h1>{country.name} Declassified Pages</h1>
          <span>{country.name}</span>
          <p>
            Declassified papers, reading rooms, FOIA releases, archival slots, and interpretation axes are kept here as their own country database.
          </p>
          <div className="profile-tags">
            <span>{(file?.documents ?? []).length.toLocaleString()} records</span>
            <span>{(file?.agencies ?? []).length.toLocaleString()} agencies</span>
            <span>{(file?.analysisAxes ?? []).length.toLocaleString()} analysis axes</span>
          </div>
        </div>
        <div className="profile-hero-card">
          <FileSearch size={42} />
          <strong>Internal Archive</strong>
          <span>{country.name}</span>
          <small>Original sources remain linked inside each record</small>
        </div>
      </section>
      <IntelligenceTab country={country} file={file} />
    </main>
  );
}

function IntelligenceTab({ country, file }) {
  const documents = file.documents ?? [];
  const agencies = file.agencies ?? [];
  const axes = file.analysisAxes ?? [];
  const totalRelevance = documents.reduce((sum, item) => sum + item.relevance, 0) || 1;
  const themeScores = axes.map((axis) => {
    const matching = documents.filter((doc) => doc.themes.includes(axis) || doc.whatItMeans.toLowerCase().includes(axis.toLowerCase()));
    const score = matching.reduce((sum, doc) => sum + doc.relevance, 0);
    return { axis, score, count: matching.length, width: Math.max(8, Math.round((score / totalRelevance) * 100)) };
  });

  return (
    <section className="intelligence-workspace">
      <div className="intel-brief">
        <div>
          <p className="eyebrow">Declassified Layer</p>
          <h2>{country.name} Declassified Pages</h2>
          <p>
            This page is for declassified intelligence, archival releases, FOIA reading rooms, and historical security assessments that mention Kurdistan, Kurdish actors, KRG, Peshmerga, Iraq federalism, or regional Kurdish politics.
          </p>
        </div>
        <div className="intel-status">
          <Radar size={26} />
          <strong>{documents.length}</strong>
          <span>declassified slots / records</span>
        </div>
      </div>

      <div className="intel-grid">
        <section className="panel">
          <div className="panel-title">
            <Building2 size={19} />
            <h3>Agency / Archive Portals</h3>
          </div>
          <div className="agency-list">
            {agencies.map((agency) => (
              <article key={agency.name}>
                <div>
                  <strong>{agency.shortName}</strong>
                  <span>{agency.name}</span>
                </div>
                <p>{agency.focus}</p>
                <a href={agency.url} target="_blank" rel="noreferrer">
                  {agency.archive} <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="panel intel-graph-panel">
          <div className="panel-title">
            <BarChart3 size={19} />
            <h3>Analysis Graph</h3>
          </div>
          <div className="intel-graph">
            {themeScores.map((item) => (
              <div className="intel-bar-row" key={item.axis}>
                <span>{item.axis}</span>
                <div className="intel-bar">
                  <i style={{ width: `${item.width}%` }} />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
          <p className="graph-note">Bars show how current source slots map to analysis themes. As real documents are added, this becomes a historical pattern map.</p>
        </section>

        <section className="panel wide">
          <div className="panel-title">
            <FileSearch size={19} />
            <h3>Document Intake And Interpretation</h3>
          </div>
          <div className="intel-doc-list">
            {documents.map((doc) => (
              <article className="intel-doc" key={doc.id}>
                <header>
                  <div>
                    <strong>{doc.title}</strong>
                    <span>{doc.agency} / {doc.sourceType}</span>
                  </div>
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    Source <ExternalLink size={13} />
                  </a>
                </header>
                <div className="intel-doc-meta">
                  <span>{doc.classificationStatus}</span>
                  <span>Document: {doc.documentDate}</span>
                  <span>Release: {doc.releaseDate}</span>
                  <span>{doc.stanceSignal}</span>
                </div>
                <div className="intel-doc-body">
                  <div>
                    <h4>What It Says</h4>
                    <p>{doc.whatItSays}</p>
                  </div>
                  <div>
                    <h4>What It Means</h4>
                    <p>{doc.whatItMeans}</p>
                  </div>
                </div>
                <div className="intel-theme-row">
                  {doc.themes.map((theme) => <span key={theme}>{theme}</span>)}
                </div>
                <p className="analyst-note">{doc.analystNotes}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function MediaTab({ country }) {
  const [query, setQuery] = useState("");
  const [outletFilter, setOutletFilter] = useState("All");
  const [framingFilter, setFramingFilter] = useState("All");
  const outletOptions = useMemo(() => ["All", ...usMediaOutlets.map((outlet) => outlet.shortName)], []);
  const authorIdsWithMentions = useMemo(() => new Set(usMediaMentions.flatMap((mention) => mention.authorIds)), []);
  const authorsWithMentions = useMemo(
    () => usMediaAuthors.filter((author) => authorIdsWithMentions.has(author.id)),
    [authorIdsWithMentions]
  );
  const filteredMentions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return usMediaMentions.filter((mention) => {
      const outlet = mediaOutletsById.get(mention.outletId);
      const authors = mention.authorIds.map((id) => mediaAuthorsById.get(id)).filter(Boolean);
      const haystack = [
        mention.title,
        mention.date,
        mention.framing,
        mention.summary,
        mention.evidenceNote,
        outlet?.name,
        outlet?.shortName,
        ...mention.topics,
        ...authors.map((author) => `${author.name} ${author.role} ${author.outlet} ${author.stanceSignal}`)
      ].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesOutlet = outletFilter === "All" || outlet?.shortName === outletFilter;
      const matchesFraming = matchesMediaFraming(mention, framingFilter);

      return matchesQuery && matchesOutlet && matchesFraming;
    });
  }, [query, outletFilter, framingFilter]);
  const favorableMentions = usMediaMentions.filter((mention) => mention.score > 5).length;
  const criticalMentions = usMediaMentions.filter((mention) => mention.score < -5).length;
  const unscoredMentions = usMediaMentions.filter((mention) => /unscored/i.test(mention.framing)).length;

  return (
    <section className="media-workspace">
      <div className="media-brief">
        <div>
          <p className="eyebrow">U.S. Media Monitoring Layer</p>
          <h2>Top Outlet Kurdistan Mentions</h2>
          <p>
            This page is the place to track every Kurdistan/KRG mention by major U.S. outlets, classify whether the framing is favorable, critical, mixed, or unscored, and attach internal profiles to the writers producing that coverage.
          </p>
        </div>
        <div className="media-status">
          <Newspaper size={26} />
          <strong>{usMediaOutlets.length}</strong>
          <span>top outlets watched</span>
        </div>
      </div>

      <div className="media-grid">
        <section className="panel media-method">
          <div className="panel-title">
            <Scale size={19} />
            <h3>{mediaMethodology.label}</h3>
          </div>
          <p>{mediaMethodology.description}</p>
          <div className="media-factors">
            {mediaMethodology.factors.map(([label, weight]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{weight}%</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel media-graph-panel">
          <div className="panel-title">
            <BarChart3 size={19} />
            <h3>Outlet Framing Graph</h3>
          </div>
          <div className="media-summary">
            <div>
              <strong>{usMediaMentions.length}</strong>
              <span>mention records</span>
            </div>
            <div>
              <strong>{authorsWithMentions.length}</strong>
              <span>writer profiles</span>
            </div>
            <div>
              <strong>{favorableMentions}</strong>
              <span>favorable</span>
            </div>
            <div>
              <strong>{criticalMentions}</strong>
              <span>critical</span>
            </div>
          </div>
          <div className="media-graph" aria-label="Media framing graph">
            {usMediaOutlets.map((outlet) => (
              <div className="media-bar-row" key={outlet.id}>
                <span>{outlet.shortName}</span>
                <div className="media-bar">
                  <i className={outlet.favorabilityScore >= 0 ? "positive-fill" : "negative-fill"} style={{ width: `${Math.max(4, Math.abs(outlet.favorabilityScore))}%` }} />
                </div>
                <strong>{formatMediaScore(outlet.favorabilityScore)}</strong>
              </div>
            ))}
          </div>
          <p className="graph-note">{unscoredMentions} archive intake records are deliberately unscored until individual articles and bylines are attached.</p>
        </section>

        <section className="panel wide media-intake-panel">
          <div className="panel-title">
            <FileSearch size={19} />
            <h3>Every-Mention Intake Links</h3>
          </div>
          <div className="media-intake-grid">
            {usMediaOutlets.map((outlet) => (
              <a href={outlet.archiveUrl} target="_blank" rel="noreferrer" key={outlet.id}>
                <strong>{outlet.shortName}</strong>
                <span>{outlet.watchTerms.slice(0, 4).join(", ")}</span>
                <ExternalLink size={14} />
              </a>
            ))}
          </div>
        </section>

        <section className="panel wide media-register-panel">
          <div className="panel-title">
            <Database size={19} />
            <h3>Mention Register</h3>
          </div>
          <div className="media-controls">
            <label>
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search outlet, author, Erbil, KRG, Peshmerga, Iran..." />
            </label>
            <select value={outletFilter} onChange={(event) => setOutletFilter(event.target.value)}>
              {outletOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={framingFilter} onChange={(event) => setFramingFilter(event.target.value)}>
              {mediaFramingOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div className="media-mention-list">
            {filteredMentions.map((mention) => {
              const outlet = mediaOutletsById.get(mention.outletId);
              const authors = mention.authorIds.map((id) => mediaAuthorsById.get(id)).filter(Boolean);

              return (
                <article className="media-mention-card" key={mention.id}>
                  <header>
                    <div>
                      <span>{mention.date} / {outlet?.shortName ?? mention.outletId}</span>
                      <strong>{mention.title}</strong>
                    </div>
                    <small className={getFramingClass(mention.score)}>{mention.framing} / {formatMediaScore(mention.score)}</small>
                  </header>
                  <p>{mention.summary}</p>
                  <div className="media-topic-row">
                    {mention.topics.map((topic) => <span key={topic}>{topic}</span>)}
                  </div>
                  <div className="media-mention-footer">
                    <div className="media-author-links">
                      {authors.length > 0 ? authors.map((author) => (
                        <a href={profileHref(country, makeMediaAuthorActor(author))} target="_blank" rel="noreferrer" key={author.id}>
                          <UserRound size={13} /> {author.name}
                        </a>
                      )) : <span>No byline attached yet</span>}
                    </div>
                    <a className="source-pill" href={mention.url} target="_blank" rel="noreferrer">
                      <ExternalLink size={12} /> Source
                    </a>
                  </div>
                  <small className="media-evidence-note">{mention.evidenceNote}</small>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel wide media-outlets-panel">
          <div className="panel-title">
            <MessageSquareQuote size={19} />
            <h3>Outlet Profiles</h3>
          </div>
          <div className="media-outlet-grid">
            {usMediaOutlets.map((outlet) => {
              const mentions = usMediaMentions.filter((mention) => mention.outletId === outlet.id);

              return (
                <article className="media-outlet-card" key={outlet.id}>
                  <header>
                    <div>
                      <strong>{outlet.name}</strong>
                      <span>{outlet.type}</span>
                    </div>
                    <small className={getFramingClass(outlet.favorabilityScore)}>{formatMediaScore(outlet.favorabilityScore)}</small>
                  </header>
                  <p>{outlet.coveragePattern}</p>
                  <div className="media-outlet-meta">
                    <span>{outlet.favorabilityLabel}</span>
                    <span>{mentions.length} records</span>
                  </div>
                  <a href={outlet.archiveUrl} target="_blank" rel="noreferrer">
                    Search archive <ExternalLink size={13} />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel wide media-authors-panel">
          <div className="panel-title">
            <UsersRound size={19} />
            <h3>Writers Covering Kurdistan</h3>
          </div>
          <div className="media-author-grid">
            {authorsWithMentions.map((author) => {
              const count = usMediaMentions.filter((mention) => mention.authorIds.includes(author.id)).length;

              return (
                <a className="media-author-card" href={profileHref(country, makeMediaAuthorActor(author))} target="_blank" rel="noreferrer" key={author.id}>
                  <div>
                    <strong>{author.name}</strong>
                    <span>{author.outlet} / {author.role}</span>
                  </div>
                  <p>{author.stanceSignal}</p>
                  <small>{count} mention records</small>
                </a>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}

function ThinkTankSection({ country }) {
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState("All");
  const network = getThinkTankNetwork(country.id);
  const sortedTanks = useMemo(() => [...network.tanks].sort((a, b) => b.proximityScore - a.proximityScore), [network.tanks]);
  const sourceCount = network.tanks.reduce((sum, tank) => sum + tank.sources.length, 0);
  const highProximityCount = network.tanks.filter((tank) => tank.proximityScore >= 70).length;
  const kurdistanSpecificCount = network.tanks.filter((tank) => hasThinkTankTerm(tank, "kurd")).length;
  const filteredTanks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortedTanks.filter((tank) => {
      const people = tank.people.map((id) => thinkTankPeopleById.get(id)).filter(Boolean);
      const haystack = [
        tank.name,
        tank.shortName,
        tank.type,
        tank.proximityLabel,
        tank.proximityRationale,
        tank.middleEastPolicy,
        tank.iraqPolicy,
        tank.kurdistanPolicy,
        tank.specificity,
        ...tank.evidence,
        ...tank.sources.map(([label, url]) => `${label} ${url}`),
        ...people.flatMap((person) => [
          person.name,
          person.role,
          person.adminConnection,
          person.policySignal,
          ...person.expertise
        ])
      ].join(" ").toLowerCase();

      return (!normalizedQuery || haystack.includes(normalizedQuery)) && matchesThinkTankFocus(tank, people, focus);
    });
  }, [query, focus, sortedTanks]);

  return (
    <div className="panel wide thinktank-panel">
      <div className="panel-title">
        <Building2 size={19} />
        <h3>{country.name} Think Tanks And Policy Networks</h3>
      </div>

      <div className="thinktank-layout">
        <section className="thinktank-method">
          <div>
            <p className="eyebrow">{thinkTankMethodology.label}</p>
            <p>{thinkTankMethodology.description}</p>
          </div>
          <div className="thinktank-factors">
            {thinkTankMethodology.factors.map(([label, weight]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{weight}%</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="thinktank-graph-panel">
          <div className="thinktank-summary">
            <div>
              <strong>{network.tanks.length}</strong>
              <span>Think tanks</span>
            </div>
            <div>
              <strong>{network.people.length}</strong>
              <span>Named people</span>
            </div>
            <div>
              <strong>{highProximityCount}</strong>
              <span>High proximity</span>
            </div>
            <div>
              <strong>{sourceCount}</strong>
              <span>Source links</span>
            </div>
          </div>
          <div className="thinktank-graph" aria-label="Think tank administration proximity graph">
            {sortedTanks.map((tank) => (
              <div className="thinktank-bar-row" key={tank.id}>
                <span>{tank.shortName}</span>
                <div className="thinktank-bar">
                  <i style={{ width: `${tank.proximityScore}%` }} />
                </div>
                <strong>{tank.proximityScore}</strong>
              </div>
            ))}
          </div>
          <p className="graph-note">
            {kurdistanSpecificCount} institutions have direct Kurdistan/KRG relevance. The score measures visible proximity signals, not secret access.
          </p>
          <div className="thinktank-matrix" aria-label="Think tank influence map">
            <span className="matrix-axis x-axis">Administration proximity</span>
            <span className="matrix-axis y-axis">Kurdistan specificity</span>
            {sortedTanks.map((tank) => (
              <span
                className="thinktank-dot"
                style={{
                  left: `${tank.proximityScore}%`,
                  bottom: `${getThinkTankSpecificityScore(tank)}%`
                }}
                title={`${tank.name}: ${tank.proximityScore}/100 proximity, ${tank.specificity} specificity`}
                key={`matrix-${tank.id}`}
              >
                {tank.shortName}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="thinktank-controls">
        <label>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search think tank, person, Kurdistan, Iran, source..." />
        </label>
        <select value={focus} onChange={(event) => setFocus(event.target.value)}>
          {thinkTankFocusOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </div>

      <div className="thinktank-list">
        {filteredTanks.map((tank) => {
          const people = tank.people.map((id) => thinkTankPeopleById.get(id)).filter(Boolean);

          return (
            <article className="thinktank-card" key={tank.id}>
              <header>
                <div>
                  <strong>{tank.name}</strong>
                  <span>{tank.type}</span>
                </div>
                <div className="thinktank-score">
                  <strong>{tank.proximityScore}</strong>
                  <span>{tank.proximityLabel}</span>
                </div>
              </header>

              <p className="thinktank-rationale">{tank.proximityRationale}</p>

              <div className="thinktank-policy-grid">
                <div>
                  <h4>Middle East</h4>
                  <p>{tank.middleEastPolicy}</p>
                </div>
                <div>
                  <h4>Iraq</h4>
                  <p>{tank.iraqPolicy}</p>
                </div>
                <div>
                  <h4>Kurdistan / KRG</h4>
                  <p>{tank.kurdistanPolicy}</p>
                </div>
              </div>

              <DepthDossier items={getThinkTankDepthDossier(tank, people, country)} compact />

              <div className="thinktank-card-bottom">
                <section>
                  <h4>Specific Evidence</h4>
                  <ul className="thinktank-evidence">
                    {tank.evidence.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </section>

                <section>
                  <h4>People To Track</h4>
                  <div className="thinktank-people">
                    {people.map((person) => (
                      <a className="thinktank-person-link" href={profileHref(country, makeThinkTankPersonActor(person, country.id))} target="_blank" rel="noreferrer" key={person.id}>
                        <div>
                          <strong>{person.name}</strong>
                          <span>{person.role}</span>
                        </div>
                        <small>{person.policySignal}</small>
                        <UserRound size={15} />
                      </a>
                    ))}
                  </div>
                </section>
              </div>

              <div className="thinktank-source-list">
                {tank.sources.map(([label, url]) => {
                  const sourcePerson = findThinkTankPersonForSource(label, url, country.id);
                  const href = sourcePerson ? profileHref(country, makeThinkTankPersonActor(sourcePerson, country.id)) : url;
                  const sourceLabel = sourcePerson ? `${sourcePerson.name} profile` : label;

                  return (
                    <a href={href} target="_blank" rel="noreferrer" key={`${tank.id}-${label}`}>
                      {sourceLabel}{sourcePerson ? <UserRound size={13} /> : <ExternalLink size={13} />}
                    </a>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ParliamentAccessCard({ entry }) {
  return (
    <div className="panel wide parliament-access-card">
      <div className="parliament-access-copy">
        <div className="panel-title">
          <Landmark size={19} />
          <h3>{entry.title}</h3>
        </div>
        <p>{entry.description}</p>
        <div className="parliament-access-stats">
          {entry.stats.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
        {entry.note ? <small>{entry.note}</small> : null}
      </div>
      <a className="parliament-access-button" href={entry.href} target="_blank" rel="noreferrer">
        {entry.buttonLabel} <ArrowRight size={16} />
      </a>
    </div>
  );
}

function CongressDirectoryPage({ country }) {
  const [query, setQuery] = useState("");
  const [chamber, setChamber] = useState("All");
  const [state, setState] = useState("All");
  const entry = getParliamentEntry(country);

  return (
    <main className="profile-page parliament-directory-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>
      <ParliamentDirectoryHero country={country} entry={entry} />
      <ParliamentSessionPanel country={country} />
      <section className="parliament-dashboard">
        <CongressSection
          query={query}
          setQuery={setQuery}
          chamber={chamber}
          setChamber={setChamber}
          state={state}
          setState={setState}
          country={country}
        />
      </section>
    </main>
  );
}

function ParliamentDirectoryPage({ country }) {
  if (country.id === "turkey") {
    const actor = makeTurkishParliamentInstitutionActor();
    return <ParliamentProfilePage actor={actor} country={country} profile={getTurkishParliamentInstitutionProfile()} />;
  }

  if (country.id === "france") {
    return <FranceParliamentDirectoryPage country={country} />;
  }

  if (nationalParliamentData[country.id]) {
    return <NationalParliamentDirectoryPage country={country} />;
  }

  return (
    <main className="profile-page parliament-directory-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>
      <section className="profile-section">
        <div className="panel-title">
          <Landmark size={18} />
          <h3>Parliament Database</h3>
        </div>
        <p className="empty-note">No parliament database has been attached for this country yet.</p>
      </section>
    </main>
  );
}

function FranceParliamentDirectoryPage({ country }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [department, setDepartment] = useState("All");
  const entry = getParliamentEntry(country);

  return (
    <main className="profile-page parliament-directory-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>
      <ParliamentDirectoryHero country={country} entry={entry} />
      <ParliamentSessionPanel country={country} />
      <section className="parliament-dashboard">
        <FranceParliamentSection
          query={query}
          setQuery={setQuery}
          group={group}
          setGroup={setGroup}
          department={department}
          setDepartment={setDepartment}
          country={country}
        />
      </section>
    </main>
  );
}

function NationalParliamentDirectoryPage({ country }) {
  const entry = getParliamentEntry(country);

  return (
    <main className="profile-page parliament-directory-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>
      <ParliamentDirectoryHero country={country} entry={entry} />
      <ParliamentSessionPanel country={country} />
      <section className="parliament-dashboard">
        <NationalParliamentSection country={country} data={nationalParliamentData[country.id]} />
      </section>
    </main>
  );
}

function ForeignMinistryDirectoryPage({ country }) {
  const ministry = foreignMinistryData[country.id];
  const entry = getForeignMinistryEntry(country);

  if (!ministry) {
    return (
      <main className="profile-page parliament-directory-page">
        <header className="profile-page-top">
          <a href={countryHref(country)} className="back-link">
            <ArrowLeft size={16} /> Back to {country.name} file
          </a>
        </header>
        <section className="profile-section">
          <div className="panel-title">
            <Building2 size={18} />
            <h3>Foreign Ministry Database</h3>
          </div>
          <p className="empty-note">No foreign-ministry database has been attached for this country yet.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-page parliament-directory-page foreign-ministry-directory-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>
      <ForeignMinistryDirectoryHero country={country} ministry={ministry} entry={entry} />
      <section className="parliament-dashboard">
        <ForeignMinistrySection country={country} ministry={ministry} />
      </section>
    </main>
  );
}

function ForeignMinistryDirectoryHero({ country, ministry, entry }) {
  return (
    <section className="profile-hero parliament-hero foreign-ministry-hero">
      <div className="profile-hero-main">
        <p className="eyebrow">TOR Phi Foreign Ministry Database</p>
        <h1>{ministry.shortName}</h1>
        <span>{ministry.ministryName}</span>
        <p>{ministry.description}</p>
        <div className="profile-tags">
          {(entry?.stats ?? []).map((stat) => <span key={stat.label}>{stat.value} {stat.label}</span>)}
        </div>
      </div>
      <div className="profile-hero-card">
        <Building2 size={44} />
        <strong>Diplomatic Chain</strong>
        <span>{country.name}</span>
        <small>{ministry.sourceNote}</small>
      </div>
    </section>
  );
}

function ForeignMinistrySection({ country, ministry }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [bureau, setBureau] = useState("All");
  const people = ministry.people ?? [];
  const categoryOptions = useMemo(() => ["All", ...summarizeLocalCounts(people, (person) => person.category).map((item) => item.name)], [people]);
  const bureauOptions = useMemo(() => ["All", ...summarizeLocalCounts(people, (person) => person.bureau).map((item) => item.name)], [people]);
  const normalizedQuery = normalizeSearchText(query);
  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      const matchesQuery = !normalizedQuery || normalizeSearchText([
        person.name,
        person.title,
        person.bureau,
        person.category,
        person.importance,
        person.summary,
        person.background,
        person.kurdistanAssessment,
        ...(person.tags ?? []),
        ...(person.facts ?? []).flat(),
        ...(person.records ?? []).flatMap((record) => [record.title, record.summary, record.frame, record.source])
      ].join(" ")).includes(normalizedQuery);
      const matchesCategory = category === "All" || person.category === category;
      const matchesBureau = bureau === "All" || person.bureau === bureau;
      return matchesQuery && matchesCategory && matchesBureau;
    });
  }, [people, normalizedQuery, category, bureau]);
  const totalRecords = people.reduce((sum, person) => sum + (person.records?.length || 0), 0);
  const directKurdistanRecords = people.reduce((sum, person) => sum + (person.records ?? []).filter(isForeignMinistryKurdistanRecord).length, 0);
  const sourceLinks = people.reduce((sum, person) => sum + (person.sourceLinks?.length || 0), 0);

  return (
    <div className="panel wide congress-panel parliament-panel foreign-ministry-panel">
      <div className="panel-title">
        <Building2 size={19} />
        <h3>{ministry.shortName} People And Records</h3>
      </div>
      <div className="congress-summary">
        <div>
          <strong>{people.length.toLocaleString()}</strong>
          <span>profiles</span>
        </div>
        <div>
          <strong>{totalRecords.toLocaleString()}</strong>
          <span>official records</span>
        </div>
        <div>
          <strong>{directKurdistanRecords.toLocaleString()}</strong>
          <span>Kurdistan / Iraq hits</span>
        </div>
        <div>
          <strong>{sourceLinks.toLocaleString()}</strong>
          <span>source links</span>
        </div>
      </div>
      <div className="congress-controls parliament-controls france-parliament-controls">
        <label>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search minister, deputy, bureau, Iraq, KRG, Syria, Iran..." />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categoryOptions.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={bureau} onChange={(event) => setBureau(event.target.value)}>
          {bureauOptions.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="congress-list parliament-member-list foreign-ministry-list">
        {filteredPeople.map((person) => {
          const actor = makeForeignMinistryPersonActor(country.id, person);

          return (
            <article className="congress-row parliament-member-row foreign-ministry-row" key={person.id}>
              <div className="parliament-member-main">
                <ProfileMiniPortrait actor={actor} profile={{ imageUrl: person.imageUrl }} />
                <div>
                  <a className="profile-name-link" href={profileHref(country, actor)} target="_blank" rel="noreferrer">
                    {person.name}
                  </a>
                  <span>{person.title}</span>
                  <small>{person.importance}</small>
                </div>
              </div>
              <div className="congress-meta">
                <span>{person.category}</span>
                <span>{person.records?.length || 0} records</span>
                <span>{person.bureau}</span>
              </div>
            </article>
          );
        })}
      </div>
      <p className="congress-record-note">{ministry.sourceNote}</p>
    </div>
  );
}

function ParliamentDirectoryHero({ country, entry }) {
  return (
    <section className="profile-hero parliament-hero">
      <div className="profile-hero-main">
        <p className="eyebrow">TOR Phi {getLegislatureShortLabel(country)} Database</p>
        <h1>{entry?.title || `${country.name} ${getLegislatureShortLabel(country)}`}</h1>
        <span>{country.name}</span>
        <p>{entry?.description || "Search members, profiles, and records inside the project."}</p>
        <div className="profile-tags">
          {(entry?.stats ?? []).map((stat) => <span key={stat.label}>{stat.value} {stat.label}</span>)}
        </div>
      </div>
      <div className="profile-hero-card">
        <Landmark size={44} />
        <strong>Internal Records</strong>
        <span>{country.name}</span>
        <small>{entry?.note || "Profiles and records stay inside TOR Phi"}</small>
      </div>
    </section>
  );
}

function ParliamentSessionPanel({ country }) {
  const sessionArchive = useParliamentSessionArchive();
  const sessions = sessionArchive.sessionsByCountry?.[country.id] ?? [];
  const stats = sessionArchive.metadata?.countries?.[country.id];
  if (!stats && !sessions.length) return null;

  const imported = sessions.filter((session) => session.recordKind !== "source-slot");
  const sourceSlots = sessions.filter((session) => session.recordKind === "source-slot");
  const relevantCount = sessions.filter((session) => session.lane?.iraq || session.lane?.kurdistan).length;
  const visibleSessions = (imported.length ? imported : sessions).slice(0, 8);
  const connectors = stats?.connectors ?? [];

  return (
    <section className="parliament-session-panel">
      <div className="parliament-session-head">
        <div>
          <p className="eyebrow">Session Intake</p>
          <h3>{getLegislatureSessionLabel(country)} Feed</h3>
          <p>
            TOR Phi normalizes floor votes, speeches, sittings, and connector slots into one country brief stream,
            then tags Iraq, Kurdistan, security, diplomacy, and energy relevance before it reaches the analyst view.
            {sessionArchive.metadata?.generatedAt ? ` Latest local refresh: ${formatDailyDateTime(sessionArchive.metadata.generatedAt)}.` : ""}
          </p>
        </div>
        <a className="session-local-source" href={countrySessionHref(country)}>
          Open readable archive <Database size={14} />
        </a>
      </div>

      <div className="parliament-session-stats">
        <div>
          <strong>{(stats?.importedCount ?? imported.length).toLocaleString()}</strong>
          <span>imported proceedings</span>
        </div>
        <div>
          <strong>{(stats?.latestDate || "Watch")}</strong>
          <span>latest official date</span>
        </div>
        <div>
          <strong>{relevantCount.toLocaleString()}</strong>
          <span>Iraq / Kurdistan flags</span>
        </div>
        <div>
          <strong>{(stats?.sourceSlotCount ?? sourceSlots.length).toLocaleString()}</strong>
          <span>API source slots</span>
        </div>
      </div>

      <div className="parliament-session-grid">
        {visibleSessions.map((session) => (
          <article className={`parliament-session-card ${session.lane?.kurdistan ? "kurdistan" : session.lane?.iraq ? "iraq" : ""}`} key={session.id}>
            <div className="parliament-session-meta">
              <span>{formatDailyDate(session.date)}</span>
              <span>{session.chamber}</span>
              <span>{session.priority}</span>
            </div>
            <h4>
              <a href={`${countrySessionHref(country)}#${encodeURIComponent(session.id)}`}>
                {session.title}
              </a>
            </h4>
            <p>{shortenText(getSessionDailySummary(session, country), 280)}</p>
            <div className="parliament-session-tags">
              {(session.tags?.length ? session.tags : [session.sessionType]).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <div className="parliament-session-actions">
              <span>{session.sourceLabel} / {session.sourceConfidence}</span>
              {session.sourceUrl || session.liveSourceUrl ? (
                <a href={session.sourceUrl || session.liveSourceUrl} target="_blank" rel="noreferrer">
                  Official source <ExternalLink size={12} />
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {connectors.length ? (
        <div className="parliament-connector-strip">
          <strong>Refresh connectors</strong>
          <div>
            {connectors.map((connector) => (
              <a href={connector.url} target="_blank" rel="noreferrer" key={`${connector.label}-${connector.url}`} title={connector.refreshUse}>
                {connector.label}
                <span>{connector.kind}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CongressSection({ query, setQuery, chamber, setChamber, state, setState, country }) {
  const states = useMemo(() => ["All", ...new Set(usCongressMembers.map((member) => member.state).sort())], []);
  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return usCongressMembers.filter((member) => {
      const matchesQuery = !normalizedQuery || [
        member.name,
        member.party,
        member.state,
        member.districtLabel,
        member.role,
        member.id
      ].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesChamber = chamber === "All" || member.chamber === chamber;
      const matchesState = state === "All" || member.state === state;
      return matchesQuery && matchesChamber && matchesState;
    });
  }, [query, chamber, state]);

  return (
    <div className="panel wide congress-panel">
      <div className="panel-title">
        <Landmark size={19} />
        <h3>U.S. Congress Members</h3>
      </div>
      <div className="congress-summary">
        <div>
          <strong>{usCongressMetadata.total}</strong>
          <span>Total profiles</span>
        </div>
        <div>
          <strong>{usCongressMetadata.senators}</strong>
          <span>Senators</span>
        </div>
        <div>
          <strong>{usCongressMetadata.representatives}</strong>
          <span>House members and delegates</span>
        </div>
        <div>
          <strong>{filteredMembers.length}</strong>
          <span>Visible after filters</span>
        </div>
      </div>
      <div className="congress-controls">
        <label>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search member, state, party, district..." />
        </label>
        <select value={chamber} onChange={(event) => setChamber(event.target.value)}>
          {["All", "Senate", "House"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={state} onChange={(event) => setState(event.target.value)}>
          {states.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="congress-list">
        {filteredMembers.map((member) => {
          const actor = makeCongressActor(member);
          return (
            <article className="congress-row" key={member.id}>
              <div>
                <a className="profile-name-link" href={profileHref(country, actor)} target="_blank" rel="noreferrer">
                  {member.name}
                </a>
                <span>{member.role}</span>
              </div>
              <div className="congress-meta">
                <span>{member.party}</span>
                <span>{member.chamber}</span>
                <span>{member.districtLabel}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function FranceParliamentSection({ query, setQuery, group, setGroup, department, setDepartment, country }) {
  const groups = useMemo(() => ["All", ...franceParliamentMetadata.parties.map((item) => item.group)], []);
  const departments = useMemo(() => ["All", ...franceParliamentMetadata.departments.map((item) => item.department)], []);
  const filteredMembers = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return franceParliamentMembers.filter((member) => {
      const groupLabel = member.group?.shortLabel || member.group?.label || "No group listed";
      const departmentLabel = member.constituency?.department || "Not listed";
      const matchesQuery = !normalizedQuery || normalizeSearchText([
        member.name,
        groupLabel,
        member.group?.label,
        member.party?.label,
        member.constituency?.label,
        member.constituency?.department,
        member.constituency?.region,
        member.profession,
        member.contact?.emails?.join(" "),
        ...(member.committees ?? []).map((committee) => `${committee.label} ${committee.quality}`)
      ].join(" ")).includes(normalizedQuery);
      const matchesGroup = group === "All" || groupLabel === group;
      const matchesDepartment = department === "All" || departmentLabel === department;
      return matchesQuery && matchesGroup && matchesDepartment;
    });
  }, [query, group, department]);

  return (
    <div className="panel wide congress-panel parliament-panel">
      <div className="panel-title">
        <Landmark size={19} />
        <h3>French National Assembly Members</h3>
      </div>
      <div className="congress-summary">
        <div>
          <strong>{franceParliamentMetadata.total}</strong>
          <span>Current deputy profiles</span>
        </div>
        <div>
          <strong>{franceParliamentMetadata.parties.length}</strong>
          <span>Parliamentary groups</span>
        </div>
        <div>
          <strong>{franceParliamentMetadata.departments.length}</strong>
          <span>Departments / territories</span>
        </div>
        <div>
          <strong>{filteredMembers.length}</strong>
          <span>Visible after filters</span>
        </div>
      </div>
      <div className="congress-controls parliament-controls france-parliament-controls">
        <label>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search deputy, group, department, profession, committee..." />
        </label>
        <select value={group} onChange={(event) => setGroup(event.target.value)}>
          {groups.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={department} onChange={(event) => setDepartment(event.target.value)}>
          {departments.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="congress-list parliament-member-list">
        {filteredMembers.map((member) => {
          const actor = makeFranceParliamentMemberActor(member);
          const groupLabel = member.group?.shortLabel || member.group?.label || "No group listed";
          const departmentLabel = member.constituency?.department || "Not listed";
          return (
            <article className="congress-row parliament-member-row" key={member.id}>
              <div className="parliament-member-main">
                <ProfileMiniPortrait actor={actor} profile={{ imageUrl: member.imageUrl }} />
                <div>
                  <a className="profile-name-link" href={profileHref(country, actor)} target="_blank" rel="noreferrer">
                    {member.name}
                  </a>
                  <span>{groupLabel} / {member.constituency?.label || departmentLabel}</span>
                  <small>{member.committees?.[0] ? `${member.committees[0].label} / ${member.committees[0].quality || "Member"}` : member.profession || "Committee information pending"}</small>
                </div>
              </div>
              <div className="congress-meta">
                <span>{member.votePositionCount.toLocaleString()} vote positions</span>
                <span>{member.mandateCount || member.mandates?.length || 0} mandates</span>
                <span>{member.latestVoteDate || "No vote date"}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function NationalParliamentSection({ country, data }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [region, setRegion] = useState("All");
  const members = data.members ?? [];
  const metadata = data.metadata ?? {};
  const filterOptions = useMemo(() => ["All", ...summarizeLocalCounts(members, (member) => member[data.filterKey] || "Not listed").map((item) => item.name)], [members, data.filterKey]);
  const regionOptions = useMemo(() => ["All", ...summarizeLocalCounts(members, (member) => member[data.regionKey] || "Not listed").map((item) => item.name)], [members, data.regionKey]);
  const filteredMembers = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return members.filter((member) => {
      const filterValue = member[data.filterKey] || "Not listed";
      const regionValue = member[data.regionKey] || "Not listed";
      const matchesQuery = !normalizedQuery || normalizeSearchText([
        member.name,
        member.fullTitle,
        member.party,
        member.partyAbbreviation,
        member.faction,
        member.list,
        member.constituency,
        member.province,
        member.role,
        member.house,
        member.synopsis,
        member.latestVoteDate,
        member.latestQuestionDate
      ].join(" ")).includes(normalizedQuery);
      const matchesFilter = filter === "All" || filterValue === filter;
      const matchesRegion = region === "All" || regionValue === region;
      return matchesQuery && matchesFilter && matchesRegion;
    });
  }, [members, query, filter, region, data.filterKey, data.regionKey]);

  const totalVotes = members.reduce((sum, member) => sum + (member.votePositionCount || 0), 0);
  const totalQuestions = members.reduce((sum, member) => sum + (member.writtenQuestionCount || 0), 0);
  const totalSearchSlots = members.reduce((sum, member) => sum + (member.recordSearchCount || 0), 0);

  return (
    <div className="panel wide congress-panel parliament-panel national-parliament-panel">
      <div className="panel-title">
        <Landmark size={19} />
        <h3>{data.label} Members</h3>
      </div>
      <div className="congress-summary">
        <div>
          <strong>{metadata.total ?? members.length}</strong>
          <span>Current profiles</span>
        </div>
        <div>
          <strong>{filterOptions.length - 1}</strong>
          <span>{data.filterLabel} groups</span>
        </div>
        <div>
          <strong>{country.id === "uk" ? totalVotes.toLocaleString() : totalSearchSlots.toLocaleString()}</strong>
          <span>{country.id === "uk" ? "Vote rows imported" : "Source-search slots"}</span>
        </div>
        <div>
          <strong>{country.id === "uk" ? totalQuestions.toLocaleString() : filteredMembers.length}</strong>
          <span>{country.id === "uk" ? "Written questions" : "Visible after filters"}</span>
        </div>
      </div>
      <div className="congress-controls parliament-controls france-parliament-controls">
        <label>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${data.label}, member, ${data.filterLabel.toLowerCase()}, ${data.regionLabel.toLowerCase()}...`} />
        </label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          {filterOptions.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={region} onChange={(event) => setRegion(event.target.value)}>
          {regionOptions.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="congress-list parliament-member-list">
        {filteredMembers.map((member) => {
          const actor = makeNationalParliamentMemberActor(country.id, member);
          const primaryLabel = country.id === "uk" ? (member.partyAbbreviation || member.party) : member.faction;
          const secondaryLabel = country.id === "uk" ? member.constituency : `${member.constituency} / ${member.province}`;
          return (
            <article className="congress-row parliament-member-row" key={member.id}>
              <div className="parliament-member-main">
                <ProfileMiniPortrait actor={actor} profile={{ imageUrl: member.imageUrl }} />
                <div>
                  <a className="profile-name-link" href={profileHref(country, actor)} target="_blank" rel="noreferrer">
                    {member.name}
                  </a>
                  <span>{primaryLabel || "Not listed"} / {secondaryLabel || data.regionLabel}</span>
                  <small>{member.synopsis || member.role || "Official record shell ready for source review"}</small>
                </div>
              </div>
              <div className="congress-meta">
                {country.id === "uk" ? (
                  <>
                    <span>{(member.votePositionCount || 0).toLocaleString()} votes</span>
                    <span>{(member.writtenQuestionCount || 0).toLocaleString()} questions</span>
                    <span>{member.latestVoteDate || "No vote date"}</span>
                  </>
                ) : (
                  <>
                    <span>{member.province || "Province not listed"}</span>
                    <span>{member.recordSearchCount || 0} source slots</span>
                    <span>{member.legislature}</span>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function getParliamentEntry(country) {
  if (country.id === "usa") {
    return {
      title: "U.S. Congress Database",
      href: `${countryHref(country)}/congress`,
      buttonLabel: "Open Congress Database",
      description:
        "Search every current senator and representative in the internal Congress directory, then open a project profile or official-record page for the member you need.",
      stats: [
        { value: formatStatNumber(usCongressMetadata.total), label: "profiles" },
        { value: formatStatNumber(usCongressMetadata.senators), label: "senators" },
        { value: formatStatNumber(usCongressMetadata.representatives), label: "House members" }
      ],
      note: "Member names are kept in the Congress database, not in this country profile."
    };
  }

  if (country.id === "turkey") {
    const activityRows = turkishParliamentMembers.reduce((sum, member) => {
      return sum + (member.parliamentaryActivity ?? []).reduce((innerSum, item) => innerSum + (item.count || 0), 0);
    }, 0);

    return {
      title: "TBMM Database",
      href: `${countryHref(country)}/parliament`,
      buttonLabel: "Open TBMM Database",
      description:
        "Search the full Grand National Assembly of Turkiye roster with internal profiles, speeches, records, committees, biographies, photos, and Kurdistan Lens pages.",
      stats: [
        { value: formatStatNumber(turkishParliamentMetadata.total), label: "deputies" },
        { value: formatStatNumber(turkishParliamentMetadata.parties.length), label: "parties" },
        { value: formatStatNumber(activityRows), label: "record rows" }
      ],
      note: "Full deputy names and member-level records live inside the parliament database."
    };
  }

  if (country.id === "france") {
    const voteRows = franceParliamentMembers.reduce((sum, member) => sum + (member.votePositionCount || 0), 0);

    return {
      title: "French National Assembly Database",
      href: `${countryHref(country)}/parliament`,
      buttonLabel: "Open National Assembly Database",
      description:
        "Search all French National Assembly deputies with internal profiles, official portraits, mandates, committees, vote positions, and local records pages.",
      stats: [
        { value: formatStatNumber(franceParliamentMetadata.total), label: "deputies" },
        { value: formatStatNumber(franceParliamentMetadata.parties.length), label: "groups" },
        { value: formatStatNumber(voteRows), label: "vote rows" }
      ],
      note: "Deputy names are available after opening the dedicated parliament database."
    };
  }

  if (country.id === "uk") {
    const voteRows = ukParliamentMembers.reduce((sum, member) => sum + (member.votePositionCount || 0), 0);
    const questionRows = ukParliamentMembers.reduce((sum, member) => sum + (member.writtenQuestionCount || 0), 0);

    return {
      title: "UK House of Commons Database",
      href: `${countryHref(country)}/parliament`,
      buttonLabel: "Open House of Commons Database",
      description:
        "Search the current UK Commons roster with internal profiles, official thumbnails, contact fields, division votes, written questions, registered interests, and source-chain records.",
      stats: [
        { value: formatStatNumber(ukParliamentMetadata.total), label: "MPs" },
        { value: formatStatNumber(voteRows), label: "vote rows" },
        { value: formatStatNumber(questionRows), label: "questions" }
      ],
      note: "Full MP names and record rows are kept in the dedicated database page."
    };
  }

  if (country.id === "iran") {
    const searchSlots = iranParliamentMembers.reduce((sum, member) => sum + (member.recordSearchCount || 0), 0);

    return {
      title: "Iranian Majlis Database",
      href: `${countryHref(country)}/parliament`,
      buttonLabel: "Open Majlis Database",
      description:
        "Search the 12th-term Majlis roster with internal profiles, constituency/faction filters, Kurdistan-watch starting points, and official ICANA/Majlis Research Center source-search slots.",
      stats: [
        { value: formatStatNumber(iranParliamentMetadata.total), label: "members" },
        { value: formatStatNumber(iranParliamentMetadata.factions.length), label: "factions" },
        { value: formatStatNumber(searchSlots), label: "source slots" }
      ],
      note: "The official ParlIran host was unreachable during import; ICANA source searches are registered inside the database."
    };
  }

  return null;
}

function getLegislatureShortLabel(country) {
  const labels = {
    usa: "Congress",
    turkey: "TBMM",
    france: "National Assembly",
    uk: "House of Commons",
    iran: "Majlis"
  };
  return labels[country?.id] || "Legislature";
}

function getLegislatureSessionLabel(country) {
  const labels = {
    usa: "Congress Sessions",
    turkey: "TBMM Sessions",
    france: "National Assembly Sessions",
    uk: "House of Commons Sessions",
    iran: "Majlis Sessions"
  };
  return labels[country?.id] || "Legislative Sessions";
}

function getLegislatureWatchLabel(country) {
  const labels = {
    usa: "Congress Watch",
    turkey: "TBMM Watch",
    france: "National Assembly Watch",
    uk: "House of Commons Watch",
    iran: "Majlis Watch"
  };
  return labels[country?.id] || "Legislative Watch";
}

function getForeignMinistryEntry(country) {
  const ministry = foreignMinistryData[country.id];
  if (!ministry) return null;

  const recordCount = ministry.people.reduce((sum, person) => sum + (person.records?.length || 0), 0);
  const sourceCount = ministry.people.reduce((sum, person) => sum + (person.sourceLinks?.length || 0), 0);

  return {
    title: `${ministry.shortName} Database`,
    href: `${countryHref(country)}/foreign-ministry`,
    buttonLabel: "Open Foreign Ministry Database",
    description: ministry.description,
    stats: [
      { value: formatStatNumber(ministry.people.length), label: "profiles" },
      { value: formatStatNumber(recordCount), label: "records" },
      { value: formatStatNumber(sourceCount), label: "source links" }
    ],
    note: "Ministry names, deputy roles, resumes, source chains, and records live inside the dedicated database."
  };
}

function getCountryDocuments(countryId) {
  return foreignPolicyDocuments.filter((document) => document.countryId === countryId);
}

function getThinkTankNetwork(countryId) {
  const resolvedCountryId = countryId || "usa";
  const tanks = allThinkTanks.filter((tank) => (tank.countryId || "usa") === resolvedCountryId);
  const tankPersonIds = new Set(tanks.flatMap((tank) => tank.people ?? []));
  const people = allThinkTankPeople.filter((person) => (person.countryId || "usa") === resolvedCountryId || tankPersonIds.has(person.id));

  return { tanks, people };
}

function getMediaNetwork(countryId) {
  const resolvedCountryId = countryId || "usa";
  const outlets = allMediaOutlets.filter((outlet) => (outlet.countryId || "usa") === resolvedCountryId);
  const authors = allMediaAuthors.filter((author) => (author.countryId || "usa") === resolvedCountryId);
  const mentions = allMediaMentions.filter((mention) => (mention.countryId || "usa") === resolvedCountryId);

  return { outlets, authors, mentions };
}

function getMediaFeedSources(country, network, lane = "global") {
  const officialSourcePattern = /(white house|state department|defense|congress|senate|house clerk|mfa|foreign ministry|presidency|elysee|diplomatie|national assembly|gov\.uk|fcdo|hansard|parliament|iran mfa|president of iran)/i;
  const laneFeeds = dailyBriefSourceFeeds[country.id]?.[lane] ?? [];
  const portalFeeds = laneFeeds
    .filter(([label]) => !officialSourcePattern.test(label))
    .map(([label, url]) => ({ label, url, kind: lane === "global" ? "media portal" : `${lane} media search` }));
  const outletFeeds = (network.outlets ?? [])
    .filter((outlet) => outlet.archiveUrl)
    .map((outlet) => ({ label: outlet.name, url: outlet.archiveUrl, kind: "outlet archive" }));
  const seen = new Set();
  return [...portalFeeds, ...outletFeeds].filter((source) => {
    const key = `${source.label}-${source.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 14);
}

function findThinkTankPerson(countryId, slugOrId) {
  if (!slugOrId) return null;
  const normalized = slugify(slugOrId);
  const network = getThinkTankNetwork(countryId);
  return network.people.find((person) => person.id === slugOrId || slugify(person.name) === normalized) ?? null;
}

function findMediaAuthor(countryId, slugOrId) {
  if (!slugOrId) return null;
  const normalized = slugify(slugOrId);
  const network = getMediaNetwork(countryId);
  return network.authors.find((author) => author.id === slugOrId || slugify(author.name) === normalized) ?? null;
}

function getInfluenceChains(country) {
  const thinkNetwork = getThinkTankNetwork(country.id);
  const mediaNetwork = getMediaNetwork(country.id);
  const ministry = foreignMinistryData[country.id];
  const documents = getCountryDocuments(country.id);
  const strongestThinkTank = [...thinkNetwork.tanks].sort((a, b) => getThinkTankSpecificityScore(b) - getThinkTankSpecificityScore(a) || b.proximityScore - a.proximityScore)[0];
  const closestThinkTank = [...thinkNetwork.tanks].sort((a, b) => b.proximityScore - a.proximityScore)[0];
  const strongestMedia = [...mediaNetwork.mentions].sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0];
  const officialEvidence = [...country.evidence].sort((a, b) => Math.abs(b.impact * b.confidence) - Math.abs(a.impact * a.confidence))[0];
  const ministryRecord = ministry?.people?.flatMap((person) => (person.records ?? []).map((record) => ({ ...record, person })))
    .find((record) => /kurd|krg|iraq|erbil|syria|peshmerga|northern/i.test([record.title, record.summary, record.frame].join(" ")));
  const leadDocument = documents.find((document) => /kurd|iraq|middle east|foreign policy|security|intelligence/i.test([
    document.title,
    document.description,
    document.summaries?.middleEastKurdistanRelevance,
    ...(document.tags ?? [])
  ].join(" "))) ?? documents[0];

  return [
    buildInfluenceChain({
      id: `${country.id}-expert-to-policy`,
      title: "Expert Language To Official Policy Signal",
      frame: "Policy formation",
      thesis: strongestThinkTank
        ? `${strongestThinkTank.shortName} is a useful starting point for seeing how expert language about Iraq/Kurdistan can travel into official debate.`
        : "This country needs more think-tank source intake before expert-to-policy movement can be scored strongly.",
      confidence: strongestThinkTank && officialEvidence ? 78 : 52,
      nodes: [
        makeThinkTankChainNode(country, strongestThinkTank),
        makeMediaChainNode(country, strongestMedia),
        makeOfficialChainNode(officialEvidence),
        makeActionChainNode("Brief the actors", "Prepare a short KRG note that responds to the expert frame and gives officials source-ready language.")
      ],
      meaning: strongestThinkTank
        ? `${strongestThinkTank.name}'s current Kurdistan reading is: ${strongestThinkTank.kurdistanPolicy}`
        : "Think-tank intake is still too thin, so do not brief this as an established influence pathway yet.",
      action: "Give the relevant expert or institution a clean briefing pack: KRG position, evidence, maps, energy/security facts, and what language should be corrected.",
      watch: "Watch whether the same phrase or frame appears later in media, parliamentary questions, speeches, ministry readouts, or government statements."
    }),
    buildInfluenceChain({
      id: `${country.id}-media-pressure`,
      title: "Media Narrative To Political Pressure",
      frame: "Narrative movement",
      thesis: strongestMedia
        ? `${mediaOutletsById.get(strongestMedia.outletId)?.name ?? "A tracked outlet"} is already a measurable narrative source for Kurdistan-related framing.`
        : "Media intake slots exist, but article-level mention records need expansion before strong narrative movement can be assessed.",
      confidence: strongestMedia ? 72 : 45,
      nodes: [
        makeMediaChainNode(country, strongestMedia),
        makeThinkTankChainNode(country, closestThinkTank),
        makeOfficialChainNode(officialEvidence),
        makeActionChainNode("Shape the next story", "Identify the journalist or desk, then supply timely facts before the frame hardens.")
      ],
      meaning: strongestMedia
        ? `The strongest attached media signal is ${strongestMedia.framing} (${formatMediaScore(strongestMedia.score)}): ${strongestMedia.summary}`
        : "The database has outlet profiles, but not enough scored mentions. Start with archive ingestion by outlet and author.",
      action: "Create an outlet-by-outlet engagement plan: who gets background briefings, who gets data, who needs correction, and who should receive KRG voices directly.",
      watch: "Track whether negative frames use PKK/YPG language, corruption/oil risk language, separatism language, or humanitarian language."
    }),
    buildInfluenceChain({
      id: `${country.id}-official-channel`,
      title: "Official Channel To Diplomatic Opportunity",
      frame: "State channel",
      thesis: ministryRecord
        ? `${ministryRecord.person.name}'s ministry record gives a direct official channel to monitor.`
        : "The foreign ministry database provides the channel map even where Kurdistan-specific records still need deeper import.",
      confidence: ministryRecord ? 74 : 56,
      nodes: [
        makeMinistryChainNode(country, ministryRecord),
        makeDocumentChainNode(country, leadDocument),
        makeOfficialChainNode(officialEvidence),
        makeActionChainNode("Open a channel", "Match the KRG message to the bureau/person who already owns the Iraq, Syria, security, or regional file.")
      ],
      meaning: ministryRecord
        ? `The official channel is not abstract: ${ministryRecord.person.name} is tied to a record on ${ministryRecord.title}.`
        : "Use the ministry directory to decide which bureau and person owns the file before outreach.",
      action: "Build a one-page diplomatic note for the responsible bureau, with source citations and a clear ask.",
      watch: "Watch for changes in readouts, titles, meeting attendees, and whether KRG is named directly or folded into Iraq/northern Iraq/security language."
    })
  ];
}

function buildInfluenceChain(chain) {
  return chain;
}

function makeThinkTankChainNode(country, tank) {
  if (!tank) {
    return {
      type: "Think tank",
      icon: Network,
      title: "Source intake needed",
      summary: "Add think-tank reports, events, and named experts before this part of the chain can be scored.",
      meta: "No attached institution"
    };
  }

  const person = tank.people.map((id) => thinkTankPeopleById.get(id)).find(Boolean);
  return {
    type: "Think tank",
    icon: Network,
    title: tank.name,
    summary: tank.kurdistanPolicy,
    meta: `${tank.proximityScore}/100 proximity / ${tank.specificity} specificity`,
    href: person ? profileHref(country, makeThinkTankPersonActor(person, country.id)) : tank.sources[0]?.[1]
  };
}

function makeMediaChainNode(country, mention) {
  if (!mention) {
    return {
      type: "Media",
      icon: Newspaper,
      title: "Mention intake needed",
      summary: "Add article, broadcast, transcript, and desk records to measure how Kurdistan is being framed.",
      meta: "No scored mention"
    };
  }

  const outlet = mediaOutletsById.get(mention.outletId);
  const author = mention.authorIds.map((id) => mediaAuthorsById.get(id)).find(Boolean);
  return {
    type: "Media",
    icon: Newspaper,
    title: mention.title,
    summary: mention.summary,
    meta: `${outlet?.shortName ?? "Outlet"} / ${mention.framing} ${formatMediaScore(mention.score)}`,
    href: author ? profileHref(country, makeMediaAuthorActor(author, country.id)) : mention.url
  };
}

function makeOfficialChainNode(evidence) {
  if (!evidence) {
    return {
      type: "Official signal",
      icon: Landmark,
      title: "Official record needed",
      summary: "Attach an official meeting, readout, speech, vote, or ministry record to complete the chain.",
      meta: "No country evidence"
    };
  }

  return {
    type: "Official signal",
    icon: Landmark,
    title: evidence.category,
    summary: evidence.claim,
    meta: `${evidence.date} / impact ${formatSigned(evidence.impact)}`,
    href: evidence.url
  };
}

function makeMinistryChainNode(country, record) {
  if (!record) {
    return {
      type: "Foreign ministry",
      icon: Building2,
      title: "Channel map",
      summary: "Use the foreign ministry database to find the bureau and person responsible for Iraq, Syria, security, or regional diplomacy.",
      meta: "Record intake pending",
      href: `${countryHref(country)}/foreign-ministry`
    };
  }

  return {
    type: "Foreign ministry",
    icon: Building2,
    title: record.person.name,
    summary: record.summary || record.title,
    meta: record.title,
    href: profileHref(country, makeForeignMinistryPersonActor(country.id, record.person))
  };
}

function makeDocumentChainNode(country, document) {
  if (!document) {
    return {
      type: "Book / document",
      icon: BookOpenCheck,
      title: "Document source needed",
      summary: "Attach books, theses, papers, or speeches that explain the worldview behind policy actors.",
      meta: "No document profile"
    };
  }

  return {
    type: "Book / document",
    icon: BookOpenCheck,
    title: document.title,
    summary: shortenText(document.summaries?.middleEastKurdistanRelevance || document.description, 220),
    meta: `${document.personName} / ${document.date}`,
    href: documentHref(document)
  };
}

function makeActionChainNode(title, summary) {
  return {
    type: "KRG move",
    icon: Sparkles,
    title,
    summary,
    meta: "Recommended action"
  };
}

function getThinkTankDepthDossier(tank, people, country) {
  const frame = classifyKurdistanFrame([tank.kurdistanPolicy, tank.iraqPolicy, tank.middleEastPolicy, ...tank.evidence].join(" "));
  const names = people.map((person) => person.name).slice(0, 3);
  const countryName = country?.name ?? "this country";

  return [
    {
      title: "How To Read It",
      icon: FileSearch,
      body: `${tank.name} is not just a source of reports; in TOR Phi it is treated as a policy-language producer. Its proximity score is ${tank.proximityScore}/100 and its Kurdistan specificity is ${tank.specificity}, so the analyst should weigh both access to power and actual knowledge of KRG/Kurdistan.`,
      tags: [tank.proximityLabel, tank.specificity, frame]
    },
    {
      title: "Kurdistan Frame",
      icon: Network,
      body: tank.kurdistanPolicy,
      tags: [frame, "KRG reading"]
    },
    {
      title: "Diplomatic Use",
      icon: Sparkles,
      body: names.length
        ? `Prioritize ${names.join(", ")} for monitoring, briefing, or invitation strategy. The goal is to see whether their language can shape a meeting note, testimony, media quote, or government talking point in ${countryName}.`
        : `Use this institution as a source lane first. Add named experts before recommending direct engagement in ${countryName}.`,
      tags: ["engagement", "expert network"]
    },
    {
      title: "Collection Plan",
      icon: Database,
      body: `Import the institution's Kurdistan, Iraq, Syria, Iran, Turkey, energy, and security reports; add event transcripts and speaker lists; then attach each named expert to internal profiles. Current source links attached: ${tank.sources.length}.`,
      tags: ["reports", "events", "testimony"]
    }
  ];
}

function getMediaOutletDepthDossier(outlet, mentions, country) {
  const countryName = country?.name ?? "this country";
  const scoreLabel = outlet.favorabilityScore > 5 ? "favorable" : outlet.favorabilityScore < -5 ? "critical/security-heavy" : "mixed or neutral";

  return [
    {
      title: "Narrative Role",
      icon: Newspaper,
      body: `${outlet.name} matters because ${outlet.influence} In this project it is treated as a narrative channel, not just a source link.`,
      tags: [outlet.type, scoreLabel]
    },
    {
      title: "Frame To Watch",
      icon: MessageSquareQuote,
      body: outlet.coveragePattern,
      tags: outlet.watchTerms.slice(0, 4)
    },
    {
      title: "Diplomatic Use",
      icon: Sparkles,
      body: outlet.favorabilityScore < -5
        ? `Use this outlet for correction and risk monitoring. If a story folds KRG into PKK/YPG, separatism, border threat, or oil-risk language, prepare a fast factual response before the frame spreads in ${countryName}.`
        : outlet.favorabilityScore > 5
          ? `Use this outlet to place human, partnership, stability, energy, or minority-protection evidence when the story needs a credible public channel in ${countryName}.`
          : `Use this outlet as a baseline monitor. Neutral or wire-style language is valuable because it often becomes the phrasing copied by other institutions.`,
      tags: ["press strategy", "framing"]
    },
    {
      title: "Collection Plan",
      icon: Database,
      body: `Import every article, wire item, transcript, video, photo essay, and byline matching: ${outlet.watchTerms.join(", ")}. Current scored/intake records attached to this outlet: ${mentions.length}.`,
      tags: ["archive intake", "bylines"]
    }
  ];
}

function getMediaMentionDepthDossier(mention, outlet, authors, country) {
  const authorNames = authors.map((author) => author.name).join(", ") || "desk or byline pending";
  const frame = mention.score > 5 ? "favorable" : mention.score < -5 ? "critical" : "mixed";

  return [
    {
      title: "Why It Matters",
      icon: MessageSquareQuote,
      body: `This record gives TOR Phi a concrete narrative sample from ${outlet?.name ?? "an outlet"} rather than a general guess. It is scored ${formatMediaScore(mention.score)} and labeled ${mention.framing}.`,
      tags: [frame, outlet?.shortName ?? "media"]
    },
    {
      title: "Attribution",
      icon: UserRound,
      body: `The responsible media actor is ${authorNames}. Their internal profile should accumulate every related Kurdistan/KRG/Iraq/Syria/Iran item so the project can distinguish one article from a repeated pattern.`,
      tags: ["author trail", "repeat coverage"]
    },
    {
      title: "Diplomatic Use",
      icon: Sparkles,
      body: mention.score < -5
        ? `Prepare a response note that corrects terminology and separates KRG from armed-party, border-security, or opposition-group frames where necessary.`
        : `Use this item as briefing evidence when explaining how ${country?.name ?? "this country"}'s media environment currently frames Kurdistan-related issues.`,
      tags: mention.topics.slice(0, 4)
    }
  ];
}

function getChainDepthDossier(chain) {
  const missingSources = chain.nodes.filter((node) => !node.href).map((node) => node.type);

  return [
    {
      title: "Confidence Logic",
      icon: Calculator,
      body: `${chain.confidence}% confidence means the chain has enough attached data to be useful as an analyst hypothesis, not enough to be treated as a proven causal pathway.`,
      tags: [chain.frame, `${chain.confidence}%`]
    },
    {
      title: "Source Gaps",
      icon: FileSearch,
      body: missingSources.length
        ? `Add direct source records for: ${missingSources.join(", ")}. The chain should get stronger only after the missing nodes have imported reports, articles, speeches, readouts, or records.`
        : "Every node has a clickable source or internal profile. Next step is to import the full text behind each linked source and attach exact citations.",
      tags: missingSources.length ? missingSources : ["source-backed"]
    },
    {
      title: "Analyst Use",
      icon: Sparkles,
      body: "Use this chain to prepare a meeting brief: what language already exists, who amplified it, which official signal it touches, and what KRG should ask for next.",
      tags: ["briefing", "action"]
    }
  ];
}

function getActorDepthDossier(actor, profile, country) {
  if (actor.thinkTankPerson) {
    const tank = getThinkTankForPerson(actor.thinkTankPerson, actor.thinkTankCountryId || country.id);
    return [
      {
        title: "Policy-Network Role",
        icon: Network,
        body: `${actor.name} should be read through both personal expertise and institutional position at ${actor.institution}. The person profile is useful only when tied to reports, events, testimony, media quotes, or government service.`,
        tags: [actor.institution, "think tank"]
      },
      {
        title: "Kurdistan Relevance",
        icon: FileSearch,
        body: tank?.kurdistanPolicy || profile.relationshipToKurdistan,
        tags: [tank?.specificity || "specificity pending"]
      },
      {
        title: "Next Source Work",
        icon: Database,
        body: "Attach authored reports, event appearances, testimony, interviews, social posts, and any government/campaign advisory roles. Do not infer access or stance without a visible source.",
        tags: ["reports", "events", "testimony"]
      }
    ];
  }

  if (actor.mediaAuthor) {
    const network = getMediaNetwork(actor.mediaCountryId || country.id);
    const mentions = network.mentions.filter((mention) => mention.authorIds.includes(actor.mediaAuthor.id));
    return [
      {
        title: "Narrative Role",
        icon: Newspaper,
        body: `${actor.name} is tracked as a narrative actor because their byline, desk, or outlet can shape how Kurdistan is described to policy audiences.`,
        tags: [actor.mediaAuthor.outlet, "media"]
      },
      {
        title: "Current Pattern",
        icon: MessageSquareQuote,
        body: mentions.length
          ? `This profile has ${mentions.length} attached mention record(s). Read the stance from repeated coverage, not from one article.`
          : "This profile is still an intake shell. Add article-level records before assigning a stable favorable or critical reading.",
        tags: [`${mentions.length} records`]
      },
      {
        title: "Next Source Work",
        icon: Database,
        body: "Import every Kurdistan/KRG/Northern Iraq/Erbil/Peshmerga/Yazidi/PKK/YPG item, classify framing, and separate KRG from broader Kurdish armed-actor coverage.",
        tags: ["article intake", "framing"]
      }
    ];
  }

  if (actor.foreignMinistryPerson) {
    return [
      {
        title: "Official Channel",
        icon: Building2,
        body: `${actor.name} matters because foreign-ministry roles connect public language to the actual bureaucratic channel that may own Iraq, Syria, Iran, security, or regional diplomacy.`,
        tags: [actor.institution, "official"]
      },
      {
        title: "Kurdistan Reading",
        icon: Network,
        body: profile.relationshipToKurdistan,
        tags: ["KRG", "official record"]
      },
      {
        title: "Next Source Work",
        icon: Database,
        body: "Attach meeting readouts, speeches, interviews, ministry statements, portfolio changes, and any direct KRG/Iraq/Syria references before assigning a firm stance.",
        tags: ["readouts", "statements"]
      }
    ];
  }

  return [
    {
      title: "Analyst Reading",
      icon: FileSearch,
      body: profile.relationshipToKurdistan || "This profile needs more source-grounded Kurdistan analysis before it can be briefed confidently.",
      tags: profile.tags?.slice(0, 4) ?? []
    },
    {
      title: "Diplomatic Use",
      icon: Sparkles,
      body: "Use this profile to decide whether the person is a direct channel, public signal, narrative amplifier, expert source, or monitoring target.",
      tags: ["channel", "signal", "monitor"]
    },
    {
      title: "Next Source Work",
      icon: Database,
      body: profile.monitoringTasks?.slice(0, 3).join(" ") || "Attach official records, direct statements, writings, meetings, and source citations.",
      tags: ["source work"]
    }
  ];
}

function classifyKurdistanFrame(text) {
  const value = `${text ?? ""}`.toLowerCase();
  if (/pkk|ypg|sdf|border|terror|security|militia|armed/.test(value)) return "security frame";
  if (/oil|energy|pipeline|market|investment|salary|budget/.test(value)) return "energy/economic frame";
  if (/autonomy|federal|self[- ]?rule|baghdad|erbil/.test(value)) return "federalism frame";
  if (/minority|yazidi|rights|humanitarian|civilian|refugee/.test(value)) return "humanitarian frame";
  if (/withdraw|restraint|troop|military footprint|de-escalation/.test(value)) return "force-posture frame";
  return "regional-policy frame";
}

function getCountryCoverageLanes({ country, intelligenceFile, parliamentEntry, foreignMinistryEntry, documents }) {
  const ministry = foreignMinistryData[country.id];
  const ministryRecordCount = ministry?.people?.reduce((sum, person) => sum + (person.records?.length || 0), 0) ?? 0;
  const intelligenceCount = intelligenceFile?.documents?.length ?? 0;
  const mediaNetwork = getMediaNetwork(country.id);
  const thinkTankNetwork = getThinkTankNetwork(country.id);
  const mediaCount = mediaNetwork.mentions.length || mediaNetwork.outlets.length || country.media.length;
  const thinkTankCount = thinkTankNetwork.tanks.length;
  const localDocumentCount = documents.filter((document) => document.localPdfAvailable || document.localPdfUrl).length;

  return [
    {
      key: "government",
      label: "Government",
      value: country.government.length.toLocaleString(),
      status: country.government.length ? "active" : "empty",
      enabled: country.government.length > 0,
      icon: Landmark,
      description: "Core offices and officeholders connected to the country profile."
    },
    {
      key: "parliament",
      label: getLegislatureShortLabel(country),
      value: parliamentEntry?.stats?.[0]?.value ?? "0",
      status: parliamentEntry ? "database" : "missing",
      enabled: Boolean(parliamentEntry),
      icon: Scale,
      href: parliamentEntry?.href,
      description: parliamentEntry?.note || "Member-level legislative records should live in the parliament database."
    },
    {
      key: "foreign-ministry",
      label: "Foreign Ministry",
      value: foreignMinistryEntry?.stats?.[0]?.value ?? "0",
      status: foreignMinistryEntry ? "database" : "missing",
      enabled: Boolean(foreignMinistryEntry),
      icon: Building2,
      href: foreignMinistryEntry?.href,
      description: ministryRecordCount
        ? `${ministryRecordCount.toLocaleString()} records attached to ministry people and offices.`
        : "Diplomatic chain, resumes, records, and sources live in the ministry database."
    },
    {
      key: "documents",
      label: "Books / Documents",
      value: documents.length.toLocaleString(),
      status: documents.length ? "profiled" : "empty",
      enabled: documents.length > 0,
      icon: BookOpenCheck,
      href: documents.length ? "#country-documents" : undefined,
      description: `${localDocumentCount.toLocaleString()} local PDFs or OCR-backed reading files are attached.`
    },
    {
      key: "intelligence",
      label: "Declassified",
      value: intelligenceCount.toLocaleString(),
      status: intelligenceCount ? "archive slots" : "intake needed",
      enabled: intelligenceCount > 0,
      icon: Radar,
      href: intelligenceCount ? `${countryHref(country)}/declassified` : undefined,
      description: "Declassified papers, agency portals, and interpretation axes are tracked in a dedicated archive page."
    },
    {
      key: "media",
      label: "Media",
      value: mediaCount.toLocaleString(),
      status: mediaCount ? "tracked" : "thin",
      enabled: mediaCount > 0,
      icon: Newspaper,
      href: `${countryHref(country)}/media`,
      description: country.id === "usa"
        ? "Top outlet mentions, authors, framing, and favorability are tracked in the Media database."
        : "Media outlets, desks, framing scores, and archive intake slots are tracked in the Media database."
    },
    {
      key: "think-tanks",
      label: "Think Tanks",
      value: thinkTankCount.toLocaleString(),
      status: thinkTankCount ? "database" : "future layer",
      enabled: thinkTankCount > 0,
      icon: Network,
      href: `${countryHref(country)}/think-tanks`,
      description: country.id === "usa"
        ? "Policy institutions and administration proximity are linked to named people and source records."
        : "Country-specific policy institutions, experts, proximity signals, and Kurdistan/Iraq readings are tracked here."
    }
  ];
}

function formatStatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function shortenText(text, limit = 180) {
  const normalized = `${text ?? ""}`.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trim()}...`;
}

function calculateScore(country) {
  const contributions = country.evidence.map((item) => ({
    ...item,
    weighted: Math.round(item.impact * item.confidence)
  }));
  const delta = contributions.reduce((sum, item) => sum + item.weighted, 0);
  const value = clamp(baseline + delta, 0, 100);
  const topDrivers = [...contributions].sort((a, b) => Math.abs(b.weighted) - Math.abs(a.weighted));
  return { value, delta, contributions, topDrivers };
}

function getNamedActorCount(country) {
  const ministryCount = foreignMinistryData[country.id]?.people?.length || 0;
  const influenceCount = getThinkTankNetwork(country.id).people.length + getMediaNetwork(country.id).authors.length;

  if (country.id === "usa") {
    return country.actors.length + ministryCount + usCongressMetadata.total + influenceCount;
  }

  if (country.id === "turkey") {
    return country.actors.length + ministryCount + turkishParliamentMetadata.total + influenceCount;
  }

  if (country.id === "france") {
    return country.actors.length + ministryCount + franceParliamentMetadata.total + influenceCount;
  }

  if (country.id === "uk") {
    return country.actors.length + ministryCount + ukParliamentMetadata.total + influenceCount;
  }

  if (country.id === "iran") {
    return country.actors.length + ministryCount + iranParliamentMetadata.total + influenceCount;
  }

  return country.actors.length + ministryCount + influenceCount;
}

function makeAnswer(country, query, mode, score) {
  const topPositive = score.topDrivers.find((item) => item.weighted > 0);
  const topNegative = score.topDrivers.find((item) => item.weighted < 0);

  if (mode === "people" || query.toLowerCase().includes("people") || query.toLowerCase().includes("actor")) {
    return [
      `${country.name}'s most important named channels are ${country.actors.slice(0, 5).map((actor) => actor.name).join(", ")}.`,
      `The strongest relationship records are ${country.relationships.slice(0, 3).map((item) => `${item.from} to ${item.to}`).join("; ")}.`,
      `The briefing should not treat institutions as abstract boxes. Each actor has a profile link and evidence IDs showing why they matter.`
    ];
  }

  if (mode === "score" || query.toLowerCase().includes("score") || query.toLowerCase().includes("why")) {
    return [
      `The stance index starts from a neutral baseline of 50 and moves to ${score.value} after adding evidence-weighted points.`,
      topPositive ? `The strongest positive driver is: ${topPositive.claim}` : "No positive driver is recorded yet.",
      topNegative ? `The strongest limiting factor is: ${topNegative.claim}` : "No negative constraint is recorded yet.",
      `This means the score is an explainable estimate, not a final truth. A stronger system would re-score automatically whenever new official statements, meetings, sanctions, votes, or media signals are added.`
    ];
  }

  return [
    `${country.name} is a ${country.priority.toLowerCase()} relationship for the Kurdistan Region. Current posture: ${country.posture}.`,
    country.summary,
    `The score is ${score.value} because the system starts at 50, adds positive evidence such as ${topPositive?.category.toLowerCase() ?? "documented contact"}, and subtracts constraints such as ${topNegative?.category.toLowerCase() ?? "unverified risk"}.`,
    `Near-term opportunities are ${country.opportunities.join(", ")}. Watch points are ${country.risks.join(", ")}.`
  ];
}

function EvidenceIds({ country, ids }) {
  return (
    <div className="evidence-tags">
      {ids.map((id) => {
        const item = country.evidence.find((evidence) => evidence.id === id);
        if (!item) return null;
        return <SourcePill item={item} key={id} compact />;
      })}
    </div>
  );
}

function GovernmentNameLink({ item, country }) {
  if (country.id === "turkey" && item.value === turkishParliamentName) {
    const profileActor = makeTurkishParliamentInstitutionActor();

    return (
      <a href={profileHref(country, profileActor)} target="_blank" rel="noreferrer">
        {item.value}<ArrowRight size={13} />
      </a>
    );
  }

  const foreignMinistryPerson = findForeignMinistryPersonByName(item.value, country.id) || findForeignMinistryPersonByName(item.value);
  if (foreignMinistryPerson) {
    const profileActor = makeForeignMinistryPersonActor(foreignMinistryPerson.countryId || country.id, foreignMinistryPerson);

    return (
      <a href={profileHref({ id: profileActor.foreignMinistryCountryId }, profileActor)} target="_blank" rel="noreferrer">
        {item.value}<ArrowRight size={13} />
      </a>
    );
  }

  const namedActor = findActor(item.value, country) || findActorAcrossCountries(item.value);
  if (namedActor) {
    return (
      <a href={profileHref(country, namedActor)} target="_blank" rel="noreferrer">
        {item.value}<ArrowRight size={13} />
      </a>
    );
  }

  const profileActor = actorProfiles[item.value]
    ? findActorAcrossCountries(item.value) || {
        name: item.value,
        institution: country.name,
        role: item.label,
        stance: "Government profile",
        url: item.url,
        evidenceIds: []
      }
    : null;

  if (profileActor) {
    return (
      <a href={profileHref(country, profileActor)} target="_blank" rel="noreferrer">
        {item.value}<ArrowRight size={13} />
      </a>
    );
  }

  return (
    <a href={item.url} target="_blank" rel="noreferrer">
      {item.value}<ExternalLink size={13} />
    </a>
  );
}

function ActorProfilePage({ actor, country }) {
  const profile = getActorProfile(actor);
  if (profile.kind === "Parliament") {
    return <ParliamentProfilePage actor={actor} country={country} profile={profile} />;
  }

  const [openDocumentId, setOpenDocumentId] = useState("");
  const readableDocuments = profile.readableDocuments ?? [];
  const researchDocuments = profile.researchDocuments ?? [];
  const socialArchive = getSocialProfileArchiveForActor(actor, country);
  const [profileCongressArchive, setProfileCongressArchive] = useState(null);
  const resumeTimeline = buildProfileResumeTimeline(profile);
  const actorDepth = getActorDepthDossier(actor, profile, country);
  const evidenceItems = actor.evidenceIds
    .map((id) => country.evidence.find((item) => item.id === id))
    .filter(Boolean);

  useEffect(() => {
    let cancelled = false;
    setProfileCongressArchive(null);
    if (!actor.congressMember?.id) return () => {
      cancelled = true;
    };

    loadCongressArchive(actor.congressMember.id).then((archive) => {
      if (!cancelled) setProfileCongressArchive(archive);
    });

    return () => {
      cancelled = true;
    };
  }, [actor.congressMember?.id]);

  return (
    <main className="profile-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>

      <section className="profile-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">Project Actor Profile</p>
          <h1>{actor.name}</h1>
          <span>{profile.currentRole || actor.institution}</span>
          <p>{profile.summary}</p>
          <div className="profile-tags">
            {profile.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
        <div className="profile-hero-card">
          <ProfilePortrait actor={actor} profile={profile} />
          <strong>{profile.kind}</strong>
          <span>{profile.country}</span>
          <small>{profile.imageCredit || `${country.name} evidence file`}</small>
        </div>
      </section>

      {resumeTimeline.length > 0 ? (
        <ResumeTimeline items={resumeTimeline} />
      ) : null}

      <ProfileSubnav actor={actor} country={country} active="profile" />

      <section className="profile-page-grid">
        <ProfileSection icon={<BriefcaseBusiness size={18} />} title="Biographical File">
          <dl className="profile-facts">
            {profile.biographyFacts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </ProfileSection>

        <ProfileSection icon={<Building2 size={18} />} title="Official Profiles">
          <LinkList items={profile.officialProfiles} />
        </ProfileSection>

        <ProfileSection icon={<AtSign size={18} />} title="Social And Media">
          <LinkList items={profile.social} />
        </ProfileSection>

        {socialArchive ? (
          <ProfileSection icon={<Radar size={18} />} title="Social And Political Readout">
            <SocialProfileArchivePanel
              archive={socialArchive}
              actor={actor}
              country={country}
              congressArchive={profileCongressArchive}
            />
          </ProfileSection>
        ) : null}

        <ProfileSection icon={<Network size={18} />} title="Relationship To Kurdistan">
          <p className="profile-long-text">{profile.relationshipToKurdistan}</p>
        </ProfileSection>

        <ProfileSection icon={<FileSearch size={18} />} title="Depth Dossier">
          <DepthDossier items={actorDepth} />
        </ProfileSection>

        {researchDocuments.length > 0 ? (
          <ProfileSection icon={<BookOpenCheck size={18} />} title="Books And Authored Texts">
            <div className="research-document-list">
              {researchDocuments.map((document) => {
                const isInternal = `${document.url}`.startsWith("/");

                return (
                  <a
                    className="research-document"
                    href={document.url}
                    target="_blank"
                    rel="noreferrer"
                    key={`${document.title}-${document.publisher}-${document.url}`}
                  >
                    <DocumentPoster
                      document={document}
                      className="research-document-poster"
                      fallbackTitle={document.title}
                    />
                    <div>
                      <strong>{document.title}</strong>
                      <span>{document.type} / {document.publisher} / {document.date}</span>
                      <p>{document.note}</p>
                      <small>{document.status || "Specific authored work"}</small>
                    </div>
                    {isInternal ? <ArrowRight size={14} /> : <ExternalLink size={14} />}
                  </a>
                );
              })}
            </div>
          </ProfileSection>
        ) : null}

        {profile.writingsAndStatements.length > 0 ? (
          <ProfileSection icon={<Newspaper size={18} />} title="Articles / Speeches / Interviews">
            <div className="profile-record-list">
              {profile.writingsAndStatements.map(([title, publisher, date, url]) => (
                <a href={url} target="_blank" rel="noreferrer" key={`${title}-${date}`}>
                  <strong>{title}</strong>
                  <span>{publisher} / {date}</span>
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          </ProfileSection>
        ) : null}

        {readableDocuments.length > 0 ? (
          <ProfileSection icon={<FileText size={18} />} title="In-App Reading Notes">
            <div className="readable-document-list">
              {readableDocuments.map((document) => {
                const isOpen = openDocumentId === document.id;

                return (
                  <article className="readable-document" key={document.id}>
                    <header>
                      <div>
                        <strong>{document.title}</strong>
                        <span>{document.publisher} / {document.date}</span>
                      </div>
                      <a href={document.sourceUrl} target="_blank" rel="noreferrer">
                        PDF source <ExternalLink size={13} />
                      </a>
                    </header>
                    <div className="readable-document-meta">
                      <span>{document.documentType}</span>
                      <span>{document.pages} pages</span>
                      <span>{document.wordLabel || `${document.wordCount.toLocaleString()} OCR words`}</span>
                    </div>
                    <p>{document.relevanceNote}</p>
                    <small>{document.extractionMethod}</small>
                    <button
                      className="readable-toggle"
                      type="button"
                      onClick={() => setOpenDocumentId(isOpen ? "" : document.id)}
                    >
                      <BookOpenCheck size={15} /> {isOpen ? "Hide content" : "Read content"}
                    </button>
                    {isOpen ? (
                      <pre className="readable-document-content">{document.content}</pre>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </ProfileSection>
        ) : null}

        <ProfileSection icon={<Quote size={18} />} title="Statements About KRG / Kurdistan">
          <div className="statement-list statement-timeline">
            {profile.statementsOnKurdistan.map((item) => (
              <article key={`${item.date}-${item.title}`}>
                <div>
                  <span>{item.date}</span>
                  <strong>{item.stance}</strong>
                </div>
                <h4>{item.title}</h4>
                <p>{item.summary}</p>
                <a href={item.url} target="_blank" rel="noreferrer">
                  Source {item.evidenceId ? `/ ${item.evidenceId}` : ""} <ExternalLink size={13} />
                </a>
              </article>
            ))}
          </div>
        </ProfileSection>

        <ProfileSection icon={<FileSearch size={18} />} title={`Evidence In ${country.name} File`}>
          {evidenceItems.length > 0 ? (
            <div className="profile-record-list">
              {evidenceItems.map((item) => (
                <a href={item.url} target="_blank" rel="noreferrer" key={item.id}>
                  <strong>{item.category}</strong>
                  <span>{item.date} / {item.reading}</span>
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          ) : (
            <p className="empty-note">No country-file evidence is attached yet. This actor should not be scored until records are added.</p>
          )}
        </ProfileSection>

        <ProfileSection icon={<ShieldCheck size={18} />} title="Monitoring Tasks">
          <div className="verification-list">
            {profile.monitoringTasks.map((task) => <span key={task}>{task}</span>)}
          </div>
        </ProfileSection>
      </section>
    </main>
  );
}

function DocumentPoster({ document, className = "", fallbackTitle = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const title = fallbackTitle || document.title || "Document";
  const hasPoster = document.posterUrl && !imageFailed;

  return (
    <div className={["document-poster", className, hasPoster ? "has-image" : ""].filter(Boolean).join(" ")}>
      {hasPoster ? (
        <img src={document.posterUrl} alt={`${title} poster`} loading="lazy" onError={() => setImageFailed(true)} />
      ) : (
        <div className="document-poster-fallback" aria-label={`${title} document poster`}>
          <FileText size={22} />
          <span>{document.documentType || document.type || "Document"}</span>
          <strong>{title}</strong>
        </div>
      )}
    </div>
  );
}

function TextBlock({ text, className = "profile-long-text" }) {
  const paragraphs = `${text ?? ""}`
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return <p className={className}>No analysis attached yet.</p>;

  return (
    <div className={`${className} text-block`}>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
  );
}

function DocumentProfilePage({ document, country }) {
  const person = findForeignMinistryPerson(document.countryId, document.personId);
  const actor = person
    ? makeForeignMinistryPersonActor(document.countryId, person)
    : findProfileActor(document.personName, country);
  const profileUrl = actor ? profileHref(country, actor) : countryHref(country);
  const pdfPath = document.localPdfPath || "";
  const localPathLabel = pdfPath ? `public${decodeURIComponent(pdfPath)}` : "Add a local PDF path in the document record";
  const sourceLabel = getSourceHostLabel(document.sourceUrl);
  const sourceLinks = dedupeLinkList([
    [`${document.personName} internal profile`, profileUrl],
    ...(document.sourceLinks ?? [])
  ]);

  return (
    <main className="profile-page document-profile-page">
      <header className="profile-page-top">
        <a href={profileUrl} className="back-link">
          <ArrowLeft size={16} /> Back to {document.personName} profile
        </a>
      </header>

      <section className="profile-hero document-profile-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">TOR Phi Document Profile</p>
          <h1>{document.title}</h1>
          <span>{document.documentType} / {document.publisher} / {document.date}</span>
          <p>{document.description}</p>
          <div className="profile-tags">
            <span>{document.personName}</span>
            <span>{country.name}</span>
            <span>{document.ocrStatus}</span>
            {(document.tags ?? []).slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
        <div className="profile-hero-card document-hero-card">
          <DocumentPoster document={document} className="document-hero-poster" />
          <strong>{document.documentType}</strong>
          <span>{document.personName}</span>
          <small>{document.posterCredit || sourceLabel}</small>
        </div>
      </section>

      <section className="document-profile-grid">
        <ProfileSection icon={<FileText size={18} />} title="Document Description">
          <TextBlock text={document.description} />
          <dl className="profile-facts document-facts">
            <div>
              <dt>Person</dt>
              <dd>{document.personName}</dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{country.name}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{document.documentType}</dd>
            </div>
            <div>
              <dt>Publisher / source</dt>
              <dd>{document.publisher}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{document.date}</dd>
            </div>
            {document.posterCredit ? (
              <div>
                <dt>Poster source</dt>
                <dd>{document.posterCredit}</dd>
              </div>
            ) : null}
          </dl>
        </ProfileSection>

        <ProfileSection icon={<Download size={18} />} title="Read / PDF Slot">
          <div className="document-read-panel">
            {document.localPdfAvailable ? (
              <a className="document-read-button" href={pdfPath} target="_blank" rel="noreferrer">
                <BookOpenCheck size={16} /> Read local PDF
              </a>
            ) : (
              <button className="document-read-button disabled" type="button" disabled>
                <BookOpenCheck size={16} /> Add PDF to read
              </button>
            )}
            <p>
              {document.localPdfAvailable
                ? "The local PDF is attached. OCR-backed summaries can be expanded from the file."
                : "A profile exists now; add the PDF at the reserved path and then OCR it for stronger summaries."}
            </p>
            <small>{localPathLabel}</small>
          </div>
        </ProfileSection>

        <ProfileSection icon={<BookOpenCheck size={18} />} title="Summary Of The Book / Document">
          <TextBlock text={document.summaries?.bookSummary} />
        </ProfileSection>

        <ProfileSection icon={<UserRound size={18} />} title={`What It Tells Us About ${document.personName}`}>
          <TextBlock text={document.summaries?.personInsight} />
        </ProfileSection>

        <ProfileSection icon={<Radar size={18} />} title="Middle East / Kurdistan Foreign Policy Relevance">
          <TextBlock text={document.summaries?.middleEastKurdistanRelevance} />
        </ProfileSection>

        {document.readingGuide?.length ? (
          <ProfileSection icon={<FileSearch size={18} />} title="Analyst Reading Guide">
            <div className="document-reading-guide">
              {document.readingGuide.map((item, index) => (
                <div key={item}>
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </ProfileSection>
        ) : null}

        {document.localPdfAvailable ? (
          <ProfileSection icon={<ShieldCheck size={18} />} title="Depth Status">
            <div className="document-source-basis">
              <p>This profile now has a deeper analytic brief. The next improvement is chapter-level extraction: named concepts, direct quotes, recurring terms, and a timeline of arguments from the OCR text.</p>
            </div>
          </ProfileSection>
        ) : (
          <ProfileSection icon={<ShieldCheck size={18} />} title="Depth Status">
            <div className="document-source-basis">
              <p>This profile is deeper than a normal bibliography entry, but it is still source-based until the PDF is added and OCRed. Once the PDF is attached, the summary should be upgraded from bibliographic analysis to text-level analysis.</p>
            </div>
          </ProfileSection>
        )}

        <ProfileSection icon={<Scale size={18} />} title="OCR And Source Basis">
          <div className="document-source-basis">
            <p>{document.ocrStatus}</p>
            <p>{document.sourceBasis}</p>
          </div>
        </ProfileSection>

        <ProfileSection icon={<Link2 size={18} />} title="Source Chain">
          <LinkList items={sourceLinks} />
        </ProfileSection>
      </section>
    </main>
  );
}

function getSourceHostLabel(url) {
  if (!url) return "Source pending";
  try {
    return new URL(url, window.location.href).hostname;
  } catch {
    return "Local source";
  }
}

function ProfileSubnav({ actor, country, active }) {
  const memberActivity = actor.turkishParliamentMember?.parliamentaryActivity ?? [];
  const prefetchSpeeches = () => getSpeechActivity(memberActivity).forEach((item) => loadActivityData(item.file, item));
  const prefetchRecords = () => getNonSpeechActivity(memberActivity).forEach((item) => loadActivityData(item.file, item));
  const prefetchLens = () => memberActivity.filter((item) => item.count > 0).forEach((item) => loadActivityData(item.file, item));
  const prefetchCongressRecords = () => actor.congressId ? loadCongressArchive(actor.congressId) : null;
  const prefetchFranceRecords = () => actor.franceParliamentMemberId ? loadFranceParliamentArchive(actor.franceParliamentMemberId) : null;
  const prefetchNationalRecords = () => actor.nationalParliamentMemberId ? loadNationalParliamentArchive(actor.nationalParliamentCountryId, actor.nationalParliamentMemberId) : null;

  return (
    <nav className="profile-subnav" aria-label="Profile sections">
      <a className={active === "profile" ? "active" : ""} href={profileHref(country, actor)}>
        <UserRound size={15} /> Profile
      </a>
      {actor.congressMember ? (
        <a className={active === "congress-records" ? "active" : ""} href={recordsHref(country, actor)} onMouseEnter={prefetchCongressRecords} onFocus={prefetchCongressRecords}>
          <FileSearch size={15} /> Congress Records
        </a>
      ) : null}
      {actor.turkishParliamentMember ? (
        <a className={active === "speeches" ? "active" : ""} href={speechHref(country, actor)} onMouseEnter={prefetchSpeeches} onFocus={prefetchSpeeches}>
          <MessageSquareQuote size={15} /> Speeches
        </a>
      ) : null}
      {actor.turkishParliamentMember ? (
        <a className={active === "records" ? "active" : ""} href={recordsHref(country, actor)} onMouseEnter={prefetchRecords} onFocus={prefetchRecords}>
          <FileSearch size={15} /> Records
        </a>
      ) : null}
      {actor.franceParliamentMember ? (
        <a className={active === "records" ? "active" : ""} href={recordsHref(country, actor)} onMouseEnter={prefetchFranceRecords} onFocus={prefetchFranceRecords}>
          <FileSearch size={15} /> Records
        </a>
      ) : null}
      {actor.nationalParliamentMember ? (
        <a className={active === "records" ? "active" : ""} href={recordsHref(country, actor)} onMouseEnter={prefetchNationalRecords} onFocus={prefetchNationalRecords}>
          <FileSearch size={15} /> Records
        </a>
      ) : null}
      {actor.foreignMinistryPerson ? (
        <a className={active === "records" ? "active" : ""} href={recordsHref(country, actor)}>
          <FileSearch size={15} /> Ministry Records
        </a>
      ) : null}
      <a className={active === "lens" ? "active" : ""} href={lensHref(country, actor)} onMouseEnter={prefetchLens} onFocus={prefetchLens}>
        <Radar size={15} /> Kurdistan Lens
      </a>
    </nav>
  );
}

function CongressRecordsPage({ actor, country }) {
  const member = actor.congressMember;
  const [archive, setArchive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadCongressArchive(member.id)
      .then((data) => {
        if (!cancelled) setArchive(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [member.id]);

  const recentVotes = archive?.houseClerk?.recentVotes ?? [];
  const importedCommittees = archive?.houseClerk?.profile?.committeesAndSubcommittees ?? [];
  const committees = importedCommittees.length > 0
    ? importedCommittees
    : (member.committees ?? []).map((committee) => ({ name: committee.name, url: committee.url, title: committee.title }));
  const normalizedQuery = query.trim().toLowerCase();
  const filteredVotes = recentVotes.filter((vote) => {
    if (!normalizedQuery) return true;
    return [vote.date, vote.rollCallNumber, vote.billNumber, vote.billTitle, vote.vote, vote.status]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
  const watchVotes = recentVotes.filter((vote) => /iraq|kurd|syria|iran|isis|war powers|lebanon|defense|foreign|security|intelligence|yazidi|sanction/i.test(`${vote.billNumber} ${vote.billTitle}`));
  const congressGovStatus = archive?.congressGov?.profile?.status === "skipped"
    ? "Congress.gov API data is registered but not bulk-imported because no API key is configured."
    : archive?.congressGov?.profile?.ok
      ? "Congress.gov structured API profile imported."
      : "Congress.gov structured API profile not imported yet.";
  const sourceUrls = (archive?.sourceUrls ?? [])
    .filter((source) => source.label !== "TOR Phi local archive record");

  return (
    <main className="profile-page">
      <header className="profile-page-top">
        <a href={profileHref(country, actor)} className="back-link">
          <ArrowLeft size={16} /> Back to {actor.name} profile
        </a>
      </header>

      <section className="profile-hero congress-record-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">Internal Congress Record</p>
          <h1>{actor.name}</h1>
          <span>{member.role}</span>
          <p>
            TOR Phi record page for official congressional sources: House Clerk profile/votes where available,
            Senate official source registry, Bioguide, Congress.gov endpoints, committee assignments, and source status.
          </p>
        </div>
        <div className="profile-hero-card">
          <ProfilePortrait actor={actor} profile={{ imageUrl: archive?.houseClerk?.profile?.photoUrl || getCongressImageUrl(member.id), kind: member.chamber, country: "United States", imageCredit: "Official congressional image source" }} />
          <strong>{member.chamber}</strong>
          <span>{member.party} / {member.districtLabel}</span>
          <small>{member.id}</small>
        </div>
      </section>

      <ProfileSubnav actor={actor} country={country} active="congress-records" />

      <section className="congress-record-shell">
        {loading ? (
          <div className="panel congress-record-empty">
            <Database size={20} />
            <strong>Loading local official archive...</strong>
          </div>
        ) : archive ? (
          <>
            <div className="congress-record-summary">
              <div>
                <strong>{member.chamber}</strong>
                <span>Chamber</span>
              </div>
              <div>
                <strong>{committees.length}</strong>
                <span>Committees / subcommittees</span>
              </div>
              <div>
                <strong>{recentVotes.length}</strong>
                <span>Latest House vote rows</span>
              </div>
              <div>
                <strong>{watchVotes.length}</strong>
                <span>Foreign-policy watch hits</span>
              </div>
            </div>

            <section className="profile-section congress-record-section">
              <div className="panel-title">
                <Database size={18} />
                <h3>Import Status</h3>
              </div>
              <div className="congress-status-grid">
                <div>
                  <strong>{archive.houseClerk?.profileFetch?.ok ? "Imported" : member.chamber === "House" ? "Not imported" : "Not applicable"}</strong>
                  <span>House Clerk profile</span>
                </div>
                <div>
                  <strong>{recentVotes.length > 0 ? "Imported" : member.chamber === "House" ? "Not imported" : "Not applicable"}</strong>
                  <span>House recent votes</span>
                </div>
                <div>
                  <strong>{archive.congressGov?.profile?.ok ? "Imported" : archive.congressGov?.profile?.status === "skipped" ? "Registered" : "Pending"}</strong>
                  <span>Congress.gov API</span>
                </div>
                <div>
                  <strong>{archive.senate?.sourceStatus ? "Registered" : member.chamber === "Senate" ? "Pending" : "Not applicable"}</strong>
                  <span>Senate feeds</span>
                </div>
              </div>
              <p className="congress-record-note">{congressGovStatus}</p>
            </section>

            <section className="profile-section congress-record-section">
              <div className="panel-title">
                <BriefcaseBusiness size={18} />
                <h3>Official Profile Snapshot</h3>
              </div>
              <dl className="profile-facts">
                <div>
                  <dt>Role</dt>
                  <dd>{member.role}</dd>
                </div>
                <div>
                  <dt>Party</dt>
                  <dd>{member.party}</dd>
                </div>
                <div>
                  <dt>Current term</dt>
                  <dd>{member.currentTerm.start} to {member.currentTerm.end}</dd>
                </div>
                <div>
                  <dt>Office phone</dt>
                  <dd>{archive.houseClerk?.profile?.phone || member.contact.phone || "Not listed"}</dd>
                </div>
                <div>
                  <dt>Office address</dt>
                  <dd>{member.contact.address || archive.houseClerk?.profile?.contactLines?.join(", ") || "Not listed"}</dd>
                </div>
                <div>
                  <dt>Generated</dt>
                  <dd>{archive.generatedAt ? new Date(archive.generatedAt).toLocaleString() : "Not listed"}</dd>
                </div>
              </dl>
            </section>

            <section className="profile-section congress-record-section">
              <div className="panel-title">
                <Landmark size={18} />
                <h3>Committees And Subcommittees</h3>
              </div>
              <div className="congress-chip-list">
                {committees.length > 0 ? committees.map((committee) => (
                  <a href={committee.url || "#"} target="_blank" rel="noreferrer" key={`${committee.name}-${committee.url}`}>
                    {committee.title ? `${committee.title} / ` : ""}{committee.name}
                    <ExternalLink size={13} />
                  </a>
                )) : (
                  <span>No committee assignments imported yet.</span>
                )}
              </div>
            </section>

            {recentVotes.length > 0 ? (
              <section className="profile-section congress-record-section">
                <div className="panel-title">
                  <Scale size={18} />
                  <h3>Latest House Votes</h3>
                </div>
                <div className="congress-record-controls">
                  <label>
                    <Search size={16} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search votes, bill titles, Iraq, Syria, defense..." />
                  </label>
                  <span>{filteredVotes.length} shown</span>
                </div>
                <div className="congress-vote-table">
                  <div className="congress-vote-head">
                    <span>Date</span>
                    <span>Roll</span>
                    <span>Bill</span>
                    <span>Vote</span>
                    <span>Status</span>
                  </div>
                  {filteredVotes.map((vote) => (
                    <a href={vote.sourceUrl} target="_blank" rel="noreferrer" className="congress-vote-row" key={`${vote.rollCallNumber}-${vote.billNumber}-${vote.date}`}>
                      <span>{vote.date}</span>
                      <strong>{vote.rollCallNumber}</strong>
                      <span>
                        <b>{vote.billNumber || "No bill number"}</b>
                        <small>{vote.billTitle}</small>
                      </span>
                      <span>{vote.vote}</span>
                      <span>{vote.status}</span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {watchVotes.length > 0 ? (
              <section className="profile-section congress-record-section">
                <div className="panel-title">
                  <Radar size={18} />
                  <h3>Foreign-Policy Watch Hits</h3>
                </div>
                <div className="congress-watch-list">
                  {watchVotes.slice(0, 8).map((vote) => (
                    <a href={vote.sourceUrl} target="_blank" rel="noreferrer" key={`watch-${vote.rollCallNumber}-${vote.billNumber}`}>
                      <strong>{vote.billNumber || `Roll ${vote.rollCallNumber}`}</strong>
                      <span>{vote.billTitle}</span>
                      <small>{vote.date} / {vote.vote} / {vote.status}</small>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="profile-section congress-record-section">
              <div className="panel-title">
                <Link2 size={18} />
                <h3>Official Source Chain</h3>
              </div>
              <div className="congress-source-grid">
                <a href={`/source/us-congress-official/members/${member.id}.json`} target="_blank" rel="noreferrer">
                  <strong>Raw local evidence file</strong>
                  <span>TOR Phi JSON archive for this member</span>
                  <FileText size={14} />
                </a>
                {sourceUrls.map((source) => (
                  <a href={source.url} target="_blank" rel="noreferrer" key={`${source.label}-${source.url}`}>
                    <strong>{source.label}</strong>
                    <span>{new URL(source.url, window.location.href).hostname}</span>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="panel congress-record-empty">
            <FileSearch size={20} />
            <strong>No local Congress archive found for {actor.name}.</strong>
          </div>
        )}
      </section>
    </main>
  );
}

function FranceParliamentRecordsPage({ actor, country }) {
  const member = actor.franceParliamentMember;
  const profile = getFranceParliamentMemberProfile(member);
  const [archive, setArchive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadFranceParliamentArchive(member.id)
      .then((data) => {
        if (!cancelled) setArchive(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [member.id]);

  const votes = archive?.votes?.recent ?? [];
  const watchVotes = archive?.votes?.watch ?? [];
  const mandates = archive?.mandates ?? member.mandates ?? [];
  const ethicsRecusals = archive?.ethicsRecusals ?? [];
  const normalizedQuery = normalizeSearchText(query);
  const filteredVotes = votes.filter((vote) => {
    if (!normalizedQuery) return true;
    return normalizeSearchText([
      vote.date,
      vote.number,
      vote.position,
      vote.title,
      vote.object,
      vote.dossier,
      vote.result,
      vote.type
    ].join(" ")).includes(normalizedQuery);
  });
  const sourceUrls = (archive?.sourceUrls ?? member.sourceLinks?.map(([label, url]) => ({ label, url })) ?? [])
    .filter((source) => source.label !== "TOR Phi records");

  return (
    <main className="profile-page">
      <header className="profile-page-top">
        <a href={profileHref(country, actor)} className="back-link">
          <ArrowLeft size={16} /> Back to {actor.name} profile
        </a>
      </header>

      <section className="profile-hero congress-record-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">Internal French Parliament Record</p>
          <h1>{actor.name}</h1>
          <span>{profile.currentRole}</span>
          <p>
            TOR Phi record page for official Assemblee nationale sources: profile fields, active mandates,
            committee and group memberships, public vote positions, ethics recusal records, and source status.
          </p>
        </div>
        <div className="profile-hero-card">
          <ProfilePortrait actor={actor} profile={profile} />
          <strong>{member.group?.shortLabel || "National Assembly"}</strong>
          <span>{member.constituency?.label || "France"}</span>
          <small>{member.id}</small>
        </div>
      </section>

      <ProfileSubnav actor={actor} country={country} active="records" />

      <section className="congress-record-shell">
        {loading ? (
          <div className="panel congress-record-empty">
            <Database size={20} />
            <strong>Loading local French Assembly archive...</strong>
          </div>
        ) : archive ? (
          <>
            <div className="congress-record-summary">
              <div>
                <strong>{archive.votes?.totalPositions?.toLocaleString?.() ?? 0}</strong>
                <span>Vote positions matched</span>
              </div>
              <div>
                <strong>{mandates.length}</strong>
                <span>Active mandates / roles</span>
              </div>
              <div>
                <strong>{watchVotes.length}</strong>
                <span>Foreign-policy watch hits</span>
              </div>
              <div>
                <strong>{ethicsRecusals.length}</strong>
                <span>Ethics recusals</span>
              </div>
            </div>

            <section className="profile-section congress-record-section">
              <div className="panel-title">
                <BriefcaseBusiness size={18} />
                <h3>Official Profile Snapshot</h3>
              </div>
              <dl className="profile-facts">
                <div>
                  <dt>Parliamentary group</dt>
                  <dd>{member.group?.label || "Not listed"}</dd>
                </div>
                <div>
                  <dt>Political party</dt>
                  <dd>{member.party?.label || "Not listed"}</dd>
                </div>
                <div>
                  <dt>Constituency</dt>
                  <dd>{member.constituency?.label || "Not listed"}</dd>
                </div>
                <div>
                  <dt>Mandate start</dt>
                  <dd>{member.currentMandate?.takingOfficeDate || member.currentMandate?.startDate || "Not listed"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{member.contact?.emails?.[0] || "Not listed"}</dd>
                </div>
                <div>
                  <dt>Generated</dt>
                  <dd>{archive.generatedAt ? new Date(archive.generatedAt).toLocaleString() : "Not listed"}</dd>
                </div>
              </dl>
            </section>

            <section className="profile-section congress-record-section">
              <div className="panel-title">
                <Landmark size={18} />
                <h3>Active Mandates And Committees</h3>
              </div>
              <div className="congress-chip-list">
                {mandates.length > 0 ? mandates.map((mandate) => (
                  <span key={mandate.id}>
                    {mandate.shortLabel || mandate.label}
                    {mandate.quality ? ` / ${mandate.quality}` : ""}
                    {mandate.startDate ? ` / since ${mandate.startDate}` : ""}
                  </span>
                )) : (
                  <span>No active mandate records imported.</span>
                )}
              </div>
            </section>

            <section className="profile-section congress-record-section">
              <div className="panel-title">
                <Scale size={18} />
                <h3>Latest Vote Positions</h3>
              </div>
              <div className="congress-record-controls">
                <label>
                  <Search size={16} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vote title, dossier, date, position, Iraq, Syria..." />
                </label>
                <span>{filteredVotes.length} shown from latest {votes.length}</span>
              </div>
              <div className="congress-vote-table france-vote-table">
                <div className="congress-vote-head">
                  <span>Date</span>
                  <span>Vote</span>
                  <span>Subject</span>
                  <span>Position</span>
                  <span>Result</span>
                </div>
                {filteredVotes.map((vote) => (
                  <article className="congress-vote-row" key={`${vote.id}-${vote.position}-${vote.seat}-${vote.date}`}>
                    <span>{vote.date}</span>
                    <strong>{vote.number || vote.id}</strong>
                    <span>
                      <b>{vote.dossier || vote.type || "Public vote"}</b>
                      <small>{vote.title || vote.object}</small>
                      <a href={vote.sourceUrl} target="_blank" rel="noreferrer">Official source <ExternalLink size={12} /></a>
                    </span>
                    <span>{vote.position}{vote.delegated ? " / delegated" : ""}</span>
                    <span>{vote.result}</span>
                  </article>
                ))}
              </div>
            </section>

            {watchVotes.length > 0 ? (
              <section className="profile-section congress-record-section">
                <div className="panel-title">
                  <Radar size={18} />
                  <h3>Foreign-Policy Watch Hits</h3>
                </div>
                <div className="congress-watch-list">
                  {watchVotes.slice(0, 10).map((vote) => (
                    <a href={vote.sourceUrl} target="_blank" rel="noreferrer" key={`watch-${vote.id}-${vote.position}`}>
                      <strong>{vote.dossier || `Vote ${vote.number}`}</strong>
                      <span>{vote.title || vote.object}</span>
                      <small>{vote.date} / {vote.position} / {vote.result}</small>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {ethicsRecusals.length > 0 ? (
              <section className="profile-section congress-record-section">
                <div className="panel-title">
                  <ShieldCheck size={18} />
                  <h3>Ethics Recusals</h3>
                </div>
                <div className="congress-watch-list">
                  {ethicsRecusals.map((record) => (
                    <article key={record.id}>
                      <strong>{record.targetType || "Recusal declaration"}</strong>
                      <span>{record.target}</span>
                      <small>{record.publishedAt || record.createdAt} / {record.scope} / {record.instance}</small>
                      {record.explanation ? <p>{record.explanation}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="profile-section congress-record-section">
              <div className="panel-title">
                <Link2 size={18} />
                <h3>Official Source Chain</h3>
              </div>
              <div className="congress-source-grid">
                <a href={`/source/france-parliament/members/${member.id}.json`} target="_blank" rel="noreferrer">
                  <strong>Raw local evidence file</strong>
                  <span>TOR Phi JSON archive for this deputy</span>
                  <FileText size={14} />
                </a>
                {sourceUrls.map((source) => (
                  <a href={source.url} target="_blank" rel="noreferrer" key={`${source.label}-${source.url}`}>
                    <strong>{source.label}</strong>
                    <span>{new URL(source.url, window.location.href).hostname}</span>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="panel congress-record-empty">
            <FileSearch size={20} />
            <strong>No local French Assembly archive found for {actor.name}.</strong>
          </div>
        )}
      </section>
    </main>
  );
}

function NationalParliamentRecordsPage({ actor, country }) {
  const member = actor.nationalParliamentMember;
  const profile = getNationalParliamentMemberProfile(actor.nationalParliamentCountryId, member);
  const [archive, setArchive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadNationalParliamentArchive(actor.nationalParliamentCountryId, member.id)
      .then((data) => {
        if (!cancelled) setArchive(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [actor.nationalParliamentCountryId, member.id]);

  const records = archive?.records ?? {};
  const votes = records.votes?.recent ?? [];
  const questions = records.writtenQuestions ?? [];
  const interests = records.registeredInterests ?? [];
  const searches = records.sourceSearches ?? [];
  const watchRecords = records.watch ?? [];
  const watchFrames = records.watchFrames ?? member.records?.watchFrames ?? [];
  const normalizedQuery = normalizeSearchText(query);
  const filteredVotes = votes.filter((vote) => !normalizedQuery || normalizeSearchText([
    vote.date,
    vote.number,
    vote.title,
    vote.description,
    vote.position
  ].join(" ")).includes(normalizedQuery));
  const filteredQuestions = questions.filter((question) => !normalizedQuery || normalizeSearchText([
    question.dateTabled,
    question.heading,
    question.questionText,
    question.answerText,
    question.answeringBody
  ].join(" ")).includes(normalizedQuery));
  const sourceUrls = (archive?.sourceUrls ?? member.sourceLinks?.map(([label, url]) => ({ label, url })) ?? [])
    .filter((source) => source.label !== "TOR Phi records");

  return (
    <main className="profile-page">
      <header className="profile-page-top">
        <a href={profileHref(country, actor)} className="back-link">
          <ArrowLeft size={16} /> Back to {actor.name} profile
        </a>
      </header>

      <section className="profile-hero congress-record-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">Internal Parliament Record</p>
          <h1>{actor.name}</h1>
          <span>{profile.currentRole}</span>
          <p>
            TOR Phi record page for {profile.country} parliamentary sources. This keeps the member profile, record archive,
            official source chain, watch hits, and future source-import status inside the project.
          </p>
        </div>
        <div className="profile-hero-card">
          <ProfilePortrait actor={actor} profile={profile} />
          <strong>{member.house}</strong>
          <span>{member.party || member.faction || member.constituency || profile.country}</span>
          <small>{member.id}</small>
        </div>
      </section>

      <ProfileSubnav actor={actor} country={country} active="records" />

      <section className="congress-record-shell">
        {loading ? (
          <div className="panel congress-record-empty">
            <Database size={20} />
            <strong>Loading local parliament archive...</strong>
          </div>
        ) : archive ? (
          <>
            <div className="congress-record-summary">
              <div>
                <strong>{country.id === "uk" ? (records.votes?.totalPositions || 0).toLocaleString() : searches.length.toLocaleString()}</strong>
                <span>{country.id === "uk" ? "Vote positions" : "Source-search slots"}</span>
              </div>
              <div>
                <strong>{country.id === "uk" ? questions.length.toLocaleString() : watchFrames.length.toLocaleString()}</strong>
                <span>{country.id === "uk" ? "Written questions" : "Watch frames"}</span>
              </div>
              <div>
                <strong>{country.id === "uk" ? interests.reduce((sum, group) => sum + group.items.length, 0).toLocaleString() : member.faction || "Not listed"}</strong>
                <span>{country.id === "uk" ? "Interest entries" : "Faction"}</span>
              </div>
              <div>
                <strong>{country.id === "uk" ? watchRecords.length.toLocaleString() : member.province || "Not listed"}</strong>
                <span>{country.id === "uk" ? "Foreign-policy hits" : "Province"}</span>
              </div>
            </div>

            <section className="profile-section congress-record-section">
              <div className="panel-title">
                <BriefcaseBusiness size={18} />
                <h3>Official Profile Snapshot</h3>
              </div>
              <dl className="profile-facts">
                {profile.biographyFacts.slice(0, 12).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Generated</dt>
                  <dd>{archive.generatedAt ? new Date(archive.generatedAt).toLocaleString() : "Not listed"}</dd>
                </div>
              </dl>
            </section>

            {country.id === "uk" ? (
              <>
                <section className="profile-section congress-record-section">
                  <div className="panel-title">
                    <Scale size={18} />
                    <h3>Latest Commons Votes</h3>
                  </div>
                  <div className="congress-record-controls">
                    <label>
                      <Search size={16} />
                      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search votes, question text, Iraq, Kurdistan, Syria, Iran..." />
                    </label>
                    <span>{filteredVotes.length} vote rows shown</span>
                  </div>
                  <div className="congress-vote-table france-vote-table">
                    <div className="congress-vote-head">
                      <span>Date</span>
                      <span>Division</span>
                      <span>Subject</span>
                      <span>Vote</span>
                      <span>Result</span>
                    </div>
                    {filteredVotes.map((vote) => (
                      <a href={vote.sourceUrl} target="_blank" rel="noreferrer" className="congress-vote-row" key={`${vote.id}-${vote.position}-${vote.date}`}>
                        <span>{vote.date}</span>
                        <strong>{vote.number || vote.id}</strong>
                        <span>
                          <b>{vote.title}</b>
                          <small>{vote.description || "Commons division"}</small>
                        </span>
                        <span>{vote.position}</span>
                        <span>{vote.ayeCount} Aye / {vote.noCount} No</span>
                      </a>
                    ))}
                  </div>
                </section>

                <section className="profile-section congress-record-section">
                  <div className="panel-title">
                    <FileSearch size={18} />
                    <h3>Written Questions</h3>
                  </div>
                  <div className="congress-watch-list">
                    {filteredQuestions.length > 0 ? filteredQuestions.slice(0, 20).map((question) => (
                      <a href={question.sourceUrl} target="_blank" rel="noreferrer" key={question.id}>
                        <strong>{question.heading}</strong>
                        <span>{question.questionText}</span>
                        <small>{question.dateTabled} / {question.answeringBody || "Answering body not listed"}</small>
                      </a>
                    )) : (
                      <article>
                        <strong>No written questions match this search.</strong>
                        <span>Try a broader term or clear the search box.</span>
                      </article>
                    )}
                  </div>
                </section>

                {watchRecords.length > 0 ? (
                  <section className="profile-section congress-record-section">
                    <div className="panel-title">
                      <Radar size={18} />
                      <h3>Kurdistan / Foreign-Policy Watch Hits</h3>
                    </div>
                    <div className="congress-watch-list">
                      {watchRecords.slice(0, 12).map((record, index) => (
                        <a href={record.sourceUrl} target="_blank" rel="noreferrer" key={`${record.kind}-${record.title}-${index}`}>
                          <strong>{record.kind}: {record.title}</strong>
                          <span>{record.summary}</span>
                          <small>{record.date || "Date not listed"}</small>
                        </a>
                      ))}
                    </div>
                  </section>
                ) : null}

                {interests.length > 0 ? (
                  <section className="profile-section congress-record-section">
                    <div className="panel-title">
                      <ShieldCheck size={18} />
                      <h3>Registered Interests</h3>
                    </div>
                    <div className="congress-watch-list">
                      {interests.slice(0, 8).map((group) => (
                        <article key={group.id}>
                          <strong>{group.category}</strong>
                          <span>{group.items.slice(0, 2).map((item) => item.text).join(" ")}</span>
                          <small>{group.items.length} imported entries in this category</small>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <>
                <section className="profile-section congress-record-section">
                  <div className="panel-title">
                    <Radar size={18} />
                    <h3>Kurdistan Lens Starting Points</h3>
                  </div>
                  <div className="congress-watch-list">
                    {watchFrames.map((frame) => (
                      <article key={frame.title}>
                        <strong>{frame.title}</strong>
                        <span>{frame.summary}</span>
                        <small>{frame.status}</small>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="profile-section congress-record-section">
                  <div className="panel-title">
                    <FileSearch size={18} />
                    <h3>Official Source Searches</h3>
                  </div>
                  <div className="congress-source-grid">
                    {searches.map((source) => (
                      <a href={source.url} target="_blank" rel="noreferrer" key={source.label}>
                        <strong>{source.label}</strong>
                        <span>{source.note}</span>
                        <ExternalLink size={14} />
                      </a>
                    ))}
                  </div>
                  <p className="congress-record-note">
                    Iran vote and speech text has not been bulk-imported because the official ParlIran host was unreachable during this generation. ICANA is reachable and registered here as the official news-record search layer.
                  </p>
                </section>
              </>
            )}

            <section className="profile-section congress-record-section">
              <div className="panel-title">
                <Link2 size={18} />
                <h3>Official Source Chain</h3>
              </div>
              <div className="congress-source-grid">
                <a href={`/source/${country.id}-parliament/members/${member.id}.json`} target="_blank" rel="noreferrer">
                  <strong>Raw local evidence file</strong>
                  <span>TOR Phi JSON archive for this member</span>
                  <FileText size={14} />
                </a>
                {sourceUrls.map((source) => (
                  <a href={source.url} target="_blank" rel="noreferrer" key={`${source.label}-${source.url}`}>
                    <strong>{source.label}</strong>
                    <span>{new URL(source.url, window.location.href).hostname}</span>
                    {`${source.url}`.startsWith("/") ? <ArrowRight size={14} /> : <ExternalLink size={14} />}
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="panel congress-record-empty">
            <FileSearch size={20} />
            <strong>No local parliament archive found for {actor.name}.</strong>
          </div>
        )}
      </section>
    </main>
  );
}

function ForeignMinistryRecordsPage({ actor, country }) {
  const person = actor.foreignMinistryPerson;
  const countryId = actor.foreignMinistryCountryId || country.id;
  const ministry = foreignMinistryData[countryId];
  const profile = getForeignMinistryPersonProfile(countryId, person);
  const [query, setQuery] = useState("");
  const [expandedRecordKey, setExpandedRecordKey] = useState("");
  const records = person.records ?? [];
  const sourceLinks = person.sourceLinks ?? [];
  const indexedRecords = records.map((record, index) => ({ record, index }));
  const normalizedQuery = normalizeSearchText(query);
  const filteredRecords = indexedRecords.filter(({ record }) => {
    if (!normalizedQuery) return true;
    return normalizeSearchText([
      record.date,
      record.type,
      record.title,
      record.source,
      record.summary,
      record.frame,
      record.url
    ].join(" ")).includes(normalizedQuery);
  });
  const kurdistanRecords = records.filter(isForeignMinistryKurdistanRecord);

  return (
    <main className="profile-page foreign-ministry-record-page">
      <header className="profile-page-top">
        <a href={profileHref({ id: countryId }, actor)} className="back-link">
          <ArrowLeft size={16} /> Back to {actor.name} profile
        </a>
      </header>

      <section className="profile-hero congress-record-hero foreign-ministry-record-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">Internal Foreign Ministry Record</p>
          <h1>{actor.name}</h1>
          <span>{profile.currentRole}</span>
          <p>
            TOR Phi record page for {ministry?.shortName || profile.country} ministry sources. This keeps the person,
            official profile, ministry source chain, Kurdistan/Iraq assessment, and monitoring queue inside the project.
          </p>
          <div className="profile-tags">
            <span>{records.length.toLocaleString()} records</span>
            <span>{sourceLinks.length.toLocaleString()} source links</span>
            <span>{kurdistanRecords.length.toLocaleString()} Kurdistan / Iraq hits</span>
          </div>
        </div>
        <div className="profile-hero-card">
          <ProfilePortrait actor={actor} profile={profile} />
          <strong>{person.category}</strong>
          <span>{ministry?.shortName || profile.country}</span>
          <small>{person.id}</small>
        </div>
      </section>

      <ProfileSubnav actor={actor} country={{ id: countryId }} active="records" />

      <section className="congress-record-shell">
        <div className="congress-record-summary">
          <div>
            <strong>{records.length.toLocaleString()}</strong>
            <span>Official records</span>
          </div>
          <div>
            <strong>{kurdistanRecords.length.toLocaleString()}</strong>
            <span>KRG / Iraq hits</span>
          </div>
          <div>
            <strong>{sourceLinks.length.toLocaleString()}</strong>
            <span>Source links</span>
          </div>
          <div>
            <strong>{person.monitoringTasks?.length || 0}</strong>
            <span>Monitoring tasks</span>
          </div>
        </div>

        <section className="profile-section congress-record-section">
          <div className="panel-title">
            <BriefcaseBusiness size={18} />
            <h3>Official Profile Snapshot</h3>
          </div>
          <dl className="profile-facts">
            <div>
              <dt>Ministry</dt>
              <dd>{ministry?.ministryName || "Not listed"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{person.title}</dd>
            </div>
            <div>
              <dt>Bureau</dt>
              <dd>{person.bureau}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{person.category}</dd>
            </div>
            <div>
              <dt>Importance</dt>
              <dd>{person.importance}</dd>
            </div>
            <div>
              <dt>Official profile</dt>
              <dd>{person.officialUrl}</dd>
            </div>
          </dl>
        </section>

        <section className="profile-section congress-record-section foreign-ministry-brief-section">
          <div className="panel-title">
            <Scale size={18} />
            <h3>Kurdistan Assessment</h3>
          </div>
          <div className="foreign-ministry-assessment">
            <p>{person.kurdistanAssessment}</p>
            <p>{person.background}</p>
          </div>
        </section>

        <section className="profile-section congress-record-section">
          <div className="panel-title">
            <Database size={18} />
            <h3>Record Archive</h3>
          </div>
          <div className="congress-record-controls">
            <label>
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search source, KRG, Iraq, Syria, energy, appointment..." />
            </label>
            <span>{filteredRecords.length} shown</span>
          </div>
          <div className="foreign-ministry-record-list">
            {filteredRecords.length > 0 ? filteredRecords.map(({ record, index }) => {
              const recordKey = foreignMinistryRecordSlug(record, index);
              const isExpanded = expandedRecordKey === recordKey;
              const sourceSnapshot = getForeignMinistrySourceSnapshot(record);
              const sourceParagraphs = getSnapshotParagraphs(sourceSnapshot);
              const toggleRecord = () => setExpandedRecordKey(isExpanded ? "" : recordKey);
              return (
                <article className={isForeignMinistryKurdistanRecord(record) ? "foreign-ministry-record-card priority" : "foreign-ministry-record-card"} key={`${record.title}-${record.date}-${index}`}>
                  <header>
                    <div>
                      <span>{record.date} / {record.type}</span>
                      <button className="foreign-ministry-record-title-button" type="button" onClick={toggleRecord} aria-expanded={isExpanded}>
                        {record.title}
                      </button>
                    </div>
                    <small>{formatForeignMinistryRecordFrame(record)}</small>
                  </header>
                  <p>{record.summary}</p>
                  {record.url ? (
                    <div className="foreign-ministry-record-actions">
                      <a className="official-source-link secondary" href={record.url} target="_blank" rel="noreferrer">
                        Official source <ExternalLink size={14} />
                      </a>
                    </div>
                  ) : null}
                  {isExpanded ? (
                    <div className="foreign-ministry-inline-source">
                      {sourceSnapshot?.title ? <h4>{sourceSnapshot.title}</h4> : null}
                      {sourceSnapshot?.description ? <p className="source-description">{sourceSnapshot.description}</p> : null}
                      {sourceParagraphs.length > 0 ? (
                        <div className="foreign-ministry-source-body">
                          {sourceParagraphs.map((paragraph, paragraphIndex) => (
                            <p key={`${recordKey}-source-${paragraphIndex}`}>{paragraph}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-note">Full source text has not been imported into the local snapshot yet.</p>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            }) : (
              <p className="empty-note">No ministry records match this search.</p>
            )}
          </div>
        </section>

        <section className="profile-section congress-record-section">
          <div className="panel-title">
            <ShieldCheck size={18} />
            <h3>Monitoring Tasks</h3>
          </div>
          <div className="verification-list">
            {(person.monitoringTasks ?? []).map((task) => <span key={task}>{task}</span>)}
          </div>
        </section>
      </section>
    </main>
  );
}

function ForeignMinistryRecordDetailPage({ actor, country, recordSlug }) {
  const person = actor.foreignMinistryPerson;
  const countryId = actor.foreignMinistryCountryId || country.id;
  const ministry = foreignMinistryData[countryId];
  const profile = getForeignMinistryPersonProfile(countryId, person);
  const records = person.records ?? [];
  const { record, index } = findForeignMinistryRecordForRoute(countryId, person, recordSlug);

  if (!record) {
    return (
      <main className="profile-page foreign-ministry-record-page">
        <header className="profile-page-top">
          <a href={recordsHref({ id: countryId }, actor)} className="back-link">
            <ArrowLeft size={16} /> Back to {actor.name} records
          </a>
        </header>
        <section className="congress-record-shell">
          <div className="panel congress-record-empty">
            <FileSearch size={20} />
            <strong>Internal ministry record not found.</strong>
            <p className="empty-note">The person profile exists, but this specific record slug is not in the local TOR Phi archive.</p>
          </div>
        </section>
      </main>
    );
  }

  const recordHref = foreignMinistryRecordHref(countryId, person, record, index);
  const previousRecord = index > 0 ? records[index - 1] : null;
  const nextRecord = index < records.length - 1 ? records[index + 1] : null;
  const sourceHost = getSourceHostLabel(record.url);
  const frameLabel = formatForeignMinistryRecordFrame(record);
  const kurdistanRelevant = isForeignMinistryKurdistanRecord(record);
  const recordReading = getForeignMinistryRecordReading(record, person, ministry);
  const sourceSnapshot = getForeignMinistrySourceSnapshot(record);
  const sourceParagraphs = getSnapshotParagraphs(sourceSnapshot);

  return (
    <main className="profile-page foreign-ministry-record-page">
      <header className="profile-page-top">
        <a href={recordsHref({ id: countryId }, actor)} className="back-link">
          <ArrowLeft size={16} /> Back to {actor.name} records
        </a>
      </header>

      <section className="profile-hero congress-record-hero foreign-ministry-record-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">TOR Phi Internal Record</p>
          <h1>{record.title}</h1>
          <span>{actor.name} / {profile.currentRole}</span>
          <p>{record.summary}</p>
          <div className="profile-tags">
            <span>{record.date}</span>
            <span>{record.type || "Record"}</span>
            <span>{frameLabel}</span>
            {kurdistanRelevant ? <span>Kurdistan / regional relevance</span> : <span>Profile evidence</span>}
          </div>
        </div>
        <div className="profile-hero-card">
          <Database size={24} />
          <strong>Internal archive node</strong>
          <span>{ministry?.shortName || profile.country}</span>
          <small>{foreignMinistryRecordSlug(record, index)}</small>
        </div>
      </section>

      <ProfileSubnav actor={actor} country={{ id: countryId }} active="records" />

      <section className="congress-record-shell foreign-ministry-detail-shell">
        <section className="profile-section congress-record-section foreign-ministry-record-detail-card">
          <div className="panel-title">
            <Database size={18} />
            <h3>Record File</h3>
          </div>
          <dl className="profile-facts">
            <div>
              <dt>Person</dt>
              <dd><a href={profileHref({ id: countryId }, actor)}>{actor.name}</a></dd>
            </div>
            <div>
              <dt>Ministry</dt>
              <dd>{ministry?.ministryName || "Foreign ministry"}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{record.date || "Undated"}</dd>
            </div>
            <div>
              <dt>Record type</dt>
              <dd>{record.type || "Official source record"}</dd>
            </div>
            <div>
              <dt>TOR Phi frame</dt>
              <dd>{frameLabel}</dd>
            </div>
            <div>
              <dt>Internal URL</dt>
              <dd>{recordHref}</dd>
            </div>
          </dl>
        </section>

        <section className="profile-section congress-record-section foreign-ministry-record-detail-card">
          <div className="panel-title">
            <FileText size={18} />
            <h3>Official Source Text</h3>
          </div>
          <div className="foreign-ministry-source-snapshot">
            {sourceSnapshot?.title ? <h4>{sourceSnapshot.title}</h4> : null}
            {sourceSnapshot?.description ? <p className="source-description">{sourceSnapshot.description}</p> : null}
            {sourceParagraphs.length > 0 ? (
              <div className="foreign-ministry-source-body">
                {sourceParagraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${recordHref}-source-${paragraphIndex}`}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="empty-note">
                Full source text has not been imported into the local snapshot yet. The official URL is retained below for provenance.
              </p>
            )}
          </div>
        </section>

        <section className="profile-section congress-record-section foreign-ministry-record-detail-card">
          <div className="panel-title">
            <Scale size={18} />
            <h3>TOR Phi Note</h3>
          </div>
          <div className="foreign-ministry-record-text">
            <p>{recordReading}</p>
            <p>{record.summary}</p>
            {record.frame ? <p><strong>TOR Phi frame:</strong> {frameLabel}</p> : null}
            {record.source ? <p><strong>Source label:</strong> {record.source}</p> : null}
            {person.kurdistanAssessment ? <p><strong>Kurdistan lens note:</strong> {person.kurdistanAssessment}</p> : null}
          </div>
        </section>

        <section className="profile-section congress-record-section foreign-ministry-record-detail-card">
          <div className="panel-title">
            <Link2 size={18} />
            <h3>Evidence Chain</h3>
          </div>
          <div className="foreign-ministry-record-actions">
            <a className="official-source-link" href={profileHref({ id: countryId }, actor)}>
              Open person profile <UserRound size={14} />
            </a>
            <a className="official-source-link" href={recordsHref({ id: countryId }, actor)}>
              All internal records <Database size={14} />
            </a>
            {record.url ? (
              <a className="official-source-link secondary" href={record.url} target="_blank" rel="noreferrer">
                Official source: {sourceHost} <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
        </section>

        {(previousRecord || nextRecord) ? (
          <section className="profile-section congress-record-section foreign-ministry-record-detail-card">
            <div className="panel-title">
              <ArrowRight size={18} />
              <h3>Nearby Records</h3>
            </div>
            <div className="foreign-ministry-nearby-records">
              {previousRecord ? (
                <a href={foreignMinistryRecordHref(countryId, person, previousRecord, index - 1)}>
                  <span>Previous</span>
                  <strong>{previousRecord.title}</strong>
                </a>
              ) : null}
              {nextRecord ? (
                <a href={foreignMinistryRecordHref(countryId, person, nextRecord, index + 1)}>
                  <span>Next</span>
                  <strong>{nextRecord.title}</strong>
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function SpeechReaderPage({ actor, country, targetType = "", targetRecordIndex = null }) {
  const member = actor.turkishParliamentMember;
  const profile = getTurkishParliamentMemberProfile(member);
  const speechActivity = useMemo(() => getSpeechActivity(member.parliamentaryActivity ?? []), [member]);
  const initialActiveType = speechActivity.some((item) => item.type === targetType) ? targetType : speechActivity[0]?.type || "";
  const [activeType, setActiveType] = useState(initialActiveType);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("english");
  const [loadedActivity, setLoadedActivity] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(targetRecordIndex ?? 0);
  const activeSummary = speechActivity.find((item) => item.type === activeType) || speechActivity[0];

  useEffect(() => {
    if (targetType && speechActivity.some((item) => item.type === targetType) && targetType !== activeType) {
      setActiveType(targetType);
    } else if (!speechActivity.some((item) => item.type === activeType)) {
      setActiveType(speechActivity[0]?.type || "");
    }
  }, [activeType, speechActivity, targetType]);

  useEffect(() => {
    let cancelled = false;
    setLoadedActivity(null);
    setSelectedIndex(activeSummary?.type === targetType && targetRecordIndex !== null ? targetRecordIndex : 0);
    if (!activeSummary?.file) return undefined;

    loadActivityData(activeSummary.file, activeSummary)
      .then((data) => {
        if (!cancelled) setLoadedActivity(data);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSummary?.file, activeSummary?.type, targetType, targetRecordIndex]);

  const records = loadedActivity?.records ?? [];
  const normalizedSearch = normalizeSearchText(search);
  const filteredRecords = useMemo(() => {
    if (!normalizedSearch) return records;
    return records.filter((record) => normalizeSearchText(getActivitySearchText(record)).includes(normalizedSearch));
  }, [records, normalizedSearch]);
  const selectedRecord = filteredRecords[selectedIndex] || filteredRecords[0];

  return (
    <main className="profile-page speech-page">
      <header className="profile-page-top">
        <a href={profileHref(country, actor)} className="back-link">
          <ArrowLeft size={16} /> Back to {actor.name} profile
        </a>
      </header>

      <section className="profile-hero speech-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">TOR Phi Speech Archive</p>
          <h1>{actor.name}</h1>
          <span>{profile.currentRole}</span>
          <p>
            Read this member's imported TBMM General Assembly and committee speeches inside the project.
            Original Turkish text is local; English translation appears when available.
          </p>
          <div className="profile-tags">
            {speechActivity.map((item) => <span key={item.type}>{item.count.toLocaleString()} {item.label}</span>)}
          </div>
        </div>
        <div className="profile-hero-card">
          <ProfilePortrait actor={actor} profile={profile} />
          <strong>Speech Reader</strong>
          <span>{profile.country}</span>
          <small>Local TBMM speech archive</small>
        </div>
      </section>

      <ProfileSubnav actor={actor} country={country} active="speeches" />

      <section className="speech-reader-shell">
        <div className="speech-reader-controls">
          <div className="parliament-activity-tabs">
            {speechActivity.map((item) => (
              <button
                className={item.type === activeType ? "active" : ""}
                type="button"
                onClick={() => setActiveType(item.type)}
                key={item.type}
              >
                <strong>{item.count.toLocaleString()}</strong>
                {item.label}
              </button>
            ))}
          </div>
          <label>
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search speech title, date, text..." />
          </label>
          <div className="speech-language-toggle" role="group" aria-label="Speech language">
            <button className={language === "english" ? "active" : ""} type="button" onClick={() => setLanguage("english")}>English</button>
            <button className={language === "turkish" ? "active" : ""} type="button" onClick={() => setLanguage("turkish")}>Turkish</button>
          </div>
        </div>

        <div className="speech-reader-layout">
          <aside className="speech-record-list">
            {!loadedActivity ? (
              <p className="empty-note">Loading speeches...</p>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => (
                <button
                  className={index === selectedIndex ? "active" : ""}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  key={`${record.title}-${record.date}-${index}`}
                >
                  <span>{record.date || formatActivitySection(record.section)}</span>
                  <strong>{getSpeechTitle(record, language)}</strong>
                  <small>{record.originalTurkish ? `${record.originalTurkish.split(/\s+/).filter(Boolean).length.toLocaleString()} Turkish words` : formatRecordAvailability(record)}</small>
                </button>
              ))
            ) : (
              <p className="empty-note">No speeches match this search.</p>
            )}
          </aside>

          <article className="speech-reader-document">
            {selectedRecord ? (
              <>
                <header>
                  <span>{selectedRecord.date || formatActivitySection(selectedRecord.section)}</span>
                  <h2>{getSpeechTitle(selectedRecord, language)}</h2>
                  <dl>
                    {Object.entries(selectedRecord.fields ?? {}).slice(0, 6).map(([label, value]) => (
                      <div key={label}>
                        <dt>{formatActivityFieldLabel(label)}</dt>
                        <dd>{getActivityFieldValue(selectedRecord, label, value, language)}</dd>
                      </div>
                    ))}
                  </dl>
                </header>
                <SpeechDetailPanel record={selectedRecord} language={language} />
              </>
            ) : (
              <p className="empty-note">Choose a speech to read.</p>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

function ParliamentaryRecordsPage({ actor, country, targetType = "", targetRecordIndex = null }) {
  const member = actor.turkishParliamentMember;
  const profile = getTurkishParliamentMemberProfile(member);
  const recordActivity = useMemo(() => getNonSpeechActivity(member.parliamentaryActivity ?? []), [member]);
  const initialActiveType = recordActivity.some((item) => item.type === targetType) ? targetType : recordActivity[0]?.type || "";
  const [activeType, setActiveType] = useState(initialActiveType);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("english");
  const [loadedActivity, setLoadedActivity] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(targetRecordIndex ?? 0);
  const activeSummary = recordActivity.find((item) => item.type === activeType) || recordActivity[0];

  useEffect(() => {
    if (targetType && recordActivity.some((item) => item.type === targetType) && targetType !== activeType) {
      setActiveType(targetType);
    } else if (!recordActivity.some((item) => item.type === activeType)) {
      setActiveType(recordActivity[0]?.type || "");
    }
  }, [activeType, recordActivity, targetType]);

  useEffect(() => {
    let cancelled = false;
    setLoadedActivity(null);
    setSelectedIndex(activeSummary?.type === targetType && targetRecordIndex !== null ? targetRecordIndex : 0);
    if (!activeSummary?.file) return undefined;

    loadActivityData(activeSummary.file, activeSummary)
      .then((data) => {
        if (!cancelled) setLoadedActivity(data);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSummary?.file, activeSummary?.type, targetType, targetRecordIndex]);

  const records = loadedActivity?.records ?? [];
  const normalizedSearch = normalizeSearchText(search);
  const filteredRecords = useMemo(() => {
    if (!normalizedSearch) return records;
    return records.filter((record) => normalizeSearchText(getActivitySearchText(record)).includes(normalizedSearch));
  }, [records, normalizedSearch]);
  const selectedRecord = filteredRecords[selectedIndex] || filteredRecords[0];

  return (
    <main className="profile-page speech-page records-page">
      <header className="profile-page-top">
        <a href={profileHref(country, actor)} className="back-link">
          <ArrowLeft size={16} /> Back to {actor.name} profile
        </a>
      </header>

      <section className="profile-hero speech-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">TOR Phi Parliamentary Records</p>
          <h1>{actor.name}</h1>
          <span>{profile.currentRole}</span>
          <p>
            Review this member's imported TBMM bills, questions, motions, and debate records inside the project.
            English summaries are shown by default; Turkish source text remains available.
          </p>
          <div className="profile-tags">
            {recordActivity.map((item) => <span key={item.type}>{item.count.toLocaleString()} {item.label}</span>)}
          </div>
        </div>
        <div className="profile-hero-card">
          <ProfilePortrait actor={actor} profile={profile} />
          <strong>Records Reader</strong>
          <span>{profile.country}</span>
          <small>Local TBMM activity archive</small>
        </div>
      </section>

      <ProfileSubnav actor={actor} country={country} active="records" />

      <section className="speech-reader-shell">
        <div className="speech-reader-controls">
          <div className="parliament-activity-tabs">
            {recordActivity.map((item) => (
              <button
                className={item.type === activeType ? "active" : ""}
                type="button"
                onClick={() => setActiveType(item.type)}
                key={item.type}
              >
                <strong>{item.count.toLocaleString()}</strong>
                {item.label}
              </button>
            ))}
          </div>
          <label>
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search record title, date, file number, summary..." />
          </label>
          <div className="speech-language-toggle" role="group" aria-label="Record language">
            <button className={language === "english" ? "active" : ""} type="button" onClick={() => setLanguage("english")}>English</button>
            <button className={language === "turkish" ? "active" : ""} type="button" onClick={() => setLanguage("turkish")}>Turkish</button>
          </div>
        </div>

        <div className="speech-reader-layout">
          <aside className="speech-record-list">
            {!loadedActivity ? (
              <p className="empty-note">Loading records...</p>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => (
                <button
                  className={index === selectedIndex ? "active" : ""}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  key={`${record.title}-${getActivityRecordDate(record)}-${index}`}
                >
                  <span>{getActivityRecordDate(record) || formatActivitySection(record.section)}</span>
                  <strong>{getParliamentaryRecordTitle(record, language)}</strong>
                  <small>{getParliamentaryRecordReference(record) || activeSummary?.label}</small>
                </button>
              ))
            ) : (
              <p className="empty-note">No records match this search.</p>
            )}
          </aside>

          <article className="speech-reader-document parliament-record-document">
            {selectedRecord ? (
              <>
                <header>
                  <span>{activeSummary?.label}</span>
                  <h2>{getParliamentaryRecordTitle(selectedRecord, language)}</h2>
                  <dl>
                    {Object.entries(selectedRecord.fields ?? {}).slice(0, 10).map(([label, value]) => (
                      <div key={label}>
                        <dt>{formatActivityFieldLabel(label)}</dt>
                        <dd>{getActivityFieldValue(selectedRecord, label, value, language)}</dd>
                      </div>
                    ))}
                  </dl>
                </header>
                <ParliamentaryRecordDetail record={selectedRecord} activityLabel={activeSummary?.label} language={language} />
              </>
            ) : (
              <p className="empty-note">Choose a record to inspect.</p>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

function KurdistanLensPage({ actor, country }) {
  const member = actor.turkishParliamentMember;
  const profile = getActorProfile(actor);
  const socialArchive = getSocialProfileArchiveForActor(actor, country);
  const activity = useMemo(() => orderParliamentaryActivity(member?.parliamentaryActivity ?? []).filter((item) => item.count > 0), [member]);
  const [loadedGroups, setLoadedGroups] = useState([]);
  const [loadedActorArchive, setLoadedActorArchive] = useState(null);
  const [storedBrief, setStoredBrief] = useState(null);
  const [query, setQuery] = useState("");
  const [activeTerm, setActiveTerm] = useState("All");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoadedGroups([]);
    setSelectedIndex(0);
    if (activity.length === 0) {
      setLoadedGroups([]);
      return () => {
        cancelled = true;
      };
    }
    Promise.all(activity.map((item) => loadActivityData(item.file, item).then((data) => ({ ...item, records: data.records ?? [] }))))
      .then((groups) => {
        if (!cancelled) setLoadedGroups(groups);
      });
    return () => {
      cancelled = true;
    };
  }, [activity]);

  useEffect(() => {
    let cancelled = false;
    setStoredBrief(null);
    if (!member?.id) return () => {
      cancelled = true;
    };
    loadTbmmKurdistanBrief(member.id).then((brief) => {
      if (!cancelled) setStoredBrief(brief);
    });
    return () => {
      cancelled = true;
    };
  }, [member?.id]);

  useEffect(() => {
    let cancelled = false;
    setLoadedActorArchive(null);
    const archivePromise = actor.congressMember
      ? loadCongressArchive(actor.congressMember.id)
      : actor.franceParliamentMember
        ? loadFranceParliamentArchive(actor.franceParliamentMember.id)
        : actor.nationalParliamentMember
          ? loadNationalParliamentArchive(actor.nationalParliamentCountryId, actor.nationalParliamentMember.id)
          : Promise.resolve(null);

    archivePromise.then((archive) => {
      if (!cancelled) setLoadedActorArchive(archive);
    });

    return () => {
      cancelled = true;
    };
  }, [
    actor.congressMember?.id,
    actor.franceParliamentMember?.id,
    actor.nationalParliamentCountryId,
    actor.nationalParliamentMember?.id
  ]);

  const activityLensRecords = useMemo(() => buildKurdistanLensRecords(loadedGroups), [loadedGroups]);
  const socialLensRecords = useMemo(() => buildSocialKurdistanLensRecords(socialArchive), [socialArchive]);
  const generalLensRecords = useMemo(
    () => buildGeneralKurdistanLensRecords({ actor, country, profile, archive: loadedActorArchive }),
    [actor, country, profile, loadedActorArchive]
  );
  const lensRecords = useMemo(
    () => [...activityLensRecords, ...socialLensRecords, ...generalLensRecords]
      .sort((a, b) => getDailyTimestamp(b.date) - getDailyTimestamp(a.date)),
    [activityLensRecords, socialLensRecords, generalLensRecords]
  );
  const termCounts = useMemo(() => countKurdistanLensTerms(lensRecords), [lensRecords]);
  const sourceSplit = useMemo(() => buildKurdistanLensSourceSplit(lensRecords), [lensRecords]);
  const timelinePoints = useMemo(() => buildKurdistanLensTimeline(lensRecords), [lensRecords]);
  const liveConclusion = useMemo(() => buildKurdistanLensConclusion(lensRecords, sourceSplit, actor.name), [lensRecords, sourceSplit, actor.name]);
  const lensConclusion = useMemo(
    () => socialLensRecords.length > 0 ? liveConclusion : normalizeStoredKurdistanBrief(storedBrief, liveConclusion),
    [storedBrief, liveConclusion, socialLensRecords.length]
  );
  const normalizedQuery = normalizeSearchText(query);
  const filteredRecords = useMemo(() => {
    return lensRecords.filter((item) => {
      const matchesTerm = activeTerm === "All" || item.matchedTerms.includes(activeTerm);
      const matchesQuery = !normalizedQuery || normalizeSearchText([
        item.title,
        item.summary,
        item.sourceLabel,
        item.reference,
        item.date,
        item.snippet,
        ...item.matchedTerms
      ].join(" ")).includes(normalizedQuery);
      return matchesTerm && matchesQuery;
    });
  }, [lensRecords, activeTerm, normalizedQuery]);
  const selectedRecord = filteredRecords[selectedIndex] || filteredRecords[0];
  const speechHits = lensRecords.filter((item) => item.kind === "speech").length;
  const socialHits = lensRecords.filter((item) => item.kind === "social").length;
  const documentHits = lensRecords.filter((item) => item.kind === "document" || item.kind === "readable-document").length;
  const recordHits = lensRecords.length - speechHits - socialHits - documentHits;
  const sourceScope = [
    activity.length ? "local parliamentary records" : "",
    socialArchive ? "captured X/social archive" : "",
    generalLensRecords.length ? "profile, document, and country-source evidence" : ""
  ].filter(Boolean).join(" and ") || "local source archive";

  return (
    <main className="profile-page speech-page lens-page">
      <header className="profile-page-top">
        <a href={profileHref(country, actor)} className="back-link">
          <ArrowLeft size={16} /> Back to {actor.name} profile
        </a>
      </header>

      <section className="profile-hero speech-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">TOR Phi Kurdistan Lens</p>
          <h1>{actor.name}</h1>
          <span>{profile.currentRole}</span>
          <p>
            A source-only view of {sourceScope} filtered for Kurdistan, KRG/IKBY,
            Iraq, Syria, PKK, YPG/SDF, Peshmerga, Erbil, oil, border, and security signals.
          </p>
          <div className="profile-tags">
            <span>{lensRecords.length.toLocaleString()} relevant hits</span>
            <span>{speechHits.toLocaleString()} speech hits</span>
            <span>{recordHits.toLocaleString()} record hits</span>
            <span>{socialHits.toLocaleString()} social hits</span>
            <span>{documentHits.toLocaleString()} document hits</span>
          </div>
        </div>
        <div className="profile-hero-card">
          <ProfilePortrait actor={actor} profile={profile} />
          <strong>Kurdistan Lens</strong>
          <span>{profile.country}</span>
          <small>Explainable source filter</small>
        </div>
      </section>

      <ProfileSubnav actor={actor} country={country} active="lens" />

      <section className="lens-shell">
        <div className="lens-summary-grid">
          <div>
            <strong>{lensRecords.length.toLocaleString()}</strong>
            <span>Total matched sources</span>
          </div>
          <div>
            <strong>{termCounts[0]?.count?.toLocaleString() ?? 0}</strong>
            <span>Top term: {termCounts[0]?.term ?? "None"}</span>
          </div>
          <div>
            <strong>{filteredRecords.length.toLocaleString()}</strong>
            <span>Visible after filters</span>
          </div>
        </div>

        <KurdistanLensVisuals
          termCounts={termCounts}
          sourceSplit={sourceSplit}
          timelinePoints={timelinePoints}
          totalHits={lensRecords.length}
        />

        <KurdistanLensConclusion conclusion={lensConclusion} country={country} actor={actor} />

        <div className="speech-reader-controls lens-controls">
          <div className="parliament-activity-tabs">
            <button className={activeTerm === "All" ? "active" : ""} type="button" onClick={() => setActiveTerm("All")}>
              <strong>{lensRecords.length.toLocaleString()}</strong>
              All
            </button>
            {termCounts.slice(0, 12).map((item) => (
              <button className={activeTerm === item.term ? "active" : ""} type="button" onClick={() => setActiveTerm(item.term)} key={item.term}>
                <strong>{item.count.toLocaleString()}</strong>
                {item.term}
              </button>
            ))}
          </div>
          <label>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lens hits, terms, title, snippet..." />
          </label>
        </div>

        <div className="speech-reader-layout">
          <aside className="speech-record-list">
            {activity.length > 0 && loadedGroups.length === 0 ? (
              <p className="empty-note">Scanning local parliamentary archive...</p>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((item, index) => (
                <button
                  className={index === selectedIndex ? "active" : ""}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  key={`${item.sourceLabel}-${item.reference}-${item.date}-${index}`}
                >
                  <span>{item.date || item.sourceLabel}</span>
                  <strong>{item.title}</strong>
                  <small>{item.matchedTerms.join(", ")}</small>
                </button>
              ))
            ) : (
              <p className="empty-note">No Kurdistan Lens hits match this filter.</p>
            )}
          </aside>

          <article className="speech-reader-document lens-document">
            {selectedRecord ? (
              <>
                <header>
                  <span>{selectedRecord.sourceLabel}</span>
                  <h2>{selectedRecord.title}</h2>
                  <dl>
                    <div>
                      <dt>Date</dt>
                      <dd>{selectedRecord.date || "Not listed"}</dd>
                    </div>
                    <div>
                      <dt>Reference</dt>
                      <dd>{selectedRecord.reference || "Not listed"}</dd>
                    </div>
                    <div>
                      <dt>Matched terms</dt>
                      <dd>{selectedRecord.matchedTerms.join(", ")}</dd>
                    </div>
                  </dl>
                </header>
                <div className="lens-evidence-card">
                  <h4>Why It Matched</h4>
                  <p>{selectedRecord.snippet || selectedRecord.summary}</p>
                </div>
                <div className="lens-evidence-card">
                  <h4>Source Summary</h4>
                  <p>{selectedRecord.summary}</p>
                </div>
                {selectedRecord.url ? (
                  <a className="official-source-link" href={selectedRecord.url} target="_blank" rel="noreferrer">
                    {selectedRecord.kind === "social" ? "Open original tweet" : "Official source"} <ExternalLink size={14} />
                  </a>
                ) : null}
              </>
            ) : (
              <p className="empty-note">Choose a matched source to inspect.</p>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

function KurdistanLensVisuals({ termCounts, sourceSplit, timelinePoints, totalHits }) {
  const topTerms = termCounts.slice(0, 10);
  const maxTermCount = Math.max(1, ...topTerms.map((item) => item.count));
  const donut = makeDonutSegments(sourceSplit);
  const timelinePath = makeSparklinePath(timelinePoints);
  const timelineAreaPath = timelinePath ? `${timelinePath} L 320 88 L 0 88 Z` : "";

  return (
    <div className="lens-visual-grid">
      <section className="lens-visual-panel term-heatmap-panel">
        <div className="lens-visual-title">
          <BarChart3 size={17} />
          <h3>Term Heatmap</h3>
        </div>
        <div className="lens-term-heatmap">
          {topTerms.length > 0 ? topTerms.map((item) => {
            const intensity = Math.max(0.16, item.count / maxTermCount);
            return (
              <div className="lens-heat-tile" style={{ "--heat": intensity }} key={item.term}>
                <span>{item.term}</span>
                <strong>{item.count.toLocaleString()}</strong>
              </div>
            );
          }) : <p className="empty-note">No matched terms yet.</p>}
        </div>
        <p className="graph-note">Counts use matched source records only; watch terms, source slots, and no-record placeholders are excluded.</p>
      </section>

      <section className="lens-visual-panel source-donut-panel">
        <div className="lens-visual-title">
          <PieChartIcon />
          <h3>Source Split</h3>
        </div>
        <div className="lens-donut-wrap">
          <div className="lens-donut" style={{ "--donut": donut.gradient }}>
            <strong>{totalHits.toLocaleString()}</strong>
            <span>hits</span>
          </div>
          <div className="lens-donut-legend">
            {sourceSplit.map((item, index) => (
              <span key={item.label}>
                <i style={{ background: donut.colors[index % donut.colors.length] }} />
                {item.label} / {item.count.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="lens-visual-panel timeline-panel">
        <div className="lens-visual-title">
          <LineChart size={17} />
          <h3>Mentions Over Time</h3>
        </div>
        <svg className="lens-sparkline" viewBox="0 0 320 96" role="img" aria-label="Kurdistan Lens mention timeline">
          <path className="lens-sparkline-area" d={timelineAreaPath} />
          <path className="lens-sparkline-line" d={timelinePath} />
          {timelinePoints.map((point) => (
            <circle key={point.label} cx={point.x} cy={point.y} r="3.5" />
          ))}
        </svg>
        <div className="lens-timeline-labels">
          <span>{timelinePoints[0]?.label ?? "No dates"}</span>
          <span>{timelinePoints.at(-1)?.label ?? ""}</span>
        </div>
      </section>
    </div>
  );
}

function KurdistanLensConclusion({ conclusion, country, actor }) {
  return (
    <section className="lens-conclusion-panel">
      <div className="lens-visual-title">
        <Scale size={17} />
        <h3>Record Conclusion</h3>
      </div>
      <div className="lens-stance-header">
        <div>
          <span>Assessed posture</span>
          <strong>{conclusion.posture}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{conclusion.confidence}</strong>
        </div>
        <div>
          <span>KRG friendliness</span>
          <strong>{conclusion.friendliness}</strong>
        </div>
      </div>
      <div className="lens-conclusion-copy">
        {(conclusion.points ?? conclusion.paragraphs.map((text) => ({ text, refs: [] }))).map((point) => (
          <p key={point.text}>
            {point.text}
            <InlineLensCitations refs={point.refs} sources={conclusion.citationSources} country={country} actor={actor} />
          </p>
        ))}
      </div>
      {conclusion.citationSources?.length > 0 ? (
        <div className="lens-source-index">
          {conclusion.citationSources.map((source) => (
            <a className="lens-source-row" href={activityCitationHref(country, actor, source)} key={`source-${source.number}`}>
              <span>({source.number})</span>
              <strong>{source.role}</strong>
              <small>{source.date || "No date"} / {source.sourceLabel} / {source.title}</small>
            </a>
          ))}
        </div>
      ) : conclusion.anchors.length > 0 ? (
        <div className="lens-anchor-list">
          {conclusion.anchors.map((anchor) => (
            <article key={`${anchor.date}-${anchor.title}-${anchor.sourceLabel}`}>
              <a className="lens-anchor-link" href={activityCitationHref(country, actor, anchor)}>
                <span>{anchor.date || "No date"} / {anchor.sourceLabel}</span>
                <strong>{anchor.title}</strong>
                <ArrowRight size={14} />
              </a>
              <p>{anchor.snippet}</p>
            </article>
          ))}
        </div>
      ) : null}
      <div className="lens-position-grid">
        {conclusion.factors.map((item) => (
          <article className={item.count > 0 ? "lens-position-card" : "lens-position-card muted"} key={item.title}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.count.toLocaleString()} hit{item.count === 1 ? "" : "s"}</span>
            </div>
            <p>
              {item.reading}
              <InlineLensCitations refs={item.refs} sources={conclusion.citationSources} country={country} actor={actor} />
            </p>
          </article>
        ))}
      </div>
      <p className="lens-conclusion-caution">{conclusion.caution}</p>
    </section>
  );
}

function InlineLensCitations({ refs = [], sources = [], country, actor }) {
  if (!refs.length || !sources?.length) return null;
  const sourceByNumber = new Map(sources.map((source) => [source.number, source]));

  return (
    <span className="inline-citations" aria-label="Evidence citations">
      {refs.map((ref) => {
        const source = sourceByNumber.get(ref);
        if (!source) return null;
        const tooltip = makeLensCitationTooltip(source);

        return (
          <a
            className="inline-citation"
            href={activityCitationHref(country, actor, source)}
            title={tooltip}
            data-tooltip={tooltip}
            aria-label={tooltip}
            key={ref}
          >
            ({ref})
          </a>
        );
      })}
    </span>
  );
}

function makeLensCitationTooltip(source) {
  const date = source.date ? `${source.date} / ` : "";
  const snippet = source.snippet ? ` — ${source.snippet}` : "";
  return `(${source.number}) ${source.role}: ${date}${source.sourceLabel}. ${source.title}${snippet}`;
}

function PieChartIcon() {
  return <BarChart3 size={17} />;
}

function ParliamentProfilePage({ actor, country, profile }) {
  const [query, setQuery] = useState("");
  const [party, setParty] = useState("All");
  const [province, setProvince] = useState("All");
  const provinceCounts = useMemo(() => {
    const counts = turkishParliamentMembers.reduce((items, member) => {
      items[member.province] = (items[member.province] || 0) + 1;
      return items;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);
  const filteredMembers = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return turkishParliamentMembers.filter((member) => {
      const matchesQuery = !normalizedQuery || normalizeSearchText([
        member.name,
        member.party,
        formatTurkishParty(member.party),
        member.province,
        member.email,
        member.englishBiography,
        member.biography,
        ...(member.committees ?? []),
        ...(member.committees ?? []).map(formatTurkishCommittee)
      ].join(" ")).includes(normalizedQuery);
      const matchesParty = party === "All" || member.party === party;
      const matchesProvince = province === "All" || member.province === province;
      return matchesQuery && matchesParty && matchesProvince;
    });
  }, [query, party, province]);

  return (
    <main className="profile-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>

      <section className="profile-hero parliament-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">Project Parliament Profile</p>
          <h1>{actor.name}</h1>
          <span>{profile.currentRole}</span>
          <p>{profile.summary}</p>
          <div className="profile-tags">
            {profile.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
        <div className="profile-hero-card">
          <Landmark size={44} />
          <strong>{profile.kind}</strong>
          <span>{profile.country}</span>
          <small>Official TBMM roster refresh: {turkishParliamentMetadata.sourceDate}</small>
        </div>
      </section>

      <ParliamentSessionPanel country={country} />

      <section className="parliament-dashboard">
        <div className="congress-summary">
          <div>
            <strong>{turkishParliamentMetadata.total}</strong>
            <span>Current deputy profiles</span>
          </div>
          <div>
            <strong>{turkishParliamentMetadata.parties.length}</strong>
            <span>Parties represented</span>
          </div>
          <div>
            <strong>{turkishParliamentMetadata.provinces.length}</strong>
            <span>Provinces represented</span>
          </div>
          <div>
            <strong>{filteredMembers.length}</strong>
            <span>Visible after filters</span>
          </div>
        </div>

        <div className="profile-page-grid parliament-grid">
          <ProfileSection icon={<FileSearch size={18} />} title="Parliament Sources">
            <LinkList items={profile.officialProfiles} />
          </ProfileSection>
          <ProfileSection icon={<Network size={18} />} title="Kurdistan Relevance">
            <p className="profile-long-text">{profile.relationshipToKurdistan}</p>
          </ProfileSection>
        </div>

        <section className="profile-section parliament-members-section">
          <div className="panel-title">
            <UsersRound size={18} />
            <h3>Members Search</h3>
          </div>
          <div className="congress-controls parliament-controls">
            <label>
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search member, province, party, committee, email..." />
            </label>
            <select value={province} onChange={(event) => setProvince(event.target.value)}>
              <option>All</option>
              {provinceCounts.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
          </div>
          <div className="parliament-filter-group">
            <span>Parties</span>
            <div className="parliament-party-strip">
              <button className={party === "All" ? "active" : ""} type="button" onClick={() => setParty("All")}>
                <strong>{turkishParliamentMetadata.total}</strong> All
              </button>
              {turkishParliamentMetadata.parties.map((item) => (
                <button className={party === item.party ? "active" : ""} type="button" onClick={() => setParty(item.party)} key={item.party}>
                  <strong>{item.count}</strong> {formatTurkishParty(item.party)}
                </button>
              ))}
            </div>
          </div>
          <div className="congress-list parliament-member-list">
            {filteredMembers.map((member) => {
              const memberActor = makeTurkishParliamentMemberActor(member);
              return (
                <article className="congress-row parliament-member-row" key={member.id}>
                  <div className="parliament-member-main">
                    <ProfileMiniPortrait actor={memberActor} profile={{ imageUrl: member.imageUrl }} />
                    <div>
                      <a className="profile-name-link" href={profileHref(country, memberActor)} target="_blank" rel="noreferrer">
                        {member.name}
                      </a>
                      <span>{formatTurkishParty(member.party)} / {member.province}</span>
                      <small>{member.committees?.[0] ? formatTurkishCommittee(member.committees[0]) : "Committee information pending official page parsing"}</small>
                    </div>
                  </div>
                  <div className="congress-meta">
                    <span>{member.committees?.length || 0} committees</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

function ProfileMiniPortrait({ actor, profile }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = !failed ? getProfileImageUrl(actor, profile) : "";

  if (imageUrl) {
    return (
      <div className="profile-mini-portrait">
        <img src={imageUrl} alt={`${actor.name} portrait`} onError={() => setFailed(true)} />
      </div>
    );
  }

  return <div className="profile-mini-portrait fallback"><span>{getInitials(actor.name)}</span></div>;
}

function ProfilePortrait({ actor, profile }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = !failed ? getProfileImageUrl(actor, profile) : "";

  if (imageUrl) {
    return (
      <div className="profile-portrait">
        <img src={imageUrl} alt={`${actor.name} portrait`} onError={() => setFailed(true)} />
      </div>
    );
  }

  return (
    <div className="profile-portrait fallback" aria-label={`${actor.name} portrait placeholder`}>
      <span>{getInitials(actor.name)}</span>
    </div>
  );
}

function ResumeTimeline({ items }) {
  const timelineRef = useRef(null);
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const timelineItems = sortResumeTimelineItems(items);

  function beginDrag(event) {
    const timeline = timelineRef.current;
    if (!timeline) return;

    dragState.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: timeline.scrollLeft
    };
    timeline.setPointerCapture?.(event.pointerId);
  }

  function dragTimeline(event) {
    const timeline = timelineRef.current;
    if (!timeline || !dragState.current.active) return;

    const distance = event.clientX - dragState.current.startX;
    timeline.scrollLeft = dragState.current.scrollLeft - distance * 1.85;
  }

  function endDrag(event) {
    const timeline = timelineRef.current;
    dragState.current.active = false;
    timeline?.releasePointerCapture?.(event.pointerId);
  }

  return (
    <section
      className="resume-timeline-panel"
      ref={timelineRef}
      onPointerDown={beginDrag}
      onPointerMove={dragTimeline}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <div className="resume-title">
        <CalendarClock size={19} />
        <span>RESUME</span>
      </div>
      <div className="resume-timeline-track">
        {timelineItems.map((item, index) => (
          <div
            className={index % 2 === 0 ? "resume-node top" : "resume-node bottom"}
            key={`${item.year}-${item.title || item.label}-${index}`}
          >
            <span>{item.year}</span>
            <strong>{item.title || item.label}</strong>
            <p>{item.summary || item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CountrySessionArchivePage({ country }) {
  const sessionArchive = useParliamentSessionArchive();
  const [query, setQuery] = useState("");
  const [laneFilter, setLaneFilter] = useState("global");
  const sessions = sessionArchive.sessionsByCountry?.[country.id] ?? [];
  const stats = sessionArchive.metadata?.countries?.[country.id];
  const normalizedQuery = normalizeSearchText(query);
  const filteredSessions = sessions.filter((session) => {
    const matchesLane = laneFilter === "global" || Boolean(session.lane?.[laneFilter]);
    if (!matchesLane) return false;
    if (!normalizedQuery) return true;
    return normalizeSearchText([
      session.title,
      session.originalTitle,
      session.summary,
      session.refined?.oneLine,
      session.refined?.whyItMatters,
      session.sourceLabel,
      session.sessionType,
      session.priority,
      ...(session.tags ?? [])
    ].join(" ")).includes(normalizedQuery);
  });

  return (
    <main className="profile-page parliament-directory-page session-archive-page">
      <header className="profile-page-top">
        <a href={countryHref(country)} className="back-link">
          <ArrowLeft size={16} /> Back to {country.name} file
        </a>
      </header>

      <section className="profile-hero parliament-hero">
        <div className="profile-hero-main">
          <p className="eyebrow">Internal Proceedings Archive</p>
          <h1>{getLegislatureSessionLabel(country)}</h1>
          <span>{country.name}</span>
          <p>
            Read the local proceedings index without opening raw JSON. Global shows the whole chamber stream;
            Iraq and Kurdistan extract only records already tagged for those lanes.
          </p>
          <div className="profile-tags">
            <span>{sessions.length.toLocaleString()} records</span>
            <span>{(stats?.latestDate || "Watch")} latest date</span>
            <span>{(stats?.iraqCount ?? sessions.filter((session) => session.lane?.iraq).length).toLocaleString()} Iraq / Kurdistan flags</span>
          </div>
        </div>
        <div className="profile-hero-card">
          <Database size={42} />
          <strong>{getLegislatureShortLabel(country)}</strong>
          <span>{stats?.parliamentName || getParliamentEntry(country)?.title || country.name}</span>
          <small>{sessionArchive.metadata?.generatedAt ? `Refreshed ${formatDailyDateTime(sessionArchive.metadata.generatedAt)}` : "Local archive"}</small>
        </div>
      </section>

      <section className="parliament-dashboard">
        <div className="congress-controls parliament-controls session-archive-controls">
          <label>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, vote, speech, Iraq, Kurdistan, source..." />
          </label>
          <div className="daily-brief-tabs compact-tabs" role="tablist" aria-label={`${country.name} session filters`}>
            {dailyBriefTabs.map((tab) => (
              <button className={laneFilter === tab.key ? "active" : ""} key={tab.key} onClick={() => setLaneFilter(tab.key)} type="button">
                {tab.label}
              </button>
            ))}
          </div>
          <span>{filteredSessions.length.toLocaleString()} shown</span>
        </div>

        <div className="parliament-session-grid session-archive-grid">
          {filteredSessions.map((session) => (
            <article id={session.id} className={`parliament-session-card ${session.lane?.kurdistan ? "kurdistan" : session.lane?.iraq ? "iraq" : ""}`} key={session.id}>
              <div className="parliament-session-meta">
                <span>{formatDailyDate(session.date)}</span>
                <span>{session.chamber || getLegislatureShortLabel(country)}</span>
                <span>{formatSessionPriority(session.priority, country)}</span>
              </div>
              <h4>{session.title}</h4>
              <p>{getSessionDailySummary(session, country)}</p>
              {session.refined?.whyItMatters ? <p>{sanitizeSessionDisplayText(session.refined.whyItMatters)}</p> : null}
              <div className="parliament-session-tags">
                {(session.tags?.length ? session.tags : [session.sessionType]).slice(0, 5).map((tag) => <span key={`${session.id}-${tag}`}>{tag}</span>)}
              </div>
              <div className="parliament-session-actions">
                <span>{session.sourceLabel || stats?.parliamentName} / {session.sourceConfidence || session.sourceType}</span>
                {session.sourceUrl || session.liveSourceUrl ? (
                  <a href={session.sourceUrl || session.liveSourceUrl} target="_blank" rel="noreferrer">
                    Official source <ExternalLink size={12} />
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {!filteredSessions.length ? (
          <p className="empty-note">No local proceeding matches this filter yet.</p>
        ) : null}
      </section>
    </main>
  );
}

function ProfileSection({ icon, title, children }) {
  return (
    <section className="profile-section">
      <div className="panel-title">
        {icon}
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function LinkList({ items }) {
  return (
    <div className="profile-link-list">
      {items.map(([label, url]) => {
        const isInternal = `${url}`.startsWith("/");
        return (
          <a href={url} target="_blank" rel="noreferrer" key={`${label}-${url}`}>
            <span>{label}</span>
            {isInternal ? <ArrowRight size={14} /> : <ExternalLink size={14} />}
          </a>
        );
      })}
    </div>
  );
}

function dedupeLinkList(items) {
  const seen = new Set();
  return items.filter((item) => {
    const url = item?.[1];
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function SpeechDetailPanel({ record, language = "english" }) {
  const hasSpeechText = Boolean(record.originalTurkish);
  const unavailable = record.importStatus === "unavailable";
  const empty = record.importStatus === "empty";
  const showEnglish = language === "english";

  return (
    <div className="speech-detail-panel">
      {hasSpeechText ? (
        <section>
          <h4>{showEnglish ? "English Translation" : "Original Turkish"}</h4>
          {showEnglish ? (
            record.englishTranslation ? (
              <pre>{record.englishTranslation}</pre>
            ) : (
              <div className="translation-pending">
                <p className="empty-note">English translation is still being generated for this speech. The Turkish original is available below.</p>
                <pre>{record.originalTurkish}</pre>
              </div>
            )
          ) : (
            <pre>{record.originalTurkish}</pre>
          )}
          <div className="speech-language-meta">
            <span>{record.originalTurkish.split(/\s+/).filter(Boolean).length.toLocaleString()} Turkish words</span>
            <span>{record.translationStatus === "translated-google-public" ? "English translated" : "English pending"}</span>
          </div>
        </section>
      ) : (
        <p className="empty-note">
          {unavailable
            ? "TBMM lists this speech, but the official detail page is unavailable, so there is no local text to display."
            : empty
              ? "TBMM detail page opened, but it did not contain readable speech text."
              : "Speech text is queued for local import."}
        </p>
      )}
    </div>
  );
}

function ParliamentaryRecordDetail({ record, activityLabel, language = "english" }) {
  const reference = getParliamentaryRecordReference(record);
  const date = getActivityRecordDate(record);
  const summary = getParliamentaryRecordTitle(record, language);
  const originalSummary = getParliamentaryRecordTitle(record, "turkish");

  return (
    <div className="parliamentary-record-detail">
      <section>
        <h4>{language === "english" ? "Record Summary" : "Original Turkish Summary"}</h4>
        <p>{summary}</p>
      </section>
      <dl>
        {reference ? (
          <div>
            <dt>File / record number</dt>
            <dd>{reference}</dd>
          </div>
        ) : null}
        {date ? (
          <div>
            <dt>Date</dt>
            <dd>{date}</dd>
          </div>
        ) : null}
        {activityLabel ? (
          <div>
            <dt>Record type</dt>
            <dd>{activityLabel}</dd>
          </div>
        ) : null}
        {record.section ? (
          <div>
            <dt>TBMM section</dt>
            <dd>{formatActivitySection(record.section)}</dd>
          </div>
        ) : null}
      </dl>
      {language === "english" && originalSummary && originalSummary !== summary ? (
        <section className="source-language-note">
          <h4>Turkish Source Text</h4>
          <p>{originalSummary}</p>
        </section>
      ) : null}
      {record.url ? (
        <a className="official-source-link" href={record.url} target="_blank" rel="noreferrer">
          Official TBMM source <ExternalLink size={14} />
        </a>
      ) : (
        <p className="empty-note">This imported TBMM row did not include a separate detail URL.</p>
      )}
      {/signed|imzası|imzasi/i.test(activityLabel || "") ? (
        <p className="empty-note">Note: signed/co-signed TBMM records can appear under multiple deputies because the same bill or motion may have several signatories.</p>
      ) : null}
    </div>
  );
}

function DualSpeechDetailPanel({ record }) {
  const hasSpeechText = Boolean(record.originalTurkish);

  if (!hasSpeechText) {
    return <SpeechDetailPanel record={record} language="english" />;
  }

  return (
    <div className="speech-detail-panel">
      <>
          <section>
            <h4>Original Turkish</h4>
            <pre>{record.originalTurkish}</pre>
          </section>
          <section>
            <h4>English Translation</h4>
            {record.englishTranslation ? (
              <pre>{record.englishTranslation}</pre>
            ) : (
              <p className="empty-note">
                Translation pending. The Turkish source text is imported locally; English translation needs a translation backend before it can be filled reliably.
              </p>
            )}
          </section>
        </>
    </div>
  );
}

function buildPeopleSearchResults(searchTerm, selectedCountryId) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return [];

  const selectedCountry = countries.find((country) => country.id === selectedCountryId) ?? countries[0];
  const candidates = [];

  countries.forEach((country) => {
    country.actors.forEach((actor) => {
      candidates.push({
        key: `actor-${country.id}-${actor.name}`,
        name: actor.name,
        type: "Project profile",
        detail: `${country.name} / ${actor.institution}`,
        href: profileHref(country, actor),
        haystack: [actor.name, actor.institution, actor.role, actor.stance, country.name].join(" ")
      });
    });

    country.government.forEach((item) => {
      const actor = findProfileActor(item.value, country);
      if (!actor) return;

      candidates.push({
        key: `government-${country.id}-${item.value}`,
        name: item.value,
        type: "Government",
        detail: `${country.name} / ${item.label}`,
        href: profileHref(country, actor),
        haystack: [item.value, item.label, country.name].join(" ")
      });
    });
  });

  Object.entries(actorProfiles).forEach(([name, profile]) => {
    const country = findCountryForProfile(profile) ?? selectedCountry;
    const actor = makeProfileOnlyActor(name, country);
    if (!actor) return;

    candidates.push({
      key: `profile-${name}`,
      name,
      type: profile.kind || "Profile",
      detail: `${profile.country || country.name} / ${profile.currentRole || "Project actor"}`,
      href: profileHref(country, actor),
      haystack: [
        name,
        profile.country,
        profile.currentRole,
        profile.summary,
        ...(profile.tags ?? []),
        ...(profile.writingsAndStatements ?? []).map(([title]) => title),
        ...(profile.readableDocuments ?? []).map((document) => document.title)
      ].join(" ")
    });
  });

  Object.entries(foreignMinistryData).forEach(([countryId, ministry]) => {
    ministry.people.forEach((person) => {
      const actor = makeForeignMinistryPersonActor(countryId, person);
      candidates.push({
        key: `foreign-ministry-${countryId}-${person.id}`,
        name: person.name,
        type: "Foreign ministry",
        detail: `${ministry.shortName} / ${person.title}`,
        href: profileHref({ id: countryId }, actor),
        haystack: [
          person.name,
          person.title,
          person.bureau,
          person.category,
          person.importance,
          person.summary,
          person.background,
          person.kurdistanAssessment,
          ministry.ministryName,
          ministry.shortName,
          ...(person.tags ?? []),
          ...(person.facts ?? []).flat(),
          ...(person.records ?? []).flatMap((record) => [record.title, record.summary, record.frame, record.source])
        ].join(" ")
      });
    });
  });

  usCongressMembers.forEach((member) => {
    const actor = makeCongressActor(member);
    candidates.push({
      key: `congress-${member.id}`,
      name: member.name,
      type: "Congress",
      detail: `${member.chamber} / ${member.state} / ${member.party}`,
      href: profileHref({ id: "usa" }, actor),
      haystack: [member.name, member.state, member.party, member.chamber, member.districtLabel].join(" ")
    });
  });

  turkishParliamentMembers.forEach((member) => {
    const actor = makeTurkishParliamentMemberActor(member);
    candidates.push({
      key: `tbmm-${member.id}`,
      name: member.name,
      type: "TBMM",
      detail: `${formatTurkishParty(member.party)} / ${member.province}`,
      href: profileHref({ id: "turkey" }, actor),
      haystack: [
        member.name,
        member.party,
        formatTurkishParty(member.party),
        member.province,
        member.email,
        member.englishBiography,
        member.biography,
        ...(member.committees ?? []),
        ...(member.committees ?? []).map(formatTurkishCommittee)
      ].join(" ")
    });
  });

  franceParliamentMembers.forEach((member) => {
    const actor = makeFranceParliamentMemberActor(member);
    candidates.push({
      key: `fr-parliament-${member.id}`,
      name: member.name,
      type: "French National Assembly",
      detail: `${member.group?.shortLabel || member.group?.label || "No group"} / ${member.constituency?.label || "France"}`,
      href: profileHref({ id: "france" }, actor),
      haystack: [
        member.name,
        member.group?.label,
        member.group?.shortLabel,
        member.party?.label,
        member.constituency?.label,
        member.constituency?.department,
        member.constituency?.region,
        member.profession,
        member.contact?.emails?.join(" "),
        ...(member.committees ?? []).map((committee) => `${committee.label} ${committee.quality}`)
      ].join(" ")
    });
  });

  Object.entries(nationalParliamentData).forEach(([countryId, data]) => {
    data.members.forEach((member) => {
      const actor = makeNationalParliamentMemberActor(countryId, member);
      candidates.push({
        key: `${countryId}-parliament-${member.id}`,
        name: member.name,
        type: data.label,
        detail: countryId === "uk"
          ? `${member.partyAbbreviation || member.party || "No party"} / ${member.constituency || "No constituency"}`
          : `${member.faction || "No faction"} / ${member.constituency || member.province || "Majlis"}`,
        href: profileHref({ id: countryId }, actor),
        haystack: [
          member.name,
          member.fullTitle,
          member.party,
          member.partyAbbreviation,
          member.faction,
          member.list,
          member.constituency,
          member.province,
          member.role,
          member.house,
          member.synopsis
        ].join(" ")
      });
    });
  });

  allThinkTankPeople.forEach((person) => {
    const countryId = person.countryId || "usa";
    const actor = makeThinkTankPersonActor(person, countryId);
    candidates.push({
      key: `think-${person.id}`,
      name: person.name,
      type: "Think tank",
      detail: `${person.organization} / ${person.role}`,
      href: profileHref({ id: countryId }, actor),
      haystack: [person.name, person.organization, person.role, person.policySignal, ...person.expertise].join(" ")
    });
  });

  allMediaAuthors.forEach((author) => {
    const countryId = author.countryId || "usa";
    const actor = makeMediaAuthorActor(author, countryId);
    candidates.push({
      key: `media-${author.id}`,
      name: author.name,
      type: "Media",
      detail: `${author.outlet} / ${author.role}`,
      href: profileHref({ id: countryId }, actor),
      haystack: [author.name, author.outlet, author.role, author.stanceSignal, ...author.beat].join(" ")
    });
  });

  foreignPolicyDocuments.forEach((document) => {
    const country = countries.find((item) => item.id === document.countryId) ?? selectedCountry;
    candidates.push({
      key: `document-${document.id}`,
      name: document.title,
      type: "Book / document",
      detail: `${document.personName} / ${document.documentType}`,
      href: documentHref(document),
      haystack: [
        document.title,
        document.personName,
        document.documentType,
        document.publisher,
        document.date,
        document.description,
        document.summaries?.bookSummary,
        document.summaries?.personInsight,
        document.summaries?.middleEastKurdistanRelevance,
        country.name,
        ...(document.tags ?? [])
      ].join(" ")
    });
  });

  const seen = new Set();

  return candidates
    .filter((candidate) => candidate.haystack.toLowerCase().includes(query))
    .filter((candidate) => {
      const key = candidate.href;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(query)) - Number(a.name.toLowerCase().startsWith(query)) || a.name.localeCompare(b.name))
    .slice(0, 18);
}

function findCountryForProfile(profile) {
  if (!profile?.country) return null;
  const normalizedProfileCountry = normalizeSearchText(profile.country);

  return countries.find((country) => {
    const names = [country.id, country.name, country.region].map(normalizeSearchText);
    return names.some((name) => name === normalizedProfileCountry || name.includes(normalizedProfileCountry) || normalizedProfileCountry.includes(name));
  }) ?? null;
}

function normalizeSearchText(value) {
  return `${value ?? ""}`.toLowerCase().replace(/ü/g, "u").replace(/[^a-z0-9]+/g, " ").trim();
}

function summarizeLocalCounts(items, getter) {
  const counts = new Map();
  for (const item of items) {
    const key = getter(item) || "Not listed";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function getActorProfile(actor) {
  if (actor.congressMember) {
    return enrichProfileWithWritingResearch(getCongressProfile(actor.congressMember), actor);
  }

  if (actor.turkishParliamentInstitution) {
    return getTurkishParliamentInstitutionProfile();
  }

  if (actor.turkishParliamentMember) {
    return getTurkishParliamentMemberProfile(actor.turkishParliamentMember);
  }

  if (actor.franceParliamentMember) {
    return getFranceParliamentMemberProfile(actor.franceParliamentMember);
  }

  if (actor.nationalParliamentMember) {
    return getNationalParliamentMemberProfile(actor.nationalParliamentCountryId, actor.nationalParliamentMember);
  }

  if (actor.foreignMinistryPerson) {
    return enrichProfileWithWritingResearch(getForeignMinistryPersonProfile(actor.foreignMinistryCountryId, actor.foreignMinistryPerson), actor);
  }

  if (actor.thinkTankPerson) {
    return enrichProfileWithWritingResearch(getThinkTankPersonProfile(actor.thinkTankPerson, actor.thinkTankCountryId || actor.thinkTankPerson.countryId || "usa"), actor);
  }

  if (actor.mediaAuthor) {
    return enrichProfileWithWritingResearch(getMediaAuthorProfile(actor.mediaAuthor, actor.mediaCountryId || actor.mediaAuthor.countryId || "usa"), actor);
  }

  const fallback = {
    kind: "Person or institution",
    country: "To classify",
    currentRole: actor.institution,
    summary:
      "This project profile exists, but it needs more analyst research before it can be used in a formal briefing.",
    tags: ["needs research"],
    biographyFacts: [
      ["Institution", actor.institution],
      ["Role", actor.role],
      ["Stance note", actor.stance],
      ["Evidence status", "Needs richer source collection"]
    ],
    officialProfiles: actor.url ? [["Starting source", actor.url]] : [],
    social: [],
    writingsAndStatements: actor.url ? [["Starting source", actor.institution, "Current", actor.url]] : [],
    statementsOnKurdistan: [
      {
        date: "Unknown",
        stance: "Unverified",
        title: "No Kurdistan-specific statement attached",
        summary: "Add dated source links before using this actor in the diplomatic assessment.",
        url: actor.url || "#"
      }
    ],
    relationshipToKurdistan:
      "Profile shell only. It should be enriched with biography, statements, meetings, articles, and social media before briefing use.",
    monitoringTasks: ["Add official biography", "Add social media links", "Add Kurdistan-specific statements"]
  };

  return enrichProfileWithWritingResearch({ ...fallback, ...(actorProfiles[actor.name] ?? {}) }, actor);
}

function enrichProfileWithWritingResearch(profile, actor) {
  const confirmedRecords = getConfirmedWritingRecords(actor.name);
  const documentRecords = getDocumentsForActorName(actor.name).map(makeForeignPolicyDocumentResearchRecord);
  const verifiedImage = getVerifiedProfileImage(actor.name);
  const documentTitleKeys = new Set(documentRecords.map((document) => normalizeSearchText(document.title)));
  const writingsAndStatements = (profile.writingsAndStatements ?? []).filter(([title]) => !documentTitleKeys.has(normalizeSearchText(title)));

  return {
    ...profile,
    writingsAndStatements,
    imageUrl: profile.imageUrl || verifiedImage?.url,
    imageCredit: profile.imageUrl ? profile.imageCredit : (verifiedImage?.credit || profile.imageCredit),
    researchDocuments: dedupeResearchDocuments([
      ...documentRecords,
      ...(profile.researchDocuments ?? []).filter(isSpecificAuthoredWorkRecord),
      ...confirmedRecords.filter(isSpecificAuthoredWorkRecord)
    ])
  };
}

function makeForeignPolicyDocumentResearchRecord(document) {
  return {
    title: document.title,
    type: document.documentType,
    publisher: document.publisher,
    date: document.date,
    url: documentHref(document),
    status: document.ocrStatus,
    note: document.description,
    posterUrl: document.posterUrl,
    posterCredit: document.posterCredit,
    documentType: document.documentType
  };
}

const authoredWorkTypePattern = /book|monograph|volume|memoir|manifesto|foreword|essay|opinion|op-ed|article|paper|report|testimony|speech|statement|thesis|dissertation|encyclopedia|catalog|translation|translated|edited|co-authored/i;
const genericResearchLeadPattern = /discovery search|official profile|official biography|official archive|source archive|mission archive|publication archive|article archive|identity record|profile record|external analysis|policy paper about actor|public forum|public remarks/i;
const genericResearchTitlePattern = /biography|profile|archive|published articles|research publications|speeches and statements archive|official site|official source/i;

function isSpecificAuthoredWorkRecord(record) {
  if (!record?.title || !record?.url) return false;

  const type = `${record.type || record.documentType || ""}`;
  const title = `${record.title || ""}`;
  const status = `${record.status || ""}`;
  const publisher = `${record.publisher || ""}`;
  const note = `${record.note || ""}`;
  const combined = [type, title, status, publisher, note].join(" ");

  if (/google|worldcat|openalex|internet archive books|proquest|repository search|live search/i.test(combined)) return false;
  if (genericResearchLeadPattern.test(type) || genericResearchLeadPattern.test(status)) return false;
  if (genericResearchTitlePattern.test(title) && !authoredWorkTypePattern.test(type)) return false;

  return authoredWorkTypePattern.test(type) || /\.(pdf|docx?|txt|epub)(\?|$)/i.test(`${record.url}`);
}

function getProfileImageUrl(actor, profile) {
  if (profile.imageUrl) return profile.imageUrl;
  if (actor.imageUrl) return actor.imageUrl;
  const verifiedImage = getVerifiedProfileImage(actor.name);
  if (verifiedImage?.url) return verifiedImage.url;
  if (actor.congressId) return getCongressImageUrl(actor.congressId);
  return "";
}

function getCongressImageUrl(bioguideId) {
  return `https://unitedstates.github.io/images/congress/225x275/${bioguideId}.jpg`;
}

function formatTurkishParty(party) {
  const partyMap = {
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

  return partyMap[party] || party;
}

function formatTurkishCommittee(value) {
  if (!value) return "";

  const roleMap = [
    ["Eş Başkan Yardımcısı", "Co-Deputy Chair"],
    ["Grup Başkanvekili", "Group Deputy Chair"],
    ["Grup Başkanı", "Group Chair"],
    ["Eş Genel Başkanı", "Co-Chair"],
    ["Genel Başkanı", "Chair"],
    ["Başkanvekili", "Deputy Chair"],
    ["Başkan Vekili", "Deputy Chair"],
    ["Başkanı", "Chair"],
    ["Başkan", "Chair"],
    ["Sözcüsü", "Spokesperson"],
    ["Katip Üyesi", "Clerk Member"],
    ["Katip Üye", "Clerk Member"],
    ["İdare Amiri", "Administrative Officer"],
    ["Üyesi", "Member"]
  ];
  const committeeMap = {
    "Adalet Ve Kalkınma Partisi Grup": "AK Party Parliamentary Group",
    "Cumhuriyet Halk Partisi Grup": "CHP Parliamentary Group",
    "Halkların Eşitlik Ve Demokrasi Partisi Grup": "DEM Party Parliamentary Group",
    "İYİ Parti Grup": "Good Party Parliamentary Group",
    "Milliyetçi Hareket Partisi Grup": "MHP Parliamentary Group",
    "Yeni Yol Partisi Grup": "New Path Party Parliamentary Group",
    "Demokratik Bölgeler Partisi": "Democratic Regions Party",
    "Demokratik Sol Parti": "Democratic Left Party",
    "Halkların Eşitlik Ve Demokrasi Partisi": "Peoples' Equality and Democracy Party",
    "Hür Dava Partisi": "Huda Par",
    "İYİ Parti": "Good Party",
    "Milliyetçi Hareket Partisi": "Nationalist Movement Party",
    "Saadet Partisi": "Felicity Party",
    "Türkiye İşçi Partisi": "Workers' Party of Turkey",
    "Yeniden Refah Partisi": "New Welfare Party",
    "Balıkçılık Ve Su Ürünleri Araştırma Komisyonu": "Fisheries and Aquaculture Research Committee",
    "Bebek Ölümlerini Ve Özel Sağlık Kuruluşlarını Araştırma Komisyonu": "Infant Deaths and Private Health Institutions Research Committee",
    "Çocuklara Karşı Şiddet Ve İstismarı Araştırma Komisyonu": "Violence and Abuse Against Children Research Committee",
    "Engelli Bireylerin Sorunlarını Araştırma Komisyonu": "Problems of Disabled Individuals Research Committee",
    "Kadına Karşı Şiddet Ve Ayrımcılığı Araştırma Komisyonu": "Violence and Discrimination Against Women Research Committee",
    "İliç Maden Kazasını Araştırma Komisyonu": "Ilic Mine Accident Research Committee",
    "Kartalkaya’da Bir Otelde Meydana Gelen Yangını Araştırma Komisyonu": "Kartalkaya Hotel Fire Research Committee",
    "Suça Sürüklenen Çocuklara İlişkin Araştırma Komisyonu": "Children Pushed Into Crime Research Committee",
    "Şanlıurfa Ve Kahramanmaraş Okul Olaylarını Ve Dijital Riskleri Araştırma Komisyonu": "Sanliurfa and Kahramanmaras School Incidents and Digital Risks Research Committee",
    "Yapay Zekâ Araştırma Komisyonu": "Artificial Intelligence Research Committee",
    "Tarım, Orman Ve Köyişleri Komisyonu": "Agriculture, Forestry and Rural Affairs Committee",
    "Zirai Don Olayını Araştırma Komisyonu": "Agricultural Frost Incident Research Committee",
    "Dışişleri Komisyonu": "Foreign Affairs Committee",
    "Milli Savunma Komisyonu": "National Defense Committee",
    "İçişleri Komisyonu": "Internal Affairs Committee",
    "Plan Ve Bütçe Komisyonu": "Planning and Budget Committee",
    "Adalet Komisyonu": "Justice Committee",
    "Anayasa Komisyonu": "Constitution Committee",
    "Sanayi, Ticaret, Enerji, Tabii Kaynaklar, Bilgi Ve Teknoloji Komisyonu": "Industry, Trade, Energy, Natural Resources, Information and Technology Committee",
    "İnsan Haklarını İnceleme Komisyonu": "Human Rights Inquiry Committee",
    "Avrupa Birliği Uyum Komisyonu": "European Union Harmonization Committee",
    "Güvenlik Ve İstihbarat Komisyonu": "Security and Intelligence Committee",
    "Kadın Erkek Fırsat Eşitliği Komisyonu": "Equal Opportunities for Women and Men Committee",
    "Kamu İktisadi Teşebbüsleri Komisyonu": "State Economic Enterprises Committee",
    "Dilekçe Komisyonu": "Petitions Committee",
    "Sağlık, Aile, Çalışma Ve Sosyal İşler Komisyonu": "Health, Family, Labor and Social Affairs Committee",
    "Milli Eğitim, Kültür, Gençlik Ve Spor Komisyonu": "National Education, Culture, Youth and Sports Committee",
    "Bayındırlık, İmar, Ulaştırma Ve Turizm Komisyonu": "Public Works, Reconstruction, Transport and Tourism Committee",
    "Çevre Komisyonu": "Environment Committee",
    "Dijital Mecralar Komisyonu": "Digital Platforms Committee",
    "Anayasa Ve Adalet Komisyonları Üyelerinden Kurulu Karma Komisyon": "Joint Committee of Constitution and Justice Committee Members",
    "Dilekçe Komisyonu İle İnsan Haklarını İnceleme Komisyonu Üyelerinden Kurulu Karma Komisyonu": "Joint Committee of Petitions and Human Rights Inquiry Committee Members",
    "Akdeniz İçin Birlik Parlamenter Asamblesi Türk Grubu": "Turkish Group of the Parliamentary Assembly of the Union for the Mediterranean",
    "Akdeniz İçin Birlik Parlamenter Asamblesi": "Parliamentary Assembly of the Union for the Mediterranean",
    "Akdeniz Parlamenter Asamblesi Türk Grubu": "Turkish Group of the Parliamentary Assembly of the Mediterranean",
    "Akdeniz Parlamenter Asamblesi": "Parliamentary Assembly of the Mediterranean",
    "AND Parlamentosu Türk Grubu": "Turkish Group of the Andean Parliament",
    "AND Parlamentosu": "Andean Parliament",
    "ASEAN Parlamentolar Arası Asamblesi Türk Grubu": "Turkish Group of the ASEAN Inter-Parliamentary Assembly",
    "ASEAN Parlamentolar Arası Asamblesi": "ASEAN Inter-Parliamentary Assembly",
    "Asya Parlamenter Asamblesi Türk Grubu": "Turkish Group of the Asian Parliamentary Assembly",
    "Asya Parlamenter Asamblesi": "Asian Parliamentary Assembly",
    "Avrupa Güvenlik ve İşbirliği Teşkilatı Parlamenter Asamblesi Türk Grubu": "Turkish Group of the OSCE Parliamentary Assembly",
    "Avrupa Güvenlik ve İşbirliği Teşkilatı Parlamenter Asamblesi": "OSCE Parliamentary Assembly",
    "Avrupa Konseyi Parlamenter Meclisi Türk Grubu": "Turkish Group of the Parliamentary Assembly of the Council of Europe",
    "Avrupa Konseyi Parlamenter Meclisi": "Parliamentary Assembly of the Council of Europe",
    "Ekonomik İşbirliği Teşkilatı Parlamenter Asamblesi Türk Grubu": "Turkish Group of the Economic Cooperation Organization Parliamentary Assembly",
    "Ekonomik İşbirliği Teşkilatı Parlamenter Asamblesi": "Economic Cooperation Organization Parliamentary Assembly",
    "Güney Doğu Avrupa İşbirliği Süreci Parlamenter Asamblesi Türk Grubu": "Turkish Group of the Southeast European Cooperation Process Parliamentary Assembly",
    "Güney Doğu Avrupa İşbirliği Süreci Parlamenter Asamblesi": "Southeast European Cooperation Process Parliamentary Assembly",
    "İslam İşbirliği Teşkilatı Üyesi Ülkeler Parlamenter Birliği Türk Grubu": "Turkish Group of the Parliamentary Union of OIC Member States",
    "İslam İşbirliği Teşkilatı Üyesi Ülkeler Parlamenter Birliği": "Parliamentary Union of OIC Member States",
    "Karadeniz Ekonomik İşbirliği Parlamenter Asamblesi Türk Grubu": "Turkish Group of the Parliamentary Assembly of the Black Sea Economic Cooperation",
    "Karadeniz Ekonomik İşbirliği Parlamenter Asamblesi": "Parliamentary Assembly of the Black Sea Economic Cooperation",
    "Latin Amerikan ve Karayipler Parlamentosu Türk Grubu": "Turkish Group of the Latin American and Caribbean Parliament",
    "Latin Amerikan ve Karayipler Parlamentosu": "Latin American and Caribbean Parliament",
    "NATO Parlamenter Asamblesi Türk Grubu": "Turkish Group of the NATO Parliamentary Assembly",
    "NATO Parlamenter Asamblesi": "NATO Parliamentary Assembly",
    "Parlamentolararası Birlik Grubu Türk Grubu": "Turkish Group of the Inter-Parliamentary Union",
    "Parlamentolararası Birlik Grubu": "Inter-Parliamentary Union Group",
    "Türk Devletleri Parlamenter Asamblesi Türk Grubu": "Turkish Group of the Parliamentary Assembly of Turkic States",
    "Türk Devletleri Parlamenter Asamblesi": "Parliamentary Assembly of Turkic States",
    "Türkiye - Avrupa Birliği Karma Parlamento Komisyonu Türk Grubu": "Turkish Group of the Turkiye-EU Joint Parliamentary Committee",
    "Türkiye - Avrupa Birliği Karma Parlamento Komisyonu": "Turkiye-EU Joint Parliamentary Committee",
    "Türkiye Büyük Millet Meclisi Başkanı": "Speaker of the Grand National Assembly of Turkiye",
    "Türkiye Büyük Millet Meclisi": "Grand National Assembly of Turkiye",
    "Güney Doğu Avrupa İşbirliği Süreci Parlamenter Asamblesi Türk Grubu Başkanı": "Chair, Turkish Group of the Southeast European Cooperation Process Parliamentary Assembly",
    "Ekonomik İşbirliği Teşkilatı Parlamenter Asamblesi Türk Grubu Başkanı": "Chair, Turkish Group of the Economic Cooperation Organization Parliamentary Assembly",
    "Türk Devletleri Parlamenter Asamblesi Türk Grubu Başkanı": "Chair, Turkish Group of the Parliamentary Assembly of Turkic States"
  };

  const direct = committeeMap[value];
  if (direct) return direct;

  const roleEntry = roleMap.find(([turkishRole]) => value.endsWith(turkishRole));
  if (!roleEntry) return value;

  const [turkishRole, englishRole] = roleEntry;
  const committee = value.slice(0, -turkishRole.length).trim();
  return `${committeeMap[committee] || committee} / ${englishRole}`;
}

function formatTurkishActivityLabel(value) {
  const activityMap = {
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

  return activityMap[value] || value;
}

function orderParliamentaryActivity(activity) {
  const priority = [
    "General Assembly speeches",
    "Committee speeches",
    "Written questions submitted",
    "Bills where first signatory",
    "Bills signed",
    "Parliamentary inquiry motions where first signatory",
    "Parliamentary inquiry motions signed",
    "General debate motions where first signatory",
    "General debate motions signed",
    "Parliamentary investigation motions where first signatory",
    "Parliamentary investigation motions signed"
  ];

  return [...activity].sort((a, b) => {
    const aIndex = priority.indexOf(a.label);
    const bIndex = priority.indexOf(b.label);
    const aRank = aIndex === -1 ? 999 : aIndex;
    const bRank = bIndex === -1 ? 999 : bIndex;
    return aRank - bRank || b.count - a.count || a.label.localeCompare(b.label);
  });
}

function getSpeechActivity(activity) {
  return orderParliamentaryActivity(activity)
    .filter((item) => ["General Assembly speeches", "Committee speeches"].includes(item.label))
    .filter((item) => item.count > 0);
}

function getNonSpeechActivity(activity) {
  return orderParliamentaryActivity(activity)
    .filter((item) => !["General Assembly speeches", "Committee speeches"].includes(item.label))
    .filter((item) => item.count > 0);
}

function formatRecordAvailability(record) {
  if (record.importStatus === "unavailable") return "TBMM detail unavailable";
  if (record.importStatus === "empty") return "No readable detail text";
  return "Local text pending";
}

function getSpeechTitle(record, language = "english") {
  if (language === "turkish") return record.title || record.englishTitle || "Untitled speech";
  return record.englishTitle || record.title || "Untitled speech";
}

function getActivitySearchText(record) {
  return [
    record.section,
    record.title,
    record.englishTitle,
    record.date,
    record.originalTurkish,
    record.englishTranslation,
    ...Object.entries(record.fields ?? {}).flat(),
    ...Object.entries(record.englishFields ?? {}).flat(),
    ...Object.entries(record.metadata ?? {}).flat(),
    ...Object.entries(record.englishMetadata ?? {}).flat()
  ].join(" ");
}

function getParliamentarySummaryFieldLabel(record) {
  const labels = [
    "Kanun Teklifi Başlığı ve Özeti",
    "Önergenin Başlığı ve Özeti",
    "Önergenin Özeti",
    "Subject"
  ];

  return labels.find((label) => record.fields?.[label] || record.englishFields?.[label]) || "";
}

function getParliamentaryRecordTitle(record, language = "english") {
  const summaryLabel = getParliamentarySummaryFieldLabel(record);
  if (summaryLabel) {
    if (language === "english") return record.englishFields?.[summaryLabel] || record.fields?.[summaryLabel] || record.englishTitle || record.title || "Untitled record";
    return record.fields?.[summaryLabel] || record.englishFields?.[summaryLabel] || record.title || "Untitled record";
  }

  if (language === "turkish") return record.title || record.englishTitle || "Untitled record";
  return record.englishTitle || record.title || "Untitled record";
}

function getParliamentaryRecordReference(record) {
  return record.fields?.["Taksim/ Esas No"]
    || record.fields?.["Taksim/Esas No"]
    || (/^[\d/.-]+$/.test(record.title || "") ? record.title : "");
}

function getActivityRecordDate(record) {
  return record.date
    || record.fields?.Tarihi
    || record.fields?.["Submitted to Speaker"]
    || record.fields?.["Birleşim Tarihi"]
    || record.fields?.Date
    || record.metadata?.Tarih
    || "";
}

const kurdistanLensTerms = [
  { label: "Kurdistan", patterns: ["kurdistan", "kürdistan", "kurdish", "kürt"] },
  { label: "KRG / IKBY", patterns: ["krg", "ikby", "kürdistan bölgesel yönetimi", "kurdistan regional government"] },
  { label: "Erbil", patterns: ["erbil", "erbil", "hewler", "hawler"] },
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

function buildKurdistanLensRecords(groups) {
  return groups.flatMap((group) => {
    const isSpeech = ["General Assembly speeches", "Committee speeches"].includes(group.label);
    return (group.records ?? []).map((record, recordIndex) => {
      const title = isSpeech ? getSpeechTitle(record, "english") : getParliamentaryRecordTitle(record, "english");
      const turkishTitle = isSpeech ? getSpeechTitle(record, "turkish") : getParliamentaryRecordTitle(record, "turkish");
      const searchableText = [
        title,
        isSpeech ? record.englishTranslation : getParliamentaryRecordTitle(record, "english"),
        turkishTitle,
        isSpeech ? record.originalTurkish : getParliamentaryRecordTitle(record, "turkish"),
        ...Object.values(record.fields ?? {}),
        ...Object.values(record.englishFields ?? {})
      ].filter(Boolean).join("\n\n");
      const matchedTerms = getKurdistanLensMatches(searchableText);
      if (matchedTerms.length === 0) return null;

      return {
        kind: isSpeech ? "speech" : "record",
        activityType: group.type,
        recordIndex,
        sourceLabel: group.label,
        title,
        summary: isSpeech ? (record.englishTranslation || title) : getParliamentaryRecordTitle(record, "english"),
        analysisText: searchableText,
        snippet: makeKurdistanLensSnippet(searchableText, matchedTerms),
        matchedTerms,
        date: getActivityRecordDate(record),
        reference: isSpeech ? formatActivitySection(record.section) : getParliamentaryRecordReference(record),
        url: record.url
      };
    }).filter(Boolean);
  }).sort((a, b) => Number(extractSortableYear(b.date)) - Number(extractSortableYear(a.date)));
}

function buildSocialKurdistanLensRecords(archive) {
  if (!archive) return [];
  return (archive.kurdistanMentions ?? []).map((tweet, index) => {
    const text = tweet.text || "";
    const matchedTerms = tweet.kurdistanTerms?.length ? normalizeLensTerms(tweet.kurdistanTerms) : getKurdistanLensMatches(text);
    if (matchedTerms.length === 0) return null;

    return {
      kind: "social",
      activityType: "social-archive",
      recordIndex: index,
      sourceLabel: `X archive / @${tweet.username || tweet.handle || "account"}`,
      title: `Captured tweet by @${tweet.username || tweet.handle || "account"}`,
      summary: text,
      analysisText: [
        text,
        ...(tweet.frames ?? []),
        ...(tweet.kurdistanTerms ?? [])
      ].join("\n"),
      snippet: makeKurdistanLensSnippet(text, matchedTerms),
      matchedTerms,
      frames: tweet.frames ?? [],
      date: tweet.createdAt,
      reference: tweet.id,
      url: tweet.url,
      localHref: archive.profileHref ? `${archive.profileHref}#social-tweet-${tweet.id}` : archive.archiveUrl
    };
  }).filter(Boolean);
}

function buildGeneralKurdistanLensRecords({ actor, country, profile, archive }) {
  const records = [];
  const baseHref = profileHref(country, actor);
  const add = (record) => {
    const built = makeGenericKurdistanLensRecord(record);
    if (built) records.push(built);
  };

  if (!actor.congressMember) {
    add({
      kind: "profile-assessment",
      sourceLabel: "Internal profile analysis",
      title: "Relationship to Kurdistan",
      summary: profile.relationshipToKurdistan,
      analysisText: [profile.relationshipToKurdistan, profile.summary, ...(profile.tags ?? [])].join("\n\n"),
      date: "Profile",
      reference: "profile-relationship",
      localHref: baseHref
    });
  }

  (profile.statementsOnKurdistan ?? [])
    .filter((statement) => !isPlaceholderKurdistanStatement(statement))
    .forEach((statement, index) => add({
      kind: "profile-statement",
      sourceLabel: "Profile statements",
      title: statement.title,
      summary: statement.summary,
      analysisText: [statement.stance, statement.title, statement.summary].join("\n\n"),
      date: statement.date,
      reference: `statement-${index + 1}`,
      url: statement.url,
      localHref: baseHref
    }));

  if (!actor.congressMember) {
    getActorDepthDossier(actor, profile, country).forEach((item, index) => add({
      kind: "profile-dossier",
      sourceLabel: "Depth dossier",
      title: item.title,
      summary: item.body,
      analysisText: [item.title, item.body, ...(item.tags ?? [])].join("\n\n"),
      date: "Profile",
      reference: `depth-${index + 1}`,
      localHref: baseHref
    }));
  }

  (actor.evidenceIds ?? [])
    .map((id) => country.evidence?.find((item) => item.id === id))
    .filter(Boolean)
    .forEach((item, index) => add({
      kind: "country-evidence",
      sourceLabel: `${country.name} country file`,
      title: `${item.category} / ${item.date}`,
      summary: item.reading,
      analysisText: [item.category, item.reading, item.date, item.url].join("\n\n"),
      date: item.date,
      reference: item.id || `country-evidence-${index + 1}`,
      url: item.url,
      localHref: countryHref(country)
    }));

  getDocumentsForActorName(actor.name).forEach((document, index) => add({
    kind: "document",
    sourceLabel: document.localPdfAvailable ? "Book / OCR-backed document" : "Book / document profile",
    title: document.title,
    summary: document.summaries?.middleEastKurdistanRelevance || document.summaries?.personInsight || document.summaries?.bookSummary || document.description,
    analysisText: [
      document.title,
      document.description,
      document.documentType,
      document.publisher,
      document.ocrStatus,
      document.sourceBasis,
      document.summaries?.bookSummary,
      document.summaries?.personInsight,
      document.summaries?.middleEastKurdistanRelevance,
      ...(document.readingGuide ?? []),
      ...(document.tags ?? [])
    ].join("\n\n"),
    date: document.date,
    reference: document.id || `document-${index + 1}`,
    url: documentHref(document),
    localHref: documentHref(document)
  }));

  (profile.readableDocuments ?? []).forEach((document, index) => add({
    kind: "readable-document",
    sourceLabel: "Readable document OCR",
    title: document.title,
    summary: document.relevanceNote || document.extractionMethod || document.content,
    analysisText: [
      document.title,
      document.publisher,
      document.documentType,
      document.relevanceNote,
      document.extractionMethod,
      document.content
    ].join("\n\n"),
    date: document.date,
    reference: document.id || `readable-${index + 1}`,
    url: document.sourceUrl,
    localHref: baseHref
  }));

  if (actor.foreignMinistryPerson) {
    const person = actor.foreignMinistryPerson;
    (person.records ?? []).forEach((record, index) => {
      const recordInternalHref = foreignMinistryRecordHref(actor.foreignMinistryCountryId || country.id, person, record, index);
      add({
        kind: "ministry-record",
        sourceLabel: "Foreign ministry records",
        title: record.title,
        summary: record.summary,
        analysisText: [record.title, record.summary, record.frame, record.type, record.source].join("\n\n"),
        date: record.date,
        reference: `ministry-${index + 1}`,
        url: recordInternalHref,
        localHref: recordInternalHref
      });
    });
    add({
      kind: "ministry-assessment",
      sourceLabel: "Foreign ministry profile",
      title: `${person.name} Kurdistan assessment`,
      summary: person.kurdistanAssessment,
      analysisText: [person.kurdistanAssessment, person.background, person.importance, ...(person.tags ?? [])].join("\n\n"),
      date: "Profile",
      reference: "ministry-assessment",
      localHref: baseHref
    });
  }

  if (actor.mediaAuthor) {
    const network = getMediaNetwork(actor.mediaCountryId || country.id);
    network.mentions
      .filter((mention) => mention.authorIds.includes(actor.mediaAuthor.id))
      .forEach((mention, index) => add({
        kind: "media-mention",
        sourceLabel: "Media monitor",
        title: mention.title,
        summary: mention.summary,
        analysisText: [mention.title, mention.summary, mention.framing, mention.evidenceNote, ...(mention.topics ?? [])].join("\n\n"),
        date: mention.date,
        reference: mention.id || `media-${index + 1}`,
        url: mention.url,
        localHref: baseHref
      }));
  }

  if (actor.thinkTankPerson) {
    const tank = getThinkTankForPerson(actor.thinkTankPerson, actor.thinkTankCountryId || country.id);
    add({
      kind: "think-tank-assessment",
      sourceLabel: "Think tank influence file",
      title: `${actor.thinkTankPerson.organization} Kurdistan policy`,
      summary: tank?.kurdistanPolicy || actor.thinkTankPerson.policySignal,
      analysisText: [
        actor.thinkTankPerson.policySignal,
        actor.thinkTankPerson.adminConnection,
        actor.thinkTankPerson.expertise?.join(", "),
        tank?.middleEastPolicy,
        tank?.iraqPolicy,
        tank?.kurdistanPolicy,
        tank?.specificity,
        ...(tank?.focus ?? [])
      ].join("\n\n"),
      date: "Current",
      reference: "think-tank-policy",
      url: actor.thinkTankPerson.url,
      localHref: baseHref
    });
    (tank?.sources ?? []).forEach(([label, url], index) => add({
      kind: "think-tank-source",
      sourceLabel: "Think tank source",
      title: label,
      summary: tank.kurdistanPolicy || tank.iraqPolicy || tank.middleEastPolicy,
      analysisText: [label, tank.kurdistanPolicy, tank.iraqPolicy, tank.middleEastPolicy, tank.specificity].join("\n\n"),
      date: "Source",
      reference: `think-source-${index + 1}`,
      url,
      localHref: baseHref
    }));
  }

  buildCongressArchiveLensRecords(actor, archive).forEach(add);
  buildFranceArchiveLensRecords(actor, archive).forEach(add);
  buildNationalArchiveLensRecords(actor, country, archive).forEach(add);

  return dedupeLensRecords(records);
}

function makeGenericKurdistanLensRecord(record) {
  if (isPlaceholderLensRecord(record)) return null;
  const analysisText = [record.analysisText, record.title, record.summary, record.sourceLabel].filter(Boolean).join("\n\n");
  const matchedTerms = normalizeLensTerms(record.matchedTerms?.length ? record.matchedTerms : getKurdistanLensMatches(analysisText));
  if (matchedTerms.length === 0) return null;

  return {
    kind: record.kind || "source",
    activityType: record.activityType || record.kind || "source",
    recordIndex: record.recordIndex,
    sourceLabel: record.sourceLabel || "Source record",
    title: record.title || "Untitled source",
    summary: compactLensText(record.summary || analysisText, 900),
    analysisText,
    snippet: makeKurdistanLensSnippet(analysisText, matchedTerms),
    matchedTerms,
    date: record.date || "",
    reference: record.reference || record.title || "",
    url: record.url,
    localHref: record.localHref
  };
}

function buildCongressArchiveLensRecords(actor, archive) {
  if (!actor.congressMember) return [];
  const records = [];
  const member = actor.congressMember;
  (archive?.houseClerk?.recentVotes ?? []).forEach((vote, index) => records.push({
    kind: "congress-vote",
    sourceLabel: "House Clerk recent votes",
    title: vote.billTitle || vote.billNumber || `Roll call ${vote.rollCallNumber}`,
    summary: `${vote.billNumber || "Vote"} / ${vote.vote || "No vote listed"} / ${vote.status || "No status listed"}`,
    analysisText: [vote.billTitle, vote.billNumber, vote.vote, vote.status, vote.date].join("\n\n"),
    date: vote.date,
    reference: vote.rollCallNumber || `house-vote-${index + 1}`,
    url: vote.sourceUrl,
    localHref: recordsHref({ id: "usa" }, actor)
  }));
  (member.committees ?? []).forEach((committee, index) => records.push({
    kind: "congress-committee",
    sourceLabel: "Congress committee assignments",
    title: committee.title ? `${committee.title} / ${committee.name}` : committee.name,
    summary: `${committee.type || "Committee"} / ${committee.relevanceScore ?? "unscored"} research relevance`,
    analysisText: [committee.name, committee.title, committee.type, committee.relevanceReason, committee.partyRole].join("\n\n"),
    date: "Current",
    reference: `committee-${index + 1}`,
    url: committee.url,
    localHref: recordsHref({ id: "usa" }, actor)
  }));
  (member.statementsOnKurdistan ?? [])
    .filter((statement) => !isPlaceholderKurdistanStatement(statement))
    .forEach((statement, index) => records.push({
      kind: "congress-statement",
      sourceLabel: "Congress profile statement",
      title: statement.title,
      summary: statement.summary,
      analysisText: [statement.title, statement.summary, statement.stance].join("\n\n"),
      date: statement.date,
      reference: `congress-statement-${index + 1}`,
      url: statement.url,
      localHref: profileHref({ id: "usa" }, actor)
    }));
  return records;
}

function isPlaceholderKurdistanStatement(statement) {
  const text = normalizeSearchText([
    statement?.title,
    statement?.summary,
    statement?.stance,
    statement?.date
  ].join(" "));
  return /no direct|no .*attached|no .*record|needs policy linkage|research priority|unreviewed|attach sourced|before assigning a stance|search official press releases|watch terms|monitoring task|source work|add direct/.test(text);
}

function isPlaceholderLensRecord(record) {
  const text = normalizeSearchText([
    record?.kind,
    record?.sourceLabel,
    record?.title,
    record?.summary,
    record?.analysisText,
    record?.reference
  ].join(" "));
  return /source slot|archive intake|intake shell|monitoring task|watch terms|watch file|watch item|no direct|no captured|no .*record attached|not captured|not imported|pending|to collect|attach sourced|attach direct|add direct|add every|search official|search archive|search for|before assigning|before drawing|needs? research|needs? source|needs? verification|profile shell|placeholder|unreviewed/.test(text);
}

function buildFranceArchiveLensRecords(actor, archive) {
  if (!actor.franceParliamentMember) return [];
  const records = [];
  const member = actor.franceParliamentMember;
  [...(archive?.votes?.watch ?? []), ...(archive?.votes?.recent ?? [])].forEach((vote, index) => records.push({
    kind: "france-parliament-record",
    sourceLabel: "French Assembly vote archive",
    title: vote.title || vote.object || vote.dossier || `Vote ${vote.number || vote.id}`,
    summary: `${vote.position || "Position not listed"} / ${vote.result || "Result not listed"} / ${vote.dossier || vote.type || "Public vote"}`,
    analysisText: [vote.title, vote.object, vote.dossier, vote.position, vote.result, vote.type].join("\n\n"),
    date: vote.date,
    reference: vote.number || vote.id || `france-vote-${index + 1}`,
    url: vote.sourceUrl,
    localHref: recordsHref({ id: "france" }, actor)
  }));
  (member.committees ?? []).forEach((committee, index) => records.push({
    kind: "france-parliament-role",
    sourceLabel: "French Assembly roles",
    title: committee.label,
    summary: `${committee.quality || "Member"} / ${committee.shortLabel || committee.abbreviation || "Committee"}`,
    analysisText: [committee.label, committee.shortLabel, committee.abbreviation, committee.quality].join("\n\n"),
    date: committee.startDate,
    reference: committee.id || `france-role-${index + 1}`,
    url: member.officialUrl,
    localHref: recordsHref({ id: "france" }, actor)
  }));
  return records;
}

function buildNationalArchiveLensRecords(actor, country, archive) {
  if (!actor.nationalParliamentMember) return [];
  const records = [];
  const member = actor.nationalParliamentMember;
  const sourceRecords = archive?.records ?? {};
  (sourceRecords.watch ?? []).forEach((record, index) => records.push({
    kind: "national-parliament-watch",
    sourceLabel: `${country.name} parliament watch hits`,
    title: record.title,
    summary: record.summary,
    analysisText: [record.kind, record.title, record.summary].join("\n\n"),
    date: record.date,
    reference: `watch-${index + 1}`,
    url: record.sourceUrl,
    localHref: recordsHref(country, actor)
  }));
  (sourceRecords.writtenQuestions ?? []).forEach((question, index) => records.push({
    kind: "national-written-question",
    sourceLabel: "Written questions",
    title: question.heading || `Written question ${question.id}`,
    summary: question.questionText || question.answerText,
    analysisText: [question.heading, question.questionText, question.answerText, question.answeringBody].join("\n\n"),
    date: question.dateTabled,
    reference: question.id || `question-${index + 1}`,
    url: question.sourceUrl,
    localHref: recordsHref(country, actor)
  }));
  (sourceRecords.votes?.recent ?? []).forEach((vote, index) => records.push({
    kind: "national-vote",
    sourceLabel: "Parliament vote archive",
    title: vote.title || vote.description || `Vote ${vote.number || vote.id}`,
    summary: `${vote.position || "Position not listed"} / ${vote.ayeCount ?? "?"} Aye / ${vote.noCount ?? "?"} No`,
    analysisText: [vote.title, vote.description, vote.position].join("\n\n"),
    date: vote.date,
    reference: vote.number || vote.id || `vote-${index + 1}`,
    url: vote.sourceUrl,
    localHref: recordsHref(country, actor)
  }));
  (sourceRecords.watchFrames ?? member.records?.watchFrames ?? []).forEach((frame, index) => records.push({
    kind: "national-watch-frame",
    sourceLabel: "Parliament source-search frame",
    title: frame.title,
    summary: frame.summary,
    analysisText: [frame.title, frame.summary, frame.status].join("\n\n"),
    date: "Source slot",
    reference: `watch-frame-${index + 1}`,
    url: frame.url,
    localHref: recordsHref(country, actor)
  }));
  (sourceRecords.sourceSearches ?? []).forEach((source, index) => records.push({
    kind: "national-source-search",
    sourceLabel: "Official source search",
    title: source.label,
    summary: source.note,
    analysisText: [source.label, source.note].join("\n\n"),
    date: "Source search",
    reference: `source-search-${index + 1}`,
    url: source.url,
    localHref: recordsHref(country, actor)
  }));
  return records;
}

function dedupeLensRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = getLensEvidenceKey(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeLensTerms(terms = []) {
  const termMap = {
    "Kurds / Kurdish": "Kurdistan",
    "Erbil / Hewler": "Erbil",
    "Iraq / Baghdad / Kirkuk": "Iraq"
  };
  return [...new Set(terms.map((term) => termMap[term] || term).filter(Boolean))];
}

function getKurdistanLensMatches(text) {
  const normalized = normalizeSearchText(text);
  return kurdistanLensTerms
    .filter((term) => term.patterns.some((pattern) => normalized.includes(normalizeSearchText(pattern))))
    .map((term) => term.label);
}

function makeKurdistanLensSnippet(text, matchedTerms) {
  const normalized = normalizeSearchText(text);
  const pattern = kurdistanLensTerms
    .filter((term) => matchedTerms.includes(term.label))
    .flatMap((term) => term.patterns)
    .find((item) => normalized.includes(normalizeSearchText(item)));
  if (!pattern) return `${text ?? ""}`.slice(0, 360).trim();

  const index = normalized.indexOf(normalizeSearchText(pattern));
  const start = Math.max(0, index - 180);
  const end = Math.min(`${text ?? ""}`.length, index + 260);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < `${text ?? ""}`.length ? "..." : "";
  return `${prefix}${`${text ?? ""}`.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`;
}

function countKurdistanLensTerms(records) {
  const counts = new Map();
  records.forEach((record) => {
    record.matchedTerms.forEach((term) => counts.set(term, (counts.get(term) || 0) + 1));
  });
  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
}

function normalizeStoredKurdistanBrief(brief, fallback) {
  if (!brief) return fallback;
  const citationSources = brief.citationSources ?? brief.anchors ?? [];
  return {
    ...fallback,
    ...brief,
    points: brief.points ?? (brief.paragraphs ?? fallback.paragraphs).map((text) => ({ text, refs: [] })),
    paragraphs: brief.paragraphs ?? (brief.points ?? fallback.points ?? []).map((point) => point.text),
    citationSources,
    anchors: brief.anchors ?? citationSources,
    factors: brief.factors ?? fallback.factors,
    caution: brief.caution ?? fallback.caution
  };
}

function buildKurdistanLensConclusion(records, sourceSplit, memberName = "This person") {
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

  const total = records.length;
  const primaryRecords = records.filter(isPrimaryLensEvidence);
  const sharedRecords = records.filter(isSharedLensEvidence);
  const evidenceBase = primaryRecords.length > 0 ? primaryRecords : records;
  const evidenceBaseLabel = primaryRecords.length > 0
    ? `${primaryRecords.length.toLocaleString()} personal posts, speeches, written questions, or lead-signatory records`
    : `${records.length.toLocaleString()} shared or co-signed records`;
  const topSource = sourceSplit[0]?.label || "local source records";
  const baseTopSource = buildKurdistanLensSourceSplit(evidenceBase)[0]?.label || topSource;
  const directCount = countLensRecordsFor(evidenceBase, directTerms);
  const allDirectCount = countLensRecordsFor(records, directTerms);
  const securityCount = countLensRecordsFor(evidenceBase, securityTerms);
  const allSecurityCount = countLensRecordsFor(records, securityTerms);
  const iraqCount = countLensRecordsFor(evidenceBase, iraqTerms);
  const syriaCount = countLensRecordsFor(evidenceBase, syriaTerms);
  const energyCount = countLensRecordsFor(evidenceBase, energyTerms);
  const minorityCount = countLensRecordsFor(evidenceBase, minorityTerms);
  const constructiveCount = countLensTextFor(evidenceBase, constructivePatterns);
  const rightsCount = countLensTextFor(evidenceBase, rightsPatterns);
  const negativeCount = countLensTextFor(evidenceBase, negativePatterns);
  const securityFrameCount = Math.max(securityCount, countLensTextFor(evidenceBase, securityPatterns));
  const allSecurityFrameCount = Math.max(allSecurityCount, countLensTextFor(records, securityPatterns));
  const speechCount = evidenceBase.filter((record) => record.kind === "speech").length;
  const documentCount = evidenceBase.filter((record) => record.kind === "document" || record.kind === "readable-document").length;
  const socialCount = evidenceBase.filter((record) => record.kind === "social").length;
  const recordCount = evidenceBase.length - speechCount - socialCount - documentCount;
  const directAnchor = findLensAnchor(evidenceBase, directTerms) || findLensAnchor(records, directTerms);
  const securityAnchor = findLensAnchor(evidenceBase, securityTerms, directAnchor)
    || findLensTextAnchor(evidenceBase, securityPatterns, directAnchor)
    || findLensAnchor(records, securityTerms, directAnchor)
    || findLensTextAnchor(records, securityPatterns, directAnchor);
  const constructiveAnchor = findLensTextAnchor(evidenceBase, constructivePatterns, directAnchor, securityAnchor)
    || findLensTextAnchor(records, constructivePatterns, directAnchor, securityAnchor);
  const rightsAnchor = findLensTextAnchor(evidenceBase, rightsPatterns, directAnchor, securityAnchor, constructiveAnchor)
    || findLensTextAnchor(records, rightsPatterns, directAnchor, securityAnchor, constructiveAnchor);
  const negativeAnchor = findLensTextAnchor(evidenceBase, negativePatterns, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor)
    || findLensTextAnchor(records, negativePatterns, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor);
  const iraqAnchor = findLensAnchor(evidenceBase, iraqTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor)
    || findLensAnchor(records, iraqTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor);
  const energyAnchor = findLensAnchor(evidenceBase, energyTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor, iraqAnchor)
    || findLensAnchor(records, energyTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor, iraqAnchor);
  const minorityAnchor = findLensAnchor(evidenceBase, minorityTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor, iraqAnchor, energyAnchor)
    || findLensAnchor(records, minorityTerms, directAnchor, securityAnchor, constructiveAnchor, rightsAnchor, iraqAnchor, energyAnchor);
  const recentAnchor = evidenceBase.find((record) => ![directAnchor, securityAnchor, constructiveAnchor, rightsAnchor, iraqAnchor, energyAnchor, minorityAnchor].includes(record));
  const citationSources = uniqueLensEvidence([
    makeLensEvidence(directAnchor, "Direct Kurdistan source"),
    makeLensEvidence(securityAnchor, "Security-frame source"),
    makeLensEvidence(constructiveAnchor || rightsAnchor, "Constructive or rights source"),
    makeLensEvidence(negativeAnchor, "Critical-language source"),
    makeLensEvidence(iraqAnchor, "Iraq/Northern Iraq source"),
    makeLensEvidence(energyAnchor, "Economic source"),
    makeLensEvidence(minorityAnchor, "Humanitarian source"),
    makeLensEvidence(energyAnchor || minorityAnchor || iraqAnchor, "Secondary frame source"),
    makeLensEvidence(recentAnchor, "Recent source")
  ]).slice(0, 8).map((item, index) => ({ ...item, number: index + 1 }));
  const anchors = citationSources;
  const refsFor = (...items) => {
    const refs = items.map((item) => {
      const evidence = makeLensEvidence(item, "");
      if (!evidence) return null;
      return citationSources.find((source) => getLensEvidenceKey(source) === getLensEvidenceKey(evidence))?.number ?? null;
    }).filter(Boolean);
    return [...new Set(refs)];
  };

  let posture = "No clear Kurdistan posture";
  let friendliness = "Unclear";
  if (total === 0) {
    posture = "No local source basis";
    friendliness = "Unrated";
  } else if (directCount > 0 && securityFrameCount >= Math.max(4, constructiveCount * 1.25, rightsCount * 1.25)) {
    posture = "Critical / securitized toward Kurdish-region issues";
    friendliness = "Low";
  } else if (negativeCount > 0 && securityFrameCount >= constructiveCount) {
    posture = "Critical / securitized toward Kurdish-region issues";
    friendliness = "Low";
  } else if (directCount > 0 && constructiveCount >= securityFrameCount && constructiveCount > 0) {
    posture = "Constructive or pragmatic toward KRG/Kurdistan";
    friendliness = "Medium to high";
  } else if (rightsCount > securityFrameCount && rightsCount > 0) {
    posture = "Kurdish-rights oriented, KRG stance indirect";
    friendliness = "Medium, but not necessarily KRG-specific";
  } else if (securityFrameCount > directCount || securityFrameCount > constructiveCount) {
    posture = "Security-first / threat-focused";
    friendliness = "Low to unclear";
  } else if (energyCount > 0 && directCount > 0) {
    posture = "Transactional / economic-interest focused";
    friendliness = "Pragmatic, not ideological";
  } else if (directCount > 0) {
    posture = "Directly Kurdistan-facing, stance mixed or unclear";
    friendliness = "Unclear to medium";
  } else if (iraqCount > 0 || syriaCount > 0) {
    posture = "Kurdistan-adjacent through Iraq/Syria";
    friendliness = "Unclear";
  }

  const confidence = total === 0 ? "None"
    : primaryRecords.length === 0 ? "Low"
      : evidenceBase.length >= 15 && directCount > 0 ? "Medium-high"
        : evidenceBase.length >= 6 ? "Medium"
          : "Low";
  const dominantFrame = describeLensDominantFrame({
    directCount,
    securityFrameCount,
    constructiveCount,
    rightsCount,
    energyCount,
    minorityCount,
    iraqCount,
    syriaCount
  });
  const sourceReading = socialCount >= Math.max(speechCount, recordCount) && socialCount > 0
    ? `The individual evidence base is mostly captured public X posts: ${socialCount.toLocaleString()} social hit${socialCount === 1 ? "" : "s"} versus ${speechCount.toLocaleString()} speech hit${speechCount === 1 ? "" : "s"}, ${documentCount.toLocaleString()} document hit${documentCount === 1 ? "" : "s"}, and ${recordCount.toLocaleString()} other source hit${recordCount === 1 ? "" : "s"}.`
    : documentCount >= Math.max(speechCount, recordCount) && documentCount > 0
      ? `The individual evidence base is mostly books or OCR-backed document profiles: ${documentCount.toLocaleString()} document hit${documentCount === 1 ? "" : "s"} versus ${speechCount.toLocaleString()} speech hit${speechCount === 1 ? "" : "s"}, ${socialCount.toLocaleString()} social hit${socialCount === 1 ? "" : "s"}, and ${recordCount.toLocaleString()} other source hit${recordCount === 1 ? "" : "s"}.`
    : speechCount >= recordCount
    ? `The individual evidence base is mostly public speech: ${speechCount.toLocaleString()} speech hit${speechCount === 1 ? "" : "s"} versus ${recordCount.toLocaleString()} non-speech source hit${recordCount === 1 ? "" : "s"}.`
    : `The individual evidence base is mostly formal records, profile evidence, ministry files, media/think-tank sources, votes, questions, or source slots: ${recordCount.toLocaleString()} source hit${recordCount === 1 ? "" : "s"} versus ${speechCount.toLocaleString()} speech hit${speechCount === 1 ? "" : "s"}.`;
  const sharedReading = sharedRecords.length > 0
    ? `I am treating ${sharedRecords.length.toLocaleString()} co-signed or shared records as secondary evidence because those same texts can appear under other deputies.`
    : "There are no co-signed or shared records diluting the individual reading in the matched archive.";
  const directReading = directAnchor
    ? `How they look at Kurdistan: ${memberName}'s record directly touches the Kurdistan/Northern Iraq file, so they should stay in the KRG watch set. The surrounding language reads mainly as ${dominantFrame}, which means direct relevance does not automatically equal a friendly KRG position.`
    : `How they look at Kurdistan: I did not find a direct KRG, Kurdistan, Northern Iraq, Erbil, or Peshmerga citation in the stronger individual evidence set. The profile is therefore Kurdistan-adjacent rather than directly KRG-facing, and any friendliness score should stay cautious.`;
  const interpretationReading = securityAnchor && securityFrameCount >= Math.max(constructiveCount, rightsCount)
    ? `The main reason the friendliness score is not higher is that the strongest matched language is security-heavy, especially around ${formatLensTerms(securityAnchor.matchedTerms)}. That is a threat or counterterrorism frame more than a diplomatic KRG-cooperation frame.`
    : constructiveAnchor
      ? `The strongest positive or pragmatic signal points toward cooperation, rights, federal stability, humanitarian concern, trade, or dialogue, so the KRG reading should be more nuanced than a simple security label.`
      : rightsAnchor
        ? `The clearest sympathetic signal is more about Kurdish rights, identity, democracy, or equality than about the KRG as an institution, so it should not automatically be counted as Erbil-friendly policy.`
        : "I do not see a strong constructive, rights-based, or cooperation source that would lift the KRG-friendliness score. The reading should remain cautious until a better positive citation is imported.";
  const points = total === 0 ? [
    {
      text: `There is no responsible KRG-friendliness conclusion yet for ${memberName}. The local source archive has no matched Kurdistan, Northern Iraq, Iraq/Syria, PKK/YPG, Erbil, Peshmerga, oil, border, or minority-protection signals for this person.`,
      refs: []
    },
    {
      text: "For now this person should stay unscored on Kurdistan until tweets, books/OCR, speeches, questions, motions, official records, party statements, media interviews, or committee records create a real evidence base.",
      refs: []
    }
  ] : [
    {
      text: `Assessment for ${memberName}: ${posture}. The current KRG-friendliness reading is ${friendliness.toLowerCase()} with ${confidence.toLowerCase()} confidence. The local archive has ${total.toLocaleString()} matched source hit${total === 1 ? "" : "s"} overall, but this conclusion is based mainly on ${evidenceBaseLabel}. Inside that stronger basis, I count ${directCount.toLocaleString()} direct Kurdistan/KRG/Northern Iraq/Erbil/Peshmerga hit${directCount === 1 ? "" : "s"} and ${securityFrameCount.toLocaleString()} security-frame hit${securityFrameCount === 1 ? "" : "s"}; across the whole archive the comparable totals are ${allDirectCount.toLocaleString()} direct and ${allSecurityFrameCount.toLocaleString()} security-frame hits.`,
      refs: refsFor(directAnchor, securityAnchor, constructiveAnchor || rightsAnchor)
    },
    {
      text: directReading,
      refs: refsFor(directAnchor)
    },
    {
      text: interpretationReading,
      refs: refsFor(securityAnchor || constructiveAnchor || rightsAnchor)
    },
    {
      text: `${sourceReading} ${sharedReading} The strongest channel for this conclusion is ${baseTopSource}; the full matched archive's largest channel is ${topSource}.`,
      refs: refsFor(recentAnchor, directAnchor, securityAnchor)
    }
  ];
  const paragraphs = points.map((point) => point.text);

  const factors = [
    {
      title: "KRG friendliness reading",
      count: directCount,
      reading: directAnchor
        ? `The KRG-friendliness reading is ${friendliness.toLowerCase()} because direct Kurdistan/Northern Iraq relevance is filtered through ${dominantFrame}.`
        : "No strong direct source appears in the person's own posts, books/OCR, speeches, written questions, or lead records, so friendliness remains unproven.",
      refs: refsFor(directAnchor, constructiveAnchor || rightsAnchor)
    },
    {
      title: "Direct KRG/Kurdistan signal",
      count: directCount,
      reading: directAnchor
        ? `There is direct Kurdistan/KRG/Northern Iraq relevance. It matched ${formatLensTerms(directAnchor.matchedTerms)}, so this person should stay in the Kurdistan watch set.`
        : "No direct KRG, Kurdistan, Northern Iraq, Erbil, or Peshmerga citation was found in the stronger individual basis.",
      refs: refsFor(directAnchor, iraqAnchor)
    },
    {
      title: "Security / PKK / YPG / border frame",
      count: securityFrameCount,
      reading: securityAnchor
        ? `The strongest security citation matched ${formatLensTerms(securityAnchor.matchedTerms)}, which is why the conclusion moves toward a security-first reading.`
        : "No strong PKK, YPG/SDF, border, operation, terrorism, or security citation appears in the individual evidence base.",
      refs: refsFor(securityAnchor, negativeAnchor)
    },
    {
      title: "Constructive / rights / cooperation language",
      count: constructiveCount + rightsCount,
      reading: constructiveAnchor || rightsAnchor
        ? `There is some constructive or rights-based language, but it has to be weighed against the security citations before calling the person KRG-friendly.`
        : "No strong cooperation, rights, federalism, humanitarian, trade, dialogue, or democratic-stability source appears in the individual evidence base.",
      refs: refsFor(constructiveAnchor, rightsAnchor, securityAnchor)
    },
    {
      title: "Iraq / Northern Iraq frame",
      count: iraqCount,
      reading: iraqAnchor
        ? `The record reaches the KRG file through Iraq, Northern Iraq, Baghdad, Kirkuk, Mosul, Erbil, or Peshmerga language.`
        : "No meaningful Iraq or Northern Iraq frame appears in the stronger individual basis.",
      refs: refsFor(iraqAnchor)
    },
    {
      title: "Economic / humanitarian angle",
      count: energyCount + minorityCount,
      reading: energyAnchor || minorityAnchor
        ? `There is an economic, energy, Yazidi/Sinjar, or humanitarian angle. That can make the posture pragmatic or humanitarian even when the security frame remains strong.`
        : "No distinct oil, pipeline, trade, Yazidi/Sinjar, or minority-protection citation appears in the stronger individual basis.",
      refs: refsFor(energyAnchor, minorityAnchor)
    }
  ];

  return {
    posture,
    confidence,
    friendliness,
    points,
    paragraphs,
    anchors,
    citationSources,
    factors,
    caution:
      "This is an evidence-weighted reading, not a final truth. It should be checked against the actual source snippets, party line, institutional role, public interviews, government context, and whether the person is speaking personally or repeating an organization or parliamentary group position."
  };
}

function countLensRecordsFor(records, terms) {
  return records.filter((record) => terms.some((term) => record.matchedTerms.includes(term))).length;
}

function countLensTextFor(records, patterns) {
  return records.filter((record) => hasLensTextPattern(record, patterns)).length;
}

function hasLensTextPattern(record, patterns) {
  const haystack = normalizeSearchText([
    record.title,
    record.summary,
    record.analysisText,
    record.snippet,
    record.sourceLabel
  ].join(" "));
  return patterns.some((pattern) => haystack.includes(normalizeSearchText(pattern)));
}

function isPrimaryLensEvidence(record) {
  if (!["record"].includes(record.kind)) return true;
  const source = record.sourceLabel || "";
  return record.kind === "speech" || /written questions submitted|first signatory/i.test(source);
}

function isSharedLensEvidence(record) {
  const source = record.sourceLabel || "";
  return !isPrimaryLensEvidence(record) && /signed/i.test(source);
}

function findLensAnchor(records, terms, ...exclude) {
  const excluded = new Set(exclude.filter(Boolean));
  return [...records]
    .filter((record) => !excluded.has(record) && terms.some((term) => record.matchedTerms.includes(term)))
    .sort((a, b) => scoreLensAnchor(b, terms) - scoreLensAnchor(a, terms))[0];
}

function findLensTextAnchor(records, patterns, ...exclude) {
  const excluded = new Set(exclude.filter(Boolean));
  return [...records]
    .filter((record) => !excluded.has(record) && hasLensTextPattern(record, patterns))
    .sort((a, b) => scoreLensAnchor(b, []) - scoreLensAnchor(a, []))[0];
}

function scoreLensAnchor(record, terms) {
  const termScore = terms.reduce((score, term) => score + (record.matchedTerms.includes(term) ? 3 : 0), 0);
  const basisScore = isPrimaryLensEvidence(record) ? 20 : 0;
  const speechScore = record.kind === "speech" ? 6 : 0;
  const detailScore = (record.snippet || record.summary || "").length > 120 ? 4 : 0;
  const yearScore = Number(extractYear(record.date)) || 0;
  return basisScore + speechScore + detailScore + termScore + (yearScore / 1000);
}

function describeLensDominantFrame({ directCount, securityFrameCount, constructiveCount, rightsCount, energyCount, minorityCount, iraqCount, syriaCount }) {
  if (directCount === 0 && (iraqCount > 0 || syriaCount > 0)) {
    return "an indirect Iraq/Syria file rather than a direct KRG relationship";
  }
  if (securityFrameCount >= Math.max(1, constructiveCount, rightsCount)) {
    return "a security, PKK/YPG, border, or counterterrorism file";
  }
  if (rightsCount > securityFrameCount && rightsCount >= constructiveCount) {
    return "a Kurdish-rights and democratic-recognition file";
  }
  if (energyCount > 0 && energyCount >= constructiveCount) {
    return "a pragmatic energy, oil, pipeline, or economic file";
  }
  if (minorityCount > 0) {
    return "a humanitarian or minority-protection file";
  }
  if (constructiveCount > 0) {
    return "a cooperation, dialogue, stability, or rights file";
  }
  if (directCount > 0) {
    return "a direct but mixed Kurdistan/Northern Iraq file";
  }
  return "an indirect regional file";
}

function makeLensEvidence(item, role) {
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
    url: item.url,
    localHref: item.localHref,
    frames: item.frames ?? [],
    snippet: compactLensText(item.snippet || item.summary, 340),
    matchedTerms: item.matchedTerms ?? []
  };
}

function uniqueLensEvidence(items) {
  const seen = new Set();
  return items.filter(Boolean).filter((item) => {
    const key = getLensEvidenceKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getLensEvidenceKey(item) {
  return [item?.kind, item?.activityType, item?.recordIndex, item?.reference, item?.title, item?.date].join("|");
}

function summarizeLensCitation(item) {
  if (!item) return "no specific local source";
  const date = item.date ? ` on ${item.date}` : "";
  return `${item.sourceLabel || "local source"}${date}, "${item.title || "Untitled source"}"`;
}

function quoteLensSnippet(item) {
  const snippet = compactLensText(item?.snippet || item?.summary, 260);
  return snippet ? `"${snippet}"` : "a local source passage with no readable excerpt";
}

function compactLensText(value, limit = 260) {
  const text = `${value ?? ""}`.replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const trimmed = text.slice(0, limit).replace(/\s+\S*$/, "").trim();
  return `${trimmed}...`;
}

function formatLensTerms(terms = []) {
  return terms.slice(0, 4).join(", ") || "matched";
}

function buildKurdistanLensSourceSplit(records) {
  const counts = new Map();
  records.forEach((record) => {
    const label = simplifyLensSourceLabel(record);
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6);
}

function simplifyLensSourceLabel(record) {
  if (record.kind === "social") return "Captured social posts";
  if (record.kind === "speech") return "Speeches";
  if (record.kind === "document" || record.kind === "readable-document") return "Books / OCR";
  if (/profile|dossier/i.test(record.kind)) return "Profile analysis";
  if (/ministry/i.test(record.kind)) return "Foreign ministry";
  if (/media/i.test(record.kind)) return "Media monitor";
  if (/think/i.test(record.kind)) return "Think tanks";
  if (/congress/i.test(record.kind)) return "Congress records";
  if (/france|national|parliament|vote|question/i.test(record.kind)) return "Parliament records";
  if (/country/i.test(record.kind)) return "Country evidence";
  return simplifyParliamentarySourceLabel(record.sourceLabel);
}

function simplifyParliamentarySourceLabel(label) {
  if (/question/i.test(label)) return "Written questions";
  if (/bill/i.test(label)) return "Bills";
  if (/inquiry/i.test(label)) return "Inquiry motions";
  if (/debate/i.test(label)) return "Debate motions";
  if (/investigation/i.test(label)) return "Investigation motions";
  return label || "Other records";
}

function buildKurdistanLensTimeline(records) {
  const counts = new Map();
  records.forEach((record) => {
    const year = extractYear(record.date);
    if (!year) return;
    counts.set(year, (counts.get(year) || 0) + 1);
  });

  const entries = [...counts.entries()].sort(([a], [b]) => Number(a) - Number(b));
  if (entries.length === 0) return [];
  const max = Math.max(1, ...entries.map(([, count]) => count));
  const width = 320;
  const height = 88;
  const lastIndex = Math.max(1, entries.length - 1);

  return entries.map(([label, count], index) => ({
    label,
    count,
    x: entries.length === 1 ? width / 2 : (index / lastIndex) * width,
    y: height - (count / max) * 72 + 4
  }));
}

function makeSparklinePath(points) {
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
}

function makeDonutSegments(items) {
  const colors = ["#245047", "#7a8f52", "#b98749", "#8b6f9f", "#4f7f91", "#b65f5f"];
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (!total) return { gradient: "#e8efe9 0 100%", colors };

  let cursor = 0;
  const segments = items.map((item, index) => {
    const start = cursor;
    const end = cursor + (item.count / total) * 100;
    cursor = end;
    return `${colors[index % colors.length]} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  });

  return { gradient: `conic-gradient(${segments.join(", ")})`, colors };
}

function formatActivityFieldLabel(label) {
  const fieldMap = {
    "Taksim/ Esas No": "File number",
    "Taksim/Esas No": "File number",
    "Tarihi": "Date",
    "Dönem": "Term",
    "Dönemi/ Yasama Yılı": "Term / legislative year",
    "Önergenin Başlığı ve Özeti": "Motion title and summary",
    "Önergenin Özeti": "Motion summary",
    "Birleşim Tarihi": "Sitting date",
    "Kanun Teklifi Başlığı ve Özeti": "Bill title and summary"
  };

  return fieldMap[label] || label;
}

function formatActivityFieldValue(value, language = "english") {
  if (language === "turkish") return value;

  const valueMap = {
    "Tutanak İçin Tıklayınız": "Open minutes",
    "Tutanak": "Minutes",
    "Cevaplandı": "Answered",
    "Cevaplanmadı": "Unanswered"
  };

  return valueMap[value] || formatTurkishParty(value);
}

function getActivityFieldValue(record, label, value, language = "english") {
  if (language === "english" && record.englishFields?.[label]) return record.englishFields[label];
  return formatActivityFieldValue(value, language);
}

function formatActivitySection(value) {
  return `${value ?? ""}`
    .replace(/\bAK Parti\b/g, "AK Party")
    .replace(/\bDEM PARTİ\b/g, "DEM Party")
    .replace(/\bİYİ Parti\b/g, "Good Party")
    .replace(/\bYENİ YOL\b/g, "New Path")
    .replace(/\bBAĞIMSIZ\b/g, "Independent")
    .replace(/\bHÜDA PAR\b/g, "Huda Par")
    .replace(/\bTİP\b/g, "Workers' Party of Turkey")
    .replace(/\bEMEP\b/g, "Labor Party");
}

function getForeignMinistryPersonProfile(countryId, person) {
  const ministry = foreignMinistryData[countryId];
  const countryName = countries.find((country) => country.id === countryId)?.name || ministry?.countryName || "Unknown";
  const existing = actorProfiles[person.name] ?? {};
  const actor = makeForeignMinistryPersonActor(countryId, person);
  const recordStatements = (person.records ?? [])
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => isForeignMinistryKurdistanRecord(record));
  const statementsOnKurdistan = recordStatements.length > 0
    ? recordStatements.map(({ record, index }) => ({
        date: record.date,
        stance: formatForeignMinistryRecordFrame(record),
        title: record.title,
        summary: record.summary,
        url: foreignMinistryRecordHref(countryId, person, record, index)
      }))
    : [
        {
          date: "Current archive",
          stance: "No direct KRG statement attached yet",
          title: "Kurdistan relevance is indirect or pending",
          summary:
            "This profile has ministry authority and regional relevance, but TOR Phi has not attached a direct KRG/Kurdistan source record for this person yet.",
          url: recordsHref({ id: countryId }, actor)
        }
      ];
  const ministryRecords = (person.records ?? []).map((record, index) => [
    record.title,
    record.source,
    record.date,
    foreignMinistryRecordHref(countryId, person, record, index)
  ]);
  const sourceRecords = (person.sourceLinks ?? []).map(([label, url]) => [
    label,
    ministry?.shortName || person.title,
    "Source",
    url
  ]);
  const relationshipParts = [
    person.kurdistanAssessment,
    existing.relationshipToKurdistan && normalizeSearchText(existing.relationshipToKurdistan) !== normalizeSearchText(person.kurdistanAssessment)
      ? existing.relationshipToKurdistan
      : ""
  ].filter(Boolean);

  return {
    ...existing,
    kind: "Foreign Ministry Profile",
    country: countryName,
    currentRole: existing.currentRole || `${person.title}, ${ministry?.shortName || ministry?.ministryName || "Foreign ministry"}`,
    summary: chooseLongerText(person.summary, existing.summary),
    tags: uniqueStrings([
      ministry?.shortName,
      person.category,
      person.bureau,
      ...(person.tags ?? []),
      ...(existing.tags ?? [])
    ]),
    imageUrl: person.imageUrl || existing.imageUrl,
    imageCredit: person.imageCredit || existing.imageCredit || (person.imageUrl ? ministry?.shortName : undefined),
    biographyFacts: dedupeFacts([
      ["Name", person.name],
      ["Country", countryName],
      ["Ministry", ministry?.ministryName || "Foreign ministry"],
      ["Current role", person.title],
      ["Bureau / portfolio", person.bureau],
      ["Category", person.category],
      ["Why this person matters", person.importance],
      ["Kurdistan relevance", person.kurdistanAssessment],
      ...(person.facts ?? []),
      ...(existing.biographyFacts ?? [])
    ]),
    officialProfiles: dedupeLinkList([
      ["Internal ministry records", recordsHref({ id: countryId }, actor)],
      ["Official ministry profile", person.officialUrl],
      ...(person.sourceLinks ?? []),
      ...(existing.officialProfiles ?? [])
    ]),
    social: dedupeLinkList([
      ...(person.social ?? []),
      ...(existing.social ?? [])
    ]),
    resumeTimeline: sortResumeTimelineItems(dedupeTimelineItems([
      ...(person.resumeTimeline ?? []),
      ...(existing.resumeTimeline ?? [])
    ])).slice(0, 14),
    writingsAndStatements: dedupeProfileRecords([
      ["Internal ministry records", "TOR Phi", "Current", recordsHref({ id: countryId }, actor)],
      ...ministryRecords,
      ...sourceRecords,
      ...(existing.writingsAndStatements ?? [])
    ]),
    statementsOnKurdistan: dedupeStatementRecords([
      ...statementsOnKurdistan,
      ...(existing.statementsOnKurdistan ?? [])
    ]),
    relationshipToKurdistan: relationshipParts.join("\n\n"),
    monitoringTasks: uniqueStrings([
      ...(person.monitoringTasks ?? []),
      ...(existing.monitoringTasks ?? [])
    ]),
    researchDocuments: existing.researchDocuments ?? [],
    readableDocuments: existing.readableDocuments ?? []
  };
}

function chooseLongerText(primary, secondary) {
  const first = `${primary ?? ""}`.trim();
  const second = `${secondary ?? ""}`.trim();
  if (!second) return first;
  if (!first) return second;
  return second.length > first.length ? second : first;
}

function isForeignMinistryKurdistanRecord(record) {
  return /kurd|krg|ikby|erbil|hewler|peshmerga|iraq|northern iraq|syria|ypg|sdf|pkk|yazidi|sinjar|oil|energy/i.test([
    record?.title,
    record?.summary,
    record?.frame,
    record?.source,
    record?.type
  ].join(" "));
}

function uniqueStrings(items) {
  const seen = new Set();
  return items
    .filter(Boolean)
    .map((item) => `${item}`.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeSearchText(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function dedupeFacts(items) {
  const seen = new Set();
  return items.filter(([label, value]) => {
    if (!label || !value) return false;
    const key = normalizeSearchText(label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeTimelineItems(items) {
  const seen = new Set();
  const seenYearTitle = new Set();
  return items.filter((item) => {
    if (!item) return false;
    const yearTitleKey = normalizeSearchText([
      item?.year,
      item?.title || item?.label
    ].join(" "));
    const key = normalizeSearchText([
      item?.year,
      item?.title || item?.label,
      item?.summary || item?.detail,
      item?.url
    ].join(" "));
    if (!key) return false;
    if (yearTitleKey && seenYearTitle.has(yearTitleKey)) return false;
    if (seen.has(key)) return false;
    if (yearTitleKey) seenYearTitle.add(yearTitleKey);
    seen.add(key);
    return true;
  });
}

function sortResumeTimelineItems(items) {
  return [...(items ?? [])]
    .filter(Boolean)
    .filter(isResumeTimelineItem)
    .sort((a, b) => {
      const yearDelta = Number(extractSortableYear(a.year)) - Number(extractSortableYear(b.year));
      if (yearDelta !== 0) return yearDelta;
      return normalizeSearchText(a.title || a.label).localeCompare(normalizeSearchText(b.title || b.label));
    });
}

function isResumeTimelineItem(item) {
  const title = `${item?.title || item?.label || ""}`;
  const summary = `${item?.summary || item?.detail || ""}`;
  const text = `${title} ${summary}`.toLowerCase();
  return !/(evidence gap|watch file|current file|monitoring role|relevance watch|business monitoring|soft-power monitoring|research priority|source-search|source search|source slot|stance pending|no direct|unscored|imported vote|written questions imported|historical written questions|recent vote positions imported|records page|record-level review|profile should be monitored|should be monitored|monitor public schedules|monitor reports|track him|track her|track french|track france|track every|attach direct|refresh the profile|media framing monitor|mention intake pending|kurdistan stance pending)/i.test(text);
}

function dedupeProfileRecords(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeSearchText(`${item?.[0]} ${item?.[3]}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeResearchDocuments(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeSearchText(item?.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeStatementRecords(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeSearchText(`${item?.date} ${item?.title} ${item?.url}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getTurkishParliamentInstitutionProfile() {
  const largestParties = turkishParliamentMetadata.parties
    .slice(0, 6)
    .map((item) => `${formatTurkishParty(item.party)}: ${item.count}`)
    .join("; ");

  return {
    kind: "Parliament",
    country: "Turkiye",
    currentRole: "National legislature of Turkiye",
    summary:
      "The Grand National Assembly of Turkiye is tracked as a parliament profile because deputy biographies, parties, provinces, committees, questions, speeches, and legislative records can reveal the domestic political terrain around Iraq, Syria, Kurdish issues, KRG engagement, security policy, energy, trade, and cross-border operations.",
    tags: ["TBMM", "parliament", "deputies", "legislative oversight", "party map", "province map"],
    biographyFacts: [
      ["Institution", turkishParliamentName],
      ["Current roster source", "TBMM current deputies list"],
      ["Member profiles", `${turkishParliamentMetadata.total}`],
      ["Parties represented", `${turkishParliamentMetadata.parties.length}`],
      ["Provinces represented", `${turkishParliamentMetadata.provinces.length}`],
      ["Largest party groups", largestParties || "Run generator to populate official roster"],
      ["Analyst use", "Search deputies by name, party, province, committee, biography, and official email before building Kurdistan-facing assessments"]
    ],
    officialProfiles: [
      ["TBMM official site", "https://www.tbmm.gov.tr/"],
      ["Current deputies list", turkishParliamentMetadata.sources.currentList],
      ["English deputies page", turkishParliamentMetadata.sources.englishDeputies],
      ["Official email roster", turkishParliamentMetadata.sources.emailRoster],
      ["Roster endpoint used by project generator", turkishParliamentMetadata.sources.allListEndpoint]
    ],
    social: [],
    writingsAndStatements: [
      ["Deputy detail pages", "TBMM", turkishParliamentMetadata.sourceDate, turkishParliamentMetadata.sources.currentList],
      ["Deputy email directory", "TBMM", turkishParliamentMetadata.sourceDate, turkishParliamentMetadata.sources.emailRoster]
    ],
    statementsOnKurdistan: [
      {
        date: "Current",
        stance: "Institutional channel",
        title: "Parliamentary records must be reviewed member by member",
        summary:
          "The institution profile does not assign one stance to the whole parliament. Use member speeches, questions, committee records, party positions, and official votes to score Kurdistan/KRG relevance.",
        url: turkishParliamentMetadata.sources.currentList
      }
    ],
    relationshipToKurdistan:
      "TBMM is important because Turkish policy toward the KRG is not only presidential or intelligence-led. Parliament can show party-level pressure, nationalist constraints, Kurdish-party positioning, Iraq/Syria debate, energy and trade framing, committee oversight, and whether a deputy is speaking directly about Erbil, Baghdad, PKK, YPG/SDF, border security, or the Kurdistan Region.",
    monitoringTasks: [
      "Ingest all TBMM speeches and written questions mentioning KRG, IKBY, Kürdistan, Irak, Erbil, PKK, YPG, SDF, and border security",
      "Separate parliamentary party positions from executive policy signals",
      "Track deputies from border provinces and Kurdish-majority provinces as a distinct analyst lens",
      "Attach committee memberships for foreign affairs, defense, intelligence, trade, energy, and human rights"
    ]
  };
}

function getTurkishParliamentMemberProfile(member) {
  const activityLinks = member.activityLinks?.length ? member.activityLinks.map((item) => [formatTurkishActivityLabel(item.label), item.url]) : [["TBMM member profile", member.detailUrl]];
  const partyLabel = formatTurkishParty(member.party);
  const committeeLabels = (member.committees ?? []).map(formatTurkishCommittee);
  const parliamentaryActivity = member.parliamentaryActivity ?? [];
  const importedRecordCount = parliamentaryActivity.reduce((sum, item) => sum + (item.count || 0), 0);
  const contactFacts = Object.entries(member.contacts ?? {})
    .filter(([label]) => !/e-?posta/i.test(label))
    .slice(0, 4)
    .map(([label, value]) => [label, value]);
  const biography = member.englishBiography || member.biography || "Official biography text was not available in the parsed page";
  const resumeTimeline = buildTurkishParliamentBiographyTimeline(member, partyLabel, committeeLabels);

  return {
    kind: "Member of Parliament",
    country: "Turkiye",
    currentRole: `${partyLabel} deputy for ${member.province}`,
    summary:
      `${member.name} is a current Grand National Assembly of Turkiye member in the project roster. This profile uses the official TBMM detail page for biography, photo, contact, committees, and legislative activity links, then leaves Kurdistan-specific scoring to attached speeches, questions, votes, and committee records.`,
    tags: [partyLabel, member.province, "TBMM", "parliament member", ...committeeLabels.slice(0, 3)],
    imageUrl: member.imageUrl,
    imageCredit: member.imageUrl ? "TBMM official deputy portrait" : "Portrait pending official page parsing",
    biographyFacts: [
      ["Name", member.name],
      ["Party", partyLabel],
      ["Province", member.province],
      ["Official email", member.email || "Not listed in parsed roster"],
      ["TBMM period id", member.periodId || "Not listed"],
      ["Committee memberships", committeeLabels.length ? committeeLabels.join("; ") : "No committee text parsed yet"],
      ["Imported parliamentary records", importedRecordCount.toLocaleString()],
      ["Biography", biography],
      ...contactFacts
    ],
    officialProfiles: [
      ["TBMM official deputy profile", member.detailUrl],
      ["TBMM current deputies list", turkishParliamentMetadata.sources.currentList],
      ["TBMM email roster", turkishParliamentMetadata.sources.emailRoster]
    ],
    social: member.email ? [["Official TBMM email", `mailto:${member.email}`]] : [],
    resumeTimeline,
    parliamentaryActivity,
    writingsAndStatements: [],
    statementsOnKurdistan: [
      {
        date: "Pending",
        stance: "Unscored",
        title: "No Kurdistan-specific parliamentary record attached yet",
        summary:
          "Search this deputy's TBMM speeches, committee remarks, bills, written questions, and press statements for KRG/IKBY/Kürdistan/Irak/Suriye terms before assigning a stance.",
        url: member.detailUrl
      }
    ],
    relationshipToKurdistan:
      `${member.name}'s relevance should be read through party position, province, committees, and any direct parliamentary activity on Iraq, Syria, Kurdish issues, KRG/IKBY, PKK, YPG/SDF, energy, trade, and border security. This generated profile does not infer a personal stance without attached records.`,
    monitoringTasks: [
      "Search TBMM general assembly speeches for KRG, IKBY, Kürdistan, Irak, Erbil, PKK, YPG, SDF, and Peşmerge",
      "Search committee speech records and written questions",
      "Add party leadership role, if any",
      "Attach media/social statements only after source verification"
    ]
  };
}

function getFranceParliamentMemberProfile(member) {
  const groupLabel = member.group?.shortLabel || member.group?.label || "No parliamentary group listed";
  const partyLabel = member.party?.label || "No party affiliation listed";
  const committeeLabels = (member.committees ?? []).map((committee) => `${committee.label}${committee.quality ? ` / ${committee.quality}` : ""}`);
  const contactFacts = [
    ["Official email", member.contact?.emails?.[0] || "Not listed in parsed open data"],
    ["Official phone", member.contact?.phones?.[0] || "Not listed in parsed open data"],
    ["Paris office", member.contact?.officialAddress || "Not listed"],
    ["Constituency office", member.contact?.constituencyAddress || "Not listed"]
  ];

  return {
    kind: "Member of Parliament",
    country: "France",
    currentRole: `${groupLabel} deputy for ${member.constituency?.label || "the National Assembly"}`,
    summary:
      `${member.name} is a current French National Assembly deputy in the TOR Phi roster. This profile is generated from official Assemblee nationale open data and connects the person's biography, group, party, constituency, active mandates, vote-position archive, and source chain to an internal records page.`,
    tags: [
      groupLabel,
      member.constituency?.department,
      member.constituency?.region,
      "French National Assembly",
      "parliament member",
      ...committeeLabels.slice(0, 3)
    ].filter(Boolean),
    imageUrl: member.imageUrl,
    imageCredit: member.imageUrl ? "Assemblee nationale official deputy portrait" : "Portrait pending official source",
    biographyFacts: [
      ["Name", member.name],
      ["Parliamentary group", member.group?.label || groupLabel],
      ["Political party / financing attachment", partyLabel],
      ["Constituency", member.constituency?.label || "Not listed"],
      ["Region", member.constituency?.region || "Not listed"],
      ["Current mandate start", member.currentMandate?.takingOfficeDate || member.currentMandate?.startDate || "Not listed"],
      ["Profession", member.profession || "Not listed"],
      ["Born", formatFranceBirthLine(member.birth)],
      ["Hemicycle seat", member.constituency?.seat || member.currentMandate?.seat || "Not listed"],
      ["Vote positions imported", `${member.votePositionCount?.toLocaleString?.() ?? member.votePositionCount ?? 0}`],
      ["Active mandates", `${member.mandateCount || member.mandates?.length || 0}`],
      ["Committees / missions", committeeLabels.length ? committeeLabels.join("; ") : "No committee text parsed yet"],
      ...contactFacts
    ],
    officialProfiles: member.sourceLinks ?? [
      ["TOR Phi records", recordsHref({ id: "france" }, makeFranceParliamentMemberActor(member))],
      ["Assemblee nationale official deputy profile", member.officialUrl]
    ],
    social: [
      ...(member.contact?.emails ?? []).map((email) => ["Official email", `mailto:${email}`]),
      ...(member.contact?.websites ?? []).map((url) => ["Official / personal website", url]),
      ...(member.contact?.social ?? []).map((item) => [item.label, item.url])
    ],
    resumeTimeline: buildFranceParliamentResumeTimeline(member, groupLabel, committeeLabels),
    writingsAndStatements: [],
    statementsOnKurdistan: [
      {
        date: "Pending",
        stance: "Unscored",
        title: "No France-specific Kurdistan record analysis attached yet",
        summary:
          "Use this deputy's internal records page to search vote titles, questions, documents, interventions, and future imported statements for Kurdistan, Iraq, Syria, KRG, Peshmerga, Yazidi, security, energy, and minority-protection language before assigning a stance.",
        url: recordsHref({ id: "france" }, makeFranceParliamentMemberActor(member))
      }
    ],
    relationshipToKurdistan:
      `${member.name}'s Kurdistan relevance should be assessed through committee role, parliamentary group, party line, vote record, official interventions, questions, and any direct language about Iraq, Syria, Kurds, KRG, Northern Iraq, Peshmerga, Yazidis, security, or energy. This generated profile does not infer a personal stance without source-level review.`,
    monitoringTasks: [
      "Search official interventions and written questions for Kurdistan, Kurds, Iraq, Syria, KRG, Peshmerga, Yazidi, Daesh, security, and energy terms",
      "Separate group voting discipline from personal statements",
      "Add France-KRG meetings, delegations, media interviews, and constituency statements when sourced",
      "Refresh the official open-data import when the National Assembly roster changes"
    ]
  };
}

function formatFranceBirthLine(birth = {}) {
  const place = [birth.city, birth.department, birth.country].filter(Boolean).join(", ");
  if (birth.date && place) return `${birth.date} / ${place}`;
  return birth.date || place || "Not listed";
}

function buildFranceParliamentResumeTimeline(member, groupLabel, committeeLabels) {
  const items = [];
  if (member.birth?.date || member.birth?.city) {
    items.push({
      year: extractYear(member.birth.date) || "Birth",
      title: "Birth / origin",
      summary: formatFranceBirthLine(member.birth),
      url: member.officialUrl
    });
  }

  if (member.profession) {
    items.push({
      year: "Profession",
      title: member.profession,
      summary: "Profession field from the official Assemblee nationale active-deputy dataset.",
      url: member.officialUrl
    });
  }

  if (member.currentMandate?.startDate || member.currentMandate?.takingOfficeDate) {
    items.push({
      year: extractYear(member.currentMandate.takingOfficeDate || member.currentMandate.startDate) || "Current",
      title: "National Assembly mandate",
      summary: `${member.constituency?.label || "French National Assembly"}; ${member.currentMandate?.cause || "current mandate"}.`,
      url: member.officialUrl
    });
  }

  items.push({
    year: "Current",
    title: `Parliamentary group: ${groupLabel}`,
    summary: member.party?.label ? `Political party / financing attachment: ${member.party.label}.` : "Group affiliation from the official open-data mandate file.",
    url: member.officialUrl
  });

  committeeLabels.slice(0, 4).forEach((committee) => {
    items.push({
      year: "Current",
      title: committee,
      summary: "Active committee, delegation, or information-mission mandate from the official open-data file.",
      url: member.officialUrl
    });
  });

  return sortResumeTimelineItems(items).slice(0, 12);
}

function getNationalParliamentMemberProfile(countryId, member) {
  if (countryId === "uk") return getUkParliamentMemberProfile(member);
  if (countryId === "iran") return getIranParliamentMemberProfile(member);

  return {
    kind: "Member of Parliament",
    country: countries.find((country) => country.id === countryId)?.name || "Unknown",
    currentRole: member.role,
    summary: `${member.name} has an internal TOR Phi parliamentary profile and records page.`,
    tags: [member.house, member.role].filter(Boolean),
    imageUrl: member.imageUrl,
    imageCredit: "Parliament image source",
    biographyFacts: [["Role", member.role]],
    officialProfiles: member.sourceLinks ?? [],
    social: [],
    writingsAndStatements: [],
    statementsOnKurdistan: [],
    relationshipToKurdistan: "Assess this member through their official parliamentary records before assigning a stance.",
    monitoringTasks: ["Refresh official parliament import"]
  };
}

function getUkParliamentMemberProfile(member) {
  const actor = makeNationalParliamentMemberActor("uk", member);
  return {
    kind: "Member of Parliament",
    country: "United Kingdom",
    currentRole: `${member.fullTitle || member.name}, ${member.role}`,
    summary:
      `${member.name} is a current UK House of Commons member in the TOR Phi roster. This profile is generated from official UK Parliament APIs and connects their Commons identity, party, constituency, contact fields, written-question rows, registered interests, and recent division votes to an internal records page.`,
    tags: [
      "UK House of Commons",
      member.party,
      member.partyAbbreviation,
      member.constituency,
      "parliament member"
    ].filter(Boolean),
    imageUrl: member.imageUrl,
    imageCredit: member.imageUrl ? "UK Parliament Members API thumbnail" : "Portrait pending official source",
    biographyFacts: [
      ["Name", member.name],
      ["Full title", member.fullTitle || "Not listed"],
      ["House", member.house],
      ["Party", member.party || "Not listed"],
      ["Constituency", member.constituency || "Not listed"],
      ["Membership start", member.currentMembership?.startDate || "Not listed"],
      ["Current status", member.currentMembership?.status || "Current Member"],
      ["Official email", member.contact?.emails?.[0] || "Not listed"],
      ["Office phone", member.contact?.phones?.[0] || "Not listed"],
      ["Recent vote positions imported", `${member.votePositionCount?.toLocaleString?.() ?? member.votePositionCount ?? 0}`],
      ["Written questions imported", `${member.writtenQuestionCount?.toLocaleString?.() ?? member.writtenQuestionCount ?? 0}`],
      ["Registered-interest entries imported", `${member.registeredInterestCount?.toLocaleString?.() ?? member.registeredInterestCount ?? 0}`],
      ["Synopsis", member.synopsis || "Not listed"]
    ],
    officialProfiles: member.sourceLinks ?? [["TOR Phi records", recordsHref({ id: "uk" }, actor)], ["UK Parliament member profile", member.officialUrl]],
    social: [
      ...(member.contact?.emails ?? []).map((email) => ["Official email", `mailto:${email}`]),
      ...(member.contact?.websites ?? []).map((url) => ["Official / personal website", url]),
      ...(member.contact?.social ?? [])
    ],
    resumeTimeline: buildUkParliamentResumeTimeline(member, actor),
    writingsAndStatements: [
      ["Internal parliamentary records", "TOR Phi", "Current", recordsHref({ id: "uk" }, actor)],
      ["UK Parliament member profile", "UK Parliament", "Current", member.officialUrl]
    ],
    statementsOnKurdistan: [
      {
        date: member.latestVoteDate || "Current archive",
        stance: "Unscored",
        title: "Kurdistan / Iraq stance requires record-level review",
        summary:
          "Use the internal records page to search this MP's imported vote rows and written questions for Kurdistan, KRG, Iraq, Syria, Iran, Peshmerga, Yazidis, security, asylum, sanctions, oil, and energy language before assigning a stance.",
        url: recordsHref({ id: "uk" }, actor)
      }
    ],
    relationshipToKurdistan:
      `${member.name}'s Kurdistan relevance should be assessed through Commons votes, written questions, party position, committee/ministerial role where applicable, and direct statements about Iraq, KRG, Erbil, Peshmerga, Syria, Iran, asylum, security, and energy. This generated profile does not infer a personal KRG stance without source-level review.`,
    monitoringTasks: [
      "Search imported votes and written questions for Kurdistan, KRG, Iraq, Syria, Iran, Peshmerga, Yazidi, asylum, security, oil, and energy terms",
      "Add committee memberships, ministerial roles, speeches, and press releases when sourced",
      "Separate party-whip voting from individual statements",
      "Refresh the official UK Parliament API import when the Commons roster changes"
    ]
  };
}

function buildUkParliamentResumeTimeline(member, actor) {
  const items = [];
  if (member.currentMembership?.startDate) {
    items.push({
      year: extractYear(member.currentMembership.startDate) || "Current",
      title: "Commons membership",
      summary: `${member.role}; ${member.currentMembership.status || "current member"}.`,
      url: member.officialUrl
    });
  }
  items.push({
    year: "Party",
    title: member.party || "Party not listed",
    summary: `${member.partyAbbreviation || member.party || "No party abbreviation"} / ${member.constituency || "constituency not listed"}.`,
    url: member.officialUrl
  });
  return sortResumeTimelineItems(items).slice(0, 12);
}

function getIranParliamentMemberProfile(member) {
  const actor = makeNationalParliamentMemberActor("iran", member);
  const isKurdishProvince = /Kurdistan|Kermanshah|West Azerbaijan|Ilam/i.test(member.province || "");

  return {
    kind: "Member of Parliament",
    country: "Iran",
    currentRole: `${member.name}, ${member.role}`,
    summary:
      `${member.name} is listed in TOR Phi as a 12th-term Islamic Consultative Assembly member. Because the official ParlIran host was unreachable during generation, this profile is seeded from a current public roster and anchored to official-source search paths for ICANA, IPU, the Majlis Research Center, and the official parliament site.`,
    tags: [
      "Iranian Majlis",
      member.legislature,
      member.faction,
      member.province,
      member.constituency,
      isKurdishProvince ? "Kurdish-region domestic watch" : ""
    ].filter(Boolean),
    imageUrl: member.imageUrl,
    imageCredit: member.imageUrl ? "Majlis official portrait" : "Portrait pending official ParlIran import",
    biographyFacts: [
      ["Name", member.name],
      ["House", member.house],
      ["Legislature", member.legislature],
      ["Province", member.province || "Not listed"],
      ["Constituency", member.constituency || "Not listed"],
      ["Political faction", member.faction || "Not listed"],
      ["Election/list signal", member.list || "Not listed"],
      ["Roster number", `${member.number}`],
      ["Source-search slots", `${member.recordSearchCount || 0}`],
      ["Official-site status", "ParlIran host unreachable during generation; ICANA reachable"]
    ],
    officialProfiles: member.sourceLinks ?? [["TOR Phi records", recordsHref({ id: "iran" }, actor)], ["Islamic Consultative Assembly official website", member.officialUrl]],
    social: [],
    resumeTimeline: buildIranParliamentResumeTimeline(member, actor, isKurdishProvince),
    writingsAndStatements: [
      ["Internal parliamentary records", "TOR Phi", "Current", recordsHref({ id: "iran" }, actor)],
      ["ICANA member search", "ICANA / Khaneh Mellat", "Current", member.sourceLinks?.find(([label]) => /member mention/i.test(label))?.[1] || "https://icana.ir/"]
    ],
    statementsOnKurdistan: [
      {
        date: "Current archive",
        stance: isKurdishProvince ? "High-priority watch" : "Unscored",
        title: isKurdishProvince ? "Geographic relevance to Kurdish domestic politics" : "Kurdistan / Iraq stance requires official record review",
        summary: isKurdishProvince
          ? `${member.name} represents ${member.constituency} in ${member.province}. That makes border security, Kurdish domestic politics, Iraq, Erbil/KRG, trade crossings, and Kurdish opposition language high-priority watch items.`
          : "Use the internal records page to search ICANA and Majlis Research Center records for Kurdistan Region, Iraq, Erbil, KRG, border/security, Kurdish opposition, sanctions, energy, and minority-protection language before assigning a stance.",
        url: recordsHref({ id: "iran" }, actor)
      }
    ],
    relationshipToKurdistan:
      isKurdishProvince
        ? `${member.name}'s Kurdistan relevance is geographically stronger than an ordinary Majlis profile because ${member.province} sits inside Iran's Kurdish or Kurdish-adjacent domestic politics. Do not convert that into a pro-KRG or anti-KRG score automatically; check official statements for Iraq, KRG, Erbil, border security, opposition movements, and trade before briefing.`
        : `${member.name}'s Kurdistan relevance should be assessed through official statements, ICANA records, Majlis Research Center materials, committee roles, faction alignment, and any language about Iraq, KRG, Erbil, border security, Kurdish opposition groups, sanctions, energy, or minorities. This generated profile does not infer a personal KRG stance without source-level review.`,
    monitoringTasks: [
      "Replace public roster seed with official ParlIran profile fields when the host is reachable",
      "Search ICANA for member statements mentioning Kurdistan, Iraq, Erbil, KRG, Kurdish opposition groups, border security, sanctions, oil, energy, and trade crossings",
      "Attach committee memberships, speeches, questions, and votes only from official sources",
      "Separate Iranian domestic Kurdish issues from KRG/Erbil policy"
    ]
  };
}

function buildIranParliamentResumeTimeline(member, actor, isKurdishProvince) {
  return sortResumeTimelineItems([
    {
      year: "2024",
      title: "12th Majlis roster",
      summary: `${member.name} appears in the 12th-term roster for ${member.constituency}, ${member.province}.`,
      url: member.sourceLinks?.find(([label]) => /roster/i.test(label))?.[1] || member.officialUrl
    },
    {
      year: "Faction",
      title: member.faction || "Not listed",
      summary: member.list ? `Election/list signal: ${member.list}.` : "No list signal parsed in the public roster seed.",
      url: recordsHref({ id: "iran" }, actor)
    }
  ]);
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function buildTurkishParliamentBiographyTimeline(member, partyLabel, committeeLabels) {
  const biography = member.englishBiography || member.biography || "";
  const sentences = splitBiographyIntoTimelineSentences(biography);
  const items = [];
  const seen = new Set();

  function addItem(year, title, summary) {
    const cleanTitle = cleanTimelineText(title);
    const cleanSummary = cleanTimelineText(summary || title);
    if (!year || !cleanTitle) return;
    const key = `${year}-${cleanTitle}-${cleanSummary}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      year,
      title: cleanTitle,
      summary: cleanSummary,
      url: member.detailUrl
    });
  }

  sentences.forEach((sentence, index) => {
    const birth = sentence.match(/^(.*?)\s+[–-]\s+((?:19|20)\d{2})(?:,|\b)/);
    if (index === 0 && birth) {
      addItem(birth[2], "Birth / origin", sentence);
      return;
    }

    const year = extractTimelineYearLabel(sentence);
    if (!year && !isBiographicalMilestone(sentence)) return;
    addItem(year || "Career", titleFromBiographySentence(sentence), sentence);
  });

  addItem("Current", `${partyLabel} deputy for ${member.province}`, "Current TBMM roster record from the official member list.");

  committeeLabels.slice(0, 3).forEach((committee) => {
    if (items.some((item) => normalizeSearchText(item.summary).includes(normalizeSearchText(committee)))) return;
    addItem("Current", committee, "Official TBMM committee membership text from the deputy detail page.");
  });

  return sortResumeTimelineItems(items).slice(0, 12);
}

function splitBiographyIntoTimelineSentences(text) {
  return `${text ?? ""}`
    .split(/\n+/)
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9])/))
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractTimelineYearLabel(text) {
  const value = `${text ?? ""}`;
  const range = value.match(/\b((?:19|20)\d{2})\s*[-/]\s*((?:19|20)\d{2})\b/);
  if (range) return `${range[1]}-${range[2]}`;

  const years = [...value.matchAll(/\b(19|20)\d{2}\b/g)].map((match) => match[0]);
  if (years.length > 1) return `${years[0]}-${years[years.length - 1]}`;
  if (years.length === 1) return years[0];

  const term = value.match(/\b(\d{1,2})(?:st|nd|rd|th)\s+Term\b/i);
  if (term) return `${term[1]}th Term`;

  return "";
}

function isBiographicalMilestone(text) {
  return /\b(graduated|completed|studied|worked|served|elected|appointed|founded|started|became|chair|chairman|president|member|commission|committee|board|deputy|minister|mayor|lawyer|engineer|doctor|teacher|journalist|business|academy|university|speaks|married)\b/i.test(`${text ?? ""}`);
}

function titleFromBiographySentence(text) {
  const value = cleanTimelineText(text);
  const titleRules = [
    [/\bis a member of\b|memberships?|association|foundation|union|chamber/i, "Civil society / memberships"],
    [/graduated|completed|studied|university|faculty|degree|education/i, "Education"],
    [/elected.*deputy|elected.*member of parliament|\b\d{1,2}(?:st|nd|rd|th)\s+Term\b/i, "Parliamentary election"],
    [/commission|committee/i, "Parliamentary commission role"],
    [/chairman|president|chair\b|board/i, "Leadership role"],
    [/mayor|municipal|council/i, "Local government role"],
    [/party|AK Party|CHP|MHP|Good Party|DEM Party|Welfare Party|Virtue Party/i, "Party career"],
    [/worked|served|manager|business|company|lawyer|engineer|doctor|teacher|journalist|pharmacist|academic/i, "Professional career"],
    [/speaks|language|married|children/i, "Personal background"]
  ];
  const matched = titleRules.find(([pattern]) => pattern.test(value));
  if (matched) return matched[1];
  return value.length > 72 ? `${value.slice(0, 69).trim()}...` : value;
}

function cleanTimelineText(text) {
  return `${text ?? ""}`
    .replace(/\s+/g, " ")
    .replace(/\bGrand National Assembly of Turkey\b/g, "Grand National Assembly of Turkiye")
    .replace(/\bTurkish Grand National Assembly\b/g, "Grand National Assembly of Turkiye")
    .trim();
}

function buildProfileResumeTimeline(profile) {
  if (profile.resumeTimeline?.length) {
    return sortResumeTimelineItems(dedupeTimelineItems(profile.resumeTimeline));
  }

  const records = [
    ...(profile.writingsAndStatements ?? []).map(([title, publisher, date, url]) => ({
      year: extractYear(date),
      title,
      summary: `${publisher} / ${date}`,
      url
    })),
    ...(profile.statementsOnKurdistan ?? []).map((item) => ({
      year: extractYear(item.date),
      title: item.title,
      summary: item.summary,
      url: item.url
    }))
  ].filter((item) => item.year);

  const datedRecords = records
    .sort((a, b) => Number(extractSortableYear(a.year)) - Number(extractSortableYear(b.year)))
    .slice(0, 12);

  if (datedRecords.length > 0) {
    return datedRecords;
  }

  return buildFallbackResumeTimeline(profile);
}

function extractYear(value) {
  return `${value ?? ""}`.match(/\b(19|20)\d{2}\b/)?.[0] ?? "";
}

function extractSortableYear(value) {
  const year = extractYear(value);
  if (year) return year;
  if (/birth/i.test(`${value ?? ""}`)) return "0000";
  if (/now|current|profile|watch|policy|krg|profession|party|interests|votes|questions|tracked/i.test(`${value ?? ""}`)) {
    return `${new Date().getFullYear()}`;
  }
  return "2100";
}

function buildFallbackResumeTimeline(profile) {
  const facts = profile.biographyFacts ?? [];

  return [
    {
      year: "Profile",
      title: profile.currentRole || profile.kind || "Project actor",
      summary: profile.summary || "Current role and institutional affiliation."
    },
    {
      year: "Bio",
      title: facts[0]?.[0] || "Biographical file",
      summary: facts[0] ? `${facts[0][0]}: ${facts[0][1]}` : "Add education, offices, appointments, and institutional history."
    }
  ];
}

function matchesThinkTankFocus(tank, people, focus) {
  if (focus === "All") return true;
  if (focus === "Very high proximity") return tank.proximityScore >= 80;
  if (focus === "Kurdistan specific") return hasThinkTankTerm(tank, "kurd") || hasThinkTankTerm(tank, "krg");
  if (focus === "Iraq specific") return hasThinkTankTerm(tank, "iraq") || hasThinkTankTerm(tank, "baghdad");
  if (focus === "Restraint / withdrawal") {
    return /restraint|withdraw|drawdown|troop|military footprint|de-escalation|permanent war|quincy/i.test([
      tank.name,
      tank.shortName,
      tank.type,
      tank.proximityRationale,
      tank.middleEastPolicy,
      tank.iraqPolicy,
      tank.kurdistanPolicy,
      ...tank.evidence
    ].join(" "));
  }

  return people.some((person) => /trump|america first|republican|nsc|administration|special envoy|white house/i.test([
    person.adminConnection,
    person.policySignal,
    person.organization
  ].join(" "))) || /trump|america first|republican|conservative|project 2025/i.test([
    tank.type,
    tank.proximityRationale,
    tank.middleEastPolicy
  ].join(" "));
}

function hasThinkTankTerm(tank, term) {
  return [
    tank.name,
    tank.shortName,
    tank.type,
    tank.proximityRationale,
    tank.middleEastPolicy,
    tank.iraqPolicy,
    tank.kurdistanPolicy,
    tank.specificity,
    ...tank.evidence,
    ...tank.sources.map(([label]) => label)
  ].join(" ").toLowerCase().includes(term);
}

function getThinkTankSpecificityScore(tank) {
  const value = `${tank.specificity ?? ""}`.toLowerCase();
  if (value.includes("very high")) return 92;
  if (value.includes("medium-high")) return 66;
  if (value.includes("high")) return 78;
  if (value.includes("medium")) return 52;
  if (value.includes("low")) return 28;
  return hasThinkTankTerm(tank, "kurd") || hasThinkTankTerm(tank, "krg") ? 58 : 36;
}

function findThinkTankPersonForSource(label, url, countryId = "") {
  const normalizedLabel = label.toLowerCase();
  const normalizedUrl = normalizeSourceUrl(url);
  const candidates = countryId ? getThinkTankNetwork(countryId).people : allThinkTankPeople;

  return candidates.find((person) => (
    normalizedLabel.includes(person.name.toLowerCase()) ||
    normalizeSourceUrl(person.url) === normalizedUrl
  ));
}

function normalizeSourceUrl(url) {
  return url.toLowerCase().replace(/\/$/, "");
}

function matchesMediaFraming(mention, filter) {
  if (filter === "All") return true;
  if (filter === "Favorable") return mention.score > 5;
  if (filter === "Critical") return mention.score < -5;
  if (filter === "Unscored") return /unscored/i.test(mention.framing);
  return mention.score >= -5 && mention.score <= 5 && !/unscored/i.test(mention.framing);
}

function formatMediaScore(score) {
  return score > 0 ? `+${score}` : `${score}`;
}

function getFramingClass(score) {
  if (score > 5) return "framing-positive";
  if (score < -5) return "framing-critical";
  return "framing-mixed";
}

function SourcePill({ item, compact = false }) {
  return (
    <a className={compact ? "source-pill compact" : "source-pill"} href={item.url} target="_blank" rel="noreferrer">
      <ExternalLink size={12} />
      {compact ? item.id : `${item.category}: ${item.sourceTitle}`}
    </a>
  );
}

function formatSigned(value) {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getRouteState() {
  const params = new URLSearchParams(window.location.search);
  const activityType = params.get("type") || "";
  const recordParam = params.get("record");
  const recordIndex = recordParam !== null && Number.isFinite(Number(recordParam)) ? Number(recordParam) : null;
  const pathParts = window.location.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (pathParts[0] === "country") {
    const requestedCountry = pathParts[1];
    const countryId = countries.some((country) => country.id === requestedCountry) ? requestedCountry : "usa";
    const section = pathParts[2];
    const slug = pathParts[3];

    if (section === "documents" && slug) {
      return {
        documentSlug: slug,
        countryId
      };
    }
    if (section === "watchlist") return { watchlistPage: true, countryId };
    if (section === "influence-chain") return { influenceChainPage: true, countryId };
    if (section === "declassified") return { declassifiedPage: true, countryId };
    if (section === "sessions" || section === "session-archive") return { sessionArchivePage: true, countryId };
    if (section === "media" && !slug) return { mediaPage: true, countryId };
    if (section === "media" && slug) return { mediaPerson: slug, lensPage: pathParts[4] === "lens", countryId };
    if ((section === "think-tanks" || section === "think-tank") && !slug) return { thinkTankPage: true, countryId };
    if ((section === "think-tanks" || section === "think-tank") && slug) return { thinkPerson: slug, lensPage: pathParts[4] === "lens", countryId };
    if (section === "foreign-ministry" && !slug) {
      return {
        foreignMinistryPage: true,
        countryId
      };
    }
    if (section === "foreign-ministry" && slug) {
      const ministrySubpage = pathParts[4];
      return {
        foreignMinistryCountryId: countryId,
        foreignMinistryPerson: slug,
        recordsPage: ministrySubpage === "records" && !pathParts[5],
        foreignMinistryRecordSlug: ministrySubpage === "records" ? pathParts[5] || "" : "",
        lensPage: ministrySubpage === "lens",
        countryId
      };
    }
    if (section === "congress" && slug) {
      return {
        bioguide: slug,
        congressRecordsPage: pathParts[4] === "records",
        lensPage: pathParts[4] === "lens",
        countryId
      };
    }
    if (section === "congress" && countryId === "usa") {
      return {
        congressListPage: true,
        countryId
      };
    }
    if (section === "parliament" && !slug) {
      return {
        parliamentPage: true,
        countryId
      };
    }
    if (section === "parliament" && slug) {
      if (countryId === "france") {
        return {
          franceParliamentMember: slug,
          recordsPage: pathParts[4] === "records",
          lensPage: pathParts[4] === "lens",
          countryId
        };
      }

      if (nationalParliamentData[countryId]) {
        return {
          nationalParliamentCountryId: countryId,
          nationalParliamentMember: slug,
          recordsPage: pathParts[4] === "records",
          lensPage: pathParts[4] === "lens",
          countryId
        };
      }

      return {
        tbmmMember: slug,
        speechPage: pathParts[4] === "speeches",
        recordsPage: pathParts[4] === "records",
        lensPage: pathParts[4] === "lens",
        activityType,
        recordIndex,
        countryId
      };
    }
    if (section === "profile" && slug) {
      return {
        actorName: resolveActorNameFromSlug(slug, countries.find((country) => country.id === countryId) ?? countries[0]),
        lensPage: pathParts[4] === "lens",
        countryId
      };
    }

    return { countryId };
  }

  const actorName = params.get("actor");
  const bioguide = params.get("bioguide");
  const tbmmMember = params.get("tbmmMember");
  const franceParliamentMember = params.get("franceParliamentMember");
  const nationalParliamentMember = params.get("nationalParliamentMember");
  const nationalParliamentCountryId = params.get("nationalParliamentCountryId");
  const foreignMinistryPerson = params.get("foreignMinistryPerson");
  const foreignMinistryCountryId = params.get("foreignMinistryCountryId");
  const thinkPerson = params.get("thinkPerson");
  const mediaPerson = params.get("mediaPerson");
  const requestedCountry = params.get("country");
  const actorCountry = actorName
    ? countries.find((country) => country.actors.some((actor) => actor.name === actorName))?.id
    : null;
  const countryId = countries.some((country) => country.id === requestedCountry)
    ? requestedCountry
    : actorCountry || (tbmmMember ? "turkey" : (franceParliamentMember ? "france" : (foreignMinistryData[foreignMinistryCountryId] ? foreignMinistryCountryId : (nationalParliamentData[nationalParliamentCountryId] ? nationalParliamentCountryId : (bioguide || thinkPerson || mediaPerson ? "usa" : "usa")))));

  return { actorName, bioguide, tbmmMember, franceParliamentMember, nationalParliamentMember, nationalParliamentCountryId, foreignMinistryPerson, foreignMinistryCountryId, thinkPerson, mediaPerson, countryId };
}

function resolveActorNameFromSlug(slug, country) {
  if (slug === slugify(turkishParliamentName)) return turkishParliamentName;

  const actor = country.actors.find((item) => slugify(item.name) === slug) || findActorAcrossCountriesBySlug(slug);
  if (actor) return actor.name;

  const profileEntry = Object.keys(actorProfiles).find((name) => slugify(name) === slug);
  return profileEntry || slug;
}

function findProfileActor(actorName, country) {
  if (country.id === "turkey" && actorName === turkishParliamentName) {
    return makeTurkishParliamentInstitutionActor();
  }

  const foreignMinistryPerson = findForeignMinistryPersonByName(actorName, country.id) || findForeignMinistryPersonByName(actorName);
  if (foreignMinistryPerson) {
    return makeForeignMinistryPersonActor(foreignMinistryPerson.countryId || country.id, foreignMinistryPerson);
  }

  if (country.id === "usa") {
    const congressMember = usCongressMembers.find((member) => (
      slugify(member.name) === slugify(actorName) ||
      normalizeSearchText(member.name) === normalizeSearchText(actorName)
    ));

    if (congressMember) return makeCongressActor(congressMember);
  }

  return findActor(actorName, country) || findActorAcrossCountries(actorName) || makeProfileOnlyActor(actorName, country);
}

function findActor(actorName, country) {
  return country.actors.find((actor) => actor.name === actorName);
}

function findActorAcrossCountries(actorName) {
  for (const country of countries) {
    const actor = country.actors.find((item) => item.name === actorName);
    if (actor) return actor;
  }

  return null;
}

function findActorAcrossCountriesBySlug(slug) {
  for (const country of countries) {
    const actor = country.actors.find((item) => slugify(item.name) === slug);
    if (actor) return actor;
  }

  return null;
}

function makeProfileOnlyActor(actorName, country) {
  const profile = actorProfiles[actorName];
  if (!profile) return null;

  return {
    name: actorName,
    institution: profile.country || country.name,
    role: profile.currentRole || "Project profile",
    stance: "Profile record",
    url: profile.officialProfiles?.[0]?.[1] || "#",
    evidenceIds: []
  };
}

function profileHref(country, actor) {
  if (actor.mediaAuthorId) {
    return `${countryHref({ id: actor.mediaCountryId || country.id })}/media/${encodeURIComponent(slugify(actor.name))}`;
  }

  if (actor.foreignMinistryPersonId) {
    return `${countryHref({ id: actor.foreignMinistryCountryId || country.id })}/foreign-ministry/${encodeURIComponent(slugify(actor.name))}`;
  }

  if (actor.thinkTankPersonId) {
    return `${countryHref({ id: actor.thinkTankCountryId || country.id })}/think-tanks/${encodeURIComponent(slugify(actor.name))}`;
  }

  if (actor.congressId) {
    return `${countryHref(country)}/congress/${encodeURIComponent(slugify(actor.name))}`;
  }

  if (actor.turkishParliamentMemberId) {
    return `${countryHref(country)}/parliament/${encodeURIComponent(slugify(actor.name))}`;
  }

  if (actor.franceParliamentMemberId) {
    return `${countryHref(country)}/parliament/${encodeURIComponent(slugify(actor.name))}`;
  }

  if (actor.nationalParliamentMemberId) {
    return `${countryHref(country)}/parliament/${encodeURIComponent(slugify(actor.name))}`;
  }

  const foreignMinistryPerson = findForeignMinistryPersonByName(actor.name, country.id);
  if (foreignMinistryPerson) {
    return `${countryHref({ id: foreignMinistryPerson.countryId || country.id })}/foreign-ministry/${encodeURIComponent(slugify(foreignMinistryPerson.name))}`;
  }

  return `${countryHref(country)}/profile/${encodeURIComponent(slugify(actor.name))}`;
}

function speechHref(country, actor) {
  return `${profileHref(country, actor)}/speeches`;
}

function recordsHref(country, actor) {
  return `${profileHref(country, actor)}/records`;
}

function foreignMinistryRecordSlug(record, index = 0) {
  const base = slugify([record?.date, record?.type, record?.title].filter(Boolean).join(" "));
  return `${base || "record"}-${index + 1}`;
}

function foreignMinistryRecordHref(countryId, person, record, index = 0) {
  const personSlug = slugify(person?.name || person?.id || "person");
  return `${countryHref({ id: countryId })}/foreign-ministry/${encodeURIComponent(personSlug)}/records/${encodeURIComponent(foreignMinistryRecordSlug(record, index))}`;
}

function findForeignMinistryRecordForRoute(countryId, person, recordSlug) {
  const normalized = slugify(recordSlug);
  const records = person?.records ?? [];
  const index = records.findIndex((record, itemIndex) => (
    foreignMinistryRecordSlug(record, itemIndex) === normalized ||
    slugify([record?.date, record?.type, record?.title].filter(Boolean).join(" ")) === normalized
  ));

  if (index < 0) return { record: null, index: -1 };
  return { record: records[index], index };
}

function getForeignMinistrySourceSnapshot(record) {
  const url = record?.url;
  if (!url) return null;
  const snapshots = foreignMinistrySourceSnapshots.snapshots ?? {};
  const withoutTrailingSlash = `${url}`.replace(/\/$/, "");
  const withTrailingSlash = `${withoutTrailingSlash}/`;
  return snapshots[url] || snapshots[withoutTrailingSlash] || snapshots[withTrailingSlash] || null;
}

function getSnapshotParagraphs(snapshot) {
  return `${snapshot?.text ?? ""}`
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function isForeignMinistryMonitoringRecord(record) {
  return /analyst task|watch|monitor|collection|source slot|gap/i.test([
    record?.type,
    record?.frame,
    record?.title,
    record?.summary
  ].join(" "));
}

function formatForeignMinistryRecordFrame(record) {
  if (isForeignMinistryMonitoringRecord(record)) return "TOR Phi monitoring record";
  return record?.frame || record?.type || "Official source record";
}

function getForeignMinistryRecordReading(record, person, ministry) {
  const ministryName = ministry?.shortName || ministry?.ministryName || "the ministry";
  if (isForeignMinistryKurdistanRecord(record)) {
    return `${record.title} is kept as an internal TOR Phi evidence item because it touches the Iraq, Syria, Kurdistan, KRG, security, energy, or Northern Iraq lane. For ${person.name}, it should be read beside the profile biography and Kurdistan Lens rather than as an isolated link: the value is that it anchors a concrete official-source event or source slot to the person, date, ministry channel, and regional-policy question.`;
  }

  if (isForeignMinistryMonitoringRecord(record)) {
    return `This is not a resume milestone. TOR Phi keeps it as a monitoring-control record: it tells the analyst which official archive, schedule, release stream, or public-source lane needs to be watched for ${person.name}. It belongs inside the website because future Iraq/Kurdistan-relevant material from ${ministryName} should attach back to this internal record rather than disappearing into an external archive link.`;
  }

  return `This record is preserved internally as source-backed context for ${person.name}'s current authority, appointment path, official biography, or institutional role. It may not be directly about Kurdistan by itself, but it explains why this person belongs in the foreign-ministry file and gives TOR Phi a local evidence node that can be linked from profiles, country feeds, watchlists, and Kurdistan Lens analysis.`;
}

function lensHref(country, actor) {
  return `${profileHref(country, actor)}/lens`;
}

function activityCitationHref(country, actor, item) {
  if (!["speech", "record"].includes(item.kind)) return item.localHref || item.url || profileHref(country, actor);
  const base = item.kind === "speech" ? speechHref(country, actor) : recordsHref(country, actor);
  const params = new URLSearchParams();
  if (item.activityType) params.set("type", item.activityType);
  if (Number.isInteger(item.recordIndex)) params.set("record", `${item.recordIndex}`);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function makeTurkishParliamentInstitutionActor() {
  return {
    name: turkishParliamentName,
    institution: "TBMM",
    role: "National legislature",
    stance: "Parliament profile",
    url: "https://www.tbmm.gov.tr/",
    evidenceIds: [],
    turkishParliamentInstitution: true
  };
}

function makeTurkishParliamentMemberActor(member) {
  if (!member) return null;

  return {
    name: member.name,
    institution: turkishParliamentName,
    role: `${formatTurkishParty(member.party)} deputy for ${member.province}`,
    stance: "Parliamentary actor; stance requires source-level review",
    url: member.detailUrl,
    imageUrl: member.imageUrl,
    evidenceIds: [],
    turkishParliamentMemberId: member.id,
    turkishParliamentMember: member
  };
}

function makeFranceParliamentMemberActor(member) {
  if (!member) return null;

  const groupLabel = member.group?.shortLabel || member.group?.label || "French National Assembly";
  return {
    name: member.name,
    institution: "French National Assembly",
    role: `${groupLabel} deputy for ${member.constituency?.label || "France"}`,
    stance: "Parliamentary actor; stance requires source-level review",
    url: member.officialUrl,
    imageUrl: member.imageUrl,
    evidenceIds: [],
    franceParliamentMemberId: member.id,
    franceParliamentMember: member
  };
}

function findNationalParliamentMember(countryId, slugOrId) {
  const data = nationalParliamentData[countryId];
  if (!data || !slugOrId) return null;
  return data.byId.get(slugOrId)
    || data.members.find((member) => member.slug === slugOrId || slugify(member.name) === slugOrId);
}

function makeNationalParliamentMemberActor(countryId, member) {
  if (!member) return null;
  const data = nationalParliamentData[countryId];
  const countryName = countries.find((item) => item.id === countryId)?.name || countryId;
  const role = countryId === "uk"
    ? `${member.partyAbbreviation || member.party || "Party not listed"} MP for ${member.constituency || "constituency not listed"}`
    : `${member.faction || "Faction not listed"} Majlis representative for ${member.constituency || "constituency not listed"}`;

  return {
    name: member.name,
    institution: data?.label || member.house || countryName,
    role,
    stance: "Parliamentary actor; stance requires source-level review",
    url: member.officialUrl,
    imageUrl: member.imageUrl,
    evidenceIds: [],
    nationalParliamentCountryId: countryId,
    nationalParliamentMemberId: member.id,
    nationalParliamentMember: member
  };
}

function getForeignMinistry(countryId) {
  return foreignMinistryData[countryId] ?? null;
}

function findForeignMinistryPerson(countryId, slugOrId) {
  const ministry = getForeignMinistry(countryId);
  if (!ministry || !slugOrId) return null;
  const normalized = slugify(slugOrId);
  const person = ministry.people.find((item) => (
    item.id === slugOrId ||
    slugify(item.id) === normalized ||
    slugify(item.name) === normalized
  ));

  return person ? { ...person, countryId } : null;
}

function findForeignMinistryPersonByName(name, countryId = "") {
  if (!name) return null;
  const normalized = slugify(name);
  const ministries = countryId && foreignMinistryData[countryId]
    ? [[countryId, foreignMinistryData[countryId]]]
    : Object.entries(foreignMinistryData);

  for (const [id, ministry] of ministries) {
    const person = ministry.people.find((item) => {
      const personSlug = slugify(item.name);
      return personSlug === normalized || personSlug.includes(normalized) || normalized.includes(personSlug);
    });
    if (person) return { ...person, countryId: id };
  }

  return null;
}

function makeForeignMinistryPersonActor(countryId, person) {
  if (!person) return null;
  const ministry = getForeignMinistry(countryId) || foreignMinistryData[person.countryId];
  const resolvedCountryId = countryId || person.countryId || ministry?.countryId;

  return {
    name: person.name,
    institution: ministry?.shortName || ministry?.ministryName || "Foreign ministry",
    role: person.title,
    stance: person.kurdistanAssessment,
    url: person.officialUrl,
    imageUrl: person.imageUrl,
    evidenceIds: [],
    foreignMinistryCountryId: resolvedCountryId,
    foreignMinistryPersonId: person.id,
    foreignMinistryPerson: person
  };
}

function makeThinkTankPersonActor(person, countryId = person?.countryId || "usa") {
  if (!person) return null;

  return {
    name: person.name,
    institution: person.organization,
    role: person.role,
    stance: person.policySignal,
    url: person.url,
    evidenceIds: [],
    thinkTankCountryId: countryId,
    thinkTankPersonId: person.id,
    thinkTankPerson: person
  };
}

function makeMediaAuthorActor(author, countryId = author?.countryId || "usa") {
  if (!author) return null;

  return {
    name: author.name,
    institution: author.outlet,
    role: author.role,
    stance: author.stanceSignal,
    url: author.profileUrl,
    evidenceIds: [],
    mediaCountryId: countryId,
    mediaAuthorId: author.id,
    mediaAuthor: author
  };
}

function getMediaAuthorProfile(author, countryId = author?.countryId || "usa") {
  const profileCountry = countries.find((item) => item.id === countryId);
  const network = getMediaNetwork(countryId);
  const mentions = network.mentions.filter((mention) => mention.authorIds.includes(author.id));
  const outlets = [...new Set(mentions.map((mention) => mediaOutletsById.get(mention.outletId)?.name).filter(Boolean))];
  const avgScore = mentions.length
    ? Math.round(mentions.reduce((sum, mention) => sum + mention.score, 0) / mentions.length)
    : 0;
  const strongestMention = [...mentions].sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0];

  return {
    kind: "Media / Journalist Profile",
    country: profileCountry?.name ?? "United States",
    currentRole: `${author.role}, ${author.outlet}`,
    summary:
      `${author.name} is tracked as a media actor because their byline or correspondent work appears in the Kurdistan/KRG mention register. Current project reading: ${author.stanceSignal}`,
    tags: [author.outlet, "Media", ...author.beat.slice(0, 5)],
    imageCredit: "Portrait image pending source verification",
    biographyFacts: [
      ["Outlet", author.outlet],
      ["Role", author.role],
      ["Beat", author.beat.join(", ")],
      ["Mention records", `${mentions.length}`],
      ["Average framing score", formatMediaScore(avgScore)],
      ["Source note", author.sourceNote]
    ],
    officialProfiles: [["Official / starting profile source", author.profileUrl]],
    social: [],
    resumeTimeline: sortResumeTimelineItems([
      {
        year: "Profile",
        title: `${author.outlet} profile`,
        summary: `${author.role}. Beat: ${author.beat.join(", ")}.`,
        url: author.profileUrl
      }
    ]),
    writingsAndStatements: mentions.length > 0
      ? mentions.map((mention) => [
          mention.title,
          mediaOutletsById.get(mention.outletId)?.shortName ?? author.outlet,
          mention.date,
          mention.url
        ])
      : [["Archive intake needed", author.outlet, "Pending", author.profileUrl]],
    statementsOnKurdistan: mentions.length > 0
      ? mentions.map((mention) => ({
          date: mention.date,
          stance: `${mention.framing} (${formatMediaScore(mention.score)})`,
          title: mention.title,
          summary: mention.summary,
          url: mention.url
        }))
      : [
          {
            date: "Pending",
            stance: "Unscored",
            title: "No article-level Kurdistan mention attached yet",
            summary: "This author exists as a profile shell until mention records are ingested and scored.",
            url: author.profileUrl
          }
        ],
    relationshipToKurdistan:
      mentions.length > 0
        ? `${author.name}'s current Kurdistan relevance comes from ${mentions.length} tracked mention record(s) across ${outlets.join(", ")}. The strongest framing signal is: ${strongestMention?.title ?? "not available"}.`
        : "No scored article-level relationship yet. Add article records before making a media-framing judgment.",
    monitoringTasks: [
      "Add every Kurdistan/KRG article, video, transcript, newsletter, podcast, and photo essay by this author",
      "Separate direct KRG coverage from broader Kurdish coverage in Syria, Turkey, and Iran",
      "Classify each mention as favorable, critical, mixed, or unscored with source notes",
      "Track whether the author relies on KRG officials, Baghdad officials, U.S. officials, Kurdish opposition groups, Turkish sources, Iranian sources, or local civilians"
    ]
  };
}

function getThinkTankPersonProfile(person, countryId = person?.countryId || "usa") {
  const profileCountry = countries.find((item) => item.id === countryId);
  const tank = getThinkTankForPerson(person, countryId);
  const sources = tank?.sources ?? [["Think tank profile", person.url]];
  const kurdistanSource = sources.find(([label]) => /kurd|krg|peshmerga/i.test(label)) ?? sources.find(([label]) => /iraq|baghdad/i.test(label)) ?? sources[0];
  const expertiseTags = person.expertise.slice(0, 5);

  return {
    kind: "Think Tank Policy Actor",
    country: profileCountry?.name ?? "United States",
    currentRole: `${person.role}, ${person.organization}`,
    summary:
      `${person.name} is tracked in this project as a policy-network actor at ${person.organization}. The profile separates government proximity from issue expertise: ${person.adminConnection}`,
    tags: [person.organization, tank?.shortName ?? "Think tank", ...expertiseTags],
    imageCredit: "Portrait image pending source verification",
    biographyFacts: [
      ["Institution", person.organization],
      ["Role", person.role],
      ["Administration proximity", person.adminConnection],
      ["Policy signal", person.policySignal],
      ["Think tank score", tank ? `${tank.proximityScore}/100 (${tank.proximityLabel})` : "Not scored"],
      ["Issue specificity", tank?.specificity ?? "Needs analyst review"]
    ],
    officialProfiles: [
      ["Official biography source", person.url],
      ...(tank ? [[`${tank.shortName} institution source`, tank.sources[0][1]]] : [])
    ],
    social: [],
    resumeTimeline: sortResumeTimelineItems([
      {
        year: "Profile",
        title: person.role,
        summary: `${person.organization}. ${person.adminConnection}`,
        url: person.url
      }
    ]),
    writingsAndStatements: [
      ["Official biography source", person.organization, "Current", person.url],
      ...sources.slice(0, 6).map(([label, url]) => {
        const sourcePerson = findThinkTankPersonForSource(label, url, countryId);

        if (sourcePerson) {
          return [
            `${sourcePerson.name} profile`,
            "Internal",
            "Profile",
            profileHref({ id: countryId }, makeThinkTankPersonActor(sourcePerson, countryId))
          ];
        }

        return [label, tank?.shortName ?? person.organization, "Source", url];
      })
    ],
    statementsOnKurdistan: [
      {
        date: "Current source file",
        stance: tank?.specificity ?? "Unscored",
        title: `${person.organization} Kurdistan / Iraq relevance`,
        summary:
          tank
            ? `${person.policySignal} Organization-level Kurdistan reading: ${tank.kurdistanPolicy}`
            : `${person.policySignal} Add organization-level Kurdistan sources before assigning a stronger stance.`,
        url: kurdistanSource?.[1] ?? person.url
      }
    ],
    relationshipToKurdistan:
      tank
        ? `${person.name}'s Kurdistan relevance should be read through ${person.organization}'s policy record and the person's own expertise. Current organization-level assessment: ${tank.kurdistanPolicy}`
        : "This person has not yet been connected to a think tank policy record. Add source links before briefing use.",
    monitoringTasks: [
      "Attach direct KRG/Kurdistan statements, testimony, podcasts, op-eds, and event transcripts",
      "Record any current-administration appointment, advisory role, campaign role, or formal meeting only when sourced",
      "Add social media accounts and official publication feeds",
      "Separate support for KRG autonomy, Iraqi federalism, Kurdish groups in Syria, and Kurdish opposition movements in Iran/Turkey"
    ]
  };
}

function getThinkTankForPerson(person, countryId = person?.countryId || "usa") {
  return getThinkTankNetwork(countryId).tanks.find((tank) => tank.people.includes(person.id) || tank.name === person.organization);
}

function makeCongressActor(member) {
  if (!member) return null;

  return {
    name: member.name,
    institution: `U.S. ${member.chamber}`,
    role: member.role,
    stance: `${member.party} / ${member.districtLabel}`,
    url: member.officialUrl || member.sourceLinks[0]?.[1] || "#",
    evidenceIds: [],
    imageUrl: getCongressImageUrl(member.id),
    congressId: member.id,
    congressMember: member
  };
}

function getCongressOfficialArchiveLinks(member) {
  const congressSlug = slugify(member.name);
  const links = [
    ["TOR Phi Congress records", `/country/usa/congress/${congressSlug}/records`],
    ["Congress.gov API member detail", `https://api.congress.gov/v3/member/${member.id}?format=json`],
    ["Congress.gov API sponsored legislation", `https://api.congress.gov/v3/member/${member.id}/sponsored-legislation?format=json`],
    ["Congress.gov API cosponsored legislation", `https://api.congress.gov/v3/member/${member.id}/cosponsored-legislation?format=json`],
    ["Congress.gov public member page", `https://www.congress.gov/member/${congressSlug}/${member.id}`],
    ["Bioguide official biography", `https://bioguide.congress.gov/search/bio/${member.id}`]
  ];

  if (member.chamber === "House") {
    links.push(
      ["House Clerk member profile", `https://clerk.house.gov/members/${member.id}`],
      ["House Clerk recent votes", `https://clerk.house.gov/Members/ViewRecentVotes?memberID=${member.id}&page=1`],
      ["House Clerk roll call votes", "https://clerk.house.gov/Votes"],
      ["House committee repository", "https://docs.house.gov/committee"],
      ["House public disclosures", "https://disclosures-clerk.house.gov/"]
    );
  } else {
    links.push(
      ["Senate current senators", "https://www.senate.gov/senators/senators-contact.htm"],
      ["Senate committee assignments", "https://www.senate.gov/general/committee_assignments/assignments.htm"],
      ["Senate roll call votes", "https://www.senate.gov/legislative/votes_new.htm"],
      ["Senate XML/HTML source catalog", "https://www.senate.gov/general/common/generic/XML_Availability.htm"]
    );
  }

  return links;
}

function getCongressProfile(member) {
  const socialLinks = [
    member.contact.rssUrl ? ["Official press release RSS", member.contact.rssUrl] : null,
    member.contact.contactForm ? ["Contact form", member.contact.contactForm] : null
  ].filter(Boolean);
  const committees = member.committees ?? [];
  const topCommittees = committees.slice(0, 6);
  const relevance = member.foreignPolicyRelevance ?? { level: "Unreviewed", reason: "Committee relevance has not been generated yet.", topCommittees: [], leadership: [] };
  const researchProfile = member.kurdistanResearchProfile ?? { focusAreas: [], watchTerms: [], priority: "Unreviewed" };
  const leadership = member.leadership;
  const committeeLinks = member.committeeSourceLinks ?? [];
  const leadershipLinks = leadership ? [[leadership.title, leadership.source]] : [];
  const officialArchiveLinks = getCongressOfficialArchiveLinks(member);
  const topCommitteeText = relevance.topCommittees?.length
    ? relevance.topCommittees.slice(0, 4).join("; ")
    : "No high-relevance committee assignment identified in structured data";
  const focusText = researchProfile.focusAreas?.length
    ? researchProfile.focusAreas.join(", ")
    : "public statements, votes, letters, caucus membership, and district relevance";
  const watchText = researchProfile.watchTerms?.length
    ? researchProfile.watchTerms.slice(0, 12).join(", ")
    : "Kurdistan, Kurdish, KRG, Iraq, Peshmerga, Yazidi, Erbil";

  return {
    kind: "Member of Congress",
    country: "United States",
    currentRole: member.role,
    imageUrl: getCongressImageUrl(member.id),
    imageCredit: "United States Congress image collection / initials fallback",
    summary:
      `${member.name} is a ${member.party} member of the U.S. ${member.chamber} representing ${member.districtLabel}. TOR Phi now classifies this member as a ${relevance.level.toLowerCase()} Kurdistan research priority based on leadership role, committee assignments, and official source availability. The local archive links Congress.gov records with chamber sources so future Kurdistan conclusions can be traced back to member records, votes, bills, committees, and official biographies.`,
    tags: [
      member.chamber,
      member.party,
      member.state,
      member.districtLabel,
      "Congress",
      `${relevance.level} research priority`,
      ...(researchProfile.focusAreas?.slice(0, 3) ?? [])
    ],
    biographyFacts: [
      ["Chamber", member.chamber],
      ["Party", member.party],
      ["State", member.state],
      ["District / seat", member.districtLabel],
      ["First term in dataset", member.firstTermStart || "Not listed in source"],
      ["Current term", `${member.currentTerm.start} to ${member.currentTerm.end}`],
      ["Leadership role", leadership ? `${leadership.title} / ${leadership.note}` : "No chamber leadership role attached in current overlay"],
      ["Kurdistan research priority", `${relevance.level} / ${relevance.reason}`],
      ["Research focus", focusText],
      ["Watch terms", watchText],
      ["Top committee signals", topCommitteeText],
      ["Committee leadership", relevance.leadership?.length ? relevance.leadership.join("; ") : "No committee chair/ranking leadership listed in structured data"],
      ["Official archive status", member.chamber === "House" ? "Local archive includes Congress.gov detail, sponsored/cosponsored legislation, House Clerk profile hooks, and latest House Clerk vote rows." : "Local archive includes Congress.gov detail, sponsored/cosponsored legislation, and a Senate official source registry for committee, vote, floor, nomination, and XML/HTML feeds."],
      ["Primary source chain", member.chamber === "House" ? "Congress.gov API -> House Clerk profile/votes -> Bioguide -> official member website." : "Congress.gov API -> Senate source catalog/assignments/votes -> Bioguide -> official senator website."],
      ["Bioguide ID", member.id],
      ["Office phone", member.contact.phone || "Not listed in source"],
      ["Office address", member.contact.address || "Not listed in source"]
    ],
    officialProfiles: dedupeLinkList([...officialArchiveLinks, ...member.sourceLinks, ...leadershipLinks, ...committeeLinks]),
    social: socialLinks,
    resumeTimeline: sortResumeTimelineItems([
      {
        year: extractYear(member.firstTermStart || member.currentTerm.start),
        title: "First congressional term in current dataset",
        summary: `${member.party} / ${member.districtLabel}`,
        url: member.sourceLinks[1]?.[1] ?? member.officialUrl
      },
      {
        year: extractYear(member.currentTerm.start),
        title: `Current ${member.chamber} term begins`,
        summary: `${member.party} / ${member.districtLabel}`,
        url: member.sourceLinks[1]?.[1] ?? member.officialUrl
      },
      leadership ? {
        year: "Now",
        title: leadership.title,
        summary: leadership.note,
        url: leadership.source
      } : null,
      ...topCommittees.slice(0, 4).map((committee) => ({
        year: "Now",
        title: committee.title ? `${committee.title} / ${committee.name}` : committee.name,
        summary: `${committee.type} / ${committee.partyRole || "member"}`,
        url: committee.url
      }))
    ].filter(Boolean)),
    writingsAndStatements: [],
    statementsOnKurdistan: member.statementsOnKurdistan,
    relationshipToKurdistan:
      `Unreviewed congressional actor with ${relevance.level.toLowerCase()} research priority. Committee and leadership data can tell us where to look, but this member should not be assigned a supportive, neutral, or hostile Kurdistan stance until TOR Phi attaches sourced evidence such as public statements, votes, letters, hearings, caucus membership, delegation visits, district/diaspora evidence, or committee actions.`,
    monitoringTasks: member.monitoringTasks
  };
}

createRoot(document.getElementById("root")).render(<App />);
