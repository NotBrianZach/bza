#!/usr/bin/env node

import fs from "fs";

console.log("imageStripper");

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
