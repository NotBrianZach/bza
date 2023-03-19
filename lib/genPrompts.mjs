export function retellChunkAsNarratorPrompt(
  narrator,
  excerpt,
  title,
  synopsis,
  rollingSummary
  // articleType,
  // prependList,
  // appendList
) {
  return `Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, retell the following EXCERPT in voice of NARRATOR:${narrator}, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${excerpt}`;
}
export function genChunkSummaryPrompt(
  title,
  synopsis,
  rollingSummary,
  excerpt,
  articleType,
  prependList,
  appendList
) {
  return `Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${excerpt}`;
}

export function genRollingSummaryPrompt(
  title,
  synopsis,
  rollingSummary,
  excerpt,
  articleType,
  prependList,
  appendList
) {
  return `Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT with respect to the rest of the ${articleType}, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${excerpt}`;
}

export function genQuizPrompt(title, synopsis, excerpt, articleType) {
  switch (articleType) {
    // case "dnd":
    // return `INSTRUCTIONS: given SYNOPSIS and EXCERPT of dnd session titled "${title}" generate several scenarios for the player(s) to choose from and act on, SYNOPSIS: ${synopsis} EXCERPT: ${excerpt}`
    default:
      return `INSTRUCTIONS: given SUMMARY and CONTENT of book titled "${title}" generate a quiz bank of questions to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${excerpt}`;
  }
}

export function genQuizGradePrompt(
  title,
  synopsis,
  excerpt,
  articleType,
  studentAnswers
) {
  switch (articleType) {
    // case "dnd":
    // return `INSTRUCTIONS: given SYNOPSIS and EXCERPT of dnd session titled "${title}" narrate a response to player actions SYNOPSIS: ${synopsis} EXCERPT: ${excerpt}`
    default:
      return `assign a grade in format { grade: x, question1: ["correct", ""], "question2": ["wrong", "correct answer goes here"], ... }, given {SUMMARY} and {CONTENT} of book titled "${title}" to {student answers} to a {QUIZ} to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${excerpt} {QUIZ}: quiz {STUDENT ANSWERS}: ${studentAnswers}`;
  }
}
