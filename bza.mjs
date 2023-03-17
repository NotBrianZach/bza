#!/usr/bin/env node

import { program, Option, Argument } from "commander";
import fs from "fs";
import prompt from "prompt";
import { exec, spawn } from "child_process";
import path from "path";
import db from "./lib/dbConnect.mjs";
import eventLoop from "./eventLoop.mjs";

// TODO compute-cosine-similarity
// https://www.npmjs.com/package/compute-cosine-similarity
// var similarity = require( 'compute-cosine-similarity' );
// similarity( x, y[, accessor] )

// could also use https://github.com/mozilla/readability
// There is also an alias to `convert` called `htmlToText`.
import { htmlToText } from "html-to-text";
import { createGPTQuery } from "./lib/createGPTQuery.mjs";
import { loadBookmarks, loadBookmark } from "./lib/dbQueries.mjs";
import { removeExtraWhitespace } from "./lib/utils.mjs";
const queryGPT = createGPTQuery(process.env.OPENAI_API_KEY);
import axios from "axios";
const htmlToTxtOpts = {
  wordwrap: 130
};
function newSessionTime() {
  return yyyymmddhhmmss(new Date)
}


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

program
  .command("loadMark")
  .argument('<bookmarkTitle>', 'title of bookmark to load')
  .argument('[tStamp]', 'tStamp to load from "yyyy-mm dd-hh-mm-ss" (defaults to most recent)')
  .description("load bookmark from databse into event loop")
  .action(async function(bookmarkTitle, tStamp) {
    console.log(bookmarkTitle, tStamp)
    const bookData = loadBookmark(bookmarkTitle)
    console.log("bookmark data", bookData)
    // eventLoop()

  })

program
  .command("gptDB")
  .argument(new Argument('<selectOrUpdate>', 'specify whether', "update").choices(['update', 'select']))
  .argument('<plainRequest>', 'plainRequest')
  .description("ask gpt to create db query for you to either get or update database, print command, then type yes to run or n to cancel")
  .action(async function(args) {
    console.log("TODO")
    const dbSchema = removeExtraWhitespace(fs.readFileSync(path.resolve("./dbSchema.mjs")).toString())
    const sql = await queryGPT(`given follwing sqlite db schema: ${dbSchema}, write a sql that peforms task: ${args.plainRequest}`)
    console.log("sql", sql)
    while (true) {
      const { yesOrNo } = await prompt.get(["yesOrNo"])
      if (yesOrNo === "yes") {
        if (args.selectOrUpdate === "select") {
          console.log(db.prepare(sql).all())
        } else {
        }
        // TODO
      } else {
        console.log("exiting")
        return
      }
    }

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

function loadPDF(title, synopsis, tStamp, isPdfImage) {
    if (isPdfImage) {
      // extract text from pdf with searchable text
      var pdfOptions = {
        type: "text", // extract the actual text in the pdf file
        mode: "layout", // optional, only applies to 'text' type. Available modes are 'layout', 'simple', 'table' or 'lineprinter'. Default is 'layout'
        ocr_flags: ["--psm 1"], // automatically detect page orientation
        enc: "UTF-8", // optional, encoding to use for the text output
        clean: true // try prevent tmp directory /usr/run/$userId$ from overfilling with parsed pdf pages (doesn't seem to work)
      };

      // todo
      //     readingOpts = {
      //       ...readingListTopLevel.defaults,
      //       title,
      //       synopsis,
      //       path: options.path

      var processor = pdf_extract(options.file, pdfOptions, function(err) {
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
    processor.on("complete", function(pdfText) {
      eventLoop(pdfTxt, {
        title,
        synopsis,
        narrator: args.narrator,
        chunkSize: args.chunkSize,
        rollingSummary,
        isPrintPage,
        isPrintChunkSummary,
        isPrintRollingSummary
      }, queryGPT, tStamp);
    });
}

program
  .command("loadPDF")
  .argument('<filePath>', 'path to pdf')
  .argument('[isPDFImage]', 'if pdf is just a scanned image wihout delineated text, default false', "")
  .argument('[pageNumber]', 'pageNumber to start on, default 0', 0)
  .argument('[chunkSize]', 'how many pages to read at once, default 2 (more=less context window for conversation)', 2)
  .argument('[narrator]', 'narrator persona, default none ("")', "")
  // .argument('[isPrintPage]', 'whether to print each page of chunk, false/0', 0)
  .addArgument(new Argument('[isPrintPage]', 'whether to print each page, false=0').choices([0, 1]))
  .addArgument(new Argument('[isPrintChunkSummary]', 'whether to print each chunk summary, false=0').choices([0, 1]))
  .addArgument(new Argument('[isPrintRollingSummary]', 'whether to print each rolling summary, false=0').choices([0, 1]))
  // .argument('[narrator]', 'narrator persona, default none ("")', "")
  .description("load pdf, create a bookmark, run eventLoop")
  .action(async function(filePath, isPDFImage, pageNumber, chunkSize, narrator, ) {
    const tStamp = yyyymmddhhmmss(new Date)
    const {title, synopsis} = await queryUserTitleSynopsis()
    loadPDF(title, tStamp, title, synopsis,
            narrator,
            chunkSize,
            rollingSummary,
            isPrintPage,
            isPrintChunkSummary,
            isPrintRollingSummary,
            filePath,
            isPDFImage
           )
  });

// program
//   .command("loadEpub")
//   .argument('<filepath>', 'path to epub')
//   .argument('[letterPerPage]', 'letters per page, default 1800', 1800)
//   .description("load epub and create a bookmark")
//   .action(() => {
//     console.log("TODO")
//     // console.log(Object.keys(readingList).map((val, tit) => tit));
//     // TODO replace with sequel query
//   });

program
  .command("loadUrl")
  .argument('<urlPath>', 'url to load into bookmars db')
  .argument('[letterPerPage]', 'letters per page, default 1800', 1800)
  .description("load url and create a bookmark")
  .action((args) => {
    console.log("TODO")
    // console.log(Object.keys(readingList).map((val, tit) => tit));
    // TODO replace with sequel query
    axios
      .get(args.urlPath)
      .then(function(response) {
        // handle success
        // console.log("axios response:", response);
        const text = htmlToText(response.body, {
          // selectors: [
          //   { selector: 'a', options: { baseUrl: 'https://example.com' } },
          //   { selector: 'a.button', format: 'skip' }
          // ]
        });
        function sliceString(string, lettersPerPage){
          let text_pages = {};
          let startIndex = 0;
          let counter = 0;
          while (startIndex < string.length){
            let endIndex = startIndex + lettersPerPage;
            let page = string.slice(startIndex, endIndex);
            text_pages[counter] = page;
            counter += 1
            startIndex = endIndex;
          }
          return text_pages;
          }
        // url
        // TODO chunk returned text pdfTxt.text_pages.slice(pageNum, pageNum + chunkSize).join("")
        eventLoop({text_pages}, {
          ...readingOpts
        }, queryGPT, yyyymmddhhmmss(new Date));
      })
      .catch(function(error) {
        // handle error
        console.log(error);
      })
      .finally(function() {
        // always executed
      });
  });

// .option("-C, --character <character>", "character to reply as")
// .option("-t, --type <type>", "pdf, TODO html")
// TODO stick copies of this where appropriate
// if (process.env.OPENAI_API_KEY === undefined) {
//    console.log()
//    process.exit(1);
// }

// .command('loop [destination]')
// .description('Run Event Loop')

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
  //   "-c, --chunkSize <chunkSize>",
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
