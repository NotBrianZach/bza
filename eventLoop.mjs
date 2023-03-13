#!/usr/bin/env node
import fs from "fs";
import prompt from "prompt";
import pdf_extract from "pdf-extract";
import getUserInput from "./getUserInput.mjs";
import runQuiz from "./lib/runQuiz.mjs";
import {
  removeExtraWhitespace,
  validateObj
} from "./lib/utils.mjs";
import path from "path";

const nowTime = new Date();
export default async function eventLoop(bzaTxt, readOpts, queryGPT) {
  const totalPages = bzaTxt.text_pages.length;
  const {
    pageNum,
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
  const pageChunk = removeExtraWhitespace(
    bzaTxt.text_pages.slice(pageNum, pageNum + chunkSize).join("")
  );
  const chunkSummary = queryGPT(
    genChunkSummaryPrompt(title, synopsis, rollingSummary, pageChunk)
  );

  if (isPrintPage) {
    console.log(
      `Page Chunk`,
      rollingSummary
    );
  }
  if (isPrintChunkSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + chunkSize}:`,
      rollingSummary
    );
  }
  if (isPrintRollingSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + chunkSize}:`,
      rollingSummary
    );
  }
  // console.log(
  //   `Summary of pages ${pageNum} to ${pageNum +
  //     chunkSize}:`,
  //   rollingSummary
  // );
  const { quiz, grade } = await runQuiz(title, synopsis, pageChunk, queryGPT);
  getUserInput(bzaTxt, pageNum, rollingSummary, toggles);

  // 2. rollingSummary=queryGPT3(synopsis+pageChunkSummary)
  const newRollingSummary = queryGPT(genRollingSummaryPrompt(title, synopsis, rollingSummary, excerpt));

  // console.log(`New Meta Summary:`, synopsis);
  if (pageNum + chunkSize < totalPages) {
    // logSummary.push(rollingSummary);
    return eventLoop(bzaTxt, {
      ...readOpts,
      pageNum: pageNum + chunkSize
    });
  } else {
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
    fs.writeFileSync(
      "./logs/${nowTime}-${title}",
      JSON.stringify({
        logs,
        readOpts
      })
    );
    return "successful loop exit"
  }
}

