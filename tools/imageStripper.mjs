#!/usr/bin/env node

import MarkdownIt from "markdown-it";
import fs from "fs";

console.log("imageStripper");
function removeRepeatingBase64ImagesFromMarkdownString(markdownContent) {
  console.log("removeRepeatingBase64ImagesFromMarkdownString");
  const MAX_REPEATS = 3; // Define the maximum number of times a base64 image is allowed to repeat
  const md = new MarkdownIt();

  const base64ImageRegex = /!\[.*?\]\s*\(data:image\/.*?;base64,.*?\)/g;
  const base64Images = markdownContent.match(base64ImageRegex) || [];

  const imageCounter = {};

  // Count occurrences of each image
  base64Images.forEach(image => {
    imageCounter[image] = (imageCounter[image] || 0) + 1;
  });

  let cleanedMarkdown = markdownContent;
  console.log("base64 images", base64Images);

  // Remove images that repeat too often
  for (const [image, count] of Object.entries(imageCounter)) {
    if (count > MAX_REPEATS) {
      cleanedMarkdown = cleanedMarkdown.split(image).join("");
    }
  }
  return cleanedMarkdown;
}

function getFilenameWithoutSuffix(filePath) {
  // Extract the filename from the file path
  const fileName = filePath.split("/").pop();
  // Remove the suffix from the filename
  const fileNameWithoutSuffix = fileName
    .split(".")
    .slice(0, -1)
    .join(".");
  return fileNameWithoutSuffix;
}

function stripMarkdownOfImages(inputFilePath) {
  console.log("inputFilePath", inputFilePath);
  fs.readFile(inputFilePath, (err, inputMarkdownBuffer) => {
    // console.log(inputMarkdownBuffer, other);
    if (err !== null) throw new Error(err);
    // Initialize the Markdown parser (to save image files that may be base64 embedded in the markdown (which will get in the way of gpt reading the text))
    const md = new MarkdownIt();
    const inputFileName = getFilenameWithoutSuffix(inputFilePath);

    const inputFilePathComponenetList = inputFilePath.split("/");
    inputFilePathComponenetList.pop();
    const outputDir =
      inputFilePathComponenetList.join("/") + inputFileName + "d";
    const inputMarkdown = inputMarkdownBuffer.toString();
    // strip all images that repeat 3 or more times
    const mdMinus3OrMoreRepeatingBase64Images = removeRepeatingBase64ImagesFromMarkdownString(
      inputMarkdown
    );

    const tokens = md.parse(mdMinus3OrMoreRepeatingBase64Images, {});

    // Parse the markdown and find the images (percollate will embed all images as base64 data into the markdown)
    const imageTokens = tokens.filter(
      token =>
        token.type === "inline" &&
        token.children.some(child => child.type === "image")
    );
    if (imageTokens.length > 0) {
      const imageDirPath = `${outputDir}imagesD`;
      fs.mkdir(imageDirPath, { recursive: true }, error => {
        if (error) {
          console.error("Error creating directory to save images:", error);
          return;
        } else {
          console.log(
            "Directory created to store markdown embedded images:",
            imageDirPath
          );
          let imageCounter = 1;
          imageTokens.forEach(token => {
            const imageToken = token.children.find(
              child => child.type === "image"
            );
            const imageData = imageToken.attrGet("src");
            const dataUrlRegEx = /^data:image\/([a-zA-Z]+);base64,/;
            const match = dataUrlRegEx.exec(imageData);
            if (match) {
              const extension = match[1];
              const base64Data = imageData.replace(dataUrlRegEx, "");
              const buffer = Buffer.from(base64Data, "base64");

              // Save the image to a file
              const fileName = `${imageDirPath}/image-${imageCounter}.${extension}`;
              fs.writeFileSync(fileName, buffer);
              console.log(`Image saved as ${fileName}`);

              // Update the image src attribute in the token
              imageToken.attrSet("src", fileName);
              imageCounter++;
            }
          });
        }
      });
    }
    // isPrintPage, isPrintSliceSummary, isPrintRollingSummary,

    // Render the updated markdown
    const markdownStrippedOfEmbedImages = md.renderer.render(
      tokens,
      md.options,
      {}
    );

    fs.writeFileSync(inputFilePath, markdownStrippedOfEmbedImages);
  });
}

if (process.argv.length === 3) {
  // Read from command-line argument
  stripMarkdownOfImages(process.argv[2]);
} else {
  console.log(process.argv);
  throw new Error(
    "must invoke imageStripper with filePath to modify: imageStripper.mjs filePath"
  );
}
// my_script.js
// process.stdin.setEncoding("utf-8");

// if (process.argv.length > 3) {
//   // Read from command-line argument
//   process.stdout.write(stripMarkdownOfImages(process.argv[2], process.argv[3]));
// } else {
//   let inputData = "";

//   if (process.argv.length < 3) {
//     // Read from command-line argument
//     throw new Error(
//       "must invoke imageStripper with outputpath: node imageStripper.mjs outputPath"
//     );
//   }
//   if (process.stdin === undefined) {
//     throw new Error("failed pass argument or pipe input to imageStripper.mjs");
//   }
//   // Read from piped input
//   process.stdin.on("readable", () => {
//     let chunk;
//     while ((chunk = process.stdin.read()) !== null) {
//       inputData += chunk;
//     }
//   });

//   process.stdin.on("end", () => {
//     process.stdout.write(stripMarkdownOfImages(process.argv[2], inputData));
//   });
// }
