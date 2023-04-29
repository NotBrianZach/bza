#!/usr/bin/env node
import fs from "fs";
import prompt from "prompt";
import _ from "underscore";
import getUserInput from "./getUserInput.mjs";
import runQuiz from "./lib/runQuiz.mjs";
import {
  genSystemMsg,
  genSliceSummaryPrompt,
  genRollingSummaryPrompt,
  retellSliceAsNarratorPrompt
} from "./lib/genPrompts.mjs";
import { insertMD, insertBookmark } from "./lib/dbQueries.mjs";
import readline from "readline";
import {
  removeExtraWhitespace,
  devLog,
  newSessionTime,
  validateObj
} from "./lib/utils.mjs";
import path from "path";

// const app = express();
// const http = require('http').createServer(app);

// io.on('markdown', (data) => {
//   markdown = data;

//   let pages = Math.ceil(markdown.length / charPerPage);
//   console.log(`Total pages: ${pages}`);
//   for (let i = 0; i < pages; i++) {
//     let start = i * charPerPage;
//     let end = start + charPerPage;
//     let pageContent = markdown.substring(start, end);
//     console.log(`Page ${i + 1}:\n${pageContent}\n`);
//   }

const IS_DEV = process.env.IS_DEV;
const nowTime = new Date();

export default async function eventLoop(
  bzaTxt,
  {
    pageNum = 0,
    narrator = "",
    articleType = "book",
    prependList = [],
    appendList = [],
    parentConvId = undefined,
    synopsis = "",
    rollingSummary = "",
    sliceSize = 2,
    charPageLength = 1800,
    isQuiz = false,
    isPrintPage = true,
    isPrintSliceSummary = true,
    isPrintRollingSummary = true,
    title
  },
  queryGPT,
  sessionTime,
  io
) {
  const totalPages = bzaTxt.length;
  const readOpts = arguments[1];
  let readOptsToToggle = {
    isPrintPage,
    isPrintSliceSummary,
    isPrintRollingSummary,
    isQuiz
  };
  console.log(
    `totalPages ${totalPages}, pageNum ${pageNum}, sliceSize ${sliceSize}`
  );
  // devLog("eventLoop arguments", arguments)

  let pageSliceInit = removeExtraWhitespace(
    bzaTxt.slice(
      pageNum * charPageLength,
      (pageNum + sliceSize) * charPageLength
    )
  );

  devLog("initial pageSlice b4 queryGPT retell slice", pageSliceInit);

  let systemMsg = genSystemMsg(
    title,
    synopsis,
    articleType,
    prependList,
    appendList
  );
  let mostRecentChatId = "";
  let pageSlice = pageSliceInit;
  let sliceSummary = "";
  const getPageSliceQuery = async pageSlice2 => {
    if (narrator !== "" && narrator !== undefined && narrator !== null) {
      try {
        return await queryGPT(
          retellSliceAsNarratorPrompt(narrator, pageSlice2, rollingSummary),
          {
            systemMsg,
            parentConvId: parentConvId
          }
        );
      } catch (gptQueryErr) {
        if (pageSliceQuery.gptQueryErr !== undefined) {
          throw new Error(
            `gpt query error when narrator retelling pageSlice: ${pageSliceQuery.gptQueryErr}`
          );
        } else {
          devLog("pageSliceQuery", pageSliceQuery);
          mostRecentChatId = pageSliceQuery.id;
          return Promise.resolve(pageSliceQuery.txt);
        }
      }
    } else {
      return Promise.resolve(pageSliceInit);
    }
  };

  const getSliceSummaryQuery = pageSlice2 => {
    try {
      return queryGPT(
        genSliceSummaryPrompt(title, synopsis, rollingSummary, pageSlice2),
        {
          systemMsg,
          parentConvId: parentConvId
        }
      );
    } catch (gptQueryErr) {
      throw new Error(
        `gpt query error when summarizing pageSlice2: ${gptQueryErr}`
      );
    }
    // if (sliceSummaryQuery.gptQueryErr !== undefined) {
    //   throw new Error(`gpt query error when summarizing pageSlice2: ${sliceSummaryQuery.gptQueryErr}`);
    // } else {
    //   return sliceSummaryQuery;
    // }
  };

  let currentParentConvId = parentConvId;
  console.log("2345");
  try {
    const [pageSliceResult, sliceSummaryResult] = await Promise.all([
      getPageSliceQuery(pageSlice),
      getSliceSummaryQuery(pageSlice)
    ]);
    pageSlice = pageSliceResult;
    sliceSummary = sliceSummaryResult.txt;
    currentParentConvId = sliceSummaryResult.id;
  } catch (error) {
    console.error(error.message);
  }
  console.log("1234");

  let markdownToEmit = "";
  if (isPrintRollingSummary) {
    console.log(
      `Rolling Summary of pages ${pageNum} to ${pageNum + sliceSize}:`,
      rollingSummary
    );
    markdownToEmit += rollingSummary;
  }
  if (isPrintSliceSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + sliceSize}:`,
      sliceSummary
    );
    markdownToEmit += "----------------------------------------\n";
    markdownToEmit += sliceSummary;
  }
  if (isPrintPage) {
    console.log(`Page Slice`, pageSlice);
    markdownToEmit += "----------------------------------------\n";
    markdownToEmit += pageSlice;
  }
  const isMarkdownEmitted = io.emit("markdown", markdownToEmit);
  devLog("isMarkdownEmitted", isMarkdownEmitted);

  if (readOptsToToggle.isQuiz) {
    try {
      const quizToggles = await runQuiz(pageSlice, { ...readOpts }, queryGPT);
      readOptsToToggle = {
        ...readOptsToToggle,
        ...quizToggles,
        parentConvId: currentParentConvId
      };
      currentParentConvId = quizToggles.parentConvId;
    } catch (err) {
      console.error("failed runQuiz:", err.message);
    }
  }

  try {
    const userInput = await getUserInput(
      bzaTxt,
      {
        ...readOpts,
        sessionTime,
        originalParentConvId: currentParentConvId,
        pageSlice
        // sliceSummary
      },
      queryGPT
    );
    switch (userInput.label) {
      case "start":
      // TODO
        startConversation = createSubloop(pageSlice, readOpts)
      //
      // case "queryEmbeddings":
      //   // TODO save
      //   // quiz, grade
      //   break;
    // case "done":
    //   // TODO save
    //   // quiz, grade
    //   break;
    // case "forget":
    //   break;
    // case "converse":
    //   break;
    // case "again":
    //   break;
    // case "againFresh":
    //   break;
      // TODO
        await startConversation()


      case "jump":
        if (userInput.jump < totalPages) {
          return eventLoop(
            bzaTxt,
            {
              ...readOpts,
              pageNum: userInput.jump
            },
            queryGPT,
            sessionTime
          );
        } else {
          console.log("jump failed");
        }
        break;
      case "exit":
        console.log("exiting");
      const bookmarkResult = await insertBookmark(
        _.omit(readOpts, [
          "articleType",
          // "prependList",
          // "appendList"
        ])
      )
        return `Event Loop End, saving bookmark result: ${bookmarkResult}`;
        return "successful loop exit";
        break;
      default: // do nothing
    }
  } catch (err) {
    console.error("failed getUserInput:", err.message);
  }

  // 2. rollingSummary=queryGPT3(synopsis+pageSliceSummary)
  let newRollingSummary = "";
  const rollingSummaryQuery = await queryGPT(
    genRollingSummaryPrompt(title, synopsis, rollingSummary, pageSlice),
    {}
  );
  if (rollingSummaryQuery.gptQueryErr !== undefined) {
    return `gpt query error when summarizing rollingSummary : ${rollingSummaryQuery.gptQueryErr}`;
  } else {
    newRollingSummary = rollingSummaryQuery.txt;
  }

  if (isPrintRollingSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum +
        sliceSize} within context of synopsis:`,
      rollingSummary
    );
  }

  if (pageNum + sliceSize < totalPages) {
    // logSummary.push(rollingSummary);
    return eventLoop(
      bzaTxt,
      {
        ...readOpts,
        pageNum: pageNum + sliceSize,
        parentId: rollingSummaryQuery.parentId
      },
      queryGPT,
      sessionTime,
      io
    );
  } else {
    // pageNum+1 becuz zero index
    if (pageNum + 1 === totalPages) {
      // save and ex
      console.log(logs);
      return "successful loop exit";
    } else {
      // read up to totalPages (but not beyond)
      // 10 pages total, 0 index pageNum = 8 (actually 9), sliceSize = 2
      // pageNum + slicesize = total pages
      // 10 pages total, 0 index pageNum = 8 (actually 9), sliceSize = 3
      // pageNum + slicesize > total pages
      const lastSliceSize = totalPages - pageNum - 1;
      return eventLoop(
        bzaTxt,
        {
          ...readOpts,
          rollingSummary,
          pageNum: pageNum + lastSliceSize,
          sliceSize: lastSliceSize
        },
        queryGPT,
        sessionTime,
        io
      );
    }
  }
}
