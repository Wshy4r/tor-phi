export const extraCountries = [
  {
    id: "uk",
    name: "United Kingdom",
    region: "Europe / Atlantic",
    capital: "London",
    system: "Constitutional monarchy and parliamentary democracy",
    priority: "High",
    posture: "Security partner, diplomatically engaged, Iraq-framework cautious",
    scoreLabel: "Supportive with UK-Iraq policy limits",
    trend: "2026 contacts kept the KRG file active after the anti-ISIS security partnership",
    summary:
      "The United Kingdom is a high-value Kurdistan Region relationship because it combines a long-running anti-ISIS and Peshmerga training record with current diplomatic access through the Foreign Secretary, Middle East minister, National Security Adviser, and British Ambassador to Iraq. The main constraint is that London usually frames Kurdistan inside Iraq stability, Baghdad relations, asylum/human-rights assessment, and regional security rather than as a stand-alone sovereignty file.",
    government: [
      {
        label: "Prime Minister",
        value: "Keir Starmer",
        url: "https://www.gov.uk/government/people/keir-starmer"
      },
      {
        label: "Foreign Secretary",
        value: "Yvette Cooper",
        url: "https://www.gov.uk/government/ministers/secretary-of-state-for-foreign-commonwealth-and-development-affairs"
      },
      {
        label: "Defence Secretary",
        value: "Dan Jarvis",
        url: "https://www.gov.uk/government/ministers/secretary-of-state-for-defence"
      },
      {
        label: "Middle East Minister",
        value: "Hamish Falconer",
        url: "https://www.gov.uk/government/people/hamish-falconer"
      },
      {
        label: "National Security Adviser",
        value: "Jonathan Powell",
        url: "https://www.gov.uk/government/people/jonathan-powell"
      },
      {
        label: "Ambassador to Iraq",
        value: "Irfan Siddiq",
        url: "https://www.gov.uk/government/people/irfan-siddiq"
      }
    ],
    actors: [
      {
        name: "Keir Starmer",
        institution: "10 Downing Street",
        role: "Prime Minister and final UK government decision filter",
        stance: "High-level authority; direct KRG evidence still indirect",
        url: "https://www.gov.uk/government/people/keir-starmer",
        evidenceIds: ["uk-starmer-pm", "uk-nsa-barzani"]
      },
      {
        name: "Yvette Cooper",
        institution: "Foreign, Commonwealth and Development Office",
        role: "Foreign Secretary and crisis diplomacy channel",
        stance: "Supportive crisis signal after Duhok strike",
        url: "https://www.gov.uk/government/ministers/secretary-of-state-for-foreign-commonwealth-and-development-affairs",
        evidenceIds: ["uk-cooper-fs", "uk-cooper-call"]
      },
      {
        name: "Hamish Falconer",
        institution: "Foreign, Commonwealth and Development Office",
        role: "Middle East minister covering Iraq-facing policy",
        stance: "Direct ministerial KRG channel",
        url: "https://www.gov.uk/government/people/hamish-falconer",
        evidenceIds: ["uk-falconer-role", "uk-falconer-meeting"]
      },
      {
        name: "Dan Jarvis",
        institution: "Ministry of Defence",
        role: "Defence Secretary with Iraq/Afghanistan military background",
        stance: "Security-policy owner; direct KRG evidence to collect",
        url: "https://www.gov.uk/government/ministers/secretary-of-state-for-defence",
        evidenceIds: ["uk-jarvis-defence", "uk-shader-peshmerga"]
      },
      {
        name: "Jonathan Powell",
        institution: "Cabinet Office / National Security and Intelligence",
        role: "National Security Adviser",
        stance: "Security and conflict-resolution channel",
        url: "https://www.gov.uk/government/people/jonathan-powell",
        evidenceIds: ["uk-powell-nsa", "uk-nsa-barzani"]
      },
      {
        name: "Irfan Siddiq",
        institution: "British Embassy Baghdad",
        role: "Ambassador to Iraq and Baghdad-Erbil maintenance channel",
        stance: "Active KRG contact channel",
        url: "https://www.gov.uk/government/people/irfan-siddiq",
        evidenceIds: ["uk-siddiq-bio", "uk-siddiq-june", "uk-siddiq-may"]
      }
    ],
    media: [
      {
        name: "BBC",
        influence: "Global English-language audience and public-service framing",
        tendency: "Conflict, humanitarian, and UK policy context",
        url: "https://www.bbc.com/news"
      },
      {
        name: "The Guardian",
        influence: "UK progressive and international policy readership",
        tendency: "Human rights, refugees, and Middle East politics",
        url: "https://www.theguardian.com/international"
      },
      {
        name: "Financial Times",
        influence: "Policy, energy, finance, and diplomatic elite",
        tendency: "Energy, markets, regional risk, and foreign policy",
        url: "https://www.ft.com/"
      }
    ],
    influences: [
      {
        name: "Counter-Daesh / Operation Shader model",
        type: "Security doctrine",
        relevance: "Explains why UK-KRG relevance is strongest where Peshmerga, ISIS, training, and coalition transition appear.",
        confidence: "High"
      },
      {
        name: "Iraq unity and stability frame",
        type: "Foreign policy constraint",
        relevance: "Keeps UK support inside federal Iraq and Baghdad-Erbil stability rather than independence language.",
        confidence: "High"
      },
      {
        name: "Asylum and country-information bureaucracy",
        type: "Institutional knowledge layer",
        relevance: "UK Home Office country notes create detailed, sometimes critical, records about KRG institutions, protection, minorities, and opposition politics.",
        confidence: "Medium"
      }
    ],
    relationships: [
      {
        from: "Yvette Cooper",
        to: "Nechirvan Barzani",
        label: "foreign-secretary crisis call",
        strength: 82,
        evidenceIds: ["uk-cooper-call"]
      },
      {
        from: "Hamish Falconer",
        to: "Nechirvan Barzani",
        label: "Middle East minister contact",
        strength: 76,
        evidenceIds: ["uk-falconer-meeting"]
      },
      {
        from: "Jonathan Powell",
        to: "Kurdistan Region Presidency",
        label: "national-security channel",
        strength: 74,
        evidenceIds: ["uk-nsa-barzani"]
      },
      {
        from: "Irfan Siddiq",
        to: "Kurdistan Region Presidency",
        label: "ambassadorial maintenance",
        strength: 78,
        evidenceIds: ["uk-siddiq-june", "uk-siddiq-may"]
      },
      {
        from: "UK forces",
        to: "Kurdish Peshmerga",
        label: "training and coalition support",
        strength: 84,
        evidenceIds: ["uk-shader-peshmerga"]
      },
      {
        from: "UK Home Office country notes",
        to: "KRG institutions",
        label: "protection / rights scrutiny",
        strength: 58,
        evidenceIds: ["uk-cpin-iraq-protection", "uk-cpin-iran-kurds"]
      }
    ],
    timeline: [
      {
        year: 2014,
        event: "Operation Shader and the anti-ISIS campaign made Kurdish Peshmerga support a visible UK security relationship.",
        stance: 76
      },
      {
        year: 2024,
        event: "The UK said Operation Shader had supported and trained Iraqi Security Forces, including more than 21,000 Kurdish Peshmerga.",
        stance: 80
      },
      {
        year: 2026,
        event: "Barzani meetings with the UK National Security Adviser, Middle East minister, Foreign Secretary, and Ambassador kept the relationship current.",
        stance: 78
      }
    ],
    evidence: [
      {
        id: "uk-starmer-pm",
        date: "2026-07-12",
        category: "Government",
        claim: "GOV.UK lists Keir Starmer as Prime Minister and says he became Prime Minister on July 5, 2024.",
        sourceTitle: "GOV.UK Keir Starmer biography",
        sourceType: "Official",
        url: "https://www.gov.uk/government/people/keir-starmer",
        confidence: 0.97,
        impact: 1,
        reading: "Confirms the current UK executive actor; not a direct Kurdistan stance."
      },
      {
        id: "uk-cooper-fs",
        date: "2026-07-12",
        category: "Government",
        claim: "GOV.UK lists Yvette Cooper as Foreign Secretary, appointed on September 5, 2025.",
        sourceTitle: "GOV.UK Foreign Secretary role",
        sourceType: "Official",
        url: "https://www.gov.uk/government/ministers/secretary-of-state-for-foreign-commonwealth-and-development-affairs",
        confidence: 0.97,
        impact: 1,
        reading: "Confirms the current top diplomatic actor."
      },
      {
        id: "uk-jarvis-defence",
        date: "2026-07-12",
        category: "Government / defense",
        claim: "GOV.UK lists Dan Jarvis as Defence Secretary, appointed on June 11, 2026.",
        sourceTitle: "GOV.UK Defence Secretary role",
        sourceType: "Official",
        url: "https://www.gov.uk/government/ministers/secretary-of-state-for-defence",
        confidence: 0.97,
        impact: 1,
        reading: "Confirms the current defence actor; Kurdistan relevance comes through coalition and Iraq security files."
      },
      {
        id: "uk-falconer-role",
        date: "2026-07-12",
        category: "Government / Middle East",
        claim: "GOV.UK lists Hamish Falconer as Parliamentary Under-Secretary of State for the Middle East, North Africa, Afghanistan and Pakistan.",
        sourceTitle: "GOV.UK Hamish Falconer biography",
        sourceType: "Official",
        url: "https://www.gov.uk/government/people/hamish-falconer",
        confidence: 0.96,
        impact: 2,
        reading: "This is the most direct ministerial role for the Iraq/KRG file."
      },
      {
        id: "uk-powell-nsa",
        date: "2026-07-12",
        category: "Government / security",
        claim: "GOV.UK identifies Jonathan Powell as the Prime Minister's National Security Adviser.",
        sourceTitle: "GOV.UK Jonathan Powell biography",
        sourceType: "Official",
        url: "https://www.gov.uk/government/people/jonathan-powell",
        confidence: 0.96,
        impact: 1,
        reading: "Confirms a senior security-policy channel with conflict-resolution background."
      },
      {
        id: "uk-siddiq-bio",
        date: "2026-07-12",
        category: "Government / embassy",
        claim: "GOV.UK identifies Irfan Siddiq as British Ambassador to Iraq from March 2025.",
        sourceTitle: "GOV.UK Irfan Siddiq biography",
        sourceType: "Official",
        url: "https://www.gov.uk/government/people/irfan-siddiq",
        confidence: 0.96,
        impact: 1,
        reading: "Confirms the ambassadorial Baghdad-Erbil channel."
      },
      {
        id: "uk-cooper-call",
        date: "2026-03-29",
        category: "Diplomatic support",
        claim: "KRG Presidency reported Yvette Cooper called Nechirvan Barzani, condemned the drone strike on his Duhok residence, and conveyed sympathies after Peshmerga casualties.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-receives-phone-call-from-british-foreign-secretary/",
        confidence: 0.88,
        impact: 8,
        reading: "Strong positive signal: direct crisis contact from the Foreign Secretary."
      },
      {
        id: "uk-falconer-meeting",
        date: "2026-04-17",
        category: "Diplomatic contact",
        claim: "KRG Presidency reported Nechirvan Barzani met Hamish Falconer, UK Minister of State for the Middle East, at the Antalya Diplomacy Forum.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-uk-minister-of-state-discuss-the-situation-in-iraq-and-the-region/",
        confidence: 0.88,
        impact: 6,
        reading: "Current ministerial access on Iraq and regional developments."
      },
      {
        id: "uk-nsa-barzani",
        date: "2026-02-13",
        category: "Security contact",
        claim: "KRG Presidency reported Nechirvan Barzani met UK National Security Adviser Jonathan Powell at the Munich Security Conference.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-national-security-adviser-of-the-united-kingdom-discuss-security-developments/",
        confidence: 0.88,
        impact: 5,
        reading: "High-value security channel: terrorism and regional stability were central to the meeting."
      },
      {
        id: "uk-siddiq-june",
        date: "2026-06-15",
        category: "Ambassadorial contact",
        claim: "KRG Presidency reported Nechirvan Barzani received British Ambassador Irfan Siddiq and discussed the UK's relations with Iraq and the Kurdistan Region.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-the-british-ambassador-1/",
        confidence: 0.87,
        impact: 3,
        reading: "Shows the UK channel remains active at ambassador level."
      },
      {
        id: "uk-siddiq-may",
        date: "2026-05-05",
        category: "Ambassadorial contact",
        claim: "KRG Presidency reported Barzani met Ambassador Irfan Siddiq in Baghdad and discussed Iraq's political landscape and the internal situation in the Kurdistan Region.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-the-british-ambassador-discuss-developments-in-iraq/",
        confidence: 0.86,
        impact: 3,
        reading: "Adds Baghdad-based continuity to the UK-KRG relationship."
      },
      {
        id: "uk-shader-peshmerga",
        date: "2024-09-27",
        category: "Security",
        claim: "GOV.UK said UK forces trained more than 111,000 Iraqi Security Forces, including more than 21,000 Kurdish Peshmerga, through Operation Shader / Op Inherent Resolve.",
        sourceTitle: "UK response to conclusion of Global Coalition military mission in Iraq",
        sourceType: "Official",
        url: "https://www.gov.uk/government/news/uk-response-to-the-conclusion-of-the-global-coalitions-military-mission-in-iraq",
        confidence: 0.94,
        impact: 8,
        reading: "Concrete security cooperation is one of the strongest positive UK indicators."
      },
      {
        id: "uk-cpin-iraq-protection",
        date: "2025-09-01",
        category: "Rights / institutional scrutiny",
        claim: "A UK country policy note said the federal government and KRG do little to address some human-rights abuses committed by security forces.",
        sourceTitle: "Iraq CPIN: actors of protection",
        sourceType: "Official UK guidance",
        url: "https://www.gov.uk/government/publications/iraq-country-policy-and-information-notes/country-policy-and-information-note-actors-of-protection-iraq-september-2025-accessible",
        confidence: 0.86,
        impact: -6,
        reading: "This is not anti-KRG diplomacy, but it creates a critical Home Office rights/protection layer."
      },
      {
        id: "uk-cpin-iran-kurds",
        date: "2026-05-01",
        category: "Iranian Kurdish file",
        claim: "A UK country bulletin reviewed Iranian Kurdish parties, Kurdish self-determination language, and activity levels after the 2026 Iran conflict.",
        sourceTitle: "Iran country bulletin: Kurds and Kurdish political groups",
        sourceType: "Official UK guidance",
        url: "https://www.gov.uk/government/publications/iran-country-policy-and-information-notes/country-bulletin-iran-kurds-and-kurdish-political-groups-may-2026-accessible",
        confidence: 0.84,
        impact: 0,
        reading: "Important for Kurdish politics beyond Iraq; should be separated from the KRG file."
      }
    ],
    opportunities: ["Security cooperation legacy", "Foreign Secretary and Middle East minister access", "National Security Council channel", "Diaspora and asylum-policy knowledge"],
    risks: ["UK-Iraq sovereignty framing", "Rights/protection criticism of KRG institutions", "Iran escalation around UK-Iran disputes", "Domestic UK political changes"],
    verification: ["Collect UK-side readouts for every KRG-side meeting", "Add House of Commons statements and written questions on KRG/Kurdistan", "Separate KRG policy from UK assessments of Iranian Kurdish groups"]
  },
  {
    id: "iran",
    name: "Iran",
    region: "Middle East",
    capital: "Tehran",
    system: "Islamic republic with supreme-leader authority",
    priority: "Critical",
    posture: "Historically close, economically important, security-sensitive, post-succession volatile",
    scoreLabel: "Close but security-constrained",
    trend: "July 2026 Tehran meetings show active access after Iran's leadership shock",
    summary:
      "Iran is a critical neighbor for the Kurdistan Region because geography, trade, border security, shared cultural ties, Kurdish politics inside Iran, and Baghdad-Erbil-Tehran security coordination all overlap. The file is not simply friendly or hostile: recent Pezeshkian-Barzani and Araghchi-Barzani meetings show strong access and economic intent, while Iran's security agreement expectations and sensitivity toward Iranian Kurdish opposition groups keep the relationship tightly constrained.",
    government: [
      {
        label: "Supreme Leader",
        value: "Mojtaba Khamenei",
        url: "https://www.leader.ir/en"
      },
      {
        label: "President",
        value: "Masoud Pezeshkian",
        url: "https://president.ir/en"
      },
      {
        label: "Foreign Minister",
        value: "Seyed Abbas Araghchi",
        url: "https://en.mfa.gov.ir/portal/ministrinfo/13756"
      },
      {
        label: "Parliament Speaker",
        value: "Mohammad Bagher Ghalibaf",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-the-speaker-of-the-iranian-parliament/"
      }
    ],
    actors: [
      {
        name: "Mojtaba Khamenei",
        institution: "Office of the Supreme Leader",
        role: "Supreme Leader and highest authority in the Islamic Republic system",
        stance: "Post-succession authority; KRG evidence to collect",
        url: "https://www.leader.ir/en",
        evidenceIds: ["ir-leader-mojtaba", "ir-khamenei-funeral"]
      },
      {
        name: "Masoud Pezeshkian",
        institution: "Presidency of Iran",
        role: "President and main public diplomacy channel to Erbil",
        stance: "Open to trade, cultural, scientific, and economic cooperation",
        url: "https://president.ir/en",
        evidenceIds: ["ir-pezeshkian-president", "ir-pezeshkian-2026", "ir-pezeshkian-2024"]
      },
      {
        name: "Seyed Abbas Araghchi",
        institution: "Ministry of Foreign Affairs",
        role: "Foreign minister and Tehran-Erbil diplomatic channel",
        stance: "Cooperation channel under regional ceasefire/security pressure",
        url: "https://en.mfa.gov.ir/portal/ministrinfo/13756",
        evidenceIds: ["ir-araghchi-bio", "ir-araghchi-barzani"]
      },
      {
        name: "Mohammad Bagher Ghalibaf",
        institution: "Islamic Consultative Assembly",
        role: "Speaker of the Iranian parliament",
        stance: "Legislative and regime-network contact point",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-the-speaker-of-the-iranian-parliament/",
        evidenceIds: ["ir-ghalibaf-barzani"]
      },
      {
        name: "Iranian border province governors",
        institution: "Provincial governments near the Kurdistan Region",
        role: "Trade, pilgrimage, border, and local security channels",
        stance: "Practical cross-border cooperation channel",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-iraqs-problems-can-be-solved-by-implementing-the-constitution/",
        evidenceIds: ["ir-nechirvan-iran-interview"]
      }
    ],
    media: [
      {
        name: "IRNA",
        influence: "Iranian state news framing",
        tendency: "Official government and diplomacy narrative",
        url: "https://en.irna.ir/"
      },
      {
        name: "Tasnim News Agency",
        influence: "Security and conservative policy audience",
        tendency: "Resistance-axis and national-security framing",
        url: "https://www.tasnimnews.com/en"
      },
      {
        name: "Rudaw Persian / Kurdish media monitoring",
        influence: "Kurdish and Iranian Kurdish audiences",
        tendency: "Cross-border politics, trade, security, and Kurdish opposition",
        url: "https://www.rudaw.net/english"
      }
    ],
    influences: [
      {
        name: "Neighbor-state security doctrine",
        type: "Security doctrine",
        relevance: "Iranian policy toward KRG is filtered through whether Kurdistan Region territory is seen as a threat platform.",
        confidence: "High"
      },
      {
        name: "Shared Kurdish-Persian cultural and historical ties",
        type: "Civilizational / social layer",
        relevance: "Creates social and diplomatic warmth that Pezeshkian and Nechirvan Barzani both emphasize.",
        confidence: "High"
      },
      {
        name: "Trade and pilgrimage corridors",
        type: "Economic / social infrastructure",
        relevance: "Makes the relationship practical and recurring even when security tensions rise.",
        confidence: "High"
      },
      {
        name: "Iranian Kurdish opposition file",
        type: "Domestic-security constraint",
        relevance: "Iranian concerns about Kurdish opposition parties based in the Kurdistan Region can quickly harden the relationship.",
        confidence: "High"
      }
    ],
    relationships: [
      {
        from: "Masoud Pezeshkian",
        to: "Nechirvan Barzani",
        label: "presidential contact and cooperation agenda",
        strength: 86,
        evidenceIds: ["ir-pezeshkian-2026", "ir-pezeshkian-2024"]
      },
      {
        from: "Seyed Abbas Araghchi",
        to: "Kurdistan Region Presidency",
        label: "foreign ministry coordination",
        strength: 76,
        evidenceIds: ["ir-araghchi-barzani", "ir-mfa-barzani"]
      },
      {
        from: "Mohammad Bagher Ghalibaf",
        to: "Nechirvan Barzani",
        label: "parliamentary leadership contact",
        strength: 66,
        evidenceIds: ["ir-ghalibaf-barzani"]
      },
      {
        from: "Iran",
        to: "Kurdistan Region border economy",
        label: "trade / pilgrimage / local-government channel",
        strength: 82,
        evidenceIds: ["ir-nechirvan-iran-interview", "ir-pezeshkian-2026"]
      },
      {
        from: "Iran security establishment",
        to: "KRG / Baghdad security agreement",
        label: "security constraint",
        strength: 88,
        evidenceIds: ["ir-security-agreement-2024", "uk-cpin-iran-kurds"]
      }
    ],
    timeline: [
      {
        year: 2014,
        event: "KRG leaders repeatedly credit Iran as among the first to assist during the ISIS threat to Erbil.",
        stance: 68
      },
      {
        year: 2024,
        event: "Pezeshkian made a historic Erbil visit during his first Iraq trip and both sides emphasized political, economic, cultural, and security cooperation.",
        stance: 78
      },
      {
        year: 2026,
        event: "After Ali Khamenei's death and funeral, Nechirvan Barzani met Pezeshkian, Araghchi, and Ghalibaf in Tehran, keeping high-level channels open during a volatile transition.",
        stance: 72
      }
    ],
    evidence: [
      {
        id: "ir-leader-mojtaba",
        date: "2026-07-12",
        category: "Government",
        claim: "Leader.ir, the official Supreme Leader website, carries current material from Ayatollah Seyyed Mojtaba Khamenei.",
        sourceTitle: "Office of the Supreme Leader",
        sourceType: "Official",
        url: "https://www.leader.ir/en",
        confidence: 0.92,
        impact: 1,
        reading: "Confirms the current leadership file has changed; direct KRG position still needs sourced statements."
      },
      {
        id: "ir-pezeshkian-president",
        date: "2026-07-12",
        category: "Government",
        claim: "The Iranian presidency website identifies President Pezeshkian as the current president.",
        sourceTitle: "Official Website of the President of Iran",
        sourceType: "Official",
        url: "https://president.ir/en",
        confidence: 0.96,
        impact: 1,
        reading: "Confirms the president who has direct KRG contact."
      },
      {
        id: "ir-araghchi-bio",
        date: "2026-07-12",
        category: "Government",
        claim: "The Iranian MFA profile identifies Seyed Abbas Araghchi as foreign minister.",
        sourceTitle: "Iran MFA minister profile",
        sourceType: "Official",
        url: "https://en.mfa.gov.ir/portal/ministrinfo/13756",
        confidence: 0.95,
        impact: 1,
        reading: "Confirms the foreign-policy actor."
      },
      {
        id: "ir-khamenei-funeral",
        date: "2026-07-03",
        category: "Leadership transition",
        claim: "KRG Presidency reported Nechirvan Barzani attended the official funeral ceremony for Iran's late Supreme Leader Grand Ayatollah Seyyed Ali Khamenei.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-attends-the-official-funeral-ceremony-for-irans-late-supreme-leader-grand-ayatollah-seyyed-ali-khamenei/",
        confidence: 0.88,
        impact: 2,
        reading: "Attendance during a leadership transition is a significant access and respect signal, but it also marks a volatile security period."
      },
      {
        id: "ir-pezeshkian-2026",
        date: "2026-07-03",
        category: "Diplomatic contact",
        claim: "KRG Presidency reported Nechirvan Barzani was welcomed in Tehran by President Masoud Pezeshkian and discussed trade, economic ties, and broader relations.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-president-masoud-pezeshkian-1/",
        confidence: 0.9,
        impact: 7,
        reading: "Strong positive current-access signal, especially because it names trade and economic cooperation."
      },
      {
        id: "ir-ready-expand-krg",
        date: "2026-07-03",
        category: "Diplomatic support",
        claim: "Iran's presidency said Pezeshkian was ready to expand educational, cultural, scientific, and economic cooperation with Iraq's Kurdistan Region.",
        sourceTitle: "Official Website of the President of Iran",
        sourceType: "Official",
        url: "https://president.ir/en/164932",
        confidence: 0.9,
        impact: 6,
        reading: "This is a direct Iranian-side positive statement about KRG cooperation."
      },
      {
        id: "ir-araghchi-barzani",
        date: "2026-07-03",
        category: "Foreign ministry engagement",
        claim: "KRG Presidency reported Barzani and Araghchi discussed ties between Iraq, the Kurdistan Region, and Iran, cooperation, coordination, ceasefire, and regional developments.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-and-irans-foreign-minister-araghchi-discuss-bilateral-relations/",
        confidence: 0.88,
        impact: 5,
        reading: "Strong foreign-ministry contact, but shaped by ceasefire and regional crisis context."
      },
      {
        id: "ir-mfa-barzani",
        date: "2026-07-03",
        category: "Foreign ministry engagement",
        claim: "Iran's MFA news archive listed the President of the Kurdistan Region of Iraq meeting Iran's foreign minister in Tehran.",
        sourceTitle: "Iran MFA events archive",
        sourceType: "Official",
        url: "https://en.mfa.gov.ir/portal/newsagencyshow/3180",
        confidence: 0.86,
        impact: 3,
        reading: "Iranian-side confirmation strengthens the source chain."
      },
      {
        id: "ir-ghalibaf-barzani",
        date: "2026-07-03",
        category: "Parliamentary contact",
        claim: "KRG Presidency reported Nechirvan Barzani met Iranian Parliament Speaker Mohammad Bagher Ghalibaf and discussed enhancing relations and cooperation.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-meets-with-the-speaker-of-the-iranian-parliament/",
        confidence: 0.86,
        impact: 3,
        reading: "Adds a parliamentary/regime-network channel beyond the presidency and MFA."
      },
      {
        id: "ir-pezeshkian-2024",
        date: "2024-09-12",
        category: "Diplomatic contact",
        claim: "KRG Presidency reported Pezeshkian's historic Erbil visit, emphasizing political, social, cultural, economic, and security relations.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/kurdistan-region-and-iran-emphasize-developing-bilateral-relations/",
        confidence: 0.9,
        impact: 7,
        reading: "Foundational positive signal for the Pezeshkian-era relationship."
      },
      {
        id: "ir-security-agreement-2024",
        date: "2024-09-12",
        category: "Security constraint",
        claim: "The 2024 Pezeshkian-Erbil readout said the Kurdistan Region stressed it does not pose a threat to Iran and is committed to the Iraq-Iran security agreement.",
        sourceTitle: "Kurdistan Region Presidency",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/kurdistan-region-and-iran-emphasize-developing-bilateral-relations/",
        confidence: 0.9,
        impact: -14,
        reading: "This caps friendliness: Iran's relationship is tied to security guarantees and opposition-party concerns."
      },
      {
        id: "ir-nechirvan-iran-interview",
        date: "2026-06-01",
        category: "Economic / security frame",
        claim: "Nechirvan Barzani said about 60 percent of Iran-Iraq trade flows through the Kurdistan Region and described progress in Baghdad-Erbil-Iran security coordination.",
        sourceTitle: "Kurdistan Region Presidency interview",
        sourceType: "Official KRG",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-iraqs-problems-can-be-solved-by-implementing-the-constitution/",
        confidence: 0.86,
        impact: 5,
        reading: "Explains why Iran-KRG is practical and important even when politically tense."
      },
      {
        id: "uk-cpin-iran-kurds",
        date: "2026-05-01",
        category: "Iranian Kurdish opposition file",
        claim: "A UK country bulletin said several Kurdish opposition parties announced a coalition in February 2026, while armed action had not occurred at the time of publication.",
        sourceTitle: "UK country bulletin: Iran, Kurds and Kurdish political groups",
        sourceType: "Official UK guidance",
        url: "https://www.gov.uk/government/publications/iran-country-policy-and-information-notes/country-bulletin-iran-kurds-and-kurdish-political-groups-may-2026-accessible",
        confidence: 0.82,
        impact: -7,
        reading: "This is a watch item because Iranian Kurdish opposition activity directly affects Tehran's reading of the KRG border/security file."
      }
    ],
    opportunities: ["Trade corridors", "Pilgrimage and border management", "Cultural and academic cooperation", "Tehran-Erbil crisis deconfliction"],
    risks: ["Iranian Kurdish opposition file", "Border and missile/drone escalation", "Iran leadership transition", "US-Israel-Iran conflict spillover", "Baghdad-Erbil-Tehran security agreement pressure"],
    verification: ["Track Mojtaba Khamenei's direct statements on Iraq/KRG", "Collect Iranian-side readouts for every Barzani meeting", "Separate trade warmth from security red lines", "Map Iranian Kurdish opposition references separately from KRG diplomacy"]
  }
];
