#!/usr/bin/env node
import fs from "fs";
import prompt from "prompt";
import getUserInput from "./getUserInput.mjs";
import runQuiz from "./lib/runQuiz.mjs";
import {genSliceSummaryPrompt, genRollingSummaryPrompt, retellSliceAsNarratorPrompt} from "./lib/genPrompts.mjs";
import readline from 'readline';
import {
  removeExtraWhitespace,
  devLog,
  newSessionTime,
  validateObj
} from "./lib/utils.mjs";
import path from "path";

// const app = express();
// const http = require('http').createServer(app);
import {io} from "./markdownViewerServer.mjs"

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

const IS_DEV = process.env.IS_DEV
const nowTime = new Date();
export default async function eventLoop(bzaTxt, readOpts, queryGPT, sessionTime) {
  const totalPages = bzaTxt.length;
  const {
    pageNum,
    narrator,
    sliceSize,
    synopsis,
    rollingSummary,
    isPrintPage,
    isPrintSliceSummary,
    isPrintRollingSummary,
    title
  } = readOpts;
  let readOptsToToggle = {}
  console.log(
    `totalPages ${totalPages}, pageNum ${readOpts.pageNumber}, sliceSize ${readOpts.sliceSize}`
  );
  devLog("eventLoop arguments", arguments)
  let pageSliceInit = removeExtraWhitespace(
    bzaTxt.slice(pageNum, pageNum + sliceSize).join("")
  );

  devLog("initial pageSlice b4 queryGPT retell slice", pageSliceInit)

  let pageSlice = "";
  let sliceSummary = "";
  const getPageSliceQuery = async () => {
    if (narrator !== "") {
      const pageSliceQuery = await queryGPT(
        retellSliceAsNarratorPrompt(narrator, pageSlice, title, synopsis, rollingSummary),
        {}
      );

      if (pageSliceQuery.gptQueryErr !== undefined) {
        throw new Error(`gpt query error when narrator retelling pageSlice: ${pageSliceQuery.gptQueryErr}`);
      } else {
        console.log("pageSliceQuery.txt", pageSliceQuery.txt);
        return pageSliceQuery.txt;
      }
    } else {
      return pageSliceInit;
    }
  };
  const getSliceSummaryQuery = async (pageSlice) => {
    const sliceSummaryQuery = await queryGPT(
      genSliceSummaryPrompt(title, synopsis, rollingSummary, pageSliceInit),
      {}
    );

    if (sliceSummaryQuery.gptQueryErr !== undefined) {
      throw new Error(`gpt query error when summarigizing pageSlice: ${sliceSummaryQuery.gptQueryErr}`);
    } else {
      return sliceSummaryQuery.txt;
    }
  };

  try {
    const [pageSliceResult, sliceSummaryResult] = await Promise.all([
      getPageSliceQuery(),
      getSliceSummaryQuery()
    ]);
    pageSlice = pageSliceResult;
    sliceSummary = sliceSummaryResult;
  } catch (error) {
    console.error(error.message);
  }


  let markdownToEmit = ""
  if (isPrintRollingSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum +
      sliceSize}:`,
      rollingSummary
    );
    markdownToEmit += rollingSummary
  }
  if (isPrintSliceSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + sliceSize}:`,
      sliceSummary
    );
    markdownToEmit += "----------------------------------------\n"
    markdownToEmit += sliceSummary
  }
  if (isPrintPage) {
    console.log(
      `Page Slice`,
      pageSlice
    );
    markdownToEmit += "----------------------------------------\n"
    markdownToEmit += pageSlice
  }
  io.emit("markdown", markdownToEmit);
  if () {
    const {} = await runQuiz(pageSlice, readOpts, queryGPT);
  }
  const userInput = await getUserInput(bzaTxt, {...readOpts,
                                          sessionTime,
                                          rollingSummary,
                                          pageSliceInit,
                                          pageSlice,
                                          sliceSummary
                                         }, queryGPT);
  switch (userInput.label) {
    case "jump":
      if (userInput.jump < totalPages) {
        return eventLoop(bzaTxt, {
          ...readOpts,
          pageNum: userInput.jump
        }, queryGPT, sessionTime);
      } else {
        console.log("jump failed")
      }
      break
    case "exit":
        return `Event Loop End, saving bookmark result: ${insertMD(
           readOpts.title,
           readOpts.tStamp,
           readOpts.synopsis,
           readOpts.narrator,
           readOpts.pageNum,
           readOpts.sliceSize,
           readOpts.rollingSummary,
           readOpts.isPrintPage,
           readOpts.isPrintSliceSummary,
           readOpts.isPrintRollingSummary,
           readOpts.filePath)}`
      return "successful loop exit"
      break
    default: // do nothing
  }

  // 2. rollingSummary=queryGPT3(synopsis+pageSliceSummary)
  let newRollingSummary = ""
  const rollingSummaryQuery = await queryGPT(
    genRollingSummaryPrompt(title, synopsis, rollingSummary, pageSlice), {}
  )
  if (rollingSummaryQuery.gptQueryErr !== undefined) {
    return `gpt query error when summarizing rollingSummary : ${rollingSummaryQuery.gptQueryErr}`
  } else {
    newRollingSummary = rollingSummaryQuery.txt
  }

  if (isPrintRollingSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + sliceSize} within context of synopsis:`,
      rollingSummary
    );
  }

  if (pageNum + sliceSize < totalPages) {
    // logSummary.push(rollingSummary);
    return eventLoop(bzaTxt, {
      ...readOpts,
      pageNum: pageNum + sliceSize
    }, queryGPT, sessionTime);
  } else {
    // pageNum+1 becuz zero index
    if (pageNum + 1 === totalPages) {
      // save and ex
      console.log(logs);
      return "successful loop exit"
    } else {
      // read up to totalPages (but not beyond)
      // 10 pages total, 0 index pageNum = 8 (actually 9), sliceSize = 2
      // pageNum + slicesize = total pages
      // 10 pages total, 0 index pageNum = 8 (actually 9), sliceSize = 3
      // pageNum + slicesize > total pages
      const lastSliceSize = totalPages - pageNum - 1
      return eventLoop(bzaTxt, {
        ...readOpts,
        rollingSummary,
        pageNum: pageNum + lastSliceSize,
        sliceSize: lastSliceSize
      }, queryGPT, sessionTime);
    }

  }
}
