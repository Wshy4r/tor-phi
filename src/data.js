import { hakanFidanThesisText } from "./hakanFidanThesisText.js";
import { extraCountries } from "./extraCountries.js";

export const questions = [
  "Prepare an evidence-backed diplomatic briefing",
  "Show the people behind the assessment",
  "Explain why the stance score is this number",
  "What should be verified before a meeting?"
];

const localKalinPdf = (filename) => `/source/kalin/${encodeURIComponent(filename)}`;
const fidanThesisPdf = "/source/fidan/fidan-intelligence-foreign-policy-1999.pdf";

function extractTimelineYear(value) {
  return `${value ?? ""}`.match(/\b(19|20)\d{2}\b/)?.[0] ?? "";
}

function sortProfileTimeline(items) {
  return [...items].sort((a, b) => {
    const aYear = Number(extractTimelineYear(a.year)) || new Date().getFullYear();
    const bYear = Number(extractTimelineYear(b.year)) || new Date().getFullYear();
    if (aYear !== bYear) return aYear - bYear;
    return `${a.title || a.label || ""}`.localeCompare(`${b.title || b.label || ""}`);
  });
}

const kalinLocalWritings = [
  {
    id: "kalin-islam-ve-bati",
    title: "İslam ve Batı",
    type: "Book",
    publisher: "İSAM Yayınları",
    date: "2007",
    pages: 186,
    wordCount: 43471,
    filename: "[KorPiracy - KorPiracy] İslam ve Batı{İbrahim Kalın}(İsam Yayınları){111935052} libgen.li.pdf",
    note: "Core Islam-West relations text. Use it to understand Kalın's civilizational vocabulary and his reading of Western perceptions of Islam; do not treat it as a direct KRG stance."
  },
  {
    id: "kalin-ask-nefret-bati-algisi",
    title: "Aşk ile Nefret Arasında: Türkiye'de Toplumun Batı Algısı",
    type: "Co-authored research book",
    publisher: "SETA Yayınları",
    date: "2008",
    pages: 128,
    wordCount: 37651,
    filename: "Aşk ile Nefret Arasında Türkiye'de Toplumun Batı Algısı -- Bekir Berat Özipek, İbrahim Kalın, Kudret Bülbül -- Ankara, Turkey, 2008 -- SETA Yayınları -- isbn13 9786050057003 -- 66e46ba9a542a75dd321b073fd7484bd -- Anna’s Archive.pdf",
    note: "Useful for public-diplomacy analysis because it studies Turkish social perceptions of the West through interviews and political-cultural interpretation."
  },
  {
    id: "kalin-muslim-500-2009",
    title: "The 500 Most Influential Muslims",
    type: "Co-edited reference work",
    publisher: "Royal Islamic Strategic Studies Centre",
    date: "2009",
    pages: 202,
    wordCount: 62844,
    filename: "The 500 Most Influential Muslims -- Prof John Esposito and Prof Ibrahim Kalin -- 2009 -- 4322e6789a7d899cbbac75eb043cddd9 -- Anna’s Archive.pdf",
    note: "Reference-network source. It helps map Kalın's location in transnational Muslim intellectual and institutional networks."
  },
  {
    id: "kalin-knowledge-later-islamic-philosophy",
    title: "Knowledge in Later Islamic Philosophy: Mulla Sadra on Existence, Intellect and Intuition",
    type: "Academic monograph",
    publisher: "Oxford University Press",
    date: "2010",
    pages: 338,
    wordCount: 124046,
    filename: "Knowledge in later Islamic philosophy _ Mullā Ṣadrā on -- Kalin, Ibrahim -- 1, PS, 2010 -- IRL Press at Oxford University Press -- isbn13 9780190453657 -- 9dc8796e7e806d6e9f3335e96c2d0fcf -- Anna’s Archive.pdf",
    note: "Major scholarly work from Kalın's academic career. Important for his epistemology, anti-subjectivist knowledge theory, and Mulla Sadra influence."
  },
  {
    id: "kalin-reason-rationality-quran",
    title: "Reason and Rationality in the Qur'an",
    type: "Monograph",
    publisher: "Royal Aal Al-Bayt Institute for Islamic Thought",
    date: "2012",
    pages: 238,
    wordCount: 90592,
    filename: "Ibrahim Kalin - Reason and Rationality in the Quran (Royal Aal Al-Bayt Institute, Jordan, 2012).pdf",
    note: "Worldview source on reason, rationality, metaphysics, moral order, and Qur'anic philosophical language. Use as intellectual-background evidence, not as a Kurdistan stance."
  },
  {
    id: "kalin-akil-ve-erdem",
    title: "Akıl ve Erdem: Türkiye'nin Toplumsal Muhayyilesi",
    type: "Book",
    publisher: "Küre Yayınları",
    date: "2013",
    pages: 87,
    wordCount: 30229,
    filename: "[KorPiracy - KorPiracy] Akıl ve Erdem Türkiye&_039_nin Toplumsal Muhayyilesi{İbrahim Kalın}(Küre Yayınları){111935106} libgen.li.pdf",
    note: "Connects reason, virtue, and social imagination in Türkiye. Useful for reading Kalın as a public intellectual inside later state-security roles."
  },
  {
    id: "kalin-war-and-peace-islam",
    title: "War and Peace in Islam: The Uses and Abuses of Jihad",
    type: "Co-edited volume",
    publisher: "MABDA / Royal Aal Al-Bayt Institute",
    date: "2013",
    pages: 552,
    wordCount: 193791,
    filename: "War and Peace in Islam_ The Uses and Abuses of Jihad -- ed_ HRH Prince Ghazin bin Muhammad, Professor Ibrahim Kalin, -- 2013 -- MABDA (The Royal -- 45bfb994a429c4ba161982994fa1ad81 -- Anna’s Archive.pdf",
    note: "High-value security-intellectual source. Relevant to how religious vocabulary, war, peace, and jihad are framed in scholarly/public diplomacy contexts."
  },
  {
    id: "kalin-oxford-encyclopedia",
    title: "The Oxford Encyclopedia of Philosophy, Science, and Technology in Islam",
    type: "Edited encyclopedia",
    publisher: "Oxford University Press",
    date: "2014",
    pages: 568,
    wordCount: 324397,
    filename: "The Oxford Encyclopedia of Philosophy, Science, and -- İbrahim Kalın -- Oxford Encyclopedias of Islamic Studies, 2014 -- Oxford University Press, USA -- isbn13 9780199358434 -- c0c6fc08f33d64fb67021902259f6d54 -- Anna’s Archive.pdf",
    note: "Large editorial project. Shows Kalın's authority in Islamic philosophy, science, technology, and knowledge-history debates."
  },
  {
    id: "kalin-metaphysical-penetrations",
    title: "The Book of Metaphysical Penetrations: A Parallel English-Arabic Text of Kitab al-Masha'ir",
    type: "Edited / translated philosophical text",
    publisher: "Brigham Young University Press",
    date: "2014",
    pages: 240,
    wordCount: 53105,
    filename: "Metaphysical Penetrations_ A Parallel English-Arabic Text -- Mulla Sadra, Ibrahim Kalin, Seyyed Hossein Nasr -- Brigham Young University - Islamic -- isbn13 9780842528399 -- 1e35fb555be0bd772024e2594a46dbba -- Anna’s Archive.pdf",
    note: "Mulla Sadra source edited with Seyyed Hossein Nasr. Useful for mapping Kalın's philosophical lineage and metaphysical vocabulary."
  },
  {
    id: "kalin-enine-boyuna-turkiye",
    title: "Enine Boyuna Türkiye",
    type: "Book / interview or essays collection",
    publisher: "SETA Yayınları",
    date: "2017",
    pages: 677,
    wordCount: 186513,
    filename: "[KorPiracy - KorPiracy] Enine Boyuna Türkiye{İbrahim Kalın}(Seta Yayınları){111935226} libgen.li.pdf",
    note: "Long Türkiye-focused political and social text. Use for public-policy language, domestic political framing, and state-society interpretation."
  },
  {
    id: "kalin-oze-yolculuk",
    title: "Öze Yolculuk",
    type: "Book",
    publisher: "İnsan Yayınları",
    date: "2023",
    pages: 287,
    wordCount: 63043,
    filename: "[KorPiracy - KorPiracy] Öze Yolculuk{İbrahim Kalın}(İnsan Yayınları){111925999} libgen.li.pdf",
    note: "Later intellectual/spiritual work. Useful for profile depth and worldview mapping during the period immediately before/around his MIT leadership."
  }
].map((document) => ({
  ...document,
  url: localKalinPdf(document.filename),
  status: "Local Source folder PDF / bibliography matched with KÜRE Encyclopedia where listed"
}));

export const actorProfiles = {
  "Donald J. Trump": {
    kind: "Person",
    country: "United States",
    currentRole: "President of the United States",
    summary:
      "Executive authority over U.S. national security, Iraq policy, regional military posture, sanctions, energy diplomacy, and the final political tone of U.S. engagement with Erbil and Baghdad. For Kurdistan analysis, Trump is not only a biography entry: he is the decision filter behind every State, Defense, energy, and envoy signal after January 20, 2025.",
    tags: ["executive authority", "national security", "energy diplomacy", "Iraq policy", "final decision filter"],
    biographyFacts: [
      ["Office", "45th and 47th President of the United States"],
      ["Current term", "Second Trump administration, inaugurated January 20, 2025"],
      ["Institution", "White House"],
      ["Core authority", "Final authority over U.S. recognition policy, military posture, sanctions policy, ambassadorial appointments, and public presidential messaging"],
      ["Kurdistan relevance", "Sets the administration frame for Iraq, counterterrorism, energy, Iran pressure, Turkiye relations, Syria policy, and U.S. treatment of Kurdish partners"],
      ["First-administration precedent", "White House biography highlights the destruction of the ISIS caliphate and Middle East peace diplomacy as part of his earlier record"],
      ["Evidence caution", "This profile should separate direct presidential statements from actions taken by Rubio, Barrack, Defense, Energy, or embassy channels"]
    ],
    officialProfiles: [
      ["White House biography", "https://www.whitehouse.gov/administration/donald-j-trump/"],
      ["White House administration", "https://www.whitehouse.gov/administration/"],
      ["White House presidential actions", "https://www.whitehouse.gov/presidential-actions/"],
      ["White House national security priority page", "https://www.whitehouse.gov/issues/"]
    ],
    social: [
      ["Truth Social", "https://truthsocial.com/@realDonaldTrump"],
      ["X", "https://x.com/realDonaldTrump"],
      ["White House X", "https://x.com/WhiteHouse"]
    ],
    resumeTimeline: sortProfileTimeline([
      {
        year: 2017,
        label: "First term",
        detail: "First Trump administration begins."
      },
      {
        year: 2019,
        label: "ISIS precedent",
        detail: "White House biography presents the first administration as having destroyed the ISIS caliphate, making counterterrorism a central lens for Kurdish files."
      },
      {
        year: 2024,
        label: "Election return",
        detail: "Wins the 2024 election and prepares a second administration with a more transactional foreign-policy style."
      },
      {
        year: 2025,
        label: "47th President",
        detail: "Inaugurated on January 20, 2025; Rubio, Landau, Barrack, and Middle East envoys operate under his authority."
      }
    ]),
    writingsAndStatements: [
      ["White House biography and administration record", "White House", "2025-present", "https://www.whitehouse.gov/administration/donald-j-trump/"],
      ["Presidential actions archive", "White House", "2025-present", "https://www.whitehouse.gov/presidential-actions/"],
      ["White House briefings and statements", "White House", "2025-present", "https://www.whitehouse.gov/briefings-statements/"],
      ["White House gallery and public events", "White House", "2026", "https://www.whitehouse.gov/gallery/"]
    ],
    statementsOnKurdistan: [
      {
        date: "2025-01-20",
        stance: "Indirect executive authority",
        title: "Second Trump administration begins",
        summary: "This confirms the decision-maker behind post-2025 U.S. policy signals. It does not, by itself, prove a personal Kurdistan stance.",
        url: "https://www.whitehouse.gov/administration/donald-j-trump/",
        evidenceId: "usa-trump-admin"
      },
      {
        date: "2025-05-23",
        stance: "Administration channel, not direct quote",
        title: "Rubio-KRG meeting happened under Trump's State Department",
        summary: "Secretary Rubio's KRG readout is a strong administration signal. It should be attributed to Rubio/State unless a direct presidential statement is attached.",
        url: "https://www.state.gov/secretary-rubios-meeting-with-iraqi-kurdistan-regional-government-prime-minister-barzani",
        evidenceId: "usa-rubio-krg"
      },
      {
        date: "2026-07-10",
        stance: "Needs direct presidential evidence",
        title: "No direct Trump Kurdistan statement is attached yet",
        summary: "The correct analytic treatment is high authority but low direct quote confidence. Add White House remarks, calls, or public posts before rating a personal stance.",
        url: "https://www.whitehouse.gov/"
      }
    ],
    relationshipToKurdistan:
      "High authority, lower direct personal evidence. Trump should be treated as the top-level policy owner whose administration can be supportive of KRG security, energy, and investment while still constraining policy through federal Iraq, Turkiye relations, and regional deal-making. The profile must not invent personal warmth; it should show whether evidence comes from Trump himself, Rubio, Defense, Energy, Barrack, Congress, or KRG readouts.",
    monitoringTasks: [
      "Track direct White House references to Kurdistan, KRG, Erbil, Peshmerga, Iraq oil, Iran attacks, and Syria Kurds",
      "Separate presidential quotes from State Department implementation",
      "Attach any calls or meetings with Masrour Barzani, Nechirvan Barzani, Masoud Barzani, or Iraqi federal leaders",
      "Watch whether U.S. energy deals with KRG are defended by White House, State, Energy, or only spokesperson channels",
      "Mark confidence lower when the evidence is administration-level rather than a direct Trump statement"
    ]
  },
  "JD Vance": {
    kind: "Person",
    country: "United States",
    currentRole: "Vice President of the United States",
    summary:
      "Vice President, first Marine Corps veteran to hold the office, former Ohio senator, author, and close Trump administration voice with post-2025 Kurdistan-facing remarks. Vance matters because he can signal White House sentiment toward Kurds, influence nationalist-populist foreign policy, and shape successor politics even when formal Kurdistan policy is carried by Rubio, Defense, CENTCOM, or envoys. His profile should separate four layers: personal Iraq experience, public warmth toward Kurdish people, formal administration policy, and concrete commitments to the Kurdistan Region inside federal Iraq.",
    tags: ["vice president", "White House", "Iraq veteran", "direct Kurdistan remarks", "national conservatism", "political signal", "post-2025 evidence"],
    biographyFacts: [
      ["Office", "Vice President of the United States"],
      ["Order", "50th Vice President"],
      ["Term start", "January 20, 2025"],
      ["Institution", "White House"],
      ["Born", "August 2, 1984, Middletown, Ohio"],
      ["Previous role", "U.S. Senator from Ohio, 2023-2025"],
      ["Congress identifier", "Biographical Directory ID V000137"],
      ["Military background", "Served four years in the U.S. Marine Corps with a tour in Iraq"],
      ["Education", "Ohio State University; Yale Law School"],
      ["Books and major texts", "Hillbilly Elegy; Communion; foreword to Dawn's Early Light; 2016 Atlantic essay Opioid of the Masses"],
      ["Religious/intellectual signal", "HarperCollins describes Communion as an account of his return to Christianity and conversion to Catholicism"],
      ["Kurdistan relevance", "Direct public remarks to Kurdish media can reveal White House sentiment and messaging toward Kurdish people"],
      ["Policy relevance", "A nationalist-populist voice that may favor restraint abroad while still valuing partners who reduce U.S. burden and support counterterrorism"],
      ["Evidence caution", "Warm language is not the same as binding policy; connect it to State, Defense, budget, military posture, energy policy, and envoy actions"]
    ],
    officialProfiles: [
      ["White House biography", "https://www.whitehouse.gov/administration/jd-vance/"],
      ["Congressional Biographical Directory", "https://bioguide.congress.gov/search/bio/V000137"],
      ["White House administration", "https://www.whitehouse.gov/administration/"],
      ["White House remarks and releases", "https://www.whitehouse.gov/briefings-statements/"],
      ["HarperCollins author page for Communion", "https://www.harpercollins.com/products/communion-j-d-vance"],
      ["The Atlantic: Opioid of the Masses", "https://www.theatlantic.com/politics/archive/2016/07/opioid-of-the-masses/489911/"]
    ],
    social: [
      ["Vice President X", "https://x.com/VP"],
      ["JD Vance X", "https://x.com/JDVance"],
      ["Vice President Instagram", "https://www.instagram.com/vp/"],
      ["White House X", "https://x.com/WhiteHouse"]
    ],
    resumeTimeline: [
      {
        year: 2003,
        title: "Marine Corps enlistment",
        summary: "After Middletown High School, Vance enlisted in the U.S. Marine Corps; White House biography says he served four years with a tour in Iraq."
      },
      {
        year: 2009,
        title: "Ohio State and Yale path",
        summary: "Used the GI Bill after Iraq service, graduated from Ohio State, and continued to Yale Law School."
      },
      {
        year: 2016,
        title: "Hillbilly Elegy and Atlantic essay",
        summary: "Hillbilly Elegy makes him a national voice on working-class politics; his Atlantic essay criticized Trump's appeal as an easy escape from social pain."
      },
      {
        year: 2022,
        title: "Elected U.S. Senator",
        summary: "Elected from Ohio; Bioguide identifies him as a senator before becoming vice president."
      },
      {
        year: 2024,
        title: "National-conservative network",
        summary: "Writes the foreword to Dawn's Early Light, a Heritage-linked book published by Broadside Books."
      },
      {
        year: 2025,
        title: "Vice President",
        summary: "Takes office as Vice President under President Trump on January 20, 2025."
      },
      {
        year: 2026,
        title: "Communion",
        summary: "HarperCollins publishes Communion, framing Vance's return to faith and Catholic conversion as part of his public worldview."
      }
    ],
    writingsAndStatements: [
      ["White House biography", "White House", "2025-present", "https://www.whitehouse.gov/administration/jd-vance/"],
      ["Congressional Biographical Directory entry", "U.S. Congress", "Current", "https://bioguide.congress.gov/search/bio/V000137"],
      ["Hillbilly Elegy", "HarperCollins", "2016", "https://www.harpercollins.com/products/hillbilly-elegy-j-d-vance"],
      ["Opioid of the Masses", "The Atlantic", "2016-07-04", "https://www.theatlantic.com/politics/archive/2016/07/opioid-of-the-masses/489911/"],
      ["Dawn's Early Light foreword", "Broadside Books / HarperCollins", "2024-11-12", "https://www.harpercollins.com/products/dawns-early-light-kevin-roberts"],
      ["Communion: Finding My Way Back to Faith", "HarperCollins", "2026-06-16", "https://www.harpercollins.com/products/communion-j-d-vance"],
      ["JD Vance to Kurdistan24: President Trump 'Loves the Kurds'", "Kurdistan24", "2026-02-26", "https://www.kurdistan24.net/en/story/896431/jd-vance-to-kurdistan24-president-trump-loves-the-kurds-reaffirms-strong-us-ties"],
      ["We Certainly Love the People of Kurdistan: JD Vance", "Kurdistan Chronicle", "2026-05-20", "https://kurdistanchronicle.com/babat/4674"]
    ],
    statementsOnKurdistan: [
      {
        date: "2026-02-25",
        stance: "Supportive public sentiment",
        title: "Kurdistan24 records Vance saying the administration has great contacts and friendships with Kurds",
        summary: "This is a direct political warmth signal from the Vice President. The strongest analytic reading is sentiment plus stability language, not a formal guarantee.",
        url: "https://www.kurdistan24.net/en/story/896431/jd-vance-to-kurdistan24-president-trump-loves-the-kurds-reaffirms-strong-us-ties",
        evidenceId: "usa-vance-k24"
      },
      {
        date: "2026-05-20",
        stance: "Supportive sentiment plus security concern",
        title: "Kurdistan Chronicle reports Vance said the U.S. loves the people of Kurdistan and condemned attacks",
        summary: "Useful for tone and crisis messaging, especially after drone attacks. Treat as media-reported remarks until an official transcript or full video is attached.",
        url: "https://kurdistanchronicle.com/babat/4674",
        evidenceId: "usa-vance-kurdistan-chronicle"
      },
      {
        date: "2026-07-10",
        stance: "Needs policy linkage",
        title: "No Vance-specific KRG policy decision is attached yet",
        summary: "The profile is rich enough to analyze worldview and sentiment, but the system should still require State, Defense, budget, or White House action before scoring a binding policy commitment.",
        url: "https://www.whitehouse.gov/briefings-statements/"
      }
    ],
    relationshipToKurdistan:
      "Politically warm, personally Iraq-experienced, and potentially influential in successor politics, but still needs policy linkage. Vance's public language is favorable toward Kurdish people and frames the desired outcome as peace, harmony, prosperity, and stability. The practical question is whether that sentiment converts into support for Peshmerga funding, Erbil security, oil/export diplomacy, KRG-Baghdad dispute resolution, and protection from militia attacks.",
    monitoringTasks: [
      "Find official White House transcript or pool report for the Kurdistan24 exchange",
      "Attach full video/audio of the February 25, 2026 Kurdistan24 exchange",
      "Track Vance references to Kurds, Kurdistan, Iraq, Iran attacks, oil exports, and Peshmerga",
      "Compare Vance's restraint-oriented worldview with support for local partners who reduce U.S. military burden",
      "Separate public sentiment from formal U.S. commitments",
      "Compare Vance language with Rubio and Trump language",
      "Track whether Vance appears in meetings with KRG leaders, Iraqi leaders, CENTCOM, Defense, or energy-company delegations",
      "Monitor 2028 succession positioning because it may affect long-term KRG access strategy"
    ]
  },
  "Marco Rubio": {
    kind: "Person",
    country: "United States",
    currentRole: "Secretary of State",
    summary:
      "Top U.S. diplomat and the strongest named post-2025 U.S. actor in the Kurdistan file. Rubio has direct KRG contact, State Department language on Kurdish autonomy, commercial-energy support, and later 2026 call evidence with KRG Prime Minister Masrour Barzani. His profile should carry high weight because it links personal office, policy language, and direct diplomatic access.",
    tags: ["foreign policy", "State Department", "direct KRG contact", "autonomy language", "energy diplomacy", "post-2025 evidence"],
    biographyFacts: [
      ["Office", "72nd Secretary of State"],
      ["Sworn in", "January 21, 2025"],
      ["Previous role", "U.S. Senator from Florida"],
      ["Current policy weight", "Primary Cabinet-level owner of diplomacy with Iraq, Turkiye, Syria, Iran, and the KRG file"],
      ["Kurdistan relevance", "Directly linked to KRG Prime Minister Masrour Barzani in official State Department readouts and briefing language"],
      ["Notable 2025 marker", "State briefing language tied Rubio to support for Kurdish autonomy and U.S. companies doing business in the Kurdistan Region"],
      ["Notable 2026 marker", "State archive lists a March 26, 2026 readout for Secretary Rubio's call with KRG Prime Minister Barzani"],
      ["Analytic weight", "High: direct contact plus policy language, but still framed inside a sovereign federal Iraq"]
    ],
    officialProfiles: [
      ["State Department biography", "https://www.state.gov/biographies/marco-rubio"],
      ["Secretary Rubio-KRG readout, May 23 2025", "https://www.state.gov/secretary-rubios-meeting-with-iraqi-kurdistan-regional-government-prime-minister-barzani"],
      ["State Department briefings", "https://www.state.gov/briefings/"],
      ["State Iraq archive", "https://www.state.gov/countries-areas-archive/iraq"],
      ["Bureau of Near Eastern Affairs archive", "https://www.state.gov/bureaus-archive/bureau-of-near-eastern-affairs/page/10"]
    ],
    social: [
      ["Secretary X account", "https://x.com/SecRubio"],
      ["Secretary Instagram", "https://www.instagram.com/secrubio/"],
      ["State Department X", "https://x.com/StateDept"]
    ],
    resumeTimeline: [
      {
        year: 2011,
        label: "Senate",
        detail: "Begins service as U.S. Senator from Florida; builds foreign-policy profile before joining the executive branch."
      },
      {
        year: 2025,
        label: "Secretary",
        detail: "Sworn in as the 72nd Secretary of State on January 21, 2025."
      },
    ],
    writingsAndStatements: [
      ["State Department biography and releases", "U.S. Department of State", "2025-present", "https://www.state.gov/biographies/marco-rubio"],
      ["Secretary Rubio's Meeting with Iraqi Kurdistan Regional Government Prime Minister Barzani", "U.S. Department of State", "2025-05-23", "https://www.state.gov/secretary-rubios-meeting-with-iraqi-kurdistan-regional-government-prime-minister-barzani"],
      ["Department Press Briefing, May 22, 2025", "U.S. Department of State", "2025-05-22", "https://www.state.gov/briefings/department-press-briefing-may-22-2025"],
      ["Department Press Briefing, May 29, 2025", "U.S. Department of State", "2025-05-29", "https://www.state.gov/page/3/?%3Bp=92333%2F&post_type=state_briefing"]
    ],
    statementsOnKurdistan: [
      {
        date: "2025-05-22",
        stance: "Positive but within Iraq framework",
        title: "State briefing referenced support for Kurdish autonomy and U.S. companies doing business there",
        summary: "This is a strong source because it names autonomy and economic engagement, but it should be read in the broader U.S. federal-Iraq policy context.",
        url: "https://www.state.gov/briefings/department-press-briefing-may-22-2025",
        evidenceId: "usa-autonomy"
      },
      {
        date: "2025-05-29",
        stance: "Direct access",
        title: "State briefing referenced Rubio meeting KRG Prime Minister Masrour Barzani",
        summary: "This proves high-level access and should be connected to meeting readouts, follow-up actions, and business/security outcomes.",
        url: "https://www.state.gov/page/3/?%3Bp=92333%2F&post_type=state_briefing",
        evidenceId: "usa-rubio-krg"
      },
      {
        date: "2025-05-23",
        stance: "Direct diplomatic meeting",
        title: "Official readout: Rubio met KRG Prime Minister Masrour Barzani in Washington",
        summary: "The official State readout makes Rubio a current, direct KRG interlocutor. This should be weighted higher than generic U.S.-KRG friendship language.",
        url: "https://www.state.gov/secretary-rubios-meeting-with-iraqi-kurdistan-regional-government-prime-minister-barzani",
        evidenceId: "usa-rubio-krg-readout"
      },
      {
        date: "2026-03-26",
        stance: "Direct follow-up channel",
        title: "State archive lists Rubio call with KRG Prime Minister Barzani",
        summary: "This keeps Rubio's profile current beyond 2025 and suggests the KRG channel remained active into 2026. The underlying readout should be attached when the State page is accessible.",
        url: "https://www.state.gov/countries-areas-archive/iraq",
        evidenceId: "usa-rubio-krg-call-2026"
      }
    ],
    relationshipToKurdistan:
      "Strong current diplomatic relevance. Rubio is the clearest named U.S. executive-branch supporter of the KRG file in this prototype because the record includes direct contact, autonomy language, commercial-energy framing, and a 2026 KRG call listing. The constraint remains important: his language still sits inside U.S. support for a sovereign, prosperous, federal Iraq.",
    monitoringTasks: [
      "Track every State readout containing Rubio plus KRG, Barzani, Kurdistan, Erbil, Iraq oil, Peshmerga, or Iran attacks",
      "Attach the full March 26, 2026 Rubio-Barzani call readout when accessible",
      "Compare U.S. wording: autonomy, IKR, Kurdistan Region, federal Iraq, sovereign Iraq, economic lifeline",
      "Add KRG Presidency and KRG Prime Minister readouts beside State readouts to see differences in framing",
      "Watch whether Rubio personally repeats autonomy language or whether it remains spokesperson language"
    ]
  },
  "Christopher Landau": {
    kind: "Person",
    country: "United States",
    currentRole: "Deputy Secretary of State",
    summary:
      "Deputy-level State Department actor with major institutional access but limited Kurdistan-specific evidence in the current file. Landau matters because deputy secretaries can shape implementation, staffing, cables, foreign-assistance reform, embassy posture, and crisis coordination, but the profile must stay lower-confidence until he is tied to a direct Iraq/KRG action.",
    tags: ["State Department", "deputy-level channel", "implementation", "low direct Kurdistan evidence"],
    biographyFacts: [
      ["Office", "23rd Deputy Secretary of State"],
      ["Sworn in", "March 25, 2025"],
      ["Institution", "U.S. Department of State"],
      ["Prior diplomatic role", "U.S. Ambassador to Mexico, 2019-2021"],
      ["Legal background", "Long appellate practice; clerked for Justices Antonin Scalia and Clarence Thomas"],
      ["Languages", "Fluent in Spanish and proficient in French"],
      ["Foreign-service background", "Born in Madrid while his father served in the U.S. Foreign Service"],
      ["Kurdistan relevance", "Potential senior implementation channel for Iraq, embassy, consulate, aid, migration, and crisis files; direct Kurdistan statements still need collection"],
      ["Analytic weight", "Institutionally important but not yet a proven Kurdistan-specific voice"]
    ],
    officialProfiles: [
      ["State Department biography", "https://www.state.gov/biographies/christopher-landau"],
      ["State Department Office of the Historian entry", "https://history.state.gov/departmenthistory/people/landau-christopher"],
      ["AS/COA speaker biography", "https://www.as-coa.org/speakers/christopher-landau"]
    ],
    social: [
      ["Official Deputy Secretary X account", "https://x.com/DeputySecState"],
      ["Personal public X account", "https://x.com/ChrisLandauUSA"],
      ["State Department X", "https://x.com/StateDept"]
    ],
    resumeTimeline: [
      {
        year: 1985,
        label: "Harvard College",
        detail: "Graduates from Harvard College; later earns Harvard Law degree and builds appellate legal profile."
      },
      {
        year: 1990,
        label: "Supreme Court clerkships",
        detail: "Clerks for Justices Clarence Thomas and Antonin Scalia, shaping a legal-institutional network."
      },
      {
        year: 2019,
        label: "Ambassador to Mexico",
        detail: "Serves as U.S. Ambassador to Mexico from 2019 to 2021 in the first Trump administration."
      },
      {
        year: 2025,
        label: "Deputy Secretary",
        detail: "Sworn in as the 23rd Deputy Secretary of State on March 25, 2025."
      }
    ],
    writingsAndStatements: [
      ["State Department biography", "U.S. Department of State", "2025", "https://www.state.gov/biographies/christopher-landau"],
      ["Office of the Historian principal officer entry", "U.S. Department of State", "2025", "https://history.state.gov/departmenthistory/people/landau-christopher"],
      ["Foreign Affairs Day 2025 remarks/biographical note", "U.S. Department of State", "2025", "https://www.state.gov/foreign-affairs-day-2025"],
      ["Global refugee and asylum system remarks", "U.S. Department of State", "2025-09", "https://www.state.gov/releases/office-of-the-spokesperson/2025/09/deputy-secretary-of-state-christopher-landau-at-the-panel-global-refugee-asylum-system-what-went-wrong-and-how-to-fix-it"]
    ],
    statementsOnKurdistan: [
      {
        date: "2025-03-25",
        stance: "Institutional access",
        title: "Landau sworn in as Deputy Secretary of State",
        summary: "This makes him an important State Department implementation actor, but does not prove a Kurdistan position.",
        url: "https://www.state.gov/biographies/christopher-landau",
        evidenceId: "usa-landau-bio"
      },
      {
        date: "2026-07-10",
        stance: "Not enough direct evidence",
        title: "No direct KRG/Kurdistan statement is attached yet",
        summary: "Profile should remain low-confidence until a direct statement, meeting, travel record, cable-relevant release, or readout is added. The richness here should show the gap clearly, not hide it.",
        url: "https://www.state.gov/countries-areas-archive/iraq"
      }
    ],
    relationshipToKurdistan:
      "Institutionally relevant, but not yet a proven Kurdistan-specific actor. Treat him as a possible implementation gatekeeper rather than a known KRG advocate. If he appears in consulate, aid, Iraq, Iran-crisis, migration, or security readouts, the score can change quickly.",
    monitoringTasks: [
      "Search State releases for Landau plus Iraq, KRG, Kurdistan, Erbil, Baghdad, Iran, Peshmerga, and consulate",
      "Track Deputy Secretary travel and calls, especially with Iraqi or Turkish officials",
      "Check whether Landau appears in embassy/consulate opening, staffing, or security assistance records",
      "Add direct quotes before scoring a personal stance",
      "Keep separate his general foreign-policy views from evidence about Kurdistan"
    ]
  },
  "Thomas Barrack": {
    kind: "Person",
    country: "United States",
    currentRole: "U.S. Ambassador to Turkiye and Special Envoy for Syria",
    summary:
      "A high-risk, high-relevance regional dealmaker because the Turkiye, Syria, Iraq, Lebanon, and Kurdish files overlap. Barrack may not be a KRG specialist, but his Syria/Turkiye portfolio directly touches Kurdish security questions, SDF integration, Ankara's threat perception, Erbil's balancing role, and U.S. regional bargaining.",
    tags: ["Turkiye", "Syria", "Iraq spillover", "regional envoy", "Kurdish security implications"],
    biographyFacts: [
      ["Office", "U.S. Ambassador to Turkiye"],
      ["Envoy role", "Appointed Special Envoy for Syria in May 2025"],
      ["Background", "Founder and former Chairman and CEO of Colony Capital"],
      ["Trump proximity", "Longtime Trump ally, fundraiser, and dealmaker"],
      ["Kurdistan relevance", "Kurdish questions cross the Turkiye-Syria-Iraq file, especially SDF, PKK/YPG, Ankara-Erbil coordination, and border security"],
      ["Evidence status", "Mostly indirect for KRG, stronger for Syria/Turkiye regional impact"],
      ["Analytic caution", "Do not treat Syria Kurdish policy and KRG policy as the same; map spillovers carefully"]
    ],
    officialProfiles: [
      ["U.S. Embassy Turkiye ambassador biography", "https://tr.usembassy.gov/ambassador/"],
      ["State Department envoy briefing", "https://www.state.gov/briefings-foreign-press-centers/strengthening-us-turkiye-relations-and-advancing-relations-with-syria"],
      ["State Department June 30 2025 special briefing", "https://www.state.gov/releases/office-of-the-spokesperson/2025/06/u-s-ambassador-to-turkiye-and-special-envoy-for-syria-thomas-barrack-and-acting-under-secretary-brad-smith-terrorism-and-financial-intelligence-treasury"],
      ["State Syria policy archive", "https://www.state.gov/countries-areas-archive/syria"]
    ],
    social: [
      ["U.S. Embassy Turkiye X", "https://x.com/USEmbassyTurkey"],
      ["Ambassador public X account", "https://x.com/USAmbTurkiye"],
      ["State Department X", "https://x.com/StateDept"]
    ],
    resumeTimeline: [
      {
        year: 1980,
        label: "Business-diplomatic network",
        detail: "Builds long career in investment, real estate, Gulf relationships, and deal-based regional networks."
      },
      {
        year: 2016,
        label: "Trump proximity",
        detail: "Serves as a prominent Trump ally and inaugural committee chair, making access to the president a key analytic variable."
      },
      {
        year: 2025,
        label: "Ambassador",
        detail: "Confirmed and installed as U.S. Ambassador to Turkiye, a country central to KRG and Syria Kurdish calculations."
      },
      {
        year: 2025,
        label: "Syria envoy",
        detail: "Appointed Special Envoy for Syria in May 2025; his Syria channel affects Kurdish security even when KRG is not named."
      }
    ],
    writingsAndStatements: [
      ["Foreign Press Center briefing on U.S.-Turkiye and Syria relations", "U.S. State Department", "2025-06-30", "https://www.state.gov/briefings-foreign-press-centers/strengthening-us-turkiye-relations-and-advancing-relations-with-syria"],
      ["State Department special briefing with Barrack and Treasury official Brad Smith", "U.S. State Department", "2025-06-30", "https://www.state.gov/releases/office-of-the-spokesperson/2025/06/u-s-ambassador-to-turkiye-and-special-envoy-for-syria-thomas-barrack-and-acting-under-secretary-brad-smith-terrorism-and-financial-intelligence-treasury"],
      ["U.S. Embassy Turkiye ambassador biography", "U.S. Embassy Turkiye", "2025-present", "https://tr.usembassy.gov/ambassador/"],
      ["State Department Syria archive", "U.S. Department of State", "2025-present", "https://www.state.gov/countries-areas-archive/syria"]
    ],
    statementsOnKurdistan: [
      {
        date: "2025-05",
        stance: "Indirect but strategic",
        title: "Barrack appointed to Turkiye/Syria channel",
        summary: "Turkiye and Syria policy directly affects Kurdish security questions, but this is not the same as a KRG statement. Score the indirect impact separately.",
        url: "https://tr.usembassy.gov/ambassador/",
        evidenceId: "usa-barrack"
      },
      {
        date: "2025-06-30",
        stance: "Regional dealmaking channel",
        title: "State Department briefing places Barrack in U.S.-Turkiye/Syria policy",
        summary: "This matters for KRG analysis because Ankara, Damascus, Erbil, and Washington can be linked through security deals, border arrangements, and SDF-related negotiations.",
        url: "https://www.state.gov/briefings-foreign-press-centers/strengthening-us-turkiye-relations-and-advancing-relations-with-syria"
      },
      {
        date: "2026-07-10",
        stance: "Needs KRG-specific proof",
        title: "No direct KRG endorsement or criticism is attached yet",
        summary: "Until a Barrack statement names KRG, Kurdistan Region, Erbil, Masrour Barzani, Nechirvan Barzani, Peshmerga, or Iraqi Kurdistan, treat his profile as indirect but consequential.",
        url: "https://www.state.gov/countries-areas-archive/iraq"
      }
    ],
    relationshipToKurdistan:
      "Indirect but strategically important. Barrack's closeness to Trump and his Turkiye/Syria portfolio can influence the environment around Kurdish actors even without direct KRG contact. The profile should connect his statements to concrete consequences: Ankara pressure, SDF integration, Syrian centralization, KRG mediation space, energy corridors, and U.S. regional bargaining.",
    monitoringTasks: [
      "Track envoy statements on Syria decentralization, SDF integration, PKK/YPG language, and Turkiye border security",
      "Track Ankara, Damascus, Baghdad, Erbil, and Washington meetings involving Barrack",
      "Separate KRG evidence from Syria Kurdish/SDF evidence",
      "Add reports on any official Iraq envoy role only after confirmation or label it as reported/lower-confidence",
      "Map whether Barrack's positions align with Rubio, Trump, CENTCOM, and U.S. Embassy Iraq"
    ]
  },
  "Recep Tayyip Erdogan": {
    kind: "Person",
    country: "Turkiye",
    currentRole: "President of Turkiye",
    summary:
      "Central decision-maker for Turkiye's Iraq, Syria, energy, border, and security policy. For Kurdistan, the profile must always separate practical engagement with KRG leadership from hard constraints around PKK, YPG, territorial integrity, and the 2017 referendum.",
    tags: ["presidency", "security", "energy", "KRG meetings", "PKK constraint"],
    biographyFacts: [
      ["Office", "President of Turkiye"],
      ["Institution", "Presidency of the Republic of Turkiye"],
      ["Kurdistan relevance", "Final authority over Ankara's KRG, Iraq, and Syria posture"],
      ["Key pattern", "Leader-level access plus security constraints"]
    ],
    officialProfiles: [
      ["Presidential biography", "https://www.tccb.gov.tr/en/receptayyiperdogan/biography/"],
      ["Presidency news", "https://www.tccb.gov.tr/en/news/"]
    ],
    social: [
      ["X", "https://x.com/RTErdogan"],
      ["Turkish Presidency X", "https://x.com/trpresidency"],
      ["Instagram", "https://www.instagram.com/rterdogan/"]
    ],
    writingsAndStatements: [
      ["President Erdogan receives IKRG PM Barzani", "Presidency of Turkiye", "2026-05", "https://www.tccb.gov.tr/en/news/542/164962/president-erdogan-receives-ikrg-pm-barzani"],
      ["Presidency speeches and statements", "Presidency of Turkiye", "Current", "https://www.tccb.gov.tr/en/news/"]
    ],
    statementsOnKurdistan: [
      {
        date: "2026-05",
        stance: "Engagement",
        title: "Received IKRG Prime Minister Masrour Barzani",
        summary: "A strong access signal, but it must be weighed against Turkiye's security doctrine.",
        url: "https://www.tccb.gov.tr/en/news/542/164962/president-erdogan-receives-ikrg-pm-barzani",
        evidenceId: "tur-erdogan-masrour"
      }
    ],
    relationshipToKurdistan:
      "High access, high volatility. Engagement is real, but Ankara's red lines are structural and should be visible in every briefing.",
    monitoringTasks: ["Track Erdogan meetings with KRG leaders", "Track speeches mentioning PKK/YPG/Iraq", "Track border and energy decisions"]
  },
  "Hakan Fidan": {
    kind: "Person",
    country: "Turkiye",
    currentRole: "Minister of Foreign Affairs",
    summary:
      "One of the most important actors in the Turkiye file. Fidan combines diplomatic office with deep security background, making him central to Iraq, Syria, PKK, intelligence, and KRG channels.",
    tags: ["foreign minister", "security background", "Iraq", "Syria", "KRG meetings"],
    biographyFacts: [
      ["Office", "Minister of Foreign Affairs"],
      ["Appointed", "After the May 28, 2023 presidential election"],
      ["Education", "University of Maryland University College; Bilkent University MA/PhD"],
      ["Kurdistan relevance", "Direct meetings with Nechirvan Barzani, Masrour Barzani, Masoud Barzani, and Qubad Talabani"]
    ],
    officialProfiles: [
      ["MFA minister biography", "https://www.mfa.gov.tr/minister-of-fa-info.en.mfa"],
      ["MFA speeches/articles/interviews", "https://www.mfa.gov.tr/minister-of-fa-info.en.mfa"],
      ["Bilkent thesis local PDF", fidanThesisPdf]
    ],
    social: [
      ["MFA X", "https://x.com/MFATurkiye"],
      ["Hakan Fidan X handle to verify", "https://x.com/HakanFidan"]
    ],
    writingsAndStatements: [
      ["Intelligence and Foreign Policy: A Comparison of British, American and Turkish Intelligence Systems", "Bilkent University", "1999-05", fidanThesisPdf],
      ["MFA Minister page: messages, speeches, articles, interviews", "Turkiye MFA", "Current", "https://www.mfa.gov.tr/minister-of-fa-info.en.mfa"],
      ["Visit of Foreign Minister Hakan Fidan to Iraq", "Turkiye MFA", "2023-08-23", "https://www.mfa.gov.tr/sayin-bakanimizin-irak-i-ziyareti-22-23-agustos-2023.en.mfa"],
      ["Fidan received Qubad Talabani", "Turkiye MFA", "2026-07-03", "https://www.mfa.gov.tr/sayin-bakanimizin-ikby-basbakan-yardimcisi-kubat-talabani-yi-kabulu-3-temmuz-2026-ankara.en.mfa"]
    ],
    readableDocuments: [
      {
        id: "fidan-bilkent-1999-thesis",
        title: "Intelligence and Foreign Policy: A Comparison of British, American and Turkish Intelligence Systems",
        publisher: "Bilkent University",
        date: "1999-05",
        sourceUrl: fidanThesisPdf,
        documentType: "Thesis submitted for the degree of Master of International Relations",
        pages: 99,
        wordCount: 21807,
        extractionMethod: "Text extracted from the PDF's ABBYY FineReader OCR layer with pdftotext.",
        relevanceNote:
          "Useful for understanding Fidan's early framework on intelligence organization, foreign-policy decision support, oversight, coordination, and recommendations for Turkish foreign-intelligence capacity.",
        content: hakanFidanThesisText
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2026-07-03",
        stance: "Current access",
        title: "Received Qubad Talabani in Ankara",
        summary: "Fresh official contact; should be connected to agenda, outcomes, and follow-up if available.",
        url: "https://www.mfa.gov.tr/sayin-bakanimizin-ikby-basbakan-yardimcisi-kubat-talabani-yi-kabulu-3-temmuz-2026-ankara.en.mfa",
        evidenceId: "tur-fidan-qubad"
      },
      {
        date: "2023-08-23",
        stance: "Multi-channel engagement",
        title: "Met KRG and Kurdish political leadership in Erbil",
        summary: "The visit touched multiple Kurdish nodes, including Nechirvan, Masrour, Masoud, and Qubad.",
        url: "https://www.mfa.gov.tr/sayin-bakanimizin-irak-i-ziyareti-22-23-agustos-2023.en.mfa",
        evidenceId: "tur-fidan-iraq"
      }
    ],
    relationshipToKurdistan:
      "Direct and important, but filtered through Turkiye's security doctrine. Any positive meeting signal should be paired with PKK/YPG policy tracking.",
    monitoringTasks: ["Collect Fidan speeches on Iraq and Syria", "Track KRG meeting agendas", "Watch MFA language around PKK and territorial integrity"]
  },
  "Ibrahim Kalin": {
    kind: "Person",
    country: "Turkiye",
    currentRole: "Director of the National Intelligence Organization",
    summary:
      "Security and intelligence actor with an unusual intellectual profile. His profile is important for understanding how Ankara may connect culture, state security, diplomacy, and regional strategy.",
    tags: ["intelligence", "security", "Islamic philosophy", "strategic thought", "public diplomacy", "major writings indexed"],
    imageUrl: "https://www.mit.gov.tr/uploads/p/ibrahim-kalin_1.jpg?v=1781597710",
    imageCredit: "Milli Istihbarat Teskilati",
    biographyFacts: [
      ["Office", "Director of MIT"],
      ["Education", "Istanbul University; International Islamic University Malaysia; George Washington University PhD"],
      ["Academic field", "Islamic philosophy and strategic thought"],
      ["Indexed writings", `${kalinLocalWritings.length} major works attached from the local Source folder PDFs`],
      ["Major intellectual work", "Knowledge in Later Islamic Philosophy; İslam ve Batı; Akıl ve Erdem; War and Peace in Islam; Reason and Rationality in the Qur'an"],
      ["Kurdistan relevance", "Potential security-channel influence; direct KRG statements need collection"]
    ],
    officialProfiles: [
      ["MIT director biography", "https://www.mit.gov.tr/en/baskan.html"],
      ["MIT directors page", "https://www.mit.gov.tr/en/liderler.html"],
      ["KÜRE Encyclopedia publication bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"]
    ],
    social: [["MIT website", "https://www.mit.gov.tr/en/"]],
    writingsAndStatements: [
      ["MIT biography and selected works", "MIT", "Current", "https://www.mit.gov.tr/en/baskan.html"],
      ["Director profile and background", "MIT", "Current", "https://www.mit.gov.tr/en/liderler.html"],
      ["KÜRE Encyclopedia bibliography", "KÜRE Encyclopedia", "2025", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"]
    ],
    researchDocuments: [
      ...kalinLocalWritings.map((document) => ({
        title: document.title,
        type: document.type,
        publisher: document.publisher,
        date: document.date,
        url: document.url,
        note: document.note,
        status: document.status
      }))
    ],
    resumeTimeline: sortProfileTimeline([
      {
        year: "1992",
        title: "Graduated from Istanbul University",
        summary: "Completed studies in the Department of History.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "1994",
        title: "Earned master's degree",
        summary: "Completed master's degree at the International Islamic University Malaysia.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2002",
        title: "Completed doctorate",
        summary: "Completed doctorate at George Washington University in the United States.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2005",
        title: "Founded SETA role",
        summary: "Served as founding chairman at SETA Foundation.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2009",
        title: "Prime Minister foreign-policy adviser",
        summary: "Appointed as principal consultant to the Prime Minister in charge of foreign policy.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2010",
        title: "Public diplomacy office",
        summary: "Established the Premiership Public Diplomacy Coordination Office.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      ...kalinLocalWritings.map((document) => ({
        year: document.date,
        title: document.title,
        summary: `${document.type} / ${document.publisher}.`,
        url: document.url
      })),
      {
        year: "2012",
        title: "Deputy Undersecretary",
        summary: "Appointed as Premiership Deputy Undersecretary for Foreign Relations and Public Diplomacy.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2013",
        title: "Associate professor",
        summary: "Received associate professor title.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2014",
        title: "Presidency role and ambassador title",
        summary: "Appointed as Presidency Deputy Secretary General and received ambassador title.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2015",
        title: "Russia plane-crisis envoy",
        summary: "Appointed as special envoy of the President during the Turkiye-Russia plane crisis.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2017",
        title: "Qatar-UAE diplomatic demarche",
        summary: "Took diplomatic demarche to resolve tension between Qatar and UAE.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2018",
        title: "Security and foreign-policy council",
        summary: "Appointed as Vice President of the Presidency Security and Foreign Policies Council and principal adviser.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2020",
        title: "Professor title",
        summary: "Received professor title.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2022",
        title: "Black Sea Grain Initiative",
        summary: "Played an active role in the Black Sea Grain Initiative Agreement.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2023",
        title: "NATO trilateral mechanism",
        summary: "Chaired the Turkish delegation at trilateral mechanism meetings during Sweden and Finland's NATO process.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        year: "2023",
        title: "Director of MIT",
        summary: "Appointed as Director of the National Intelligence Organization.",
        url: "https://www.mit.gov.tr/en/baskan.html"
      }
    ]),
    statementsOnKurdistan: [
      {
        date: "2026-07-09",
        stance: "Security-relevant, not directly sourced",
        title: "No direct Kurdistan statement attached in prototype",
        summary: "Do not infer a personal Kurdistan stance from role alone. Collect direct statements or meetings before scoring.",
        url: "https://www.mit.gov.tr/en/baskan.html",
        evidenceId: "tur-kalin"
      }
    ],
    relationshipToKurdistan: "Important in the security layer, but needs direct evidence for personal stance.",
    monitoringTasks: ["Track MIT public statements", "Track regional security diplomacy", "Connect indirect security events to KRG only when sourced"]
  },
  "Emmanuel Macron": {
    kind: "Person",
    country: "France",
    currentRole: "President of the French Republic",
    summary:
      "The most important French actor in the Kurdistan file. Macron's profile now has repeated post-2025 contact with Nechirvan Barzani, crisis-response calls, Syria Kurdish-rights language, support for Iraq and the Kurdistan Region, and the key constraint: France frames support through stability, a unified Syria, and Iraq's sovereignty.",
    tags: ["presidential diplomacy", "France", "Kurdistan support", "Syria Kurds", "regional stability"],
    biographyFacts: [
      ["Office", "President of the French Republic"],
      ["Elected", "2017; re-elected April 24, 2022"],
      ["Education", "Studied philosophy; ENA graduate"],
      ["Kurdistan relevance", "Direct presidential relationship with Nechirvan Barzani and visible French support for Kurdistan Region security"],
      ["Syria relevance", "KRG readouts say Macron and Barzani discussed safeguarding Kurdish rights in a unified Syria"],
      ["Constraint", "Support is consistently framed around peace, stability, de-escalation, Iraq, and unified Syria rather than independence"]
    ],
    officialProfiles: [
      ["Elysee biography", "https://www.elysee.fr/en/emmanuel-macron"],
      ["Elysee news", "https://www.elysee.fr/en/all-actualities"]
    ],
    social: [
      ["X", "https://x.com/EmmanuelMacron"],
      ["Instagram", "https://www.instagram.com/emmanuelmacron/"],
      ["Elysee X", "https://x.com/Elysee"]
    ],
    writingsAndStatements: [
      ["Elysee biography", "Elysee", "Current", "https://www.elysee.fr/en/emmanuel-macron"],
      ["Macron-Barzani Elysee meeting in Paris", "Kurdistan Region Presidency", "2025-04-14", "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-president-emmanuel-macron-of-france/"],
      ["Macron-Barzani phone call after Duhok drone strike", "Kurdistan Region Presidency", "2026-03-28", "https://presidency.gov.krd/en/president-nechirvan-barzani-receives-a-phone-call-from-president-emmanuel-macron/"],
      ["Macron-Barzani meeting at Munich Security Conference", "Kurdistan Region Presidency", "2026-02-13", "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-president-emmanuel-macron/"],
      ["Macron-Barzani regional stability call", "Kurdistan Region Presidency", "2026-03-07", "https://presidency.gov.krd/en/president-nechirvan-barzani-and-president-emmanuel-macron-reiterate-the-importance-of-preserving-peace-and-stability/"],
      ["Macron-Barzani call after Makhmour attack", "Kurdistan Region Presidency", "2026-03-13", "https://presidency.gov.krd/en/president-nechirvan-barzani-holds-phone-call-with-president-emmanuel-macron/"]
    ],
    resumeTimeline: [
      {
        year: "2017",
        title: "First elected President",
        summary: "Begins presidency and becomes France's final authority on foreign and defense policy.",
        url: "https://www.elysee.fr/en/emmanuel-macron"
      },
      {
        year: "2022",
        title: "Re-elected",
        summary: "Wins a second presidential term, keeping continuity in France's Iraq/Kurdistan approach.",
        url: "https://www.elysee.fr/en/emmanuel-macron"
      },
      {
        year: "2025",
        title: "Elysee meeting with Nechirvan Barzani",
        summary: "KRG Presidency says Macron hosted Nechirvan Barzani in Paris and discussed France-Iraq-Kurdistan cooperation.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-president-emmanuel-macron-of-france/"
      },
      {
        year: "2026",
        title: "Munich meeting",
        summary: "KRG Presidency says both sides emphasized safeguarding Kurdish rights in the future constitution of a unified Syria.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-president-emmanuel-macron/"
      },
      {
        year: "2026",
        title: "Crisis calls",
        summary: "Multiple Macron-Barzani calls after attacks and regional escalation reinforce France as a visible support channel.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-receives-a-phone-call-from-president-emmanuel-macron/"
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2025-04-14",
        stance: "Presidential access",
        title: "Hosted Nechirvan Barzani at the Elysee",
        summary: "KRG readout says the leaders discussed strengthening France's relations with Iraq and the Kurdistan Region and expanding cooperation.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-president-emmanuel-macron-of-france/",
        evidenceId: "fra-macron-elysee-2025"
      },
      {
        date: "2026-02-13",
        stance: "Supportive with Syria-rights language",
        title: "Met Nechirvan Barzani and discussed Kurdish rights in unified Syria",
        summary: "This is one of the most specific French signals because it names Kurdish rights, Syria, and international cooperation.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-president-emmanuel-macron/",
        evidenceId: "fra-macron-meet"
      },
      {
        date: "2026-03-28",
        stance: "Supportive",
        title: "Condemned drone strike and reaffirmed support for Kurdistan Region and Iraq",
        summary: "One of the clearest positive French signals in this prototype.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-receives-a-phone-call-from-president-emmanuel-macron/",
        evidenceId: "fra-macron-call"
      },
      {
        date: "2026-03-13",
        stance: "Security solidarity",
        title: "After Makhmour base attack, Macron affirmed continued support for Iraq and Kurdistan Region",
        summary: "Operationally important because it links France's security presence, Peshmerga partnership, and presidential-level crisis communication.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-holds-phone-call-with-president-emmanuel-macron/",
        evidenceId: "fra-makhmour"
      }
    ],
    relationshipToKurdistan: "Strong visible support, framed through Iraq, unified Syria, and regional stability rather than independence. Macron is the central reason France scores as supportive: he gives the KRG presidential access and crisis-response visibility.",
    monitoringTasks: ["Collect French-side Elysee readouts", "Track calls after security incidents", "Watch 2027 French electoral context", "Track whether Kurdish-rights language appears in French-side Syria statements"]
  },
  "Jean-Noel Barrot": {
    kind: "Person",
    country: "France",
    currentRole: "Minister for Europe and Foreign Affairs",
    summary:
      "Primary French foreign ministry actor. Barrot has direct Erbil engagement, 2026 Syria/SDF/Kurdish-rights relevance, ISIS-coalition language, and support language for Iraq and the Kurdistan Region. He is the main working-level French diplomatic owner beneath Macron.",
    tags: ["foreign minister", "France Diplomatie", "Erbil contact", "SDF agreement", "ISIS coalition", "support language"],
    biographyFacts: [
      ["Office", "Minister for Europe and Foreign Affairs"],
      ["Previous roles", "Minister Delegate for Europe; Minister Delegate for Digital Affairs"],
      ["Background", "Economist; former National Assembly member"],
      ["Kurdistan relevance", "Direct foreign minister channel to Kurdistan Region Presidency"],
      ["Syria/Kurdish relevance", "KRG readout says Barrot backed implementation of the Syrian government-SDF agreement and rights of Kurds and other communities in a unified Syria"],
      ["Security relevance", "KRG readout says Barrot and Nechirvan Barzani agreed ISIS remained a serious threat and that the international coalition mission should continue"]
    ],
    officialProfiles: [
      ["France Diplomatie biography", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/jean-noel-barrot"],
      ["France Diplomatie news", "https://www.diplomatie.gouv.fr/en/node/4241"]
    ],
    social: [
      ["France Diplomacy X", "https://x.com/francediplo_EN"],
      ["Jean-Noel Barrot X", "https://x.com/jnbarrot"]
    ],
    writingsAndStatements: [
      ["France Diplomatie biography", "France Diplomatie", "Current", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/jean-noel-barrot"],
      ["Meeting with Nechirvan Barzani and press conference in Erbil", "Kurdistan Region Presidency", "2026-02-05", "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-the-foreign-minister-of-france/"],
      ["Meeting with Nechirvan Barzani in Erbil", "Kurdistan Region Presidency", "2025-04-23", "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-french-minister-of-foreign-affairs-jean-noel-barrot/"],
      ["Support amid attacks on Kurdistan Region", "Kurdistan Region Presidency", "2025-03-04", "https://presidency.gov.krd/en/president-nechirvan-barzani-and-french-foreign-minister-discuss-the-developments-in-the-region/"]
    ],
    resumeTimeline: [
      {
        year: "2022",
        title: "Digital affairs minister",
        summary: "Served as Minister Delegate for Digital Affairs, part of his pre-foreign-ministry government experience.",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/jean-noel-barrot"
      },
      {
        year: "2024",
        title: "Foreign minister",
        summary: "France Diplomatie identifies him as Minister for Europe and Foreign Affairs.",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/jean-noel-barrot"
      },
      {
        year: "2025",
        title: "Kurdistan support call",
        summary: "KRG readout says Barrot expressed solidarity and support for the Kurdistan Region amid attacks.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-french-foreign-minister-discuss-the-developments-in-the-region/"
      },
      {
        year: "2026",
        title: "Erbil visit",
        summary: "Met Nechirvan Barzani in Erbil; discussed Iraq, Kurdistan Region, Syria Kurds, SDF agreement, ISIS, and coalition mission.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-the-foreign-minister-of-france/"
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2026-02-05",
        stance: "Direct supportive channel",
        title: "Met Nechirvan Barzani in Erbil; backed Iraq, KRG, Syria Kurdish rights, and coalition mission",
        summary: "This is a deep evidence item: it connects French foreign ministry support, Syria's Kurds, the SDF agreement, ISIS threat, and international coalition continuity.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-the-foreign-minister-of-france/",
        evidenceId: "fra-barrot-erbil-2026"
      },
      {
        date: "2025-04-23",
        stance: "Institutional engagement",
        title: "Met Nechirvan Barzani in Erbil",
        summary: "Shows foreign ministry depth in France-Kurdistan relations.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-french-minister-of-foreign-affairs-jean-noel-barrot/",
        evidenceId: "fra-barrot-erbil"
      },
      {
        date: "2025-03-04",
        stance: "Supportive",
        title: "Expressed solidarity and support for the Kurdistan Region amid attacks",
        summary: "Important wording for France stance tracking.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-french-foreign-minister-discuss-the-developments-in-the-region/",
        evidenceId: "fra-barrot-support"
      }
    ],
    relationshipToKurdistan: "Direct and institutionally important. Barrot is the strongest French ministry channel because he appears in Erbil, Syria Kurdish-rights, SDF-agreement, and anti-ISIS coalition evidence.",
    monitoringTasks: ["Track France Diplomatie Iraq page", "Collect French-side readouts from Erbil visits", "Track statements on Kurds in Syria", "Watch whether coalition-mission language changes after attacks"]
  },
  "Benjamin Haddad": {
    kind: "Person",
    country: "France",
    currentRole: "Minister Delegate for Europe",
    summary:
      "EU-facing French actor with a Washington think-tank background. Haddad matters for Kurdistan when the file moves through EU policy, sanctions, Syria stabilization, minority rights, migration, or European parliamentary diplomacy. Direct KRG evidence is still thin, so TOR Φ should mark him as a channel to monitor rather than a proven Kurdistan advocate.",
    tags: ["Europe", "EU channel", "France Diplomatie", "Washington think tank background", "monitoring target"],
    biographyFacts: [
      ["Office", "Minister Delegate for Europe"],
      ["Appointed", "September 21, 2024"],
      ["Training", "Sciences Po and HEC School of Management"],
      ["Previous role", "National Assembly member for Paris"],
      ["Think tank background", "Worked in Washington think tanks; Senior Director of the Atlantic Council's Europe Center from 2019 to 2022"],
      ["Kurdistan relevance", "Potential EU-facing channel; direct Kurdistan evidence needs collection"],
      ["Analytic weight", "High foreign-policy sophistication, low direct Kurdistan evidence in current file"]
    ],
    officialProfiles: [
      ["France Diplomatie biography", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/benjamin-haddad"],
      ["European Commission profile", "https://commission.europa.eu/benjamin-haddad_en"]
    ],
    social: [["France Diplomacy X", "https://x.com/francediplo_EN"]],
    writingsAndStatements: [
      ["France Diplomatie biography", "France Diplomatie", "Current", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/benjamin-haddad"],
      ["Minister Delegate listing", "France Diplomatie", "Current", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers"]
    ],
    resumeTimeline: [
      {
        year: "2019",
        title: "Atlantic Council Europe Center",
        summary: "France Diplomatie biography says Haddad was Senior Director of the Atlantic Council's Europe Center from 2019 to 2022.",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/benjamin-haddad"
      },
      {
        year: "2024",
        title: "Minister Delegate for Europe",
        summary: "Appointed to the Europe portfolio under the Ministry for Europe and Foreign Affairs.",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/benjamin-haddad"
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2026-07-09",
        stance: "Not yet sourced",
        title: "No direct Kurdistan statement attached",
        summary: "Keep as a potential channel, not a scored Kurdistan actor, until direct evidence is collected.",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/benjamin-haddad",
        evidenceId: "fra-ministers"
      }
    ],
    relationshipToKurdistan: "Potential European-policy channel; low direct Kurdistan evidence. His profile is important because European policy can shape sanctions, reconstruction, refugee policy, Syria stabilization, and parliamentary messaging.",
    monitoringTasks: ["Search France-Kurdistan friendship activity", "Track EU statements on Iraq/Kurds/Syria", "Attach direct quotes before scoring", "Check Atlantic Council and National Assembly archives for Kurdish references"]
  },
  "Eleonore Caroit": {
    kind: "Person",
    country: "France",
    currentRole: "Minister Delegate for Francophonie, International Partnerships, and French Nationals Abroad",
    summary:
      "Relevant for cultural diplomacy, Francophonie, international partnerships, legal networks, diaspora, and French nationals abroad. Caroit is not yet a proven KRG-specific actor, but her portfolio overlaps with education, cultural institutes, consular access, civil-society projects, and soft-power pathways in Erbil.",
    tags: ["Francophonie", "international partnerships", "diaspora", "cultural diplomacy", "soft power"],
    biographyFacts: [
      ["Office", "Minister Delegate for Francophonie, International Partnerships, and French Nationals Abroad"],
      ["Appointed", "October 2025"],
      ["Background", "Lawyer focused on international arbitration and litigation"],
      ["Languages", "France Diplomatie says she speaks French, Spanish, English, Portuguese, and Italian"],
      ["Kurdistan relevance", "Possible cultural, education, and partnership channel"],
      ["Evidence status", "Needs Kurdistan-specific collection"]
    ],
    officialProfiles: [["France Diplomatie biography", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/eleonore-caroit"]],
    social: [["France Diplomacy X", "https://x.com/francediplo_EN"]],
    writingsAndStatements: [
      ["France Diplomatie biography", "France Diplomatie", "Current", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/eleonore-caroit"],
      ["Minister Delegate listing", "France Diplomatie", "Current", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers"]
    ],
    resumeTimeline: [
      {
        year: "2025",
        title: "Minister Delegate appointment",
        summary: "Appointed to Francophonie, international partnerships, and French nationals abroad in October 2025.",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/eleonore-caroit"
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2026-07-09",
        stance: "Not yet sourced",
        title: "No direct Kurdistan statement attached",
        summary: "Use this profile to collect future culture, language, diaspora, and education links.",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/eleonore-caroit",
        evidenceId: "fra-ministers"
      }
    ],
    relationshipToKurdistan: "Potential soft-power channel, not yet a proven Kurdistan-specific actor. She becomes important if France expands French-language education, cultural programming, scholarship pathways, civil-society partnerships, or consular services in Erbil.",
    monitoringTasks: ["Track Francophonie and education programs", "Search for Kurdistan cultural initiatives", "Add diaspora links", "Monitor French consulate events in Erbil"]
  },
  "Nicolas Forissier": {
    kind: "Person",
    country: "France",
    currentRole: "Minister Delegate for Foreign Trade and Economic Attractiveness",
    summary:
      "Economic diplomacy actor for foreign trade and attractiveness. Forissier matters if France-KRG relations move from symbolic and security cooperation into energy, infrastructure, agriculture, technology, visas, universities, or private-sector projects.",
    tags: ["foreign trade", "investment", "economic diplomacy", "France-Iraq business", "monitoring target"],
    biographyFacts: [
      ["Office", "Minister Delegate for Foreign Trade and Economic Attractiveness"],
      ["Appointed", "October 2025"],
      ["Kurdistan relevance", "Potential economic channel for French-KRG trade and investment"],
      ["Evidence status", "Needs direct Kurdistan trade evidence"],
      ["Current confirmed source", "France Diplomatie lists him in the foreign trade and attractiveness portfolio"]
    ],
    officialProfiles: [["France Diplomatie biography", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/nicolas-forissier"]],
    social: [["France Diplomacy X", "https://x.com/francediplo_EN"]],
    writingsAndStatements: [
      ["France Diplomatie biography", "France Diplomatie", "Current", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/nicolas-forissier"],
      ["Minister Delegate listing", "France Diplomatie", "Current", "https://www.diplomatie.gouv.fr/en/the-ministry/ministers"]
    ],
    resumeTimeline: [
      {
        year: "2025",
        title: "Foreign trade portfolio",
        summary: "France Diplomatie says Forissier was appointed Minister Delegate for Foreign Trade and Economic Attractiveness in October 2025.",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/nicolas-forissier"
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2026-07-09",
        stance: "Not yet sourced",
        title: "No direct Kurdistan trade statement attached",
        summary: "Profile becomes more important if French companies, energy, agriculture, or reconstruction projects appear in KRG records.",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/nicolas-forissier",
        evidenceId: "fra-ministers"
      }
    ],
    relationshipToKurdistan: "Potential economic diplomacy channel; no direct KRG evidence yet. This profile should become richer as French companies, consulate business programming, Iraq reconstruction, and Erbil investment records are added.",
    monitoringTasks: ["Track French trade missions to Iraq/KRG", "Collect business delegation records", "Attach company and sector data", "Search France-Iraq Business Council and KRG investment records"]
  },
  "Sebastien Lecornu": {
    kind: "Person",
    country: "France",
    currentRole: "Prime Minister of France",
    summary:
      "Prime Minister and former armed-forces minister. Lecornu is relevant to Kurdistan because he sits at the head of government while France maintains military, diplomatic, and crisis-response equities in Iraq and the Kurdistan Region. His earlier defense portfolio makes him more relevant than a generic prime minister for Peshmerga/Coalition analysis.",
    tags: ["prime minister", "former armed-forces minister", "defense policy", "Iraq/KRG security"],
    biographyFacts: [
      ["Office", "Prime Minister of France"],
      ["Appointed", "September 9, 2025; reappointed October 10, 2025 after a brief resignation/caretaker period"],
      ["Previous role", "Minister for the Armed Forces, 2022-2025"],
      ["Background", "Studied law at Paris 2 Panthéon-Assas University"],
      ["Kurdistan relevance", "Government head with defense-policy memory and authority over ministries involved in Iraq/KRG policy"],
      ["Evidence status", "No direct KRG statement attached yet; monitor government and defense records"]
    ],
    officialProfiles: [
      ["Official government profile", "https://www.info.gouv.fr/personnalite/sebastien-lecornu"],
      ["Elysee government appointment", "https://www.elysee.fr/emmanuel-macron/2025/10/12/nomination-du-gouvernement-6"],
      ["Former Armed Forces biography", "https://www.defense.gouv.fr/en/ministry/sebastien-lecornu-french-minister-armed-forces"]
    ],
    social: [
      ["Government website", "https://www.info.gouv.fr/"],
      ["Prime Minister X", "https://x.com/Premierministre"]
    ],
    writingsAndStatements: [
      ["Official government biography", "info.gouv.fr", "Current", "https://www.info.gouv.fr/personnalite/sebastien-lecornu"],
      ["Nomination of the Government", "Elysee", "2025-10-12", "https://www.elysee.fr/emmanuel-macron/2025/10/12/nomination-du-gouvernement-6"],
      ["Defense strategy remarks archive", "info.gouv.fr", "2025-12-10", "https://www.info.gouv.fr/actualite/sebastien-lecornu-detaille-la-strategie-de-defense-nationale"]
    ],
    resumeTimeline: [
      {
        year: "2022",
        title: "Minister for the Armed Forces",
        summary: "Served as France's armed-forces minister before becoming prime minister.",
        url: "https://www.defense.gouv.fr/en/ministry/sebastien-lecornu-french-minister-armed-forces"
      },
      {
        year: "2025",
        title: "Prime Minister",
        summary: "Appointed prime minister on September 9, 2025 and reappointed October 10, 2025.",
        url: "https://www.info.gouv.fr/personnalite/sebastien-lecornu"
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2026-07-10",
        stance: "Institutional relevance; direct evidence needed",
        title: "No direct KRG statement attached yet",
        summary: "Because of his former defense portfolio and current prime-minister role, he is relevant to security policy, but a personal Kurdistan stance requires direct evidence.",
        url: "https://www.info.gouv.fr/personnalite/sebastien-lecornu",
        evidenceId: "fra-lecornu-pm"
      }
    ],
    relationshipToKurdistan:
      "Important institutional actor, especially through defense continuity and crisis response. Keep his stance lower-confidence until he personally names Iraq, Kurdistan Region, Erbil, Peshmerga, or coalition operations.",
    monitoringTasks: ["Track Matignon statements on Iraq/KRG", "Track defense council and armed-forces references", "Search speeches for Erbil, Peshmerga, Coalition, ISIS, and Iraq"]
  },
  "Catherine Vautrin": {
    kind: "Person",
    country: "France",
    currentRole: "Minister of the Armed Forces and Veterans Affairs",
    summary:
      "Current French defense minister, therefore a key actor for the Peshmerga-French base, anti-ISIS coalition, French military casualties in Kurdistan Region, and any future training or protection mission. Her profile matters even if she has not yet made a Kurdistan-specific statement in the current file.",
    tags: ["armed forces", "defense ministry", "anti-ISIS coalition", "Peshmerga base", "security channel"],
    biographyFacts: [
      ["Office", "Minister of the Armed Forces and Veterans Affairs"],
      ["Since", "October 12, 2025"],
      ["Institution", "Ministry of the Armed Forces and Veterans Affairs"],
      ["Kurdistan relevance", "Oversees the ministry responsible for French military presence and coalition-related posture"],
      ["Evidence status", "Direct Kurdistan statement not yet attached; operational relevance is clear through ministry role"]
    ],
    officialProfiles: [
      ["Official government profile", "https://www.info.gouv.fr/personnalite/catherine-vautrin"],
      ["Armed Forces ministry page", "https://www.info.gouv.fr/ministere/ministere-des-armees-et-des-anciens-combattants"],
      ["Elysee government appointment", "https://www.elysee.fr/emmanuel-macron/2025/10/12/nomination-du-gouvernement-6"]
    ],
    social: [["Ministry of Armed Forces X", "https://x.com/armees_gouv"]],
    writingsAndStatements: [
      ["Official government biography", "info.gouv.fr", "Current", "https://www.info.gouv.fr/personnalite/catherine-vautrin"],
      ["Ministry of Armed Forces official page", "info.gouv.fr", "Current", "https://www.info.gouv.fr/ministere/ministere-des-armees-et-des-anciens-combattants"]
    ],
    resumeTimeline: [
      {
        year: "2025",
        title: "Defense appointment",
        summary: "Elysee and info.gouv list Vautrin as Minister of the Armed Forces and Veterans Affairs from October 12, 2025.",
        url: "https://www.info.gouv.fr/personnalite/catherine-vautrin"
      },
      {
        year: "2026",
        title: "Makhmour relevance",
        summary: "Defense ministry is the natural owner for any French military casualty, coalition, or Peshmerga-base follow-up.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-holds-phone-call-with-president-emmanuel-macron/"
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2026-07-10",
        stance: "Operationally relevant; direct evidence needed",
        title: "No direct KRG statement attached yet",
        summary: "Do not score her personally until a direct Iraq/KRG/Peshmerga statement is attached, but keep her high on the monitoring list due to defense authority.",
        url: "https://www.info.gouv.fr/personnalite/catherine-vautrin",
        evidenceId: "fra-vautrin-defense"
      }
    ],
    relationshipToKurdistan:
      "Institutional defense channel. Her office matters for French forces, veterans, coalition posture, and attacks affecting French personnel in the Kurdistan Region.",
    monitoringTasks: ["Search defense.gouv for Kurdistan, Erbil, Makhmour, Iraq, Peshmerga, ISIS", "Track statements after attacks on coalition facilities", "Attach French-side casualty or deployment records"]
  },
  "Alice Rufo": {
    kind: "Person",
    country: "France",
    currentRole: "Minister Delegate to the Minister of the Armed Forces and Veterans Affairs",
    summary:
      "Defense-policy specialist and former senior strategy official. Rufo is relevant because her biography links her to strategic affairs, disarmament, and the defense ministry's international strategy directorate before becoming minister delegate.",
    tags: ["defense strategy", "armed forces", "strategic affairs", "monitoring target"],
    biographyFacts: [
      ["Office", "Minister Delegate to the Minister of the Armed Forces and Veterans Affairs"],
      ["Since", "October 2025"],
      ["Previous role", "Director General for International Relations and Strategy at the Ministry of the Armed Forces, November 2022-October 2025"],
      ["Earlier role", "Deputy diplomatic adviser for strategic affairs and disarmament at the Presidency, October 2020-November 2022"],
      ["Kurdistan relevance", "Potential specialist channel for coalition, regional security, and strategic posture"]
    ],
    officialProfiles: [
      ["Official government profile", "https://www.info.gouv.fr/personnalite/alice-rufo"],
      ["Armed Forces ministry page", "https://www.info.gouv.fr/ministere/ministere-des-armees-et-des-anciens-combattants"]
    ],
    social: [["Ministry of Armed Forces X", "https://x.com/armees_gouv"]],
    writingsAndStatements: [
      ["Official government biography", "info.gouv.fr", "Current", "https://www.info.gouv.fr/personnalite/alice-rufo"],
      ["Paris Defence and Strategy Forum speech", "Ministry of Armed Forces", "2026-03-24", "https://www.defense.gouv.fr/sites/default/files/ministere-armees/PDSF%202026%20inaugural%20speech%20by%20the%20Minister%20Delegate%20to%20the%20Minister%20for%20the%20Armed%20Forces%20and%20Veterans.pdf"]
    ],
    resumeTimeline: [
      {
        year: "2020",
        title: "Presidency strategic affairs",
        summary: "Served as deputy diplomatic adviser for strategic affairs and disarmament.",
        url: "https://www.info.gouv.fr/personnalite/alice-rufo"
      },
      {
        year: "2022",
        title: "Defense international strategy",
        summary: "Became Director General for International Relations and Strategy at the Armed Forces ministry.",
        url: "https://www.info.gouv.fr/personnalite/alice-rufo"
      },
      {
        year: "2025",
        title: "Minister Delegate",
        summary: "Appointed minister delegate at the Armed Forces ministry.",
        url: "https://www.info.gouv.fr/personnalite/alice-rufo"
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2026-07-10",
        stance: "Strategic channel; direct evidence needed",
        title: "No direct Kurdistan statement attached yet",
        summary: "Relevant for defense strategy but should not be scored personally until Iraq/KRG evidence is attached.",
        url: "https://www.info.gouv.fr/personnalite/alice-rufo",
        evidenceId: "fra-rufo-defense"
      }
    ],
    relationshipToKurdistan:
      "Potentially important for the security and strategy layer, especially if French defense policy toward Iraq, coalition deployments, or Peshmerga cooperation changes.",
    monitoringTasks: ["Track defense strategy speeches", "Search for Iraq, Erbil, Peshmerga, Coalition, ISIS", "Map her role against Vautrin and Macron defense council decisions"]
  },
  "Patrick Durel": {
    kind: "Person",
    country: "France",
    currentRole: "French Ambassador to Iraq",
    summary:
      "France's ambassador in Baghdad through the current evidence window and a direct bridge to both Iraq and the Kurdistan Region. Durel appears in KRG readouts with Nechirvan Barzani and Masrour Barzani, making him a practical channel rather than just a capital-level biography.",
    tags: ["ambassador to Iraq", "Baghdad channel", "KRG contact", "energy and stability"],
    biographyFacts: [
      ["Office", "French Ambassador to Iraq"],
      ["Accreditation window", "Official and directory sources identify Patrick Durel as France's ambassador to Iraq during the current file"],
      ["Kurdistan relevance", "Direct meetings with Kurdistan Region leadership and coordination with the French Consulate General in Erbil"],
      ["Tenure note", "KRG Presidency reported a July 2026 farewell meeting marking the end of his tenure"]
    ],
    officialProfiles: [
      ["French Embassy in Iraq", "https://iq.ambafrance.org/"],
      ["KRG farewell meeting", "https://presidency.gov.krd/en/president-nechirvan-barzani-thanks-the-french-ambassador/"],
      ["KRG Prime Minister meeting", "https://gov.krd/english/government/the-prime-minister/activities/posts/2025/june/prime-minister-masrour-barzani-receives-french-ambassador/"]
    ],
    social: [
      ["French Embassy Iraq X", "https://x.com/FranceinIraq"],
      ["Patrick Durel X", "https://x.com/PatrickDurel"]
    ],
    writingsAndStatements: [
      ["President Nechirvan Barzani thanks the French Ambassador", "Kurdistan Region Presidency", "2026-07-09", "https://presidency.gov.krd/en/president-nechirvan-barzani-thanks-the-french-ambassador/"],
      ["President Nechirvan Barzani and French Ambassador discuss regional developments", "Kurdistan Region Presidency", "2026-04-15", "https://presidency.gov.krd/en/president-nechirvan-barzani-and-french-ambassador-discuss-regional-developments-and-political-process/"],
      ["Prime Minister Masrour Barzani receives French Ambassador", "KRG", "2025-06", "https://gov.krd/english/government/the-prime-minister/activities/posts/2025/june/prime-minister-masrour-barzani-receives-french-ambassador/"]
    ],
    resumeTimeline: [
      {
        year: "2025",
        title: "KRG Prime Minister meeting",
        summary: "Met Masrour Barzani in Erbil with Yann Braem present; discussed ties and regional developments.",
        url: "https://gov.krd/english/government/the-prime-minister/activities/posts/2025/june/prime-minister-masrour-barzani-receives-french-ambassador/"
      },
      {
        year: "2026",
        title: "Nechirvan Barzani meeting",
        summary: "Discussed regional developments, political process, and France's support for Iraq and Kurdistan Region.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-french-ambassador-discuss-regional-developments-and-political-process/"
      },
      {
        year: "2026",
        title: "Farewell meeting",
        summary: "KRG Presidency says Nechirvan Barzani thanked Durel for strengthening France-Iraq-Kurdistan Region relations.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-thanks-the-french-ambassador/"
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2026-04-15",
        stance: "Direct diplomatic channel",
        title: "Discussed regional developments with Nechirvan Barzani",
        summary: "Useful evidence of ambassador-level maintenance of France-KRG ties during regional instability.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-french-ambassador-discuss-regional-developments-and-political-process/",
        evidenceId: "fra-durel-nechirvan-2026"
      },
      {
        date: "2026-07-09",
        stance: "Relationship maintenance",
        title: "Farewell meeting marking end of tenure",
        summary: "KRG Presidency credited him with efforts to strengthen France's relations with Iraq and the Kurdistan Region.",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-thanks-the-french-ambassador/",
        evidenceId: "fra-durel-farewell"
      }
    ],
    relationshipToKurdistan:
      "Direct ambassadorial channel. Lower authority than Macron/Barrot but more operational, with repeated contact to KRG leadership.",
    monitoringTasks: ["Identify successor ambassador", "Archive Durel's Iraq/KRG statements", "Track embassy energy, security, and political-process messaging"]
  },
  "Yann Braem": {
    kind: "Person",
    country: "France",
    currentRole: "Consul General of France in Erbil",
    summary:
      "France's on-the-ground diplomatic actor in the Kurdistan Region. Braem is essential for the practical file: consular services, visas, cultural diplomacy, EU coordination in Erbil, KRG meetings, local political monitoring, and the texture of France-Kurdistan ties.",
    tags: ["consul general", "Erbil", "on-ground channel", "culture", "visas", "EU coordination"],
    biographyFacts: [
      ["Office", "Consul General of France in Erbil"],
      ["Took office", "November 2023"],
      ["Official directory", "French public-service directory lists Yann Braem as consul general at the French Consulate General in Erbil"],
      ["Kurdistan relevance", "Direct local channel to KRG officials, civil society, cultural events, and consular/visa services"],
      ["Consulate location", "33 Salahaddin Street, Erbil"]
    ],
    officialProfiles: [
      ["Consulate General of France in Erbil", "https://iq.diplomatie.gouv.fr/fr/consulat-general-de-france-erbil"],
      ["Yann Braem official consulate profile", "https://iq.diplomatie.gouv.fr/fr/yann-braem-consul-general-de-france-erbil"],
      ["French public-service directory", "https://lannuaire.service-public.gouv.fr/ambassades/ae7c74e2-c82d-4035-80d8-092f04a935b2"],
      ["KRG DFR foreign representation page", "https://gov.krd/dfr-en/foreign-representation/consulate-general-of-the-republic-of-france/"]
    ],
    social: [
      ["France in Erbil X", "https://x.com/FranceErbil"],
      ["Yann Braem X", "https://x.com/YannBraem"],
      ["Consulate Instagram", "https://www.instagram.com/consulatdefranceerbil/"]
    ],
    writingsAndStatements: [
      ["Official consulate biography", "France Diplomatie Iraq", "2025-12-01", "https://iq.diplomatie.gouv.fr/fr/yann-braem-consul-general-de-france-erbil"],
      ["KRG foreign representation entry", "KRG Department of Foreign Relations", "Current", "https://gov.krd/dfr-en/foreign-representation/consulate-general-of-the-republic-of-france/"],
      ["France reaffirms support for Kurdistan stability", "Kurdistan24", "2026-06-06", "https://www.kurdistan24.net/en/story/918364/france-reaffirms-support-for-kurdistans-stability-backs-diplomacy-as-only-path-out-of-regional-crisis"],
      ["French envoy highlights enduring France-Kurdistan ties", "Kurdistan24", "2026-06", "https://www.kurdistan24.net/en/story/919758/french-envoy-in-erbil-highlights-enduring-france-kurdistan-ties-at-annual-music-festival"]
    ],
    resumeTimeline: [
      {
        year: "2023",
        title: "Consul General in Erbil",
        summary: "Official consulate profile says Braem took office in Erbil in November 2023.",
        url: "https://iq.diplomatie.gouv.fr/fr/yann-braem-consul-general-de-france-erbil"
      },
      {
        year: "2024",
        title: "Visa-service expansion",
        summary: "French visa center inauguration in Erbil linked consular services to broader France-Kurdistan access.",
        url: "https://www.tlscontact.com/fr/actualites/inauguration-dun-nouveau-centre-de-visas-pour-la-france-a-erbil/"
      },
      {
        year: "2026",
        title: "Stability messaging",
        summary: "Kurdistan24 reports Braem reaffirmed France's support for Kurdistan Region stability and diplomacy during regional crisis.",
        url: "https://www.kurdistan24.net/en/story/918364/france-reaffirms-support-for-kurdistans-stability-backs-diplomacy-as-only-path-out-of-regional-crisis"
      },
      {
        year: "2026",
        title: "Cultural diplomacy",
        summary: "Kurdistan24 reports Braem highlighted historic France-Kurdistan ties at the annual French Music Festival.",
        url: "https://www.kurdistan24.net/en/story/919758/french-envoy-in-erbil-highlights-enduring-france-kurdistan-ties-at-annual-music-festival"
      }
    ],
    statementsOnKurdistan: [
      {
        date: "2026-06-06",
        stance: "Supportive local diplomacy",
        title: "Reaffirmed France's support for Kurdistan Region stability",
        summary: "Important because this is the local French representative speaking directly about Kurdistan during crisis conditions.",
        url: "https://www.kurdistan24.net/en/story/918364/france-reaffirms-support-for-kurdistans-stability-backs-diplomacy-as-only-path-out-of-regional-crisis",
        evidenceId: "fra-braem-stability"
      },
      {
        date: "2026-06",
        stance: "Cultural friendship",
        title: "Highlighted enduring France-Kurdistan ties at French Music Festival",
        summary: "Soft-power evidence: not a security guarantee, but useful for measuring depth of societal and cultural relationship.",
        url: "https://www.kurdistan24.net/en/story/919758/french-envoy-in-erbil-highlights-enduring-france-kurdistan-ties-at-annual-music-festival",
        evidenceId: "fra-braem-culture"
      }
    ],
    relationshipToKurdistan:
      "Direct local channel and one of the most practical French actors in the file. Braem should be used to track the day-to-day France-Kurdistan relationship: visas, culture, EU coordination, local meetings, and civil-society links.",
    monitoringTasks: ["Track FranceErbil posts", "Collect KRG meetings with Braem", "Track visa/cultural/education programs", "Separate local consular statements from Paris policy"]
  },
  "Kurdish-American Congressional Caucus": {
    kind: "Institution",
    country: "United States",
    currentRole: "Congressional friendship and advocacy network",
    summary:
      "Useful as a legislative network profile rather than a person. It should contain membership, co-chairs, letters, resolutions, trips, hearings, and diaspora links. The prototype currently treats membership as something that must be verified before official use.",
    tags: ["Congress", "diaspora", "advocacy", "membership needs update"],
    biographyFacts: [
      ["Institution type", "Congressional caucus network"],
      ["Purpose", "U.S.-Kurdish relations and Kurdish-American issues"],
      ["Evidence status", "Membership requires current verification"],
      ["Kurdistan relevance", "Potential route for letters, hearings, delegation visits, and advocacy"]
    ],
    officialProfiles: [["LegiStorm summary", "https://www.legistorm.com/organization/summary/122602/Kurdish_American_Congressional_Caucus.html"]],
    social: [],
    writingsAndStatements: [["Caucus summary", "LegiStorm", "Current", "https://www.legistorm.com/organization/summary/122602/Kurdish_American_Congressional_Caucus.html"]],
    statementsOnKurdistan: [
      {
        date: "2026-07-09",
        stance: "Potentially supportive",
        title: "Membership and leadership must be verified",
        summary: "Do not use old caucus lists without checking the current Congress.",
        url: "https://www.legistorm.com/organization/summary/122602/Kurdish_American_Congressional_Caucus.html",
        evidenceId: "usa-caucus"
      }
    ],
    relationshipToKurdistan: "Potentially valuable but must be maintained carefully because congressional membership changes.",
    monitoringTasks: ["Verify current co-chairs", "Track letters and resolutions", "Map member districts with Kurdish diaspora communities"]
  },
  "Turkish contractors and energy firms": {
    kind: "Institution",
    country: "Turkiye",
    currentRole: "Trade, construction, logistics, and energy network",
    summary:
      "Not one person, but a practical influence group. This profile should collect companies, trade volumes, border crossings, energy infrastructure, construction contracts, and payment disputes.",
    tags: ["trade", "energy", "construction", "logistics", "border economy"],
    biographyFacts: [
      ["Institution type", "Business and sector network"],
      ["Kurdistan relevance", "Economic incentives can support engagement even during political tension"],
      ["Evidence status", "Needs company-level records"]
    ],
    officialProfiles: [
      ["Foreign Economic Relations Board of Turkiye", "https://www.deik.org.tr/"],
      ["Turkiye MFA Erbil visit reference", "https://www.mfa.gov.tr/sayin-bakanimizin-erbil-i-ziyareti-10-06-2019.en.mfa"]
    ],
    social: [["DEIK X", "https://x.com/deikiletisim"]],
    writingsAndStatements: [["Turkiye MFA Erbil visit", "Turkiye MFA", "2019-06-10", "https://www.mfa.gov.tr/sayin-bakanimizin-erbil-i-ziyareti-10-06-2019.en.mfa"]],
    statementsOnKurdistan: [
      {
        date: "2019-06-10",
        stance: "Engagement through trade",
        title: "MFA referred to expanding trade relations and investments",
        summary: "Important positive economic signal, paired with a security constraint around PKK.",
        url: "https://www.mfa.gov.tr/sayin-bakanimizin-erbil-i-ziyareti-10-06-2019.en.mfa",
        evidenceId: "tur-2019-erbil"
      }
    ],
    relationshipToKurdistan: "Economic bridge that can soften political volatility, but only when backed by current trade and company records.",
    monitoringTasks: ["Collect top Turkish firms in KRG", "Track border trade statistics", "Map energy and pipeline disruptions"]
  }
};

export const countries = [
  {
    id: "usa",
    name: "United States",
    region: "North America",
    capital: "Washington, D.C.",
    system: "Federal presidential republic",
    priority: "Critical",
    posture: "Strategic support inside a federal Iraq framework",
    scoreLabel: "Strong but conditional",
    trend: "Security ties remain the main positive driver",
    summary:
      "The United States has a durable security and diplomatic relationship with the Kurdistan Region, especially through the defeat-ISIS mission, Peshmerga support, investment messaging, and direct contact with KRG leadership. The constraint is equally important: Washington generally frames support through a stable, federal Iraq rather than independent statehood.",
    government: [
      {
        label: "President",
        value: "Donald J. Trump",
        url: "https://www.whitehouse.gov/administration/donald-j-trump/"
      },
      {
        label: "Vice President",
        value: "JD Vance",
        url: "https://www.whitehouse.gov/administration/jd-vance/"
      },
      {
        label: "Secretary of State",
        value: "Marco Rubio",
        url: "https://www.state.gov/biographies/marco-rubio"
      },
      {
        label: "Deputy Secretary",
        value: "Christopher Landau",
        url: "https://www.state.gov/biographies/christopher-landau"
      }
    ],
    actors: [
      {
        name: "Donald J. Trump",
        institution: "White House",
        role: "Sets national security, energy, and Iraq policy direction",
        stance: "Administration priority filter",
        url: "https://www.whitehouse.gov/administration/donald-j-trump/",
        evidenceIds: ["usa-trump-admin", "usa-rubio-krg-readout", "usa-vance-k24"]
      },
      {
        name: "JD Vance",
        institution: "White House",
        role: "Vice presidential signal on administration posture toward Kurds",
        stance: "Supportive public sentiment; policy linkage needed",
        url: "https://www.whitehouse.gov/administration/jd-vance/",
        evidenceIds: [
          "usa-vance-bio",
          "usa-vance-bioguide",
          "usa-vance-iraq-marine",
          "usa-vance-k24",
          "usa-vance-kurdistan-chronicle",
          "usa-vance-communion",
          "usa-vance-dawn-foreword"
        ]
      },
      {
        name: "Marco Rubio",
        institution: "Department of State",
        role: "Top diplomatic decision-maker; met with KRG leadership",
        stance: "Supportive but Iraq-sovereignty aware",
        url: "https://www.state.gov/biographies/marco-rubio",
        evidenceIds: ["usa-rubio-bio", "usa-rubio-krg", "usa-rubio-krg-readout", "usa-rubio-krg-call-2026", "usa-autonomy"]
      },
      {
        name: "Christopher Landau",
        institution: "Department of State",
        role: "Deputy Secretary with regional policy influence",
        stance: "Senior policy channel",
        url: "https://www.state.gov/biographies/christopher-landau",
        evidenceIds: ["usa-landau-bio"]
      },
      {
        name: "Thomas Barrack",
        institution: "U.S. Embassy Turkiye / Special Envoy portfolio",
        role: "Relevant to Syria, Turkiye, and Iraq coordination",
        stance: "Regional deal-making channel",
        url: "https://www.state.gov/releases/office-of-the-spokesperson/2025/06/u-s-ambassador-to-turkiye-and-special-envoy-for-syria-thomas-barrack-and-acting-under-secretary-brad-smith-terrorism-and-financial-intelligence-treasury",
        evidenceIds: ["usa-barrack"]
      },
      {
        name: "Kurdish-American Congressional Caucus",
        institution: "U.S. Congress network",
        role: "Legislative friendship and advocacy channel",
        stance: "Potentially supportive, must be kept current",
        url: "https://www.legistorm.com/organization/summary/122602/Kurdish_American_Congressional_Caucus.html",
        evidenceIds: ["usa-caucus"]
      }
    ],
    media: [
      {
        name: "The Washington Post",
        influence: "Washington policy audience",
        tendency: "Human rights, conflict, and U.S. policy framing",
        url: "https://www.washingtonpost.com/"
      },
      {
        name: "Foreign Affairs",
        influence: "Foreign policy establishment",
        tendency: "Grand strategy and regional stability",
        url: "https://www.foreignaffairs.com/"
      },
      {
        name: "Al-Monitor",
        influence: "Middle East specialists",
        tendency: "Granular Iraq, Syria, Turkiye, and KRG reporting",
        url: "https://www.al-monitor.com/"
      }
    ],
    influences: [
      {
        name: "Self-determination tradition",
        type: "Policy tradition",
        relevance: "Explains U.S. sympathy for Kurdish rights language, but does not imply support for independence.",
        confidence: "Medium"
      },
      {
        name: "Realist regional stability doctrine",
        type: "Strategic school",
        relevance: "Explains why Washington balances Kurdish ties with Baghdad, Ankara, and regional stability.",
        confidence: "High"
      },
      {
        name: "Counterterrorism partnership model",
        type: "Security doctrine",
        relevance: "Explains the high weight of Peshmerga and defeat-ISIS evidence.",
        confidence: "High"
      }
    ],
    relationships: [
      {
        from: "Marco Rubio",
        to: "KRG Prime Minister's Office",
        label: "direct diplomatic contact",
        strength: 82,
        evidenceIds: ["usa-rubio-krg"]
      },
      {
        from: "U.S. Department of Defense",
        to: "Peshmerga Ministry",
        label: "security cooperation",
        strength: 88,
        evidenceIds: ["usa-peshmerga-mou", "usa-ctef"]
      },
      {
        from: "U.S. firms",
        to: "Kurdistan Region energy/business",
        label: "commercial interest",
        strength: 64,
        evidenceIds: ["usa-autonomy"]
      },
      {
        from: "U.S. policy",
        to: "Federal Iraq",
        label: "sovereignty constraint",
        strength: 74,
        evidenceIds: ["usa-federal-iraq"]
      }
    ],
    timeline: [
      {
        year: 2003,
        event: "Post-2003 Iraq opened direct diplomatic and security cooperation with Kurdish leadership.",
        stance: 62
      },
      {
        year: 2014,
        event: "The ISIS war made Peshmerga cooperation central to U.S. counterterrorism policy.",
        stance: 84
      },
      {
        year: 2017,
        event: "Washington opposed the independence referendum while maintaining KRG ties.",
        stance: 67
      },
      {
        year: 2025,
        event: "State Department messaging referenced support for Kurdish autonomy and U.S. companies doing business there.",
        stance: 78
      },
      {
        year: 2026,
        event: "State archive lists a Rubio call with KRG Prime Minister Barzani, and Kurdish media records supportive Vice President Vance remarks.",
        stance: 80
      }
    ],
    evidence: [
      {
        id: "usa-trump-admin",
        date: "2025-01-20",
        category: "Government",
        claim: "Donald J. Trump is listed by the White House as the 45th and 47th President.",
        sourceTitle: "White House administration page",
        sourceType: "Official",
        url: "https://www.whitehouse.gov/administration/donald-j-trump/",
        confidence: 0.98,
        impact: 1,
        reading: "Identifies the current executive authority; low direct Kurdistan impact by itself."
      },
      {
        id: "usa-vance-bio",
        date: "2025-01-20",
        category: "Government",
        claim: "JD Vance is listed by the White House as Vice President of the United States.",
        sourceTitle: "White House biography",
        sourceType: "Official",
        url: "https://www.whitehouse.gov/administration/jd-vance/",
        confidence: 0.98,
        impact: 1,
        reading: "Confirms the White House actor; direct Kurdistan value comes from later statements, not the biography alone."
      },
      {
        id: "usa-vance-bioguide",
        date: "2025-01-20",
        category: "Government biography",
        claim: "The Congressional Biographical Directory identifies James David Vance as a senator from Ohio and Vice President of the United States.",
        sourceTitle: "Biographical Directory of the United States Congress",
        sourceType: "Official",
        url: "https://bioguide.congress.gov/search/bio/V000137",
        confidence: 0.96,
        impact: 0,
        reading: "Anchors identity and Senate history; not a Kurdistan stance."
      },
      {
        id: "usa-vance-iraq-marine",
        date: "2003-2007",
        category: "Biographical context",
        claim: "The White House biography says Vance served four years in the U.S. Marine Corps with a tour in Iraq.",
        sourceTitle: "White House biography",
        sourceType: "Official",
        url: "https://www.whitehouse.gov/administration/jd-vance/",
        confidence: 0.96,
        impact: 1,
        reading: "Personal Iraq experience matters for interpretation, but it does not prove a Kurdistan position."
      },
      {
        id: "usa-vance-communion",
        date: "2026-06-16",
        category: "Worldview / writing",
        claim: "HarperCollins published Communion, describing it as Vance's account of returning to faith and converting to Catholicism.",
        sourceTitle: "Communion",
        sourceType: "Publisher",
        url: "https://www.harpercollins.com/products/communion-j-d-vance",
        confidence: 0.92,
        impact: 0,
        reading: "Worldview source only; useful for understanding values language, not a Kurdistan stance."
      },
      {
        id: "usa-vance-dawn-foreword",
        date: "2024-11-12",
        category: "Worldview / network",
        claim: "HarperCollins lists Dawn's Early Light as a Kevin Roberts book with a foreword by J.D. Vance.",
        sourceTitle: "Dawn's Early Light",
        sourceType: "Publisher",
        url: "https://www.harpercollins.com/products/dawns-early-light-kevin-roberts",
        confidence: 0.9,
        impact: 0,
        reading: "Signals national-conservative network proximity; not a Kurdistan stance."
      },
      {
        id: "usa-vance-atlantic-2016",
        date: "2016-07-04",
        category: "Political evolution",
        claim: "Vance's 2016 Atlantic essay, Opioid of the Masses, is a key source for his earlier critique of Trump's appeal and later political evolution.",
        sourceTitle: "Opioid of the Masses",
        sourceType: "Magazine essay",
        url: "https://www.theatlantic.com/politics/archive/2016/07/opioid-of-the-masses/489911/",
        confidence: 0.88,
        impact: 0,
        reading: "Important for biography and trust analysis; not directly connected to Kurdistan policy."
      },
      {
        id: "usa-rubio-bio",
        date: "2025-01-21",
        category: "Government",
        claim: "Marco Rubio was sworn in as Secretary of State.",
        sourceTitle: "State Department biography",
        sourceType: "Official",
        url: "https://www.state.gov/biographies/marco-rubio",
        confidence: 0.98,
        impact: 2,
        reading: "Confirms the senior diplomatic actor."
      },
      {
        id: "usa-landau-bio",
        date: "2025-03-25",
        category: "Government",
        claim: "Christopher Landau was sworn in as Deputy Secretary of State.",
        sourceTitle: "State Department biography",
        sourceType: "Official",
        url: "https://www.state.gov/biographies/christopher-landau",
        confidence: 0.96,
        impact: 1,
        reading: "Confirms a senior deputy-level channel."
      },
      {
        id: "usa-rubio-krg",
        date: "2025-05-29",
        category: "Diplomatic contact",
        claim: "The State Department briefing referenced Secretary Rubio meeting Iraqi Kurdistan Regional Government Prime Minister Masrour Barzani.",
        sourceTitle: "State Department press briefing",
        sourceType: "Official",
        url: "https://www.state.gov/page/3/?%3Bp=92333%2F&post_type=state_briefing",
        confidence: 0.9,
        impact: 8,
        reading: "Direct meeting evidence raises the relationship score because it proves current high-level access."
      },
      {
        id: "usa-rubio-krg-readout",
        date: "2025-05-23",
        category: "Diplomatic contact",
        claim: "The State Department published a readout titled Secretary Rubio's Meeting with Iraqi Kurdistan Regional Government Prime Minister Barzani.",
        sourceTitle: "Secretary Rubio's Meeting with Iraqi Kurdistan Regional Government Prime Minister Barzani",
        sourceType: "Official",
        url: "https://www.state.gov/secretary-rubios-meeting-with-iraqi-kurdistan-regional-government-prime-minister-barzani",
        confidence: 0.94,
        impact: 10,
        reading: "A named official readout is stronger than a generic briefing reference and should anchor the Rubio-Barzani relationship."
      },
      {
        id: "usa-rubio-krg-call-2026",
        date: "2026-03-26",
        category: "Diplomatic contact",
        claim: "The State Department Iraq and Near Eastern Affairs archives list Secretary Rubio's Call with Kurdistan Regional Government Prime Minister Barzani.",
        sourceTitle: "State Department Iraq archive",
        sourceType: "Official archive listing",
        url: "https://www.state.gov/countries-areas-archive/iraq",
        confidence: 0.86,
        impact: 8,
        reading: "Shows the KRG channel remained current in 2026; attach the full readout when accessible."
      },
      {
        id: "usa-autonomy",
        date: "2025-05-22",
        category: "Policy statement",
        claim: "A State Department briefing said Secretary Rubio supported Kurdish autonomy and U.S. companies doing business there.",
        sourceTitle: "State Department press briefing",
        sourceType: "Official",
        url: "https://www.state.gov/briefings/department-press-briefing-may-22-2025",
        confidence: 0.9,
        impact: 11,
        reading: "This is one of the strongest positive signals because it names autonomy and commercial engagement."
      },
      {
        id: "usa-vance-k24",
        date: "2026-02-26",
        category: "White House signal",
        claim: "Kurdistan24 reported Vice President JD Vance saying the Trump administration has great contacts and friendships with Kurds and that President Trump loves the Kurds.",
        sourceTitle: "JD Vance to Kurdistan24: President Trump 'Loves the Kurds'",
        sourceType: "Kurdish media interview",
        url: "https://www.kurdistan24.net/en/story/896431/jd-vance-to-kurdistan24-president-trump-loves-the-kurds-reaffirms-strong-us-ties",
        confidence: 0.78,
        impact: 5,
        reading: "Useful for administration tone, but should be corroborated with official transcript or video and weighed below formal policy documents."
      },
      {
        id: "usa-vance-kurdistan-chronicle",
        date: "2026-05-20",
        category: "White House signal",
        claim: "Kurdistan Chronicle reported Vice President JD Vance saying the United States loves the people of Kurdistan and condemns attacks on the Kurdistan Region.",
        sourceTitle: "We Certainly Love the People of Kurdistan: JD Vance",
        sourceType: "Kurdish media report",
        url: "https://kurdistanchronicle.com/babat/4674",
        confidence: 0.72,
        impact: 4,
        reading: "Adds supportive sentiment and crisis tone; attach official transcript or full video before treating it as settled policy."
      },
      {
        id: "usa-peshmerga-mou",
        date: "2022-09-21",
        category: "Security",
        claim: "The Defense Department signed an updated memorandum of understanding with the KRG Ministry of Peshmerga Affairs.",
        sourceTitle: "Defense Department article",
        sourceType: "Official",
        url: "https://www.defense.gov/News/News-Stories/Article/article/3171097/dod-kurdish-peshmerga-continue-partnership-to-fight-isis/",
        confidence: 0.95,
        impact: 12,
        reading: "Security cooperation is a concrete relationship, so it carries high positive weight."
      },
      {
        id: "usa-ctef",
        date: "2025-05-01",
        category: "Security budget",
        claim: "The FY2026 Counter-ISIS Train and Equip Fund request references Iraq, IKR, and defeat-ISIS support structures.",
        sourceTitle: "FY2026 CTEF budget justification",
        sourceType: "Official PDF",
        url: "https://comptroller.defense.gov/Portals/45/Documents/defbudget/FY2026/FY2026_CTEF_J-Book.pdf",
        confidence: 0.84,
        impact: 7,
        reading: "Budget evidence is stronger than rhetoric, but the link to Kurdistan is indirect and therefore weighted moderately."
      },
      {
        id: "usa-federal-iraq",
        date: "2017-09-25",
        category: "Constraint",
        claim: "U.S. support is constrained by the policy preference for Iraqi unity and a federal Iraq.",
        sourceTitle: "Policy pattern from official statements and referendum period",
        sourceType: "Analyst classification",
        url: "https://www.state.gov/briefings/department-press-briefing-may-22-2025",
        confidence: 0.82,
        impact: -8,
        reading: "This prevents the score from becoming an unconditional support rating."
      },
      {
        id: "usa-barrack",
        date: "2025-06-01",
        category: "Regional envoy profile",
        claim: "Thomas Barrack is relevant to the Turkiye, Syria, and Iraq policy environment that affects Kurdish files.",
        sourceTitle: "State Department envoy-related release",
        sourceType: "Official",
        url: "https://www.state.gov/releases/office-of-the-spokesperson/2025/06/u-s-ambassador-to-turkiye-and-special-envoy-for-syria-thomas-barrack-and-acting-under-secretary-brad-smith-terrorism-and-financial-intelligence-treasury",
        confidence: 0.74,
        impact: 0,
        reading: "Profile source only. It identifies a relevant regional actor but does not prove a Kurdistan stance."
      },
      {
        id: "krg-masrour",
        date: "2019-07-10",
        category: "KRG counterpart profile",
        claim: "Masrour Barzani is Prime Minister of the Kurdistan Regional Government.",
        sourceTitle: "KRG Prime Minister profile",
        sourceType: "Official KRG",
        url: "https://gov.krd/english/government/the-prime-minister/",
        confidence: 0.95,
        impact: 0,
        reading: "Profile source only. The diplomatic impact comes from dated meetings and statements, not the biography alone."
      },
      {
        id: "krg-nechirvan",
        date: "2026-07-09",
        category: "KRG counterpart profile",
        claim: "Nechirvan Barzani is President of the Kurdistan Region.",
        sourceTitle: "Kurdistan Region Presidency biography",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/about/",
        confidence: 0.95,
        impact: 0,
        reading: "Profile source only. It anchors the actor identity for relationship records."
      },
      {
        id: "usa-caucus",
        date: "2026-07-09",
        category: "Congressional network",
        claim: "The Kurdish-American Congressional Caucus is a relevant U.S. legislative network, but membership must be kept current.",
        sourceTitle: "LegiStorm caucus summary",
        sourceType: "External directory",
        url: "https://www.legistorm.com/organization/summary/122602/Kurdish_American_Congressional_Caucus.html",
        confidence: 0.68,
        impact: 0,
        reading: "Profile source only. Do not use old membership lists without current verification."
      }
    ],
    opportunities: ["Security reform visibility", "U.S. business and energy engagement", "Congressional relationship work"],
    risks: ["Baghdad-Erbil disputes", "Regional escalation", "U.S. administration priority shifts"],
    verification: ["Update congressional caucus members", "Collect latest official Iraq/KRG readouts", "Separate KRG-specific support from Iraq-wide policy"]
  },
  {
    id: "turkey",
    name: "Turkiye",
    region: "Middle East / Eurasia",
    capital: "Ankara",
    system: "Presidential republic",
    priority: "Critical",
    posture: "Economically connected, security-sensitive, highly transactional",
    scoreLabel: "Important but volatile",
    trend: "Recent meetings are positive, security files keep the score capped",
    summary:
      "Turkiye is one of the Kurdistan Region's most important neighbors and economic channels. The relationship has real high-level access and commercial logic, but Ankara's security doctrine, PKK file, Syria concerns, and memory of the 2017 referendum make the relationship volatile.",
    government: [
      {
        label: "President",
        value: "Recep Tayyip Erdogan",
        url: "https://www.tccb.gov.tr/en/receptayyiperdogan/biography/"
      },
      {
        label: "Foreign Minister",
        value: "Hakan Fidan",
        url: "https://www.mfa.gov.tr/minister-of-fa-info.en.mfa"
      },
      {
        label: "Intelligence Chief",
        value: "Ibrahim Kalin",
        url: "https://www.mit.gov.tr/en/baskan.html"
      },
      {
        label: "Parliament",
        value: "Grand National Assembly of Turkiye",
        url: "https://www.tbmm.gov.tr/"
      }
    ],
    actors: [
      {
        name: "Recep Tayyip Erdogan",
        institution: "Presidency",
        role: "Central decision-maker on Iraq, Syria, security, energy, and trade",
        stance: "Security-first pragmatism",
        url: "https://www.tccb.gov.tr/en/receptayyiperdogan/biography/",
        evidenceIds: ["tur-erdogan-masrour"]
      },
      {
        name: "Hakan Fidan",
        institution: "Ministry of Foreign Affairs",
        role: "Former intelligence chief and current foreign minister; central regional operator",
        stance: "Hard security plus diplomacy",
        url: "https://www.mfa.gov.tr/minister-of-fa-info.en.mfa",
        evidenceIds: ["tur-fidan-bio", "tur-fidan-qubad", "tur-fidan-iraq"]
      },
      {
        name: "Ibrahim Kalin",
        institution: "National Intelligence Organization",
        role: "Security and intelligence channel with intellectual/policy influence",
        stance: "Strategic security lens",
        url: "https://www.mit.gov.tr/en/baskan.html",
        evidenceIds: ["tur-kalin"]
      },
      {
        name: "Turkish contractors and energy firms",
        institution: "Business networks",
        role: "Trade, construction, logistics, and energy pressure group",
        stance: "Engagement-oriented",
        url: "https://www.deik.org.tr/",
        evidenceIds: ["tur-2019-erbil"]
      }
    ],
    media: [
      {
        name: "Anadolu Agency",
        influence: "Official-adjacent state narrative",
        tendency: "Security, sovereignty, and regional diplomacy",
        url: "https://www.aa.com.tr/en"
      },
      {
        name: "Daily Sabah",
        influence: "Government-aligned international readers",
        tendency: "Counterterrorism and Turkish strategic framing",
        url: "https://www.dailysabah.com/"
      },
      {
        name: "Hurriyet Daily News",
        influence: "English-language Turkey watchers",
        tendency: "Domestic politics and foreign policy coverage",
        url: "https://www.hurriyetdailynews.com/"
      }
    ],
    influences: [
      {
        name: "Mustafa Kemal Ataturk",
        type: "State tradition",
        relevance: "State sovereignty and territorial integrity remain core filters for Kurdish questions.",
        confidence: "High"
      },
      {
        name: "Strategic Depth / regional activism",
        type: "Foreign policy school",
        relevance: "Helps explain Ankara's active role across Iraq, Syria, the Caucasus, and energy corridors.",
        confidence: "Medium"
      },
      {
        name: "Ibrahim Kalin's civilizational/state-security thought",
        type: "Current policy-intellectual node",
        relevance: "Relevant because Kalin sits inside the intelligence structure; direct policy influence should be sourced per case.",
        confidence: "Medium"
      }
    ],
    relationships: [
      {
        from: "Recep Tayyip Erdogan",
        to: "KRG Prime Minister's Office",
        label: "leader-level meeting",
        strength: 76,
        evidenceIds: ["tur-erdogan-masrour"]
      },
      {
        from: "Hakan Fidan",
        to: "KRG Deputy Prime Minister's Office",
        label: "foreign ministry channel",
        strength: 72,
        evidenceIds: ["tur-fidan-qubad"]
      },
      {
        from: "Hakan Fidan",
        to: "KRG leadership in Erbil",
        label: "multi-node Erbil contact",
        strength: 79,
        evidenceIds: ["tur-fidan-iraq"]
      },
      {
        from: "Turkiye security state",
        to: "PKK file",
        label: "negative constraint",
        strength: 90,
        evidenceIds: ["tur-2019-erbil", "tur-fidan-iraq"]
      }
    ],
    timeline: [
      {
        year: 2008,
        event: "Trade and energy ties started reshaping Ankara-Erbil relations.",
        stance: 36
      },
      {
        year: 2017,
        event: "The independence referendum triggered a major backlash from Ankara.",
        stance: 24
      },
      {
        year: 2023,
        event: "Hakan Fidan's Iraq visit included meetings with Nechirvan Barzani, Masrour Barzani, Masoud Barzani, and Qubad Talabani.",
        stance: 48
      },
      {
        year: 2026,
        event: "Recent Erdogan-Masrour and Fidan-Qubad meetings show access remains open.",
        stance: 52
      }
    ],
    evidence: [
      {
        id: "tur-fidan-bio",
        date: "2026-07-09",
        category: "Government",
        claim: "Hakan Fidan is the Minister of Foreign Affairs; his official bio lists his education and background.",
        sourceTitle: "Turkiye MFA minister page",
        sourceType: "Official",
        url: "https://www.mfa.gov.tr/minister-of-fa-info.en.mfa",
        confidence: 0.96,
        impact: 1,
        reading: "Confirms the current foreign policy actor."
      },
      {
        id: "tur-kalin",
        date: "2026-07-09",
        category: "Government",
        claim: "Ibrahim Kalin is listed by MIT as Director of the National Intelligence Organization.",
        sourceTitle: "MIT director page",
        sourceType: "Official",
        url: "https://www.mit.gov.tr/en/baskan.html",
        confidence: 0.94,
        impact: 1,
        reading: "Confirms the current intelligence actor."
      },
      {
        id: "tur-erdogan-masrour",
        date: "2026-05-01",
        category: "Diplomatic contact",
        claim: "President Erdogan received IKRG Prime Minister Masrour Barzani at Dolmabahce.",
        sourceTitle: "Presidency of Turkiye",
        sourceType: "Official",
        url: "https://www.tccb.gov.tr/en/news/542/164962/president-erdogan-receives-ikrg-pm-barzani",
        confidence: 0.95,
        impact: 10,
        reading: "Direct leader-level access is a strong positive relationship signal."
      },
      {
        id: "tur-fidan-qubad",
        date: "2026-07-03",
        category: "Diplomatic contact",
        claim: "Foreign Minister Hakan Fidan received KRG Deputy Prime Minister Qubad Talabani in Ankara.",
        sourceTitle: "Turkiye MFA latest development",
        sourceType: "Official",
        url: "https://www.mfa.gov.tr/sayin-bakanimizin-ikby-basbakan-yardimcisi-kubat-talabani-yi-kabulu-3-temmuz-2026-ankara.en.mfa",
        confidence: 0.97,
        impact: 9,
        reading: "Fresh contact from July 3, 2026 increases current-access confidence."
      },
      {
        id: "tur-fidan-iraq",
        date: "2023-08-23",
        category: "Diplomatic contact",
        claim: "Fidan's Iraq visit included meetings with Nechirvan Barzani, Masrour Barzani, Masoud Barzani, and Qubad Talabani in Erbil.",
        sourceTitle: "Turkiye MFA Iraq visit",
        sourceType: "Official",
        url: "https://www.mfa.gov.tr/sayin-bakanimizin-irak-i-ziyareti-22-23-agustos-2023.en.mfa",
        confidence: 0.93,
        impact: 6,
        reading: "Shows Ankara maintains multiple Kurdish political channels."
      },
      {
        id: "tur-2019-erbil",
        date: "2019-06-10",
        category: "Security and trade",
        claim: "The MFA said Turkiye should expand trade and investment while continuing cooperation against terrorism, especially PKK and affiliated groups.",
        sourceTitle: "Turkiye MFA Erbil visit",
        sourceType: "Official",
        url: "https://www.mfa.gov.tr/sayin-bakanimizin-erbil-i-ziyareti-10-06-2019.en.mfa",
        confidence: 0.9,
        impact: -10,
        reading: "This is both positive and negative: trade is positive, but PKK-centered security framing caps the stance score."
      },
      {
        id: "tur-referendum",
        date: "2017-09-18",
        category: "Constraint",
        claim: "Turkish official messaging opposed the 2017 KRG referendum and emphasized Iraq's territorial integrity.",
        sourceTitle: "MFA interview with Al-Monitor",
        sourceType: "Official-hosted interview",
        url: "https://www.mfa.gov.tr/interview-of-h_e_-mr_-mevlut-cavusoglu-to-al-monitor_-18-september-2017_-new-york.el.mfa",
        confidence: 0.86,
        impact: -13,
        reading: "The referendum memory remains a structural constraint for any independence-related positioning."
      }
    ],
    opportunities: ["Trade corridors", "Energy and logistics diplomacy", "Regular security deconfliction"],
    risks: ["PKK-linked escalation", "Syria/YPG spillover", "Referendum memory", "Domestic Turkish politics"],
    verification: ["Update post-July 2026 Turkish readouts", "Separate trade interest from security posture", "Track Turkish media framing after border incidents"]
  },
  {
    id: "france",
    name: "France",
    region: "Europe",
    capital: "Paris",
    system: "Semi-presidential republic",
    priority: "High",
    posture: "Culturally sympathetic, diplomatically active, strategically cautious",
    scoreLabel: "Supportive with sovereignty limits",
    trend: "Frequent Macron/Barzani contact is the clearest driver",
    summary:
      "France shows unusually visible sympathy and access toward the Kurdistan Region compared with many European states. The relationship is supported by presidential contact, foreign minister engagement, anti-ISIS cooperation, humanitarian memory, and cultural affinity. Paris still keeps its support inside the frameworks of Iraq stability, regional de-escalation, and relations with Baghdad and Ankara.",
    government: [
      {
        label: "President",
        value: "Emmanuel Macron",
        url: "https://www.elysee.fr/en/emmanuel-macron"
      },
      {
        label: "Prime Minister",
        value: "Sebastien Lecornu",
        url: "https://www.info.gouv.fr/personnalite/sebastien-lecornu"
      },
      {
        label: "Foreign Minister",
        value: "Jean-Noel Barrot",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/jean-noel-barrot"
      },
      {
        label: "Armed Forces Minister",
        value: "Catherine Vautrin",
        url: "https://www.info.gouv.fr/personnalite/catherine-vautrin"
      },
      {
        label: "Europe Minister Delegate",
        value: "Benjamin Haddad",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/benjamin-haddad"
      },
      {
        label: "Francophonie / International Partnerships",
        value: "Eleonore Caroit",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/eleonore-caroit"
      },
      {
        label: "Consul General in Erbil",
        value: "Yann Braem",
        url: "https://iq.diplomatie.gouv.fr/fr/yann-braem-consul-general-de-france-erbil"
      }
    ],
    actors: [
      {
        name: "Emmanuel Macron",
        institution: "Elysee Palace",
        role: "President and central foreign-policy actor",
        stance: "Visible high-level support within Iraq stability",
        url: "https://www.elysee.fr/en/emmanuel-macron",
        evidenceIds: ["fra-macron-bio", "fra-macron-call", "fra-macron-meet"]
      },
      {
        name: "Jean-Noel Barrot",
        institution: "Ministry for Europe and Foreign Affairs",
        role: "Foreign minister and direct Erbil/Paris diplomatic channel",
        stance: "Supportive institutional channel",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/jean-noel-barrot",
        evidenceIds: ["fra-barrot-bio", "fra-barrot-erbil", "fra-barrot-support"]
      },
      {
        name: "Benjamin Haddad",
        institution: "France Diplomatie",
        role: "Minister Delegate for Europe",
        stance: "EU-facing policy channel",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/benjamin-haddad",
        evidenceIds: ["fra-ministers"]
      },
      {
        name: "Eleonore Caroit",
        institution: "France Diplomatie",
        role: "Minister Delegate for Francophonie and international partnerships",
        stance: "Cultural/diaspora partnership channel",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/eleonore-caroit",
        evidenceIds: ["fra-ministers"]
      },
      {
        name: "Nicolas Forissier",
        institution: "France Diplomatie",
        role: "Minister Delegate for foreign trade and economic attractiveness",
        stance: "Economic channel",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/nicolas-forissier",
        evidenceIds: ["fra-ministers"]
      },
      {
        name: "Sebastien Lecornu",
        institution: "Prime Minister / Matignon",
        role: "Head of government with former armed-forces portfolio",
        stance: "Institutional security channel; direct KRG evidence needed",
        url: "https://www.info.gouv.fr/personnalite/sebastien-lecornu",
        evidenceIds: ["fra-lecornu-pm"]
      },
      {
        name: "Catherine Vautrin",
        institution: "Ministry of the Armed Forces and Veterans Affairs",
        role: "Defense minister responsible for French military posture",
        stance: "Operationally relevant through coalition and Peshmerga-linked security",
        url: "https://www.info.gouv.fr/personnalite/catherine-vautrin",
        evidenceIds: ["fra-vautrin-defense", "fra-makhmour"]
      },
      {
        name: "Alice Rufo",
        institution: "Ministry of the Armed Forces and Veterans Affairs",
        role: "Minister delegate and strategic affairs specialist",
        stance: "Defense strategy monitoring channel",
        url: "https://www.info.gouv.fr/personnalite/alice-rufo",
        evidenceIds: ["fra-rufo-defense"]
      },
      {
        name: "Patrick Durel",
        institution: "French Embassy in Iraq",
        role: "Ambassador-level Baghdad-Erbil diplomatic channel",
        stance: "Direct KRG relationship maintenance",
        url: "https://iq.ambafrance.org/",
        evidenceIds: ["fra-durel-nechirvan-2026", "fra-durel-farewell"]
      },
      {
        name: "Yann Braem",
        institution: "Consulate General of France in Erbil",
        role: "On-ground diplomatic, consular, cultural, and EU coordination channel",
        stance: "Supportive local diplomacy",
        url: "https://iq.diplomatie.gouv.fr/fr/yann-braem-consul-general-de-france-erbil",
        evidenceIds: ["fra-braem-consul", "fra-braem-stability", "fra-braem-culture"]
      }
    ],
    media: [
      {
        name: "Le Monde",
        influence: "French policy and educated public",
        tendency: "Human rights, geopolitics, and regional conflict",
        url: "https://www.lemonde.fr/en/"
      },
      {
        name: "France 24",
        influence: "International francophone and English-language audiences",
        tendency: "Conflict, diplomacy, and humanitarian coverage",
        url: "https://www.france24.com/en/"
      },
      {
        name: "L'Orient-Le Jour",
        influence: "Levant-focused francophone readership",
        tendency: "Minority politics and regional diplomacy",
        url: "https://today.lorientlejour.com/"
      }
    ],
    influences: [
      {
        name: "Gaullist strategic autonomy",
        type: "Foreign policy tradition",
        relevance: "Explains France's habit of independent channels with regional actors.",
        confidence: "High"
      },
      {
        name: "Republican universalism",
        type: "Political philosophy",
        relevance: "Shapes human rights language, but can also make ethnic autonomy claims complex.",
        confidence: "Medium"
      },
      {
        name: "Humanitarian intervention tradition",
        type: "Policy tradition",
        relevance: "Relevant to French sympathy around ISIS, Yazidis, refugees, and minority protection.",
        confidence: "Medium"
      }
    ],
    relationships: [
      {
        from: "Emmanuel Macron",
        to: "Kurdistan Region Presidency",
        label: "presidential contact",
        strength: 88,
        evidenceIds: ["fra-macron-meet", "fra-macron-call"]
      },
      {
        from: "Jean-Noel Barrot",
        to: "Kurdistan Region Presidency",
        label: "foreign ministry contact",
        strength: 78,
        evidenceIds: ["fra-barrot-erbil-2026", "fra-barrot-erbil", "fra-barrot-support"]
      },
      {
        from: "French forces",
        to: "Peshmerga / coalition base",
        label: "anti-ISIS security link",
        strength: 76,
        evidenceIds: ["fra-makhmour"]
      },
      {
        from: "French policy",
        to: "Iraq stability framework",
        label: "sovereignty constraint",
        strength: 70,
        evidenceIds: ["fra-stability"]
      },
      {
        from: "Patrick Durel",
        to: "Nechirvan Barzani / Masrour Barzani",
        label: "ambassadorial maintenance channel",
        strength: 72,
        evidenceIds: ["fra-durel-nechirvan-2026", "fra-durel-farewell"]
      },
      {
        from: "Yann Braem",
        to: "Kurdistan Region institutions",
        label: "local consular and cultural channel",
        strength: 74,
        evidenceIds: ["fra-braem-consul", "fra-braem-stability", "fra-braem-culture"]
      }
    ],
    timeline: [
      {
        year: 1991,
        event: "Post-Gulf War humanitarian politics gave Kurdish suffering visibility in France.",
        stance: 54
      },
      {
        year: 2014,
        event: "ISIS war deepened French security and humanitarian engagement with Kurdish forces and communities.",
        stance: 75
      },
      {
        year: 2025,
        event: "Macron hosted Nechirvan Barzani at the Elysee; Barrot and Kurdistan Region leadership discussed France-Iraq-Kurdistan relations and regional security.",
        stance: 72
      },
      {
        year: 2026,
        event: "Multiple Macron-Barzani contacts, Barrot's Erbil visit, and Braem's local stability messaging reinforced France as a visible diplomatic supporter.",
        stance: 80
      }
    ],
    evidence: [
      {
        id: "fra-macron-bio",
        date: "2026-07-09",
        category: "Government",
        claim: "The Elysee identifies Emmanuel Macron as President of the French Republic.",
        sourceTitle: "Elysee biography",
        sourceType: "Official",
        url: "https://www.elysee.fr/en/emmanuel-macron",
        confidence: 0.97,
        impact: 1,
        reading: "Confirms the current head-of-state actor."
      },
      {
        id: "fra-barrot-bio",
        date: "2026-07-09",
        category: "Government",
        claim: "France Diplomatie identifies Jean-Noel Barrot as Minister for Europe and Foreign Affairs.",
        sourceTitle: "France Diplomatie biography",
        sourceType: "Official",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry/ministers/jean-noel-barrot",
        confidence: 0.97,
        impact: 1,
        reading: "Confirms the current foreign-policy actor."
      },
      {
        id: "fra-ministers",
        date: "2026-07-09",
        category: "Government",
        claim: "France Diplomatie lists Jean-Noel Barrot, Benjamin Haddad, Eleonore Caroit, and Nicolas Forissier among ministry leaders.",
        sourceTitle: "France Diplomatie homepage",
        sourceType: "Official",
        url: "https://www.diplomatie.gouv.fr/en",
        confidence: 0.92,
        impact: 2,
        reading: "Adds more named institutional channels beyond the foreign minister."
      },
      {
        id: "fra-lecornu-pm",
        date: "2025-10-10",
        category: "Government",
        claim: "Sebastien Lecornu is listed by the French government as Prime Minister.",
        sourceTitle: "Official government profile",
        sourceType: "Official",
        url: "https://www.info.gouv.fr/personnalite/sebastien-lecornu",
        confidence: 0.96,
        impact: 1,
        reading: "Confirms the head-of-government actor; Kurdistan relevance comes through defense and crisis-policy channels."
      },
      {
        id: "fra-vautrin-defense",
        date: "2025-10-12",
        category: "Government / defense",
        claim: "Catherine Vautrin is listed as Minister of the Armed Forces and Veterans Affairs from October 12, 2025.",
        sourceTitle: "Official government profile",
        sourceType: "Official",
        url: "https://www.info.gouv.fr/personnalite/catherine-vautrin",
        confidence: 0.96,
        impact: 2,
        reading: "Confirms the defense-ministry owner for French military posture, including coalition-related questions."
      },
      {
        id: "fra-rufo-defense",
        date: "2025-10-12",
        category: "Government / defense strategy",
        claim: "Alice Rufo is listed as minister delegate at the Armed Forces ministry after serving in strategic affairs and international defense strategy roles.",
        sourceTitle: "Official government profile",
        sourceType: "Official",
        url: "https://www.info.gouv.fr/personnalite/alice-rufo",
        confidence: 0.94,
        impact: 1,
        reading: "Adds a specialist strategic-policy actor; not a Kurdistan stance by itself."
      },
      {
        id: "fra-braem-consul",
        date: "2025-12-01",
        category: "Consular presence",
        claim: "French official pages identify Yann Braem as Consul General of France in Erbil.",
        sourceTitle: "Consulate General of France in Erbil",
        sourceType: "Official",
        url: "https://iq.diplomatie.gouv.fr/fr/yann-braem-consul-general-de-france-erbil",
        confidence: 0.94,
        impact: 4,
        reading: "Direct local presence in Erbil is a practical relationship channel, especially for culture, visas, local politics, and EU coordination."
      },
      {
        id: "fra-macron-meet",
        date: "2026-02-13",
        category: "Diplomatic contact",
        claim: "President Nechirvan Barzani met President Emmanuel Macron during Munich Security Conference engagements.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-president-emmanuel-macron/",
        confidence: 0.9,
        impact: 10,
        reading: "Direct presidential contact is a high-weight positive signal."
      },
      {
        id: "fra-macron-elysee-2025",
        date: "2025-04-14",
        category: "Diplomatic contact",
        claim: "President Nechirvan Barzani was welcomed by President Emmanuel Macron at the Elysee Palace in Paris.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-president-emmanuel-macron-of-france/",
        confidence: 0.9,
        impact: 9,
        reading: "Elysee-level reception is a strong access signal and anchors the visible France-KRG relationship."
      },
      {
        id: "fra-macron-call",
        date: "2026-03-28",
        category: "Diplomatic support",
        claim: "Macron condemned the drone strike on President Nechirvan Barzani's residence and reaffirmed support for the Kurdistan Region and Iraq.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-receives-a-phone-call-from-president-emmanuel-macron/",
        confidence: 0.9,
        impact: 12,
        reading: "This is a strong positive signal because it combines crisis response, named support, and presidential-level contact."
      },
      {
        id: "fra-barrot-erbil-2026",
        date: "2026-02-05",
        category: "Foreign ministry engagement",
        claim: "Jean-Noel Barrot met President Nechirvan Barzani in Erbil and discussed Iraq, the Kurdistan Region, Syria's Kurds, the SDF agreement, ISIS, and coalition continuity.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-the-foreign-minister-of-france/",
        confidence: 0.9,
        impact: 10,
        reading: "This is a high-value record because it names policy substance, not only a courtesy meeting."
      },
      {
        id: "fra-barrot-erbil",
        date: "2025-04-23",
        category: "Diplomatic contact",
        claim: "President Nechirvan Barzani welcomed French Foreign Minister Jean-Noel Barrot in Erbil.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-french-minister-of-foreign-affairs-jean-noel-barrot/",
        confidence: 0.9,
        impact: 8,
        reading: "Foreign minister visit evidence shows institutional depth beyond the president."
      },
      {
        id: "fra-barrot-support",
        date: "2025-03-04",
        category: "Diplomatic support",
        claim: "Foreign Minister Barrot expressed French solidarity and support for the Kurdistan Region amid attacks.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-french-foreign-minister-discuss-the-developments-in-the-region/",
        confidence: 0.86,
        impact: 8,
        reading: "Adds a named policy support signal from the foreign ministry."
      },
      {
        id: "fra-durel-nechirvan-2026",
        date: "2026-04-15",
        category: "Ambassadorial contact",
        claim: "President Nechirvan Barzani received French Ambassador to Iraq Patrick Durel and discussed regional developments and the political process.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-french-ambassador-discuss-regional-developments-and-political-process/",
        confidence: 0.88,
        impact: 5,
        reading: "Ambassadorial maintenance keeps the relationship active between presidential-level moments."
      },
      {
        id: "fra-durel-farewell",
        date: "2026-07-09",
        category: "Ambassadorial contact",
        claim: "President Nechirvan Barzani thanked French Ambassador Patrick Durel for efforts to strengthen France's relations with Iraq and the Kurdistan Region.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-thanks-the-french-ambassador/",
        confidence: 0.86,
        impact: 4,
        reading: "Farewell meeting evidence confirms sustained ambassador-level attention."
      },
      {
        id: "fra-braem-stability",
        date: "2026-06-06",
        category: "Consular statement",
        claim: "Kurdistan24 reported Consul General Yann Braem reaffirming France's support for Kurdistan Region stability and diplomacy during the regional crisis.",
        sourceTitle: "Kurdistan24",
        sourceType: "Kurdish media",
        url: "https://www.kurdistan24.net/en/story/918364/france-reaffirms-support-for-kurdistans-stability-backs-diplomacy-as-only-path-out-of-regional-crisis",
        confidence: 0.76,
        impact: 4,
        reading: "Useful local-support signal; should be corroborated with the consulate post where possible."
      },
      {
        id: "fra-braem-culture",
        date: "2026-06-20",
        category: "Cultural diplomacy",
        claim: "Kurdistan24 reported Yann Braem highlighting enduring France-Kurdistan ties at an annual French Music Festival in Erbil.",
        sourceTitle: "Kurdistan24",
        sourceType: "Kurdish media",
        url: "https://www.kurdistan24.net/en/story/919758/french-envoy-in-erbil-highlights-enduring-france-kurdistan-ties-at-annual-music-festival",
        confidence: 0.72,
        impact: 3,
        reading: "Soft-power evidence that helps explain why France scores culturally sympathetic."
      },
      {
        id: "fra-makhmour",
        date: "2026-03-13",
        category: "Security",
        claim: "A KRG readout described a terrorist attack on the joint Peshmerga-French military base in Makhmour.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-holds-phone-call-with-president-emmanuel-macron/",
        confidence: 0.84,
        impact: 5,
        reading: "Shows France's security presence has a real operational dimension."
      },
      {
        id: "fra-stability",
        date: "2026-03-07",
        category: "Constraint",
        claim: "Macron-Barzani contact emphasized preserving peace and stability.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-president-emmanuel-macron-reiterate-the-importance-of-preserving-peace-and-stability/",
        confidence: 0.84,
        impact: -4,
        reading: "Positive relationship, but the language is stability-oriented rather than independence-oriented."
      }
    ],
    opportunities: ["Presidential diplomacy", "Cultural and education ties", "Yazidi/refugee/humanitarian leadership", "Security cooperation"],
    risks: ["Baghdad sensitivity", "Turkiye relations", "French domestic political shifts", "Regional escalation"],
    verification: ["Confirm latest French government composition", "Gather French-side readouts, not only KRG readouts", "Track National Assembly friendship-group activity"]
  },
  ...extraCountries
];
