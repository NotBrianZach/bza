#!/usr/bin/env node

import MarkdownIt from "markdown-it";
import fs from "fs";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

// Your tokens array
function tokensToMarkdown(tokens) {
  let output = "";

  for (const token of tokens) {
    switch (token.type) {
      case "heading_open":
        output += `${"#".repeat(token.tag.substr(1))} `;
        break;
      case "heading_close":
        output += "\n";
        break;
      case "paragraph_open":
        output += "\n";
        break;
      case "paragraph_close":
        output += "\n";
        break;
      case "bullet_list_open":
        break;
      case "bullet_list_close":
        break;
      case "ordered_list_open":
        break;
      case "ordered_list_close":
        break;
      case "list_item_open":
        break;
      case "list_item_close":
        break;
      case "inline":
        output += token.content;
        break;
      case "link_open":
        output += `[`;
        break;
      case "link_close":
        output += `](${token.attrs.find(attr => attr[0] === "href")[1]})`;
        break;
      case "image":
        console.log(
          "image src",
          token.attrs.find(attr => attr[0] === "src")
        );
        output += `![${token.content}](${
          token.attrs.find(attr => attr[0] === "src")[1]
        })`;
        break;
      case "code_inline":
        output += `\`${token.content}\``;
        break;
      case "fence":
        output += `\n\`\`\`${token.info || ""}\n${token.content}\n\`\`\`\n`;
        break;
      case "code_block":
        output += `\n\`\`\`\n${token.content}\n\`\`\`\n`;
        break;
      case "blockquote_open":
        output += "> ";
        break;
      case "blockquote_close":
        break;
      case "hr":
        output += "\n---\n";
        break;
      case "strong_open":
        output += "**";
        break;
      case "strong_close":
        output += "**";
        break;
      case "em_open":
        output += "_";
        break;
      case "em_close":
        output += "_";
        break;
      case "s_open":
        output += "~~";
        break;
      case "s_close":
        output += "~~";
        break;
      case "hardbreak":
        output += "  \n";
        break;
      case "softbreak":
        output += "\n";
        break;
      default:
        console.log(`Unhandled token type: ${token.type}`);
    }
  }

  return output;
}

console.log("imageStripper");
function removeBase64ImagesFromMarkdownString(markdownContent, outputDir) {}

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
    const inputFileName = getFilenameWithoutSuffix(inputFilePath);

    const inputFilePathComponenetList = inputFilePath.split("/");
    inputFilePathComponenetList.pop();
    const outputDir =
      inputFilePathComponenetList.join("/") + inputFileName + "d";
    const inputMarkdown = inputMarkdownBuffer.toString();
    // strip all images that repeat 3 or more times
    // const cleanMarkdown = removeBase64ImagesFromMarkdownString(
    //   inputMarkdown,
    //   outputDir
    // );

    console.log("removeBase64ImagesFromMarkdownString");
    const MAX_REPEATS = 3; // Define the maximum number of times a base64 image is allowed to repeat

    const base64ImageRegex = /!\[.*?\]\s*\(data:image\/.*?;base64,.*?\)/g;
    let base64Images = inputMarkdown.match(base64ImageRegex) || [];

    let imageCounter = {};

    // Count occurrences of each image
    let cleanedMarkdown = inputMarkdown;
    base64Images.forEach(image => {
      imageCounter[image] = (imageCounter[image] || 0) + 1;
    });

    // Remove images that repeat too often
    for (const [image, count] of Object.entries(imageCounter)) {
      if (count > MAX_REPEATS) {
        cleanedMarkdown = cleanedMarkdown.split(image).join("");
      }
    }

    const imageDirPath = `${outputDir}/imagesD`;

    console.log("removeBase64ImagesFromMarkdownString2");
    fs.mkdir(imageDirPath, { recursive: true }, error => {
      console.log("cleanedMarkdown0");
      if (error && error.code !== "EEXIST") {
        console.error("Error creating directory to save images:", error);
        return "Error creating directory to save images: ${error}";
      } else {
        imageCounter = 0;
        // console.log("cleanedMarkdown", cleanedMarkdown);
        base64Images = cleanedMarkdown.match(base64ImageRegex) || [];
        // console.log("base64Images", base64Images);
        base64Images.forEach(image => {
          const base64DataRegex = /data:image\/(.*?);base64,(.*)/;
          const matches = image.match(base64DataRegex);

          const extension = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");

          // Save the image to a file
          const fileName = `${imageDirPath}/image-${imageCounter}.${extension}`;
          fs.writeFileSync(fileName, buffer);
          console.log(`Image saved as ${fileName}`);

          cleanedMarkdown = cleanedMarkdown
            .split(image)
            .join(
              `![image-${imageCounter}](./imagesD/image-${imageCounter}.${extension})`
            );

          // Update the image src attribute in the token
          imageCounter++;
        });

        // return cleanedMarkdown;

        fs.writeFileSync(inputFilePath, cleanedMarkdown);
      }
    });
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
