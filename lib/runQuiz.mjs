import prompt from "prompt";
import { genQuizPrompt, genQuizGradePrompt } from "./genPrompts.mjs";
import { promptAutoCompleteExplainExecute } from "./explanatoryPrompt.mjs";

export default async function runQuiz(pageSlice, readOpts, queryGPT) {
  const { pageNum, chunkSize, synopsis, rollingSummary, title } = readOpts;
  const quiz = await queryGPT(genQuizPrompt((title, synopsis, pageSlice)), {});
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
    genQuizGradePrompt(title, synopsis, pageSlice, studentAnswers),
    {}
  );
  console.log("grade", grade);

  const postQuizQueryOptions = [
    {
      name: "done",
      description: "exit&save a log of the quiz&answers"
    },
    {
      name: "forget",
      description: "exit, don't log quiz or answers"
    },
    {
      name: "converse",
      description: "converse with gpt about quiz"
    },
    {
      name: "again",
      description: "run quiz loop again, saving log"
    },
    {
      name: "againFresh",
      description: "run quiz loop again, don't log"
    }
  ];
  const postQuizOption = promptAutoCompleteExplainExecute(postQuizQueryOptions);

  return { ...readOpts };
}

// TODO a more general subloop creation function
// function runNStepSubloopOnPageChunk(pageSlice, readOpts, queriesObj) {
export function createSubloop(pageSlice, readOpts, queriesObj) {
  return async function(queriesObj) {
    const { pageNum, chunkSize, synopsis, rollingSummary, title } = readOpts;
    const queryNames = Object.keys(queriesObj);
    const totalQueries = queryNames.length;
    let parentId = undefined;
    let responses = {};
    for (let i = 0; i < totalQueries; i++) {
      const queryName = queryNames[i];
      const queryFunc = queriesObj[queryName];
      // const { studentAnswers } = await prompt.get({
      //   properties: {
      //     studentAnswers: {
      //       message: "Enter Answers",
      //       required: true
      //     }
      //   }
      // });
      responses[queryName] = await queryGPT(queryFunc((pageSlice, readOpts)), {
        parentId
      });
      // console.log(`${queryName}:`, response);
      parentId = response.id;
    }
    return { ...responses };
  };
}
