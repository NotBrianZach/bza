#!/usr/bin/env node

import { program, Option } from "commander";
import fs from "fs";
import prompt from "prompt";
import { exec, spawn } from "child_process";
import path from "path";
import readingListTopLevel from "./readingList.mjs";
const { readingList, rdListDefaults } = readingListTopLevel;
import eventLoop from "./eventLoop.mjs";
// could also use https://github.com/mozilla/readability
// There is also an alias to `convert` called `htmlToText`.
import { htmlToText } from "html-to-text";
import { createGPTQuery } from "./lib/createGPTQuery.mjs";
const queryGPT = createGPTQuery(process.env.OPENAI_API_KEY);

import Database from "better-sqlite3";

import axios from "axios";
const htmlToTxtOpts = {
  wordwrap: 130
};

program
  .command("printBookmarks")
  // .description("print bookmarks")
  .action(() => {
    // console.log(Object.keys(readingList).map((val, tit) => tit));
    // TODO replace with sequel query
    console.log(
      Object.keys(readingList).map(title => ({
        title,
        pageNumber: readingList[title].pageNumber
      }))
    );
  });

program
  .command("initDB")
  .description('initialize "bookmark" database idempotently')
  .action(() => {
    // console.log(Object.keys(readingList).map((val, tit) => tit));
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
  .option(
    "-f, --file <file>",
    "Path to file to read from (if epub, must be utf8)"
  )
  // .command('loop <source> [destination]')
  // .description('Run Event Loop')
  .addOption(
    new Option("-w, --webUrl <webUrl>", "URL to parse text from").conflicts([
      "file",
      "isPDFImage"
    ])
  )
  .addOption(
    new Option(
      "-b, --bookName <bookName>",
      'look up "book" name in readingList&load file path from there, in case of conflict, overwrite readingList.mjs entry with command line params'
    )
  )
  // .option("-O, --openAIAPIKey <openAIAPIKey>", "api key")// .env("openAIAPIKey")
  .option("-n, --narrator <narrator>", "character to narrate as")
  .option("-p, --page <page>", "current page number (default 0)")
  .option(
    "-c, --chunkSize <chunkSize>",
    "number of pages to read at once (default 2)"
  )
  .option(
    "-I, --isPDFImage <isPDFImage>",
    "if pdf is a scanned image w/no searchable text"
  )
  .action((args, options) => {
    console.log(options);
    if (!options.file && typeof options.bookName !== "string") {
      console.error(
        "No file or bookName specified e.g. -f ./Frankenstein.pdf, -b Frankenstein"
      );
      process.exit(1);
    }

    const logs = {};

    const readingListBook = readingList[options.bookName];
    console.log("readingListBook", readingListBook);
    const existsBookNameInReadingList = readingListBook !== undefined;
    let currentPageNumber = options.page === undefined ? 0 : options.page;
    let chunkSize = options.chunkSize === undefined ? 2 : options.chunkSize;
    let readingOpts = {};
    let fileType = "";
    if (existsBookNameInReadingList) {
      readingOpts = {
        ...readingListBook
      };
    } else {
      var titlePromptSchema = {
        properties: {
          title: {
            message: "Enter a title (can be made up)",
            required: true
          }
        }
      };
      const { title } = prompt.get(titlePromptSchema);

      var synopsisPromptSchema = {
        properties: {
          synopsis: {
            message: "Enter a summary/synopsis",
            required: true
          }
        }
      };
      const { synopsis } = prompt.get(synopsisPromptSchema);

      if (!options.file === undefined) {
        readingOpts = {
          ...readingListTopLevel.defaults,
          title,
          synopsis,
          path: options.path
        };
        if (options.file.includes("pdf")) {
          fileType = "pdf";
        }
        if (options.file.includes(".html")) {
          fileType = "html";
        }
        if (options.file.includes(".epub")) {
          fileType = "epub";
        }
      }
      if (options.webUrl !== undefined) {
        readingOpts = {
          ...readingListTopLevel.defaults,
          title,
          synopsis,
          url: options.webUrl
        };
      }
    }

    // const { convert } = require('html-to-text');

    // const html = '<a href="/page.html">Page</a><a href="!#" class="button">Action</a>';
    // const text = convert(html, {
    //   selectors: [
    //     { selector: 'a', options: { baseUrl: 'https://example.com' } },
    //     { selector: 'a.button', format: 'skip' }
    //   ]
    // });
    // exec('"/path/to/test file/test.sh" arg1 arg2');
    // // Double quotes are used so that the space in the path is not interpreted as
    // // a delimiter of multiple arguments
    // # if (!options.file) {
    // #   console.error("No file specified e.g. ./.pdf");
    // #   process.exit(1);
    // # }

    // if (options.length() === 0) {
    //      console.log("no parameters, running default ./book2quiz.sh -f ./Frankenstein.pdf")
    // }
    // console.log();
    switch (readingOpts.fileType) {
      case "pdf":
        if (!readingOpts.isPdfImage || readingOpts.isPdfImage === undefined) {
          // extract text from pdf with searchable text
          var pdfOptions = {
            type: "text", // extract the actual text in the pdf file
            mode: "layout", // optional, only applies to 'text' type. Available modes are 'layout', 'simple', 'table' or 'lineprinter'. Default is 'layout'
            ocr_flags: ["--psm 1"], // automatically detect page orientation
            enc: "UTF-8", // optional, encoding to use for the text output
            clean: true // try prevent tmp directory /usr/run/$userId$ from overfilling with parsed pdf pages (doesn't seem to work)
          };

          var processor = pdf_extract(options.file, pdfOptions, function(err) {
            // TODO might not spawn background process like we want (interrupts user input)
            spawn("mupdf", ["-Y", 2, "./Frankenstein.pdf"]);
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
        processor.on("complete", async function(pdfText) {
          eventLoop(pdfTxt, readingOpts, queryGPT);
        });
        break;
      case "url":
        // const text = convert(html, htmlToTxtOpts);
        axios
          .get(options.webURL)
          .then(function(response) {
            // handle success
            console.log("axios response:", response);
            const text = htmlToText(response.body, {
              // selectors: [
              //   { selector: 'a', options: { baseUrl: 'https://example.com' } },
              //   { selector: 'a.button', format: 'skip' }
              // ]
            });
            // TODO chunk returned text pdfTxt.text_pages.slice(pageNum, pageNum + chunkSize).join("")
            eventLoop(text, {
              ...readingOpts
            }, queryGPT);
          })
          .catch(function(error) {
            // handle error
            console.log(error);
          })
          .finally(function() {
            // always executed
          });
        // console.log(text); // Hello World
        break;
      case "epub":
        break;

      default:
        console.error("no filetype or url specified or inferrable");
    }
  });

import Database from "better-sqlite3";
const db = new Database(process.env.DB_PATH, {
  // fileMustExist: true,
  timeout: 5000, // 5 seconds
  verbose: sqlstatement => console.log(`sqlite3 trace ${sqlstatement}`)
});
db.pragma("journal_mode = WAL");

// "CREATE TABLE IF NOT EXISTS shopDetails (optimalNumDogs INTEGER not null default 17, shopPassword TEXT not null default 'playingBoxesYellow', homeDir TEXT not null default '/home/zach/poinkare', woofsURL TEXT not null default 'woofspetsalon.com')"
const stmt = db.prepare(
  "create table if not exists msgLog (phoneNum TEXT not null default, msg TEXT not null default, timestamp TEXT)"
);

stmt.run();

module.exports = db;

program.parse(process.argv);
