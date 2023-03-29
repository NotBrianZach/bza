#!/usr/bin/env node

import { program, Option, Argument } from "commander";
import fs from "fs";
import prompt from "prompt";
import { exec, fork, spawn } from "child_process";
import path from "path";
import _ from "underscore";
import axios from "axios";

// TODO compute-cosine-similarity
// https://www.npmjs.com/package/compute-cosine-similarity
// var similarity = require( 'compute-cosine-similarity' );
// similarity( x, y[, accessor] )

import { removeExtraWhitespace, devLog, newSessionTime } from "./lib/utils.mjs";
import { createGPTQuery } from "./lib/createGPTQuery.mjs";
import db from "./lib/dbConnect.mjs";
import eventLoop from "./eventLoop.mjs";
import { loadBookmarksBy, loadBookmark, insertMD, loadMDTable } from "./lib/dbQueries.mjs";

const queryGPT = createGPTQuery(process.env.OPENAI_API_KEY);

const togglesOptions = ["isPrintPage", "isPrintSliceSummary", "isPrintRollingSummary", "isQuiz"]
function loadMarkdown(title, synopsis, tStamp, filePath, pageNum, sliceSize, rollingSummary, narrator, articleType, charPageLength, toggles) {
  devLog("begin loadMarkdown", arguments)
  devLog(filePath.substring(filePath.length - 2))
  if (filePath.substring(filePath.length - 2) !== "md") {
    console.error("error, not a markdown file, file must end with .md suffix")
    return
  }
  const {
    isPrintPage,
    isPrintRollingSummary,
    isPrintSliceSummary,
    isQuiz
  } = toggles
  devLog(filePath)
  fs.readFile(filePath,function(err, mdTxt) {
    if (err !== null) {
      console.log(`error ${err} reading from filePath ${filePath}`)
    }
    devLog("fsreadfile arguments", arguments)
    const finalMarkdownArray = splitStringIntoSubstringsLengthN(markdownStrippedOfEmbedImages, sliceSize)
    const insertReturnStatus = insertMD(
      filePath,
      title,
      tStamp,
      articleType
      // narrator,
      // pageNum,
      // sliceSize,
      // rollingSummary,
      // isPrintPage,
      // isPrintSliceSummary,
      // isPrintRollingSummary,
    )
    if (insertReturnStatus === undefined) {
      console.log("db insert error markdown read completed")
    } else {
      devLog("insertMD return status", insertReturnStatus)
    }

    function splitStringIntoSubstringsLengthN(str, n) {
      const substrings = [];
      for (let i = 0; i < str.length; i += n) {
        substrings.push(str.substring(i, i + n));
      }
      return substrings;
    }

    const eventLoopEndMsg = eventLoop(finalMarkdownArray, {
      title,
      synopsis,
      narrator,
      pageNum,
      sliceSize,
      rollingSummary,
      isPrintPage,
      isPrintSliceSummary,
      isPrintRollingSummary,
      isQuiz
    }, queryGPT, tStamp);
    console.log(eventLoopEndMsg)
  })
}

function factoryTakeArgs(choicesList) {
  return function (value, previous) {
    if (!choicesList.includes(value)) {
      console.error(`Invalid choice: ${value}. Please select from the available choices: ${choicesList.join(', ')}`);
      process.exit(1);
    }

    if (previous.includes(value)) {
      console.warn(`Duplicate choice: ${value} is already selected.`);
    } else {
      previous.push(value);
    }

    return previous;
  }
}

program
  .command("load")
  .argument('<filePath>', 'path to pdf')
// TODO add more article types
  .addArgument(new Argument('[articleType]', 'type of article').choices(["book", "arxiv preprint", "research paper", "monograph", "news", "dnd setting"]))
  .argument('[pageNumber]', 'pageNumber to start on, default 0', 0)
  .argument('[sliceSize]', 'how many pages to read at once, default 2 (more=less context window for conversation)', 2)
  .argument('[charPageLength]', 'characters per page default 1800', 1800)
  .argument('[narrator]', 'narrator persona, default none ("")', "")
  // .argument('[isPrintPage]', 'whether to print each page of slice, false=0', 0)
  .argument("-t, --toggles [toggles]", 'Select multiple choices from the list', factoryTakeArgs(togglesOptions), [])
  // .addArgument(new Argument('[isPrintPage]', 'whether to print each page, false=0').choices([0, 1]))
  // .addArgument(new Argument('[isPrintSliceSummary]', 'whether to print each slice summary, false=0').choices([0, 1]))
  // .addArgument(new Argument('[isPrintRollingSummary]', 'whether to print each rolling summary, false=0').choices([0, 1]))
  // .argument('[narrator]', 'narrator persona, default none ("")', "")
  .description("load markdown file, create new bookmark, run eventLoop")
  .action(async function(filePath, articleType, pageNumber, sliceSize, charPageLength, narrator, toggles) {
    const tStamp = newSessionTime()
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
    const {title, synopsis} = await queryUserTitleSynopsis()
    loadMarkdown(title, tStamp, synopsis,
           filePath, pageNumber, sliceSize, "", narrator, articleType, charPageLength, toggles
           )
  });

program
  .command("print")
  .addArgument(new Argument('[orderBy]', 'order By, default tStamp', "tStamp").choices([
    "tStamp",
    "bTitle",
    "synopsis",
    "pageNum",
    "filePath",
    "narrator"
  ]))
  .argument("[numToPrint]", "max # of bookmarks to print, default 10000", 10000)
// filter by
  .description("print bookmarks, (can use fzf to filter/fuzzy search e.g. bza print | fzf)")
  .action((orderBy, numToPrint) => {
    // console.log(numToPrint)
    console.log(
      loadBookmarksBy(orderBy, numToPrint)
    );
  });

program
  .command("resume")
  .argument('[bookmarkTitle]', 'title of bookmark to load (defaults to most recent)')
  .argument('[tStamp]', 'tStamp to load from "yyyy-mm dd-hh-mm-ss" (defaults to most recent)', newSessionTime())
  .description("load bookmark from database into event loop, creates a new bookmark")
  .action(async function(bookmarkTitle, tStamp) {
    devLog(bookmarkTitle, tStamp)
    const bData = loadBookmark(bookmarkTitle)
    devLog("bookmark data", bData)
    const mData = loadMDTable(bData.filePath)
    devLog("markdown data", mData)
    const resumeToggles = []
    // create trueKeysList from object with bool values
    for (const [key, value] of Object.entries({ isPrintPage: bData.isPrintPage, isprintSliceSummary: bData.isPrintSliceSummary, isPrintRolingSummary: bData.isPrintRollingSummary, isQuiz: bData.isQuiz })) {
      if (value) {
        resumeToggles.push(key);
      }
}
    loadMarkdown(mData.title, bData.synopsis, tStamp, mData.filePath, bData.pageNum, bData.sliceSize, bData.rollingSummary, bData.narrator, mData.articleType, mData.charPageLength, resumeToggles)
  })

program
  .command("gptDB")
  .addArgument(new Argument('<updateOrSelect>', 'specify whether', "update").choices(['update', 'select']))
  .argument('<plainRequest>', 'plainRequest')
  .description("for fun, ask gpt, given db schema as pre-prompt, to create db query to either select from or update database, print command, then type yes to run or n to cancel (might not be executable)")
  .action(async function(args) {
    const dbSchema = removeExtraWhitespace(fs.readFileSync(path.resolve("./dbSchema.mjs")).toString())
    const sql = await queryGPT(`given [[sqlite db schema]] write a sql statement or statements that peforms ((task)) [[${dbSchema}]] ((${args.plainRequest}))`)
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
  .version("0.3.0")
// .configureHelp({
//   helpWidth: 50
//   // subcommandTerm: (cmd) => cmd.name() // Just show the name, instead of short usage.
// })
  .action((options) => {
    program.help()
  });

program.parse(process.argv);
