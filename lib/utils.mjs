import fs from "fs";
import prettier from "prettier";
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
