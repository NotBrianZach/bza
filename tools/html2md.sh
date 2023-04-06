#!/usr/bin/env node

// For Node.js
var TurndownService = require("@joplin/turndown");
var turndownPluginGfm = require("@joplin/turndown-plugin-gfm");
const { JSDOM } = require('jsdom');


const gfm = turndownPluginGfm.gfm;
const turndownService = new TurndownService();
turndownService.use(gfm);

// var markdown = turndownService.turndown("<strike>Hello world!</strike>");
const fs = require("fs");
const path = require("path");

// Function to remove CSS and JavaScript from the HTML
function removeCSSAndJS(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const styles = document.querySelectorAll('style, link[rel="stylesheet"], script');

    styles.forEach((style) => {
                       style.remove();
                   });

    return document.documentElement.outerHTML;
}


async function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

function writeFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, err => {
      if (err) reject(err);
      resolve();
    });
  });
}

function mkdir(dirPath) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirPath, { recursive: true }, err => {
      if (err && err.code !== "EEXIST") reject(err);
      resolve();
    });
  });
}

function getFilenameWithoutSuffix(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

async function removeBase64Images(inputMarkdown, outputDir) {
  const MAX_REPEATS = 3;
  const base64ImageRegex = /!\[.*?\]\s*\(data:image\/.*?;base64,.*?\)/g;
  let base64Images = inputMarkdown.match(base64ImageRegex) || [];

  let imageCounter = {};
  let cleanedMarkdown = inputMarkdown;
  base64Images.forEach(image => {
    imageCounter[image] = (imageCounter[image] || 0) + 1;
  });

  for (const [image, count] of Object.entries(imageCounter)) {
    if (count > MAX_REPEATS) {
      cleanedMarkdown = cleanedMarkdown.split(image).join("");
    }
  }

  const imageDirPath = `${outputDir}/imagesD`;
  await mkdir(imageDirPath);

  let savedImageCounter = 0;
  base64Images = cleanedMarkdown.match(base64ImageRegex) || [];
  for (const image of base64Images) {
    const base64DataRegex = /data:image\/(.*?);base64,(.*)/;
    const matches = image.match(base64DataRegex);

    const extension = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    const fileName = `${imageDirPath}/image-${savedImageCounter}.${extension}`;
    await writeFile(fileName, buffer);
    console.log(`Image saved as ${fileName}`);

    cleanedMarkdown = cleanedMarkdown
      .split(image)
      .join(
        `![image-${savedImageCounter}](./imagesD/image-${savedImageCounter}.${extension})`
      );

    savedImageCounter++;
  }

  return cleanedMarkdown;
}

async function convertHTMLToMarkdown(inputFilePath) {
  console.log("inputFilePath", inputFilePath);

  try {
    const inputHtmlBuffer = await readFile(inputFilePath);
    const inputFileName = getFilenameWithoutSuffix(inputFilePath);
    const outputDir = path.join(
      path.dirname(path.dirname(inputFilePath)),
      inputFileName + "d"
    );

    // Remove CSS and JavaScript from the HTML content
    const htmlWithoutCSSAndJS = removeCSSAndJS(inputHtmlBuffer.toString());
    const inputMarkdown = turndownService.turndown(htmlWithoutCSSAndJS);
    const cleanedMarkdown = await removeBase64Images(inputMarkdown, outputDir);

    await writeFile(`${outputDir}/${inputFileName}.md`, cleanedMarkdown);
  } catch (err) {
    throw new Error(err);
  }
}

if (process.argv.length === 3) {
       console.log("process.argv", process.argv)
       convertHTMLToMarkdown(process.argv[2]);
 } else {
       console.error("html2md run with wrong number of arguments (wants one file path)")
   }
