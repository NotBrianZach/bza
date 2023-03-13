export default {
  genPromptChunkSummary: (title, synopsis, rollingSummary, excerpt) =>
    `Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${excerpt}`,
  genPromptRollingSummary: (title, synopsis, rollingSummary, excerpt) =>
    `Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT with respect to the rest of the book, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${excerpt}`,
  genPromptQuiz: (title, synopsis, excerpt) =>
    `INSTRUCTIONS: given SUMMARY and CONTENT of book titled "${title}" generate a quiz bank of questions to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${excerpt}`,
  genPromptQuizGrade: (title, synopsis, excerpt, studentAnswers) =>
    `assign a grade in format { grade: x, question1: ["correct", ""], "question2": ["wrong", "correct answer goes here"], ... }, given {SUMMARY} and {CONTENT} of book titled "${title}" to {student answers} to a {QUIZ} to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${excerpt} {QUIZ}: quiz {STUDENT ANSWERS}: ${studentAnswers}`
};
