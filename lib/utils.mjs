import fs from "fs";
import prettier from "prettier";
import readline from "readline";

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

// let markdown = '';
// io.emit('requestMarkdown', {});
// io.on('markdown', (data) => {
//   markdown = data;
//   let pages = Math.ceil(markdown.length / charPerPage);
//   console.log(`Total pages: ${pages}`);
//   for (let i = 0; i < pages; i++) {
//     let start = i * charPerPage;
//     let end = start + charPerPage;
//     let pageContent = markdown.substring(start, end);
//     console.log(`Page ${i + 1}:\n${pageContent}\n`);
//   }
// })
// }
// });

export async function readMultilineInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let inputLines = [];

  console.log("Enter multiline input, end with }}}");

  rl.on("line", line => {
    if (line.includes("}}}")) {
      // End of input
      inputLines.push(line.replace("}}}", "")); // Add the line without the closing sequence
      rl.close();
    } else {
      inputLines.push(line);
    }
  });

  rl.on("close", line => {
    return Promise.resolve(inputLines.join(""));
  });

  //   function processInput(input) {
  //     console.log('Multiline input received:');
  //     console.log(input.join('\n'));
  // }
}

export function removeExtraWhitespace(str) {
  // console.log("removeExtraWhitespace", str);
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
