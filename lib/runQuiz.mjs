import prompt from "prompt";
import readingListTopLevel from "../readingList.mjs";

export default async function runQuiz(pageSlice, readOpts, queryGPT) {
  const { genQuizPrompt, genQuizGradePrompt } = readingListTopLevel;
  const { pageNum, chunkSize, synopsis, rollingSummary, title } = readOpts;
  const quiz = await queryGPT(genQuizPrompt((title, synopsis, pageSlice)));
  console.log(`Quiz:`, quiz);
  // logQuiz.push(quiz);
  // const queryUserDefault("q", true)
  const { studentAnswers } = await prompt.get({
    properties: {
      studentAnswers: {
        message: "Enter Answers",
        required: true
      }
    }
  });
  const grade = await queryGPT(
    genQuizGradePrompt(title, synopsis, pageSlice, studentAnswers)
  );
  console.log("grade", grade);
  return { quiz, grade };
}
