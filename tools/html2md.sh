#!/usr/bin/env node

// For Node.js
var TurndownService = require("@joplin/turndown");
var turndownPluginGfm = require("@joplin/turndown-plugin-gfm");

var gfm = turndownPluginGfm.gfm;
var turndownService = new TurndownService();
turndownService.use(gfm);

// var markdown = turndownService.turndown("<strike>Hello world!</strike>");
const fs = require("fs");
const path = require("path");
const turndownService = require("turndown")();

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

async function convertHtmlToMarkdown(inputFilePath) {
  console.log("inputFilePath", inputFilePath);

  try {
    const inputHtmlBuffer = await readFile(inputFilePath);
    const inputFileName = getFilenameWithoutSuffix(inputFilePath);
    const outputDir = path.join(
      path.dirname(inputFilePath),
      inputFileName + "d"
    );

    const inputMarkdown = turndownService.turndown(inputHtmlBuffer.toString());
    const cleanedMarkdown = await removeBase64Images(inputMarkdown, outputDir);

    await writeFile(inputFilePath, cleanedMarkdown);
  } catch (err) {
    throw new Error(err);
  }
}

convertHTMLToMarkdown(process.env.args[3]);
