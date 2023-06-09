#!/usr/bin/env node

// import db from "../lib/dbConnect.mjs";
import pool from "../lib/dbConnect.mjs";
import { yyyymmddhhmmss } from "../lib/utils.mjs";

function insertSample(
  bTitle,
  filePath,
  isPrintPage,
  title,
  synopsis,
  isQuiz,
  isPrintSliceSummary,
  narrator,
  jDate,
  articleType
) {
  const correctFormatDate = yyyymmddhhmmss(jDate);
  // const dbExampleBook = db.prepare(
  //   `insert or replace into md (createdTStamp, title,  filePath, articleType) values (?,?,?,?)`
  // );
  // dbExampleBook.run(correctFormatDate, title, filePath, articleType);
  const dbExampleBook = pool.query(
    `insert into markdown ("createdTStamp", title,  "filePath", "articleType") values ($1,$2,$3,$4) on conflict do nothing`,
    [correctFormatDate, title, filePath, articleType],
    (err, result) => {
      if (err) {
        console.log("error inserting into markdown table", err);
      } else {
        // console.log();
        console.log(
          "inserted db example markdown, on conflict nothing, result",
          result
        );
        const dbExampleBookmark = pool.query(
          `insert into bookmarks ("bTitle", synopsis, "isQuiz", "isPrintPage", "isPrintSliceSummary", narrator, "tStamp", "filePath") values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict do nothing`,
          [
            bTitle,
            synopsis,
            isQuiz,
            isPrintPage,
            isPrintSliceSummary,
            narrator,
            correctFormatDate,
            filePath
          ],
          (err2, result2) => {
            if (err2) {
              console.log("error inserting into bookmarks", err2);
            } else {
              console.log(
                "inserted db example bookmarks, on conflict nothing, result2",
                result2
              );
            }
          }
        );
      }
    }
  );
}

const today = new Date();
insertSample(
  "Frankenstein",
  "./library/Frankensteind/Frankenstein.md",
  1,
  "Frankenstein",
  "A scientist, Victor Von Frankenstein creates life by infusing corpses with lightning. His Misshapen creature seeks the affection of his father and failing that, the creation of a bride, but Frankenstein refuses leading to a climactic chase across the world as the creature rebels against his creator.",
  1,
  1,
  null,
  today,
  "book"
);

insertSample(
  "World Models: A Path to AGI",
  "./library/a_path_towards_agid/a_path_towards_agiGPTCleaned.md",
  0,
  "World Models: A Path to AGI",
  "In this research paper, Yann Lecunn outlines a hypothetical software architecture that would allow for learning and creation of a differentiable, configurable world model that might reach parity with human mental faculties",
  1,
  1,
  "",
  today,
  "arxiv preprint"
);
