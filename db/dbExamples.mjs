import db from "../lib/dbConnect.mjs";
import { yyyymmddhhmmss } from "../lib/utils.mjs";

function insertSample(
  bTitle,
  filePath,
  isPrintPage,
  title,
  synopsis,
  isQuiz,
  isPrintChunkSummary,
  narrator,
  jDate
) {
  const correctFormatDate = yyyymmddhhmmss(jDate);
  const dbExampleBook = db.prepare(
    `insert or replace into md (createdTStamp, title, synopsis, filePath) values (?,?,?,?)`
  );
  dbExampleBook.run(correctFormatDate, title, synopsis, filePath);

  const dbExampleBookmark = db.prepare(
    `insert or replace into bookmarks (bTitle, isQuiz, isPrintPage, isPrintChunkSummary, narrator, tStamp, filePath) values (?,?,?,?,?,?,?)`
  );
  dbExampleBookmark.run(
    bTitle,
    isQuiz,
    isPrintPage,
    isPrintChunkSummary,
    narrator,
    correctFormatDate,
    filePath
  );
}
const today = new Date();
insertSample(
  "Frankenstein",
  "./library/Frankenstein.pdf",
  1,
  "Frankenstein",
  "A scientist, Victor Von Frankenstein creates life by infusing corpses with lightning. His Misshapen creature seeks the affection of his father and failing that, the creation of a bride, but Frankenstein refuses leading to a climactic chase across the world as the creature rebels against his creator.",
  1,
  1,
  "Mr. T",
  today
);

insertSample(
  "World Models: A Path to AGI",
  "./library/a_path_towards_agi.pdf",
  0,
  "World Models: A Path to AGI",
  "In this research paper, Yann Lecunn outlines a hypothetical software architecture that would allow for learning and creation of a differentiable, configurable world model that might reach parity with human mental faculties",
  1,
  1,
  "",
  today
);
