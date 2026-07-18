export const dailyBriefTabs = [
  {
    key: "global",
    label: "All Country",
    description: "Everything attached to this country stream, before extracting Iraq-only or Kurdistan-only signals."
  },
  {
    key: "iraq",
    label: "Iraq",
    description: "Signals that mention Iraq, Baghdad, Mosul, Kirkuk, the anti-ISIS file, or federal-Iraq policy."
  },
  {
    key: "kurdistan",
    label: "Kurdistan",
    description: "Signals that mention Kurdistan, KRG, Erbil, Peshmerga, Yazidis, Sinjar, or Northern Iraq."
  }
];

export const dailyBriefSourceFeeds = {
  usa: {
    global: [
      ["White House news", "https://www.whitehouse.gov/news/"],
      ["State Department press releases", "https://www.state.gov/press-releases/"],
      ["Defense Department releases", "https://www.defense.gov/News/Releases/"],
      ["Congress.gov latest action", "https://www.congress.gov/"]
    ],
    iraq: [
      ["State.gov Iraq search", "https://www.state.gov/?s=Iraq"],
      ["U.S. Embassy Baghdad", "https://iq.usembassy.gov/news-events/"],
      ["Congress.gov Iraq search", "https://www.congress.gov/search?q=%7B%22search%22%3A%22Iraq%22%7D"],
      ["Defense.gov Iraq search", "https://www.defense.gov/Search/?query=Iraq"]
    ],
    kurdistan: [
      ["State.gov Kurdistan search", "https://www.state.gov/?s=Kurdistan"],
      ["State.gov KRG search", "https://www.state.gov/?s=KRG"],
      ["U.S. Embassy Baghdad Kurdistan search", "https://iq.usembassy.gov/?s=Kurdistan"]
    ]
  },
  turkey: {
    global: [
      ["Presidency news", "https://www.tccb.gov.tr/en/news/"],
      ["Turkish MFA press releases", "https://www.mfa.gov.tr/sub.en.mfa?e3e521d0-0580-4fbd-87f4-5a1f4f1dd6e7"],
      ["Anadolu English", "https://www.aa.com.tr/en"],
      ["TRT World", "https://www.trtworld.com/"]
    ],
    iraq: [
      ["Turkish MFA Iraq search", "https://www.mfa.gov.tr/search.en.mfa?searchText=Iraq"],
      ["Anadolu Iraq search", "https://www.aa.com.tr/en/search/?s=iraq"],
      ["TRT World Iraq search", "https://www.trtworld.com/search?q=iraq"],
      ["Daily Sabah Iraq search", "https://www.dailysabah.com/search?query=iraq"]
    ],
    kurdistan: [
      ["Turkish MFA Kurdistan search", "https://www.mfa.gov.tr/search.en.mfa?searchText=Kurdistan"],
      ["Anadolu Kurdistan search", "https://www.aa.com.tr/en/search/?s=kurdistan"],
      ["TRT World Kurdistan search", "https://www.trtworld.com/search?q=kurdistan"],
      ["Daily Sabah Kurdistan search", "https://www.dailysabah.com/search?query=kurdistan"]
    ]
  },
  france: {
    global: [
      ["Elysee news", "https://www.elysee.fr/en/news"],
      ["France Diplomatie news", "https://www.diplomatie.gouv.fr/en/coming-to-france/news/"],
      ["National Assembly news", "https://www.assemblee-nationale.fr/"],
      ["AFP", "https://www.afp.com/en/news-hub"]
    ],
    iraq: [
      ["France Diplomatie Iraq search", "https://www.diplomatie.gouv.fr/en/search/?recherche=Iraq"],
      ["National Assembly Iraq search", "https://www.assemblee-nationale.fr/dyn/recherche/resultats?search_text=Iraq"],
      ["France 24 Iraq search", "https://www.france24.com/en/search?query=Iraq"],
      ["Le Monde Iraq search", "https://www.lemonde.fr/en/search/?search_keywords=Iraq"]
    ],
    kurdistan: [
      ["France Diplomatie Kurdistan search", "https://www.diplomatie.gouv.fr/en/search/?recherche=Kurdistan"],
      ["National Assembly Kurdistan search", "https://www.assemblee-nationale.fr/dyn/recherche/resultats?search_text=Kurdistan"],
      ["France 24 Kurdistan search", "https://www.france24.com/en/search?query=Kurdistan"],
      ["Le Monde Kurdistan search", "https://www.lemonde.fr/en/search/?search_keywords=Kurdistan"]
    ]
  },
  uk: {
    global: [
      ["GOV.UK news", "https://www.gov.uk/search/news-and-communications"],
      ["FCDO news", "https://www.gov.uk/government/organisations/foreign-commonwealth-development-office"],
      ["UK Parliament news", "https://www.parliament.uk/business/news/"],
      ["Hansard", "https://hansard.parliament.uk/"]
    ],
    iraq: [
      ["GOV.UK Iraq search", "https://www.gov.uk/search/all?keywords=Iraq"],
      ["FCDO Iraq search", "https://www.gov.uk/search/news-and-communications?keywords=Iraq&organisations%5B%5D=foreign-commonwealth-development-office"],
      ["Hansard Iraq search", "https://hansard.parliament.uk/search?searchTerm=Iraq"],
      ["BBC Iraq search", "https://www.bbc.co.uk/search?q=Iraq"]
    ],
    kurdistan: [
      ["GOV.UK Kurdistan search", "https://www.gov.uk/search/all?keywords=Kurdistan"],
      ["FCDO Kurdistan search", "https://www.gov.uk/search/news-and-communications?keywords=Kurdistan&organisations%5B%5D=foreign-commonwealth-development-office"],
      ["Hansard Kurdistan search", "https://hansard.parliament.uk/search?searchTerm=Kurdistan"],
      ["BBC Kurdistan search", "https://www.bbc.co.uk/search?q=Kurdistan"]
    ]
  },
  iran: {
    global: [
      ["President of Iran news", "https://president.ir/en"],
      ["Iran MFA news", "https://en.mfa.gov.ir/portal/newsview"],
      ["IRNA English", "https://en.irna.ir/"],
      ["Press TV", "https://www.presstv.ir/"]
    ],
    iraq: [
      ["Iran MFA Iraq search", "https://en.mfa.gov.ir/portal/search?search=Iraq"],
      ["IRNA Iraq search", "https://en.irna.ir/search?q=Iraq"],
      ["Press TV Iraq search", "https://www.presstv.ir/Search?search=Iraq"],
      ["Tasnim Iraq search", "https://www.tasnimnews.com/en/search?query=iraq"]
    ],
    kurdistan: [
      ["Iran MFA Kurdistan search", "https://en.mfa.gov.ir/portal/search?search=Kurdistan"],
      ["IRNA Kurdistan search", "https://en.irna.ir/search?q=Kurdistan"],
      ["Press TV Kurdistan search", "https://www.presstv.ir/Search?search=Kurdistan"],
      ["Tasnim Kurdistan search", "https://www.tasnimnews.com/en/search?query=kurdistan"]
    ]
  }
};
