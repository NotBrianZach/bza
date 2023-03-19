#!/usr/bin/env node

import { program, Option, Argument } from "commander";
import fs from "fs";
import prompt from "prompt";
import { exec, spawn } from "child_process";
import path from "path";
import _ from "underscore";
// import pdf_extract from "pdf-extract";
// import { htmlToText } from "html-to-text";
import axios from "axios";

// TODO compute-cosine-similarity
// https://www.npmjs.com/package/compute-cosine-similarity
// var similarity = require( 'compute-cosine-similarity' );
// similarity( x, y[, accessor] )

// could also use https://github.com/mozilla/readability
// There is also an alias to `convert` called `htmlToText`.
import { removeExtraWhitespace, devLog, newSessionTime } from "./lib/utils.mjs";
import { createGPTQuery } from "./lib/createGPTQuery.mjs";
import db from "./lib/dbConnect.mjs";
import eventLoop from "./eventLoop.mjs";
// import { loadBookmarks, loadBookmark, loadPDFTable, insertPDF } from "./lib/dbQueries.mjs";
import { loadBookmarks, loadBookmark, loadPDFTable, insertPDF } from "./lib/dbQueries.mjs";
const queryGPT = createGPTQuery(process.env.OPENAI_API_KEY);

const htmlToTxtOpts = {
  wordwrap: 130
};

program
  .command("printBookmarks")
  .argument("[numToPrint]", "# of bookmarks to print, default 10, order by most recent", 10)
  .action((numToPrint) => {
    // console.log(Object.keys(readingList).map((val, tit) => tit));
    // TODO replace with sequel query
    console.log(numToPrint)
    console.log(
      loadBookmarks(numToPrint)
    );
      // Object.keys(readingList).map(title => ({
      //   title,
      //   pageNumber: readingList[title].pageNumber
      // }))
  });



async function queryUserTitleSynopsis() {
  var titlePromptSchema = {
    properties: {
      title: {
        message: "Enter a title (can be made up)",
        required: true
      }
    }
  };
  const { title } = await prompt.get(titlePromptSchema);

  var synopsisPromptSchema = {
    properties: {
      synopsis: {
        message: "Enter a summary/synopsis",
        required: true
      }
    }
  };
  const { synopsis } = await prompt.get(synopsisPromptSchema);

  return { title, synopsis }
}

// function loadPDF(title, synopsis, tStamp, filePath, isImage, pageNum, sliceSize, rollingSummary, narrator, isPrintPage, isPrintSliceSummary, isPrintRollingSummary) {
// console.log("begin loadPDF", arguments)
//     let processor
//     if (!isImage) {
//       // extract text from pdf with searchable text
//       var pdfOptions = {
//         type: "text", // extract the actual text in the pdf file
//         mode: "layout", // optional, only applies to 'text' type. Available modes are 'layout', 'simple', 'table' or 'lineprinter'. Default is 'layout'
//         ocr_flags: ["--psm 1"], // automatically detect page orientation
//         enc: "UTF-8", // optional, encoding to use for the text output
//         clean: true // try prevent tmp directory /usr/run/$userId$ from overfilling with parsed pdf pages (doesn't seem to work)
//       };

//       processor = pdf_extract(path.resolve(filePath), pdfOptions, function(err) {
//         console.log("begin loadPDF extract")
//         // TODO might not spawn background process like we want (interrupts user input)
//         // spawn("mupdf", ["-Y", 2, args.filepath]);
//         if (err) {
//           console.error("failed to extract pdf, err:", err);
//         }
//       });
//     } else {
//       // extract text from scanned image pdf without searchable text
//       // console.log("Usage: node thisfile.js the/path/tothe.pdf")
//       // const absolute_path_to_pdf = path.resolve(process.argv[2])
//       // if (absolute_path_to_pdf.includes(" ")) throw new Error("will fail for paths w spaces like "+absolute_path_to_pdf)
//       // const options = {
//       //   type: 'ocr', // perform ocr to get the text within the scanned image
//       //   ocr_flags: ['--psm 1'], // automatically detect page orientation
//       // }
//       // const processor = pdf_extract(absolute_path_to_pdf, options, ()=>console.log("Starting…"))
//       // processor.on('complete', data => callback(null, data))
//       // processor.on('error', callback)
//       // function callback (error, data) { error ? console.error(error) : console.log(data.text_pages[0]) }
//     }
//     processor.on("complete", function(pdfTxt) {
//       console.log("begin loadPDF extract complete")
//       console.log("pdf load completed, db insert error on undefined: ", insertPDF(
//         title,
//         tStamp,
//         synopsis,
//         narrator,
//         pageNum,
//         sliceSize,
//         rollingSummary,
//         isPrintPage,
//         isPrintSliceSummary,
//         isPrintRollingSummary,
//         filePath,
//         isImage
//       ))
//       const eventLoopEndMsg = eventLoop(pdfTxt, {
//         fileType: "pdf",
//         title,
//         synopsis,
//         narrator,
//         pageNum,
//         sliceSize,
//         rollingSummary,
//         isPrintPage,
//         isPrintSliceSummary,
//         isPrintRollingSummary
//       }, queryGPT, tStamp);
//       console.log(eventLoopEndMsg)
//     });
// }

// program
//   .command("loadPDF")
//   .argument('<filePath>', 'path to pdf')
//   .addArgument(new Argument('[isPDFImage]', 'if pdf is just a scanned image wihout delineated text').choices([0, 1]))
//   .argument('[pageNumber]', 'pageNumber to start on, default 0', 0)
//   .argument('[sliceSize]', 'how many pages to read at once, default 2 (more=less context window for conversation)', 2)
//   .argument('[narrator]', 'narrator persona, default none ("")', "")
//   // .argument('[isPrintPage]', 'whether to print each page of slice, false=0', 0)
//   .addArgument(new Argument('[isPrintPage]', 'whether to print each page, false=0').choices([0, 1]))
//   .addArgument(new Argument('[isPrintSliceSummary]', 'whether to print each slice summary, false=0').choices([0, 1]))
//   .addArgument(new Argument('[isPrintRollingSummary]', 'whether to print each rolling summary, false=0').choices([0, 1]))
//   // .argument('[narrator]', 'narrator persona, default none ("")', "")
//   .description("load pdf, create new bookmark, run eventLoop")
//   .action(async function(filePath, isPDFImage, pageNumber, sliceSize, narrator, isPrintPage, isPrintChunSummary, isPrintRollingSummary) {
//     const tStamp = newSessionTime()
//     const {title, synopsis} = await queryUserTitleSynopsis()
//     loadPDF(title, tStamp, synopsis,
//             filePath, isPDFImage, pageNumber, sliceSize, "", narrator, isPrintPage, isPrintSliceSummary, isPrintRollingSummary
//            )
//   });

function load(title, synopsis, tStamp, filePath, isImage, pageNum, sliceSize, rollingSummary, narrator, isPrintPage, isPrintSliceSummary, isPrintRollingSummary) {
// console.log("begin loadMD", arguments)
    let processor
    if (!isImage) {
      // extract text from pdf with searchable text
      var pdfOptions = {
        type: "text", // extract the actual text in the pdf file
        mode: "layout", // optional, only applies to 'text' type. Available modes are 'layout', 'simple', 'table' or 'lineprinter'. Default is 'layout'
        ocr_flags: ["--psm 1"], // automatically detect page orientation
        enc: "UTF-8", // optional, encoding to use for the text output
        clean: true // try prevent tmp directory /usr/run/$userId$ from overfilling with parsed pdf pages (doesn't seem to work)
      };

      processor = pdf_extract(path.resolve(filePath), pdfOptions, function(err) {
        console.log("begin loadPDF extract")
        // TODO might not spawn background process like we want (interrupts user input)
        // spawn("mupdf", ["-Y", 2, args.filepath]);
        if (err) {
          console.error("failed to extract pdf, err:", err);
        }
      });
    } else {
      // extract text from scanned image pdf without searchable text
      // console.log("Usage: node thisfile.js the/path/tothe.pdf")
      // const absolute_path_to_pdf = path.resolve(process.argv[2])
      // if (absolute_path_to_pdf.includes(" ")) throw new Error("will fail for paths w spaces like "+absolute_path_to_pdf)
      // const options = {
      //   type: 'ocr', // perform ocr to get the text within the scanned image
      //   ocr_flags: ['--psm 1'], // automatically detect page orientation
      // }
      // const processor = pdf_extract(absolute_path_to_pdf, options, ()=>console.log("Starting…"))
      // processor.on('complete', data => callback(null, data))
      // processor.on('error', callback)
      // function callback (error, data) { error ? console.error(error) : console.log(data.text_pages[0]) }
    }
    processor.on("complete", function(pdfTxt) {
      console.log("begin loadPDF extract complete")
      console.log("pdf load completed, db insert error on undefined: ", insertPDF(
        tStamp,
        synopsis,
        narrator,
        pageNum,
        sliceSize,
        rollingSummary,
        isPrintPage,
        isPrintSliceSummary,
        isPrintRollingSummary,
        filePath,
        isImage
      ))
      const eventLoopEndMsg = eventLoop(pdfTxt, {
        title,
        synopsis,
        narrator,
        pageNum,
        sliceSize,
        rollingSummary,
        isPrintPage,
        isPrintSliceSummary,
        isPrintRollingSummary
      }, queryGPT, tStamp);
      console.log(eventLoopEndMsg)
    });
}

program
  .command("loadPDF")
  .argument('<filePath>', 'path to pdf')
  .addArgument(new Argument('[isPDFImage]', 'if pdf is just a scanned image wihout delineated text').choices([0, 1]))
  .argument('[pageNumber]', 'pageNumber to start on, default 0', 0)
  .argument('[sliceSize]', 'how many pages to read at once, default 2 (more=less context window for conversation)', 2)
  .argument('[narrator]', 'narrator persona, default none ("")', "")
  // .argument('[isPrintPage]', 'whether to print each page of slice, false=0', 0)
  .addArgument(new Argument('[isPrintPage]', 'whether to print each page, false=0').choices([0, 1]))
  .addArgument(new Argument('[isPrintSliceSummary]', 'whether to print each slice summary, false=0').choices([0, 1]))
  .addArgument(new Argument('[isPrintRollingSummary]', 'whether to print each rolling summary, false=0').choices([0, 1]))
  // .argument('[narrator]', 'narrator persona, default none ("")', "")
  .description("load pdf, create new bookmark, run eventLoop")
  .action(async function(filePath, isPDFImage, pageNumber, sliceSize, narrator, isPrintPage, isPrintChunSummary, isPrintRollingSummary) {
    const tStamp = newSessionTime()
    const {title, synopsis} = await queryUserTitleSynopsis()
    loadPDF(title, tStamp, synopsis,
            filePath, isPDFImage, pageNumber, sliceSize, "", narrator, isPrintPage, isPrintSliceSummary, isPrintRollingSummary
           )
  });


program
  .command("loadMark")
  .argument('<bookmarkTitle>', 'title of bookmark to load')
  .argument('[tStamp]', 'tStamp to load from "yyyy-mm dd-hh-mm-ss" (defaults to most recent)', newSessionTime())
  .description("load bookmark from databse into event loop")
  .action(async function(bookmarkTitle, tStamp) {
    devLog(bookmarkTitle, tStamp)
    const mData = loadBookmark(bookmarkTitle)
    devLog("bookmark data", mData)
    if (mData.fileType === "pdf") {
      const pData = loadPDFTable(bookmarkTitle)
      if (pData === undefined) {
        console.error("failed to load pdf data from db")
      } else {
        loadPDF(mData.title, mData.synopsis, tStamp, pData.filePath, pData.isImage, mData.pageNum, mData.sliceSize, mData.rollingSummary, mData.narrator, mData.isPrintPage, mData.isPrintSliceSummary, mData.isPrintRollingSummary)
      }
    }
    /* TODO
    if (mData.fileType === "url") {
      // loadURL(mData.title, mData.synopsis, mData.tStamp, mData.filePath, mData.isImage, mData.pageNumber, mData.sliceSize, mData.narrator, mData.isPrintPage, mData.isPrintChunSummary, mData.isPrintRollingSummary)
    }
    if (mData.fileType === "html") {
    }
    if (mData.fileType === "plaintxt") {
    }
    if (mData.fileType === "epub") {
    }
    TODO */
    // eventLoop()

    // bTitle: 'Frankenstein',
    // tStamp: '2023-03-16 18:13:49',
    // title: 'Frankenstein',
    // synopsis: 'A scientist, Victor Von Frankenstein creates life by infusing corpses with lightning. His Misshapen creature seeks the affection of his father and failing that, the creation of a bride, but Frankenstein refuses leading to a climactic chase across the world as the creature rebels against his creator.',
    // pageNum: 0,
    // fileType: 'pdf',
    // isQuiz: 1,
    // isPrintSliceSummary: 1,
    // sliceSize: 2,
    // maxTokens: 2,
    // narrator: 'Mr. T'

    // _.omit(bookData, "fileType", tStamp, maxTokens)

    // pageNum,
    // narrator,
    // sliceSize,
    // synopsis,
    // rollingSummary,
    // isPrintPage,
    // isPrintSliceSummary,
    // isPrintRollingSummary,
    // title

  })

program .command("gptDB")
  .addArgument(new Argument('<updateOrSelect>', 'specify whether', "update").choices(['update', 'select']))
  .argument('<plainRequest>', 'plainRequest')
  .description("ask gpt to create db query for you to either get or update database, print command, then type yes to run or n to cancel")
  .action(async function(args) {
    console.log("TODO")
    const dbSchema = removeExtraWhitespace(fs.readFileSync(path.resolve("./dbSchema.mjs")).toString())
    const sql = await queryGPT(`given follwing sqlite db schema: ${dbSchema}, write a sql that peforms task: ${args.plainRequest}`)
    console.log("gpt proposed sql", sql)
    while (true) {
      const { yesOrNo } = await prompt.get(["yesOrNo"])
      if (yesOrNo === "yes") {
        if (args.updateOrSelect === "select") {
          console.log("select results", db.prepare(sql).all())
        } else {
          console.log("update return codes", db.prepare(sql).run())
        }
      } else {
        console.log("exiting")
        return
      }
    }
  });

program
  .version("0.1.0")
  // .addOption(
  //   new Option(
  //     "-b, --bookmarkName <bookmarkName>",
  //     'look up "bookmark" name (usually title) in bookmarks&load file path from there, in case of conflict, update bookmark entry with command line param values'
  //   )
  // )
  // // .option("-O, --openAIAPIKey <openAIAPIKey>", "api key")// .env("openAIAPIKey")
  // .option("-n, --narrator <narrator>", "character to narrate as")
  // .option("-p, --page <page>", "current page number (default 0)")
  // .option(
  //   "-c, --sliceSize <sliceSize>",
  //   "number of pages to read at once (default 2)"
  // )
  .action((options) => {
    program.help()
    // console.log(options);
    // if (!options.file && typeof options.bookName !== "string") {
    //   console.error(
    //     "No file or bookName specified e.g. -f ./Frankenstein.pdf, -b Frankenstein"
    //   );
    //   process.exit(1);
    // }

    // const logs = {};

  });

program.parse(process.argv);
