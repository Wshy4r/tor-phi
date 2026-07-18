import { documentDepthProfiles } from "./foreignPolicyDocumentDepth.js";
import { congressionalBookRecords } from "./congressionalBookDocuments.js";

const bookSlot = (personId, filename) => `/source/books/${personId}/${encodeURIComponent(filename)}`;
const fidanPdf = "/source/fidan/fidan-intelligence-foreign-policy-1999.pdf";

function makeDocument(document) {
  const depthProfile = documentDepthProfiles[document.id] ?? {};
  const slug = document.slug || document.id;
  const sourceLinks = [
    ...(document.localPdfAvailable && document.localPdfPath ? [["Local PDF / reader slot", document.localPdfPath]] : []),
    ...(document.sourceLinks ?? []),
    ...(depthProfile.sourceLinks ?? [])
  ];
  const summaries = mergeDocumentSummaries(document.summaries, depthProfile.summaries);

  return {
    ...document,
    ...depthProfile,
    slug,
    sourceLinks,
    summaries,
    tags: uniqueStrings([...(document.tags ?? []), ...(depthProfile.tags ?? [])]),
    ocrStatus: document.ocrStatus || "PDF slot ready; OCR summary pending until a local PDF is added.",
    sourceBasis: document.sourceBasis || "Bibliographic and official-source profile. Add a local PDF and OCR text before treating the summary as document-complete."
  };
}

function mergeDocumentSummaries(base = {}, depth = {}) {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(depth).map(([key, value]) => [key, normalizeSummaryText(value)])
    )
  };
}

function normalizeSummaryText(value) {
  if (Array.isArray(value)) return value.join("\n\n");
  return `${value ?? ""}`;
}

function uniqueStrings(items) {
  const seen = new Set();
  return items
    .filter(Boolean)
    .map((item) => `${item}`.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export const foreignPolicyDocuments = [
  makeDocument({
    id: "fidan-intelligence-foreign-policy-1999",
    countryId: "turkey",
    personId: "hakan-fidan",
    personName: "Hakan Fidan",
    title: "Intelligence and Foreign Policy: A Comparison of British, American and Turkish Intelligence Systems",
    documentType: "Master's thesis",
    publisher: "Bilkent University",
    date: "1999",
    localPdfPath: fidanPdf,
    localPdfAvailable: true,
    posterUrl: "/source/posters/fidan-intelligence-foreign-policy-1999.png",
    posterCredit: "Local first-page render from the Bilkent thesis PDF",
    sourceUrl: "https://repository.bilkent.edu.tr/items/5186ec16-7e86-4877-8826-848e4464b0d8",
    sourceLinks: [
      ["Bilkent repository record", "https://repository.bilkent.edu.tr/items/5186ec16-7e86-4877-8826-848e4464b0d8"],
      ["Turkish MFA biography", "https://www.mfa.gov.tr/minister-of-fa-info.en.mfa"]
    ],
    ocrStatus: "OCR-backed local PDF. The profile summary is based on the local extracted text already attached in TOR Phi.",
    sourceBasis: "Local PDF and OCR text extracted from the thesis, cross-checked with the Bilkent repository record.",
    description:
      "Fidan's 1999 Bilkent thesis compares British, American, and Turkish intelligence systems to ask how intelligence should support foreign-policy decision-making, coordination, oversight, and national strategic capacity.",
    summaries: {
      bookSummary:
        "The thesis argues that strong foreign intelligence is necessary for sound foreign policy. It reviews intelligence types, the intelligence-policy relationship, the UK and U.S. systems, then compares them with the Turkish system. The conclusion recommends stronger Turkish foreign-intelligence capacity, better coordination with policymakers, external oversight, economic and technical intelligence, treaty-monitoring capacity, and an information-warfare concept.",
      personInsight:
        "This is one of the best early windows into Fidan's institutional mind. It shows him thinking about intelligence as a policy-support system, not only covert action or domestic security. The text values strategic warning, foreign intelligence, coordination, oversight, and state capacity. That helps explain why his later MIT and foreign-ministry profile should be read through a security-policy lens.",
      middleEastKurdistanRelevance:
        "The thesis is not a KRG text, but it is highly relevant to Iraq, Syria, and Kurdistan analysis because it frames Turkey's post-Cold War activism, the Gulf War precedent, peacekeeping, treaty monitoring, near-abroad intelligence, and the limits of relying on allies. It helps explain why Ankara may treat the Kurdistan file as a foreign-intelligence, border-security, and strategic-policy problem at the same time."
    },
    tags: ["intelligence", "foreign policy", "Turkiye", "OCR-backed", "Kurdistan context"]
  }),
  makeDocument({
    id: "fidan-information-technologies-verification-2006",
    countryId: "turkey",
    personId: "hakan-fidan",
    personName: "Hakan Fidan",
    title: "Diplomacy in the Information Age: The Use of Information Technologies in the Verification of International Agreements",
    documentType: "PhD dissertation",
    publisher: "Bilkent University",
    date: "2006",
    localPdfPath: bookSlot("hakan-fidan", "fidan-information-technologies-verification-2006.pdf"),
    sourceUrl: "https://repository.bilkent.edu.tr/items/79d25f0d-c2d1-4441-b3f6-11104f3cf34c",
    sourceLinks: [
      ["Bilkent repository record", "https://repository.bilkent.edu.tr/items/79d25f0d-c2d1-4441-b3f6-11104f3cf34c"],
      ["KURE Encyclopedia Hakan Fidan profile", "https://kureansiklopedi.com/en/detay/hakan-fidan-1ef46"]
    ],
    description:
      "Fidan's doctoral dissertation studies how information technologies affect verification of international agreements, a theme that connects diplomacy, technical monitoring, compliance, and state capacity.",
    ocrStatus: "Bilkent repository record verified. The item is marked limited-access by Bilkent, so no valid local PDF is attached yet.",
    sourceBasis: "Bilkent repository abstract, metadata, and public biography references; not a local OCR reading.",
    summaries: {
      bookSummary:
        "The repository abstract presents the dissertation as an argument that the information revolution significantly affects verification of international agreements. Until the local PDF is added and OCRed, the internal summary should be treated as source-based rather than a full document reading.",
      personInsight:
        "Placed after his intelligence-system thesis, the dissertation suggests a continuing interest in the technical infrastructure of diplomacy: verification, monitoring, information flows, and the state capacity needed to judge compliance. This reinforces Fidan's image as a security technocrat rather than a purely rhetorical diplomat.",
      middleEastKurdistanRelevance:
        "The work is not directly about Kurdistan. Its relevance is methodological: Turkey's policy toward Iraq, Syria, KRG energy routes, border arrangements, and armed-group commitments often depends on verification claims. A Fidan profile should therefore track how he uses evidence, monitoring, and compliance language."
    },
    tags: ["verification", "technology", "diplomacy", "PDF needed"]
  }),
  makeDocument({
    id: "fidan-turkish-foreign-policy-century-2023",
    countryId: "turkey",
    personId: "hakan-fidan",
    personName: "Hakan Fidan",
    title: "Turkish Foreign Policy at the Turn of the Century of Turkiye: Challenges, Vision, Objectives, and Transformation",
    documentType: "Journal article / ministerial strategy text",
    publisher: "Insight Turkey / Turkish MFA",
    date: "2023-09-22",
    localPdfPath: bookSlot("hakan-fidan", "fidan-turkish-foreign-policy-century-of-turkiye-2023.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/fidan-turkish-foreign-policy-century-of-turkiye-2023.png",
    posterCredit: "Local first-page render from the Turkish MFA PDF",
    sourceUrl: "https://www.mfa.gov.tr/data/Hakan%20Fidan/Makaleler/article-by-minister-of-foreign-affairs-hakan-fidan-titled-turkish-foreign-policy-at-the-turn-of-the--century-of-turkiye---challenges--vision--objectives--and-transformation.pdf",
    sourceLinks: [
      ["Turkish MFA article archive", "https://www.mfa.gov.tr/sub.en.mfa?16d70532-2a15-49a7-9a42-dac5b817a0e2="],
      ["Turkish MFA PDF", "https://www.mfa.gov.tr/data/Hakan%20Fidan/Makaleler/article-by-minister-of-foreign-affairs-hakan-fidan-titled-turkish-foreign-policy-at-the-turn-of-the--century-of-turkiye---challenges--vision--objectives--and-transformation.pdf"],
      ["Turkish MFA biography", "https://www.mfa.gov.tr/minister-of-fa-info.en.mfa"]
    ],
    ocrStatus: "Local PDF imported from the Turkish MFA article archive; OCR can be expanded into paragraph-level notes later.",
    sourceBasis: "Turkish MFA-hosted Insight Turkey PDF with a local reader copy attached.",
    description:
      "Fidan's early foreign-minister article on Turkiye's foreign-policy vision, the Century of Turkiye frame, global disorder, regional responsibility, institutional transformation, and the MFA's role.",
    summaries: {
      bookSummary:
        "This is one of the strongest post-appointment Fidan texts. It presents Turkiye as a regional constructive and system-transformer actor in a world of multiple crises. The article links global governance reform, multipolar competition, food and energy insecurity, terrorism, migration, climate, technology, and regional instability into a single argument: Turkiye must protect national interests while shaping peace and prosperity in its neighborhood.",
      personInsight:
        "For Fidan, the article turns the academic themes from his theses into ministerial doctrine. Knowledge, institutional capacity, crisis management, and autonomy become foreign-ministry strategy. It also shows his loyalty to the Century of Turkiye frame while giving him a technocratic role: the MFA is not just a protocol ministry, but the execution engine for a state-wide geopolitical project.",
      middleEastKurdistanRelevance:
        "The article is not written as a KRG paper, but it is very relevant to Kurdistan Lens because the neighborhood frame includes the same operating environment that shapes KRG policy: Iraq, Syria, Iran, terrorism, energy, migration, regional reconstruction, and competition among global powers. It helps explain why Ankara may treat Erbil through several lenses at once: national security, regional order, economic connectivity, anti-terror policy, and Turkish strategic autonomy."
    },
    tags: ["Hakan Fidan", "Turkish foreign policy", "Century of Turkiye", "local PDF", "Kurdistan context"]
  }),
  makeDocument({
    id: "fidan-oic-transforming-world-2025",
    countryId: "turkey",
    personId: "hakan-fidan",
    personName: "Hakan Fidan",
    title: "The OIC in a Transforming World: Turkiye's Vision for a More Active and Unified Islamic Cooperation",
    documentType: "Ministerial article",
    publisher: "Turkish Ministry of Foreign Affairs",
    date: "2025-06-20",
    localPdfPath: bookSlot("hakan-fidan", "fidan-oic-transforming-world-2025.pdf"),
    sourceUrl: "https://www.mfa.gov.tr/article-by-minister-of-foreign-affairs-hakan-fidan-titled-the-oic-in-a-transforming-world-turkiye-s-vision.en.mfa",
    sourceLinks: [
      ["Turkish MFA article", "https://www.mfa.gov.tr/article-by-minister-of-foreign-affairs-hakan-fidan-titled-the-oic-in-a-transforming-world-turkiye-s-vision.en.mfa"],
      ["OIC CFM article mirror", "https://cfm51.oic-oci.org/2025/06/20/the-oic-in-a-transforming-world-turkiyes-vision-for-a-more-active-and-unified-islamic-cooperation"],
      ["Turkish MFA article archive", "https://www.mfa.gov.tr/sub.en.mfa?16d70532-2a15-49a7-9a42-dac5b817a0e2="]
    ],
    description:
      "Fidan's 2025 article on the OIC, Muslim-world coordination, Palestine, Iran, Islamophobia, mediation, capacity-building, and Turkiye's OIC chairmanship agenda.",
    summaries: {
      bookSummary:
        "The article frames the OIC as the Muslim world's principal collective voice at a time of geopolitical fragmentation, international-law erosion, Islamophobia, and regional crisis. Fidan argues that Turkiye wants a more active OIC built around cooperation with other international actors, protection of Muslim minorities, capacity-building, transport connectivity, mediation training, and disaster/humanitarian capability.",
      personInsight:
        "For Fidan, this text shows the multilateral-Islamic register of his diplomacy. It is not intelligence doctrine; it is coalition and legitimacy doctrine. He uses OIC language to connect Palestine, Iran, Muslim minorities, humanitarian aid, mediation, and institutional reform into Turkiye's claim to leadership inside the Islamic world.",
      middleEastKurdistanRelevance:
        "Direct KRG relevance is limited, but the text matters because Iraq and Kurdistan sit inside the same OIC/Middle East operating field: Muslim-world solidarity, minority protection, Iran-linked escalation, humanitarian response, and mediation. It is especially useful when comparing Fidan's formal KRG contacts with his broader Islamic-world legitimacy language."
    },
    tags: ["OIC", "Islamic cooperation", "Hakan Fidan", "PDF needed"]
  }),
  makeDocument({
    id: "kalin-reason-rationality-quran-2012",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Reason and Rationality in the Qur'an",
    documentType: "Book / monograph",
    publisher: "Royal Aal Al-Bayt Institute for Islamic Thought",
    date: "2012",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-reason-rationality-quran-2012.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-reason-rationality-quran-2012.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["Ibrahim Kalin publications page", "https://ibrahimkalin.com/?lang=en"],
      ["MIT director biography", "https://www.mit.gov.tr/en/baskan.html"]
    ],
    ocrStatus: "Local PDF attached. OCR reader notes exist in TOR Phi; a chapter-level OCR summary can be expanded later.",
    sourceBasis: "Local PDF slot plus the KURE Encyclopedia bibliography and MIT biography.",
    description:
      "A major Kalin text on reason, rationality, revelation, moral order, and Islamic philosophical vocabulary.",
    summaries: {
      bookSummary:
        "The book is an intellectual and theological treatment of reason in Qur'anic and Islamic philosophical language. For TOR Phi, it should be read as worldview evidence rather than as a policy memo.",
      personInsight:
        "It shows Kalin as a philosophical public intellectual whose security role cannot be separated from his vocabulary of reason, tradition, moral order, and civilizational interpretation.",
      middleEastKurdistanRelevance:
        "It is not directly about KRG or Kurdistan. Its value is indirect: it helps explain the conceptual language Kalin may bring to diplomacy, public legitimacy, religious authority, and regional order."
    },
    tags: ["Ibrahim Kalin", "Islamic philosophy", "local PDF"]
  }),
  makeDocument({
    id: "kalin-war-and-peace-islam-2013",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "War and Peace in Islam: The Uses and Abuses of Jihad",
    documentType: "Co-edited volume",
    publisher: "MABDA / Royal Aal Al-Bayt Institute",
    date: "2013",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-war-and-peace-islam-2013.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-war-and-peace-islam-2013.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["Royal Islamic Strategic Studies Centre PDF", "https://rissc.jo/books/War-Peace-Islam.pdf"],
      ["MIT director biography", "https://www.mit.gov.tr/en/baskan.html"]
    ],
    ocrStatus: "Local PDF attached; OCR-backed chapter summaries should be added in a later pass.",
    sourceBasis: "Local PDF slot plus bibliography confirmation.",
    description:
      "A security-intellectual edited volume on Islamic legal and ethical arguments about war, peace, and jihad.",
    summaries: {
      bookSummary:
        "The volume gathers arguments around war, peace, and the abuse of jihad language. Its policy value is not a single doctrine but the map of religious-legal vocabulary used to distinguish legitimate security arguments from extremist misuse.",
      personInsight:
        "For Kalin, the volume reinforces the image of a state-intellectual comfortable moving between theology, public diplomacy, and security language.",
      middleEastKurdistanRelevance:
        "Indirect but relevant to regional security. It can inform how Kalin may frame armed movements, legitimacy, religious authority, and counter-extremism in Middle East policy; it does not itself establish a KRG position."
    },
    tags: ["security", "Islam", "war and peace", "local PDF"]
  }),
  makeDocument({
    id: "kalin-islam-and-west-2007",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Islam and the West",
    documentType: "Book",
    publisher: "ISAM Publications",
    date: "2007",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-islam-and-west-2007.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-islam-and-west-2007.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["Ibrahim Kalin publications page", "https://ibrahimkalin.com/?lang=en"],
      ["MIT director biography", "https://www.mit.gov.tr/en/baskan.html"]
    ],
    ocrStatus: "Local PDF attached from the Source folder. OCR-backed chapter notes can be expanded in a later pass.",
    sourceBasis: "Local PDF plus KURE and Ibrahim Kalin publication listings.",
    description:
      "Kalin's early book on Islam-West relations, civilizational perception, intellectual history, and the political uses of identity.",
    summaries: {
      bookSummary:
        "This book is one of the key foundations for reading Kalin's public-intellectual profile. It treats Islam-West relations as a long historical and philosophical argument, not merely a clash of current governments. The policy value is the vocabulary: perception, civilizational confidence, moral order, historical memory, and the asymmetry between Western power and Muslim self-representation.",
      personInsight:
        "For Kalin, the book shows an actor who thinks strategically about narratives. His later public diplomacy and intelligence leadership should therefore be read with an eye to framing: who defines legitimacy, who tells the story of a conflict, and how Muslim political actors resist being read only through Western security categories.",
      middleEastKurdistanRelevance:
        "The book is not a Kurdistan policy source. Its relevance is indirect but useful: Turkish officials often discuss Iraq, Syria, the KRG, PKK/YPG, Islamophobia, Western pressure, and regional order through civilizational and legitimacy language. This book helps explain the deeper grammar behind that style of argument."
    },
    tags: ["Islam-West relations", "civilization", "public diplomacy", "local PDF"]
  }),
  makeDocument({
    id: "kalin-love-and-hate-western-perception-2008",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Between Love and Hate: Turkey's Perception of the West",
    documentType: "Co-authored research book",
    publisher: "SETA Publications",
    date: "2008",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-love-and-hate-western-perception-2008.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-love-and-hate-western-perception-2008.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["Ibrahim Kalin publications page", "https://ibrahimkalin.com/?lang=en"],
      ["SETA author archive", "https://www.setav.org/yazar/ibrahim-kalin"]
    ],
    ocrStatus: "Local PDF attached from the Source folder. OCR-backed chapter notes can be expanded in a later pass.",
    sourceBasis: "Local PDF plus KURE and Ibrahim Kalin publication listings.",
    description:
      "A SETA research volume on Turkish public and elite perceptions of the West, co-authored/edited with Bekir Berat Ozipek and Kudret Bulbul.",
    summaries: {
      bookSummary:
        "This is a perception-mapping text. It matters because it studies Turkey's relationship with the West as ambivalent: attraction, resentment, modernization, suspicion, dependency, and strategic aspiration at once. For a foreign-relations database, the book is valuable because it moves beyond personal opinion and treats perception as a policy variable.",
      personInsight:
        "Kalin appears here as an institution-builder and narrative analyst. The work fits his SETA period and shows why later roles in public diplomacy and presidential communication were natural extensions of his academic work. He is interested in how societies understand power, not only in formal diplomatic communiques.",
      middleEastKurdistanRelevance:
        "The Kurdistan relevance is indirect. Turkish policy toward the KRG can be shaped by Western pressure, U.S. partnership with Kurdish forces in Syria, European rights discourse, and Ankara's suspicion that outside powers instrumentalize Kurdish issues. This book helps analysts read that perception layer instead of treating every Turkish reaction as only tactical."
    },
    tags: ["SETA", "West perception", "public opinion", "local PDF"]
  }),
  makeDocument({
    id: "kalin-500-most-influential-muslims-2009",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "The 500 Most Influential Muslims",
    documentType: "Co-edited reference work",
    publisher: "Royal Islamic Strategic Studies Centre",
    date: "2009",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-500-most-influential-muslims-2009.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-500-most-influential-muslims-2009.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://themuslim500.com/wp-content/uploads/2018/05/TheMuslim500-2009-low.pdf",
    sourceLinks: [
      ["The Muslim 500 2009 PDF", "https://themuslim500.com/wp-content/uploads/2018/05/TheMuslim500-2009-low.pdf"],
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"]
    ],
    ocrStatus: "Local PDF attached from the Source folder. OCR-backed notes can later map people, institutions, countries, and categories.",
    sourceBasis: "Local PDF plus official Muslim 500 PDF and KURE bibliography.",
    description:
      "The first edition of an annual Muslim-world influence reference work, with John Esposito and Ibrahim Kalin as chief editors.",
    summaries: {
      bookSummary:
        "This is not a policy book in the normal sense; it is a network map. It ranks and categorizes religious scholars, political leaders, administrators, intellectuals, media figures, philanthropists, and cultural actors. For TOR Phi, that makes it useful as influence-chain infrastructure: it shows which Muslim-world actors were considered institutionally significant in 2009 and how influence was sorted.",
      personInsight:
        "For Kalin, the work shows him embedded in transnational Muslim intellectual and institutional networks before his later state-security roles. It reinforces a profile of someone who can speak across academia, religion, public diplomacy, and statecraft.",
      middleEastKurdistanRelevance:
        "Direct KRG relevance is limited, but the reference-work logic is valuable. Kurdistan policy often depends on networks: clerics, political leaders, Gulf actors, Turkish institutions, Arab governments, and Western interlocutors. This source helps build the broader Muslim-world influence context around Turkish regional policy."
    },
    tags: ["influence networks", "Muslim world", "reference work", "local PDF"]
  }),
  makeDocument({
    id: "kalin-knowledge-later-islamic-philosophy-2010",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Knowledge in Later Islamic Philosophy: Mulla Sadra on Existence, Intellect and Intuition",
    documentType: "Academic monograph",
    publisher: "Oxford University Press",
    date: "2010",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-knowledge-later-islamic-philosophy-2010.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-knowledge-later-islamic-philosophy-2010.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["Ibrahim Kalin publications page", "https://ibrahimkalin.com/?lang=en"]
    ],
    ocrStatus: "Local PDF attached from the Source folder. OCR-backed chapter notes can be expanded in a later pass.",
    sourceBasis: "Local PDF plus KURE and Ibrahim Kalin publication listings.",
    description:
      "Kalin's Oxford University Press monograph on Mulla Sadra, existence, intellect, intuition, and Islamic epistemology.",
    summaries: {
      bookSummary:
        "This is Kalin's deepest academic philosophy source in the current local archive. It is about how knowledge is grounded: existence, intellect, intuition, metaphysics, and the relation between knower and known. In intelligence-profile terms, it shows that Kalin's idea of knowledge is not merely informational. Knowledge has moral, metaphysical, and civilizational weight.",
      personInsight:
        "This book strongly separates Kalin from a standard security bureaucrat. A person who wrote a major monograph on Mulla Sadra may approach statecraft through questions of meaning, order, tradition, and legitimate knowledge. That does not make every policy religious, but it does make his intellectual background unusually important for interpreting speeches and strategy language.",
      middleEastKurdistanRelevance:
        "There is no direct Kurdistan content. The relevance is profile-level: when Kalin speaks about intelligence, civilization, truth, or moral order, analysts should remember that these are not casual phrases. They come from a long academic engagement with Islamic epistemology and philosophy."
    },
    tags: ["Mulla Sadra", "Islamic philosophy", "epistemology", "local PDF"]
  }),
  makeDocument({
    id: "kalin-akil-ve-erdem-2013",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Reason and Virtue: Turkey's Social Imagination",
    documentType: "Book",
    publisher: "Kure Publications",
    date: "2013",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-akil-ve-erdem-2013.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-akil-ve-erdem-2013.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["Ibrahim Kalin publications page", "https://ibrahimkalin.com/?lang=en"]
    ],
    ocrStatus: "Local PDF attached from the Source folder. OCR-backed chapter notes can be expanded in a later pass.",
    sourceBasis: "Local PDF plus KURE and Ibrahim Kalin publication listings.",
    description:
      "A Turkey-focused intellectual book on reason, virtue, social imagination, and the moral-cultural basis of public life.",
    summaries: {
      bookSummary:
        "The book matters because it moves Kalin's philosophical vocabulary into Turkey's social and political imagination. It asks what kind of reason, virtue, and public meaning can sustain a society. For TOR Phi, this is useful because Turkish regional policy is often justified not only by interests but by claims about historical responsibility, social order, dignity, and moral-political balance.",
      personInsight:
        "For Kalin, this is a bridge text between scholar and state actor. It suggests that he sees public policy as connected to moral formation and collective imagination. That helps explain why his later institutional language can mix security, culture, religion, and public diplomacy without treating them as separate worlds.",
      middleEastKurdistanRelevance:
        "The Kurdistan relevance is indirect. KRG-facing analysis should use this book to understand how Kalin may evaluate order, social cohesion, legitimacy, and national imagination. It does not tell us his stance toward Erbil; it helps decode the deeper language behind Turkish state narratives."
    },
    tags: ["Turkey", "reason", "virtue", "social imagination", "local PDF"]
  }),
  makeDocument({
    id: "kalin-oxford-encyclopedia-2014",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "The Oxford Encyclopedia of Philosophy, Science, and Technology in Islam",
    documentType: "Edited encyclopedia",
    publisher: "Oxford University Press",
    date: "2014",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-oxford-encyclopedia-philosophy-science-technology-islam-2014.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-oxford-encyclopedia-philosophy-science-technology-islam-2014.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["Ibrahim Kalin publications page", "https://ibrahimkalin.com/?lang=en"]
    ],
    ocrStatus: "Local PDF attached from the Source folder. OCR-backed notes can later map article topics and contributors.",
    sourceBasis: "Local PDF plus KURE and Ibrahim Kalin publication listings.",
    description:
      "A major edited Oxford encyclopedia on philosophy, science, technology, and knowledge traditions in Islam.",
    summaries: {
      bookSummary:
        "This is a large intellectual infrastructure project rather than a single-argument monograph. It organizes Islamic philosophy, science, and technology into an English-language reference format. The document matters because it shows Kalin as an editor of knowledge systems, not only an author of personal essays.",
      personInsight:
        "For Kalin's profile, the encyclopedia shows institutional authority. He is able to curate a field, connect scholars, and present Islamic intellectual history to global audiences. That is exactly the kind of skill that later matters in public diplomacy and strategic communication.",
      middleEastKurdistanRelevance:
        "Direct Kurdistan relevance is absent. Indirectly, the work helps explain why Kalin may place regional politics inside a broader civilizational knowledge frame. For TOR Phi, it should be used as intellectual-background depth, not as evidence of a concrete KRG position."
    },
    tags: ["Oxford", "encyclopedia", "Islamic science", "local PDF"]
  }),
  makeDocument({
    id: "kalin-metaphysical-penetrations-2014",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "The Book of Metaphysical Penetrations: A Parallel English-Arabic Text of Kitab al-Masha'ir",
    documentType: "Edited / translated philosophical text",
    publisher: "Brigham Young University Press",
    date: "2014",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-metaphysical-penetrations-2014.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-metaphysical-penetrations-2014.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["Ibrahim Kalin publications page", "https://ibrahimkalin.com/?lang=en"]
    ],
    ocrStatus: "Local PDF attached from the Source folder. OCR-backed notes can later separate Sadra text, translation, and editorial framing.",
    sourceBasis: "Local PDF plus KURE and Ibrahim Kalin publication listings.",
    description:
      "A parallel English-Arabic Mulla Sadra text edited with Seyyed Hossein Nasr and Ibrahim Kalin.",
    summaries: {
      bookSummary:
        "This source belongs in Kalin's profile because it shows sustained engagement with primary Islamic philosophical texts, not only modern commentary. The editorial/translation role places him inside a lineage of scholarship concerned with existence, metaphysics, and knowledge.",
      personInsight:
        "For profile analysis, this strengthens the Mulla Sadra line in Kalin's worldview. It gives his later language about knowledge, truth, intelligence, and civilization a scholarly genealogy. The important point is not that this becomes policy directly; it is that his policy vocabulary is backed by a serious philosophical formation.",
      middleEastKurdistanRelevance:
        "No direct Kurdistan content. Use it as worldview evidence only. If Kalin frames regional politics through truth, order, metaphysics, or moral knowledge, this source helps explain why those terms may be central rather than decorative."
    },
    tags: ["Mulla Sadra", "translation", "metaphysics", "local PDF"]
  }),
  makeDocument({
    id: "kalin-enine-boyuna-turkiye-2017",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Enine Boyuna Turkiye",
    documentType: "Book / interview or essays collection",
    publisher: "SETA Publications",
    date: "2017",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-enine-boyuna-turkiye-2017.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-enine-boyuna-turkiye-2017.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["Ibrahim Kalin publications page", "https://ibrahimkalin.com/?lang=en"],
      ["SETA author archive", "https://www.setav.org/yazar/ibrahim-kalin"]
    ],
    ocrStatus: "Local PDF attached from the Source folder. OCR-backed notes can later extract Turkey, Iraq, Syria, West, and regional-policy passages.",
    sourceBasis: "Local PDF plus KURE and Ibrahim Kalin publication listings.",
    description:
      "A long Turkey-focused collection useful for reading Kalin's domestic-political, social, cultural, and foreign-policy framing.",
    summaries: {
      bookSummary:
        "This is one of the most policy-useful Kalin texts in the archive because it is centered on Turkey itself. It gives a broad view of social order, identity, state legitimacy, political change, foreign-policy imagination, and the AK Party-era public vocabulary. Unlike the purely philosophical works, this collection can help connect worldview to current politics.",
      personInsight:
        "For Kalin, the book shows the full public-intellectual profile: not only philosopher, not only spokesperson, not only intelligence leader. It places him in the role of interpreter of Turkey's direction. That matters because officials who interpret the state to the public often become important nodes in influence chains.",
      middleEastKurdistanRelevance:
        "This is the Kalin text most likely to produce useful Turkey/Kurdistan Lens material after OCR search. Analysts should search Iraq, Syria, Kurdish, PKK, YPG, West, Middle East, democracy, security, and civilization. Until that extraction is done, use it as a broad profile source rather than a direct KRG stance."
    },
    tags: ["Turkey", "SETA", "public policy", "local PDF"]
  }),
  makeDocument({
    id: "kalin-oze-yolculuk-2023",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Oze Yolculuk",
    documentType: "Book",
    publisher: "Insan Publications",
    date: "2023",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-oze-yolculuk-2023.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/kalin-oze-yolculuk-2023.png",
    posterCredit: "Local first-page render from the attached PDF",
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["MIT director biography", "https://www.mit.gov.tr/en/baskan.html"]
    ],
    ocrStatus: "Local PDF attached from the Source folder. OCR-backed chapter notes can be expanded in a later pass.",
    sourceBasis: "Local PDF plus KURE bibliography and MIT biography.",
    description:
      "A later Kalin work useful for mapping his spiritual, ethical, and civilizational vocabulary near the period of his MIT leadership.",
    summaries: {
      bookSummary:
        "This later work should be treated as worldview evidence from the period immediately around Kalin's move into the intelligence directorship. The value is not that it announces policy; it deepens the moral and spiritual vocabulary around self, responsibility, meaning, and order.",
      personInsight:
        "For Kalin's profile, the timing matters. A senior state actor publishing this kind of text in 2023 shows that his public identity remained intellectual and ethical even as he entered one of the most security-heavy roles in the Turkish state.",
      middleEastKurdistanRelevance:
        "Direct Kurdistan relevance is not established. Indirectly, it matters because a person with this vocabulary may frame security and diplomacy as questions of order, duty, moral seriousness, and civilizational self-understanding. Use it carefully as profile depth, not stance evidence."
    },
    tags: ["worldview", "ethics", "MIT period", "local PDF"]
  }),
  makeDocument({
    id: "kalin-i-self-other-2016",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "I, Self, and the Other: An Introduction to the History of Islamic-Western Relations",
    documentType: "Book",
    publisher: "Insan Publications",
    date: "2016",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-i-self-other-2016.pdf"),
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [
      ["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"],
      ["Ibrahim Kalin publications page", "https://ibrahimkalin.com/?lang=en"]
    ],
    description:
      "A later Islam-West relations book listed in Kalin's bibliography; local PDF still needs to be added.",
    summaries: {
      bookSummary:
        "This title extends Kalin's Islam-West line from perception and history into identity: self, other, boundary, recognition, and civilizational encounter. Until a local PDF is attached, TOR Phi should treat it as a verified bibliography slot rather than a full reading.",
      personInsight:
        "It strengthens the pattern that Kalin's career is built around interpreting Turkey and the Muslim world to themselves and to Western audiences. His state roles should be read through that interpretive function.",
      middleEastKurdistanRelevance:
        "Indirect. Kurdish issues are often internationalized through Western rights discourse and Turkish sovereignty language. A self/other framework can help explain why Ankara may respond strongly when it sees external actors defining Kurdish questions on Turkey's behalf."
    },
    tags: ["Islam-West relations", "identity", "PDF needed"]
  }),
  makeDocument({
    id: "kalin-barbar-savage-civilized-2018",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Barbar, Savage, Civilized: Notes on Civilizations",
    documentType: "Book",
    publisher: "Insan Publications",
    date: "2018",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-barbar-savage-civilized-2018.pdf"),
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"]],
    description:
      "A civilization-focused Kalin book listed in the KURE bibliography; local PDF still needs to be added.",
    summaries: {
      bookSummary:
        "The title signals a direct engagement with the language of civilization and hierarchy: who is called civilized, who is marked as barbaric, and how power organizes those labels. This belongs in Kalin's profile because civilization language is central to his public thought.",
      personInsight:
        "For Kalin, this title points to a political sensitivity around naming and hierarchy. In statecraft, that can appear as resistance to Western tutelage, emphasis on Turkish agency, and suspicion of narratives that place Turkey or the Muslim world in a subordinate moral position.",
      middleEastKurdistanRelevance:
        "Indirect. Kurdistan-related diplomacy can be shaped by labels such as terrorist, partner, minority, autonomous actor, proxy, stabilizer, or separatist. This source should later be read for how Kalin thinks about labeling and civilizational hierarchy."
    },
    tags: ["civilization", "political language", "PDF needed"]
  }),
  makeDocument({
    id: "kalin-veil-and-meaning-2020",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Veil and Meaning: An Analysis of Reason",
    documentType: "Book",
    publisher: "Insan Publications",
    date: "2020",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-veil-and-meaning-2020.pdf"),
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"]],
    description:
      "A reason-and-meaning title listed in Kalin's bibliography; local PDF still needs to be added.",
    summaries: {
      bookSummary:
        "This verified bibliography slot belongs next to Reason and Rationality and Reason and Virtue. It suggests Kalin's sustained interest in reason not as a dry technical faculty, but as a path into meaning, moral order, and interpretation.",
      personInsight:
        "For profile work, the repeated reason/meaning theme matters. Kalin is an actor who can treat political language as interpretive and moral. That affects how his speeches and institutional messages should be read.",
      middleEastKurdistanRelevance:
        "No direct KRG relevance until the text is imported. Its usefulness is in decoding Kalin's conceptual language when he discusses intelligence, order, legitimacy, or regional conflict."
    },
    tags: ["reason", "meaning", "PDF needed"]
  }),
  makeDocument({
    id: "kalin-open-horizon-2021",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Open Horizon: Thinking on the Good, the True and the Beautiful",
    documentType: "Book",
    publisher: "Insan Publications",
    date: "2021",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-open-horizon-2021.pdf"),
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"]],
    description:
      "A later Kalin book listed in KURE; local PDF still needs to be added.",
    summaries: {
      bookSummary:
        "This title extends the ethical-aesthetic side of Kalin's bibliography. Good, truth, and beauty are not conventional diplomatic categories, but in Kalin's profile they help explain a public language that links politics to moral and cultural horizons.",
      personInsight:
        "It reinforces Kalin as a civilizational intellectual. His later security role should not be read only through institutional biography; his public thought stays anchored in values and meaning.",
      middleEastKurdistanRelevance:
        "No direct Kurdistan evidence. Use it as soft profile context until the local text is available."
    },
    tags: ["ethics", "aesthetics", "PDF needed"]
  }),
  makeDocument({
    id: "kalin-sky-under-the-dome-2022",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Sky Under the Dome",
    documentType: "Book",
    publisher: "Medium Books",
    date: "2022",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-sky-under-the-dome-2022.pdf"),
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"]],
    description:
      "A later Kalin book listed in KURE; local PDF still needs to be added.",
    summaries: {
      bookSummary:
        "This is currently a bibliography slot rather than a local reading. It belongs in the profile because it fills the chronology between Kalin's public-intellectual works and his 2023 MIT leadership period.",
      personInsight:
        "For Kalin, the title strengthens the continuity of intellectual production across government service. TOR Phi should use it to keep the profile from becoming purely office-based.",
      middleEastKurdistanRelevance:
        "No direct Kurdistan relevance is established. It remains a profile-depth slot until the document is imported."
    },
    tags: ["worldview", "PDF needed"]
  }),
  makeDocument({
    id: "kalin-islam-enlightenment-future-2024",
    countryId: "turkey",
    personId: "ibrahim-kalin",
    personName: "Ibrahim Kalin",
    title: "Islam, Enlightenment and the Future",
    documentType: "Book",
    publisher: "Insan Publications",
    date: "2024",
    localPdfPath: bookSlot("ibrahim-kalin", "kalin-islam-enlightenment-future-2024.pdf"),
    sourceUrl: "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6",
    sourceLinks: [["KURE Encyclopedia bibliography", "https://kureansiklopedi.com/en/detay/ibrahim-kalin-ab7a6"]],
    description:
      "A 2024 Kalin book listed in KURE; local PDF still needs to be added.",
    summaries: {
      bookSummary:
        "This is the newest verified Kalin book slot in TOR Phi. The title suggests a direct continuation of his central themes: Islam, modernity, enlightenment, future order, and the intellectual position of Muslim societies.",
      personInsight:
        "The timing is important: this is a post-MIT-appointment bibliography item. It shows that Kalin's intellectual production continues while he is a top intelligence official, which is unusual and important for profile depth.",
      middleEastKurdistanRelevance:
        "No direct KRG content is established from the bibliography alone. Its value is to track the current philosophical vocabulary around modernity, order, and future regional imagination."
    },
    tags: ["Islam", "modernity", "MIT period", "PDF needed"]
  }),
  makeDocument({
    id: "rubio-an-american-son-2012",
    countryId: "usa",
    personId: "marco-rubio",
    personName: "Marco Rubio",
    title: "An American Son: A Memoir",
    documentType: "Book / memoir",
    publisher: "Sentinel / Penguin Random House",
    date: "2012",
    localPdfPath: bookSlot("marco-rubio", "rubio-an-american-son-2012.pdf"),
    posterUrl: "https://images4.penguinrandomhouse.com/smedia/9781101592373",
    posterCredit: "Penguin Random House cover image",
    sourceUrl: "https://www.penguinrandomhouse.com/books/311989/an-american-son-by-marco-rubio/",
    sourceLinks: [
      ["Penguin Random House book page", "https://www.penguinrandomhouse.com/books/311989/an-american-son-by-marco-rubio/"],
      ["Marco Rubio Penguin Random House author page", "https://www.penguinrandomhouse.com/authors/270033/marco-rubio/"]
    ],
    description:
      "Rubio's memoir traces family origin, Cuban-American identity, Florida politics, and his rise to the U.S. Senate.",
    summaries: {
      bookSummary:
        "The memoir centers on family migration, opportunity, faith, hard work, local politics, and the 2010 Senate campaign. It is more identity-and-rise narrative than a foreign-policy treatise.",
      personInsight:
        "For Rubio, the book matters because it locates his politics in exile memory, immigrant opportunity, anticommunist inheritance, faith, and a belief in American exceptionalism. Those themes help explain why he often treats authoritarian states, alliances, and U.S. credibility in moral-political terms.",
      middleEastKurdistanRelevance:
        "No direct Kurdistan relevance. Indirectly, the memoir helps explain Rubio's broader worldview: U.S. leadership, opposition to authoritarian influence, and sympathy for communities that frame themselves as pro-American partners."
    },
    tags: ["memoir", "Rubio", "identity", "PDF needed"]
  }),
  makeDocument({
    id: "rubio-american-dreams-2015",
    countryId: "usa",
    personId: "marco-rubio",
    personName: "Marco Rubio",
    title: "American Dreams: Restoring Economic Opportunity for Everyone",
    documentType: "Book / policy manifesto",
    publisher: "Sentinel / Penguin Random House",
    date: "2015",
    localPdfPath: bookSlot("marco-rubio", "rubio-american-dreams-2015.pdf"),
    posterUrl: "https://images1.penguinrandomhouse.com/smedia/9780143109037",
    posterCredit: "Penguin Random House cover image",
    sourceUrl: "https://www.penguinrandomhouse.com/books/316014/american-dreams-by-marco-rubio/",
    sourceLinks: [
      ["Penguin Random House book page", "https://www.penguinrandomhouse.com/books/316014/american-dreams-by-marco-rubio/"],
      ["Library Journal bibliographic page", "https://www.libraryjournal.com/review/american-dreams-restoring-economic-opportunity-for-everyone"]
    ],
    description:
      "A domestic-policy book focused on economic mobility, opportunity, work, family, and reform.",
    summaries: {
      bookSummary:
        "The book lays out Rubio's economic-opportunity platform, emphasizing work, middle-class stability, education, family, and policy reforms aimed at mobility.",
      personInsight:
        "It shows Rubio's policy style as programmatic and opportunity-centered. For a foreign-relations profile, this matters because his international economic language often connects national strength abroad with social and economic resilience at home.",
      middleEastKurdistanRelevance:
        "Not directly related to Kurdistan. Indirectly relevant when assessing Rubio's interest in commercial diplomacy, U.S. business activity, energy, and whether foreign partnerships are framed as advancing American opportunity."
    },
    tags: ["economic policy", "Rubio", "PDF needed"]
  }),
  makeDocument({
    id: "rubio-decades-decadence-2023",
    countryId: "usa",
    personId: "marco-rubio",
    personName: "Marco Rubio",
    title: "Decades of Decadence: How Our Spoiled Elites Blew America's Inheritance of Liberty, Security, and Prosperity",
    documentType: "Book / political argument",
    publisher: "Broadside Books / HarperCollins",
    date: "2023",
    localPdfPath: bookSlot("marco-rubio", "rubio-decades-of-decadence-2023.pdf"),
    posterUrl: "https://www.harpercollins.com/cdn/shop/files/9780063296985_6d411d93-6abe-4f4d-8b6f-d42dc921aabf_1200x1200.jpg?v=1782863608",
    posterCredit: "HarperCollins cover image",
    sourceUrl: "https://www.harpercollins.com/products/decades-of-decadence-marco-rubio",
    sourceLinks: [
      ["HarperCollins book page", "https://www.harpercollins.com/products/decades-of-decadence-marco-rubio"],
      ["Porchlight bibliographic page", "https://www.porchlightbooks.com/products/decades-of-decadence-marco-rubio-9780063296978"]
    ],
    description:
      "Rubio's critique of U.S. elites, globalization, national decay, sovereignty, family, community, and security.",
    summaries: {
      bookSummary:
        "The book argues that elite cultural and economic choices weakened local jobs, family, community, national sovereignty, and American security. It is a sovereignty-and-national-strength text.",
      personInsight:
        "It pushes Rubio toward a harder national-conservative register: less abstract globalization, more domestic industrial strength, sovereignty, borders, and suspicion of elite consensus. That is important when reading his State Department policy tone under a Trump administration.",
      middleEastKurdistanRelevance:
        "No direct KRG argument. Indirectly relevant because Rubio may judge Iraq/KRG policy through U.S. strength, energy resilience, anti-Iran pressure, and whether regional commitments serve American strategic interests."
    },
    tags: ["sovereignty", "national security", "Rubio", "PDF needed"]
  }),
  makeDocument({
    id: "landau-senate-testimony-2025",
    countryId: "usa",
    personId: "christopher-landau",
    personName: "Christopher Landau",
    title: "Statement of Christopher Landau, Nominee for Deputy Secretary of State",
    documentType: "Senate testimony",
    publisher: "U.S. Senate Foreign Relations Committee",
    date: "2025-03-04",
    localPdfPath: bookSlot("christopher-landau", "landau-senate-testimony-2025.pdf"),
    sourceUrl: "https://www.foreign.senate.gov/download/06/04/2025/030425_landau_testimonypdf",
    sourceLinks: [
      ["Senate hearing page", "https://www.foreign.senate.gov/hearings/nominations-03-04-2025"],
      ["Senate testimony PDF", "https://www.foreign.senate.gov/download/06/04/2025/030425_landau_testimonypdf"]
    ],
    description:
      "Landau's confirmation statement before the Senate Foreign Relations Committee for Deputy Secretary of State.",
    summaries: {
      bookSummary:
        "This is a short nomination statement, not a book. It is useful for formal self-presentation, loyalty to the President and Secretary, and the role he expected to play as Deputy Secretary.",
      personInsight:
        "The document should be read as an institutional loyalty and management statement. It helps profile Landau as an implementer of secretary-level and presidential direction rather than a public regional-policy theorist.",
      middleEastKurdistanRelevance:
        "No direct KRG argument in the profile record. Relevance is indirect: Deputy Secretary authority affects bureau coordination, ambassadorial implementation, crisis escalation, and the chain that can carry Iraq/KRG policy."
    },
    tags: ["testimony", "State Department", "PDF needed"]
  }),
  makeDocument({
    id: "vance-hillbilly-elegy-2016",
    countryId: "usa",
    personId: "jd-vance",
    personName: "JD Vance",
    title: "Hillbilly Elegy: A Memoir of a Family and Culture in Crisis",
    documentType: "Book / memoir",
    publisher: "HarperCollins",
    date: "2016",
    localPdfPath: bookSlot("jd-vance", "vance-hillbilly-elegy-2016.pdf"),
    posterUrl: "https://www.harpercollins.com/cdn/shop/files/9780062872258_1200x1200.jpg?v=1783600563",
    posterCredit: "HarperCollins cover image",
    sourceUrl: "https://www.harpercollins.com/products/hillbilly-elegy-j-d-vance",
    sourceLinks: [["HarperCollins book page", "https://www.harpercollins.com/products/hillbilly-elegy-j-d-vance"]],
    description:
      "Vance's memoir about family, class, social breakdown, military service, and elite mobility.",
    summaries: {
      bookSummary:
        "The book presents Vance's origin story through family instability, Appalachian identity, work, education, the Marines, and movement into elite institutions.",
      personInsight:
        "It is essential to understanding Vance's political persona: class decline, anti-elite suspicion, family breakdown, military discipline, and a belief that national policy must reconnect with working-class life.",
      middleEastKurdistanRelevance:
        "No direct Kurdistan content. Indirectly relevant because Vance's foreign policy tends to be filtered through restraint, burden-sharing, U.S. domestic renewal, and skepticism of open-ended commitments."
    },
    tags: ["memoir", "Vance", "PDF needed"]
  }),
  makeDocument({
    id: "vance-communion-2026",
    countryId: "usa",
    personId: "jd-vance",
    personName: "JD Vance",
    title: "Communion: Finding My Way Back to Faith",
    documentType: "Book / memoir",
    publisher: "HarperCollins",
    date: "2026",
    localPdfPath: bookSlot("jd-vance", "vance-communion-2026.pdf"),
    posterUrl: "https://www.harpercollins.com/cdn/shop/files/9780063575011_20757d93-4856-4752-a284-f36ba20e8f7e_1200x1200.jpg?v=1774971618",
    posterCredit: "HarperCollins cover image",
    sourceUrl: "https://www.harpercollins.com/products/communion-j-d-vance",
    sourceLinks: [["HarperCollins book page", "https://www.harpercollins.com/products/communion-j-d-vance"]],
    description:
      "A faith memoir centered on Vance's return to Christianity and conversion to Catholicism.",
    summaries: {
      bookSummary:
        "The publisher frames the book as Vance's faith story and conversion account. Until a local PDF is added, TOR Phi should treat it as a bibliographic profile rather than a full OCR reading.",
      personInsight:
        "It gives an important moral and religious vocabulary for Vance's public life. Pair it with his Iraq service and nationalist-populist politics when reading his remarks to Kurdish media.",
      middleEastKurdistanRelevance:
        "No direct KRG policy content is established from the source record. Indirectly, it may shape his language about Christians, minorities, social order, war, and moral obligation in Middle East debates."
    },
    tags: ["faith", "Vance", "PDF needed"]
  }),
  makeDocument({
    id: "cooper-she-speaks-2019",
    countryId: "uk",
    personId: "yvette-cooper",
    personName: "Yvette Cooper",
    title: "She Speaks: Women's Speeches That Changed the World, from Pankhurst to Greta",
    documentType: "Book / edited speeches with commentary",
    publisher: "Atlantic Books",
    date: "2019",
    localPdfPath: bookSlot("yvette-cooper", "cooper-she-speaks-2019.pdf"),
    posterUrl: "https://atlantic-books.co.uk/wp-content/uploads/2025/10/9781786499943.jpeg",
    posterCredit: "Atlantic Books cover image",
    sourceUrl: "https://atlantic-books.co.uk/book/she-speaks/",
    sourceLinks: [["Atlantic Books page", "https://atlantic-books.co.uk/book/she-speaks/"]],
    description:
      "Cooper's book presents major speeches by women with her framing and commentary.",
    summaries: {
      bookSummary:
        "The book collects and introduces speeches by women across history. It is a political-communication and representation text rather than a foreign-policy book.",
      personInsight:
        "It shows Cooper's interest in voice, democratic persuasion, rights, representation, and the symbolic power of public speech. That matters for reading her public diplomacy and human-rights language as Foreign Secretary.",
      middleEastKurdistanRelevance:
        "No direct Kurdistan link. Indirect relevance appears if Cooper frames Kurdish or Middle Eastern issues through women's rights, public voice, persecution, or democratic representation."
    },
    tags: ["UK", "speeches", "women", "PDF needed"]
  }),
  makeDocument({
    id: "falconer-regional-update-2026",
    countryId: "uk",
    personId: "hamish-falconer",
    personName: "Hamish Falconer",
    title: "Minister for the Middle East Statement: Regional Update",
    documentType: "Parliamentary statement",
    publisher: "GOV.UK / FCDO",
    date: "2026-01-05",
    localPdfPath: bookSlot("hamish-falconer", "falconer-regional-update-2026.pdf"),
    sourceUrl: "https://www.gov.uk/government/speeches/minister-for-the-middle-east-statement-regional-update",
    sourceLinks: [["GOV.UK statement", "https://www.gov.uk/government/speeches/minister-for-the-middle-east-statement-regional-update"]],
    description:
      "Falconer's parliamentary update on Gaza, Iran, Yemen, Syria, and regional issues.",
    summaries: {
      bookSummary:
        "This is a regional policy statement, not a book. It gives a ministerial snapshot of the UK's Middle East priorities at the start of 2026.",
      personInsight:
        "It shows Falconer operating as the public Commons voice for Middle East crisis management, with a portfolio that can touch Iran, Iraq, Syria, Gulf security, humanitarian issues, and regional de-escalation.",
      middleEastKurdistanRelevance:
        "Directly Middle East-related and indirectly Kurdistan-relevant. Even when KRG is not named, UK language on Iran, Iraq, Syria, security, humanitarian access, and regional stability shapes the policy environment around Erbil."
    },
    tags: ["Middle East", "UK", "statement", "PDF needed"]
  }),
  makeDocument({
    id: "falconer-middle-east-update-2026-05",
    countryId: "uk",
    personId: "hamish-falconer",
    personName: "Hamish Falconer",
    title: "Oral Statement: Middle East Update",
    documentType: "Parliamentary statement PDF",
    publisher: "UK Parliament / Commons Business",
    date: "2026-05-21",
    localPdfPath: bookSlot("hamish-falconer", "falconer-middle-east-update-2026-05-21.pdf"),
    sourceUrl: "https://commonsbusiness.parliament.uk/Document/105413/Pdf?subType=Standard",
    sourceLinks: [["Commons Business PDF", "https://commonsbusiness.parliament.uk/Document/105413/Pdf?subType=Standard"]],
    description:
      "A Commons statement on Iran, the Strait of Hormuz, Gulf trade, and the wider Middle East.",
    summaries: {
      bookSummary:
        "The statement updates Parliament on Iran, Hormuz, Gulf trade, and wider regional risks. It is valuable as a dated ministerial record.",
      personInsight:
        "It positions Falconer as a crisis communicator on Gulf and Iran-linked security, trade, and escalation risks.",
      middleEastKurdistanRelevance:
        "Highly Middle East-relevant. For Kurdistan analysis, this should be cross-searched for Iraq, Iran, energy routes, Gulf security, and regional escalation because those dynamics directly affect KRG security and oil/export calculations."
    },
    tags: ["Iran", "Hormuz", "Middle East", "PDF needed"]
  }),
  makeDocument({
    id: "doughty-sanctions-update-2026",
    countryId: "uk",
    personId: "stephen-doughty",
    personName: "Stephen Doughty",
    title: "Sanctions Update for Parliamentarians",
    documentType: "Policy update PDF",
    publisher: "UK Parliament deposited paper / FCDO",
    date: "2026-04",
    localPdfPath: bookSlot("stephen-doughty", "doughty-sanctions-update-april-2026.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/doughty-sanctions-update-april-2026.png",
    posterCredit: "Local first-page render from the UK Parliament deposited paper PDF",
    sourceUrl: "https://data.parliament.uk/DepositedPapers/Files/DEP2026-0290/Sanctions_update_for_Parliamentarians_April_2026_FW.pdf",
    sourceLinks: [["UK Parliament deposited PDF", "https://data.parliament.uk/DepositedPapers/Files/DEP2026-0290/Sanctions_update_for_Parliamentarians_April_2026_FW.pdf"]],
    ocrStatus: "Local PDF imported and text-readable. Summary is based on the downloaded deposited paper text.",
    sourceBasis: "UK Parliament deposited paper PDF, downloaded locally and checked with pdftotext.",
    description:
      "A sanctions update associated with the FCDO ministerial portfolio.",
    summaries: {
      bookSummary:
        "The document is a parliamentary update on sanctions policy rather than a book. It should be used to anchor Doughty's role in sanctions communication and implementation.",
      personInsight:
        "It shows Doughty's portfolio relevance to coercive economic diplomacy, legal restrictions, and allied pressure campaigns.",
      middleEastKurdistanRelevance:
        "Indirect but important. Sanctions policy affects Iran, Syria, Russia-linked networks, banking routes, energy, and cross-border trade, all of which can touch KRG interests."
    },
    tags: ["sanctions", "UK", "local PDF", "text-readable"]
  }),
  makeDocument({
    id: "doughty-sanctions-implementation-enforcement-review-2025",
    countryId: "uk",
    personId: "stephen-doughty",
    personName: "Stephen Doughty",
    title: "Sanctions Implementation and Enforcement: Cross-Government Review",
    documentType: "Policy review / sanctions system",
    publisher: "GOV.UK / FCDO and cross-government partners",
    date: "2025-05-15",
    localPdfPath: bookSlot("stephen-doughty", "doughty-sanctions-implementation-enforcement-review-2025.pdf"),
    sourceUrl: "https://www.gov.uk/government/publications/sanctions-implementation-and-enforcement-cross-government-review-may-2025",
    sourceLinks: [
      ["GOV.UK review page", "https://www.gov.uk/government/publications/sanctions-implementation-and-enforcement-cross-government-review-may-2025"],
      ["Hansard statement", "https://hansard.parliament.uk/commons/2025-05-15/debates/68DD00B8-B42C-43D6-A264-49CD881A044F/SanctionsImplementationAndEnforcement"]
    ],
    description:
      "A May 2025 cross-government review launched by the Minister for Europe on how the UK implements and enforces sanctions across FCDO, Treasury, business, transport, tax, and crime agencies.",
    summaries: {
      bookSummary:
        "This is not a book, but it is one of the strongest Stephen Doughty documents because it shows his sanctions portfolio in system-building mode. The review is about whether the UK has the right powers, capacity, guidance, compliance architecture, and enforcement model to make sanctions work after designation. It moves beyond announcing targets and asks whether businesses can comply, whether enforcement bodies can act, and whether sanctions remain credible as a foreign-policy tool.",
      personInsight:
        "For Doughty, the review points to a legal-operational style. His relevance is not only speeches about Europe or alliances; he sits in the machinery that turns foreign-policy pressure into financial, trade, transport, and criminal-enforcement consequences. That makes him useful for TOR Phi because sanctions often reveal the real pressure map behind public diplomacy.",
      middleEastKurdistanRelevance:
        "The Kurdistan link is indirect but serious. KRG-facing analysis should watch Doughty's sanctions work for Iran, Syria, Russia-linked networks, illicit finance, oil/shipping exposure, banking compliance, militia finance, and humanitarian exemptions. A KRG-friendly or KRG-critical reading cannot come from this review alone, but it tells analysts how the UK may constrain actors around Iraq and the wider region."
    },
    tags: ["sanctions", "FCDO", "Doughty", "policy system", "PDF needed"]
  }),
  makeDocument({
    id: "lammy-out-of-the-ashes-2011",
    countryId: "uk",
    personId: "david-lammy",
    personName: "David Lammy",
    title: "Out of the Ashes: Britain After the Riots",
    documentType: "Book / political-social analysis",
    publisher: "Guardian Books / Random House",
    date: "2011",
    localPdfPath: bookSlot("david-lammy", "lammy-out-of-the-ashes-2011.pdf"),
    posterUrl: "https://archive.org/services/img/outofashesbritai0000lamm",
    posterCredit: "Internet Archive cover image",
    sourceUrl: "https://archive.org/details/outofashesbritai0000lamm",
    sourceLinks: [
      ["Internet Archive bibliographic record", "https://archive.org/details/outofashesbritai0000lamm"],
      ["Guardian review", "https://www.theguardian.com/books/2011/dec/09/out-ashes-riots-david-lammy-review-matthews"],
      ["Hachette author page", "https://www.hachette.co.uk/contributor/david-lammy/"]
    ],
    description:
      "Lammy's book after the 2011 England riots, written from the perspective of the Tottenham MP and focused on social fracture, justice, deprivation, responsibility, and what Britain should rebuild after disorder.",
    summaries: {
      bookSummary:
        "Out of the Ashes belongs to Lammy's domestic-political formation rather than his later foreign-policy doctrine. It uses the riots as an entry point into broken trust, policing, social mobility, family, local belonging, economic exclusion, and the pressure placed on communities that feel abandoned by the state. The book matters for TOR Phi because it shows Lammy reading unrest as a political system failure, not only as criminal behavior. His instinct is to ask why legitimacy breaks down and what kind of social settlement could rebuild it.",
      personInsight:
        "The book helps explain Lammy's later foreign-policy rhetoric about dignity, racism, historical memory, and who gets heard by power. He is not simply a strategic realist; he also carries a domestic justice vocabulary shaped by Tottenham, policing, racial disparity, and social trust. When Lammy discusses foreign policy, that background can push him toward language about human dignity, inclusive legitimacy, diaspora experience, and the consequences of humiliation.",
      middleEastKurdistanRelevance:
        "There is no direct Kurdistan policy in this book. Its value is interpretive: when the UK looks at Iraq, Syria, refugees, minority rights, Yazidis, or Kurdish communities, Lammy's domestic lens may make him attentive to trust, identity, policing, exclusion, and state legitimacy. It should not be used as proof of a KRG stance, but it does help analysts understand why he may frame foreign crises through dignity and social repair rather than security alone."
    },
    tags: ["Lammy", "riots", "social cohesion", "justice", "PDF needed"]
  }),
  makeDocument({
    id: "lammy-tribes-2020",
    countryId: "uk",
    personId: "david-lammy",
    personName: "David Lammy",
    title: "Tribes: How Our Need to Belong Can Make or Break Society",
    documentType: "Book / memoir and social analysis",
    publisher: "Little, Brown / Hachette",
    date: "2020-03-05",
    localPdfPath: bookSlot("david-lammy", "lammy-tribes-2020.pdf"),
    posterUrl: "https://www.hachette.co.uk/wp-content/uploads/2019/04/hbg-title-tribes-5-18.jpg",
    posterCredit: "Hachette UK cover image",
    sourceUrl: "https://www.hachette.co.uk/titles/david-lammy/tribes/9781472128713/",
    sourceLinks: [
      ["Hachette UK book page", "https://www.hachette.co.uk/titles/david-lammy/tribes/9781472128713/"],
      ["David Lammy announcement", "https://www.davidlammy.co.uk/80-2/"],
      ["LSE event page", "https://www.lse.ac.uk/lse-player/tribes-how-our-need-to-belong-can-make-or-break-society"]
    ],
    description:
      "Lammy's memoir and political analysis of belonging, identity, tribalism, polarisation, globalisation, digitisation, and how communities can either cooperate or fracture.",
    summaries: {
      bookSummary:
        "Tribes is both personal and political. Lammy begins from identity, ancestry, Tottenham, race, class, belonging, and the emotional need for community, then connects that to the way modern politics can turn belonging into factional hostility. The book treats tribalism as double-edged: groups can create solidarity and shared achievement, but they can also produce exclusion, conspiracy, loneliness, digital radicalisation, and hard political boundaries. That makes it one of Lammy's best worldview sources.",
      personInsight:
        "For Lammy as a foreign-policy actor, Tribes is important because it explains why he often talks about connection, recognition, partnership, and rebuilding alliances. His foreign policy is not only about state power; it is also about the social psychology of belonging and resentment. This helps explain his emphasis on Britain reconnecting with allies and the Global South, and why he may be sensitive to diaspora politics, post-colonial memory, and communities that feel ignored.",
      middleEastKurdistanRelevance:
        "The book is not directly about Kurdistan, but it is analytically useful for Kurdish politics because Kurdish identity, diaspora mobilisation, minority recognition, and state belonging are all central to the file. If Lammy views political stability through belonging and exclusion, then KRG analysis should watch whether he treats Kurdish issues as identity-and-rights problems, security problems, alliance problems, or some combination of all three."
    },
    tags: ["Lammy", "tribalism", "belonging", "identity", "PDF needed"]
  }),
  makeDocument({
    id: "lammy-review-final-report-2017",
    countryId: "uk",
    personId: "david-lammy",
    personName: "David Lammy",
    title: "The Lammy Review: Final Report",
    documentType: "Official independent review / criminal justice",
    publisher: "GOV.UK / Lammy Review",
    date: "2017-09-08",
    localPdfPath: bookSlot("david-lammy", "lammy-review-final-report-2017.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/lammy-review-final-report-2017.png",
    posterCredit: "Local first-page render from the GOV.UK PDF",
    sourceUrl: "https://www.gov.uk/government/publications/lammy-review-final-report",
    sourceLinks: [
      ["GOV.UK report page", "https://www.gov.uk/government/publications/lammy-review-final-report"],
      ["GOV.UK final report PDF", "https://assets.publishing.service.gov.uk/media/5a82009040f0b62305b91f49/lammy-review-final-report.pdf"]
    ],
    ocrStatus: "Local PDF imported and text-readable. Summary is based on the downloaded GOV.UK report text.",
    sourceBasis: "GOV.UK final report page plus local PDF text extraction.",
    description:
      "Lammy's independent review into the treatment and outcomes of Black, Asian and Minority Ethnic individuals in the criminal justice system.",
    summaries: {
      bookSummary:
        "The Lammy Review is a major official report, not a campaign book. It examines disproportionate outcomes across prosecution, pleas, courts, prisons, youth justice, rehabilitation, and trust in the criminal justice system. The report argues that the justice system cannot maintain legitimacy when some communities experience it as unequal or opaque. Its core method is institutional: use data, expose disparities, explain differences honestly, and reform where agencies cannot justify outcomes.",
      personInsight:
        "This report is a central Lammy worldview source. It shows him as an evidence-and-legitimacy actor: he links race, trust, state power, transparency, and institutional reform. That matters for foreign policy because the same habits can appear in his language on human rights, rule of law, international justice, colonial memory, and whether marginalized communities trust political settlements.",
      middleEastKurdistanRelevance:
        "The report is domestic and has no direct KRG position. Its indirect relevance is strong for minority-protection analysis. Kurdish, Yazidi, refugee, and diaspora files often revolve around trust in state institutions, unequal treatment, documentation, detention, justice, and whether power is accountable. Use the review to understand Lammy's justice vocabulary, then rely on direct FCDO records for his actual Kurdistan line."
    },
    tags: ["Lammy", "official report", "justice", "minorities", "local PDF", "text-readable"]
  }),
  makeDocument({
    id: "lammy-progressive-realism-2024",
    countryId: "uk",
    personId: "david-lammy",
    personName: "David Lammy",
    title: "The Case for Progressive Realism",
    documentType: "Foreign-policy doctrine essay",
    publisher: "Foreign Affairs / David Lammy",
    date: "2024-04-22",
    localPdfPath: bookSlot("david-lammy", "lammy-progressive-realism-2024.pdf"),
    sourceUrl: "https://www.davidlammy.co.uk/the-case-for-progressive-realism/",
    sourceLinks: [
      ["David Lammy page", "https://www.davidlammy.co.uk/the-case-for-progressive-realism/"],
      ["Foreign Affairs essay", "https://www.foreignaffairs.com/united-kingdom/case-progressive-realism"],
      ["Fabian Society speech", "https://fabians.org.uk/progressive-realism/"]
    ],
    description:
      "Lammy's doctrine-setting foreign-policy essay arguing that Britain should use realist means for progressive ends and reconnect its global role through practical alliance-building.",
    summaries: {
      bookSummary:
        "This is the key foreign-policy text for Lammy. Progressive realism accepts that power, alliances, adversaries, economic constraints, and military realities matter, but argues that realism should serve progressive ends: democracy, climate action, international development, rights, security, and economic renewal. The essay rejects both nostalgic great-power language and value-free realism. It is a doctrine of limits and purpose at the same time: do not promise what cannot be achieved, but do not abandon ideals just because the world is hard.",
      personInsight:
        "For Lammy's profile, this essay changes the file from biography to doctrine. It shows that his foreign policy is not only emotional justice language from his books; it is also a strategic method. He wants the UK to regain influence through alliances, Europe, the United States, the Global South, climate/security links, development, and practical diplomacy. It makes him a values-plus-interests actor rather than a pure moralist.",
      middleEastKurdistanRelevance:
        "The essay does not set out a detailed KRG doctrine. It does, however, tell analysts how to read a Lammy-era UK line on Iraq and Kurdistan: support is likely to be conditional, alliance-based, legalistic, and tied to regional stability, energy, human rights, counterterrorism, and relations with Baghdad, Washington, Ankara, and Europe. For Kurdistan Lens, it is the best framework source for asking whether UK policy toward Erbil is driven by values, interests, or a negotiated mix."
    },
    tags: ["Lammy", "foreign policy", "progressive realism", "doctrine", "PDF needed"]
  }),
  makeDocument({
    id: "haddad-paradis-perdu-2019",
    countryId: "france",
    personId: "benjamin-haddad",
    personName: "Benjamin Haddad",
    title: "Le paradis perdu: L'Amerique de Trump et la fin des illusions europeennes",
    documentType: "Book / geopolitical essay",
    publisher: "Grasset",
    date: "2019",
    localPdfPath: bookSlot("benjamin-haddad", "haddad-le-paradis-perdu-2019.pdf"),
    posterUrl: "https://media.hachette.fr/fit-in/500x500/imgArticle/GRASSETFASQUELLE/2019/9782246820161-001-X.jpeg?source=web&v=791fcb00256402b66b2cc0073df2b4e4",
    posterCredit: "Editions Grasset / Hachette cover image",
    sourceUrl: "https://www.grasset.fr/livre/le-paradis-perdu-9782246820161/",
    sourceLinks: [
      ["Editions Grasset book page", "https://www.grasset.fr/livre/le-paradis-perdu-9782246820161/"],
      ["German Marshall Fund profile", "https://www.gmfus.org/find-experts/benjamin-haddad"],
      ["Atlantic Council profile", "https://www.atlanticcouncil.org/expert/benjamin-haddad/"]
    ],
    description:
      "Haddad's book on Trump-era America, European illusions, and the geopolitical need for a more self-aware Europe.",
    summaries: {
      bookSummary:
        "Haddad's book is a transatlantic diagnosis written after the shock of Donald Trump's first presidency. It treats the American guarantee as less automatic than many European elites assumed, then asks what happens when the United States becomes more transactional, internally polarized, and less willing to carry Europe's security burden alone. The core argument is not anti-American; it is a warning against European passivity. Haddad reads the Trump moment as the end of an illusion that liberal order, U.S. strategic patience, and European comfort would reproduce themselves without European power, defense spending, political unity, and a sharper geopolitical vocabulary.",
      personInsight:
        "This is the cleanest profile source for Haddad before government. It shows him as a transatlantic strategist who wants Europe to remain close to the United States but less dependent on Washington's mood. That matters for reading his later European-affairs role: he is likely to support NATO and Ukraine policy, but he also treats European defense, industrial capacity, sanctions coordination, and political cohesion as instruments of survival rather than slogans. He should not be profiled as a narrow Brussels functionary; the book places him in the French debate over strategic autonomy, U.S. retrenchment, and Europe's need to act like a geopolitical actor.",
      middleEastKurdistanRelevance:
        "The book is not about Kurdistan directly. Its relevance is structural: if France and Europe must act with less certainty about U.S. leadership, then files like Iraq stabilization, Syria, Iran pressure, counter-ISIS cooperation, Yazidi/minority protection, and engagement with Erbil become part of a wider European capacity test. Haddad's lens would likely ask whether Europe has the diplomatic, military, and economic instruments to protect its interests in Iraq and the eastern Mediterranean when U.S. attention shifts."
    },
    tags: ["France", "Europe", "Trump", "PDF needed"]
  }),
  makeDocument({
    id: "barrot-essays-empirical-financial-economics-2012",
    countryId: "france",
    personId: "jean-noel-barrot",
    personName: "Jean-Noel Barrot",
    title: "Essays in Empirical Financial Economics",
    documentType: "Doctoral dissertation",
    publisher: "HEC / theses.fr / HAL",
    date: "2012",
    localPdfPath: bookSlot("jean-noel-barrot", "barrot-essays-empirical-financial-economics-2012.pdf"),
    sourceUrl: "https://theses.hal.science/pastel-00829542/",
    sourceLinks: [
      ["HAL theses record", "https://theses.hal.science/pastel-00829542/"],
      ["Jean-Noel Barrot research page", "https://sites.google.com/hec.fr/jnbarrot/research"]
    ],
    description:
      "Barrot's finance dissertation, including work on trade credit, firm financing, investment, and business dynamics.",
    summaries: {
      bookSummary:
        "Barrot's dissertation is an empirical-finance work rather than a foreign-policy manifesto. Its chapters study how firms obtain and extend credit, how financial constraints affect investment and default risk, and how financing structures shape firm behavior. The point for TOR Phi is methodological: Barrot's pre-political work is built around data, incentives, constraints, and institutional design. It is a profile source for how he thinks about systems under pressure, not a source for his views on Iraq or Kurdistan.",
      personInsight:
        "This document helps explain why Barrot should be treated as a technocratic foreign minister. He comes from finance, HEC, and empirical economic research, so his foreign-policy profile should track economic security, sanctions, export controls, reconstruction finance, technology policy, and the financial channels behind diplomacy. In practice, that means his statements on Ukraine, Iran, Gaza, Iraq, or development policy should be read alongside questions of funding, enforcement, institutional coordination, and European economic leverage.",
      middleEastKurdistanRelevance:
        "There is no direct Kurdistan content. The indirect relevance is real, though: many KRG-facing files are economic before they are rhetorical. Energy exports, pipeline arbitration, sanctions exposure, reconstruction finance, French corporate risk, and Baghdad-Erbil budget disputes all require a minister who understands finance and institutional constraints. Barrot's dissertation does not tell us whether he is pro-KRG; it tells us that his policy style is likely to be evidence-heavy and economic-instrument aware."
    },
    tags: ["finance", "France", "thesis", "PDF needed"]
  }),
  makeDocument({
    id: "lecornu-vers-la-guerre-2024",
    countryId: "france",
    personId: "sebastien-lecornu",
    personName: "Sebastien Lecornu",
    title: "Vers la guerre?: La France face au rearmement du monde",
    documentType: "Book / defense strategy essay",
    publisher: "Plon",
    date: "2024-10-10",
    localPdfPath: bookSlot("sebastien-lecornu", "lecornu-vers-la-guerre-2024.pdf"),
    posterUrl: "https://www.defnat.com/images/articles/876%20%28janv%202025%29/20.a%20Lecornu%20-%20Vers%20la%20guerre.jpg",
    posterCredit: "Revue Defense Nationale / Plon cover image",
    sourceUrl: "https://www.fnac.com/a20669508/Sebastien-Lecornu-Vers-la-guerre",
    sourceLinks: [
      ["Fnac bibliographic page", "https://www.fnac.com/a20669508/Sebastien-Lecornu-Vers-la-guerre"],
      ["Revue Defense Nationale review", "https://www.defnat.com/e-RDN/vue-article.php?carticle=23619"]
    ],
    description:
      "Lecornu's 2024 defense book on France's place in a world of rearmament, terrorism, nuclear proliferation, great-power rivalry, maritime pressure, space militarization, and European insecurity.",
    summaries: {
      bookSummary:
        "This is the strongest authored source for Lecornu's strategic worldview. The book frames the post-Cold War environment as a rupture rather than a temporary crisis: terrorism, nuclear proliferation, state competition, the return of bloc logic, war in Europe, contested maritime routes, and military use of space all point toward a harsher security environment. Lecornu's argument is built around preparedness: France must understand the threat picture, invest in defense capacity, explain public spending, maintain industrial depth, think through alliances, and recover a long strategic time horizon. The book's reference to the Gaullist model and Pierre Messmer is important because it links current rearmament to sovereignty, nuclear deterrence, military-industrial planning, and executive seriousness.",
      personInsight:
        "For the profile, Lecornu should be read as a defense-state politician rather than only a Macron loyalist. He presents security policy as material, moral, and political at the same time: budgets, factories, recruitment, public consent, alliances, scenarios, and national resilience all belong in one frame. That makes him more important to Middle East policy than a normal domestic politician, because defense ministers shape arms transfers, coalition posture, counterterrorism, naval deployments, intelligence cooperation, and the military grammar used by the presidency.",
      middleEastKurdistanRelevance:
        "The book is not a KRG text, but it directly matters to France's Iraq/Syria/Kurdistan posture. A minister who reads the world through rearmament, terrorism, deterrence, and alliance uncertainty will likely approach Iraq and Syria through force protection, counter-ISIS continuity, partner reliability, and regional spillover risk. For Kurdistan Lens, this means Lecornu's KRG relevance should be assessed through defense cooperation, Peshmerga/coalition support, French troops and bases in the region, Syria-Iraq threat corridors, and how Paris distinguishes KRG stability from PKK/YPG/SDF and Turkish-security files."
    },
    tags: ["France", "defense", "rearmament", "Middle East", "PDF needed"]
  }),
  makeDocument({
    id: "briens-gomart-preparing-2050-2021",
    countryId: "france",
    personId: "martin-briens",
    personName: "Martin Briens",
    title: "Preparing for 2050: From Foresight to Grand Strategy",
    documentType: "Journal article / grand strategy",
    publisher: "Ifri / Politique etrangere",
    date: "2021-12-10",
    localPdfPath: bookSlot("martin-briens", "briens-gomart-preparing-for-2050-2021.pdf"),
    posterUrl: "https://www.ifri.org/sites/default/files/migrated_files/images/thumbnails/image/visuel_gomart_briens_v2_us.png",
    posterCredit: "Ifri / Politique etrangere article image",
    sourceUrl: "https://www.ifri.org/en/articles-politique-etrangere/preparing-2050-foresight-grand-strategy",
    sourceLinks: [
      ["Ifri article page", "https://www.ifri.org/en/articles-politique-etrangere/preparing-2050-foresight-grand-strategy"],
      ["Cairn citation page", "https://shs.cairn.info/journal-politique-etrangere-2021-4-page-23?lang=en"]
    ],
    description:
      "Briens and Thomas Gomart's article arguing that France and Europe need stronger foresight systems and a grand strategy under U.S.-China competition, environmental pressure, digital transformation, and social fragmentation.",
    summaries: {
      bookSummary:
        "The article argues that China and the United States both think in long strategic arcs, while France and Europe need to strengthen their own foresight systems and move from scenario planning toward grand strategy. It treats 2050 not as a distant planning fantasy but as a horizon for power competition, technology, climate stress, social fragmentation, and state capacity. The practical takeaway is that France needs institutions able to connect intelligence, diplomatic planning, economic policy, technology policy, and defense choices into a coherent long-term posture.",
      personInsight:
        "For Martin Briens, this article is an unusually useful profile source because it shows him as a planning diplomat. He is not merely an operator of bilateral files; his writing points to a strategic-administration mindset: build forecasting capacity, connect ministries, avoid short-termism, and make France's foreign-policy machine think beyond crisis response. That matters for his secretary-general role because the Quai d'Orsay's internal machinery, not just ministerial speeches, determines how France tracks Iraq, Iran, Syria, Turkiye, Lebanon, and the KRG over time.",
      middleEastKurdistanRelevance:
        "No direct Kurdistan passage is visible from the source metadata, but the framework is highly relevant. Kurdistan-facing policy is exactly the kind of file that needs foresight: U.S. retrenchment, Iranian pressure, Turkish security operations, Iraqi federal fragility, energy-route uncertainty, climate/water stress, and militia politics all interact over years. In TOR Phi, Briens's article should be used to judge whether French policy is reactive or whether it is building a durable regional strategy."
    },
    tags: ["France", "grand strategy", "foresight", "Europe", "PDF needed"]
  }),
  makeDocument({
    id: "braem-geopolitique-relations-militaires-humanitaires-2007",
    countryId: "france",
    personId: "yann-braem",
    personName: "Yann Braem",
    title: "Geopolitique des relations militaires-humanitaires: comparaison des interventions au Kosovo et en Afghanistan",
    documentType: "Doctoral thesis",
    publisher: "Universite Paris 8 / theses.fr",
    date: "2007",
    localPdfPath: bookSlot("yann-braem", "braem-geopolitique-relations-militaires-humanitaires-2007.pdf"),
    sourceUrl: "https://theses.fr/2007PA082873",
    sourceLinks: [["theses.fr record", "https://theses.fr/2007PA082873"]],
    description:
      "Braem's doctoral thesis on the territorial and political stakes of military-humanitarian relations in Kosovo and Afghanistan.",
    summaries: {
      bookSummary:
        "The thesis studies military-humanitarian relations as a geopolitical problem: military actors and humanitarian actors meet in crisis territories where power, legitimacy, population movement, security, and institutional control are all contested. Using Kosovo and Afghanistan, Braem asks how these relations emerged, how they became institutionalized, and how the specific geography of each theater changes cooperation, competition, and role division. The source is especially valuable because it treats humanitarian action not as neutral background but as part of the management and control of crisis space.",
      personInsight:
        "This thesis makes Braem a much richer profile than a normal consular/diplomatic entry. His intellectual background is field-geopolitical: territory, conflict zones, military-humanitarian coordination, Kosovo, Afghanistan, and the politics of international presence. For France's Erbil/KRG file, that means he should be read as someone trained to see how culture, aid, security, local institutions, and foreign military presence interact in contested regions.",
      middleEastKurdistanRelevance:
        "The thesis is not about Kurdistan, but it gives a strong analytic bridge. The Kurdistan Region sits inside a wider Iraq/Syria/Turkiye/Iran security geography where humanitarian work, military coalitions, displaced populations, minority protection, local authorities, and foreign consulates overlap. Braem's thesis supports a Kurdistan Lens that asks who controls territory, who legitimizes local institutions, how foreign military/humanitarian actors coordinate, and how international presence changes local power balances."
    },
    tags: ["France", "Kosovo", "Afghanistan", "civil-military", "PDF needed"]
  }),
  makeDocument({
    id: "braem-relations-armees-ong-kosovo-2004",
    countryId: "france",
    personId: "yann-braem",
    personName: "Yann Braem",
    title: "Les relations Armees-ONG, des relations de pouvoir?: Caracteristiques et enjeux de la cooperation civilo-militaire francaise: le cas du Kosovo",
    documentType: "Defense research report",
    publisher: "Centre d'etudes en sciences sociales de la defense / IRSEM archive",
    date: "2004-02",
    localPdfPath: bookSlot("yann-braem", "braem-relations-armees-ong-kosovo-2004.pdf"),
    localPdfAvailable: true,
    sourceUrl: "https://www.irsem.fr/storage/file_manager_files/2025/03/braem-relations-armees-ong-kosovo-fevrier2004.pdf",
    sourceLinks: [["IRSEM archived PDF", "https://www.irsem.fr/storage/file_manager_files/2025/03/braem-relations-armees-ong-kosovo-fevrier2004.pdf"]],
    ocrStatus: "Local PDF imported from the IRSEM archive; OCR can be expanded into chapter notes later.",
    sourceBasis: "Open IRSEM PDF, with local reader copy attached in TOR Phi.",
    description:
      "A 283-page report on French civil-military cooperation in Kosovo, focusing on army-NGO relations, territorial control, information management, and crisis-space power.",
    summaries: {
      bookSummary:
        "This report is a detailed field study of French civil-military cooperation in Kosovo. It maps the emergence of French ACM/CIMIC practice, the role of forces in Mitrovica and other local spaces, interactions with NGOs, information-sharing, logistics, security coordination, and the political function of humanitarian/military cooperation. Its central value is the argument that army-NGO relations are not merely administrative; they are relations of power inside a territory where international actors, local communities, and armed/security structures all compete over influence.",
      personInsight:
        "For Braem's profile, the report shows a diplomat-researcher who understands how foreign presence works at ground level. He is attentive to maps, corridors, refugee flows, local power holders, military liaison, humanitarian legitimacy, and the soft power that emerges from cultural and aid institutions. That background is unusually relevant for a French representative in Erbil because consular and cultural work in the KRG is not separate from security history, minority politics, reconstruction, and France's regional image.",
      middleEastKurdistanRelevance:
        "The Kosovo case is not the KRG, but the operational logic transfers well. In Erbil, Sinjar, Nineveh, and disputed Iraq-Syria border spaces, international actors also work through humanitarian access, civil-military coordination, local legitimacy, and security partnerships. The report helps TOR Phi ask sharper questions: is France acting only culturally, or also through reconstruction and influence? How do French institutions relate to local authorities and NGOs? Which actors translate security cooperation into political credibility?"
    },
    tags: ["France", "Kosovo", "civil-military", "humanitarian", "local PDF"]
  }),
  makeDocument({
    id: "braem-herodote-militaires-humanitaires-2005",
    countryId: "france",
    personId: "yann-braem",
    personName: "Yann Braem",
    title: "Militaires et humanitaires: concurrences et convergences en cooperation internationale",
    documentType: "Journal article",
    publisher: "Herodote / Cairn",
    date: "2005",
    localPdfPath: bookSlot("yann-braem", "braem-militaires-humanitaires-herodote-2005.pdf"),
    localPdfAvailable: true,
    sourceUrl: "https://shs.cairn.info/revue-herodote-2005-1-page-95?lang=fr",
    sourceLinks: [
      ["Cairn article page", "https://shs.cairn.info/revue-herodote-2005-1-page-95?lang=fr"],
      ["Herodote open PDF", "https://www.herodote.org/IMG/_article_PDF/article_134.pdf"]
    ],
    ocrStatus: "Local article PDF imported from the Herodote open PDF.",
    sourceBasis: "Cairn bibliographic record and Herodote open PDF.",
    description:
      "A concise article on how military and humanitarian actors both compete and converge in international crisis cooperation.",
    summaries: {
      bookSummary:
        "The article condenses Braem's civil-military argument into a shorter comparative frame. It emphasizes that humanitarian action and military action have moved closer together because crisis management increasingly treats aid, legitimacy, security, and political objectives as linked. It contrasts stronger U.S. integration of humanitarian instruments with a French model that is more networked, less institutionally fused, and often dependent on personal relations and field-level coordination.",
      personInsight:
        "This article makes Braem useful for TOR Phi because it gives a portable model: in crisis zones, watch the relationship between formal doctrine and informal networks. Braem is sensitive to the difference between declared humanitarian neutrality, national influence, military legitimacy, and operational necessity. That is exactly the sort of distinction needed when interpreting French cultural, consular, aid, and security activity in Kurdistan.",
      middleEastKurdistanRelevance:
        "For Kurdistan analysis, the article helps separate humanitarian language from geopolitical function. French support for refugees, Yazidis, heritage, education, or civil society may be sincere and still create influence. Likewise, military cooperation may be framed as counterterrorism but produce political proximity. Braem's article is useful because it teaches TOR Phi to track convergence without collapsing every humanitarian action into propaganda."
    },
    tags: ["France", "humanitarian", "civil-military", "local PDF"]
  }),
  makeDocument({
    id: "braem-role-militaires-reconstruction-etats-2007",
    countryId: "france",
    personId: "yann-braem",
    personName: "Yann Braem",
    title: "Le role des militaires dans la reconstruction d'Etats apres les conflits",
    documentType: "Co-authored defense research report",
    publisher: "Centre d'etudes en sciences sociales de la defense / IRSEM archive",
    date: "2007",
    localPdfPath: bookSlot("yann-braem", "braem-role-militaires-reconstruction-etats-2007.pdf"),
    localPdfAvailable: true,
    sourceUrl: "https://www.irsem.fr/storage/file_manager_files/2025/03/c2sd-36.pdf",
    sourceLinks: [["IRSEM archived PDF", "https://www.irsem.fr/storage/file_manager_files/2025/03/c2sd-36.pdf"]],
    ocrStatus: "Local PDF imported from the IRSEM archive; OCR can be expanded into chapter notes later.",
    sourceBasis: "Open IRSEM PDF, with local reader copy attached in TOR Phi.",
    description:
      "A co-authored 2007 study on the role of militaries in post-conflict state reconstruction, with cases including Afghanistan and the Congo.",
    summaries: {
      bookSummary:
        "This report studies how militaries become involved in post-conflict state reconstruction, not only through security but through administration, governance support, police/security-sector reform, stabilization, and political order-building. It treats the military as an actor that can become administrator, technical adviser, negotiator, security provider, and sometimes substitute state institution. The report is useful because it lays out the dilemma of external reconstruction: foreign actors can stabilize territory and institutions, but they can also reshape local legitimacy, create dependency, or empower flawed local power holders.",
      personInsight:
        "For Braem, the co-authored report deepens the same profile: he works at the intersection of geopolitics, military deployments, post-conflict institutions, and the politics of rebuilding states. That is important for Erbil because the KRG file is not only diplomacy; it is also post-ISIS recovery, security-sector relationships, disputed territories, minority protection, and the question of how external actors support institutions without distorting local politics.",
      middleEastKurdistanRelevance:
        "The report is indirectly but strongly relevant. Iraq after 2003, the anti-ISIS war, Sinjar, Nineveh, and the Syria-Iraq border all raise the same issues: which security actors rebuild the state, who trains forces, how international support affects local legitimacy, and whether stabilization strengthens official institutions or armed networks. For Kurdistan Lens, this report should feed analysis of Peshmerga reform, coalition support, Yazidi/Sinjar security, and France's role in reconstruction politics."
    },
    tags: ["France", "post-conflict", "state reconstruction", "civil-military", "local PDF"]
  }),
  makeDocument({
    id: "kulaklikaya-turkey-new-player-development-2010",
    countryId: "turkey",
    personId: "musa-kulaklikaya",
    personName: "Musa Kulaklikaya",
    title: "Turkey as a New Player in Development Cooperation",
    documentType: "Journal article",
    publisher: "Insight Turkey",
    date: "2010",
    localPdfPath: bookSlot("musa-kulaklikaya", "kulaklikaya-turkey-new-player-development-cooperation-2010.pdf"),
    sourceUrl: "https://www.insightturkey.com/articles/turkey-as-a-new-player-in-development-cooperation",
    sourceLinks: [
      ["Insight Turkey article", "https://www.insightturkey.com/articles/turkey-as-a-new-player-in-development-cooperation"],
      ["OpenMETU citation page", "https://open.metu.edu.tr/handle/11511/114767"],
      ["Turkish MFA biography", "https://www.mfa.gov.tr/musa-kulaklikaya.en.mfa"]
    ],
    description:
      "Kulaklikaya and Rahman Nurdun's article on Turkey's emergence as a development-cooperation donor and the role of TIKA and ODA reporting.",
    summaries: {
      bookSummary:
        "The article explains Turkey's shift from aid recipient to emerging donor, with special attention to TIKA and official development-assistance reporting.",
      personInsight:
        "It shows Kulaklikaya as a development-diplomacy operator. His profile is not only protocol or bilateral diplomacy; it includes soft power, aid architecture, OIC/Global South networks, and institutional modernization.",
      middleEastKurdistanRelevance:
        "Indirectly relevant to KRG. Development cooperation can become a foreign-policy tool in Iraq, the wider Middle East, and Kurdish areas through reconstruction, public services, aid visibility, and Turkish influence."
    },
    tags: ["development cooperation", "TIKA", "Turkiye", "PDF needed"]
  }),
  makeDocument({
    id: "kulaklikaya-globalization-local-governments-1996",
    countryId: "turkey",
    personId: "musa-kulaklikaya",
    personName: "Musa Kulaklikaya",
    title: "Globalization and Local Governments in Turkiye",
    documentType: "Conference paper",
    publisher: "Symposium on Globalization, Locality, Human Settlements and Governance",
    date: "1996",
    localPdfPath: bookSlot("musa-kulaklikaya", "kulaklikaya-globalization-local-governments-turkiye-1996.pdf"),
    sourceUrl: "https://www.mfa.gov.tr/musa-kulaklikaya.en.mfa",
    sourceLinks: [["Turkish MFA biography and publications list", "https://www.mfa.gov.tr/musa-kulaklikaya.en.mfa"]],
    description:
      "A listed early Kulaklikaya publication on globalization and local government, co-authored with Metin Berber.",
    summaries: {
      bookSummary:
        "The full paper is not locally attached yet, but the publication slot matters because it shows Kulaklikaya's early interest in the local-government side of globalization. That is a useful prehistory to his later development-cooperation and OIC work: foreign policy is not only ministries and embassies, it is also municipalities, human settlements, service delivery, and local capacity.",
      personInsight:
        "For Kulaklikaya, this makes the profile more coherent. His later TIKA and SESRIC/OIC roles are not a sudden shift; they fit an administrative-development track that starts with local governance and expands into international development.",
      middleEastKurdistanRelevance:
        "Indirect but relevant. KRG relations often involve municipalities, reconstruction, service delivery, local administration, and cross-border development. This source should be used as background for why Kulaklikaya may matter through governance capacity and development cooperation rather than security rhetoric."
    },
    tags: ["local government", "globalization", "development", "PDF needed"]
  }),
  makeDocument({
    id: "kulaklikaya-recent-trends-global-development-assistance-tika-2011",
    countryId: "turkey",
    personId: "musa-kulaklikaya",
    personName: "Musa Kulaklikaya",
    title: "Recent Trends in Global Development Assistance and TIKA",
    documentType: "Journal article",
    publisher: "Journal of International Issues",
    date: "2011",
    localPdfPath: bookSlot("musa-kulaklikaya", "kulaklikaya-recent-trends-global-development-assistance-tika-2011.pdf"),
    sourceUrl: "https://www.mfa.gov.tr/musa-kulaklikaya.en.mfa",
    sourceLinks: [["Turkish MFA biography and publications list", "https://www.mfa.gov.tr/musa-kulaklikaya.en.mfa"]],
    description:
      "A listed Kulaklikaya publication on global development assistance and TIKA, the Turkish development agency he led.",
    summaries: {
      bookSummary:
        "This article should sit beside the 2010 Insight Turkey article. Together they make Kulaklikaya's profile much more than a deputy-minister biography: he is a development-assistance specialist whose writing tracks how TIKA and aid policy became instruments of Turkish foreign policy.",
      personInsight:
        "The document points to Kulaklikaya as an operator of soft power infrastructure. He matters where Turkiye uses development, reconstruction, humanitarian aid, training, statistics, and institutional cooperation to build influence.",
      middleEastKurdistanRelevance:
        "The KRG relevance is practical. Development assistance can enter Iraq and Kurdish areas through schools, hospitals, emergency response, reconstruction, cultural projects, and local-government links. A Kulaklikaya file should therefore track projects and budgets as much as statements."
    },
    tags: ["TIKA", "development assistance", "soft power", "PDF needed"]
  }),
  makeDocument({
    id: "kulaklikaya-oic-2025",
    countryId: "turkey",
    personId: "musa-kulaklikaya",
    personName: "Musa Kulaklikaya",
    title: "Turkiye and the OIC: Navigating Challenges and Strengthening Alliances",
    documentType: "Journal article",
    publisher: "Insight Turkey",
    date: "2025",
    localPdfPath: bookSlot("musa-kulaklikaya", "kulaklikaya-turkiye-oic-2025.pdf"),
    sourceUrl: "https://www.insightturkey.com/author/musa-kulaklikaya",
    sourceLinks: [
      ["Insight Turkey author page", "https://www.insightturkey.com/author/musa-kulaklikaya"],
      ["Turkish MFA biography", "https://www.mfa.gov.tr/musa-kulaklikaya.en.mfa"]
    ],
    description:
      "A recent Kulaklikaya article on Turkiye's role in the Organization of Islamic Cooperation.",
    summaries: {
      bookSummary:
        "The source trail identifies this as a 2025 article on Turkiye and the OIC. Add the PDF/OCR for a full argument-level summary.",
      personInsight:
        "It strengthens the profile of Kulaklikaya as a multilateral Islamic-world and development-policy actor.",
      middleEastKurdistanRelevance:
        "Indirect. OIC and Islamic-world diplomacy affect Iraq, minority protection, Gaza, Syria, and regional legitimacy debates, but the article should not be treated as a KRG statement unless the text mentions KRG or Kurdistan directly."
    },
    tags: ["OIC", "multilateral diplomacy", "PDF needed"]
  }),
  makeDocument({
    id: "araghchi-transboundary-water-diplomacy",
    countryId: "iran",
    personId: "seyed-abbas-araghchi",
    personName: "Seyed Abbas Araghchi",
    title: "Transboundary Water Diplomacy and the International System: Lessons for the Foreign Policy of the Islamic Republic of Iran",
    documentType: "Book",
    publisher: "Iran MFA bibliography",
    date: "Listed current",
    localPdfPath: bookSlot("seyed-abbas-araghchi", "araghchi-transboundary-water-diplomacy.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/ministrinfo/13756",
    sourceLinks: [["Iran MFA minister biography and books list", "https://en.mfa.gov.ir/portal/ministrinfo/13756"]],
    description:
      "Araghchi-listed book on transboundary water diplomacy and lessons for Iran's foreign policy.",
    summaries: {
      bookSummary:
        "The MFA title signals a book about water as a transboundary diplomatic problem and a source of lessons for Iranian foreign policy. OCR is needed before chapter-level conclusions.",
      personInsight:
        "It shows Araghchi as a negotiator who understands diplomacy beyond nuclear files: resources, regional interdependence, legal claims, and crisis management.",
      middleEastKurdistanRelevance:
        "Potentially very relevant. Water disputes connect Iran, Iraq, Turkiye, Syria, and the Kurdistan Region through rivers, dams, agriculture, border communities, and environmental pressure. Add the PDF and search for Iraq, Tigris, Euphrates, Kurdistan, KRG, and border provinces."
    },
    tags: ["water diplomacy", "Iran", "Iraq", "PDF needed"]
  }),
  makeDocument({
    id: "araghchi-terrorism-cyberspace-middle-east",
    countryId: "iran",
    personId: "seyed-abbas-araghchi",
    personName: "Seyed Abbas Araghchi",
    title: "Terrorism and Cyberspace in the Middle East",
    documentType: "Book",
    publisher: "Iran MFA bibliography",
    date: "Listed current",
    localPdfPath: bookSlot("seyed-abbas-araghchi", "araghchi-terrorism-cyberspace-middle-east.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/ministrinfo/13756",
    sourceLinks: [["Iran MFA minister biography and books list", "https://en.mfa.gov.ir/portal/ministrinfo/13756"]],
    description:
      "Araghchi-listed book on terrorism, cyberspace, and Middle Eastern security.",
    summaries: {
      bookSummary:
        "The title indicates a study of how terrorism and cyberspace interact in Middle Eastern security. OCR is needed for exact argument and case list.",
      personInsight:
        "It highlights Araghchi's security-modernization lens: regional threats are not only military or diplomatic but also information, networks, and cyber-enabled mobilization.",
      middleEastKurdistanRelevance:
        "Potentially relevant. Kurdish issues are often discussed through armed groups, Daesh, PKK-linked frames, border security, and cyber/information claims. The text must be searched before assigning a KRG-specific reading."
    },
    tags: ["terrorism", "cyber", "Middle East", "PDF needed"]
  }),
  makeDocument({
    id: "araghchi-sealed-secret-jcpoa",
    countryId: "iran",
    personId: "seyed-abbas-araghchi",
    personName: "Seyed Abbas Araghchi",
    title: "A Sealed Secret: The JCPOA; A Great Effort for the Rights, Security, and Development of Iran",
    documentType: "Book",
    publisher: "Iran MFA bibliography",
    date: "Listed current",
    localPdfPath: bookSlot("seyed-abbas-araghchi", "araghchi-sealed-secret-jcpoa.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/ministrinfo/13756",
    sourceLinks: [["Iran MFA minister biography and books list", "https://en.mfa.gov.ir/portal/ministrinfo/13756"]],
    description:
      "Araghchi-listed book on the JCPOA and Iranian rights, security, and development.",
    summaries: {
      bookSummary:
        "The title frames the JCPOA as a major effort for Iran's rights, security, and development. It is likely a key source for Araghchi's nuclear-negotiation worldview.",
      personInsight:
        "It positions Araghchi as a legalistic negotiator who links diplomacy to national rights, sanctions relief, security, and development.",
      middleEastKurdistanRelevance:
        "Indirect. JCPOA and sanctions dynamics influence Iran-Iraq trade, energy, banking, militia pressure, and regional escalation, all of which affect KRG room for maneuver."
    },
    tags: ["JCPOA", "sanctions", "Iran", "PDF needed"]
  }),
  makeDocument({
    id: "araghchi-power-of-negotiation",
    countryId: "iran",
    personId: "seyed-abbas-araghchi",
    personName: "Seyed Abbas Araghchi",
    title: "The Power of Negotiation",
    documentType: "Book",
    publisher: "Iran MFA bibliography / Diwan Spanish edition",
    date: "2025 / 2026 Spanish edition",
    localPdfPath: bookSlot("seyed-abbas-araghchi", "araghchi-power-of-negotiation.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/ministrinfo/13756",
    sourceLinks: [
      ["Iran MFA minister biography and books list", "https://en.mfa.gov.ir/portal/ministrinfo/13756"],
      ["IPIS Book and Diplomacy session with Araghchi", "https://www.ipis.ir/en/bookview1/768013/foreign-minister-seyyed-abbas-araghchi-at-the-concluding-session-of-the-book-and-diplomacy-series"],
      ["The Diplomat in Spain review of Spanish edition", "https://thediplomatinspain.com/en/2026/02/10/el-poder-de-la-negociacion-de-seyed-abbas-araghchi/"]
    ],
    description:
      "Araghchi-listed book on negotiation, likely tied to his diplomatic and nuclear-negotiation experience.",
    summaries: {
      bookSummary:
        "The title signals a negotiation-focused work. Add PDF/OCR to extract doctrine, negotiating principles, and examples.",
      personInsight:
        "It is directly relevant to Araghchi's profile because negotiation is his core public identity: nuclear talks, multilateral diplomacy, and crisis management.",
      middleEastKurdistanRelevance:
        "Indirect but useful. Iran-KRG and Iran-Iraq policy often depends on bargaining over borders, trade, security, water, sanctions, and de-escalation."
    },
    tags: ["negotiation", "Iran", "PDF needed"]
  }),
  makeDocument({
    id: "araghchi-water-diplomacy-crisis",
    countryId: "iran",
    personId: "seyed-abbas-araghchi",
    personName: "Seyed Abbas Araghchi",
    title: "Water Diplomacy and the Necessity to Overcome the Crisis Situation",
    documentType: "Book",
    publisher: "Iran MFA bibliography",
    date: "Listed current",
    localPdfPath: bookSlot("seyed-abbas-araghchi", "araghchi-water-diplomacy-crisis.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/ministrinfo/13756",
    sourceLinks: [["Iran MFA minister biography and books list", "https://en.mfa.gov.ir/portal/ministrinfo/13756"]],
    description:
      "Araghchi-listed book on water diplomacy and crisis management.",
    summaries: {
      bookSummary:
        "The official MFA bibliography lists this as a separate Araghchi water-diplomacy book. The title frames water not only as a technical resource question but as a crisis-management problem requiring diplomacy. OCR should extract whether the book emphasizes legal rights, regional bargaining, environmental security, or preventive diplomacy.",
      personInsight:
        "This strengthens the Araghchi profile around resource diplomacy. It suggests he has a repeated intellectual interest in water as a foreign-policy field, not a one-off article topic.",
      middleEastKurdistanRelevance:
        "Potentially high. Iran, Iraq, Turkiye, and Syria share water-security pressures; Kurdish border provinces and the Kurdistan Region can be affected by river management, dams, agriculture, electricity, migration, and protest dynamics. Treat it as priority OCR for Iraq/KRG relevance."
    },
    tags: ["water diplomacy", "crisis management", "Iran", "Iraq", "PDF needed"]
  }),
  makeDocument({
    id: "araghchi-iran-taishi-memoirs-japan",
    countryId: "iran",
    personId: "seyed-abbas-araghchi",
    personName: "Seyed Abbas Araghchi",
    title: "Iran-Taishi: Memoirs of Seyed Abbas Araghchi, Ambassador of Iran to Japan",
    documentType: "Diplomatic memoir",
    publisher: "Iran MFA bibliography",
    date: "Listed current",
    localPdfPath: bookSlot("seyed-abbas-araghchi", "araghchi-iran-taishi-memoirs-japan.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/ministrinfo/13756",
    sourceLinks: [["Iran MFA minister biography and books list", "https://en.mfa.gov.ir/portal/ministrinfo/13756"]],
    description:
      "Araghchi-listed memoir of his ambassadorship in Japan.",
    summaries: {
      bookSummary:
        "The MFA bibliography lists this as Araghchi's memoir from his Japan ambassadorship. It should be read as a diplomatic-practice source: how he describes host-country management, sanctions-era diplomacy, protocol, economic ties, public diplomacy, and the professional habits of an Iranian ambassador.",
      personInsight:
        "The memoir can show Araghchi outside the nuclear-negotiation frame. Japan was a major posting before his later senior roles, so this source may reveal his style with technologically advanced, U.S.-allied, energy-importing partners.",
      middleEastKurdistanRelevance:
        "Indirect. It is unlikely to be about Kurdistan directly, but it can help build an intelligence-style profile of Araghchi's diplomatic method, especially how he handles third countries, sanctions, energy questions, and Asian partners around Iran."
    },
    tags: ["diplomatic memoir", "Japan", "Araghchi", "PDF needed"]
  }),
  makeDocument({
    id: "ghalibaf-complexity-analysis-geopolitics-2023",
    countryId: "iran",
    personId: "mohammad-bagher-ghalibaf",
    personName: "Mohammad Bagher Ghalibaf",
    title: "The Logic of Complexity Analysis in Geopolitics: The Governance of Regimes in Geographical Structures",
    documentType: "Co-authored academic book",
    publisher: "University of Tehran Press",
    date: "2023",
    localPdfPath: bookSlot("mohammad-bagher-ghalibaf", "ghalibaf-complexity-analysis-geopolitics-2023.pdf"),
    sourceUrl: "https://geography.ut.ac.ir/en/~mghalibaf/books",
    sourceLinks: [["University of Tehran authored books page", "https://geography.ut.ac.ir/en/~mghalibaf/books"]],
    description:
      "A University of Tehran-listed Ghalibaf book, co-authored with Majid Gholami, on complexity analysis in geopolitics and governance in geographical structures.",
    summaries: {
      bookSummary:
        "The title points to a political-geography framework for governing complex geopolitical systems. OCR is needed before treating it as a full argument-level source.",
      personInsight:
        "It strengthens Ghalibaf's profile as an IRGC-politician with an academic political-geography identity, not only a parliamentary operator.",
      middleEastKurdistanRelevance:
        "Potentially relevant. Complexity, geography, and regime governance can shape how Iranian strategic actors think about borders, minorities, federal systems, insurgency spaces, and Kurdish regions."
    },
    tags: ["Ghalibaf", "geopolitics", "Iran", "PDF needed"]
  }),
  makeDocument({
    id: "ghalibaf-human-geography-concepts-2020",
    countryId: "iran",
    personId: "mohammad-bagher-ghalibaf",
    personName: "Mohammad Bagher Ghalibaf",
    title: "A Review of the Concepts of Human Geography",
    documentType: "Co-authored academic book",
    publisher: "Iranian Geopolitical Association",
    date: "2020",
    localPdfPath: bookSlot("mohammad-bagher-ghalibaf", "ghalibaf-review-concepts-human-geography-2020.pdf"),
    sourceUrl: "https://geography.ut.ac.ir/en/~mghalibaf/books",
    sourceLinks: [["University of Tehran authored books page", "https://geography.ut.ac.ir/en/~mghalibaf/books"]],
    description:
      "A University of Tehran-listed Ghalibaf book, co-authored with Mohammad Hadi Pouyandeh, reviewing concepts of human geography.",
    summaries: {
      bookSummary:
        "This appears to be a conceptual human-geography text rather than a current-policy document. Add the PDF/OCR to extract its vocabulary of space, population, borders, and political geography.",
      personInsight:
        "It reinforces that Ghalibaf's academic identity is tied to geography and state spatial management, a useful lens for interpreting his security and governance language.",
      middleEastKurdistanRelevance:
        "Indirect. Human geography matters for Kurdish analysis through borderlands, ethnic distribution, urban governance, migration, security geography, and Iranian provincial politics."
    },
    tags: ["Ghalibaf", "human geography", "Iran", "PDF needed"]
  }),
  makeDocument({
    id: "ghalibaf-centralization-decentralization-iran-2017",
    countryId: "iran",
    personId: "mohammad-bagher-ghalibaf",
    personName: "Mohammad Bagher Ghalibaf",
    title: "Centralization and Decentralization in Iran",
    documentType: "Academic book",
    publisher: "University of Tehran Press",
    date: "2017",
    localPdfPath: bookSlot("mohammad-bagher-ghalibaf", "ghalibaf-centralization-decentralization-iran-2017.pdf"),
    sourceUrl: "https://geography.ut.ac.ir/en/~mghalibaf/books",
    sourceLinks: [["University of Tehran authored books page", "https://geography.ut.ac.ir/en/~mghalibaf/books"]],
    description:
      "A University of Tehran-listed Ghalibaf book on centralization and decentralization in Iran.",
    summaries: {
      bookSummary:
        "The title makes this a high-priority text for Iranian governance analysis. OCR should look for provinces, ethnic geography, security, decentralization limits, and administrative authority.",
      personInsight:
        "This is one of the most important Ghalibaf texts for TOR Phi because it directly touches the state-structure question: how much power the center should hold and how local governance is organized.",
      middleEastKurdistanRelevance:
        "Highly relevant by structure. Kurdistan-facing Iran analysis depends on how Tehran views decentralization, provincial authority, border governance, Kurdish-majority areas, and the risks of local autonomy."
    },
    tags: ["Ghalibaf", "decentralization", "Iran", "Kurdish regions", "PDF needed"]
  }),
  makeDocument({
    id: "ghalibaf-iran-development-oriented-2009",
    countryId: "iran",
    personId: "mohammad-bagher-ghalibaf",
    personName: "Mohammad Bagher Ghalibaf",
    title: "Iran and the Development-Oriented",
    documentType: "Academic / policy book",
    publisher: "Ministry of Foreign Affairs",
    date: "2009",
    localPdfPath: bookSlot("mohammad-bagher-ghalibaf", "ghalibaf-iran-and-the-development-oriented-2009.pdf"),
    sourceUrl: "https://geography.ut.ac.ir/en/~mghalibaf/books",
    sourceLinks: [["University of Tehran authored books page", "https://geography.ut.ac.ir/en/~mghalibaf/books"]],
    description:
      "A University of Tehran-listed Ghalibaf book published by Iran's Ministry of Foreign Affairs in 2009.",
    summaries: {
      bookSummary:
        "The title and listed publisher suggest a development-oriented policy/geography work connected to Iran's foreign-policy or state-development discourse. OCR is needed for exact claims.",
      personInsight:
        "It links Ghalibaf's technocratic-development image to foreign-ministry publication channels, making it useful for reading him as both security actor and state-modernization politician.",
      middleEastKurdistanRelevance:
        "Indirect but important. Development-oriented state thinking can affect border provinces, infrastructure, trade corridors, sanctions adaptation, and Iranian views of neighboring Iraqi Kurdistan."
    },
    tags: ["Ghalibaf", "development", "Iran MFA", "PDF needed"]
  }),
  makeDocument({
    id: "ghalibaf-introduction-to-geopolitics-2012",
    countryId: "iran",
    personId: "mohammad-bagher-ghalibaf",
    personName: "Mohammad Bagher Ghalibaf",
    title: "Introduction to Geopolitics",
    documentType: "Translated academic book",
    publisher: "Ghomes / University of Tehran authored books page",
    date: "2012",
    localPdfPath: bookSlot("mohammad-bagher-ghalibaf", "ghalibaf-introduction-to-geopolitics-2012.pdf"),
    sourceUrl: "https://geography.ut.ac.ir/en/~mghalibaf/books",
    sourceLinks: [["University of Tehran authored books page", "https://geography.ut.ac.ir/en/~mghalibaf/books"]],
    description:
      "A University of Tehran-listed translated book associated with Ghalibaf on geopolitics.",
    summaries: {
      bookSummary:
        "The University of Tehran page lists this as a 2012 Ghalibaf translation. Because it is a translation, it should be treated differently from his authored books: it still matters because the choice of text shows the conceptual vocabulary he helped transmit into Persian academic and policy space.",
      personInsight:
        "For Ghalibaf, the translation reinforces the same pattern visible in his authored work: political geography, state space, power, borders, and governance. It helps explain why his political profile should not be reduced to mayoral management or IRGC service alone.",
      middleEastKurdistanRelevance:
        "Potentially useful by lens, not by direct claim. Geopolitical concepts shape how Iranian strategic actors think about borderlands, corridors, federal Iraq, ethnic geography, and Kurdish-majority spaces. OCR is needed before extracting specific Kurdistan relevance."
    },
    tags: ["Ghalibaf", "geopolitics", "translation", "Iran", "PDF needed"]
  }),
  makeDocument({
    id: "ghalibaf-contemporary-middle-east-political-history-2009",
    countryId: "iran",
    personId: "mohammad-bagher-ghalibaf",
    personName: "Mohammad Bagher Ghalibaf",
    title: "The Contemporary Middle East: A Political History since the First World War",
    documentType: "Translated academic book",
    publisher: "Ghomes / University of Tehran authored books page",
    date: "2009",
    localPdfPath: bookSlot("mohammad-bagher-ghalibaf", "ghalibaf-contemporary-middle-east-political-history-2009.pdf"),
    sourceUrl: "https://geography.ut.ac.ir/en/~mghalibaf/books",
    sourceLinks: [["University of Tehran authored books page", "https://geography.ut.ac.ir/en/~mghalibaf/books"]],
    description:
      "A University of Tehran-listed translated book associated with Ghalibaf on modern Middle Eastern political history.",
    summaries: {
      bookSummary:
        "The University of Tehran page lists this 2009 translation under Ghalibaf's books. It is a Middle East political-history text rather than a direct policy statement by him, but it belongs in the profile because translated works can reveal the intellectual material a policy figure considered worth importing for domestic readers.",
      personInsight:
        "This title strengthens the profile of Ghalibaf as someone formed by regional history and geopolitical interpretation. It should be used alongside his own books on centralization, geography, and development to understand his view of state order.",
      middleEastKurdistanRelevance:
        "High as background. A post-World War I Middle East political-history text will likely touch mandates, state formation, borders, Iraq, nationalism, and minority questions. Once OCRed, search for Kurds, Iraq, Iran, Turkiye, Syria, Mosul, Kirkuk, autonomy, and federalism."
    },
    tags: ["Ghalibaf", "Middle East", "political history", "translation", "PDF needed"]
  }),
  makeDocument({
    id: "ghanbari-financial-sanctions-2020",
    countryId: "iran",
    personId: "hamid-ghanbari",
    personName: "Hamid Ghanbari",
    title: "Financial Sanctions against the Islamic Republic of Iran and Strategies for Countering Them",
    documentType: "Book",
    publisher: "Iran MFA bibliography",
    date: "2020",
    localPdfPath: bookSlot("hamid-ghanbari", "ghanbari-financial-sanctions-iran-2020.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015",
    sourceLinks: [["Iran MFA biography and publications list", "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015"]],
    description:
      "Ghanbari's listed authored book on Iran financial sanctions and counter-strategies.",
    summaries: {
      bookSummary:
        "The title identifies a sanctions strategy book focused on financial restrictions against Iran and methods for countering them. Add OCR for exact mechanisms and recommendations.",
      personInsight:
        "This is central to Ghanbari's profile: he should be treated as a sanctions, banking, and payment-system specialist rather than a generic economic diplomat.",
      middleEastKurdistanRelevance:
        "Highly relevant indirectly. Sanctions and payment routes affect Iran-Iraq commerce, KRG banking exposure, energy payments, border trade, and the ability of regional actors to use alternative payment systems."
    },
    tags: ["sanctions", "banking", "Iran", "Iraq", "PDF needed"]
  }),
  makeDocument({
    id: "ghanbari-swift-alternatives-2024",
    countryId: "iran",
    personId: "hamid-ghanbari",
    personName: "Hamid Ghanbari",
    title: "Financial Messaging and International Law: SWIFT, Sanctions, and Alternative Networks",
    documentType: "Academic paper",
    publisher: "Comparative and International Law Academic Journal / Iran MFA bibliography",
    date: "2024",
    localPdfPath: bookSlot("hamid-ghanbari", "ghanbari-alternative-mechanisms-swift-2024.pdf"),
    sourceUrl: "https://www.cilamag.ir/article_715168_en.html",
    sourceLinks: [
      ["Journal article page", "https://www.cilamag.ir/article_715168_en.html"],
      ["Iran MFA biography and publications list", "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015"]
    ],
    description:
      "A Ghanbari co-authored paper on SWIFT, sanctions, alternative networks, and international law.",
    summaries: {
      bookSummary:
        "The journal abstract presents this as an analysis of SWIFT, sanctions, domestic Iranian law, the legitimacy of financial-messaging restrictions, state responses, and alternative mechanisms such as blockchain or non-SWIFT payment networks. It should be read with the sanctions book because both sit inside Ghanbari's economic-diplomacy specialty.",
      personInsight:
        "It reinforces Ghanbari's practical focus on sanctions evasion, payment infrastructure, international law, and economic diplomacy under pressure.",
      middleEastKurdistanRelevance:
        "Relevant to KRG risk analysis because alternative payment networks can affect cross-border trade, sanctioned entities, oil revenue flows, and banking compliance between Iran, Iraq, Turkiye, and the Kurdistan Region."
    },
    tags: ["SWIFT", "payments", "sanctions", "PDF needed"]
  }),
  makeDocument({
    id: "ghanbari-human-security-international-law-2009",
    countryId: "iran",
    personId: "hamid-ghanbari",
    personName: "Hamid Ghanbari",
    title: "Human Security and International Law",
    documentType: "Translated book",
    publisher: "Iran MFA biography",
    date: "2009",
    localPdfPath: bookSlot("hamid-ghanbari", "ghanbari-human-security-international-law-2009.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015",
    sourceLinks: [["Iran MFA biography and books list", "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015"]],
    description:
      "Ghanbari-listed translation on human security and international law.",
    summaries: {
      bookSummary:
        "Iran MFA lists this as a 2009 translated book by Ghanbari. It is important because human security links law to individual welfare, conflict, development, and protection, giving Ghanbari's legal profile a broader security-humanitarian layer beyond banking law.",
      personInsight:
        "The translation suggests Ghanbari was engaging with security concepts before his later sanctions and payment-system work. That matters because economic diplomacy can be framed not only as state finance but as social stability and national resilience.",
      middleEastKurdistanRelevance:
        "Indirect but useful. Human-security language can connect to displacement, sanctions effects, border communities, minority protection, and public welfare in Iraq and Kurdish regions. OCR should search for Iraq, minorities, refugees, sanctions, and conflict."
    },
    tags: ["Ghanbari", "human security", "international law", "translation", "PDF needed"]
  }),
  makeDocument({
    id: "ghanbari-air-law-2011",
    countryId: "iran",
    personId: "hamid-ghanbari",
    personName: "Hamid Ghanbari",
    title: "Air Law",
    documentType: "Translated book",
    publisher: "Iran MFA biography",
    date: "2011",
    localPdfPath: bookSlot("hamid-ghanbari", "ghanbari-air-law-2011.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015",
    sourceLinks: [["Iran MFA biography and books list", "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015"]],
    description:
      "Ghanbari-listed translation on air law.",
    summaries: {
      bookSummary:
        "Iran MFA lists this as a 2011 translated book by Ghanbari. Air law can cover sovereignty over airspace, civil aviation, liability, sanctions, safety, and the legal infrastructure of international movement.",
      personInsight:
        "This broadens Ghanbari from banking-only into international regulatory law. It helps profile him as a legal technician comfortable with cross-border systems that depend on rules, standards, and state consent.",
      middleEastKurdistanRelevance:
        "Indirect but relevant during regional crises. Iraq/KRG aviation, airspace closures, sanctions compliance, and conflict spillover can all become legal-economic issues. OCR should search for sovereignty, sanctions, airspace, liability, and state responsibility."
    },
    tags: ["Ghanbari", "air law", "international law", "translation", "PDF needed"]
  }),
  makeDocument({
    id: "ghanbari-banks-consumers-regulations-2016",
    countryId: "iran",
    personId: "hamid-ghanbari",
    personName: "Hamid Ghanbari",
    title: "Banks, Consumers and Regulations",
    documentType: "Translated book",
    publisher: "Iran MFA biography",
    date: "2016",
    localPdfPath: bookSlot("hamid-ghanbari", "ghanbari-banks-consumers-regulations-2016.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015",
    sourceLinks: [["Iran MFA biography and books list", "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015"]],
    description:
      "Ghanbari-listed translation on banking regulation and consumer protection.",
    summaries: {
      bookSummary:
        "Iran MFA lists this as a 2016 translated book. The title points to banking regulation, consumer protection, and the legal governance of financial services, which sits directly beside Ghanbari's Central Bank career.",
      personInsight:
        "This is a core background source for understanding Ghanbari as a regulator. His economic diplomacy should be read through banking supervision, consumer/institutional risk, and the legal design of financial systems.",
      middleEastKurdistanRelevance:
        "Relevant to practical KRG risk. Cross-border trade, banking exposure, sanctions compliance, payment services, and consumer/business protection all affect how Iran-Iraq-KRG economic channels can function."
    },
    tags: ["Ghanbari", "banking", "regulation", "translation", "PDF needed"]
  }),
  makeDocument({
    id: "ghanbari-intellectual-property-law-ideas-2022",
    countryId: "iran",
    personId: "hamid-ghanbari",
    personName: "Hamid Ghanbari",
    title: "Intellectual Property and the Law of Ideas",
    documentType: "Translated book",
    publisher: "Iran MFA biography",
    date: "2022",
    localPdfPath: bookSlot("hamid-ghanbari", "ghanbari-intellectual-property-law-ideas-2022.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015",
    sourceLinks: [["Iran MFA biography and books list", "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015"]],
    description:
      "Ghanbari-listed translation on intellectual property and ideas.",
    summaries: {
      bookSummary:
        "Iran MFA lists this as a 2022 translated book. It adds intellectual-property law to Ghanbari's legal range, showing attention to knowledge, technology, rights, innovation, and regulation.",
      personInsight:
        "For Ghanbari's profile, this matters because modern sanctions and economic diplomacy increasingly involve technology transfer, know-how, intellectual property, and access to global standards.",
      middleEastKurdistanRelevance:
        "Indirect. It can matter for technology, universities, digital infrastructure, and commercial modernization in Iraq/KRG relations, but it should not be read as a Kurdistan stance unless OCR reveals direct regional discussion."
    },
    tags: ["Ghanbari", "intellectual property", "technology", "translation", "PDF needed"]
  }),
  makeDocument({
    id: "ghanbari-human-rights-international-protection-2022",
    countryId: "iran",
    personId: "hamid-ghanbari",
    personName: "Hamid Ghanbari",
    title: "Human Rights and Their International Protection",
    documentType: "Translated book",
    publisher: "Iran MFA biography",
    date: "2022",
    localPdfPath: bookSlot("hamid-ghanbari", "ghanbari-human-rights-international-protection-2022.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015",
    sourceLinks: [["Iran MFA biography and books list", "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015"]],
    description:
      "Ghanbari-listed translation on human rights and international protection.",
    summaries: {
      bookSummary:
        "Iran MFA lists this as a 2022 translated book. It should be treated as a rights-law background source rather than a policy statement by Ghanbari unless the text includes his own preface or commentary.",
      personInsight:
        "This gives Ghanbari a rights-law layer in addition to sanctions and banking. It is useful when reading Iranian economic diplomacy claims that sanctions themselves violate rights or welfare.",
      middleEastKurdistanRelevance:
        "Indirect but useful. Human-rights protection is relevant to Kurdish populations, detainees, refugees, sanctions impacts, and international criticism of Iran. OCR should separate general rights doctrine from any Iran/Kurdistan-specific framing."
    },
    tags: ["Ghanbari", "human rights", "international law", "translation", "PDF needed"]
  }),
  makeDocument({
    id: "ghanbari-legislation-and-regulation-2023",
    countryId: "iran",
    personId: "hamid-ghanbari",
    personName: "Hamid Ghanbari",
    title: "Legislation and Regulation",
    documentType: "Translated book",
    publisher: "Iran MFA biography",
    date: "2023",
    localPdfPath: bookSlot("hamid-ghanbari", "ghanbari-legislation-and-regulation-2023.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015",
    sourceLinks: [["Iran MFA biography and books list", "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015"]],
    description:
      "Ghanbari-listed translation on legislation and regulation.",
    summaries: {
      bookSummary:
        "Iran MFA lists this as a 2023 translated book. It belongs in Ghanbari's profile because regulation is the common thread connecting banking, sanctions, payment systems, consumer protection, and state economic capacity.",
      personInsight:
        "This helps frame Ghanbari as a rule-design actor. He is likely to think in terms of regulatory architecture, institutional authority, compliance, and legal adaptation under pressure.",
      middleEastKurdistanRelevance:
        "Indirect. Regulatory thinking matters for cross-border trade rules, banking supervision, customs, payment systems, investment, and sanction-risk management around Iraq and the Kurdistan Region."
    },
    tags: ["Ghanbari", "regulation", "law", "translation", "PDF needed"]
  }),
  makeDocument({
    id: "ghanbari-philosophy-as-method-2023",
    countryId: "iran",
    personId: "hamid-ghanbari",
    personName: "Hamid Ghanbari",
    title: "Philosophy as a Method",
    documentType: "Translated book",
    publisher: "Iran MFA biography",
    date: "2023",
    localPdfPath: bookSlot("hamid-ghanbari", "ghanbari-philosophy-as-method-2023.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015",
    sourceLinks: [["Iran MFA biography and books list", "https://en.mfa.gov.ir/portal/organizationpersoninfo/25015"]],
    description:
      "Ghanbari-listed translation on philosophy as method.",
    summaries: {
      bookSummary:
        "Iran MFA lists this as a 2023 translated book. It is less directly policy-facing than the sanctions and banking works, but it matters as a method source: how concepts, reasoning, and analytic procedure are introduced into Ghanbari's reading profile.",
      personInsight:
        "This suggests an interest in method and reasoning beyond technical law. For an intelligence profile, that matters because it can affect how Ghanbari frames complex legal-economic problems.",
      middleEastKurdistanRelevance:
        "Low direct relevance unless the text or translator material discusses politics. Keep it as intellectual-background evidence, not a Kurdistan policy source."
    },
    tags: ["Ghanbari", "philosophy", "method", "translation", "PDF needed"]
  }),
  makeDocument({
    id: "gharibabadi-nuclear-disarmament-human-rights-catalog",
    countryId: "iran",
    personId: "kazem-gharibabadi",
    personName: "Kazem Gharibabadi",
    title: "Nuclear Disarmament and Human Rights Books Catalog",
    documentType: "Publication catalog placeholder",
    publisher: "Iran MFA biography",
    date: "Current",
    localPdfPath: bookSlot("kazem-gharibabadi", "gharibabadi-nuclear-disarmament-human-rights-catalog.pdf"),
    sourceUrl: "https://en.mfa.gov.ir/portal/organizationpersoninfo/13758",
    sourceLinks: [["Iran MFA biography", "https://en.mfa.gov.ir/portal/organizationpersoninfo/13758"]],
    description:
      "Iran MFA says Gharibabadi has authored 19 books on nuclear disarmament and human rights and more than 50 articles, but the page does not list individual titles.",
    summaries: {
      bookSummary:
        "This is a catalog placeholder, not one book. It records the official claim that Gharibabadi has a large body of writing on disarmament and human rights. Individual titles need to be found and added as separate profiles.",
      personInsight:
        "It marks Gharibabadi as a legal-international and human-rights/disarmament actor. His profile should be read through international organizations, nuclear diplomacy, lawfare, and rights rhetoric.",
      middleEastKurdistanRelevance:
        "Indirect. Human-rights and disarmament language can shape Iranian arguments about Israel, sanctions, international bodies, and regional legitimacy. It is not a KRG-specific source until titles and texts are imported."
    },
    tags: ["catalog", "human rights", "disarmament", "needs titles"]
  }),
  makeDocument({
    id: "trump-art-of-the-deal-1987",
    countryId: "usa",
    personId: "donald-trump",
    personName: "Donald J. Trump",
    title: "Trump: The Art of the Deal",
    documentType: "Book / memoir-business argument",
    publisher: "Random House / Penguin Random House",
    date: "1987",
    localPdfPath: bookSlot("donald-trump", "trump-art-of-the-deal-1987.pdf"),
    posterUrl: "https://images.penguinrandomhouse.com/cover/9780399594496",
    posterCredit: "Penguin Random House cover image",
    sourceUrl: "https://www.penguinrandomhouse.com/authors/31480/donald-j-trump/",
    sourceLinks: [
      ["Penguin Random House Donald J. Trump author page", "https://www.penguinrandomhouse.com/authors/31480/donald-j-trump/"],
      ["Penguin Random House Art of the Deal excerpt page", "https://www.penguinrandomhouse.ca/books/180675/trump-the-art-of-the-deal-by-donald-j-trump-with-tony-schwartz/9780399594496/excerpt"]
    ],
    description:
      "Trump's best-known deal-making book, credited to Donald J. Trump with Tony Schwartz, and a core source for his public self-image around leverage, negotiation, branding, and winning.",
    summaries: {
      bookSummary:
        "The book is structured as a business memoir and deal-making manual. For TOR Phi it matters less as a reliable factual autobiography than as a durable vocabulary of leverage, asymmetry, publicity, personal dominance, and transactional success.",
      personInsight:
        "It is foundational for understanding Trump's political style. The same instincts visible in the book - personal deal authority, pressure, public spectacle, loyalty, and win/loss framing - can appear in foreign policy when allies, adversaries, and partners are treated as negotiators in a high-stakes transaction.",
      middleEastKurdistanRelevance:
        "No direct Kurdistan content. Indirectly important because KRG analysis under Trump should track bargaining value: energy, bases, Iran pressure, counterterrorism, burden-sharing, and whether Erbil is framed as a useful partner in a broader deal."
    },
    tags: ["Trump", "deal-making", "negotiation", "PDF needed"]
  }),
  makeDocument({
    id: "trump-great-again-2015",
    countryId: "usa",
    personId: "donald-trump",
    personName: "Donald J. Trump",
    title: "Great Again: How to Fix Our Crippled America",
    documentType: "Book / campaign manifesto",
    publisher: "Threshold Editions / Simon & Schuster",
    date: "2015",
    localPdfPath: bookSlot("donald-trump", "trump-great-again-2015.pdf"),
    posterUrl: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781501138003/great-again-9781501138003_hr.jpg",
    posterCredit: "Simon & Schuster cover image",
    sourceUrl: "https://www.simonandschuster.com/books/Great-Again/Donald-J-Trump/9781501138003",
    sourceLinks: [["Simon & Schuster book page", "https://www.simonandschuster.com/books/Great-Again/Donald-J-Trump/9781501138003"]],
    description:
      "Trump's 2015 campaign book, originally published as Crippled America, laying out a nationalist domestic and security program.",
    summaries: {
      bookSummary:
        "The book presents Trump's campaign vision on immigration, trade, the military, health care, education, jobs, and national strength. It is a primary campaign-era worldview source rather than a narrow foreign-policy text.",
      personInsight:
        "It shows the policy frame that carried into Trump's governing style: borders, military strength, economic nationalism, skepticism of elites, and direct presidential authority.",
      middleEastKurdistanRelevance:
        "Indirect. For KRG/Kurdistan, the relevance is how Trump prioritizes U.S. advantage, military utility, anti-ISIS outcomes, Iran pressure, and economic return over long institutional commitments."
    },
    tags: ["Trump", "campaign manifesto", "national security", "PDF needed"]
  }),
  makeDocument({
    id: "erdogan-fairer-world-possible-2021",
    countryId: "turkey",
    personId: "recep-tayyip-erdogan",
    personName: "Recep Tayyip Erdogan",
    title: "A Fairer World Is Possible",
    documentType: "Book / global order argument",
    publisher: "Turkuvaz Kitap",
    date: "2021",
    localPdfPath: bookSlot("recep-tayyip-erdogan", "erdogan-a-fairer-world-is-possible-2021.pdf"),
    sourceUrl: "https://hbkupress.com/products/a-fairer-world-is-possible-paperback-arabic",
    sourceLinks: [
      ["Turkish Presidency Directorate of Communications announcement", "https://www.iletisim.gov.tr/english/haberler/detay/book-by-president-erdogan-a-fairer-world-is-possible"],
      ["HBKU Press edition page", "https://hbkupress.com/products/a-fairer-world-is-possible-paperback-arabic"],
      ["AbeBooks bibliographic page", "https://www.abebooks.com/9786257548199/Fairer-World-Possible-Recep-Tayyip-6257548195/plp"]
    ],
    description:
      "Erdogan's book on UN reform and global inequality, tied to the doctrine that the world is bigger than the five permanent members of the UN Security Council.",
    summaries: {
      bookSummary:
        "The book is a global-order argument: it criticizes concentrated Security Council power, injustice, terrorism, Islamophobia, refugee crises, and international inequality while presenting Turkiye as a voice for a more representative world system.",
      personInsight:
        "It is useful for understanding Erdogan's international self-presentation: anti-status-quo, Muslim-world-facing, sovereignty-conscious, and comfortable treating Turkiye as a civilizational and diplomatic corrective to Western-dominated institutions.",
      middleEastKurdistanRelevance:
        "Indirect but important. Erdogan's KRG/Iraq policy should be read alongside this global posture: public support for fairness and regional dignity can coexist with strict Turkish security red lines around PKK, YPG, borders, and territorial integrity."
    },
    tags: ["Erdogan", "UN reform", "global order", "PDF needed"]
  }),
  makeDocument({
    id: "macron-revolution-2016",
    countryId: "france",
    personId: "emmanuel-macron",
    personName: "Emmanuel Macron",
    title: "Revolution",
    documentType: "Book / political memoir-manifesto",
    publisher: "XO Editions",
    date: "2016",
    localPdfPath: bookSlot("emmanuel-macron", "macron-revolution-2016.pdf"),
    posterUrl: "https://xoeditions.com/wp-content/uploads/2016/11/9782845639669.jpg",
    posterCredit: "XO Editions cover image",
    sourceUrl: "https://xoeditions.com/en/livres/revolution/",
    sourceLinks: [
      ["XO Editions book page", "https://xoeditions.com/en/livres/revolution/"],
      ["Scribe English edition page", "https://scribepublications.com.au/books/revolution"]
    ],
    description:
      "Macron's 2016 campaign-era book, a political memoir and manifesto for renewal, reform, Europe, and a new political center.",
    summaries: {
      bookSummary:
        "Macron's 2016 book is both political memoir and campaign manifesto. It presents a diagnosis of French stagnation, a defense of reform, and an argument that France needs renewal beyond the old left-right party system. The book also frames France inside a wider transformation: globalization, technology, European interdependence, insecurity, and institutional fatigue. Its importance for TOR Phi is that it gives the baseline Macron worldview before the presidency: executive energy, social mobility, reformist centrism, European ambition, and the belief that France can regain agency through movement-building and institutional modernization.",
      personInsight:
        "This book anchors Macron as a reformist, European, executive-centered politician. His foreign policy should be read through the same logic: break inherited paralysis, rebuild national and European capacity, use presidential diplomacy visibly, and treat France as a middle power with global reach. The text does not give a detailed Middle East doctrine, but it does explain why Macron often combines high-level symbolic diplomacy with technocratic reform language and European strategic-autonomy arguments.",
      middleEastKurdistanRelevance:
        "There is no direct Kurdistan argument in the book. Its value is indirect: Macron's France often links European strategic autonomy, counterterrorism, Iraq stabilization, minority protection, and visible presidential diplomacy with Erbil and Baghdad. For Kurdistan Lens, the book helps explain the style more than the substance: Macron tends to frame regional files as tests of France's ability to act, mediate, protect vulnerable communities, maintain counterterrorism partnerships, and keep Europe strategically present."
    },
    tags: ["Macron", "France", "Europe", "PDF needed"]
  }),
  makeDocument({
    id: "starmer-justice-in-error-1993",
    countryId: "uk",
    personId: "keir-starmer",
    personName: "Keir Starmer",
    title: "Justice in Error",
    documentType: "Edited legal volume",
    publisher: "Blackstone Press",
    date: "1993",
    localPdfPath: bookSlot("keir-starmer", "starmer-justice-in-error-1993.pdf"),
    sourceUrl: "https://lawcat.berkeley.edu/record/141687?ln=en",
    sourceLinks: [
      ["Berkeley Law library record", "https://lawcat.berkeley.edu/record/141687?ln=en"],
      ["Waterstones bibliographic page", "https://www.waterstones.com/book/justice-in-error/prof-clive-walker/keir-starmer/9781854312341"]
    ],
    description:
      "An edited legal volume by Clive Walker and Keir Starmer on wrongful convictions and miscarriages of justice.",
    summaries: {
      bookSummary:
        "The book belongs to Starmer's early criminal-justice and civil-liberties period. It studies investigative and procedural failures that produce wrongful convictions.",
      personInsight:
        "It shows Starmer before electoral politics as a legality-and-process actor. His instinct is to institutionalize rights, procedure, review, and accountable state power rather than rely on purely political rhetoric.",
      middleEastKurdistanRelevance:
        "Indirect. For foreign policy, this background matters when reading Starmer-era UK positions on international law, detainees, human rights, counterterrorism, and legal constraints in Iraq/Syria policy."
    },
    tags: ["Starmer", "justice", "human rights", "PDF needed"]
  }),
  makeDocument({
    id: "starmer-three-pillars-liberty-1996",
    countryId: "uk",
    personId: "keir-starmer",
    personName: "Keir Starmer",
    title: "The Three Pillars of Liberty: Political Rights and Freedoms in the United Kingdom",
    documentType: "Co-authored legal-political book",
    publisher: "Routledge",
    date: "1996",
    localPdfPath: bookSlot("keir-starmer", "starmer-three-pillars-liberty-1996.pdf"),
    sourceUrl: "https://www.routledge.com/The-Three-Pillars-of-Liberty-Political-Rights-and-Freedoms-in-the-United-Kingdom/Klug-Starmer-Weir/p/book/9780415096423",
    sourceLinks: [["Routledge book page", "https://www.routledge.com/The-Three-Pillars-of-Liberty-Political-Rights-and-Freedoms-in-the-United-Kingdom/Klug-Starmer-Weir/p/book/9780415096423"]],
    description:
      "A co-authored audit of political rights and freedoms in the UK, written with Francesca Klug and Stuart Weir.",
    summaries: {
      bookSummary:
        "The book analyzes how UK institutions secure political freedom and argues that the system had serious weaknesses. It is a rights-audit text.",
      personInsight:
        "It is central to Starmer's legal identity: civil liberties, rule of law, rights architecture, institutional compliance, and systematic review rather than improvisation.",
      middleEastKurdistanRelevance:
        "Indirect. It helps explain why a Starmer foreign-policy profile should track legal framing around human rights, international law, democratic institutions, and minority protection, including when the UK discusses Iraq, Syria, Kurds, Yazidis, and regional accountability."
    },
    tags: ["Starmer", "civil liberties", "Routledge", "PDF needed"]
  }),
  makeDocument({
    id: "starmer-signing-up-human-rights-1998",
    countryId: "uk",
    personId: "keir-starmer",
    personName: "Keir Starmer",
    title: "Signing Up for Human Rights: The United Kingdom and International Standards",
    documentType: "Co-authored human-rights book",
    publisher: "Amnesty International UK",
    date: "1998-06-04",
    localPdfPath: bookSlot("keir-starmer", "starmer-signing-up-human-rights-1998.pdf"),
    sourceUrl: "https://openlibrary.org/books/OL12081315M/Signing_Up_for_Human_Rights",
    sourceLinks: [
      ["Open Library bibliographic record", "https://openlibrary.org/books/OL12081315M/Signing_Up_for_Human_Rights"],
      ["Hatchards bibliographic page", "https://www.hatchards.co.uk/book/signing-up-for-human-rights/conor-foley/9781873328309"],
      ["Amazon bibliographic page", "https://www.amazon.co.uk/Signing-Human-Rights-International-Standards/dp/1873328303"]
    ],
    description:
      "A Conor Foley and Keir Starmer Amnesty International UK book on the United Kingdom and international human-rights standards.",
    summaries: {
      bookSummary:
        "This 1998 Amnesty International UK book sits between Starmer's civil-liberties work and his later Human Rights Act/ECHR handbooks. The available sources establish the authorship, title, publisher, and date, but no local PDF is attached yet, so TOR Phi should treat this as a verified bibliographic profile rather than an OCR-complete reading. The title itself is important: it places Starmer in the debate over whether the UK should bind itself more fully to international human-rights standards.",
      personInsight:
        "For Starmer, this strengthens the picture of a lawyer whose pre-political identity was built around enforceable rights and international standards. It also shows that his rights thinking was not only domestic criminal justice. He was already working in the space where UK law, treaty commitments, foreign-policy credibility, asylum, arms, development, and international criticism meet.",
      middleEastKurdistanRelevance:
        "The Kurdistan relevance is indirect but useful. If Starmer's early framework was that the UK gains credibility by meeting international standards itself, then his government should be analyzed for consistency when dealing with Iraq, Syria, refugees, arms exports, proscription, detainees, and minority protection. Do not infer a direct KRG stance from this book; use it to interpret the legal standard by which he may justify policy."
    },
    tags: ["Starmer", "Amnesty International", "international standards", "human rights", "PDF needed"]
  }),
  makeDocument({
    id: "starmer-miscarriages-of-justice-1999",
    countryId: "uk",
    personId: "keir-starmer",
    personName: "Keir Starmer",
    title: "Miscarriages of Justice: A Review of Justice in Error",
    documentType: "Edited legal volume",
    publisher: "Blackstone Press",
    date: "1999",
    localPdfPath: bookSlot("keir-starmer", "starmer-miscarriages-of-justice-1999.pdf"),
    sourceUrl: "https://www.nypl.org/research/research-catalog/bib/hb990082206130203941",
    sourceLinks: [
      ["NYPL catalog record", "https://www.nypl.org/research/research-catalog/bib/hb990082206130203941"],
      ["WorldCat record", "https://search.worldcat.org/title/Miscarriages-of-justice-%3A-a-review-of-justice-in-error/oclc/1015474634"]
    ],
    description:
      "A later edited review of wrongful-conviction issues, again associated with Clive Walker and Keir Starmer.",
    summaries: {
      bookSummary:
        "The book revisits miscarriages of justice and examines how criminal-justice processes can generate wrongful convictions and how those failures might be prevented.",
      personInsight:
        "It reinforces Starmer's profile as a lawyer shaped by institutional failure, evidence quality, state accountability, and procedural repair.",
      middleEastKurdistanRelevance:
        "Indirect. In Kurdistan-relevant UK policy, this background matters most when legal standards, detainee handling, proscription, counterterrorism powers, and accountability for abuses become part of the file."
    },
    tags: ["Starmer", "criminal justice", "PDF needed"]
  }),
  makeDocument({
    id: "starmer-european-human-rights-law-1999",
    countryId: "uk",
    personId: "keir-starmer",
    personName: "Keir Starmer",
    title: "European Human Rights Law: The Human Rights Act 1998 and the European Convention on Human Rights",
    documentType: "Legal handbook",
    publisher: "Legal Action Group",
    date: "1999",
    localPdfPath: bookSlot("keir-starmer", "starmer-european-human-rights-law-1999.pdf"),
    sourceUrl: "https://www.lag.org.uk/shop/book-title/201294/european-human-rights-law",
    sourceLinks: [
      ["Legal Action Group book page", "https://www.lag.org.uk/shop/book-title/201294/european-human-rights-law"],
      ["Berkeley Law library record", "https://lawcat.berkeley.edu/record/100482"],
      ["LAG author note", "https://www.lag.org.uk/article/207945/best-selling-lag-author-elected-leader-of-the-opposition"]
    ],
    description:
      "Starmer's comprehensive handbook on the Human Rights Act 1998 and European Convention on Human Rights practice.",
    summaries: {
      bookSummary:
        "The handbook explains the Human Rights Act, Convention rights, criminal and civil applications, and procedures for the European human-rights system.",
      personInsight:
        "This is probably the most important legal text for understanding Starmer's pre-political worldview: rights are operational, procedural, and institutionally enforceable, not only moral language.",
      middleEastKurdistanRelevance:
        "Indirect but highly relevant to UK foreign-policy analysis. Starmer's legal background shapes how his government may balance security, migration, proscription, war powers, arms exports, and accountability in Middle East files involving Iraq, Syria, and Kurdish actors."
    },
    tags: ["Starmer", "ECHR", "Human Rights Act", "PDF needed"]
  }),
  makeDocument({
    id: "starmer-criminal-justice-police-powers-2001",
    countryId: "uk",
    personId: "keir-starmer",
    personName: "Keir Starmer",
    title: "Criminal Justice, Police Powers and Human Rights",
    documentType: "Co-authored legal book",
    publisher: "Blackstone Press / Oxford University Press",
    date: "2001",
    localPdfPath: bookSlot("keir-starmer", "starmer-criminal-justice-police-powers-human-rights-2001.pdf"),
    sourceUrl: "https://global.oup.com/academic/product/criminal-justice-police-powers-and-human-rights-9781841741383",
    sourceLinks: [
      ["Oxford University Press book page", "https://global.oup.com/academic/product/criminal-justice-police-powers-and-human-rights-9781841741383"],
      ["Library catalog record", "https://catalogue.umu.ac.ug/bib/18028"]
    ],
    description:
      "A legal text by Starmer and co-authors on criminal justice, police powers, and human-rights constraints.",
    summaries: {
      bookSummary:
        "The book connects criminal justice and police powers to the human-rights framework. It is directly about how state coercive power should be bounded.",
      personInsight:
        "For Starmer, it points to a disciplined security-law mindset: state power is legitimate when structured, evidenced, and rights-compliant.",
      middleEastKurdistanRelevance:
        "Indirect but useful. Kurdish issues in the UK file can involve terrorism law, PKK/YPG designations, protest policing, asylum, extradition, and intelligence cooperation; Starmer's legal roots matter in those areas."
    },
    tags: ["Starmer", "police powers", "human rights", "PDF needed"]
  }),
  makeDocument({
    id: "starmer-blackstones-human-rights-digest-2001",
    countryId: "uk",
    personId: "keir-starmer",
    personName: "Keir Starmer",
    title: "Blackstone's Human Rights Digest",
    documentType: "Co-authored legal digest",
    publisher: "Blackstone Press",
    date: "2001",
    localPdfPath: bookSlot("keir-starmer", "starmer-blackstones-human-rights-digest-2001.pdf"),
    sourceUrl: "https://search.worldcat.org/title/Blackstone%27s-human-rights-digest/oclc/46739911",
    sourceLinks: [
      ["WorldCat record", "https://search.worldcat.org/title/Blackstone%27s-human-rights-digest/oclc/46739911"],
      ["Cambridge review record", "https://www.cambridge.org/core/journals/international-and-comparative-law-quarterly/article/blackstones-human-rights-digest-by-keir-starmer-with-iain-byrne-london-blackstone-press-ltd-lxi-410pp-isbn-1841741531-no-price-given-hbk-plus-one-cd/4722D5D042590BD5898BC06190C89263"]
    ],
    description:
      "A human-rights digest by Keir Starmer with Iain Byrne and Francesca Klug, linked to Blackstone Press and the Human Rights Act research environment.",
    summaries: {
      bookSummary:
        "The digest organizes human-rights law for practical use, showing how rights jurisprudence can be tracked and applied across cases.",
      personInsight:
        "It adds another piece to the Starmer profile: he is not only a courtroom advocate but a systematizer of rights law, case law, and legal tools.",
      middleEastKurdistanRelevance:
        "Indirect. The relevance is legal infrastructure: human-rights analysis of state action, detention, security powers, minority rights, and judicial review can shape UK posture on Middle East accountability questions."
    },
    tags: ["Starmer", "human rights", "legal digest", "PDF needed"]
  }),
  makeDocument({
    id: "starmer-human-rights-manual-sourcebook-africa-2005",
    countryId: "uk",
    personId: "keir-starmer",
    personName: "Keir Starmer",
    title: "Human Rights Manual and Sourcebook for Africa",
    documentType: "Co-authored legal manual",
    publisher: "British Institute of International and Comparative Law",
    date: "2005-06-01",
    localPdfPath: bookSlot("keir-starmer", "starmer-human-rights-manual-sourcebook-africa-2005.pdf"),
    sourceUrl: "https://www.eclan.eu/en/publication/human-rights-manual-and-sourcebook-for-africa",
    sourceLinks: [
      ["ECLAN publication record", "https://www.eclan.eu/en/publication/human-rights-manual-and-sourcebook-for-africa"],
      ["WorldCat record", "https://search.worldcat.org/title/Human-rights-manual-and-sourcebook-for-Africa/oclc/63760191"],
      ["Berkeley Law library record", "https://lawcat.berkeley.edu/record/435448?ln=en"]
    ],
    description:
      "A large human-rights manual and sourcebook for Africa by Theodora Christou, Keir Starmer, and Juan Pablo Raymond, published by the British Institute of International and Comparative Law.",
    summaries: {
      bookSummary:
        "This is a 1,391-page legal manual and sourcebook, built for human-rights practitioners, academics, and lawyers working with African constitutional, regional, and international jurisprudence. The ECLAN record frames it as a resource that turns difficult human-rights research into a usable reference collection. It is not a political memoir. It is evidence of Starmer working on the practical legal infrastructure of rights protection across jurisdictions.",
      personInsight:
        "For Starmer's profile, this is significant because it expands him beyond UK-only rights law. He appears here as a lawyer interested in comparative and regional human-rights systems, legal tools, and practitioner access. That makes his foreign-policy file more legal-institutional than purely rhetorical: rights are something to compile, litigate, interpret, and operationalize.",
      middleEastKurdistanRelevance:
        "The manual is not about Kurdistan, Iraq, or Syria. Its relevance is methodological. Kurdistan-facing questions often involve constitutional guarantees, minority protections, detention, fair trial, displacement, regional courts, and international human-rights language. This source supports reading Starmer through legal infrastructure and enforceability, then checking direct UK records for his actual KRG line."
    },
    tags: ["Starmer", "Africa", "human rights", "legal manual", "PDF needed"]
  }),
  makeDocument({
    id: "starmer-ardoyne-whiterock-parades-policing-report-2005",
    countryId: "uk",
    personId: "keir-starmer",
    personName: "Keir Starmer",
    title: "Report on the Policing of the Ardoyne and Whiterock Parades 2005",
    documentType: "Human-rights monitoring report",
    publisher: "Northern Ireland Policing Board",
    date: "2005-12",
    localPdfPath: bookSlot("keir-starmer", "starmer-ardoyne-whiterock-parades-policing-report-2005.pdf"),
    localPdfAvailable: true,
    posterUrl: "/source/posters/starmer-ardoyne-whiterock-parades-policing-report-2005.png",
    posterCredit: "Local first-page render from the CAIN-hosted Northern Ireland Policing Board PDF",
    sourceUrl: "https://cain.ulster.ac.uk/issues/police/policingboard/nipb1205parades.pdf",
    sourceLinks: [
      ["CAIN PDF copy", "https://cain.ulster.ac.uk/issues/police/policingboard/nipb1205parades.pdf"],
      ["Northern Ireland Policing Board annual report reference", "https://assets.publishing.service.gov.uk/media/5a7c9ed8e5274a30fa38fee2/1288.pdf"]
    ],
    ocrStatus: "Local PDF imported and text-readable. Summary is based on the downloaded report text.",
    sourceBasis: "CAIN-hosted copy of the Northern Ireland Policing Board report, downloaded locally and checked with pdftotext.",
    description:
      "Keir Starmer QC and Jane Gordon's human-rights monitoring report on the policing of contentious Ardoyne and Whiterock parades in Northern Ireland.",
    summaries: {
      bookSummary:
        "This report is operational human-rights work. Starmer and Jane Gordon review how the PSNI handled contentious parades, serious disorder, police/military deployment, water cannon, impact rounds, live fire risk, community consultation, command planning, intelligence briefings, and compliance with the Human Rights Act 1998. It is valuable because it shows rights analysis applied to live public-order security, not only courtroom doctrine.",
      personInsight:
        "For Starmer, this is one of the best sources for his security-law mindset. The report does not reject state force; it asks whether force is lawful, planned, proportionate, documented, necessary, and accountable. That distinction matters for foreign policy. It suggests Starmer may accept security operations when he can frame them through law, necessity, proportionality, evidence, and oversight.",
      middleEastKurdistanRelevance:
        "The Kurdistan relevance is indirect but unusually strong. UK policy toward Iraq, Syria, PKK/YPG/SDF, protests, proscription, border security, and partner-force conduct often involves the same balance: public order, armed threats, community rights, intelligence, and lawful use of force. This report helps explain why a Starmer profile should separate security support from rights oversight rather than treating them as opposites."
    },
    tags: ["Starmer", "Northern Ireland", "policing", "Human Rights Act", "local PDF", "text-readable"]
  }),
  makeDocument({
    id: "powell-great-hatred-little-room-2008",
    countryId: "uk",
    personId: "jonathan-powell",
    personName: "Jonathan Powell",
    title: "Great Hatred, Little Room: Making Peace in Northern Ireland",
    documentType: "Book / peace-process memoir",
    publisher: "The Bodley Head / Penguin Random House",
    date: "2008",
    localPdfPath: bookSlot("jonathan-powell", "powell-great-hatred-little-room-2008.pdf"),
    sourceUrl: "https://www.penguin.co.uk/authors/220018/jonathan-powell",
    sourceLinks: [["Penguin Jonathan Powell author page", "https://www.penguin.co.uk/authors/220018/jonathan-powell"]],
    description:
      "Powell's account of making peace in Northern Ireland and the inside mechanics of political negotiation.",
    summaries: {
      bookSummary:
        "The book uses the Northern Ireland peace process to explain negotiation, trust-building, sequencing, back channels, leadership, and the political management of armed conflict.",
      personInsight:
        "It is central to Powell's profile: he thinks in terms of talks, channels, timing, credible guarantees, and converting violent conflict into political settlement.",
      middleEastKurdistanRelevance:
        "Highly relevant by analogy. Kurdistan-facing UK analysis should read Powell through negotiation with armed actors, post-conflict arrangements, autonomy, guarantees, and the difficulty of translating security dilemmas into durable political deals."
    },
    tags: ["Powell", "peace process", "Northern Ireland", "PDF needed"]
  }),
  makeDocument({
    id: "powell-new-machiavelli-2010",
    countryId: "uk",
    personId: "jonathan-powell",
    personName: "Jonathan Powell",
    title: "The New Machiavelli: How to Wield Power in the Modern World",
    documentType: "Book / political memoir",
    publisher: "The Bodley Head / Penguin Random House",
    date: "2010",
    localPdfPath: bookSlot("jonathan-powell", "powell-new-machiavelli-2010.pdf"),
    sourceUrl: "https://www.penguin.co.uk/authors/220018/jonathan-powell",
    sourceLinks: [
      ["Penguin Jonathan Powell author page", "https://www.penguin.co.uk/authors/220018/jonathan-powell"],
      ["Guardian review", "https://www.theguardian.com/books/2010/oct/16/new-machiavelli-jonathan-powell-review"]
    ],
    description:
      "Powell's book on power, court politics, leadership, and the practical machinery of modern government.",
    summaries: {
      bookSummary:
        "The book reflects on power and governing from inside the Blair era, using Machiavelli as a frame for modern political operation.",
      personInsight:
        "It shows Powell as an operator of political power, not only a conflict mediator. He studies access, decision-making, court politics, and the mechanics of executive influence.",
      middleEastKurdistanRelevance:
        "Indirect. For Kurdistan analysis, Powell's influence should be read through process design and executive access: who gets heard, who has back channels, and how conflict files move inside No. 10 and the national-security system."
    },
    tags: ["Powell", "power", "executive politics", "PDF needed"]
  }),
  makeDocument({
    id: "powell-talking-to-terrorists-2014",
    countryId: "uk",
    personId: "jonathan-powell",
    personName: "Jonathan Powell",
    title: "Talking to Terrorists: How to End Armed Conflicts",
    documentType: "Book / conflict-resolution argument",
    publisher: "The Bodley Head / Penguin Random House",
    date: "2014",
    localPdfPath: bookSlot("jonathan-powell", "powell-talking-to-terrorists-2014.pdf"),
    sourceUrl: "https://www.penguin.co.uk/authors/220018/jonathan-powell",
    sourceLinks: [
      ["Penguin Jonathan Powell author page", "https://www.penguin.co.uk/authors/220018/jonathan-powell"],
      ["LSE event page", "https://www.lse.ac.uk/lse-player/why-we-should-talk-to-terrorists"]
    ],
    description:
      "Powell's argument for negotiating with armed groups as a route to ending conflicts.",
    summaries: {
      bookSummary:
        "The book argues that governments often say they will never talk to terrorist groups, but serious conflicts usually require communication, intermediaries, incentives, and political exits.",
      personInsight:
        "It gives Powell a distinctive profile inside any national-security system: he is likely to ask whether an enemy can be split, incentivized, de-escalated, or brought into a political channel.",
      middleEastKurdistanRelevance:
        "Very relevant to Kurdish and Iraq/Syria analysis. It helps frame debates around PKK/YPG/SDF, demobilization, political inclusion, ceasefires, counterterrorism labels, and whether armed Kurdish-linked actors are treated only as threats or also as negotiation subjects."
    },
    tags: ["Powell", "armed conflict", "negotiation", "PDF needed"]
  }),
  makeDocument({
    id: "jarvis-long-way-home-2018",
    countryId: "uk",
    personId: "dan-jarvis",
    personName: "Dan Jarvis",
    title: "Long Way Home: Love, Life, Death, and Everything in Between",
    documentType: "Book / military-political memoir",
    publisher: "Little, Brown / Hachette",
    date: "2018",
    localPdfPath: bookSlot("dan-jarvis", "jarvis-long-way-home-2018.pdf"),
    sourceUrl: "https://www.amazon.com/Long-Way-Home-everything-between/dp/1408710722",
    sourceLinks: [
      ["Amazon bibliographic page", "https://www.amazon.com/Long-Way-Home-everything-between/dp/1408710722"],
      ["Audible UK page", "https://www.audible.co.uk/pd/Long-Way-Home-Audiobook/1405546034"]
    ],
    description:
      "Jarvis's memoir of military service, Afghanistan, grief, family, and political life.",
    summaries: {
      bookSummary:
        "The memoir connects Jarvis's experience as a soldier in Afghanistan with personal loss and his later public-service identity.",
      personInsight:
        "It helps distinguish Jarvis from a generic defence figure: he brings direct military experience, casualty awareness, and a personal language of duty and resilience.",
      middleEastKurdistanRelevance:
        "Indirect but useful. His record should be read with attention to veterans, counterinsurgency, force protection, coalition deployments, and how UK defence actors think about partners such as the Peshmerga."
    },
    tags: ["Jarvis", "Afghanistan", "defence", "PDF needed"]
  }),
  ...congressionalBookRecords.map((document) => makeDocument(document))
];

export const foreignPolicyDocumentsBySlug = new Map(
  foreignPolicyDocuments.flatMap((document) => [
    [document.slug, document],
    [document.id, document]
  ])
);

export function getDocumentBySlug(slug) {
  if (!slug) return null;
  return foreignPolicyDocumentsBySlug.get(slug) || null;
}

export function getDocumentsForPerson(countryId, personId) {
  return foreignPolicyDocuments.filter((document) => (
    document.countryId === countryId &&
    document.personId === personId
  ));
}

export function getDocumentsForActorName(name) {
  const normalized = `${name ?? ""}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return foreignPolicyDocuments.filter((document) => (
    `${document.personName}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalized
  ));
}
