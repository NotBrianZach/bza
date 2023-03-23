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

import MarkdownIt from 'markdown-it';
const queryGPT = createGPTQuery(process.env.OPENAI_API_KEY);


function loadMD(title, synopsis, tStamp, filePath, pageNum, sliceSize, rollingSummary, narrator, isPrintPage, isPrintSliceSummary, isPrintRollingSummary, articleType, charPageLength) {
  devLog("begin loadMD", arguments)
  console.log(filePath.substring(filePath.length - 2))
  if (filePath.substring(filePath.length - 2) !== "md") {
    console.error("error, not a markdown file, file must end with .md suffix")
    return
  }
  console.log(filePath)
  fs.readFile(filePath,function(err, mdTxt) {
    if (err !== null) {
      console.log(`error ${err} reading from filePath ${filePath}`)
    }
    devLog("fsreadfile arguments", arguments)
    // Initialize the Markdown parser (to save image files that may be base64 embedded in the markdown (which will get in the way of gpt reading the text))
    const md = new MarkdownIt();

    //Parse the Markdown and extract the image URLs
    const imageUrls = [];
    md.renderer.rules.image = (tokens, idx) => {
      const url = tokens[idx].attrGet('src');
      if (url) {
        imageUrls.push(url);
      }
      return '';
    };

    // Render the Markdown to extract image URLs
    md.render(mdTxt.toString());

    // Download and save the images
    const downloadAndSaveImage = async (url, outputPath) => {
      try {
        const response = await axios({
          method: 'get',
          url,
          responseType: 'stream',
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
      } catch (error) {
        console.error('Error downloading image:', error);
      }
    };

    const saveImages = async () => {
      for (const [index, url] of imageUrls.entries()) {
        const extension = path.extname(url);
        const outputPath = `image${index + 1}${extension}`;
        await downloadAndSaveImage(url, outputPath);
        console.log(`Downloaded and saved image?url as ${outputPath}`);
      }
    };

    saveImages();
    function removeImagesFromMarkdown(markdown) {
      // Regular expression to match Markdown base64 image syntax
      const imageRegex = /!\[.*?\]\(.*?\)/g;

      // Replace all image occurrences with an empty string
      const strippedMarkdown = markdown.replace(imageRegex, '');

      return strippedMarkdown;
    }
    const markdownStrippedOfImages = removeImagesFromMarkdown(mdTxt.toString())
    console.log("markdown read completed")

    const insertReturnStatus = insertMD(
      filePath,
      title,
      synopsis,
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

    const finalMarkdownArray = splitStringIntoSubstringsLengthN(markdownStrippedOfImages, sliceSize)

    fork("markdownViewerServer.mjs", ["argument"], { cwd: process.cwd() });
    const eventLoopEndMsg = eventLoop(finalMarkdownArray, {
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
  })
}

program
  .command("load")
  .argument('<filePath>', 'path to pdf')
  // .addArgument(new Argument('[charPerPage]', '').choices([0, 1]))
// TODO add more article types
  .addArgument(new Argument('[articleType]', 'type of article').choices(["book", "arxiv preprint", "research paper", "monograph", "news", "dnd setting"]))
  .argument('[pageNumber]', 'pageNumber to start on, default 0', 0)
  .argument('[sliceSize]', 'how many pages to read at once, default 2 (more=less context window for conversation)', 2)
  .argument('[charPageLength]', 'characters per page default 1800', 1800)
  .argument('[narrator]', 'narrator persona, default none ("")', "")
  // .argument('[isPrintPage]', 'whether to print each page of slice, false=0', 0)
  .addArgument(new Argument('[isPrintPage]', 'whether to print each page, false=0').choices([0, 1]))
  .addArgument(new Argument('[isPrintSliceSummary]', 'whether to print each slice summary, false=0').choices([0, 1]))
  .addArgument(new Argument('[isPrintRollingSummary]', 'whether to print each rolling summary, false=0').choices([0, 1]))
  // .argument('[narrator]', 'narrator persona, default none ("")', "")
  .description("load markdown file, create new bookmark, run eventLoop")
  .action(async function(filePath, articleType, pageNumber, sliceSize, charPageLength, narrator, isPrintPage, isPrintChunSummary, isPrintRollingSummary) {
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
    loadMD(title, tStamp, synopsis,
           filePath, pageNumber, sliceSize, "", narrator, isPrintPage, isPrintSliceSummary, isPrintRollingSummary, articleType, charPageLength
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
    loadMD(mData.title, mData.synopsis, tStamp, mData.filePath, bData.pageNum, bData.sliceSize, bData.rollingSummary, bData.narrator, bData.isPrintPage, bData.isPrintSliceSummary, bData.isPrintRollingSummary, mData.articleType, mData.charPageLength)
  })

program .command("gptDB")
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
