#!/usr/bin/env node
import fs from "fs";
import prompt from "prompt";
import getUserInput from "./getUserInput.mjs";
import runQuiz from "./lib/runQuiz.mjs";
import {genChunkSummaryPrompt, genRollingSummaryPrompt, retellChunkAsNarratorPrompt} from "./lib/genPrompts.mjs";
import {
  removeExtraWhitespace,
  devLog,
  newSessionTime,
  validateObj
} from "./lib/utils.mjs";
import path from "path";

const IS_DEV = process.env.IS_DEV
const nowTime = new Date();
export default async function eventLoop(bzaTxt, readOpts, queryGPT, sessionTime) {
  const totalPages = bzaTxt.text_pages.length;
  const {
    pageNum,
    narrator,
    chunkSize,
    synopsis,
    rollingSummary,
    isPrintPage,
    isPrintChunkSummary,
    isPrintRollingSummary,
    title
  } = readOpts;
  console.log(
    `totalPages ${totalPages}, pageNum ${readOpts.pageNumber}, chunkSize ${readOpts.chunkSize}`
  );
  let pageChunkInit = removeExtraWhitespace(
    bzaTxt.text_pages.slice(pageNum, pageNum + chunkSize).join("")
  );

  devLog("initial pageChunk b4 queryGPT retell chunk", pageChunkInit)

  //gpt4 code
  let pageChunk = "";
  let chunkSummary = "";
  const getPageChunkQuery = async () => {
    if (narrator !== "") {
      const pageChunkQuery = await queryGPT(
        retellChunkAsNarratorPrompt(narrator, pageChunk, title, synopsis, rollingSummary),
        {}
      );

      if (pageChunkQuery.gptQueryErr !== undefined) {
        throw new Error(`gpt query error when narrator retelling pageChunk: ${pageChunkQuery.gptQueryErr}`);
      } else {
        console.log("pageChunkQuery.txt", pageChunkQuery.txt);
        return pageChunkQuery.txt;
      }
    } else {
      return pageChunkInit;
    }
  };
  const getChunkSummaryQuery = async (pageChunk) => {
    const chunkSummaryQuery = await queryGPT(
      genChunkSummaryPrompt(title, synopsis, rollingSummary, pageChunkInit),
      {}
    );

    if (chunkSummaryQuery.gptQueryErr !== undefined) {
      throw new Error(`gpt query error when summarigizing pageChunk: ${chunkSummaryQuery.gptQueryErr}`);
    } else {
      return chunkSummaryQuery.txt;
    }
  };

  try {
    const [pageChunkResult, chunkSummaryResult] = await Promise.all([
      getPageChunkQuery(),
      getChunkSummaryQuery()
    ]);
    pageChunk = pageChunkResult;
    chunkSummary = chunkSummaryResult;
  } catch (error) {
    console.error(error.message);
  }

  if (isPrintPage) {
    console.log(
      `Page Chunk`,
      pageChunk
    );
  }
  if (isPrintChunkSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + chunkSize}:`,
      chunkSummary
    );
  }
  console.log(
    `Summary of pages ${pageNum} to ${pageNum +
      chunkSize}:`,
    rollingSummary
  );
  const { quiz, grade } = await runQuiz(pageChunk, readOpts, queryGPT);
  const userInput = getUserInput(bzaTxt, {...readOpts,
                                          sessionTime,
                                          rollingSummary,
                                          pageChunkInit,
                                          pageChunk,
                                          chunkSummary
                                         }, queryGPT);
  switch (userInput.label) {
  case "jump":
    if (userInput.jump < totalPages) {
      return eventLoop(bzaTxt, {
        ...readOpts,
        pageNum: userInput.jump
      }, queryGPT, tStamp);
    } else {
      console.log("jump failed")
    }
    break
  case "exit":
    //TODO cases to handle
    // readOpts
    switch (readOpts.fileType) {
      // pdfs
      case "pdf":
      return `Event Loop End, saving pdf bookmark result: ${insertPDF(
        readOpts.title,
        readOpts.tStamp,
        readOpts.synopsis,
        readOpts.narrator,
        readOpts.pageNum,
        readOpts.chunkSize,
        readOpts.rollingSummary,
        readOpts.isPrintPage,
        readOpts.isPrintChunkSummary,
        readOpts.isPrintRollingSummary,
        readOpts.filePath,
        readOpts.isImage
      )}`
    case "url":
      return "TODO handle url save in event loop, wasn't able to save bookmark to DB"
    case "html":
      return "TODO handle html save in event loop, wasn't able to save bookmark to DB"
    case "plaintxt":
      return "TODO handle plaintxt save in event loop, wasn't able to save bookmark to DB"
      default:
      return "Error: file type not passed into event loop, wasn't able to save bookmark to DB"
    }

    return "successful loop exit"
    break
  default: // do nothing
  }

  // 2. rollingSummary=queryGPT3(synopsis+pageChunkSummary)
  let newRollingSummary = ""
  const rollingSummaryQuery = await queryGPT(
    genRollingSummaryPrompt(title, synopsis, rollingSummary, pageRolling), {}
  )
  if (rollingSummaryQuery.gptQueryErr !== undefined) {
    return `gpt query error when summarizing rollingSummary : ${rollingSummaryQuery.gptQueryErr}`
  } else {
    newRollingSummary = pageRollingQuery.txt
  }

  if (isPrintRollingSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + chunkSize} within context of synopsis:`,
      rollingSummary
    );
  }

  if (pageNum + chunkSize < totalPages) {
    // logSummary.push(rollingSummary);
    return eventLoop(bzaTxt, {
      ...readOpts,
      pageNum: pageNum + chunkSize
    }, queryGPT, tStamp);
  } else {
    // pageNum+1 becuz zero index
    if (pageNum + 1 === totalPages) {
      // save and ex
      console.log(logs);
      // TODO for fun predict summary of sequel

      // 4. record a log of all the summaries and quizzes
      // TODO make subdirectory for ${title}
      // const newBookNameDirectory = "./";
      // fs.access(path, (error) => {
      //   // To check if the given directory
      //   // already exists or not
      //   if (error) {
      //     // If current directory does not exist
      //     // then create it
      //     fs.mkdir(path, (error) => {
      //       if (error) {
      //         console.log(error);
      //       } else {
      //         console.log("New Directory created successfully !!");
      //       }
      //     });
      //   } else {
      //     console.log("Given Directory already exists !!");
      //   }
      // TODO clean up /run/user if using pdf-extract and there are files present
      // fs.writeFileSync(
      //   "./logs/${nowTime}-${title}",
      //   JSON.stringify({
      //     logs,
      //     readOpts
      //   })
      // );
      return "successful loop exit"
    } else {
      // read up to totalPages (but not beyond)
      // 10 pages total, 0 index pageNum = 8 (actually 9), chunkSize = 2
      // pageNum + chunksize = total pages
      // 10 pages total, 0 index pageNum = 8 (actually 9), chunkSize = 3
      // pageNum + chunksize > total pages
      const lastChunkSize = totalPages - pageNum - 1
      return eventLoop(bzaTxt, {
        ...readOpts,
        rollingSummary,
        pageNum: pageNum + lastChunkSize,
        chunkSize: lastChunkSize
      }, queryGPT, tStamp);
    }

  }
}
