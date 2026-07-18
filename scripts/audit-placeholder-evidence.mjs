import { actorProfiles } from "../src/data.js";
import { usCongressMembers } from "../src/usCongress.js";

const lensPattern = /kurdistan|kurdish|krg|ikby|erbil|irbil|peshmerga|northern iraq|sinjar|yazidi|iraq|syria|pkk|ypg|sdf/i;
const placeholderPattern = /no direct|no .*attached|no .*record|needs policy linkage|research priority|unreviewed|attach sourced|before assigning|search official|watch terms|monitoring task|source work|add direct|profile shell|placeholder|pending|to collect|source slot|archive intake/i;

function inspectStatement(owner, statement, source) {
  const text = [statement?.title, statement?.summary, statement?.stance, statement?.date].filter(Boolean).join(" ");
  if (lensPattern.test(text) && placeholderPattern.test(text)) {
    return {
      owner,
      source,
      title: statement?.title || "Untitled",
      date: statement?.date || "",
      reason: "Placeholder/research text contains Lens terms"
    };
  }
  return null;
}

const findings = [];

Object.entries(actorProfiles).forEach(([name, profile]) => {
  (profile.statementsOnKurdistan ?? []).forEach((statement) => {
    const finding = inspectStatement(name, statement, "actorProfiles.statementsOnKurdistan");
    if (finding) findings.push(finding);
  });
});

usCongressMembers.forEach((member) => {
  (member.statementsOnKurdistan ?? []).forEach((statement) => {
    const finding = inspectStatement(member.name, statement, "usCongress.statementsOnKurdistan");
    if (finding) findings.push({ ...finding, id: member.id });
  });
});

console.log(JSON.stringify({
  checked: {
    actorProfiles: Object.keys(actorProfiles).length,
    usCongressMembers: usCongressMembers.length
  },
  strict: process.argv.includes("--strict"),
  placeholderLensStatementCount: findings.length,
  findings
}, null, 2));

if (process.argv.includes("--strict") && findings.length > 0) {
  process.exitCode = 1;
}
