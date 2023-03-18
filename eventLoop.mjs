#!/usr/bin/env node
import fs from "fs";
import prompt from "prompt";
import getUserInput from "./getUserInput.mjs";
import runQuiz from "./lib/runQuiz.mjs";
import {genChunkSummaryPrompt, genRollingSummaryPrompt, retellChunkAsNarratorPrompt} from "./lib/genPrompts.mjs";
import {
  removeExtraWhitespace,
  validateObj
} from "./lib/utils.mjs";
import path from "path";

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
    "totalPages, pageNum, chunkSize",
    totalPages,
    readOpts.pageNumber,
    readOpts.chunkSize
  );
  // TODO run queries that can be in parallel (queryGPT narrator, chunkSummary, rollingSummary) narrator&ChunkSummary both required for user query
  let pageChunkInit = removeExtraWhitespace(
    bzaTxt.text_pages.slice(pageNum, pageNum + chunkSize).join("")
  );
  let pageChunk = ""
  if (narrator !== "") {
    queryGPT(
      pageChunk = await queryGPT(retellChunkAsNarratorPrompt(narrator, pageChunk, title, synopsis, rollingSummary), {})
    )
  } else {
    pageChunk = pageChunkInit
  }
  const chunkSummary = await queryGPT(
    genChunkSummaryPrompt(title, synopsis, rollingSummary, pageChunk), {}
  );

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
  // console.log(
  //   `Summary of pages ${pageNum} to ${pageNum +
  //     chunkSize}:`,
  //   rollingSummary
  // );
  const { quiz, grade } = await runQuiz(pageChunk, readOpts, queryGPT);
  const userInput = getUserInput(bzaTxt, {...readOpts,
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
  case "EX":
    //TODO cases to handle
    // readOpts
    // pdfs
    // plaintxt
    // html
    // url


    return "successful loop exit"
    break
  default: // do nothing
  }

  // 2. rollingSummary=queryGPT3(synopsis+pageChunkSummary)
  const newRollingSummary = queryGPT(genRollingSummaryPrompt(title, synopsis, rollingSummary, excerpt), {});
  if (isPrintRollingSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + chunkSize} within context of synopsis:`,
      rollingSummary
    );
  }

  // console.log(`New Meta Summary:`, synopsis);
  if (pageNum + chunkSize < totalPages) {
    // logSummary.push(rollingSummary);
    return eventLoop(bzaTxt, {
      ...readOpts,
      pageNum: pageNum + chunkSize
    }, queryGPT, tStamp);
  } else {
    if (pageNum + 1 == totalPages) {
      // save and ex
      console.log(logs);
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
        pageNum: pageNum + lastChunkSize
        chunkSize: lastChunkSize
      }, queryGPT, tStamp);
    }

  }
}
