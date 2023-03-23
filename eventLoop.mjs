#!/usr/bin/env node
import fs from "fs";
import prompt from "prompt";
import getUserInput from "./getUserInput.mjs";
import runQuiz from "./lib/runQuiz.mjs";
import {genSliceSummaryPrompt, genRollingSummaryPrompt, retellSliceAsNarratorPrompt} from "./lib/genPrompts.mjs";
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
  console.log(
    `totalPages ${totalPages}, pageNum ${readOpts.pageNumber}, sliceSize ${readOpts.sliceSize}`
  );
  devLog("eventLoop arguments", arguments)
  let pageSliceInit = removeExtraWhitespace(
    bzaTxt.slice(pageNum, pageNum + sliceSize).join("")
  );

  devLog("initial pageSlice b4 queryGPT retell slice", pageSliceInit)

  //gpt4 code
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

  if (isPrintPage) {
    console.log(
      `Page Slice`,
      pageSlice
    );
  }
  if (isPrintSliceSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + sliceSize}:`,
      sliceSummary
    );
  }
  console.log(
    `Summary of pages ${pageNum} to ${pageNum +
      sliceSize}:`,
    rollingSummary
  );
  const { quiz, grade } = await runQuiz(pageSlice, readOpts, queryGPT);
  const userInput = getUserInput(bzaTxt, {...readOpts,
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
      }, queryGPT, tStamp);
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
         readOpts.filePath
)}`
    //TODO cases to handle
    // readOpts
    // switch (readOpts.fileType) {
    //   // pdfs
    //   case "pdf":
    //   return `Event Loop End, saving pdf bookmark result: ${insertPDF(
    //     readOpts.title,
    //     readOpts.tStamp,
    //     readOpts.synopsis,
    //     readOpts.narrator,
    //     readOpts.pageNum,
    //     readOpts.sliceSize,
    //     readOpts.rollingSummary,
    //     readOpts.isPrintPage,
    //     readOpts.isPrintSliceSummary,
    //     readOpts.isPrintRollingSummary,
    //     readOpts.filePath,
    //     readOpts.isImage
    //   )}`
    // case "url":
    //   return "TODO handle url save in event loop, wasn't able to save bookmark to DB"
    // case "html":
    //   return "TODO handle html save in event loop, wasn't able to save bookmark to DB"
    // case "plaintxt":
    //   return "TODO handle plaintxt save in event loop, wasn't able to save bookmark to DB"
    //   default:
    //   return "Error: file type not passed into event loop, wasn't able to save bookmark to DB"
    // }

    return "successful loop exit"
    break
  default: // do nothing
  }

  // 2. rollingSummary=queryGPT3(synopsis+pageSliceSummary)
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
      `Summary of pages ${pageNum} to ${pageNum + sliceSize} within context of synopsis:`,
      rollingSummary
    );
  }

  if (pageNum + sliceSize < totalPages) {
    // logSummary.push(rollingSummary);
    return eventLoop(bzaTxt, {
      ...readOpts,
      pageNum: pageNum + sliceSize
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
      }, queryGPT, tStamp);
    }

  }
}
