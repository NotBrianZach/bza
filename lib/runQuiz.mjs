import prompt from "prompt";
import { genQuizPrompt, genQuizGradePrompt } from "./genPrompts.mjs";

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

  return { quiz, grade };
}

// TODO a more general subloop creation function
function runNSubloop() {
  return async function() {
    const { pageNum, chunkSize, synopsis, rollingSummary, title } = readOpts;
    const quiz = await queryGPT(
      genQuizPrompt((title, synopsis, pageSlice)),
      {}
    );
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

    return { quiz, grade };
  };
}

// TODO a more general subloop creation function
function runNSubloop() {
  return async function() {
    const { pageNum, chunkSize, synopsis, rollingSummary, title } = readOpts;
    const quiz = await queryGPT(
      genQuizPrompt((title, synopsis, pageSlice)),
      {}
    );
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
      { parentId: quiz.id }
    );
    console.log("grade", grade);

    return { quiz: quiz.txt, grade: grade.txt };
  };
}

// TODO a more general subloop creation function
function runNSubloop() {
  return async function(...queries) {
    const { pageNum, chunkSize, synopsis, rollingSummary, title } = readOpts;
    const totalQueries = queries.length;
    for (let i = 0; i < totalQueries; i++) {
      const quiz = await queryGPT(
        genQuizPrompt((title, synopsis, pageSlice)),
        {}
      );
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
        { parentId: quiz.id }
      );
      console.log("grade", grade);
    }
    return { quiz: quiz.txt, grade: grade.txt };
  };
}

// TODO a more general subloop creation function
function runNSubloop() {
  return async function(...queries) {
    const { pageNum, chunkSize, synopsis, rollingSummary, title } = readOpts;
    const totalQueries = queries.length;
    for (let i = 0; i < totalQueries; i++) {
      const quiz = await queryGPT(
        genQuizPrompt((title, synopsis, pageSlice)),
        {}
      );
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
        { parentId: quiz.id }
      );
      console.log("grade", grade);
    }
    return { quiz: quiz.txt, grade: grade.txt };
  };
}

// TODO a more general subloop creation function
function runNStepSubloopOnPageChunk(pageSlice, readOpts, queriesObject) {
  return async function(queriesObject) {
    const { pageNum, chunkSize, synopsis, rollingSummary, title } = readOpts;
    queriesNames = Object.keys(queriesObject);
    const totalQueries = queriesNames.length;
    for (let i = 0; i < totalQueries; i++) {
      // const response = await queryGPT(genQuizPrompt((title, synopsis, pageSlice)), {});
      // console.log(`Quiz:`, quiz);
    }
    // logQuiz.push(quiz);
    // const queryUserDefault("q", true)
    // const { studentAnswers } =
    // while (queri) {
    //   const quiz = await queryGPT(genQuizPrompt((title, synopsis, pageSlice)), {});
    //   console.log(`Quiz:`, quiz);
    //   // logQuiz.push(quiz);
    //   // const queryUserDefault("q", true)
    //   const { studentAnswers } = await prompt.get({
    //     properties: {
    //       studentAnswers: {
    //         message: "Enter Answers",
    //         required: true
    //       }
    //     }
    //   });
    // }

    const grade = await queryGPT(
      genQuizGradePrompt(title, synopsis, pageSlice, studentAnswers),
      {}
    );
    console.log("grade", grade);

    return { ...responses };
  };
}
