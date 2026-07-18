import { landauRemarksAndReleases } from "./landauRemarksReleases.js";

const stateGov = "https://www.state.gov";
const turkiyeMfa = "https://www.mfa.gov.tr";
const franceMfa = "https://www.diplomatie.gouv.fr/en";
const govUk = "https://www.gov.uk";
const iranMfa = "https://en.mfa.gov.ir";

function record(date, type, title, source, summary, url, frame = "Official source") {
  return { date, type, title, source, summary, url, frame };
}

export const foreignMinistryData = {
  usa: {
    countryId: "usa",
    countryName: "United States",
    ministryName: "U.S. Department of State",
    nativeName: "Department of State",
    shortName: "State Department",
    officialUrl: stateGov,
    description:
      "The State Department file tracks the secretary, deputies, political leadership, Near Eastern Affairs ownership, spokesperson attribution, and diplomatic posts that shape U.S. policy toward Iraq, Syria, Turkiye, Iran, and the Kurdistan Region.",
    sourceNote:
      "State.gov biography pages were intermittently blocked by the site, but State.gov search/public-schedule results confirm the current senior-official structure. Each source is retained for analyst verification.",
    people: [
      {
        id: "marco-rubio",
        name: "Marco Rubio",
        title: "Secretary of State",
        bureau: "Office of the Secretary",
        category: "Minister",
        importance: "Top decision channel for U.S. foreign policy implementation below the President.",
        officialUrl: `${stateGov}/biographies/marco-rubio/`,
        summary:
          "Rubio is the central U.S. diplomatic owner for the Kurdistan file. In TOR Phi he should be treated as the decision node for State Department language on KRG autonomy, Iraq federalism, U.S. commercial activity, consular posture, and regional security.",
        background:
          "Former U.S. Senator from Florida and long-running foreign-policy voice. His State Department record matters because his readouts define official U.S. language even when the operational work is carried by the Iraq desk, embassy staff, Defense, or envoys.",
        kurdistanAssessment:
          "Directly relevant and comparatively constructive: the attached State/KRG records include KRG-facing meetings and language about Kurdish autonomy, U.S. companies doing business, and the relationship inside federal Iraq. Separate this from Syria/YPG policy and from any unsourced personal warmth.",
        tags: ["secretary", "Iraq", "KRG", "official readouts", "administration signal"],
        facts: [
          ["Current office", "Secretary of State"],
          ["Decision relevance", "Owns State Department policy implementation and official diplomatic wording"],
          ["Kurdistan relevance", "Direct KRG meetings and public readouts are attached in the U.S. country file"],
          ["Evidence caution", "Attribute State readouts to Rubio/State unless a direct presidential statement is attached"]
        ],
        resumeTimeline: [
          { year: "2011", title: "U.S. Senate", summary: "Began service as U.S. Senator from Florida; built foreign-policy profile before joining the executive branch.", url: "https://bioguide.congress.gov/search/bio/R000595" },
          { year: "2025", title: "Secretary of State", summary: "Sworn in as Secretary of State in the second Trump administration.", url: `${stateGov}/biographies/marco-rubio/` }
        ],
        sourceLinks: [
          ["State biography", `${stateGov}/biographies/marco-rubio/`],
          ["Secretary-KRG meeting readout", `${stateGov}/secretary-rubios-meeting-with-iraqi-kurdistan-regional-government-prime-minister-barzani`],
          ["State Department press releases", `${stateGov}/press-releases`]
        ],
        social: [["State Department X", "https://x.com/StateDept"]],
        records: [
          record("2025-01-21", "Appointment", "Secretary of State", "State.gov biography", "State biography page identifies Rubio as Secretary of State.", `${stateGov}/biographies/marco-rubio/`, "Office confirmation"),
          record("2025-05-23", "KRG readout", "Meeting with KRG Prime Minister Masrour Barzani", "State.gov", "State readout is the strongest U.S. ministry-level KRG signal in the local archive.", `${stateGov}/secretary-rubios-meeting-with-iraqi-kurdistan-regional-government-prime-minister-barzani`, "Direct Kurdistan evidence"),
          record("2026", "Record search", "Secretary Rubio statements archive", "State.gov", "Search Rubio statements for Iraq, KRG, Kurdistan, Syria, Iran, Erbil, Peshmerga, and energy language before briefing a conclusion.", `${stateGov}/press-releases`, "Analyst task")
        ],
        monitoringTasks: [
          "Track every Rubio readout mentioning Iraq, KRG, Erbil, Kurdistan, Syria, Turkiye, Iran, Peshmerga, oil, and energy",
          "Separate direct KRG support from broader Iraq federalism language",
          "Compare State wording with White House, Defense, and Embassy Baghdad language"
        ]
      },
      {
        id: "christopher-landau",
        name: "Christopher Landau",
        title: "Deputy Secretary of State",
        bureau: "Office of the Deputy Secretary",
        category: "Deputy minister",
        importance: "Principal deputy and senior manager of diplomatic implementation.",
        officialUrl: `${stateGov}/biographies/christopher-landau/`,
        summary:
          "Landau is a senior deputy-level actor. He matters less for direct Kurdistan statements and more for how the Secretary's policy is carried through bureaus, missions, and interagency coordination.",
        background:
          "Former U.S. Ambassador to Mexico and senior lawyer. His profile should be watched for delegation management, regional travel, and any Iraq/Turkiye/Syria-linked instructions.",
        kurdistanAssessment:
          "No direct KRG stance is attached yet. Treat him as an implementation channel: high authority, low public Kurdistan specificity until a sourced meeting, speech, or cable-adjacent public record is added.",
        tags: ["deputy secretary", "implementation", "mission management"],
        facts: [
          ["Current office", "Deputy Secretary of State"],
          ["Primary relevance", "Can translate secretary-level policy into bureau and mission execution"],
          ["Kurdistan evidence status", "No direct public KRG statement attached yet"]
        ],
        resumeTimeline: [
          { year: "2019", title: "Ambassador to Mexico", summary: "Served as U.S. Ambassador to Mexico before returning to senior State Department leadership.", url: `${stateGov}/biographies/christopher-landau/` },
          { year: "2025", title: "Deputy Secretary", summary: "Confirmed and listed by State as Deputy Secretary of State.", url: `${stateGov}/biographies/christopher-landau/` }
        ],
        sourceLinks: [
          ["State biography", `${stateGov}/biographies/christopher-landau/`],
          ["Deputy Secretary remarks and releases", `${stateGov}/remarks-and-releases-deputy-secretary-of-state`]
        ],
        social: [],
        records: [
          record("2025", "Appointment", "Deputy Secretary of State", "State.gov biography/search", "Official State biography path and public schedules identify Landau as Deputy Secretary.", `${stateGov}/biographies/christopher-landau/`),
          ...landauRemarksAndReleases
        ],
        monitoringTasks: [
          "Search Deputy Secretary releases for Iraq, Syria, Turkiye, Iran, KRG, Erbil, and Peshmerga",
          "Connect any delegation role to the Secretary's KRG-facing readouts"
        ]
      },
      {
        id: "michael-rigas",
        name: "Michael Rigas",
        title: "Deputy Secretary of State for Management and Resources",
        bureau: "Management and Resources",
        category: "Deputy minister",
        importance: "Controls management/resource questions that can affect missions, staffing, consular capacity, and program execution.",
        officialUrl: `${stateGov}/biographies/michael-rigas/`,
        summary:
          "Rigas is not a policy-front figure for Kurdistan, but he is important for whether State has the people, budgets, programs, and mission capacity needed to execute policy in Iraq and the wider region.",
        background:
          "A management-and-resources senior official. For TOR Phi, he belongs in the system because staffing and program cuts can shape how much State can actually see, analyze, and act in the Middle East.",
        kurdistanAssessment:
          "No sourced personal KRG stance. Track him as an institutional-capacity actor: if consular, embassy, assistance, or bureau resources change, the effect may be felt in Baghdad, Erbil, Ankara, or regional evacuation/crisis work.",
        tags: ["management", "resources", "mission capacity", "institutional risk"],
        facts: [
          ["Current office", "Deputy Secretary for Management and Resources"],
          ["Kurdistan relevance", "Indirect, through staffing/resources/mission capacity"],
          ["Evidence status", "Public schedules list Rigas; direct KRG statements not attached"]
        ],
        resumeTimeline: [
          { year: "2025", title: "Deputy Secretary for Management and Resources", summary: "Confirmed as State's senior management/resources deputy.", url: `${stateGov}/biographies/michael-rigas/` },
          { year: "2026", title: "Public schedules", summary: "State public schedules list Deputy Secretary Rigas in department meetings and travel.", url: `${stateGov}/releases/office-of-the-spokesperson/2026/06/public-schedule-june-22-2026` }
        ],
        sourceLinks: [
          ["State biography", `${stateGov}/biographies/michael-rigas/`],
          ["Public schedule example", `${stateGov}/releases/office-of-the-spokesperson/2026/06/public-schedule-june-22-2026`]
        ],
        social: [],
        records: [
          record("2025", "Appointment", "Deputy Secretary for Management and Resources", "State.gov biography/search", "State records identify Rigas as the management/resources deputy.", `${stateGov}/biographies/michael-rigas/`),
          record("2026", "Institutional watch", "State capacity and staffing implications", "State.gov public schedules", "Use this actor to watch whether State's Iraq/NEA/consular capacity is expanding or contracting.", `${stateGov}/releases/office-of-the-spokesperson/2026/06/public-schedule-june-22-2026`, "Capacity evidence")
        ],
        monitoringTasks: [
          "Track embassy/consulate staffing, assistance-program changes, and crisis-response capacity",
          "Flag any cuts or reallocations affecting Iraq, Syria, Turkiye, Iran, or consular evacuation work"
        ]
      },
      {
        id: "allison-hooker",
        name: "Allison M. Hooker",
        title: "Under Secretary for Political Affairs",
        bureau: "Political Affairs",
        category: "Political director",
        importance: "Day-to-day senior political manager over regional bureaus.",
        officialUrl: `${stateGov}/biographies/allison-m-hooker/`,
        summary:
          "Hooker is the U.S. political director equivalent. She matters because regional bureaus, including Near Eastern Affairs, sit inside the political-policy chain that turns leadership intent into diplomatic lines.",
        background:
          "State public schedules list Hooker as Under Secretary for Political Affairs. Her prior public profile is strongest on Asia and national-security work, but in the current post she is structurally relevant to every regional bureau.",
        kurdistanAssessment:
          "No direct KRG stance attached yet. Treat her as high-authority, low-public-specificity for KRG until an Iraq, Turkiye, Syria, or KRG engagement appears.",
        tags: ["political affairs", "regional bureaus", "policy chain"],
        facts: [
          ["Current office", "Under Secretary for Political Affairs"],
          ["Source type", "State public schedules and biography path"],
          ["Kurdistan relevance", "Structural oversight of regional policy; direct evidence pending"]
        ],
        resumeTimeline: [
          { year: "2025", title: "Under Secretary for Political Affairs", summary: "Entered the senior political-policy chain at State.", url: `${stateGov}/biographies/allison-m-hooker/` },
          { year: "2026", title: "Public schedule trail", summary: "State public schedules list Hooker as Under Secretary for Political Affairs.", url: `${stateGov}/releases/office-of-the-spokesperson/2026/04/public-schedule-april-23-2026` }
        ],
        sourceLinks: [
          ["State biography", `${stateGov}/biographies/allison-m-hooker/`],
          ["Public schedule example", `${stateGov}/releases/office-of-the-spokesperson/2026/04/public-schedule-april-23-2026`]
        ],
        social: [],
        records: [
          record("2026-04-23", "Public schedule", "Under Secretary for Political Affairs", "State.gov", "State public schedule names Allison M. Hooker as Under Secretary for Political Affairs.", `${stateGov}/releases/office-of-the-spokesperson/2026/04/public-schedule-april-23-2026`, "Office confirmation")
        ],
        monitoringTasks: [
          "Watch for meetings with Iraqi, Turkish, Syrian, Iranian, or KRG officials",
          "Tie any NEA policy shift back to the political-affairs chain when sourced"
        ]
      },
      {
        id: "robert-palladino",
        name: "Robert J. Palladino",
        title: "Senior Bureau Official, Bureau of Near Eastern Affairs",
        bureau: "Bureau of Near Eastern Affairs",
        category: "Regional bureau leadership",
        importance: "Most important U.S. State Department bureau channel for Iraq/KRG-facing daily policy.",
        officialUrl: `${stateGov}/biographies-list/?results=330`,
        summary:
          "Palladino is the key State Department regional-bureau name in this tranche. NEA is the bureau home for Iraq and much of the Middle East, so even without high-profile public statements, this office is central to U.S. KRG analysis.",
        background:
          "State biography search results identify Robert J. Palladino as Senior Bureau Official for the Bureau of Near Eastern Affairs. He should be tracked with the Iraq desk, Syria policy, Iran crisis work, and Embassy Baghdad/Consulate Erbil posture.",
        kurdistanAssessment:
          "High institutional relevance, direct stance not yet public in this archive. His value is that NEA is where many concrete Iraq/KRG policy choices become lines, meetings, and guidance.",
        tags: ["NEA", "Iraq desk", "regional bureau", "policy operator"],
        facts: [
          ["Current office", "Senior Bureau Official, Bureau of Near Eastern Affairs"],
          ["Kurdistan relevance", "NEA is the State bureau most directly tied to Iraq/KRG policy"],
          ["Evidence status", "State biography search result attached; direct statements pending"]
        ],
        resumeTimeline: [
          { year: "2026", title: "NEA senior official", summary: "State biography list identifies Palladino as Senior Bureau Official for Near Eastern Affairs.", url: `${stateGov}/biographies-list/?results=330` }
        ],
        sourceLinks: [
          ["State biographies list", `${stateGov}/biographies-list/?results=330`],
          ["Bureau of Near Eastern Affairs", `${stateGov}/bureaus-offices/under-secretary-for-political-affairs/bureau-of-near-eastern-affairs/`]
        ],
        social: [],
        records: [
          record("2026", "Office", "Senior Bureau Official, Bureau of Near Eastern Affairs", "State.gov biography list", "State search result names Palladino in the NEA senior role.", `${stateGov}/biographies-list/?results=330`, "Office confirmation"),
          record("Current", "Watch", "NEA Iraq/KRG source queue", "State.gov", "Attach NEA statements, Iraq desk products, Embassy Baghdad/Erbil language, and Syria/Iran regional context.", `${stateGov}/bureaus-offices/under-secretary-for-political-affairs/bureau-of-near-eastern-affairs/`, "Analyst task")
        ],
        monitoringTasks: [
          "Search NEA releases weekly for Iraq, Kurdistan, Erbil, KRG, Peshmerga, Yezidi, Syria, Iran, and Turkiye",
          "Tie desk-level actions to Rubio and Hooker only when the source chain supports it"
        ]
      },
      {
        id: "tommy-pigott",
        name: "Thomas \"Tommy\" Pigott",
        title: "State Department Spokesperson",
        bureau: "Office of the Spokesperson",
        category: "Spokesperson",
        importance: "Attribution channel for official State language.",
        officialUrl: `${stateGov}/bureaus-offices/under-secretary-for-public-diplomacy-and-public-affairs/bureau-of-global-public-affairs/office-of-the-spokesperson`,
        summary:
          "Pigott matters because many U.S. foreign-policy records are attributed to the Office of the Spokesperson. His role is not to make independent KRG policy, but to publish the official line analysts will cite.",
        background:
          "State.gov lists Tommy Pigott as Spokesperson in the Office of the Spokesperson. The archive is especially useful for Rubio call readouts and press statements.",
        kurdistanAssessment:
          "Do not score him as personally friendly or critical toward KRG. Use him as the source-attribution and language-control node for State records.",
        tags: ["spokesperson", "official wording", "source attribution"],
        facts: [
          ["Current office", "State Department Spokesperson"],
          ["Function", "Publishes official statements, media notes, and readouts"],
          ["Kurdistan relevance", "Source chain and language attribution, not personal stance"]
        ],
        resumeTimeline: [
          { year: "2026", title: "Spokesperson", summary: "State.gov identifies Tommy Pigott as State Department Spokesperson.", url: `${stateGov}/bureaus-offices/under-secretary-for-public-diplomacy-and-public-affairs/bureau-of-global-public-affairs/office-of-the-spokesperson` },
          { year: "2026", title: "Press release archive", summary: "Press releases and readouts should be mined for KRG/Iraq/Syria/Iran language.", url: `${stateGov}/press-releases` }
        ],
        sourceLinks: [
          ["Office of the Spokesperson", `${stateGov}/bureaus-offices/under-secretary-for-public-diplomacy-and-public-affairs/bureau-of-global-public-affairs/office-of-the-spokesperson`],
          ["State press releases", `${stateGov}/press-releases`]
        ],
        social: [],
        records: [
          record("2026-04", "Appointment", "Named State Department Spokesperson", "State.gov media note", "State announced Thomas Tommy Pigott as spokesperson.", `${stateGov}/releases/office-of-the-spokesperson/2026/04/department-of-state-announces-appointment-of-thomas-tommy-pigott-as-state-department-spokesperson`, "Office confirmation"),
          record("2026", "Archive", "State press-release stream", "State.gov", "Use this stream to collect all readouts and statements with KRG/Iraq/Syria/Iran terms.", `${stateGov}/press-releases`, "Source archive")
        ],
        monitoringTasks: [
          "Capture every spokesperson-attributed readout mentioning KRG, Iraq, Syria, Turkiye, Iran, Kurds, Erbil, or Peshmerga",
          "Keep press wording separate from private diplomatic interpretation"
        ]
      },
      {
        id: "tom-barrack",
        name: "Thomas Barrack",
        title: "U.S. Ambassador to Turkiye and regional envoy channel",
        bureau: "U.S. Mission Turkiye / regional diplomacy",
        category: "Ambassador",
        importance: "Important because Turkiye policy, Syria policy, and KRG security questions overlap.",
        officialUrl: "https://tr.usembassy.gov/embassy-consulates/ankara/ambassador/",
        summary:
          "Barrack is included because U.S. diplomacy toward Turkiye and Syria directly touches the KRG file: border security, SDF/YPG debates, oil and trade corridors, and Ankara-Erbil-Washington messaging.",
        background:
          "Turkey MFA listed Fidan receiving Tom Barrack as U.S. Ambassador to Turkiye and Special Envoy to Syria during the July 2026 NATO Ankara Summit period.",
        kurdistanAssessment:
          "Potentially high relevance, but not automatically pro-KRG. Track whether he frames Kurdish issues through Turkiye-Syria security, U.S. partnership with Kurdish forces, or KRG economic/diplomatic engagement.",
        tags: ["Turkiye", "Syria", "ambassador", "regional envoy", "KRG-security overlap"],
        facts: [
          ["Current channel", "U.S. Ambassador to Turkiye / regional envoy track"],
          ["Kurdistan relevance", "Turkiye-Syria-KRG overlap makes this post highly watchable"],
          ["Evidence status", "Turkey MFA meeting record attached; direct KRG stance pending"]
        ],
        resumeTimeline: [
          { year: "2025", title: "U.S. Ambassador to Turkiye", summary: "Serves as U.S. ambassador to Turkiye.", url: "https://tr.usembassy.gov/" },
          { year: "2025", title: "Special Envoy for Syria", summary: "Serves in the U.S. Syria envoy channel while posted in Turkiye.", url: "https://tr.usembassy.gov/" }
        ],
        sourceLinks: [
          ["U.S. Embassy Turkiye", "https://tr.usembassy.gov/"],
          ["Turkey MFA latest developments", `${turkiyeMfa}/default.en.mfa`]
        ],
        social: [],
        records: [
          record("2026-07", "Meeting", "Fidan received U.S. Ambassador to Turkiye Tom Barrack", "Turkiye MFA", "Turkey MFA latest developments identify Barrack in a high-level Ankara contact.", `${turkiyeMfa}/default.en.mfa`, "Turkiye/Syria channel")
        ],
        monitoringTasks: [
          "Track Barrack records for Syria, SDF, YPG, PKK, KRG, Erbil, Baghdad, Ankara, and border-security terms",
          "Avoid treating Turkiye-facing security language as a direct KRG stance unless the source says so"
        ]
      }
    ]
  },
  turkey: {
    countryId: "turkey",
    countryName: "Turkiye",
    ministryName: "Republic of Turkiye Ministry of Foreign Affairs",
    nativeName: "Turkiye Cumhuriyeti Disisleri Bakanligi",
    shortName: "Turkish MFA",
    officialUrl: `${turkiyeMfa}/default.en.mfa`,
    description:
      "The Turkish MFA file tracks Fidan and deputy ministers whose portfolios shape Iraq, KRG, energy, border security, NATO, EU, public diplomacy, and institutional staffing.",
    sourceNote:
      "Turkish MFA pages provide minister/deputy biographies, mission histories, education, languages, and latest developments including direct KRG contacts.",
    people: [
      {
        id: "hakan-fidan",
        name: "Hakan Fidan",
        title: "Minister of Foreign Affairs",
        bureau: "Office of the Minister",
        category: "Minister",
        importance: "Primary Turkish diplomatic decision-maker for Iraq/KRG, Syria, security, and regional mediation.",
        officialUrl: `${turkiyeMfa}/minister-of-fa-info.en.mfa`,
        summary:
          "Fidan is the dominant Turkish ministry actor for the Kurdistan file. His biography connects intelligence leadership, foreign-policy/security coordination, TIKA, academia, and current ministerial diplomacy.",
        background:
          "Turkish MFA says Fidan was appointed after the May 28, 2023 presidential elections; previously he served thirteen years as MIT director and held Prime Ministry foreign policy/security roles.",
        kurdistanAssessment:
          "Direct and powerful but securitized: Fidan has repeated KRG contacts, including receiving Qubad Talabani, while his background and Ankara's strategic frame require separating KRG institutional diplomacy from PKK/YPG/Syria security policy.",
        tags: ["minister", "MIT background", "Iraq", "KRG", "security diplomacy"],
        facts: [
          ["Current office", "Minister of Foreign Affairs"],
          ["Prior role", "Director of National Intelligence Organization for 13 years"],
          ["Education", "BA University of Maryland University College; MA and PhD Bilkent University"],
          ["Kurdistan relevance", "Direct meetings with KRG leadership and Iraq/KRG-facing diplomacy"]
        ],
        resumeTimeline: [
          { year: "2003", title: "TIKA president", summary: "Served as president of Turkish Cooperation and Coordination Agency.", url: `${turkiyeMfa}/minister-of-fa-info.en.mfa` },
          { year: "2007", title: "Foreign policy/security", summary: "Deputy Undersecretary for Foreign Policy and Security of the Prime Ministry.", url: `${turkiyeMfa}/minister-of-fa-info.en.mfa` },
          { year: "2010", title: "MIT director", summary: "Began long tenure as Director of the National Intelligence Organization.", url: "https://www.mit.gov.tr/en/baskan.html" },
          { year: "2023", title: "Foreign minister", summary: "Appointed Minister of Foreign Affairs after the 2023 elections.", url: `${turkiyeMfa}/minister-of-fa-info.en.mfa` },
          { year: "2026", title: "KRG contact", summary: "Received KRG Deputy Prime Minister Qubad Talabani in Ankara.", url: `${turkiyeMfa}/sayin-bakanimizin-ikby-basbakan-yardimcisi-kubat-talabani-yi-kabulu-3-temmuz-2026-ankara.en.mfa` }
        ],
        sourceLinks: [
          ["Turkish MFA biography", `${turkiyeMfa}/minister-of-fa-info.en.mfa`],
          ["Fidan received Qubad Talabani", `${turkiyeMfa}/sayin-bakanimizin-ikby-basbakan-yardimcisi-kubat-talabani-yi-kabulu-3-temmuz-2026-ankara.en.mfa`],
          ["Turkish MFA articles", `${turkiyeMfa}/sub.en.mfa?16d70532-2a15-49a7-9a42-dac5b817a0e2=`]
        ],
        social: [["X", "https://x.com/HakanFidan"]],
        records: [
          record("2023-06", "Appointment", "Appointed Minister of Foreign Affairs", "Turkish MFA", "Official biography confirms Fidan's appointment and previous MIT/TIKA/security roles.", `${turkiyeMfa}/minister-of-fa-info.en.mfa`, "Office confirmation"),
          record("2026-07-03", "KRG meeting", "Received Qubad Talabani", "Turkish MFA", "Direct KRG institutional contact in Ankara.", `${turkiyeMfa}/sayin-bakanimizin-ikby-basbakan-yardimcisi-kubat-talabani-yi-kabulu-3-temmuz-2026-ankara.en.mfa`, "Direct Kurdistan evidence"),
          record("2025", "Writing", "OIC in a Transforming World", "Turkish MFA", "Article archive records ministerial writing useful for reading Fidan's regional worldview.", `${turkiyeMfa}/sub.en.mfa?16d70532-2a15-49a7-9a42-dac5b817a0e2=`, "Worldview source")
        ],
        monitoringTasks: [
          "Track every Fidan meeting with KRG, Iraq, Iran, Syria, U.S., and Turkiye security actors",
          "Separate KRG diplomacy from PKK/YPG/SDF security language",
          "Use his thesis and local readable documents as intellectual/background evidence, not standalone KRG stance proof"
        ]
      },
      {
        id: "a-berris-ekinci",
        name: "A. Berris Ekinci",
        title: "Deputy Minister of Foreign Affairs",
        bureau: "Deputy Minister / Energy and Environment background",
        category: "Deputy minister",
        importance: "Important for energy, environment, UN, and ambassadorial channels relevant to Iraq-Turkiye/KRG energy questions.",
        officialUrl: `${turkiyeMfa}/berris-ekinci.en.mfa`,
        imageUrl: `${turkiyeMfa}/images/gallery/Bakanyardimcisi/berris-ekinci.jpg`,
        imageCredit: "Turkish MFA",
        summary:
          "Ekinci is a deputy minister with a long energy and environment portfolio history. She should be watched for Iraq-Turkiye pipeline, water, climate, trade, and energy diplomacy touching the KRG.",
        background:
          "Turkish MFA lists her METU economics degree, Boston College finance master's, Havana ambassadorship, Director General for Energy and Environment, and deputy-minister appointment on May 17, 2024.",
        kurdistanAssessment:
          "Likely relevant through energy rather than identity politics. No direct KRG stance is attached yet, but her energy/environment record makes her important for pipeline and cross-border economic files.",
        tags: ["deputy minister", "energy", "environment", "pipeline", "finance"],
        facts: [
          ["Inauguration date", "17 May 2024"],
          ["Education", "METU economics; Boston College finance"],
          ["Key background", "Director General for Energy and Environment; ambassador to Havana"],
          ["Kurdistan relevance", "Energy/water/environment portfolios can touch KRG-Turkiye economic files"]
        ],
        resumeTimeline: [
          { year: "1994", title: "Entered Turkish MFA", summary: "Career diplomat candidate in OSCE Department.", url: `${turkiyeMfa}/berris-ekinci.en.mfa` },
          { year: "2012", title: "Energy, Water and Environment", summary: "Deputy Director General for Energy, Water and Environment.", url: `${turkiyeMfa}/berris-ekinci.en.mfa` },
          { year: "2016", title: "Ambassador to Havana", summary: "Served as Turkish Ambassador in Havana until 2021.", url: `${turkiyeMfa}/berris-ekinci.en.mfa` },
          { year: "2024", title: "Deputy Minister", summary: "Became Deputy Minister of Foreign Affairs.", url: `${turkiyeMfa}/berris-ekinci.en.mfa` }
        ],
        sourceLinks: [["Turkish MFA biography", `${turkiyeMfa}/berris-ekinci.en.mfa`]],
        social: [],
        records: [
          record("2024-05-17", "Appointment", "Deputy Minister of Foreign Affairs", "Turkish MFA", "Official biography lists inauguration date and career history.", `${turkiyeMfa}/berris-ekinci.en.mfa`, "Office confirmation")
        ],
        monitoringTasks: [
          "Search energy, water, environment, Iraq, pipeline, Ceyhan, KRG, Erbil, and Baghdad references",
          "Attach any Iraq-Turkiye pipeline or water diplomacy records"
        ]
      },
      {
        id: "mehmet-kemal-bozay",
        name: "Mehmet Kemal Bozay",
        title: "Deputy Minister of Foreign Affairs and Director for EU Affairs",
        bureau: "Deputy Minister / EU Affairs",
        category: "Deputy minister",
        importance: "Important for EU/NATO/Europe channels and older Middle East desk experience.",
        officialUrl: `${turkiyeMfa}/mehmet-kemal-bozay.en.mfa`,
        imageUrl: `${turkiyeMfa}/images/gallery/Bakanyardimcisi/mehmet_kemal_bozay.jpg`,
        imageCredit: "Turkish MFA",
        summary:
          "Bozay is a deputy minister whose career includes Tehran, Gulf States, Middle East department work, Tel Aviv, Belgrade, and the EU. For Kurdistan analysis, his value is the combination of regional and European channels.",
        background:
          "Turkish MFA lists Bozay as Deputy Minister and Director for EU Affairs from 2023, with earlier posts including Directorate General for Gulf States, Tehran, UN, Tel Aviv, Middle East department head, and Permanent Delegate to the EU.",
        kurdistanAssessment:
          "No direct KRG stance attached. Treat him as a regional/European policy bridge: useful when KRG issues intersect with EU, migration, Iraq, Iran, or regional security diplomacy.",
        tags: ["deputy minister", "EU affairs", "Middle East desk", "Iran", "Tel Aviv"],
        facts: [
          ["Current office", "Deputy Minister and Director for EU Affairs"],
          ["Education", "METU international relations"],
          ["Regional background", "Gulf States, Tehran, Middle East, Tel Aviv"],
          ["Kurdistan relevance", "Indirect through Iraq/Iran/EU regional diplomacy"]
        ],
        resumeTimeline: [
          { year: "1988", title: "Gulf States", summary: "Junior career diplomat in Directorate General for Gulf States.", url: `${turkiyeMfa}/mehmet-kemal-bozay.en.mfa` },
          { year: "1991", title: "Tehran", summary: "Third Secretary at Turkish Embassy Tehran.", url: `${turkiyeMfa}/mehmet-kemal-bozay.en.mfa` },
          { year: "2003", title: "Middle East department", summary: "Head of Department, Deputy Directorate General for Middle East.", url: `${turkiyeMfa}/mehmet-kemal-bozay.en.mfa` },
          { year: "2019", title: "EU delegate", summary: "Ambassador, Permanent Delegate of Turkiye to the EU.", url: `${turkiyeMfa}/mehmet-kemal-bozay.en.mfa` },
          { year: "2023", title: "Deputy Minister", summary: "Deputy Minister and Director for EU Affairs.", url: `${turkiyeMfa}/mehmet-kemal-bozay.en.mfa` }
        ],
        sourceLinks: [["Turkish MFA biography", `${turkiyeMfa}/mehmet-kemal-bozay.en.mfa`]],
        social: [],
        records: [
          record("2023", "Appointment", "Deputy Minister and Director for EU Affairs", "Turkish MFA", "Official biography lists current role and regional career history.", `${turkiyeMfa}/mehmet-kemal-bozay.en.mfa`, "Office confirmation")
        ],
        monitoringTasks: [
          "Search Bozay records for Iraq, Iran, EU, migration, border security, and Middle East language",
          "Attach any EU-Turkiye discussions that mention Kurds, Iraq, Syria, or regional stability"
        ]
      },
      {
        id: "musa-kulaklikaya",
        name: "Musa Kulaklikaya",
        title: "Deputy Minister of Foreign Affairs",
        bureau: "Deputy Minister / OIC and development cooperation background",
        category: "Deputy minister",
        importance: "Important for development diplomacy, OIC, TIKA, and provincial/administrative knowledge.",
        officialUrl: `${turkiyeMfa}/musa-kulaklikaya.en.mfa`,
        imageUrl: `${turkiyeMfa}/images/gallery/Bakanyardimcisi/musa-kulaklikaya.jpg`,
        imageCredit: "Turkish MFA",
        summary:
          "Kulaklikaya combines TIKA, OIC, SESRIC, and provincial administration experience. For KRG analysis, he belongs in the file because development cooperation and Islamic-organization networks can become soft-power channels.",
        background:
          "Turkish MFA lists his October 2, 2025 deputy-minister inauguration, TIKA presidency, OIC administration/finance, SESRIC leadership, and earlier district/provincial administration.",
        kurdistanAssessment:
          "No direct KRG stance attached. Relevance is through development, OIC, aid, and institutional cooperation rather than hard security.",
        tags: ["deputy minister", "TIKA", "OIC", "development", "soft power"],
        facts: [
          ["Inauguration date", "2 October 2025"],
          ["Key background", "TIKA president; OIC assistant secretary-general; SESRIC director-general"],
          ["Kurdistan relevance", "Development cooperation and OIC networks"]
        ],
        resumeTimeline: [
          { year: "1998", title: "Batman deputy governor", summary: "Served in Batman Governor's Office, a domestic Kurdish-region-adjacent administrative context.", url: `${turkiyeMfa}/musa-kulaklikaya.en.mfa` },
          { year: "2007", title: "TIKA president", summary: "Led Turkish Cooperation and Coordination Agency.", url: `${turkiyeMfa}/musa-kulaklikaya.en.mfa` },
          { year: "2015", title: "SESRIC", summary: "Director-General of OIC statistical/economic research centre.", url: `${turkiyeMfa}/musa-kulaklikaya.en.mfa` },
          { year: "2025", title: "Deputy Minister", summary: "Became Deputy Minister of Foreign Affairs.", url: `${turkiyeMfa}/musa-kulaklikaya.en.mfa` }
        ],
        sourceLinks: [["Turkish MFA biography", `${turkiyeMfa}/musa-kulaklikaya.en.mfa`]],
        social: [],
        records: [
          record("2025-10-02", "Appointment", "Deputy Minister of Foreign Affairs", "Turkish MFA", "Official biography lists his current office and development/OIC career.", `${turkiyeMfa}/musa-kulaklikaya.en.mfa`, "Office confirmation")
        ],
        monitoringTasks: [
          "Search for KRG, Iraq, TIKA, OIC, humanitarian, development, reconstruction, Mosul, Kirkuk, Erbil, and Baghdad terms",
          "Separate soft-power cooperation from security policy"
        ]
      },
      {
        id: "zeki-levent-gumrukcu",
        name: "Zeki Levent Gumrukcu",
        title: "Deputy Minister of Foreign Affairs",
        bureau: "Deputy Minister / NATO and policy planning background",
        category: "Deputy minister",
        importance: "Important for NATO, policy planning, Washington, Tehran, and Brussels channels.",
        officialUrl: `${turkiyeMfa}/zeki-levent-gumrukcu.en.mfa`,
        imageUrl: `${turkiyeMfa}/images/gallery/Bakanyardimcisi/zeki-levent-gumrukcu.jpg`,
        imageCredit: "Turkish MFA",
        summary:
          "Gumrukcu is a deputy minister with NATO, policy planning, Tehran, Washington, Brussels, and UN experience. His profile is valuable where KRG questions overlap with NATO, U.S.-Turkiye relations, Syria, and Iran.",
        background:
          "Turkish MFA lists his February 1, 2025 deputy-minister appointment and posts including Permanent Representative to NATO, Director General for the Americas, ambassador to Brussels/Tbilisi, policy planning, Tehran, and Washington.",
        kurdistanAssessment:
          "No direct KRG stance attached. Treat him as a strategic/diplomatic architecture actor, especially for U.S.-Turkiye-NATO-Syria-Iran files.",
        tags: ["deputy minister", "NATO", "policy planning", "Washington", "Tehran"],
        facts: [
          ["Inauguration date", "1 February 2025"],
          ["Key background", "Permanent Representative to NATO; Director General for Americas; Tehran and Washington postings"],
          ["Kurdistan relevance", "Indirect through NATO, U.S.-Turkiye, Syria, and Iran policy"]
        ],
        resumeTimeline: [
          { year: "1993", title: "Washington", summary: "Third Secretary, Embassy of Turkiye in Washington.", url: `${turkiyeMfa}/zeki-levent-gumrukcu.en.mfa` },
          { year: "1996", title: "Tehran", summary: "Second Secretary, Embassy of Turkiye in Tehran.", url: `${turkiyeMfa}/zeki-levent-gumrukcu.en.mfa` },
          { year: "2012", title: "Spokesperson", summary: "Deputy Director General and Spokesperson of the Ministry.", url: `${turkiyeMfa}/zeki-levent-gumrukcu.en.mfa` },
          { year: "2023", title: "NATO", summary: "Permanent Representative of Turkiye to NATO.", url: `${turkiyeMfa}/zeki-levent-gumrukcu.en.mfa` },
          { year: "2025", title: "Deputy Minister", summary: "Became Deputy Minister of Foreign Affairs.", url: `${turkiyeMfa}/zeki-levent-gumrukcu.en.mfa` }
        ],
        sourceLinks: [["Turkish MFA biography", `${turkiyeMfa}/zeki-levent-gumrukcu.en.mfa`]],
        social: [],
        records: [
          record("2025-02-01", "Appointment", "Deputy Minister of Foreign Affairs", "Turkish MFA", "Official biography confirms current role and NATO/policy planning background.", `${turkiyeMfa}/zeki-levent-gumrukcu.en.mfa`, "Office confirmation")
        ],
        monitoringTasks: [
          "Search NATO, Washington, Syria, Iraq, KRG, YPG, PKK, Iran, and policy-planning references",
          "Watch U.S.-Turkiye statements where KRG/security language appears"
        ]
      },
      {
        id: "h-ali-ozel",
        name: "H. Ali Ozel",
        title: "Deputy Minister of Foreign Affairs",
        bureau: "Deputy Minister / personnel and administrative background",
        category: "Deputy minister",
        importance: "Important for personnel, institutional management, and Washington administrative channels.",
        officialUrl: `${turkiyeMfa}/h-ali-ozel.en.mfa`,
        imageUrl: `${turkiyeMfa}/images/gallery/Bakanyardimcisi/h-ali-ozel.jpg`,
        imageCredit: "Turkish MFA",
        summary:
          "Ozel is an administrative/personnel deputy. He is not the first KRG policy actor, but he matters for how the ministry staffs and manages its diplomatic machine.",
        background:
          "Turkish MFA lists his January 17, 2026 inauguration, prior Director General for Personnel, counsellor role at the Turkish Embassy in Washington, and Prime Ministry/Presidency administrative career.",
        kurdistanAssessment:
          "Indirect relevance. Watch him for staffing, consular, personnel, and Washington-linked ministry management rather than direct KRG statements.",
        tags: ["deputy minister", "personnel", "Washington", "administration"],
        facts: [
          ["Inauguration date", "17 January 2026"],
          ["Key background", "Director General for Personnel; counsellor in Washington"],
          ["Kurdistan relevance", "Indirect institutional capacity and staffing"]
        ],
        resumeTimeline: [
          { year: "2020", title: "Washington", summary: "Counsellor at Embassy of Turkiye in Washington, D.C.", url: `${turkiyeMfa}/h-ali-ozel.en.mfa` },
          { year: "2023", title: "Personnel director", summary: "Director General for Personnel at the MFA.", url: `${turkiyeMfa}/h-ali-ozel.en.mfa` },
          { year: "2026", title: "Deputy Minister", summary: "Became Deputy Minister of Foreign Affairs.", url: `${turkiyeMfa}/h-ali-ozel.en.mfa` }
        ],
        sourceLinks: [["Turkish MFA biography", `${turkiyeMfa}/h-ali-ozel.en.mfa`]],
        social: [],
        records: [
          record("2026-01-17", "Appointment", "Deputy Minister of Foreign Affairs", "Turkish MFA", "Official biography confirms current deputy minister post.", `${turkiyeMfa}/h-ali-ozel.en.mfa`, "Office confirmation")
        ],
        monitoringTasks: [
          "Track personnel or mission-management changes affecting Iraq, Erbil, Baghdad, Tehran, Washington, and regional consulates",
          "Do not infer a KRG stance without public statements"
        ]
      }
    ]
  },
  france: {
    countryId: "france",
    countryName: "France",
    ministryName: "Ministry for Europe and Foreign Affairs",
    nativeName: "Ministere de l'Europe et des Affaires etrangeres",
    shortName: "MEAE / Quai d'Orsay",
    officialUrl: `${franceMfa}/the-ministry/ministers`,
    description:
      "The France foreign-ministry file tracks the minister, delegate ministers, secretary-general, political director, and strategic-analysis institution that shape French policy toward Iraq, Syria, Iran, and the Kurdistan Region.",
    sourceNote:
      "France Diplomatie provides minister biographies and official statements. Some senior civil-servant roles are sourced through ministry communiques and France Diplomatie pages.",
    people: [
      {
        id: "jean-noel-barrot",
        name: "Jean-Noel Barrot",
        title: "Minister for Europe and Foreign Affairs",
        bureau: "Minister's office",
        category: "Minister",
        importance: "Primary French ministry decision-maker and strongest French diplomatic channel in the KRG file.",
        officialUrl: `${franceMfa}/the-ministry/ministers/jean-noel-barrot`,
        summary:
          "Barrot is France's main ministry actor for TOR Phi. His file should combine official French ministry biography, speeches/statements, and KRG-facing Erbil/Syria/Kurdish-rights evidence.",
        background:
          "France Diplomatie says Barrot is Minister for Europe and Foreign Affairs; he previously held Europe and Digital Affairs ministerial roles and was a National Assembly deputy and economist.",
        kurdistanAssessment:
          "Direct and comparatively supportive in the current France file: Barrot has visible KRG-facing engagement and language around Iraq, the Kurdistan Region, Syria's Kurds, ISIS, and coalition continuity.",
        tags: ["minister", "France", "KRG", "Syria", "coalition"],
        facts: [
          ["Current office", "Minister for Europe and Foreign Affairs"],
          ["Background", "Economist; former MP; former Minister Delegate for Europe and Digital Affairs"],
          ["Kurdistan relevance", "Direct KRG engagement and Syria/Kurdish-rights language in attached France records"]
        ],
        resumeTimeline: [
          { year: "2013", title: "MIT/HEC academic", summary: "Taught at MIT before appointment as professor at HEC Paris.", url: `${franceMfa}/the-ministry/ministers/jean-noel-barrot` },
          { year: "2022", title: "Government", summary: "Minister Delegate for Digital Affairs.", url: `${franceMfa}/the-ministry/ministers/jean-noel-barrot` },
          { year: "2024", title: "Europe", summary: "Minister Delegate for Europe before becoming Foreign Minister.", url: `${franceMfa}/the-ministry/ministers/jean-noel-barrot` },
          { year: "2026", title: "Current statements", summary: "France Diplomatie lists current statements and speeches under his profile.", url: `${franceMfa}/the-ministry/ministers/jean-noel-barrot` }
        ],
        sourceLinks: [
          ["France Diplomatie biography", `${franceMfa}/the-ministry/ministers/jean-noel-barrot`],
          ["France Diplomatie ministers", `${franceMfa}/the-ministry/ministers`],
          ["Official statements and speeches", `${franceMfa}/presse-et-ressources/decouvrir-et-informer/actualites/`]
        ],
        social: [["X", "https://x.com/jnbarrot"]],
        records: [
          record("2026", "Biography", "Minister profile", "France Diplomatie", "Official biography confirms ministerial office and career background.", `${franceMfa}/the-ministry/ministers/jean-noel-barrot`, "Office confirmation"),
          record("Current", "Archive", "Minister statements and speeches", "France Diplomatie", "Profile page links to Barrot statements and speeches for ongoing regional analysis.", `${franceMfa}/the-ministry/ministers/jean-noel-barrot`, "Source archive")
        ],
        monitoringTasks: [
          "Track Barrot statements for Iraq, KRG, Kurdistan, Erbil, Syria, SDF, Kurds, ISIS, coalition, Iran, and Turkiye",
          "Separate French support for Iraqi sovereignty from explicit support for the Kurdistan Region"
        ]
      },
      {
        id: "benjamin-haddad",
        name: "Benjamin Haddad",
        title: "Minister Delegate for Europe",
        bureau: "Europe",
        category: "Minister delegate",
        importance: "Important for Europe/U.S./strategic-autonomy networks and has explicit parliamentary Kurds study-group history.",
        officialUrl: `${franceMfa}/the-ministry/ministers/benjamin-haddad`,
        summary:
          "Haddad is not the main KRG ministerial owner, but his background is unusually relevant: France Diplomatie says he worked in Washington think tanks and belonged to a National Assembly study group on Kurds.",
        background:
          "France Diplomatie lists Haddad as a Sciences Po/HEC graduate, former Atlantic Council Europe Center senior director, author on Trump-era America and European strategic autonomy, and minister delegate since September 2024.",
        kurdistanAssessment:
          "Potentially useful and more specific than many Europe ministers because his parliamentary record includes a Kurds study group. Direct KRG stance still needs sourced statements.",
        tags: ["Europe", "Atlantic Council", "Kurds study group", "strategic autonomy"],
        facts: [
          ["Current office", "Minister Delegate for Europe"],
          ["Think tank background", "Atlantic Council Europe Center, 2019-2022"],
          ["Kurdistan relevance", "France Diplomatie biography says he was a member of a study group on Kurds"]
        ],
        resumeTimeline: [
          { year: "2019", title: "Atlantic Council", summary: "Senior Director of the Atlantic Council Europe Center.", url: `${franceMfa}/the-ministry/ministers/benjamin-haddad` },
          { year: "2022", title: "National Assembly", summary: "Elected deputy and served on Foreign Affairs and European Affairs committees.", url: `${franceMfa}/the-ministry/ministers/benjamin-haddad` },
          { year: "2024", title: "Minister Delegate", summary: "Appointed Minister Delegate for Europe.", url: `${franceMfa}/the-ministry/ministers/benjamin-haddad` }
        ],
        sourceLinks: [["France Diplomatie biography", `${franceMfa}/the-ministry/ministers/benjamin-haddad`]],
        social: [["X", "https://x.com/benjaminhaddad"]],
        records: [
          record("2024-09-21", "Appointment", "Minister Delegate for Europe", "France Diplomatie", "Official biography states Haddad was appointed Minister Delegate for Europe.", `${franceMfa}/the-ministry/ministers/benjamin-haddad`, "Office confirmation"),
          record("2022-2024", "Kurdish relevance", "National Assembly study group on Kurds", "France Diplomatie", "Biography says Haddad was a member of study groups including Kurds.", `${franceMfa}/the-ministry/ministers/benjamin-haddad`, "Kurdish issue marker")
        ],
        monitoringTasks: [
          "Search Haddad statements for Kurds, Kurdistan, Iraq, Syria, SDF, Iran, Turkiye, and European strategic autonomy",
          "Use his Kurds study-group entry as a research lead, not a final stance"
        ]
      },
      {
        id: "eleonore-caroit",
        name: "Eleonore Caroit",
        title: "Minister Delegate for Francophonie, International Partnerships and French Nationals Abroad",
        bureau: "International partnerships / French nationals abroad",
        category: "Minister delegate",
        importance: "Important for development partnerships, diaspora/French nationals, and AFD-linked international cooperation.",
        officialUrl: `${franceMfa}/the-ministry/ministers/eleonore-caroit`,
        summary:
          "Caroit is not a direct KRG-security actor, but her international-partnerships portfolio can matter for development, cultural influence, diaspora protection, and AFD-adjacent work.",
        background:
          "France Diplomatie lists her as a lawyer trained in Paris/New York/Geneva, former MP for French citizens abroad in Latin America/Caribbean, Vice-President of the Foreign Affairs Committee, and AFD board member.",
        kurdistanAssessment:
          "Indirect relevance. Watch for development, international partnerships, French nationals abroad, humanitarian, education, and cultural programs that touch Iraq or the Kurdistan Region.",
        tags: ["international partnerships", "AFD", "French nationals abroad", "development"],
        facts: [
          ["Current office", "Minister Delegate for Francophonie, International Partnerships and French Nationals Abroad"],
          ["Background", "International arbitration lawyer; former Foreign Affairs Committee vice-president; AFD board"],
          ["Kurdistan relevance", "Indirect through development and protection of nationals abroad"]
        ],
        resumeTimeline: [
          { year: "2022", title: "National Assembly", summary: "Elected MP for French citizens abroad in Latin America and the Caribbean.", url: `${franceMfa}/the-ministry/ministers/eleonore-caroit` },
          { year: "2022", title: "Foreign Affairs Committee", summary: "Served as vice-president and AFD board member.", url: `${franceMfa}/the-ministry/ministers/eleonore-caroit` },
          { year: "2025", title: "Minister Delegate", summary: "Appointed minister delegate for international partnerships and French nationals abroad.", url: `${franceMfa}/the-ministry/ministers/eleonore-caroit` }
        ],
        sourceLinks: [["France Diplomatie biography", `${franceMfa}/the-ministry/ministers/eleonore-caroit`]],
        social: [],
        records: [
          record("2025-10", "Appointment", "Minister Delegate for international partnerships", "France Diplomatie", "Official biography confirms the current portfolio.", `${franceMfa}/the-ministry/ministers/eleonore-caroit`, "Office confirmation")
        ],
        monitoringTasks: [
          "Search for Iraq, Kurdistan, Erbil, AFD, humanitarian, international partnerships, French nationals, universities, and cultural cooperation",
          "Separate partnership programming from hard security policy"
        ]
      },
      {
        id: "nicolas-forissier",
        name: "Nicolas Forissier",
        title: "Minister Delegate for Foreign Trade and Economic Attractiveness",
        bureau: "Foreign trade and economic attractiveness",
        category: "Minister delegate",
        importance: "Important for trade, investment, business diplomacy, and economic corridors.",
        officialUrl: `${franceMfa}/the-ministry/ministers/nicolas-forissier`,
        summary:
          "Forissier is relevant where France-KRG relations become trade, energy, investment, reconstruction, agriculture, infrastructure, or private-sector diplomacy.",
        background:
          "France Diplomatie lists him as a long-serving deputy, former mayor, foreign-affairs rapporteur on State external action, and minister delegate for trade/economic attractiveness since October 2025.",
        kurdistanAssessment:
          "Indirect but useful. He should be watched for French commercial diplomacy in Iraq/KRG, especially energy, infrastructure, agriculture, and investment-attractiveness language.",
        tags: ["trade", "economic diplomacy", "investment", "business"],
        facts: [
          ["Current office", "Minister Delegate for Foreign Trade and Economic Attractiveness"],
          ["Background", "Former deputy; external-action budget rapporteur; local development and competitiveness focus"],
          ["Kurdistan relevance", "Economic diplomacy and French business presence in Iraq/KRG"]
        ],
        resumeTimeline: [
          { year: "1993", title: "National Assembly", summary: "Served as deputy for Indre at several points.", url: `${franceMfa}/the-ministry/ministers/nicolas-forissier` },
          { year: "2024", title: "Foreign Affairs Committee", summary: "Rapporteur on the State External Action government mission.", url: `${franceMfa}/the-ministry/ministers/nicolas-forissier` },
          { year: "2025", title: "Minister Delegate", summary: "Appointed for foreign trade and economic attractiveness.", url: `${franceMfa}/the-ministry/ministers/nicolas-forissier` }
        ],
        sourceLinks: [["France Diplomatie biography", `${franceMfa}/the-ministry/ministers/nicolas-forissier`]],
        social: [],
        records: [
          record("2025-10", "Appointment", "Minister Delegate for Foreign Trade", "France Diplomatie", "Official biography confirms the current trade/economic-attractiveness portfolio.", `${franceMfa}/the-ministry/ministers/nicolas-forissier`, "Office confirmation")
        ],
        monitoringTasks: [
          "Search Forissier/MEAE records for Iraq, Kurdistan, Erbil, trade, energy, reconstruction, agriculture, infrastructure, and French business",
          "Attach any French company/KRG investment evidence"
        ]
      },
      {
        id: "martin-briens",
        name: "Martin Briens",
        title: "Secretary-General of the Ministry for Europe and Foreign Affairs",
        bureau: "Secretary-General",
        category: "Senior civil servant",
        importance: "Senior administrative and diplomatic coordinator for ministry-level strategic dialogues.",
        officialUrl: `${franceMfa}/presse-et-ressources/decouvrir-et-informer/actualites/communique-conjoint-publie-a-l-issue-du-premier-dialogue-strategique-franco-egyptien`,
        summary:
          "Briens is included as the senior ministry manager visible in strategic-dialogue records. He can matter when Iraq/KRG files become inter-ministerial or regional strategic dialogues.",
        background:
          "France Diplomatie's Egypt-France strategic dialogue communique identifies Secretary-General Martin Briens leading the French delegation with Egypt on April 20, 2026.",
        kurdistanAssessment:
          "No direct KRG stance attached. Relevance is administrative-strategic: if France runs a regional strategic dialogue involving Iraq, Iran, Lebanon, Syria, or trade, this office can coordinate it.",
        tags: ["secretary-general", "strategic dialogue", "regional coordination"],
        facts: [
          ["Current office", "Secretary-General of the French Ministry for Europe and Foreign Affairs"],
          ["Evidence", "Led French delegation in Egypt-France strategic dialogue"],
          ["Kurdistan relevance", "Indirect through regional strategic-dialogue coordination"]
        ],
        resumeTimeline: [
          { year: "2026", title: "Strategic dialogue", summary: "Led French delegation in the first Egypt-France strategic dialogue.", url: `${franceMfa}/presse-et-ressources/decouvrir-et-informer/actualites/communique-conjoint-publie-a-l-issue-du-premier-dialogue-strategique-franco-egyptien` }
        ],
        sourceLinks: [["France Diplomatie Egypt-France strategic dialogue", `${franceMfa}/presse-et-ressources/decouvrir-et-informer/actualites/communique-conjoint-publie-a-l-issue-du-premier-dialogue-strategique-franco-egyptien`]],
        social: [],
        records: [
          record("2026-04-20", "Strategic dialogue", "Led French delegation in Egypt-France strategic dialogue", "France Diplomatie", "Communique identifies Briens as Secretary-General and French delegation lead.", `${franceMfa}/presse-et-ressources/decouvrir-et-informer/actualites/communique-conjoint-publie-a-l-issue-du-premier-dialogue-strategique-franco-egyptien`, "Office evidence")
        ],
        monitoringTasks: [
          "Search secretary-general records for Iraq, Iran, Syria, Lebanon, regional stability, IMEC, and strategic dialogue",
          "Attach any Iraq/KRG-facing strategic dialogue documents"
        ]
      },
      {
        id: "frederic-mondoloni",
        name: "Frederic Mondoloni",
        title: "Political Director",
        bureau: "Political Directorate",
        category: "Political director",
        importance: "Political director-level actor for high-level regional policy coordination.",
        officialUrl: "https://qa.diplomatie.gouv.fr/en/actualites",
        summary:
          "Mondoloni is tracked as France's political director in ministry records. Political directors matter because they manage the hard-policy layer beneath ministers.",
        background:
          "France Diplomatie network pages identify Frederic Mondoloni as Political Director of the ministry in 2026 materials.",
        kurdistanAssessment:
          "No direct KRG stance attached. Relevance is high if French policy toward Iraq, Iran, Syria, Turkiye, ISIS coalition, or KRG becomes a political-director-level issue.",
        tags: ["political director", "regional policy", "senior official"],
        facts: [
          ["Current office", "Political Director, Ministry for Europe and Foreign Affairs"],
          ["Kurdistan relevance", "Regional policy coordination and hard-policy chain"],
          ["Evidence status", "Ministry network/news references attached; direct KRG statements pending"]
        ],
        resumeTimeline: [
          { year: "2026", title: "Political Director", summary: "Referenced in France Diplomatie network/news records as Political Director.", url: "https://qa.diplomatie.gouv.fr/en/actualites" }
        ],
        sourceLinks: [["France Diplomatie news reference", "https://qa.diplomatie.gouv.fr/en/actualites"]],
        social: [],
        records: [
          record("2026", "Office", "Political Director", "France Diplomatie network reference", "Tracked as political director for senior regional-policy monitoring.", "https://qa.diplomatie.gouv.fr/en/actualites", "Office evidence")
        ],
        monitoringTasks: [
          "Search Mondoloni records for Iraq, Syria, Iran, Turkiye, KRG, Kurds, ISIS, and coalition language",
          "Use political-director evidence as policy-chain context unless direct statements are attached"
        ]
      }
    ]
  },
  uk: {
    countryId: "uk",
    countryName: "United Kingdom",
    ministryName: "Foreign, Commonwealth and Development Office",
    nativeName: "Foreign, Commonwealth and Development Office",
    shortName: "FCDO",
    officialUrl: `${govUk}/government/organisations/foreign-commonwealth-development-office`,
    description:
      "The UK FCDO file tracks the Foreign Secretary, Middle East minister, Europe/North America minister, development/Africa minister, permanent under-secretary, political director, and special envoys relevant to Iraq, Iran, Syria, and the Kurdistan Region.",
    sourceNote:
      "GOV.UK provides current minister, management, role, biography, and announcement pages with direct source URLs and official portraits.",
    people: [
      {
        id: "yvette-cooper",
        name: "Yvette Cooper",
        title: "Secretary of State for Foreign, Commonwealth and Development Affairs",
        bureau: "FCDO ministerial team",
        category: "Minister",
        importance: "Top UK diplomatic decision-maker and National Security Council-linked foreign secretary.",
        officialUrl: `${govUk}/government/people/yvette-cooper`,
        imageUrl: "https://assets.publishing.service.gov.uk/media/68d682bc620e762dc586640d/s465_AR109490.jpg",
        imageCredit: "GOV.UK",
        summary:
          "Cooper is the main UK foreign-ministry actor. The Kurdistan file should track her direct contacts, FCDO statements on Iraq/Iran/Syria, and any National Security Council framing.",
        background:
          "GOV.UK says Cooper was appointed Foreign Secretary on September 5, 2025 after serving as Home Secretary, and that the role includes overall FCDO responsibility, intelligence policy, the National Security Council, growth, and migration.",
        kurdistanAssessment:
          "Directly relevant. The UK country file already includes a KRG Presidency readout of Cooper calling Nechirvan Barzani after a drone strike. Treat her as the senior political signal, then verify details through FCDO/KRG readouts.",
        tags: ["foreign secretary", "FCDO", "National Security Council", "KRG call"],
        facts: [
          ["Current office", "Foreign Secretary"],
          ["Appointed", "5 September 2025"],
          ["Role scope", "Overall FCDO responsibility, intelligence policy, National Security Council, growth, migration"],
          ["Kurdistan relevance", "Direct KRG Presidency call evidence exists in the UK file"]
        ],
        resumeTimeline: [
          { year: "2024", title: "MP", summary: "Elected MP for Pontefract, Castleford and Knottingley.", url: `${govUk}/government/people/yvette-cooper` },
          { year: "2024", title: "Home Secretary", summary: "Served as Secretary of State for the Home Department.", url: `${govUk}/government/people/yvette-cooper` },
          { year: "2025", title: "Foreign Secretary", summary: "Appointed Foreign Secretary.", url: `${govUk}/government/people/yvette-cooper` },
          { year: "2026", title: "Global security agenda", summary: "GOV.UK announcements include China/India travel, Iran/Hormuz, Ukraine, Gaza, Sudan, and European strike capabilities.", url: `${govUk}/government/people/yvette-cooper` }
        ],
        sourceLinks: [
          ["GOV.UK biography", `${govUk}/government/people/yvette-cooper`],
          ["FCDO organisation page", `${govUk}/government/organisations/foreign-commonwealth-development-office`],
          ["China/India security trip", `${govUk}/government/news/foreign-secretary-completes-landmark-trip-to-china-and-india-to-bolster-uk-security`]
        ],
        social: [],
        records: [
          record("2025-09-05", "Appointment", "Foreign Secretary", "GOV.UK", "GOV.UK biography confirms appointment date and role scope.", `${govUk}/government/people/yvette-cooper`, "Office confirmation"),
          record("2026-06-06", "Regional policy", "China/India trip included Hormuz, Iran, and Middle East stability", "GOV.UK", "Press release says Cooper focused on freedom of navigation in the Strait of Hormuz, Iran nuclear proliferation, and wider Middle East stability.", `${govUk}/government/news/foreign-secretary-completes-landmark-trip-to-china-and-india-to-bolster-uk-security`, "Regional context")
        ],
        monitoringTasks: [
          "Track Cooper statements on Iraq, Kurdistan, KRG, Erbil, Iran, Syria, Turkiye, Gaza, Hormuz, and energy security",
          "Compare FCDO readouts with KRG Presidency readouts for tone differences"
        ]
      },
      {
        id: "hamish-falconer",
        name: "Hamish Falconer",
        title: "Parliamentary Under-Secretary of State for the Middle East, North Africa, Afghanistan and Pakistan",
        bureau: "Middle East, North Africa, Afghanistan and Pakistan",
        category: "Regional minister",
        importance: "Most direct UK ministerial portfolio holder for Iraq/KRG-region monitoring.",
        officialUrl: `${govUk}/government/people/hamish-falconer`,
        imageUrl: "https://assets.publishing.service.gov.uk/media/68d688b048b997bf604b159a/s465_AR109780.jpg",
        imageCredit: "GOV.UK",
        summary:
          "Falconer is the UK regional minister most likely to touch KRG/Iraq policy in daily public records. His portfolio explicitly covers the Middle East and consular/crisis work.",
        background:
          "GOV.UK says Falconer was appointed FCDO Parliamentary Under-Secretary on July 18, 2024 and his role covers Middle East and North Africa, Afghanistan and Pakistan, and consular/crisis.",
        kurdistanAssessment:
          "High relevance. The UK file already includes KRG Presidency evidence of Nechirvan Barzani meeting Falconer at the Antalya Diplomacy Forum; use this as a direct regional-minister contact but still check FCDO wording.",
        tags: ["Middle East minister", "Iraq", "KRG", "Iran", "crisis"],
        facts: [
          ["Current office", "Parliamentary Under-Secretary of State for MENA, Afghanistan and Pakistan"],
          ["Appointed", "18 July 2024"],
          ["Portfolio", "Middle East and North Africa; Afghanistan and Pakistan; consular and crisis"],
          ["Kurdistan relevance", "Direct KRG meeting evidence in the UK file"]
        ],
        resumeTimeline: [
          { year: "2024", title: "Elected MP", summary: "Elected MP for Lincoln.", url: `${govUk}/government/people/hamish-falconer` },
          { year: "2024", title: "FCDO minister", summary: "Appointed Parliamentary Under-Secretary at FCDO.", url: `${govUk}/government/people/hamish-falconer` },
          { year: "2026", title: "Regional update", summary: "Gave statement to Parliament on Gaza, Iran, Yemen, Syria, and regional issues.", url: `${govUk}/government/speeches/minister-for-the-middle-east-statement-regional-update` }
        ],
        sourceLinks: [
          ["GOV.UK biography", `${govUk}/government/people/hamish-falconer`],
          ["Regional update speech", `${govUk}/government/speeches/minister-for-the-middle-east-statement-regional-update`]
        ],
        social: [["X", "https://x.com/HFalconerMP"]],
        records: [
          record("2024-07-18", "Appointment", "FCDO Parliamentary Under-Secretary", "GOV.UK", "Biography confirms appointment and portfolio.", `${govUk}/government/people/hamish-falconer`, "Office confirmation"),
          record("2026-01-05", "Speech", "Minister for the Middle East regional update", "GOV.UK", "Speech covers Gaza, Iran, Yemen, Syria, and UK regional engagement.", `${govUk}/government/speeches/minister-for-the-middle-east-statement-regional-update`, "Regional policy evidence")
        ],
        monitoringTasks: [
          "Track Falconer statements for Iraq, KRG, Kurdistan, Erbil, Iran, Syria, Turkiye, Kurds, Yazidis, and consular/crisis issues",
          "Treat him as the UK regional-minister lead unless Cooper or the Prime Minister speaks directly"
        ]
      },
      {
        id: "nick-dyer",
        name: "Nick Dyer",
        title: "Interim Permanent Under-Secretary and Second Permanent Under-Secretary",
        bureau: "FCDO management",
        category: "Permanent under-secretary",
        importance: "Most senior diplomatic-service/management adviser and development-program authority.",
        officialUrl: `${govUk}/government/people/nick-dyer`,
        imageUrl: "https://assets.publishing.service.gov.uk/media/68dfeed8dadf7616351e4e0e/s465_Nick-Dyer.jpg",
        imageCredit: "GOV.UK",
        summary:
          "Dyer is the senior official behind the ministerial layer. He matters for diplomatic-service management, development finance, and implementation capacity.",
        background:
          "GOV.UK says Dyer is Interim Permanent Under-Secretary and Second Permanent Under-Secretary, with a development and humanitarian background including DFID leadership.",
        kurdistanAssessment:
          "Indirect but important for aid, development, humanitarian, and mission-capacity questions in Iraq/KRG. Do not infer a personal KRG stance.",
        tags: ["permanent under-secretary", "development", "humanitarian", "management"],
        facts: [
          ["Current office", "Interim Permanent Under-Secretary and Second Permanent Under-Secretary"],
          ["Role scope", "Head of diplomatic service/most senior adviser plus development programme portfolio"],
          ["Kurdistan relevance", "Aid/development/mission-capacity implications"]
        ],
        resumeTimeline: [
          { year: "2006", title: "DFID Malawi", summary: "Head of DFID Malawi.", url: `${govUk}/government/people/nick-dyer` },
          { year: "2020", title: "Famine prevention envoy", summary: "Appointed UK Special Envoy for Famine Prevention and Humanitarian Affairs.", url: `${govUk}/government/people/nick-dyer` },
          { year: "2022", title: "FCDO development", summary: "Director General, Humanitarian and Development.", url: `${govUk}/government/people/nick-dyer` },
          { year: "2026", title: "Interim PUS", summary: "GOV.UK lists him as Interim Permanent Under-Secretary.", url: `${govUk}/government/people/nick-dyer` }
        ],
        sourceLinks: [["GOV.UK biography", `${govUk}/government/people/nick-dyer`]],
        social: [],
        records: [
          record("2026", "Office", "Interim Permanent Under-Secretary", "GOV.UK", "Biography explains PUS and Second PUS roles.", `${govUk}/government/people/nick-dyer`, "Office confirmation")
        ],
        monitoringTasks: [
          "Watch FCDO development and humanitarian programming for Iraq/KRG, Yazidis, refugees, displacement, and reconstruction",
          "Track whether management changes affect Embassy Baghdad or consular capacity"
        ]
      },
      {
        id: "edward-llewellyn",
        name: "Edward Llewellyn",
        title: "Director General Political and Political Director",
        bureau: "Political Directorate",
        category: "Political director",
        importance: "Senior hard-policy official beneath ministers.",
        officialUrl: `${govUk}/government/people/edward-llewellyn`,
        imageUrl: "https://assets.publishing.service.gov.uk/media/61e722c2e90e0703731d3ae6/s465_ed-llewellyn.jpg",
        imageCredit: "GOV.UK",
        summary:
          "Llewellyn is the UK political-director layer. For Kurdistan analysis, he is not a public-facing KRG actor yet, but is structurally important for hard regional policy.",
        background:
          "GOV.UK says Edward Llewellyn was appointed Director General Political at FCDO in September 2025 and previously served as British Ambassador to Italy.",
        kurdistanAssessment:
          "High structural relevance, direct KRG stance pending. Watch for Iraq, Iran, Syria, Turkiye, and coalition-policy coordination.",
        tags: ["political director", "hard policy", "regional security"],
        facts: [
          ["Current office", "Director General Political and Political Director"],
          ["Appointed", "September 2025"],
          ["Kurdistan relevance", "Structural hard-policy chain"]
        ],
        resumeTimeline: [
          { year: "2022", title: "Ambassador to Italy", summary: "Served as British Ambassador to Italy until January 2026.", url: `${govUk}/government/people/edward-llewellyn` },
          { year: "2025", title: "Director General Political", summary: "Appointed to the FCDO political director role.", url: `${govUk}/government/people/edward-llewellyn` }
        ],
        sourceLinks: [["GOV.UK biography", `${govUk}/government/people/edward-llewellyn`]],
        social: [],
        records: [
          record("2025-09", "Appointment", "Director General Political", "GOV.UK", "Biography confirms appointment and previous ambassadorial role.", `${govUk}/government/people/edward-llewellyn`, "Office confirmation")
        ],
        monitoringTasks: [
          "Search for Iraq, Iran, Syria, Turkiye, KRG, Kurdistan, ISIS coalition, sanctions, and security coordination",
          "Use as a policy-chain node unless direct public remarks are attached"
        ]
      },
      {
        id: "stephen-doughty",
        name: "Stephen Doughty",
        title: "Minister of State for Europe, North America and Overseas Territories",
        bureau: "Europe, North America and Overseas Territories",
        category: "Minister of State",
        importance: "Important for U.S./Europe coordination on Iraq, Syria, Iran, NATO, and sanctions.",
        officialUrl: `${govUk}/government/people/stephen-doughty`,
        summary:
          "Doughty is included because UK policy toward Iraq/KRG is often coordinated with the United States, Europe, NATO, and sanctions partners.",
        background:
          "The FCDO organisation page lists Doughty as Minister of State for Europe, North America and Overseas Territories.",
        kurdistanAssessment:
          "Indirect relevance. Watch him when KRG or Iraq appears in UK-U.S., UK-EU, sanctions, NATO, or overseas-territory-related security conversations.",
        tags: ["Europe", "North America", "NATO", "sanctions coordination"],
        facts: [
          ["Current office", "Minister of State for Europe, North America and Overseas Territories"],
          ["Kurdistan relevance", "Indirect through allies, sanctions, and NATO coordination"],
          ["Evidence status", "FCDO organisation listing attached; direct KRG statements pending"]
        ],
        resumeTimeline: [
          { year: "2026", title: "FCDO ministerial team", summary: "Listed by FCDO as Minister of State for Europe, North America and Overseas Territories.", url: `${govUk}/government/organisations/foreign-commonwealth-development-office` }
        ],
        sourceLinks: [
          ["FCDO organisation page", `${govUk}/government/organisations/foreign-commonwealth-development-office`],
          ["GOV.UK biography", `${govUk}/government/people/stephen-doughty`]
        ],
        social: [],
        records: [
          record("2026", "Office", "Minister of State for Europe, North America and Overseas Territories", "GOV.UK", "FCDO organisation page lists Doughty's current portfolio.", `${govUk}/government/organisations/foreign-commonwealth-development-office`, "Office confirmation")
        ],
        monitoringTasks: [
          "Track UK-U.S./UK-EU records mentioning Iraq, KRG, Iran, Syria, Turkiye, NATO, sanctions, and energy",
          "Connect allied coordination to KRG policy only when text supports it"
        ]
      },
      {
        id: "baroness-chapman",
        name: "Baroness Chapman of Darlington",
        title: "Minister of State for International Development and Africa",
        bureau: "International Development and Africa",
        category: "Minister of State",
        importance: "Important for aid, displacement, humanitarian, and development programming.",
        officialUrl: `${govUk}/government/people/jenny-chapman`,
        summary:
          "Baroness Chapman matters where KRG/Iraq issues become humanitarian assistance, displacement, refugees, Yazidi recovery, or development programming.",
        background:
          "The FCDO organisation page lists Baroness Chapman as Minister of State for International Development and Africa.",
        kurdistanAssessment:
          "Indirect but important if UK aid/development programming touches Iraq, refugees, Yazidis, reconstruction, or regional humanitarian stabilization.",
        tags: ["development", "humanitarian", "Africa", "aid"],
        facts: [
          ["Current office", "Minister of State for International Development and Africa"],
          ["Kurdistan relevance", "Aid/development/humanitarian channels"],
          ["Evidence status", "FCDO organisation listing attached; direct KRG statements pending"]
        ],
        resumeTimeline: [
          { year: "2026", title: "FCDO ministerial team", summary: "Listed as Minister of State for International Development and Africa.", url: `${govUk}/government/organisations/foreign-commonwealth-development-office` }
        ],
        sourceLinks: [
          ["FCDO organisation page", `${govUk}/government/organisations/foreign-commonwealth-development-office`],
          ["GOV.UK biography", `${govUk}/government/people/jenny-chapman`]
        ],
        social: [],
        records: [
          record("2026", "Office", "Minister of State for International Development and Africa", "GOV.UK", "FCDO organisation page lists current ministerial portfolio.", `${govUk}/government/organisations/foreign-commonwealth-development-office`, "Office confirmation")
        ],
        monitoringTasks: [
          "Search development records for Iraq, Kurdistan, Yazidis, refugees, IDPs, Mosul, Sinjar, Erbil, and stabilization",
          "Separate humanitarian support from political support for KRG"
        ]
      },
      {
        id: "alison-blackburne",
        name: "Alison Blackburne",
        title: "Special Envoy for the Red Sea and Horn of Africa",
        bureau: "Special representatives",
        category: "Special envoy",
        importance: "Relevant to Red Sea/Hormuz/Gulf maritime context that can affect Iraq/KRG energy and regional security.",
        officialUrl: `${govUk}/government/people/alison-blackburne`,
        summary:
          "Blackburne is not a KRG actor, but Red Sea/Horn/Gulf maritime instability can affect energy routes, sanctions implementation, and UK regional crisis diplomacy.",
        background:
          "FCDO organisation page lists Alison Blackburne among special representatives as Special Envoy for the Red Sea and Horn of Africa.",
        kurdistanAssessment:
          "Indirect regional-security relevance. Watch if Red Sea, Gulf, Hormuz, Iran, and energy-security records intersect with Iraq/KRG.",
        tags: ["special envoy", "Red Sea", "Horn of Africa", "maritime security"],
        facts: [
          ["Current role", "Special Envoy for the Red Sea and Horn of Africa"],
          ["Kurdistan relevance", "Indirect via maritime/energy/regional crisis context"],
          ["Evidence status", "FCDO organisation listing attached"]
        ],
        resumeTimeline: [
          { year: "2026", title: "Special envoy", summary: "Listed in FCDO special representatives.", url: `${govUk}/government/organisations/foreign-commonwealth-development-office` }
        ],
        sourceLinks: [
          ["FCDO organisation page", `${govUk}/government/organisations/foreign-commonwealth-development-office`],
          ["GOV.UK biography", `${govUk}/government/people/alison-blackburne`]
        ],
        social: [],
        records: [
          record("2026", "Office", "Special Envoy for the Red Sea and Horn of Africa", "GOV.UK", "FCDO organisation page lists Blackburne in special representatives.", `${govUk}/government/organisations/foreign-commonwealth-development-office`, "Office confirmation")
        ],
        monitoringTasks: [
          "Watch Red Sea/Hormuz/Gulf records for Iraq, Iran, sanctions, energy, shipping, and crisis language",
          "Only connect to KRG when Iraq/Kurdistan is directly mentioned"
        ]
      }
    ]
  },
  iran: {
    countryId: "iran",
    countryName: "Iran",
    ministryName: "Ministry of Foreign Affairs of the Islamic Republic of Iran",
    nativeName: "Vezarat-e Omoor-e Kharejeh",
    shortName: "Iran MFA",
    officialUrl: iranMfa,
    description:
      "The Iran MFA file tracks Araghchi, political/legal/economic/consular deputies, spokespersons, and IPIS/public-diplomacy channels that shape Tehran's policy toward Iraq, KRG, Kurdish opposition groups, border security, sanctions, and regional transit.",
    sourceNote:
      "Iran MFA pages provide minister/deputy biographies, deputy office categories, statements, events, and current source-search paths.",
    people: [
      {
        id: "seyed-abbas-araghchi",
        name: "Seyed Abbas Araghchi",
        title: "Minister of Foreign Affairs",
        bureau: "Office of the Minister",
        category: "Minister",
        importance: "Primary Iranian diplomatic decision-maker for Iraq/KRG, nuclear talks, regional security, and cross-border policy.",
        officialUrl: `${iranMfa}/portal/ministrinfo/13756`,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/14031011_Abbas_Araghchi_%28cropped%29.jpg/330px-14031011_Abbas_Araghchi_%28cropped%29.jpg",
        imageCredit: "Wikimedia Commons / Tasnim News Agency",
        summary:
          "Araghchi is the central Iranian foreign-ministry actor. His record combines nuclear diplomacy, Japan/Finland ambassadorships, deputy-minister roles, strategic-council work, and current high-level Iraq/KRG contacts.",
        background:
          "Iran MFA biography says Araghchi became Minister of Foreign Affairs on August 21, 2024 after serving in legal/international and political deputy roles, chief nuclear negotiator, ambassador to Tokyo, and secretary of the Strategic Council on Foreign Relations.",
        kurdistanAssessment:
          "Directly relevant and mixed/constrained: the Iran file includes high-level Barzani-Araghchi contacts and economic/security coordination, but Tehran's KRG posture is always filtered through border security, Kurdish opposition groups, Iraq sovereignty, sanctions, and regional deterrence.",
        tags: ["minister", "Iraq", "KRG", "nuclear diplomacy", "border security"],
        facts: [
          ["Current office", "Minister of Foreign Affairs"],
          ["Appointed", "21 August 2024"],
          ["Key background", "Chief nuclear negotiator; deputy foreign minister; ambassador to Japan and Finland"],
          ["Writings", "Iran MFA profile lists books on water diplomacy, JCPOA, cyber/terrorism, and negotiation"]
        ],
        resumeTimeline: [
          { year: "1999", title: "Ambassador to Finland", summary: "Served as Iran's ambassador to Helsinki and accredited ambassador to Tallinn.", url: `${iranMfa}/portal/ministrinfo/13756` },
          { year: "2008", title: "Ambassador to Tokyo", summary: "Served as Iran's ambassador to Japan.", url: `${iranMfa}/portal/ministrinfo/13756` },
          { year: "2013", title: "Chief nuclear negotiator", summary: "Iran MFA lists him as chief nuclear negotiator from 2013 to 2021.", url: `${iranMfa}/portal/ministrinfo/13756` },
          { year: "2024", title: "Foreign Minister", summary: "Became Minister of Foreign Affairs.", url: `${iranMfa}/portal/ministrinfo/13756` }
        ],
        sourceLinks: [
          ["Iran MFA biography", `${iranMfa}/portal/ministrinfo/13756`],
          ["Iran MFA statements", `${iranMfa}/portal/newsagencyshow/699`],
          ["Iran MFA events", `${iranMfa}/portal/newsagencyshow/700`]
        ],
        social: [["Iran MFA X", "https://x.com/IRIMFA_EN"]],
        records: [
          record("2024-08-21", "Appointment", "Minister of Foreign Affairs", "Iran MFA", "Official biography lists August 21, 2024 appointment as minister.", `${iranMfa}/portal/ministrinfo/13756`, "Office confirmation"),
          record("2026-07-09", "Iraq message", "Thanks Iraqi people and government", "Iran MFA", "Araghchi thanked Iraq after funeral ceremonies, showing active Iraq-facing messaging.", `${iranMfa}/portal/newsview/790919/Iranian-FM-Thanks-Iraqi-People-and-Government-for-Hosting-Funeral-of-Martyred-Leader-of-the-Islamic-Revolution`, "Iraq-facing evidence"),
          record("2026-07-12", "Hormuz statement", "Iran-Oman talks on Strait of Hormuz", "Iran MFA", "Spokesperson statement explains foreign-minister talks with Oman on transit/navigation arrangements.", `${iranMfa}/portal/newsview/791053/Foreign-Ministry-Spokesperson-explains-FMs-Saturday-visit-to-Oman`, "Regional security")
        ],
        monitoringTasks: [
          "Track Araghchi records for KRG, Iraq, Erbil, Kurdistan Region, Kurdish opposition groups, border security, energy, sanctions, Hormuz, and Turkiye",
          "Separate economic cooperation with KRG from Tehran's security expectations",
          "Attach his books/thesis/publications when analyzing worldview, not as direct KRG stance"
        ]
      },
      {
        id: "majid-takht-ravanchi",
        name: "Majid Takht Ravanchi",
        title: "Deputy Foreign Minister for Political Affairs",
        bureau: "Political Affairs",
        category: "Political director",
        importance: "Iran's senior political-deputy channel for regional and international diplomacy.",
        officialUrl: `${iranMfa}/portal/organizationpersoninfo/13754`,
        summary:
          "Takht Ravanchi is Iran's political deputy and a core policy-chain actor. His UN, Europe/America, and presidential-office background make him important when Iraq/KRG issues become regional or multilateral diplomacy.",
        background:
          "Iran MFA profile lists University of Kansas, Fordham, and University of Bern education; UN postings; ambassador to Switzerland/Liechtenstein; Deputy Foreign Minister for European and American Affairs; UN Permanent Representative; and Deputy Foreign Minister for Political Affairs in 2024.",
        kurdistanAssessment:
          "High structural relevance, direct KRG stance pending. Track him for Iraq, Turkey, Syria, Iran-U.S., sanctions, and multilateral-policy language.",
        tags: ["political affairs", "UN", "Europe/America", "regional policy"],
        facts: [
          ["Current office", "Deputy Foreign Minister for Political Affairs"],
          ["Background", "UN Permanent Representative; Deputy Foreign Minister for European and American Affairs"],
          ["Kurdistan relevance", "Regional policy chain and multilateral diplomacy"]
        ],
        resumeTimeline: [
          { year: "1992", title: "UN mission", summary: "Ambassador, Permanent Mission of Iran to the UN.", url: `${iranMfa}/portal/organizationpersoninfo/13754` },
          { year: "2002", title: "Switzerland", summary: "Ambassador to Switzerland and Liechtenstein.", url: `${iranMfa}/portal/organizationpersoninfo/13754` },
          { year: "2013", title: "European and American Affairs", summary: "Deputy Foreign Minister for European and American Affairs.", url: `${iranMfa}/portal/organizationpersoninfo/13754` },
          { year: "2019", title: "UN Permanent Representative", summary: "Ambassador and Permanent Representative to the UN.", url: `${iranMfa}/portal/organizationpersoninfo/13754` },
          { year: "2024", title: "Political Affairs", summary: "Deputy Foreign Minister for Political Affairs.", url: `${iranMfa}/portal/organizationpersoninfo/13754` }
        ],
        sourceLinks: [["Iran MFA profile", `${iranMfa}/portal/organizationpersoninfo/13754`]],
        social: [],
        records: [
          record("2024", "Appointment", "Deputy Foreign Minister for Political Affairs", "Iran MFA", "Official profile lists current deputy foreign minister for political affairs role.", `${iranMfa}/portal/organizationpersoninfo/13754`, "Office confirmation"),
          record("2026", "Meeting", "Norway deputy FM also met Takht Ravanchi", "Iran MFA", "Iran MFA event says Norway deputy minister held separate consultations with Takht Ravanchi.", `${iranMfa}/portal/newsview/787794/Norway%E2%80%99s-Deputy-Foreign-Minister-Meets-top-Iranian-diplomat`, "Diplomatic activity")
        ],
        monitoringTasks: [
          "Search for Iraq, KRG, Kurdistan, Turkiye, Syria, sanctions, U.S., UN, and regional stability references",
          "Connect political-deputy records to Araghchi only when source chain supports it"
        ]
      },
      {
        id: "kazem-gharibabadi",
        name: "Kazem Gharibabadi",
        title: "Deputy Foreign Minister for Legal and International Affairs",
        bureau: "Legal and International Affairs",
        category: "Deputy minister",
        importance: "Important for legal/international issues, nuclear diplomacy, human rights, sanctions, and multilateral law.",
        officialUrl: `${iranMfa}/portal/organizationpersoninfo/13758`,
        summary:
          "Gharibabadi is a legal/international-affairs deputy. He is relevant when KRG/Iraq issues enter sanctions, human rights, international law, border agreements, or multilateral disputes.",
        background:
          "Iran MFA profile lists nuclear-diplomacy, IAEA/Vienna, Human Rights Headquarters, judiciary, JCPOA, and legal/international affairs work, with September 2024 deputy-minister appointment.",
        kurdistanAssessment:
          "Indirect but important for legal and sanctions frames. Watch for cross-border security agreements, Iraq sovereignty arguments, human-rights counterclaims, and sanctions language.",
        tags: ["legal affairs", "international law", "sanctions", "IAEA", "human rights"],
        facts: [
          ["Current office", "Deputy Foreign Minister for Legal and International Affairs"],
          ["Appointed", "September 2024"],
          ["Key background", "IAEA/Vienna, nuclear diplomacy, Human Rights Headquarters, judiciary"],
          ["Kurdistan relevance", "Legal/security/sanctions framing"]
        ],
        resumeTimeline: [
          { year: "2005", title: "Nuclear diplomacy", summary: "Secretary of nuclear diplomacy task force and adviser on nuclear affairs.", url: `${iranMfa}/portal/organizationpersoninfo/13758` },
          { year: "2009", title: "The Hague", summary: "Ambassador and permanent representative to international organizations at The Hague.", url: `${iranMfa}/portal/organizationpersoninfo/13758` },
          { year: "2018", title: "Vienna", summary: "Ambassador and permanent representative to international organizations in Vienna.", url: `${iranMfa}/portal/organizationpersoninfo/13758` },
          { year: "2024", title: "Legal and International Affairs", summary: "Deputy Foreign Minister for Legal and International Affairs.", url: `${iranMfa}/portal/organizationpersoninfo/13758` }
        ],
        sourceLinks: [["Iran MFA profile", `${iranMfa}/portal/organizationpersoninfo/13758`]],
        social: [],
        records: [
          record("2024-09", "Appointment", "Deputy Foreign Minister for Legal and International Affairs", "Iran MFA", "Official profile lists September 2024 appointment.", `${iranMfa}/portal/organizationpersoninfo/13758`, "Office confirmation"),
          record("2026", "Meeting", "Norway deputy FM also met Gharibabadi", "Iran MFA", "Iran MFA event says Norway deputy minister held separate consultations with Gharibabadi.", `${iranMfa}/portal/newsview/787794/Norway%E2%80%99s-Deputy-Foreign-Minister-Meets-top-Iranian-diplomat`, "Diplomatic activity")
        ],
        monitoringTasks: [
          "Track legal claims about Iraq sovereignty, border security, sanctions, counterterrorism, Kurdish opposition groups, and international law",
          "Separate legal framing from political willingness to cooperate with KRG"
        ]
      },
      {
        id: "hamid-ghanbari",
        name: "Hamid Ghanbari",
        title: "Deputy Minister for Economic Diplomacy",
        bureau: "Economic Diplomacy",
        category: "Deputy minister",
        importance: "Key economic-diplomacy actor for sanctions, banking, trade, corridors, and economic resilience.",
        officialUrl: `${iranMfa}/portal/organizationpersoninfo/25015`,
        summary:
          "Ghanbari is important for the KRG file because economic diplomacy, sanctions evasion/relief, banking, border trade, and corridors are central to Iran-Iraq-KRG relations.",
        background:
          "Iran MFA lists Ghanbari's Central Bank career from 2005-2024, adviser role in 2024-2025, and Deputy Minister for Economic Diplomacy from 2025, with books on sanctions and banking/payment law.",
        kurdistanAssessment:
          "Indirect but highly relevant for trade. Watch Iran-KRG border crossings, energy, banking, sanctions, and regional transit language.",
        tags: ["economic diplomacy", "sanctions", "banking", "trade", "border crossings"],
        facts: [
          ["Current office", "Deputy Minister for Economic Diplomacy"],
          ["Appointed", "2025"],
          ["Background", "Central Bank of Iran, 2005-2024"],
          ["Publications", "Financial Sanctions against the Islamic Republic of Iran; banking/payment law topics"]
        ],
        resumeTimeline: [
          { year: "2005", title: "Central Bank", summary: "Began long career at the Central Bank of Iran.", url: `${iranMfa}/portal/organizationpersoninfo/25015` },
          { year: "2020", title: "Sanctions book", summary: "Authored a book on financial sanctions and strategies for countering them.", url: `${iranMfa}/portal/organizationpersoninfo/25015` },
          { year: "2025", title: "Economic Diplomacy", summary: "Became Deputy Minister for Economic Diplomacy.", url: `${iranMfa}/portal/organizationpersoninfo/25015` }
        ],
        sourceLinks: [["Iran MFA profile", `${iranMfa}/portal/organizationpersoninfo/25015`]],
        social: [],
        records: [
          record("2025", "Appointment", "Deputy Minister for Economic Diplomacy", "Iran MFA", "Official profile lists current economic diplomacy role.", `${iranMfa}/portal/organizationpersoninfo/25015`, "Office confirmation")
        ],
        monitoringTasks: [
          "Search for Iraq, KRG, Kurdistan, Erbil, border crossings, trade, energy, sanctions, banking, SWIFT, and corridors",
          "Connect economic signals to KRG stance only if Erbil/KRG or Kurdistan Region is directly named"
        ]
      },
      {
        id: "seyyed-kazem-sajjadi",
        name: "Seyyed Kazem Sajjadi",
        title: "Deputy Foreign Minister for Consular, Parliamentary, and Expatriates' Affairs",
        bureau: "Consular, Parliamentary, Iranian Expat Affairs",
        category: "Deputy minister",
        importance: "Important for consular/parliamentary channels and diaspora-related diplomacy.",
        officialUrl: `${iranMfa}/portal/organizationpersoninfo/25005`,
        summary:
          "Sajjadi is relevant because consular, parliamentary, and expatriate channels can touch cross-border travel, detention, diaspora politics, and parliamentary contacts with Iraq/KRG.",
        background:
          "Iran MFA lists Sajjadi as current Deputy Foreign Minister for Consular, Parliamentary, and Expatriates' Affairs, former ambassador to Armenia, director general for Iranian expatriates, and public/cultural affairs official.",
        kurdistanAssessment:
          "Indirect relevance. Watch for consular cases, border mobility, diaspora politics, parliamentary exchanges, Armenia/Caucasus spillover, and Iraq/KRG contacts.",
        tags: ["consular", "parliamentary", "expatriates", "Armenia", "diaspora"],
        facts: [
          ["Current office", "Deputy Foreign Minister for Consular, Parliamentary, and Expatriates' Affairs"],
          ["Key background", "Ambassador to Armenia; Iranian expatriates affairs; public/cultural affairs"],
          ["Kurdistan relevance", "Travel/consular/parliamentary channels"]
        ],
        resumeTimeline: [
          { year: "2015-2019", title: "Ambassador to Armenia", summary: "Served as Iran's ambassador in Yerevan; Armenia's prime ministerial office recorded his outgoing meeting on October 10, 2019.", url: "https://www.primeminister.am/en/press-release/item/2019/10/10/Nikol-Pashinyan-Iran-Ambassador/" },
          { year: "Current", title: "Consular deputy", summary: "Current Deputy Foreign Minister for Consular, Parliamentary, and Expatriates' Affairs.", url: `${iranMfa}/portal/organizationpersoninfo/25005` }
        ],
        sourceLinks: [
          ["Iran MFA profile", `${iranMfa}/portal/organizationpersoninfo/25005`],
          ["Armenian Prime Minister outgoing ambassador release", "https://www.primeminister.am/en/press-release/item/2019/10/10/Nikol-Pashinyan-Iran-Ambassador/"]
        ],
        social: [],
        records: [
          record("Current", "Office", "Consular, Parliamentary, and Expatriates' Affairs", "Iran MFA", "Official profile lists current deputy-minister post.", `${iranMfa}/portal/organizationpersoninfo/25005`, "Office confirmation")
        ],
        monitoringTasks: [
          "Search for Iraq, KRG, border crossings, visas, consular, detained citizens, diaspora, parliament, and Armenia-Caucasus overlap",
          "Do not infer stance from consular role alone"
        ]
      },
      {
        id: "esmaeil-baghaei",
        name: "Esmaeil Baghaei",
        title: "Foreign Ministry Spokesperson",
        bureau: "Spokesperson / public diplomacy",
        category: "Spokesperson",
        importance: "Key attribution channel for official Iranian MFA language.",
        officialUrl: `${iranMfa}/portal/newsagencyshow/720`,
        summary:
          "Baghaei matters because many Iran MFA positions are issued through spokesperson statements. He should be scored as a wording/attribution node unless he makes a personal policy argument.",
        background:
          "Iran MFA current statements repeatedly identify Esmaeil Baghaei as Foreign Ministry Spokesperson, including July 2026 remarks on Oman/Hormuz talks and Qatar-linked vessel allegations.",
        kurdistanAssessment:
          "Use as official language source, not as a personal KRG stance. Watch whether spokesperson statements frame Iraq/KRG through sovereignty, security agreements, anti-U.S./anti-Israel language, or trade/neighborliness.",
        tags: ["spokesperson", "public diplomacy", "official wording", "Hormuz"],
        facts: [
          ["Current role", "Foreign Ministry Spokesperson"],
          ["Evidence", "Iran MFA statements and news archive"],
          ["Kurdistan relevance", "Official wording and source attribution"]
        ],
        resumeTimeline: [
          { year: "2026", title: "Foreign Ministry Spokesperson", summary: "Serves as Iran's Foreign Ministry spokesperson.", url: `${iranMfa}/portal/newsagencyshow/720` },
          { year: "2026", title: "Oman/Hormuz explanation", summary: "Explained Iran-Oman talks on Strait of Hormuz arrangements.", url: `${iranMfa}/portal/newsview/791053/Foreign-Ministry-Spokesperson-explains-FMs-Saturday-visit-to-Oman` }
        ],
        sourceLinks: [
          ["Iran MFA spokesperson archive", `${iranMfa}/portal/newsagencyshow/720`],
          ["Oman/Hormuz explanation", `${iranMfa}/portal/newsview/791053/Foreign-Ministry-Spokesperson-explains-FMs-Saturday-visit-to-Oman`]
        ],
        social: [["Iran MFA X", "https://x.com/IRIMFA_EN"]],
        records: [
          record("2026-07-12", "Statement", "Explained Iran-Oman talks on Hormuz", "Iran MFA", "Statement attributed to Foreign Ministry Spokesperson Esmaeil Baghaei.", `${iranMfa}/portal/newsview/791053/Foreign-Ministry-Spokesperson-explains-FMs-Saturday-visit-to-Oman`, "Official wording"),
          record("2026", "Archive", "Spokesperson statements", "Iran MFA", "Use archive for all official spokesperson positions.", `${iranMfa}/portal/newsagencyshow/720`, "Source archive")
        ],
        monitoringTasks: [
          "Search spokesperson archive for Kurdistan, KRG, Iraq, Erbil, Kurdish groups, border security, Turkiye, sanctions, and energy",
          "Keep spokesperson wording distinct from ministerial meetings and presidential readouts"
        ]
      },
      {
        id: "saeed-khatibzadeh",
        name: "Saeed Khatibzadeh",
        title: "Head of the Center for Political and International Studies",
        bureau: "Institute for Political and International Studies",
        category: "Policy research / diplomatic institute",
        importance: "Important as Iran MFA's policy-research and diplomatic-intellectual node.",
        officialUrl: "https://ipis.ir/en",
        summary:
          "Khatibzadeh is tracked because IPIS can reveal the intellectual and strategic vocabulary behind Iran's foreign policy. This is useful for understanding Tehran's longer-term approach to Iraq, border security, and Kurdish questions.",
        background:
          "Iran MFA event records identify Saeed Khatibzadeh as Head of the Center for Political and International Studies at the Ministry of Foreign Affairs.",
        kurdistanAssessment:
          "Indirect analytic relevance. Use IPIS/publications as worldview and policy-discourse evidence, not proof of operational KRG policy unless tied to official statements.",
        tags: ["IPIS", "policy research", "foreign policy discourse", "public diplomacy"],
        facts: [
          ["Current role", "Head of the Center for Political and International Studies"],
          ["Kurdistan relevance", "Policy discourse and research framing"],
          ["Evidence", "Iran MFA event record"]
        ],
        resumeTimeline: [
          { year: "2026", title: "IPIS head", summary: "Iran MFA event identifies him as head of the Center for Political and International Studies.", url: `${iranMfa}/portal/newsview/787794/Norway%E2%80%99s-Deputy-Foreign-Minister-Meets-top-Iranian-diplomat` }
        ],
        sourceLinks: [
          ["Iran MFA event mentioning Khatibzadeh", `${iranMfa}/portal/newsview/787794/Norway%E2%80%99s-Deputy-Foreign-Minister-Meets-top-Iranian-diplomat`],
          ["IPIS", "https://ipis.ir/en"]
        ],
        social: [],
        records: [
          record("2026", "Office", "Head of Center for Political and International Studies", "Iran MFA", "Norway deputy FM event says Khatibzadeh led the MFA's Center for Political and International Studies.", `${iranMfa}/portal/newsview/787794/Norway%E2%80%99s-Deputy-Foreign-Minister-Meets-top-Iranian-diplomat`, "Office evidence")
        ],
        monitoringTasks: [
          "Search IPIS for Iraq, Kurdistan, Kurds, border security, Iran-Turkiye, Iran-Iraq, sanctions, and regional order",
          "Classify IPIS work as worldview/intellectual-policy evidence unless it is issued as official policy"
        ]
      }
    ]
  }
};

export const foreignMinistryPeople = Object.values(foreignMinistryData).flatMap((ministry) =>
  ministry.people.map((person) => ({ ...person, countryId: ministry.countryId, ministryName: ministry.ministryName }))
);
