import db from "./lib/dbConnect.mjs";
import { yyyymmddhhmmss } from "./lib/utils.mjs";

function insertSamplePDF(
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
  const dbExamplePDFBook = db.prepare(
    `insert or replace into pdfs (bTitle, tStamp, filePath, isPrintPage) values (?,?,?, ?)`
  );
  dbExamplePDFBook.run(bTitle, correctFormatDate, filePath, isPrintPage);

  const dbExamplePDFBookmark = db.prepare(
    `insert or replace into bookmarks (bTitle, title, synopsis, isQuiz, isPrintChunkSummary, narrator, tStamp) values (?,?,?,?,?,?,?)`
  );
  dbExamplePDFBookmark.run(
    bTitle,
    title,
    synopsis,
    isQuiz,
    isPrintChunkSummary,
    narrator,
    correctFormatDate
  );
}
const today = new Date();
insertSamplePDF(
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

insertSamplePDF(
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
