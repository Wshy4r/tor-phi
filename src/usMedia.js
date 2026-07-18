export const mediaMethodology = {
  label: "Media Framing Score",
  description:
    "A -100 to +100 analyst score for how an outlet's Kurdistan/KRG coverage tends to read. Positive means coverage often frames Kurds/KRG as partners, victims, stabilizers, or rights-bearing political actors. Negative means coverage often frames them as separatists, militants, destabilizers, corrupt actors, or legal/economic risk. Neutral means descriptive or mixed.",
  factors: [
    ["Direct Kurdistan/KRG specificity", 30],
    ["Favorable vs critical framing", 30],
    ["Source quality and byline clarity", 25],
    ["Repeat author coverage", 15]
  ]
};

export const usMediaOutlets = [
  {
    id: "nytimes",
    name: "The New York Times",
    shortName: "NYT",
    type: "National newspaper",
    influence: "High agenda-setting influence among U.S. policymakers, diplomatic readers, and international media.",
    favorabilityScore: 5,
    favorabilityLabel: "Mixed / analytical",
    coveragePattern:
      "Often analytical and human-rights aware, but usually cautious on Kurdish independence and U.S. military commitments.",
    archiveUrl: "https://www.nytimes.com/search?query=Kurdistan",
    rationale:
      "NYT needs archive ingestion before scoring strongly. The author layer tracks Alissa J. Rubin because her Iraq/Kurdistan-adjacent conflict reporting is important for future mention intake.",
    watchTerms: ["Kurdistan", "KRG", "Iraqi Kurds", "Syrian Kurds", "Peshmerga", "Yazidis"]
  },
  {
    id: "washington-post",
    name: "The Washington Post",
    shortName: "WaPo",
    type: "National newspaper",
    influence: "Very high Washington national-security and policy audience.",
    favorabilityScore: 12,
    favorabilityLabel: "Cautiously sympathetic",
    coveragePattern:
      "Frames Kurds as strategically important but vulnerable to abandonment, escalation, and great-power bargaining.",
    archiveUrl: "https://www.washingtonpost.com/search/?query=Kurdistan",
    rationale:
      "Recent coverage emphasizes the strategic dilemma for Iraqi and Iranian Kurds, including risk of Iranian retaliation and U.S. pressure.",
    watchTerms: ["Trump Kurds Iran", "Kurdish leaders", "Erbil", "Kurdistan region", "KRG"]
  },
  {
    id: "wsj",
    name: "The Wall Street Journal",
    shortName: "WSJ",
    type: "Business and foreign-affairs newspaper",
    influence: "High among business, defense, conservative, and foreign-policy readers.",
    favorabilityScore: 18,
    favorabilityLabel: "Strategic / partner-leaning",
    coveragePattern:
      "Often treats Kurds as relevant security partners, while scrutinizing independence feasibility, energy, and regional backlash.",
    archiveUrl: "https://www.wsj.com/search?query=Kurdistan",
    rationale:
      "WSJ has multiple Kurdistan-specific records, including independence, Iranian Kurds, and U.S. pullback coverage.",
    watchTerms: ["Kurdistan", "Iraqi Kurds", "Iranian Kurds", "Kurdish independence", "Kirkuk"]
  },
  {
    id: "cnn",
    name: "CNN",
    shortName: "CNN",
    type: "Cable and digital news network",
    influence: "High mass-audience and international broadcast reach.",
    favorabilityScore: 10,
    favorabilityLabel: "Risk-aware / field-reporting",
    coveragePattern:
      "Visual and correspondent-led coverage often emphasizes civilian vulnerability, U.S. policy shifts, and battlefield risk.",
    archiveUrl: "https://www.cnn.com/search?q=Kurdistan",
    rationale:
      "Seeded records track CNN's 2026 Erbil/KRG field reporting and Kurdish-force intelligence reporting; direct CNN article ingestion should be expanded.",
    watchTerms: ["Clarissa Ward Erbil", "Kurdish forces", "CIA Kurdish", "KRG official", "Iraqi Kurdistan"]
  },
  {
    id: "fox-news",
    name: "Fox News",
    shortName: "Fox",
    type: "Cable and digital news network",
    influence: "High Republican and mass-audience reach.",
    favorabilityScore: -8,
    favorabilityLabel: "Security-critical",
    coveragePattern:
      "Often frames Kurdish armed groups through security, border, terrorism, and regional-destabilization lenses, while also platforming pro-KRG partnership messages.",
    archiveUrl: "https://www.foxnews.com/search-results/search?q=Kurdistan",
    rationale:
      "Current seeded item frames armed Kurdish groups as a regional threat around Iran, but other Fox segments include favorable KRG partnership framing.",
    watchTerms: ["Kurdish fighters", "Kurdistan PM", "Peshmerga", "Iran border", "Iraq"]
  },
  {
    id: "ap",
    name: "The Associated Press",
    shortName: "AP",
    type: "Wire service",
    influence: "Very high because AP copy is republished across U.S. and global local-news ecosystems.",
    favorabilityScore: 7,
    favorabilityLabel: "Humanitarian / neutral",
    coveragePattern:
      "Generally factual and cautious, with strong field reporting on displaced Kurds, Iranian Kurdish groups, and Iraq/KRG risk.",
    archiveUrl: "https://apnews.com/search?q=Kurdistan",
    rationale:
      "AP has detailed 2026 field coverage from Irbil, Qushtapa, and Kurdish opposition contexts, with named reporters and photographers.",
    watchTerms: ["Irbil", "Koya", "Iranian Kurds", "Kurdish dissident groups", "PKK", "Kurdistan Region"]
  },
  {
    id: "reuters",
    name: "Reuters",
    shortName: "Reuters",
    type: "Wire service",
    influence: "Very high among diplomats, markets, global newsrooms, and policy analysts.",
    favorabilityScore: 0,
    favorabilityLabel: "Neutral / market-security",
    coveragePattern:
      "Usually concise and event-driven, with emphasis on oil, conflict risk, border security, and official statements.",
    archiveUrl: "https://www.reuters.com/site-search/?query=Kurdistan",
    rationale:
      "Reuters should be treated as a required ingestion source because other outlets cite its Kurdistan/Iran-border reporting.",
    watchTerms: ["Kurdistan oil", "Iraq Turkey pipeline", "Kurdish fighters", "Iran Iraq border", "Erbil"]
  },
  {
    id: "npr",
    name: "NPR",
    shortName: "NPR",
    type: "Public radio and digital news",
    influence: "High among policy-aware public audiences and U.S. civic institutions.",
    favorabilityScore: 15,
    favorabilityLabel: "Human-context sympathetic",
    coveragePattern:
      "Often foregrounds lived experience, civilian risk, and local Kurdish voices through correspondent interviews.",
    archiveUrl: "https://www.npr.org/search?query=Kurdistan",
    rationale:
      "Jane Arraf's Iraq/Kurdistan reporting gives NPR strong field-context value and named-source depth.",
    watchTerms: ["Jane Arraf", "Kurdistan Region", "Qubad Talabani", "Iranian Kurds", "Iraqi Kurds"]
  },
  {
    id: "bloomberg",
    name: "Bloomberg",
    shortName: "Bloomberg",
    type: "Business and markets news",
    influence: "High among finance, energy, sanctions, and policy readers.",
    favorabilityScore: 2,
    favorabilityLabel: "Energy / market neutral",
    coveragePattern:
      "Expected to emphasize oil exports, Iraq-Turkey pipeline politics, energy contracts, sanctions, and investment risk.",
    archiveUrl: "https://www.bloomberg.com/search?query=Kurdistan",
    rationale:
      "Bloomberg requires archive ingestion before assigning author-level signals. It belongs in the top-ten set because KRG energy and fiscal disputes are market stories.",
    watchTerms: ["Kurdistan oil", "KRG salaries", "Iraq-Turkey pipeline", "Erbil energy", "Dana Gas"]
  },
  {
    id: "axios",
    name: "Axios",
    shortName: "Axios",
    type: "Washington digital news",
    influence: "High among U.S. political, national-security, and congressional readers.",
    favorabilityScore: 6,
    favorabilityLabel: "Strategic / scoop-driven",
    coveragePattern:
      "Short, official-source-driven coverage of U.S. decisions, calls, intelligence claims, and Washington debate around Kurdish forces.",
    archiveUrl: "https://www.axios.com/search?query=Kurdistan",
    rationale:
      "Axios has relevant 2026 top-story and scoop records around Trump, Iran, Iraqi Kurds, and intelligence claims.",
    watchTerms: ["Trump Kurdish leaders", "Iran war Kurds", "Barak Ravid", "Marc Caputo", "Iraqi Kurds"]
  }
];

export const usMediaAuthors = [
  {
    id: "media-alissa-rubin",
    name: "Alissa J. Rubin",
    outlet: "The New York Times",
    role: "Senior international correspondent / former Baghdad bureau chief",
    beat: ["Iraq", "conflict", "Yazidis", "Middle East"],
    profileUrl: "https://www.pulitzer.org/winners/alissa-j-rubin",
    stanceSignal: "Track for deep Iraq/Kurdistan-adjacent reporting; no current outlet-level stance assigned from this prototype.",
    sourceNote: "Pulitzer profile identifies Rubin's NYT Baghdad and Iraq/Afghanistan reporting background."
  },
  {
    id: "media-susannah-george",
    name: "Susannah George",
    outlet: "The Washington Post",
    role: "Global affairs and national security reporter",
    beat: ["Iraq", "national security", "Middle East", "U.S. foreign policy"],
    profileUrl: "https://www.washingtonpost.com/people/susannah-george/",
    stanceSignal: "Risk-aware framing: Kurds as important but exposed to escalation and U.S. policy reversals.",
    sourceNote: "Washington Post Live transcript identifies George as covering global affairs and national security."
  },
  {
    id: "media-mustafa-salim",
    name: "Mustafa Salim",
    outlet: "The Washington Post",
    role: "Baghdad bureau reporter",
    beat: ["Iraq", "Baghdad", "Kurdistan Region", "security"],
    profileUrl: "https://www.washingtonpost.com/people/mustafa-salim/",
    stanceSignal: "Grounded Iraq-context reporting; important for Baghdad-KRG and security stories.",
    sourceNote: "Washington Post profile lists him in the Baghdad bureau and links to the 2026 Kurds/Iran story."
  },
  {
    id: "media-yaroslav-trofimov",
    name: "Yaroslav Trofimov",
    outlet: "The Wall Street Journal",
    role: "Chief foreign-affairs correspondent",
    beat: ["foreign affairs", "Middle East", "war reporting", "Kurdish independence"],
    profileUrl: "https://www.wsj.com/news/author/yaroslav-trofimov",
    stanceSignal: "Often strategic and historically informed; coverage has treated Kurds as serious regional actors while probing feasibility.",
    sourceNote: "WSJ Kurdistan independence pieces identify Trofimov as author."
  },
  {
    id: "media-margherita-stancati",
    name: "Margherita Stancati",
    outlet: "The Wall Street Journal",
    role: "Reporter",
    beat: ["Middle East", "Iran", "conflict"],
    profileUrl: "https://www.wsj.com/news/author/margherita-stancati",
    stanceSignal: "Conflict-focused framing around Iranian Kurdish groups and regional escalation.",
    sourceNote: "WSJ 2026 Iran/Kurds article lists Stancati as a byline."
  },
  {
    id: "media-anat-peled",
    name: "Anat Peled",
    outlet: "The Wall Street Journal",
    role: "Reporter covering the Middle East",
    beat: ["Middle East", "Iran", "security"],
    profileUrl: "https://www.wsj.com/news/author/anat-peled",
    stanceSignal: "Security and conflict lens; track for Iranian Kurdish and regional-war pieces.",
    sourceNote: "WSJ 2026 Iran/Kurds article lists Peled as a byline."
  },
  {
    id: "media-alexander-ward",
    name: "Alexander Ward",
    outlet: "The Wall Street Journal",
    role: "National-security reporter",
    beat: ["U.S. national security", "foreign policy", "Middle East"],
    profileUrl: "https://www.wsj.com/news/author/alexander-ward",
    stanceSignal: "Washington-policy lens on Kurdish forces and U.S. strategy.",
    sourceNote: "WSJ 2026 Iran/Kurds article lists Ward as a byline."
  },
  {
    id: "media-isabel-coles",
    name: "Isabel Coles",
    outlet: "The Wall Street Journal",
    role: "Reporter",
    beat: ["Iraq", "Kurdistan", "conflict", "referendum"],
    profileUrl: "https://www.wsj.com/news/author/isabel-coles",
    stanceSignal: "Useful for referendum-era Iraq/KRG coverage.",
    sourceNote: "WSJ 2017 referendum backlash article lists Coles in Erbil."
  },
  {
    id: "media-ali-nabhan",
    name: "Ali A. Nabhan",
    outlet: "The Wall Street Journal",
    role: "Reporter",
    beat: ["Iraq", "Baghdad", "energy", "politics"],
    profileUrl: "https://www.wsj.com/news/author/ali-a-nabhan",
    stanceSignal: "Useful for Baghdad-side Iraq/KRG dispute coverage.",
    sourceNote: "WSJ 2017 referendum backlash article lists Nabhan."
  },
  {
    id: "media-clarissa-ward",
    name: "Clarissa Ward",
    outlet: "CNN",
    role: "Chief international correspondent",
    beat: ["war reporting", "Middle East", "Erbil", "KRG"],
    profileUrl: "https://www.cnn.com/profiles/clarissa-ward-profile",
    stanceSignal: "Field-reporting lens emphasizing civilian risk, missile/drone danger, and KRG fear of escalation.",
    sourceNote: "CNN social/video and transcript records place Ward in Iraq's Kurdish region during 2026 Iran-war coverage."
  },
  {
    id: "media-natasha-bertrand",
    name: "Natasha Bertrand",
    outlet: "CNN",
    role: "National security reporter",
    beat: ["U.S. intelligence", "national security", "foreign policy"],
    profileUrl: "https://www.cnn.com/profiles/natasha-bertrand",
    stanceSignal: "Intelligence-sourcing lens around reports of U.S. support for Kurdish forces.",
    sourceNote: "CNN-referenced reporting listed Bertrand among authors of Kurdish-force intelligence story."
  },
  {
    id: "media-qassim-abdul-zahra",
    name: "Qassim Abdul-Zahra",
    outlet: "The Associated Press",
    role: "AP reporter",
    beat: ["Iraq", "Baghdad", "security", "Middle East"],
    profileUrl: "https://apnews.com/author/qassim-abdul-zahra",
    stanceSignal: "Field-source reporting on Iraq/KRG security risk.",
    sourceNote: "AP 2026 Kurdish dissident groups article lists Abdul-Zahra as a byline."
  },
  {
    id: "media-stella-martany",
    name: "Stella Martany",
    outlet: "The Associated Press",
    role: "AP reporter",
    beat: ["Iraq", "Kurdistan Region", "PKK", "security"],
    profileUrl: "https://apnews.com/author/stella-martany",
    stanceSignal: "Tracks northern Iraq/Kurdish security developments.",
    sourceNote: "AP 2026 Kurdish dissident groups article lists Martany as a byline; AP author page shows Kurdish-region stories."
  },
  {
    id: "media-rashid-yahya",
    name: "Rashid Yahya",
    outlet: "The Associated Press",
    role: "AP visual journalist",
    beat: ["Irbil", "Koya", "Kurdish opposition groups", "visual evidence"],
    profileUrl: "https://apnews.com/search?q=Rashid%20Yahya",
    stanceSignal: "Important visual-source contributor for Erbil/Koya/Kurdish militia coverage.",
    sourceNote: "AP 2026 Kurdish dissident groups article credits Yahya video and photography from Irbil/Koya."
  },
  {
    id: "media-samya-kullab",
    name: "Samya Kullab",
    outlet: "The Associated Press",
    role: "AP correspondent",
    beat: ["Iraq", "Ukraine", "Middle East", "displacement"],
    profileUrl: "https://apnews.com/author/samya-kullab",
    stanceSignal: "Humanitarian and field-reporting lens on displaced Iranian Kurds and KRG vulnerability.",
    sourceNote: "AP profile says Kullab previously covered Iraq and the wider Middle East from Baghdad."
  },
  {
    id: "media-emma-bussey",
    name: "Emma Bussey",
    outlet: "Fox News",
    role: "Breaking news writer",
    beat: ["world news", "foreign policy", "security", "breaking news"],
    profileUrl: "https://www.foxnews.com/person/b/emma-bussey",
    stanceSignal: "Security-critical framing in the seeded Iran-border Kurdish fighter story.",
    sourceNote: "Fox News profile identifies Bussey as a breaking news writer; the seeded article is by Bussey."
  },
  {
    id: "media-jane-arraf",
    name: "Jane Arraf",
    outlet: "NPR",
    role: "Iraq correspondent",
    beat: ["Iraq", "Kurdistan Region", "Iran", "Kurdish politics"],
    profileUrl: "https://www.npr.org/people/7633157/jane-arraf",
    stanceSignal: "Human-context and local-voice framing, especially around KRG fear of retaliation and refusal to be used as proxy forces.",
    sourceNote: "NPR/WUNC transcript places Arraf in Iraqi Kurdistan interviewing Qubad Talabani."
  },
  {
    id: "media-herb-scribner",
    name: "Herb Scribner",
    outlet: "Axios",
    role: "Breaking news reporter / audience journalist",
    beat: ["breaking news", "politics", "national stories"],
    profileUrl: "https://www.axios.com/local/austin/authors/hscribner",
    stanceSignal: "Digest/summarization lens for fast Washington-readable Kurdistan/Iran updates.",
    sourceNote: "Axios top-story page lists Scribner on the Iraqi Kurds pressure story."
  },
  {
    id: "media-barak-ravid",
    name: "Barak Ravid",
    outlet: "Axios",
    role: "Foreign-policy reporter",
    beat: ["Middle East", "U.S. foreign policy", "Israel", "Iran"],
    profileUrl: "https://www.axios.com/authors/barak-ravid",
    stanceSignal: "Scoop-driven official-source lens around Trump, Israel, Iran, and Kurdish leaders.",
    sourceNote: "Axios 2026 Kurds/Iran scoop records identify Ravid on Trump/Kurdish leader coverage."
  },
  {
    id: "media-marc-caputo",
    name: "Marc Caputo",
    outlet: "Axios",
    role: "Political reporter",
    beat: ["Trump administration", "U.S. politics", "foreign-policy politics"],
    profileUrl: "https://www.axios.com/authors/marc-caputo",
    stanceSignal: "Trump-administration political lens on Kurdish leader outreach and Iran-war decision-making.",
    sourceNote: "Axios 2026 Kurds/Iran scoop records identify Caputo on Trump/Kurdish leader coverage."
  }
];

export const usMediaMentions = [
  {
    id: "media-wapo-2026-trump-kurds",
    outletId: "washington-post",
    date: "2026-03-05",
    title: "Trump calls on Kurds to aid U.S. effort in Iran, offers support",
    url: "https://www.washingtonpost.com/national-security/2026/03/05/trump-iran-kurds-iraq/",
    authorIds: ["media-susannah-george", "media-mustafa-salim"],
    framing: "Mixed / strategic risk",
    score: 6,
    topics: ["Iran", "KRG", "U.S. policy", "security risk"],
    summary:
      "Frames Kurds as strategically important to U.S. Iran policy while emphasizing fears of retaliation, limited arms, internal divisions, and the risk of being pulled into a wider war.",
    evidenceNote: "Search result and Washington Post author/profile pages identify the story and relevant Iraq/Kurds reporting context."
  },
  {
    id: "media-wsj-2026-iran-kurds",
    outletId: "wsj",
    date: "2026-03-05",
    title: "Why the First Shots in an Iran Ground War Could Come From the Kurds",
    url: "https://www.wsj.com/world/middle-east/why-the-first-shots-in-an-iran-ground-war-could-come-from-the-kurds-7b047477",
    authorIds: ["media-margherita-stancati", "media-anat-peled", "media-alexander-ward"],
    framing: "Strategic / cautious",
    score: 8,
    topics: ["Iranian Kurds", "war planning", "U.S. policy", "regional escalation"],
    summary:
      "Treats Kurdish armed groups as potentially consequential but not yet ready for a realistic ground campaign; useful for strategic-risk analysis rather than simple pro/anti framing.",
    evidenceNote: "WSJ page lists Stancati, Peled, and Ward as bylines and describes Kurdish areas as a possible flashpoint."
  },
  {
    id: "media-wsj-2017-independence",
    outletId: "wsj",
    date: "2017-09-28",
    title: "For Kurds of Iraq, What Kind of Independence, If Any?",
    url: "https://www.wsj.com/articles/for-kurds-of-iraq-what-kind-of-independenceif-any-1506591002",
    authorIds: ["media-yaroslav-trofimov"],
    framing: "Analytical / skeptical-supportive",
    score: 10,
    topics: ["independence referendum", "KRG", "statehood", "regional diplomacy"],
    summary:
      "Gives serious treatment to Kurdish independence aspirations while warning about referendum backlash and the practical constraints of statehood.",
    evidenceNote: "WSJ page lists Trofimov and describes the referendum's diplomatic consequences."
  },
  {
    id: "media-wsj-2017-referendum-backlash",
    outletId: "wsj",
    date: "2017-10-25",
    title: "Iraqi Kurds Offer Concession Amid Referendum Backlash",
    url: "https://www.wsj.com/articles/leader-of-iraqi-kurds-faces-backlash-over-referendum-1508924454",
    authorIds: ["media-isabel-coles", "media-ali-nabhan", "media-yaroslav-trofimov"],
    framing: "Critical / consequences",
    score: -6,
    topics: ["referendum backlash", "Baghdad-KRG", "Kirkuk", "U.S. mediation"],
    summary:
      "Frames the referendum as creating severe consequences for Iraqi Kurds, including Baghdad pressure and U.S. attempts to ease tensions.",
    evidenceNote: "WSJ page lists Coles, Nabhan, and Trofimov and quotes Abadi's view that the vote set Kurdish ambitions back."
  },
  {
    id: "media-ap-2026-kurdish-dissidents",
    outletId: "ap",
    date: "2026-03-05",
    title: "Kurdish dissident groups say they are preparing to join the fight against Iran with US support",
    url: "https://apnews.com/article/kurdish-dissident-groups-iran-war-iraq-f76efe372becb7d80d3ed026791e67ba",
    authorIds: ["media-qassim-abdul-zahra", "media-stella-martany", "media-rashid-yahya"],
    framing: "Neutral / security risk",
    score: 2,
    topics: ["Iranian Kurdish groups", "Irbil", "Koya", "U.S. support", "retaliation"],
    summary:
      "Detailed field reporting that names Kurdish opposition capacity but foregrounds Iraqi Kurdish hesitation and the risk of Iranian or militia retaliation.",
    evidenceNote: "AP page lists Abdul-Zahra, Martany, and Yahya as bylines and includes Irbil/Koya visual evidence."
  },
  {
    id: "media-ap-2026-exiled-iranian-kurds",
    outletId: "ap",
    date: "2026-03-20",
    title: "Exiled Iranian Kurds in Iraq say they will return only if Iran's theocracy falls",
    url: "https://apnews.com/article/iran-war-kurds-iraq-b330da59ccef665fc0db18d33b106083",
    authorIds: ["media-samya-kullab"],
    framing: "Humanitarian / sympathetic",
    score: 20,
    topics: ["Iranian Kurds", "Qushtapa", "Kawa Camp", "displacement", "return"],
    summary:
      "Strong human-context story about displacement, mistrust of foreign powers, lack of rights, and the desire of Iranian Kurds in Iraq to return home safely.",
    evidenceNote: "AP page lists Samya Kullab and describes Kawa Camp, Qushtapa, and Iranian Kurdish refugees."
  },
  {
    id: "media-npr-2026-kurds-not-guns-for-hire",
    outletId: "npr",
    date: "2026-03-09",
    title: "Iraqi Kurds rush to quash reports of Kurds leading uprising in Iran",
    url: "https://www.wunc.org/2026-03-09/iraqi-kurds-rush-to-quash-reports-of-kurds-leading-uprising-in-iran",
    authorIds: ["media-jane-arraf"],
    framing: "Sympathetic / de-escalation",
    score: 18,
    topics: ["Qubad Talabani", "Iran", "KRG", "proxy risk", "de-escalation"],
    summary:
      "Centers Kurdish leadership's refusal to be treated as a proxy force and highlights the Kurdistan Region's fear of retaliation from Iran and Iran-backed militias.",
    evidenceNote: "WUNC/NPR transcript identifies Jane Arraf reporting from Iraqi Kurdistan and interviewing Qubad Talabani."
  },
  {
    id: "media-cnn-2026-clarissa-ward-erbil",
    outletId: "cnn",
    date: "2026-03-04",
    title: "CNN field reports from Iraq's Kurdish region during Iran-war escalation",
    url: "https://transcripts.cnn.com/show/cnc/date/2026-03-04/segment/11",
    authorIds: ["media-clarissa-ward"],
    framing: "Risk-aware / field report",
    score: 8,
    topics: ["Erbil", "KRG official", "Iran war", "missile strikes", "civilian risk"],
    summary:
      "Transcript and social video records place Clarissa Ward in Iraq's Kurdish region reporting on KRG fear, missile/drone danger, and U.S./Iran-war escalation.",
    evidenceNote: "CNN transcript identifies Ward and asks what she learned from Kurdish regional government officials."
  },
  {
    id: "media-cnn-2026-cia-kurdish-forces",
    outletId: "cnn",
    date: "2026-03-04",
    title: "CIA working to arm Kurdish forces to spark uprising in Iran, sources say",
    url: "https://www.youtube.com/watch?v=hQJGVr_18Ks",
    authorIds: ["media-natasha-bertrand", "media-clarissa-ward"],
    framing: "Strategic / intelligence-claim",
    score: 4,
    topics: ["CIA", "Iranian Kurds", "uprising", "U.S. intelligence", "KRG risk"],
    summary:
      "Treats Kurdish armed groups through an intelligence and U.S.-policy lens; requires careful corroboration because it involves sensitive claims and unnamed sources.",
    evidenceNote: "CNN video/social record and external references identify the Kurdish-force intelligence story; full article ingestion should be added."
  },
  {
    id: "media-fox-2026-border-breach",
    outletId: "fox-news",
    date: "2026-01-14",
    title: "Armed Kurdish fighters try to breach Iran border as regional threat grows amid protests",
    url: "https://www.foxnews.com/world/kurdish-fighters-try-exploit-iran-chaos-regional-threat-grows-amid-nationwide-protests",
    authorIds: ["media-emma-bussey"],
    framing: "Critical / security threat",
    score: -18,
    topics: ["Iran border", "armed Kurdish groups", "regional threat", "Turkey", "IRGC"],
    summary:
      "Frames armed Kurdish groups as trying to exploit Iranian unrest and increasing regional security risk, citing Reuters and Iranian/Turkish security concerns.",
    evidenceNote: "Fox page lists Emma Bussey and uses security-threat language around armed Kurdish groups."
  },
  {
    id: "media-axios-2026-iraqi-kurds-pressure",
    outletId: "axios",
    date: "2026-03-08",
    title: "Under threat, Iraqi Kurds resist pressure to join Iran war",
    url: "https://www.axios.com/top/2026/03/08",
    authorIds: ["media-herb-scribner"],
    framing: "Sympathetic / pressure-resistance",
    score: 14,
    topics: ["Iraqi Kurds", "Iran war", "pressure", "PAK", "Erbil"],
    summary:
      "Fast summary framing Iraqi Kurds as under pressure and threat while resisting a role in the Iran war.",
    evidenceNote: "Axios top-story page lists the headline and Herb Scribner."
  },
  {
    id: "media-axios-2026-trump-kurdish-leaders",
    outletId: "axios",
    date: "2026-03-02",
    title: "Scoop: Trump calls Kurdish leaders in Iran war effort",
    url: "https://www.axios.com/2026/03/02/trump-iran-war-kurds-iraq",
    authorIds: ["media-barak-ravid", "media-marc-caputo"],
    framing: "Strategic / scoop",
    score: 5,
    topics: ["Trump", "Masoud Barzani", "Bafel Talabani", "Iran war", "Kurdish leaders"],
    summary:
      "Official-source style scoop focused on U.S. outreach to Kurdish leaders and the strategic value and complications of Kurdish forces near Iran.",
    evidenceNote: "Axios record identifies the Trump-Kurdish leader call story and related 2026 Iran-war Kurdish coverage."
  },
  {
    id: "media-reuters-intake-required",
    outletId: "reuters",
    date: "Rolling",
    title: "Reuters Kurdistan / Kurdish forces archive intake",
    url: "https://www.reuters.com/site-search/?query=Kurdistan",
    authorIds: [],
    framing: "Unscored / intake required",
    score: 0,
    topics: ["archive", "oil", "border security", "official statements"],
    summary:
      "Required source stream for every-mention tracking. Current prototype keeps Reuters as a top outlet with archive/search intake pending.",
    evidenceNote: "Reuters is frequently cited by other outlets in Kurdistan/Iran-border and Iraq/KRG economic reporting."
  },
  {
    id: "media-bloomberg-intake-required",
    outletId: "bloomberg",
    date: "Rolling",
    title: "Bloomberg Kurdistan energy and Iraq-market archive intake",
    url: "https://www.bloomberg.com/search?query=Kurdistan",
    authorIds: [],
    framing: "Unscored / intake required",
    score: 0,
    topics: ["archive", "energy", "markets", "Iraq-Turkey pipeline", "KRG finance"],
    summary:
      "Required source stream for KRG energy, pipeline, salaries, and investment-risk mentions. Author profiles should be generated as articles are ingested.",
    evidenceNote: "Bloomberg is included for market influence, but author-level Kurdistan items need ingestion."
  },
  {
    id: "media-nytimes-intake-required",
    outletId: "nytimes",
    date: "Rolling",
    title: "New York Times Kurdistan / Kurdish-led forces archive intake",
    url: "https://www.nytimes.com/search?query=Kurdistan",
    authorIds: ["media-alissa-rubin"],
    framing: "Unscored / intake required",
    score: 0,
    topics: ["archive", "Iraq", "Syria", "Yazidis", "Kurdish-led forces"],
    summary:
      "Required source stream for long-form U.S. agenda-setting coverage. This slot should be replaced by individual NYT article records as each mention is ingested.",
    evidenceNote: "NYT search and Alissa Rubin profile provide starting points; do not assign stance until article-level records are attached."
  }
];
