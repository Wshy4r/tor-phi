export const extraIntelligenceFiles = {
  uk: {
    agencies: [
      {
        name: "Secret Intelligence Service",
        shortName: "SIS / MI6",
        archive: "Public institutional material",
        url: "https://www.sis.gov.uk/",
        focus: "UK external intelligence public material. Operational or declassified Kurdistan-specific records require archive and FOI research."
      },
      {
        name: "Ministry of Defence",
        shortName: "MOD",
        archive: "FOI releases, operations updates, and annual reports",
        url: "https://www.gov.uk/government/organisations/ministry-of-defence",
        focus: "Operation Shader, Iraq security assistance, Peshmerga training, and military operations records."
      },
      {
        name: "The National Archives",
        shortName: "TNA",
        archive: "UK government records",
        url: "https://www.nationalarchives.gov.uk/",
        focus: "Historical FCDO, MOD, Cabinet Office, and intelligence-adjacent files as they become available."
      }
    ],
    documents: [
      {
        id: "uk-intel-slot-shader-peshmerga",
        title: "Operation Shader / Peshmerga training record",
        agency: "MOD",
        year: 2024,
        documentDate: "2024-09-27",
        releaseDate: "2024-09-27",
        classificationStatus: "Official public record",
        url: "https://www.gov.uk/government/news/uk-response-to-the-conclusion-of-the-global-coalitions-military-mission-in-iraq",
        sourceType: "Official statement",
        themes: ["Peshmerga", "Counter-ISIS", "Iraq", "Training"],
        stanceSignal: "Security partner",
        relevance: 82,
        reliability: 90,
        whatItSays:
          "The UK publicly recorded its Operation Shader / Op Inherent Resolve contribution, including training and assistance for Kurdish Peshmerga.",
        whatItMeans:
          "This is the strongest starting point for the UK intelligence/security layer because it connects public defence policy to a concrete Kurdish force relationship.",
        analystNotes: "Next imports should collect MOD annual reports, FOI releases, and Iraq/Syria air-strike logs mentioning Peshmerga, Kurdistan Region, Erbil, Mosul, and northern Iraq."
      },
      {
        id: "uk-intel-slot-home-office-kri",
        title: "UK country-policy notes on KRG protection and Kurdish groups",
        agency: "Home Office / UKVI",
        year: 2026,
        documentDate: "2025-2026",
        releaseDate: "Current",
        classificationStatus: "Official public guidance",
        url: "https://www.gov.uk/government/publications/iraq-country-policy-and-information-notes",
        sourceType: "Country policy and information notes",
        themes: ["KRG institutions", "Human rights", "Iranian Kurds", "Asylum"],
        stanceSignal: "Critical scrutiny layer",
        relevance: 66,
        reliability: 82,
        whatItSays:
          "UK country notes create a public assessment layer about KRG protection capacity, minorities, opposition activity, and Kurdish political groups.",
        whatItMeans:
          "This should be separated from UK diplomacy: it is not a friendship signal, but it matters because it shapes bureaucratic and legal views of KRG institutions.",
        analystNotes: "Tag each note by whether it discusses KRG, Iranian Kurds, Syrian Kurds, Turkish Kurds, opposition parties, security forces, minorities, or asylum risk."
      }
    ],
    analysisAxes: [
      "Counter-ISIS security partner",
      "Peshmerga training",
      "Iraq sovereignty frame",
      "Human-rights scrutiny",
      "Iranian Kurdish opposition spillover",
      "National Security Council contact"
    ]
  },
  iran: {
    agencies: [
      {
        name: "Office of the Supreme Leader",
        shortName: "Leader.ir",
        archive: "Official leadership statements",
        url: "https://www.leader.ir/en",
        focus: "Not an intelligence archive, but essential for the top security-political line after the 2026 leadership transition."
      },
      {
        name: "Ministry of Foreign Affairs",
        shortName: "Iran MFA",
        archive: "Official statements and events archive",
        url: "https://en.mfa.gov.ir/",
        focus: "Foreign-policy readouts that show Tehran's public line toward Iraq, the Kurdistan Region, security agreements, and regional crisis management."
      },
      {
        name: "Ministry of Intelligence",
        shortName: "VAJA",
        archive: "Limited public material",
        url: "https://www.vaja.ir/",
        focus: "Security-state public material. Kurdistan-specific interpretation must be handled cautiously because declassified-source availability is limited."
      }
    ],
    documents: [
      {
        id: "ir-intel-slot-security-agreement",
        title: "Iran-Iraq-KRG security agreement references",
        agency: "Iran MFA / KRG Presidency / Baghdad-Erbil-Tehran channel",
        year: 2024,
        documentDate: "2024-09-12",
        releaseDate: "2024-09-12",
        classificationStatus: "Official public readout",
        url: "https://presidency.gov.krd/en/kurdistan-region-and-iran-emphasize-developing-bilateral-relations/",
        sourceType: "Official KRG readout",
        themes: ["Security agreement", "Border security", "Iranian Kurdish opposition", "KRG assurances"],
        stanceSignal: "Close but securitized",
        relevance: 84,
        reliability: 86,
        whatItSays:
          "The KRG publicly stressed that Kurdistan Region territory does not pose a threat to Iran and that it is committed to the Iraq-Iran security agreement.",
        whatItMeans:
          "This is the core Iranian constraint: friendliness and trade are real, but Tehran expects security guarantees regarding opposition groups and border activity.",
        analystNotes: "Build a dedicated file for every mention of security agreement, Iranian Kurdish parties, border provinces, drone/missile attacks, and Baghdad-Erbil-Tehran committees."
      },
      {
        id: "ir-intel-slot-leadership-transition",
        title: "Iran leadership transition and KRG access record",
        agency: "Leader.ir / Presidency of Iran / KRG Presidency",
        year: 2026,
        documentDate: "2026-07-03",
        releaseDate: "2026-07-03",
        classificationStatus: "Official public readouts",
        url: "https://presidency.gov.krd/en/president-nechirvan-barzani-attends-the-official-funeral-ceremony-for-irans-late-supreme-leader-grand-ayatollah-seyyed-ali-khamenei/",
        sourceType: "Official public record",
        themes: ["Leadership transition", "KRG access", "Tehran meetings", "Regional crisis"],
        stanceSignal: "Access during volatility",
        relevance: 78,
        reliability: 84,
        whatItSays:
          "Nechirvan Barzani attended Ali Khamenei's funeral and met Iranian senior officials in Tehran during the transition period.",
        whatItMeans:
          "KRG access survived an unstable moment, but the new leadership's direct Kurdistan line still needs to be collected.",
        analystNotes: "Track direct statements by Mojtaba Khamenei, Pezeshkian, Araghchi, Ghalibaf, IRGC-linked media, and border province officials."
      }
    ],
    analysisAxes: [
      "Security agreement",
      "Border and opposition-party concern",
      "Trade and pilgrimage corridors",
      "Leadership-transition volatility",
      "Cultural and linguistic ties",
      "Baghdad-Erbil-Tehran coordination"
    ]
  }
};
