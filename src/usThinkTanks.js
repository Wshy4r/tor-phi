export const thinkTankMethodology = {
  label: "Administration Proximity Score",
  description:
    "A 0-100 analytic estimate, not a private-access claim. It combines personnel links to the Trump administration, explicit policy alignment with America First / Trump-era priorities, current Middle East output, and direct Iraq/Kurdistan relevance.",
  factors: [
    ["Personnel links", 40],
    ["Policy alignment", 25],
    ["Current Middle East output", 20],
    ["Iraq/Kurdistan specificity", 15]
  ]
};

export const usThinkTankPeople = [
  {
    id: "afpi-keith-kellogg",
    name: "Keith Kellogg",
    organization: "America First Policy Institute",
    role: "Co-Chair, American Security",
    adminConnection: "Former Assistant to the President and Special Presidential Envoy for Ukraine during President Donald Trump's second term, according to AFPI.",
    expertise: ["American Security", "Trump national security policy", "Military strategy"],
    policySignal: "High proximity through direct second-term Trump administration service.",
    url: "https://www.americafirstpolicy.com/team/keithkellogg"
  },
  {
    id: "afpi-fred-fleitz",
    name: "Fred Fleitz",
    organization: "America First Policy Institute",
    role: "Vice Chair, American Security",
    adminConnection: "Served in 2018 as Deputy Assistant to President Donald Trump and Chief of Staff of the National Security Council, according to AFPI.",
    expertise: ["National Security Council", "CIA/DIA/State background", "Iran", "American Security"],
    policySignal: "High proximity through prior NSC service and AFPI America First security role.",
    url: "https://www.americafirstpolicy.com/team/fredfleitz"
  },
  {
    id: "heritage-victoria-coates",
    name: "Victoria Coates",
    organization: "The Heritage Foundation",
    role: "Vice President, Davis Institute for National Security and Foreign Policy",
    adminConnection: "Heritage identifies Coates as a former deputy national security advisor to President Donald Trump.",
    expertise: ["Middle East", "Africa", "China", "Homeland Security", "Antisemitism"],
    policySignal: "High proximity through former Trump NSC role and senior Heritage national-security leadership.",
    url: "https://www.heritage.org/staff/victoria-coates-phd"
  },
  {
    id: "heritage-robert-greenway",
    name: "Robert Greenway",
    organization: "The Heritage Foundation",
    role: "Visiting Fellow, Allison Center for National Security",
    adminConnection: "Heritage Middle East work closely tracks Trump-era regional security, Abraham Accords, Iran, and Saudi/U.S. policy themes.",
    expertise: ["Middle East security", "Abraham Accords", "Iran", "U.S.-Saudi relations"],
    policySignal: "High policy alignment; direct personnel proximity should be verified per appointment or campaign role.",
    url: "https://www.heritage.org/staff/robert-greenway"
  },
  {
    id: "fdd-mark-dubowitz",
    name: "Mark Dubowitz",
    organization: "Foundation for Defense of Democracies",
    role: "Chief Executive",
    adminConnection: "FDD says Dubowitz leads projects on Iran and sanctions and is recognized as a key influencer on counter-Iran policy; Iran sanctioned him and FDD in 2019.",
    expertise: ["Iran", "Sanctions", "Iran nuclear program", "Illicit finance"],
    policySignal: "Strong alignment with maximum-pressure and sanctions policy, but score should be tied to public policy influence rather than assumed private access.",
    url: "https://www.fdd.org/team/mark-dubowitz/"
  },
  {
    id: "fdd-jonathan-schanzer",
    name: "Jonathan Schanzer",
    organization: "Foundation for Defense of Democracies",
    role: "Executive Director",
    adminConnection: "Former U.S. Treasury terrorism finance analyst; FDD says he oversees experts and scholars and writes extensively on Middle East security.",
    expertise: ["Middle East", "Terrorism finance", "Hamas", "U.S. national security"],
    policySignal: "Relevant to counterterrorism and Israel/Iran policy debates; proximity is policy-network based.",
    url: "https://www.fdd.org/team/jonathan-schanzer/"
  },
  {
    id: "fdd-behnam-ben-taleblu",
    name: "Behnam Ben Taleblu",
    organization: "Foundation for Defense of Democracies",
    role: "Senior Director, Iran Program",
    adminConnection: "FDD identifies him as senior director of its Iran Program and a senior fellow specializing in Iranian security and political issues.",
    expertise: ["Iran", "Iran security", "Iran politics", "Nonproliferation"],
    policySignal: "Highly relevant to Iran/Kurdistan scenarios and sanctions architecture.",
    url: "https://www.fdd.org/team/behnam-ben-taleblu/"
  },
  {
    id: "hudson-michael-doran",
    name: "Michael Doran",
    organization: "Hudson Institute",
    role: "Senior Fellow and Director, Center for Peace and Security in the Middle East",
    adminConnection: "Hudson lists Doran as director of its Middle East security center; his 2026 output focuses heavily on Trump, Iran, Israel, and Gulf strategy.",
    expertise: ["Middle East security", "Iran", "Israel", "Security alliances"],
    policySignal: "Strong ideological and policy alignment with hawkish Trump-era Middle East themes; direct access should be separately sourced.",
    url: "https://www.hudson.org/experts/1035-michael-doran"
  },
  {
    id: "hudson-michael-pregent",
    name: "Michael Pregent",
    organization: "Hudson Institute",
    role: "Senior Middle East Analyst / former Hudson fellow profile",
    adminConnection: "Hudson profile describes Pregent as a former intelligence officer with extensive Middle East, terrorism, counterinsurgency, and policy experience.",
    expertise: ["Iraq", "Kurdistan", "Counterterrorism", "Iran-backed militias"],
    policySignal: "High Iraq/Kurdistan relevance through past Hudson events on the KRG referendum and U.S.-Iraq relations.",
    url: "https://www.hudson.org/experts/michael-pregent"
  },
  {
    id: "hudson-joel-rayburn",
    name: "Joel Rayburn",
    organization: "Hudson Institute",
    role: "Senior Fellow, Center for Peace and Security in the Middle East",
    adminConnection: "Hudson listed Rayburn as host for a 2026 event with KRG Interior Minister Rebar Ahmed.",
    expertise: ["Syria", "Iraq", "Middle East security", "U.S. policy"],
    policySignal: "Important Kurdistan relevance through current Hudson KRI event programming.",
    url: "https://www.hudson.org/events/opportunity-uncertainty-middle-east-next-steps-kurdistan-region-iraq"
  },
  {
    id: "winep-michael-knights",
    name: "Michael Knights",
    organization: "The Washington Institute for Near East Policy",
    role: "Adjunct Fellow",
    adminConnection: "Washington Institute identifies Knights as specializing in military and security affairs of Iraq, Iran, and the Gulf states and as cofounder of Militia Spotlight.",
    expertise: ["Iraq", "Iran-backed militias", "Kurdistan energy", "KRG-Baghdad relationship"],
    policySignal: "Very high issue relevance to Kurdistan and Iraq; administration proximity is analytic influence rather than partisan alignment.",
    url: "https://www.washingtoninstitute.org/experts/michael-knights"
  },
  {
    id: "winep-grant-rumley",
    name: "Grant Rumley",
    organization: "The Washington Institute for Near East Policy",
    role: "Senior Fellow and program director",
    adminConnection: "A Washington Institute article identifies Rumley as a former Middle East policy advisor at the Pentagon during the first Trump administration.",
    expertise: ["Great power competition", "Middle East", "U.S. policy"],
    policySignal: "Moderate proximity through first Trump administration Pentagon experience.",
    url: "https://www.washingtoninstitute.org/policy-analysis/emerging-trump-doctrine-middle-east"
  },
  {
    id: "csis-mona-yacoubian",
    name: "Mona Yacoubian",
    organization: "Center for Strategic and International Studies",
    role: "Director and Senior Adviser, Middle East Program",
    adminConnection: "CSIS identifies Yacoubian as Middle East Program director; her work analyzes the Trump administration's emerging Middle East order.",
    expertise: ["Middle East", "Conflict analysis", "Governance", "Stabilization"],
    policySignal: "High analytic relevance; lower administration proximity because CSIS is not an America First personnel pipeline.",
    url: "https://www.csis.org/people/mona-yacoubian"
  },
  {
    id: "mei-stuart-jones",
    name: "Stuart E. Jones",
    organization: "Middle East Institute",
    role: "President",
    adminConnection: "MEI's Iraq page lists Amb. (ret.) Stuart E. Jones in current Iraq-related analysis context.",
    expertise: ["Iraq", "Diplomacy", "Middle East regional policy"],
    policySignal: "High regional expertise; lower direct Trump proximity.",
    url: "https://mei.edu/regions/gulf/iraq/"
  },
  {
    id: "mei-rend-al-rahim",
    name: "Rend al-Rahim",
    organization: "Middle East Institute",
    role: "Iraq analyst / former Iraqi diplomat",
    adminConnection: "MEI's Iraq page lists al-Rahim on 2026 Iraq political transition analysis.",
    expertise: ["Iraq politics", "U.S.-Iraq relationship", "Regional diplomacy"],
    policySignal: "Useful Iraq-context source; not close to Trump administration by default.",
    url: "https://mei.edu/regions/gulf/iraq/"
  },
  {
    id: "aei-michael-rubin",
    name: "Michael Rubin",
    organization: "American Enterprise Institute",
    role: "Senior Fellow",
    adminConnection: "AEI is a conservative policy institution, but Rubin's Kurdistan value is issue expertise and published criticism/analysis rather than a confirmed current-administration role.",
    expertise: ["Kurdistan", "Iraq", "Iran", "Turkey", "Middle East history"],
    policySignal: "Very high Kurdistan specificity through AEI's Kurdistan Rising work and long-running Kurdish/Iraq commentary.",
    url: "https://www.aei.org/profile/michael-rubin/"
  },
  {
    id: "aei-danielle-pletka",
    name: "Danielle Pletka",
    organization: "American Enterprise Institute",
    role: "Distinguished Senior Fellow",
    adminConnection: "Senior conservative foreign-policy voice at AEI; administration proximity should be scored from public staffing, advisory, or testimony links rather than assumed access.",
    expertise: ["Foreign and defense policy", "Iran", "Israel", "Middle East security"],
    policySignal: "Important for conservative Middle East framing, Iran policy, and Washington Republican policy networks.",
    url: "https://www.aei.org/profile/danielle-pletka/"
  },
  {
    id: "atlantic-victoria-taylor",
    name: "Victoria J. Taylor",
    organization: "Atlantic Council",
    role: "Director, Iraq Initiative",
    adminConnection: "Former deputy assistant secretary for Iraq and Iran in the State Department's Bureau of Near Eastern Affairs; close to government process, but not an ideological Trump pipeline.",
    expertise: ["Iraq", "Iran", "State Department", "National Security Council"],
    policySignal: "High Iraq policy relevance through Atlantic Council's Iraq Initiative and U.S.-Iraq/KRG engagement.",
    url: "https://www.atlanticcouncil.org/expert/victoria-j-taylor/"
  },
  {
    id: "atlantic-yerevan-saeed",
    name: "Yerevan Saeed",
    organization: "Atlantic Council",
    role: "Nonresident Senior Fellow, Iraq Initiative",
    adminConnection: "Atlantic Council identifies Saeed as a Barzani scholar-in-residence and director of the Global Kurdish Initiative for Peace; proximity is Kurdistan issue access, not administration staffing.",
    expertise: ["Kurdish studies", "Iraq", "Turkey", "Iran", "Energy politics"],
    policySignal: "Very high Kurdistan specificity, including 2026 Atlantic Council analysis advocating U.S. air defense support for Iraqi Kurdistan after Iranian attacks.",
    url: "https://www.atlanticcouncil.org/expert/yerevan-saeed/"
  },
  {
    id: "atlantic-alina-romanowski",
    name: "Alina L. Romanowski",
    organization: "Atlantic Council",
    role: "Distinguished Fellow, Scowcroft Middle East Security Initiative",
    adminConnection: "Former U.S. ambassador to Iraq from 2022 to 2024 and Kuwait from 2020 to 2022, according to Atlantic Council.",
    expertise: ["Iraq", "Kuwait", "Counterterrorism", "Diplomacy", "Intelligence"],
    policySignal: "High Iraq-government relevance through recent ambassadorial experience and Atlantic Council Iraq Initiative work.",
    url: "https://www.atlanticcouncil.org/expert/alina-l-romanowski/"
  },
  {
    id: "cfr-steven-cook",
    name: "Steven A. Cook",
    organization: "Council on Foreign Relations",
    role: "Senior Fellow for Middle East and Africa Studies",
    adminConnection: "CFR is elite policy-facing and briefs decision-makers, but Cook's current-administration proximity is analytic influence rather than partisan staffing.",
    expertise: ["U.S.-Middle East policy", "Turkey", "Arab politics", "Regional order"],
    policySignal: "Useful for Turkey/Kurds/U.S. Middle East framing and Trump regional-policy analysis.",
    url: "https://www.cfr.org/podcasts/presidents-inbox/trump-and-middle-east-steven-cook-transition-2025-episode-2"
  },
  {
    id: "cfr-henri-barkey",
    name: "Henri J. Barkey",
    organization: "Council on Foreign Relations",
    role: "Adjunct Senior Fellow for Middle East Studies",
    adminConnection: "CFR says Barkey works on the strategic future of the Kurds in the Middle East; administration proximity is expert-network influence, not current staffing.",
    expertise: ["Kurds", "Turkey", "Syria", "Iraq", "Iran"],
    policySignal: "Very high Kurdish issue expertise across Turkey, Syria, Iraq, and Iran.",
    url: "https://www.cfr.org/experts/henri-j-barkey"
  },
  {
    id: "rand-shelly-culbertson",
    name: "Shelly Culbertson",
    organization: "RAND Corporation",
    role: "Senior Researcher",
    adminConnection: "RAND is nonpartisan and government-facing; Culbertson's relevance comes from KRG development/reform research rather than current White House proximity.",
    expertise: ["Kurdistan Region", "Post-conflict recovery", "Education", "Refugees", "Middle East development"],
    policySignal: "High practical KRG specificity through RAND studies on education, labor, and institutional capacity in the Kurdistan Region of Iraq.",
    url: "https://www.rand.org/about/people/c/culbertson_shelly.html"
  },
  {
    id: "rand-ben-connable",
    name: "Ben Connable",
    organization: "RAND Corporation",
    role: "Former RAND researcher / Iraq security analyst",
    adminConnection: "Relevant to U.S. Army and security-force-assistance research; not a current-administration proximity signal by itself.",
    expertise: ["Iraq security forces", "Will to fight", "Security force assistance", "Military analysis"],
    policySignal: "Useful for assessing Iraqi federal force capacity and U.S. security-assistance design around Iraq/KRI stability.",
    url: "https://www.rand.org/pubs/authors/c/connable_ben.html"
  },
  {
    id: "brookings-ranj-alaaldin",
    name: "Ranj Alaaldin",
    organization: "Brookings Institution",
    role: "Former Brookings Expert / Iraq and Kurdish politics analyst",
    adminConnection: "Brookings lists Alaaldin as a former expert. His value here is issue expertise and Iraq/Kurdistan analysis, not current administration proximity.",
    expertise: ["Iraq politics", "Kurdish question", "Kirkuk", "Post-ISIS governance", "Nonstate armed actors"],
    policySignal: "High Iraq/Kurdistan specificity through Brookings archive work on Kirkuk, Kurdish bargaining power, Turkey-KRG relations, and Iraq political order.",
    url: "https://www.brookings.edu/people/ranj-alaaldin/"
  },
  {
    id: "brookings-kenneth-pollack",
    name: "Kenneth M. Pollack",
    organization: "Brookings Institution",
    role: "Former Senior Fellow / Iraq security analyst",
    adminConnection: "Brookings archive identifies Pollack as a senior fellow in Iraq/Kurdistan field reporting; the current profile should treat this as historical policy influence.",
    expertise: ["Iraq", "Kurdistan Region", "U.S. security policy", "ISIS", "Regional stabilization"],
    policySignal: "Useful historical source for U.S.-KRG security assumptions and post-ISIS Iraq/Kurdistan assessments.",
    url: "https://www.brookings.edu/articles/iraq-situation-report-part-iii-kurdistan/"
  },
  {
    id: "brookings-bruce-riedel",
    name: "Bruce Riedel",
    organization: "Brookings Institution",
    role: "Senior Fellow, Foreign Policy",
    adminConnection: "Brookings identifies Riedel as a senior fellow; his Kurdistan relevance is mainly Turkey-PKK and U.S. security-policy analysis.",
    expertise: ["Turkey", "PKK", "Iraq", "U.S. security policy", "Intelligence"],
    policySignal: "Important for separating KRG policy from Turkey-PKK security files in Washington analysis.",
    url: "https://www.brookings.edu/articles/can-the-u-s-ease-turkish-kurdistan-workers-party-tensions/"
  },
  {
    id: "carnegie-wladimir-van-wilgenburg",
    name: "Wladimir van Wilgenburg",
    organization: "Carnegie Endowment for International Peace",
    role: "Diwan contributor / Kurdish affairs analyst",
    adminConnection: "Carnegie Diwan publishes van Wilgenburg's Kurdish affairs analysis; this is issue expertise rather than administration proximity.",
    expertise: ["Kurdish affairs", "KRG", "Iranian Kurdish opposition", "Peshmerga", "Syrian Kurds"],
    policySignal: "Very high Kurdistan specificity through Carnegie work on Peshmerga reform, Kurdish rebel groups, Iraqi Kurdistan, and Syrian Kurdish politics.",
    url: "https://carnegieendowment.org/middle-east/diwan/2026/07/kurdish-rebel-groups-are-wary-of-tehrans-next-move"
  },
  {
    id: "carnegie-sardar-aziz",
    name: "Sardar Aziz",
    organization: "Carnegie Endowment for International Peace",
    role: "Sada contributor / former senior adviser in the Kurdish parliament",
    adminConnection: "Carnegie's Sada author note identifies Aziz as a former senior adviser in the Kurdish parliament and a researcher; this is Kurdistan-side issue expertise.",
    expertise: ["Kurdish parliament", "Iraq development politics", "Civil-military relations", "Governance", "Middle East regional politics"],
    policySignal: "Very high Kurdistan specificity through analysis of Iraq's Development Road, Kurdistan exclusion, and Iraqi provincial politics.",
    url: "https://carnegieendowment.org/sada/2023/08/iraqs-development-road-no-place-for-kurdistan"
  },
  {
    id: "carnegie-kawa-hassan",
    name: "Kawa Hassan",
    organization: "Carnegie Endowment for International Peace",
    role: "Former Nonresident Scholar, Carnegie Middle East Center",
    adminConnection: "Carnegie says Hassan is no longer with the center; his value is archived Kurdish/Iraqi politics and democratization expertise.",
    expertise: ["Kurdish politics", "Iraqi politics", "Civil society", "Democratization", "Governance"],
    policySignal: "Useful for KRG internal politics, governance, and democracy-risk assessment rather than direct U.S. administration access.",
    url: "https://carnegieendowment.org/people/kawa-hassan"
  },
  {
    id: "quincy-adam-weinstein",
    name: "Adam Weinstein",
    organization: "Quincy Institute for Responsible Statecraft",
    role: "Deputy Director, Middle East Program",
    adminConnection: "Quincy identifies Weinstein as deputy director of its Middle East Program. His relevance is restraint policy, U.S. troop posture, Iraq, Syria, and regional security.",
    expertise: ["Middle East", "Iraq", "Syria", "U.S. military posture", "Rule of law"],
    policySignal: "Important for understanding arguments that could reduce U.S. military dependence in Iraq/Syria, which affects KRG security assumptions.",
    url: "https://quincyinst.org/research/normalizing-u-s-iraq-relations-a-proposal-for-u-s-military-withdrawal-from-iraq-within-five-years/"
  },
  {
    id: "quincy-steven-simon",
    name: "Steven Simon",
    organization: "Quincy Institute for Responsible Statecraft",
    role: "Senior Research Fellow",
    adminConnection: "Quincy event biographies describe Simon as a former NSC senior director for counterterrorism and for the Middle East and North Africa in prior administrations.",
    expertise: ["Syria", "Counterterrorism", "Middle East policy", "NSC process", "U.S. military restraint"],
    policySignal: "Relevant to Syrian Kurds/SDF, U.S. force posture, and whether Washington should keep security commitments in Syria and Iraq.",
    url: "https://quincyinst.org/events/the-pkks-future-real-dissolution-or-strategic-shift/"
  },
  {
    id: "quincy-trita-parsi",
    name: "Trita Parsi",
    organization: "Quincy Institute for Responsible Statecraft",
    role: "Co-Founder and Executive Vice President",
    adminConnection: "Quincy identifies Parsi as an expert on U.S.-Iranian relations, Iranian foreign policy, and Middle East geopolitics.",
    expertise: ["Iran", "U.S.-Iran relations", "Regional de-escalation", "Iraq", "Military restraint"],
    policySignal: "High relevance to Iran-Iraq-KRG risk because restraint arguments can oppose permanent U.S. bases while prioritizing de-escalation with Iran.",
    url: "https://quincyinst.org/author/trita-parsi/"
  },
  {
    id: "newamerica-douglas-ollivant",
    name: "Douglas A. Ollivant",
    organization: "New America",
    role: "ASU Future of War Senior Fellow / former NSC Director for Iraq",
    adminConnection: "New America event materials identify Ollivant as a former NSC Director for Iraq. Current proximity should be scored as policy expertise unless a current role is sourced.",
    expertise: ["Iraq", "U.S.-Iran proxy competition", "NSC process", "Security partnerships", "Militias"],
    policySignal: "Useful for Iraq proxy-war analysis and for distinguishing Iraqi actor interests from simplified Iran-proxy narratives.",
    url: "https://www.newamerica.org/events/iraq-what-is-happening/"
  },
  {
    id: "newamerica-erica-gaston",
    name: "Erica Gaston",
    organization: "New America",
    role: "Author, U.S.-Iran Proxy Competition in Iraq",
    adminConnection: "New America lists Gaston as coauthor of its U.S.-Iran Proxy Competition in Iraq report. This is analytical relevance rather than administration proximity.",
    expertise: ["Iraq", "Proxy warfare", "Militias", "Conflict analysis", "U.S.-Iran competition"],
    policySignal: "Relevant to KRG analysis because proxy competition, PMF behavior, and U.S.-Iran escalation shape Erbil's security environment.",
    url: "https://www.newamerica.org/insights/us-iran-proxy-competition-iraq/"
  },
  {
    id: "newamerica-peter-bergen",
    name: "Peter Bergen",
    organization: "New America",
    role: "Schwartz Senior Fellow",
    adminConnection: "New America's Kurdistan event lists Bergen as moderator and Schwartz Senior Fellow; his primary relevance is terrorism/counterterrorism and event convening.",
    expertise: ["Counterterrorism", "ISIS", "Al-Qaeda", "Kurdistan event convening", "U.S. security debate"],
    policySignal: "Moderate Kurdistan relevance through New America's Invisible Nation event and broader counterterrorism framing.",
    url: "https://www.newamerica.org/events/the-invisible-nation-of-kurds/"
  }
];

export const usThinkTanks = [
  {
    id: "afpi",
    name: "America First Policy Institute",
    shortName: "AFPI",
    type: "America First policy shop",
    proximityScore: 95,
    proximityLabel: "Very high",
    proximityRationale:
      "AFPI has direct personnel ties to Trump administrations and explicitly builds on America First foreign policy. Keith Kellogg and Fred Fleitz are high-value personnel signals.",
    middleEastPolicy:
      "America First, pro-Israel, Abraham Accords expansion, maximum pressure on Iran, Gulf security/economic integration, conditional Syria engagement.",
    iraqPolicy:
      "Iraq appears mainly through Iran, Syria, ISIS, Gulf security, and U.S. force posture rather than as a standalone democratization project.",
    kurdistanPolicy:
      "Indirect but important: Kurdish files intersect with AFPI's Iran, Syria, ISIS, and U.S. troop/partner-force debates. No dedicated KRG doctrine is attached yet.",
    specificity: "Medium",
    people: ["afpi-keith-kellogg", "afpi-fred-fleitz"],
    sources: [
      ["AFPI homepage", "https://www.americafirstpolicy.com/"],
      ["Keith Kellogg profile", "https://www.americafirstpolicy.com/team/keithkellogg"],
      ["Fred Fleitz profile", "https://www.americafirstpolicy.com/team/fredfleitz"],
      ["The Middle East in 2025: Options for the New Administration", "https://www.americafirstpolicy.com/issues/the-middle-east-in-2025-options-for-the-new-administration"],
      ["Middle East Peace Project", "https://americafirstpolicy.com/issues/20220911-america-first-in-the-middle-east-the-middle-east-peace-project-at-afpi"],
      ["How to Lead on Iran Through the America First Playbook", "https://www.americafirstpolicy.com/issues/how-to-lead-on-iran-through-the-america-first-playbook"]
    ],
    evidence: [
      "Kellogg's AFPI profile links him to Trump's second term as Special Presidential Envoy for Ukraine.",
      "Fleitz's AFPI profile links him to the Trump NSC and long national-security service.",
      "AFPI's Middle East Peace Project explicitly says it builds on the Trump administration's Middle East approach."
    ]
  },
  {
    id: "heritage",
    name: "The Heritage Foundation",
    shortName: "Heritage",
    type: "Conservative policy institution",
    proximityScore: 90,
    proximityLabel: "Very high",
    proximityRationale:
      "Heritage is a major conservative policy pipeline. Its national-security leadership includes former Trump officials, and Project 2025/Mandate for Leadership provides a staffing-policy framework for conservative governance.",
    middleEastPolicy:
      "Bilateral security partnerships, Iran pressure, energy/security realism, Abraham Accords expansion, and strong U.S. posture against Iran-backed groups.",
    iraqPolicy:
      "Supports containing Iran, maintaining Iraqi stability, and preventing ISIS resurgence while assessing U.S. force posture and regional security partnerships.",
    kurdistanPolicy:
      "More specific than many institutions: Heritage has written that U.S. policy should support KRG autonomy within Iraq and has tracked U.S. force presence in the Kurdistan Region.",
    specificity: "High",
    people: ["heritage-victoria-coates", "heritage-robert-greenway"],
    sources: [
      ["Victoria Coates profile", "https://www.heritage.org/staff/victoria-coates-phd"],
      ["Robert Greenway profile", "https://www.heritage.org/staff/robert-greenway"],
      ["Next Steps for U.S. Policy in Syria and Iraq", "https://www.heritage.org/middle-east/report/next-steps-us-policy-syria-and-iraq"],
      ["The Security Environment in the Middle East", "https://www.heritage.org/defense/report/the-security-environment-the-middle-east"],
      ["Middle East operating environment", "https://www.heritage.org/military-strength/assessing-the-global-operating-environment/middle-east"]
    ],
    evidence: [
      "Coates is identified by Heritage as a former deputy national security advisor to Trump.",
      "Heritage's Syria/Iraq report explicitly says U.S. goals should include maintaining Iraq's territorial integrity while supporting KRG autonomy.",
      "Heritage's Middle East military-strength material discusses planned residual U.S. force presence in the Kurdistan Region until September 2026."
    ]
  },
  {
    id: "fdd",
    name: "Foundation for Defense of Democracies",
    shortName: "FDD",
    type: "National security and sanctions-focused think tank",
    proximityScore: 80,
    proximityLabel: "High",
    proximityRationale:
      "FDD is highly aligned with maximum-pressure Iran policy, sanctions, counterterrorism, and Israel security priorities. Its proximity is strongest on policy content and influence, not formal administration staffing.",
    middleEastPolicy:
      "Hawkish Iran policy, sanctions/illicit finance, Israel security, counterterrorism, Hezbollah/Hamas/Iran-backed networks, Turkey and Kurdish security questions.",
    iraqPolicy:
      "Focuses heavily on Iran-backed militias, Iraqi sanctions evasion, and security threats that affect U.S. forces and partners.",
    kurdistanPolicy:
      "Direct issue page on Kurds; strong relevance to Kurdish security, SDF/Kurdish politics, Turkey, Iraq, Syria, and counterterrorism.",
    specificity: "High",
    people: ["fdd-mark-dubowitz", "fdd-jonathan-schanzer", "fdd-behnam-ben-taleblu"],
    sources: [
      ["FDD homepage", "https://www.fdd.org/"],
      ["FDD Kurds issue page", "https://www.fdd.org/issue/kurds/"],
      ["Mark Dubowitz profile", "https://www.fdd.org/team/mark-dubowitz/"],
      ["Jonathan Schanzer profile", "https://www.fdd.org/team/jonathan-schanzer/"],
      ["Behnam Ben Taleblu profile", "https://www.fdd.org/team/behnam-ben-taleblu/"]
    ],
    evidence: [
      "FDD's Kurds issue page explicitly covers Kurdish populations and how Kurdish political aspirations and security relationships affect U.S. counterterrorism and stability.",
      "Dubowitz's profile says he leads projects on Iran and sanctions and is a key influencer on counter-Iran policy.",
      "Taleblu's profile places him at the center of FDD's Iran Program."
    ]
  },
  {
    id: "hudson",
    name: "Hudson Institute",
    shortName: "Hudson",
    type: "Conservative national-security think tank",
    proximityScore: 72,
    proximityLabel: "High",
    proximityRationale:
      "Hudson has a strong conservative security network and active Middle East programming. It has hosted KRG-focused events and features experts writing directly on Trump, Iran, Israel, and regional security.",
    middleEastPolicy:
      "Security alliances, Israel, Iran pressure, Gulf security, Syria/Iraq stabilization, and U.S. strength in the region.",
    iraqPolicy:
      "Iraq appears through Iran-backed networks, ISIS, U.S.-Iraq security cooperation, and KRI partnership.",
    kurdistanPolicy:
      "Directly relevant: Hudson hosted a 2026 event on next steps for the Kurdistan Region of Iraq and has a history of Iraq/Kurdistan programming.",
    specificity: "High",
    people: ["hudson-michael-doran", "hudson-michael-pregent", "hudson-joel-rayburn"],
    sources: [
      ["Hudson Institute homepage", "https://www.hudson.org/"],
      ["Michael Doran profile", "https://www.hudson.org/experts/1035-michael-doran"],
      ["Michael Pregent profile", "https://www.hudson.org/experts/michael-pregent"],
      ["Next Steps for the Kurdistan Region of Iraq", "https://www.hudson.org/events/opportunity-uncertainty-middle-east-next-steps-kurdistan-region-iraq"],
      ["Iraq After the Kurdistan Referendum event record", "https://www.hudson.org/experts/michael-pregent?events=all&page=3"]
    ],
    evidence: [
      "Hudson's KRI event text says the U.S. partnership with the Kurdistan Region of Iraq has been a crucial component of U.S. Middle East policy.",
      "Doran directs Hudson's Center for Peace and Security in the Middle East.",
      "Pregent's Hudson profile/event archive links him to Iraq, Kurdistan referendum, ISIS, and Iran strategy debates."
    ]
  },
  {
    id: "winep",
    name: "The Washington Institute for Near East Policy",
    shortName: "WINEP",
    type: "Specialized Middle East policy institute",
    proximityScore: 60,
    proximityLabel: "Medium",
    proximityRationale:
      "WINEP is issue-specialist and policy-facing rather than America First-aligned. Proximity comes from former officials, Congress testimony, and deep Iraq/Kurdistan expertise.",
    middleEastPolicy:
      "Pragmatic security, U.S. regional engagement, Israel/Gulf/Iran policy, Iraq militia tracking, sanctions, and partner-force analysis.",
    iraqPolicy:
      "Very specific: Iran-backed militias, U.S.-Iraq security cooperation, Baghdad-KRG energy disputes, Iraqi oil networks, and militia attacks in Kurdistan.",
    kurdistanPolicy:
      "One of the most specific institutions on Kurdistan: Michael Knights has written on U.S.-Kurdish-Baghdad relations, saving Kurdistan's economy, energy disputes, and Kurdistan drone attacks.",
    specificity: "Very high",
    people: ["winep-michael-knights", "winep-grant-rumley"],
    sources: [
      ["Michael Knights profile", "https://www.washingtoninstitute.org/experts/michael-knights"],
      ["Resetting the U.S.-Kurdish-Baghdad Relationship", "https://www.washingtoninstitute.org/policy-analysis/resetting-us-kurdish-baghdad-relationship"],
      ["How to Serve U.S. Interests by Saving Kurdistan's Economy", "https://www.washingtoninstitute.org/policy-analysis/how-serve-us-interests-saving-kurdistans-economy"],
      ["Necessary U.S. Role in Fixing Baghdad-Kurdistan Energy Dispute", "https://www.washingtoninstitute.org/policy-analysis/necessary-us-role-fixing-baghdad-kurdistan-energy-dispute"],
      ["Militias Strain Credibility by Denying Involvement in Kurdistan Drone Attacks", "https://www.washingtoninstitute.org/policy-analysis/militias-strain-credibility-denying-involvement-kurdistan-drone-attacks"]
    ],
    evidence: [
      "Knights specializes in Iraq, Iran, and Gulf military/security affairs and co-founded Militia Spotlight.",
      "WINEP has multiple Kurdistan-specific pieces on U.S.-Kurdish-Baghdad relations, Kurdistan's economy, energy, and militia attacks.",
      "Rumley is identified in WINEP material as a former Middle East policy advisor at the Pentagon during the first Trump administration."
    ]
  },
  {
    id: "csis",
    name: "Center for Strategic and International Studies",
    shortName: "CSIS",
    type: "Bipartisan strategic policy institution",
    proximityScore: 38,
    proximityLabel: "Low-medium",
    proximityRationale:
      "CSIS is influential and policy-facing but not close to the current administration in the same personnel/ideological sense as AFPI or Heritage. Its value is analytic and institutional.",
    middleEastPolicy:
      "Regional order, stabilization, governance, conflict analysis, energy/security, and strategic competition.",
    iraqPolicy:
      "Iraq appears through stabilization, regional security, and U.S. engagement rather than a specific KRG advocacy frame.",
    kurdistanPolicy:
      "Moderate: CSIS has discussed Kurdish leverage and Peshmerga relevance, but Kurdistan is not the central institutional lane.",
    specificity: "Medium",
    people: ["csis-mona-yacoubian"],
    sources: [
      ["CSIS Middle East Program", "https://www.csis.org/programs/middle-east-program"],
      ["Mona Yacoubian profile", "https://www.csis.org/people/mona-yacoubian"],
      ["Trump Administration's Middle East Policy", "https://www.csis.org/analysis/trump-administrations-middle-east-policy-shaping-emerging-regional-order"],
      ["Hoping for Trouble in Iraq", "https://www.csis.org/analysis/middle-east-notes-and-comment-hoping-trouble-iraq"]
    ],
    evidence: [
      "CSIS describes its Middle East Program as forward-looking analysis of political, diplomatic, economic, and security forces.",
      "Yacoubian directs the Middle East Program and has deep MENA conflict/stabilization experience.",
      "CSIS has analyzed Trump's regional order but is not a Trump personnel pipeline."
    ]
  },
  {
    id: "mei",
    name: "Middle East Institute",
    shortName: "MEI",
    type: "Regional expertise and dialogue institute",
    proximityScore: 35,
    proximityLabel: "Low-medium",
    proximityRationale:
      "MEI is valuable for Iraq and regional expertise, but its link to the administration is analytic rather than personnel/ideological proximity.",
    middleEastPolicy:
      "Regional diplomacy, Iraq political transition, Gulf/Iran dynamics, conflict resolution, people-to-people ties, and policy dialogue.",
    iraqPolicy:
      "Strong Iraq desk and current Iraq analysis; useful for political transition and U.S.-Iraq relationship tracking.",
    kurdistanPolicy:
      "Indirect: relevant through Iraq analysis and Kurdish political figures/events, but dedicated KRG stance needs more sourced entries.",
    specificity: "Medium",
    people: ["mei-stuart-jones", "mei-rend-al-rahim"],
    sources: [
      ["MEI homepage", "https://mei.edu/"],
      ["MEI Iraq page", "https://mei.edu/regions/gulf/iraq/"],
      ["US Policy in the Middle East in the First Year of Trump 2.0", "https://mei.edu/report/us-policy-in-the-middle-east-in-the-first-year-of-trump-2-0-a-report-card/"]
    ],
    evidence: [
      "MEI mission says it provides actionable foreign policy recommendations and Middle East dialogue.",
      "MEI maintains an active Iraq page with current 2026 analysis.",
      "MEI has produced report-card style analysis of Trump 2.0 Middle East policy."
    ]
  },
  {
    id: "aei",
    name: "American Enterprise Institute",
    shortName: "AEI",
    type: "Conservative foreign and defense policy institution",
    proximityScore: 68,
    proximityLabel: "Medium-high",
    proximityRationale:
      "AEI is important in Republican foreign-policy circles, but this project should distinguish institutional influence from direct Trump 2.0 staffing unless a named appointment or advisory role is sourced.",
    middleEastPolicy:
      "Conservative security policy, Iran pressure, Israel security, military posture, democracy/autocracy debates, and skepticism toward adversarial regional actors.",
    iraqPolicy:
      "Iraq appears through rule of law, Iran influence, militia power, federal stability, and the long-term legacy of U.S. intervention.",
    kurdistanPolicy:
      "Very specific through Michael Rubin's Kurdistan Rising work, AEI Kurdistan-tagged pieces, and recurring analysis of Kurdish independence, Barzani/KRG politics, Turkey, Iran, and Iraqi federalism.",
    specificity: "High",
    people: ["aei-michael-rubin", "aei-danielle-pletka"],
    sources: [
      ["Michael Rubin profile", "https://www.aei.org/profile/michael-rubin/"],
      ["Danielle Pletka profile", "https://www.aei.org/profile/danielle-pletka/"],
      ["Kurdistan Rising report", "https://www.aei.org/research-products/report/kurdistan-rising/"],
      ["What Should the U.S. Do Next on Kurdistan?", "https://www.aei.org/foreign-and-defense-policy/middle-east/what-should-the-us-do-next-on-kurdistan/"],
      ["AEI Kurdistan Regional Government tag", "https://www.aei.org/tag/kurdistan-regional-government/"]
    ],
    evidence: [
      "Rubin authored AEI's Kurdistan Rising work and has extensive Kurdistan-specific output.",
      "AEI has a recurring Kurdistan/KRG publication trail, making its issue specificity higher than many broader Washington institutes.",
      "Administration proximity is medium-high because of conservative network relevance, but it needs named staffing evidence for any person-level access claim."
    ]
  },
  {
    id: "atlantic-council",
    name: "Atlantic Council",
    shortName: "Atlantic",
    type: "Transatlantic policy institute",
    proximityScore: 52,
    proximityLabel: "Medium",
    proximityRationale:
      "Atlantic Council is policy-facing and frequently hosts officials and former officials. It is not a Trump-aligned personnel shop, but its Iraq Initiative gives it strong Washington-to-Baghdad/KRG issue relevance.",
    middleEastPolicy:
      "Regional integration, U.S.-Iraq partnership, Iran/Gulf security, energy, democracy/governance, economic development, and transatlantic coordination.",
    iraqPolicy:
      "Very specific: the Iraq Initiative focuses on Iraq stability and sovereignty, regional integration, democratic/economic development, and a strengthened U.S.-Iraq partnership.",
    kurdistanPolicy:
      "Specific: Atlantic Council has hosted KRG foreign-relations discussions and publishes Kurdistan-focused analysis, including air-defense arguments after Iranian attacks on Iraqi Kurdistan.",
    specificity: "Very high",
    people: ["atlantic-victoria-taylor", "atlantic-yerevan-saeed", "atlantic-alina-romanowski"],
    sources: [
      ["Iraq Initiative", "https://www.atlanticcouncil.org/programs/middle-east-programs/iraq-initiative/"],
      ["Victoria J. Taylor profile", "https://www.atlanticcouncil.org/expert/victoria-j-taylor/"],
      ["Yerevan Saeed profile", "https://www.atlanticcouncil.org/expert/yerevan-saeed/"],
      ["Alina L. Romanowski profile", "https://www.atlanticcouncil.org/expert/alina-l-romanowski/"],
      ["KRG Head of Foreign Relations Department roundtable", "https://www.atlanticcouncil.org/event/roundtable-with-krg-head-of-foreign-relations-department-safeen-dizayee/"]
    ],
    evidence: [
      "The Iraq Initiative calls itself a Washington-facing Iraq program focused on Iraq's stability, sovereignty, regional integration, and U.S.-Iraq partnership.",
      "Saeed's profile and 2026 work give the project a named Kurdistan specialist inside a major U.S. think tank.",
      "Romanowski's recent ambassadorship to Iraq creates strong government-process knowledge even if not a Trump-aligned proximity signal."
    ]
  },
  {
    id: "cfr",
    name: "Council on Foreign Relations",
    shortName: "CFR",
    type: "Elite nonpartisan foreign-policy council",
    proximityScore: 48,
    proximityLabel: "Medium",
    proximityRationale:
      "CFR is institutionally influential with policymakers, media, and foreign-policy elites, but it should be scored as analytic/elite-network proximity rather than partisan closeness to Trump 2.0.",
    middleEastPolicy:
      "U.S. regional strategy, Turkey, Iran, Syria, Israel/Gulf dynamics, conflict tracking, and broader foreign-policy elite consensus debates.",
    iraqPolicy:
      "Iraq is addressed through U.S. military engagement, federal politics, Turkey/Kurdish conflict spillover, Iran influence, and regional stabilization.",
    kurdistanPolicy:
      "Specific through CFR's Kurds archive, Henri Barkey's work on the strategic future of the Kurds, Cook's Kurdistan commentary, and conflict trackers on Turkey/Kurdish armed groups.",
    specificity: "High",
    people: ["cfr-steven-cook", "cfr-henri-barkey"],
    sources: [
      ["CFR Middle East Program", "https://www.cfr.org/programs/middle-east-program"],
      ["Henri J. Barkey profile", "https://www.cfr.org/experts/henri-j-barkey"],
      ["CFR Kurds archive", "https://www.cfr.org/keywords/thekurds"],
      ["Kurdistan: Just Being Independent", "https://www.cfr.org/articles/kurdistan-just-being-independent"],
      ["Conflict Between Turkey and Armed Kurdish Groups", "https://www.cfr.org/global-conflict-tracker/conflict/conflict-between-turkey-and-armed-kurdish-groups"]
    ],
    evidence: [
      "CFR's Middle East program says it informs policymakers, opinion leaders, and the public through publications, meetings, and briefings.",
      "Barkey's CFR profile specifically says he works on the strategic future of the Kurds in the Middle East.",
      "CFR has a dedicated Kurds archive and current conflict-tracker coverage of Turkey/Kurdish armed groups."
    ]
  },
  {
    id: "rand",
    name: "RAND Corporation",
    shortName: "RAND",
    type: "Nonpartisan policy research organization",
    proximityScore: 42,
    proximityLabel: "Low-medium",
    proximityRationale:
      "RAND is government-facing and influential in defense/public policy, but it is nonpartisan and not close to the current administration in an ideological personnel-pipeline sense.",
    middleEastPolicy:
      "Defense analysis, stabilization, governance, public-sector reform, refugee policy, security-force assistance, and evidence-based public policy.",
    iraqPolicy:
      "Practical and technical: Iraqi security-force capacity, will-to-fight studies, stabilization, governance, reconstruction, and development.",
    kurdistanPolicy:
      "Highly specific in non-diplomatic domains: RAND has worked with the Kurdistan Regional Government since 2010 on health, education, labor-market, statistics, and capacity-building research.",
    specificity: "High",
    people: ["rand-shelly-culbertson", "rand-ben-connable"],
    sources: [
      ["The Kurdistan Region - Iraq topic page", "https://www.rand.org/topics/the-kurdistan-region---iraq.html"],
      ["Shelly Culbertson profile", "https://www.rand.org/about/people/c/culbertson_shelly.html"],
      ["Health Sector Reform in the Kurdistan Region", "https://www.rand.org/pubs/research_reports/RR1658.html"],
      ["Strategic Priorities for Improving Access to Quality Education in the Kurdistan Region", "https://www.rand.org/content/dam/rand/pubs/monographs/MG1100/MG1140-1/RAND_MG1140-1.pdf"],
      ["Iraq topic page", "https://www.rand.org/topics/iraq.html"]
    ],
    evidence: [
      "RAND's Kurdistan Region topic page says RAND researchers have worked with the KRG since 2010 to improve health care.",
      "RAND KRG research includes health reform, education priorities, labor market assessment, data capacity, and gross regional product work.",
      "RAND is more useful for evidence-based technical policy than for measuring Trump administration political closeness."
    ]
  },
  {
    id: "brookings",
    name: "Brookings Institution",
    shortName: "Brookings",
    type: "Centrist / establishment foreign-policy research institution",
    proximityScore: 45,
    proximityLabel: "Medium",
    proximityRationale:
      "Brookings is influential in Washington policy debate, media, and congressional/executive expert circulation, but it should be scored as establishment influence rather than current Trump-aligned proximity.",
    middleEastPolicy:
      "Institutional U.S. engagement, stabilization, governance, Turkey-Iraq-Syria analysis, counter-ISIS lessons, and policy debate around U.S. commitments in the Middle East.",
    iraqPolicy:
      "Strong historical Iraq archive: post-2003 federal politics, ISIS, Mosul, Baghdad-Erbil bargaining, Kirkuk, and the durability of Iraqi state institutions.",
    kurdistanPolicy:
      "High archive value: Brookings has published on KRG resilience, Kirkuk, Turkey-KRG alignment, PKK tensions, U.S.-Kurdistan repair after Kirkuk, and Kurdish autonomy inside Iraq.",
    specificity: "High",
    people: ["brookings-ranj-alaaldin", "brookings-kenneth-pollack", "brookings-bruce-riedel"],
    sources: [
      ["Ranj Alaaldin profile", "https://www.brookings.edu/people/ranj-alaaldin/"],
      ["Iraq Situation Report, Part III: Kurdistan", "https://www.brookings.edu/articles/iraq-situation-report-part-iii-kurdistan/"],
      ["The U.S. and Kurdistan: Revise and rebuild after Kirkuk", "https://www.brookings.edu/articles/the-u-s-and-kurdistan-revise-and-rebuild-after-kirkuk/"],
      ["The clash over Kirkuk: Why the real crisis is in Baghdad, not Erbil", "https://www.brookings.edu/articles/the-clash-over-kirkuk-why-the-real-crisis-is-in-baghdad-not-erbil/"],
      ["Why the Turkey-KRG alliance works, for now", "https://www.brookings.edu/articles/why-the-turkey-krg-alliance-works-for-now/"],
      ["Can the U.S. Ease Turkish-Kurdistan Workers' Party Tensions?", "https://www.brookings.edu/articles/can-the-u-s-ease-turkish-kurdistan-workers-party-tensions/"]
    ],
    evidence: [
      "Brookings has a direct Kurdistan archive with pieces on Kirkuk, KRG resilience, Turkey-KRG relations, and U.S.-Kurdistan repair after the Kirkuk crisis.",
      "Alaaldin's Brookings archive includes Kurdish question and Iraq/Kirkuk analysis.",
      "Pollack's Iraq Situation Report says he met officials in Baghdad, Sulaymaniyyah, and Irbil during field reporting."
    ]
  },
  {
    id: "carnegie",
    name: "Carnegie Endowment for International Peace",
    shortName: "Carnegie",
    type: "Global foreign-policy research institution",
    proximityScore: 40,
    proximityLabel: "Low-medium",
    proximityRationale:
      "Carnegie is highly policy-facing and regionally deep but should be scored as analytic/elite-network influence, not current administration closeness.",
    middleEastPolicy:
      "Regional politics, governance, state institutions, borders, civil-military relations, Iran, Syria, Turkey, and conflict prevention.",
    iraqPolicy:
      "Iraq coverage focuses on state capacity, militias, governance, federal politics, development, Iran influence, and intra-Iraqi bargaining.",
    kurdistanPolicy:
      "Very high: Carnegie has direct work on preventing conflict over Kurdistan, Peshmerga unification, KRG governance, Iraq's Development Road excluding Kurdistan, Iranian Kurdish opposition in Iraq, and Syrian Kurdish politics.",
    specificity: "Very high",
    people: ["carnegie-wladimir-van-wilgenburg", "carnegie-sardar-aziz", "carnegie-kawa-hassan"],
    sources: [
      ["Iraq region page", "https://carnegieendowment.org/middle-east/regions/iraq"],
      ["Iraq's Development Road: No Place for Kurdistan?", "https://carnegieendowment.org/sada/2023/08/iraqs-development-road-no-place-for-kurdistan"],
      ["Preventing Conflict Over Kurdistan", "https://carnegieendowment.org/research/2009/02/preventing-conflict-over-kurdistan"],
      ["Kurdistan's Political Armies: The Challenge of Unifying the Peshmerga Forces", "https://carnegieendowment.org/research/2015/12/kurdistans-political-armies-the-challenge-of-unifying-the-peshmerga-forces"],
      ["Kurdish Rebel Groups Are Wary of Tehran's Next Move", "https://carnegieendowment.org/middle-east/diwan/2026/07/kurdish-rebel-groups-are-wary-of-tehrans-next-move"],
      ["Kawa Hassan profile", "https://carnegieendowment.org/people/kawa-hassan"]
    ],
    evidence: [
      "Carnegie's Kurdistan archive includes conflict-prevention recommendations, Peshmerga reform, KRG governance, and Kurdish opposition groups in northern Iraq.",
      "Sardar Aziz's Carnegie author note identifies him as a former senior adviser in the Kurdish parliament.",
      "Wladimir van Wilgenburg's Carnegie work provides granular Kurdish affairs reporting from Iraq/Syria/Iran-border contexts."
    ]
  },
  {
    id: "quincy",
    name: "Quincy Institute for Responsible Statecraft",
    shortName: "Quincy",
    type: "Restraint / anti-militarized foreign-policy institute",
    proximityScore: 32,
    proximityLabel: "Low",
    proximityRationale:
      "Quincy is influential in restraint circles and has a clear Trump 2.0 recommendations lane, but it is not close to a hawkish Republican Middle East policy network. Its importance is as a counterweight: troop withdrawal, de-escalation, and anti-permanent-war arguments.",
    middleEastPolicy:
      "Military restraint, diplomatic de-escalation, reduced permanent U.S. military footprint, skepticism toward open-ended partner-force commitments, and reduced regional war risk.",
    iraqPolicy:
      "Strong but critical: Quincy argues for normalizing U.S.-Iraq relations and drawing down the U.S. military presence while avoiding proxy-war escalation with Iran.",
    kurdistanPolicy:
      "Indirect but important: Quincy is not KRG-focused, but its Iraq/Syria withdrawal and restraint arguments could reduce the security umbrella that Erbil and Syrian Kurdish actors often depend on.",
    specificity: "Medium",
    people: ["quincy-adam-weinstein", "quincy-steven-simon", "quincy-trita-parsi"],
    sources: [
      ["Middle East program page", "https://quincyinst.org/program-areas/middle-east/"],
      ["Normalizing U.S.-Iraq Relations", "https://quincyinst.org/research/normalizing-u-s-iraq-relations-a-proposal-for-u-s-military-withdrawal-from-iraq-within-five-years/"],
      ["A New Era: Responding to a Post-Assad Syria", "https://quincyinst.org/research/a-new-era-responding-to-a-post-assad-syria/"],
      ["The PKK's Future: Real Dissolution or Strategic Shift?", "https://quincyinst.org/events/the-pkks-future-real-dissolution-or-strategic-shift/"],
      ["Restraint Foreign Policy Recommendations for Trump's Second Term", "https://quincyinst.org/research/trump-2-0-restraint-foreign-policy-recommendations-for-trumps-second-term/"],
      ["Trita Parsi profile", "https://quincyinst.org/author/trita-parsi/"]
    ],
    evidence: [
      "Quincy's Iraq report recommends drawing down the U.S. military presence over five years while helping Iraq counter ISIS-like threats.",
      "Its Syria work explicitly defines Syrian Kurds as Kurdish-led militias under the SDF banner and treats U.S. policy through restraint and post-Assad stabilization.",
      "Its PKK webinar connects PKK dissolution, Syria, Turkey, and U.S.-Türkiye relations."
    ]
  },
  {
    id: "new-america",
    name: "New America",
    shortName: "New America",
    type: "Policy research and civic innovation institute",
    proximityScore: 34,
    proximityLabel: "Low-medium",
    proximityRationale:
      "New America is policy-facing and useful for counterterrorism/proxy-war research, but it should be scored as analytic relevance rather than current administration proximity.",
    middleEastPolicy:
      "Counterterrorism, proxy warfare, U.S. war powers, Iraq/Syria lessons, civilian impact, and applied conflict research.",
    iraqPolicy:
      "Useful for Iraq because it analyzes U.S.-Iran proxy competition, Iraqi actor agency, counter-ISIS decision-making, and the risks of simplified militia narratives.",
    kurdistanPolicy:
      "Medium-high: New America has specific Kurdistan event programming, SDF/proxy-war analysis, counter-ISIS discussion of Kurdish forces, and Iraq proxy dynamics relevant to Erbil.",
    specificity: "Medium-high",
    people: ["newamerica-douglas-ollivant", "newamerica-erica-gaston", "newamerica-peter-bergen"],
    sources: [
      ["U.S.-Iran Proxy Competition in Iraq", "https://www.newamerica.org/insights/us-iran-proxy-competition-iraq/"],
      ["The Invisible Nation of Kurds event", "https://www.newamerica.org/events/the-invisible-nation-of-kurds/"],
      ["The Tweet of Damocles", "https://www.newamerica.org/insights/tweet-damocles/"],
      ["Decision-Making in the Counter-ISIS War", "https://www.newamerica.org/insights/decision-making-counter-isis-war/"],
      ["Twenty-First Century Proxy Warfare", "https://www.newamerica.org/insights/twenty-first-century-proxy-warfare-confronting-strategic-innovation-multipolar-world/"]
    ],
    evidence: [
      "New America's U.S.-Iran Proxy Competition in Iraq report focuses on U.S./Iran partnerships, proxy dynamics, and Iraqi actor agency.",
      "The Invisible Nation of Kurds event framed the Kurdish question as a global flashpoint shaping Iraq and the Middle East.",
      "Its SDF/proxy-war work analyzes how U.S. reliance on Kurdish-led partner forces in Syria created strategic and political consequences."
    ]
  }
];
