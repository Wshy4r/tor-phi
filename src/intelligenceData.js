import { extraIntelligenceFiles } from "./extraIntelligenceData.js";

export const intelligenceFiles = {
  usa: {
    agencies: [
      {
        name: "Central Intelligence Agency",
        shortName: "CIA",
        archive: "CIA Records Search Tool / CREST",
        url: "https://www.cia.gov/readingroom/",
        focus: "Declassified intelligence reports, finished intelligence, historical collection material, and FOIA releases."
      },
      {
        name: "Defense Intelligence Agency",
        shortName: "DIA",
        archive: "DIA FOIA Electronic Reading Room",
        url: "https://www.dia.mil/FOIA/FOIA-Electronic-Reading-Room/",
        focus: "Defense intelligence records, military assessments, and regional security material."
      },
      {
        name: "Office of the Director of National Intelligence",
        shortName: "ODNI",
        archive: "ODNI FOIA / IC releases",
        url: "https://www.dni.gov/index.php/ic-legal-reference-book/foia",
        focus: "Intelligence community policy, declassified releases, and cross-agency records."
      },
      {
        name: "National Security Archive",
        shortName: "NSA Archive",
        archive: "Declassified document collections",
        url: "https://nsarchive.gwu.edu/",
        focus: "Curated declassified U.S. government collections, including Iraq and regional policy files."
      }
    ],
    documents: [
      {
        id: "usa-intel-slot-cia-kurds-iraq",
        title: "CIA archive search: Kurds / Iraq / autonomy",
        agency: "CIA",
        year: 0,
        documentDate: "To collect",
        releaseDate: "To collect",
        classificationStatus: "Source slot",
        url: "https://www.cia.gov/readingroom/search/site/kurds%20iraq",
        sourceType: "Archive search",
        themes: ["Kurdish politics", "Iraq", "Autonomy"],
        stanceSignal: "Unreviewed",
        relevance: 72,
        reliability: 0,
        whatItSays:
          "Reserved for declassified CIA documents about Kurdish politics, autonomy, parties, insurgency, Iraq policy, or regional pressure.",
        whatItMeans:
          "Once documents are attached, compare intelligence language with public U.S. diplomacy to show how internal assessments changed over time.",
        analystNotes: "Collect exact title, date, release collection, document number, PDF URL, and quoted summary."
      },
      {
        id: "usa-intel-slot-dod-peshmerga",
        title: "Defense intelligence / military records: Peshmerga and northern Iraq",
        agency: "DIA / DoD",
        year: 0,
        documentDate: "To collect",
        releaseDate: "To collect",
        classificationStatus: "Source slot",
        url: "https://www.dia.mil/FOIA/FOIA-Electronic-Reading-Room/",
        sourceType: "Archive portal",
        themes: ["Peshmerga", "Security", "Northern Iraq"],
        stanceSignal: "Unreviewed",
        relevance: 65,
        reliability: 0,
        whatItSays:
          "Reserved for declassified defense intelligence, military assessments, and FOIA records connected to Peshmerga or northern Iraq.",
        whatItMeans:
          "This layer should clarify how U.S. military/intelligence views differed from political statements, especially before and after ISIS.",
        analystNotes: "Prioritize records with dates, commanders, security assistance, force assessments, or threat language."
      },
      {
        id: "usa-intel-slot-iraq-policy",
        title: "Declassified Iraq policy intelligence mentioning Kurdish actors",
        agency: "U.S. Intelligence Community",
        year: 0,
        documentDate: "To collect",
        releaseDate: "To collect",
        classificationStatus: "Source slot",
        url: "https://www.dni.gov/",
        sourceType: "Multi-agency source",
        themes: ["Iraq policy", "Regional stability", "Kurdish parties"],
        stanceSignal: "Unreviewed",
        relevance: 58,
        reliability: 0,
        whatItSays:
          "Reserved for intelligence community documents that mention Kurdish actors inside broader Iraq, Iran, Syria, or Turkey assessments.",
        whatItMeans:
          "These records will help distinguish whether Kurdistan was treated as a direct actor, a minority issue, a security partner, or a regional variable.",
        analystNotes: "Tag every document by country lens: Iraq, Iran, Turkey, Syria, U.S. security, energy, humanitarian."
      }
    ],
    analysisAxes: [
      "Security partner",
      "Autonomy / federalism",
      "Iraq unity constraint",
      "Regional spillover",
      "Humanitarian protection",
      "Energy and economic interest"
    ]
  },
  turkey: {
    agencies: [
      {
        name: "National Intelligence Organization",
        shortName: "MIT",
        archive: "Public institutional releases",
        url: "https://www.mit.gov.tr/en/",
        focus: "Turkish intelligence public material; declassified historical record availability may be limited."
      },
      {
        name: "Ministry of Foreign Affairs",
        shortName: "MFA archive",
        archive: "Official statements archive",
        url: "https://www.mfa.gov.tr/",
        focus: "Not an intelligence archive, but useful for pairing public policy with security-state signals."
      }
    ],
    documents: [
      {
        id: "tur-intel-slot-mit-kurdish-file",
        title: "MIT / security-state public record on Kurdish file",
        agency: "MIT / security institutions",
        year: 0,
        documentDate: "To collect",
        releaseDate: "To collect",
        classificationStatus: "Source slot",
        url: "https://www.mit.gov.tr/en/",
        sourceType: "Public institutional source",
        themes: ["Security", "PKK", "Iraq", "KRG relations"],
        stanceSignal: "Unreviewed",
        relevance: 70,
        reliability: 0,
        whatItSays:
          "Reserved for public or historical records from Turkish security institutions that describe Kurdish actors, Iraq, or border security.",
        whatItMeans:
          "This file should separate Ankara's KRG engagement from its PKK/YPG threat framing.",
        analystNotes: "Expect fewer declassified records; use careful source labels and avoid inferring classified positions."
      }
    ],
    analysisAxes: ["Security threat framing", "KRG economic channel", "PKK/YPG constraint", "Iraq sovereignty", "Border operations"]
  },
  france: {
    agencies: [
      {
        name: "Directorate-General for External Security",
        shortName: "DGSE",
        archive: "Public institutional material",
        url: "https://www.dgse.gouv.fr/",
        focus: "French external intelligence public material; declassified intelligence records may require archival research."
      },
      {
        name: "Diplomatic Archives",
        shortName: "Archives diplomatiques",
        archive: "French diplomatic archives",
        url: "https://www.diplomatie.gouv.fr/en/the-ministry-and-its-network/archives-and-heritage/",
        focus: "Not an intelligence agency, but useful for historical context and declassified foreign policy files."
      }
    ],
    documents: [
      {
        id: "fra-intel-slot-dgse-kurdistan",
        title: "French intelligence / archival references to Kurdish issue",
        agency: "DGSE / French archives",
        year: 0,
        documentDate: "To collect",
        releaseDate: "To collect",
        classificationStatus: "Source slot",
        url: "https://www.dgse.gouv.fr/",
        sourceType: "Archive research slot",
        themes: ["Kurdish issue", "Iraq", "Humanitarian protection", "Regional stability"],
        stanceSignal: "Unreviewed",
        relevance: 62,
        reliability: 0,
        whatItSays:
          "Reserved for French intelligence, security, or archival material that directly mentions Kurdish actors or Kurdistan.",
        whatItMeans:
          "This file should test whether France's public sympathy aligns with internal regional-stability assessments.",
        analystNotes: "Pair French-side archival material with Elysee and France Diplomatie readouts."
      }
    ],
    analysisAxes: ["Humanitarian protection", "Anti-ISIS security", "Iraq stability", "Minority rights", "Turkey sensitivity"]
  },
  ...extraIntelligenceFiles
};
