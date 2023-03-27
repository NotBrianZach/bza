import fs from "fs";
import prettier from "prettier";
import MarkdownIt from "markdown-it";

export function removeRepeatingBase64ImagesFromMarkdownString(markdownContent) {
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

  // Remove images that repeat too often
  for (const [image, count] of Object.entries(imageCounter)) {
    if (count > MAX_REPEATS) {
      cleanedMarkdown = cleanedMarkdown.split(image).join("");
    }
  }
  return cleanedMarkdown;
}
// import winston from "winston";

// const serverLog = winston.createLogger({
//   levels: winston.config.syslog.levels,
//   transports: [
//     // new winston.transports.Console({ level: 'error' }),
//     new winston.transports.File({
//       filename: "server.log",
//       level: "info"
//     })
//   ]
// });

// const logger = winston.createLogger({
//   transports: [
//     new winston.transports.File({
//       filename: 'error.log',
//       level: 'error',
//       format: winston.format.json()
//     }),
//     new transports.Http({
//       level: 'warn',
//       format: winston.format.json()
//     }),
//     new transports.Console({
//       level: 'info',
//       format: winston.format.combine(
//         winston.format.colorize(),
//         winston.format.simple()
//       )
//     })
//   ]
// });

export function removeExtraWhitespace(str) {
  // removes any instance of two or whitespace (text often has tons of padding characers), and whitespace from end and beginning of str
  return str.replace(/\s+/g, " ").trim();
}

export function devLog(...args) {
  const IS_DEV = process.env.IS_DEV;
  console.log("DEV", ...args);
}

// longest english word is like 45 characters
// export function filterStringOfSubstringsOfMinimumLengthThatRepeatTooMuch(
//   inputString,
//   minSubstringLength = 45,
//   maxRepetitionsPer1000 = 1
// ) {
//   const substrings = new Map();
//   const inputStringLength = inputString.length;
//   const maxSubstringLength = Math.min(
//     inputStringLength,
//     minSubstringLength * maxRepetitionsPer1000
//   );

//   for (
//     let length = minSubstringLength;
//     length <= maxSubstringLength;
//     length++
//   ) {
//     for (let i = 0; i <= inputStringLength - length; i++) {
//       const substring = inputString.slice(i, i + length);
//       const count = substrings.get(substring) || 0;
//       substrings.set(substring, count + 1);
//     }
//   }

//   const filteredSubstrings = Array.from(substrings.entries()).filter(
//     ([substring, count]) => {
//       const repetitionsPer1000 = (count * 1000) / inputStringLength;
//       return repetitionsPer1000 <= maxRepetitionsPer1000;
//     }
//   );

//   let filteredString = inputString;
//   filteredSubstrings.forEach(([substring]) => {
//     filteredString = filteredString.split(substring).join("");
//   });

//   return filteredString;
// }

export function yyyymmddhhmmss(date) {
  return (
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    date
      .getDate()
      .toString()
      .padStart(2, "0") +
    " " +
    date
      .getHours()
      .toString()
      .padStart(2, "0") +
    ":" +
    date
      .getMinutes()
      .toString()
      .padStart(2, "0") +
    ":" +
    date
      .getSeconds()
      .toString()
      .padStart(2, "0")
  );
}

export function newSessionTime() {
  return yyyymmddhhmmss(new Date());
}

export function validateObj(object, key, values) {
  if (object[key] && values.includes(object[key])) {
    return true;
  }
  return false;
}
