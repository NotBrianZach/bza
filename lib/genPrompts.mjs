export function genSystemMsg(
  title,
  synopsis,
  articleType = "book",
  prependList = [],
  appendList = []
) {
  // return `Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, retell the following EXCERPT in voice of NARRATOR:${narrator}, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${excerpt}`;
  return (
    prependList.join("") +
    `You are BZA: An AI-Powered Conversational REPL for Books & Articles, you read several pages at a time and then output some user specified thing, e.g. a quiz. You may need to ignore conversion artifacts since we convert all articles, whether pdf, html, or epub, into markdown prior to giving them to you. Today we are reading a ${articleType} {{TITLE}} {{${title}}}. The {{overall summary}} is {{${synopsis}}}` +
    appendList.join("")
  );
}

export function retellSliceAsNarratorPrompt(
  narrator,
  excerpt,
  rollingSummary
  // articleType,
  // prependList,
  // appendList
) {
  return `Given {{{RECENT SUMMARY}}}:{{{${rollingSummary}}}} of previous content, retell the following [[[EXCERPT]]]:[[[${excerpt}]]] in voice of (((NARRATOR))):(((${narrator})))`;
}

export function genSliceSummaryPrompt(
  rollingSummary,
  excerpt
  // prependList,
  // appendList
) {
  return `Given ((RECENT SUMMARY)): ((${rollingSummary})), Summarize the following [[EXCERPT]]:[[${excerpt}]]`;
}

export function genRollingSummaryPrompt(
  rollingSummary,
  excerpt
  // prependList,
  // appendList
) {
  return `Given ((RECENT SUMMARY)): ((${rollingSummary})) and [[EXCERPT]]:[[${excerpt}]], generate a new ((RECENT SUMMARY))`;
}

export function genQuizPrompt(title, synopsis, excerpt, articleType) {
  switch (articleType) {
    // case "dnd":
    // return `[[INSTRUCTIONS]]: [[generate several dnd scenarios for the player(s) to choose from and act on based on prior conversation]]`
    default:
      return `((((INSTRUCTIONS)))): ((((Generate a quiz of questions to test knowledge of [[[EXCERPT]]] ))))`;
  }
}

export function genQuizGradePrompt(studentAnswers) {
  switch (articleType) {
    // case "dnd":
    // return `INSTRUCTIONS: given SYNOPSIS and EXCERPT of dnd session titled "${title}" narrate a response to player actions SYNOPSIS: ${synopsis} EXCERPT: ${excerpt}`
    default:
      return `assign a grade x:number, to student answers in format { grade: x, question1: ["correct", ""], question2: ["wrong", "correct answer goes here"], ... }`;
  }
}
