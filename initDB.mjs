import Database from "better-sqlite3";

// fileTypes: ["pdf", "html", "url", "epub", "", "txt"], "" = plaintext
// articleTypes: ["book", "research paper", "monograph"],
// exampleCharacterValues: ["", "socrates", "lao-tzu", "mike tyson"],

const defaultChunkSize = 2;
const defaultMaxTokens = 2;
// 1800 is about how many characters are on the page of a typical book
// supposedly, according to a quick google
const defaultCharPageLength = 1800;

const db = new Database("./bookmarks.sq3", {
  // fileMustExist: true,
  timeout: 2000 // 2 seconds
  // verbose: sqlstatement => console.log(`sqlite3 trace ${sqlstatement}`)
});
db.pragma("journal_mode = WAL");

const dbBookmarks = db.prepare(
  `create table if not exists bookmarks (bTitle TEXT primary key,
 title TEXT not null default '',
 synopsis TEXT not null default '',
 pageNumber INTEGER not null default 0,
 fileType TEXT not null default 'pdf',
 isQuiz boolean default false,
 isPrintChunkSummary boolean default false,
 chunkSize INTEGER not null default ${defaultChunkSize},
 maxTokens INTEGER not null default ${defaultMaxTokens},
 narrator TEXT,
 last_read_tstamp TEXT)`
);
dbBookmarks.run();

const dbContexts = db.prepare(
  `create table if not exists contexts (bTitle TEXT not null,
    ordering integer not null,
    prepend text not null default '',
    append text not null default '',
    prependSummary text not null default '',
    appendSummary text not null default '',
    primary key(bTitle, ordering))`
);
dbContexts.run();

const dbPDFs = db.prepare(
  `create table if not exists pdfs (bTitle TEXT primary key,
 filePath text not null,
 isPrintPage boolean default false,
 readerExe text not null default 'mupdf',
 readerArgs not null default '-Y 2',
 isImage boolean default false)`
);
dbPDFs.run();
const dbHTML = db.prepare(
  `create table if not exists htmls (bTitle TEXT primary key,
 filePath text not null,
 isPrintPage boolean default true,
 charPageLength INTEGER not null default ${defaultCharPageLength},
 readerExe text,
 readerArgs text
 )`
);
dbHTML.run();

const dbPlaintxt = db.prepare(
  `create table if not exists plaintxts (bTitle TEXT primary key,
 filePath text not null,
 isPrintPage boolean default true,
 charPageLength INTEGER not null default ${defaultCharPageLength},
 readerExe text,
 readerArgs text
 )`
);
dbPlaintxt.run();

const dbURL = db.prepare(
  `create table if not exists urls (bTitle TEXT primary key,
 isPrintPage boolean default true,
 charPageLength INTEGER not null default ${defaultCharPageLength} ,
 readerExe text,
 readerArgs text
 )`
);
dbURL.run();
const dbLogging = db.prepare(
  `create table if not exists logs (bTitle TEXT,
 pageNumber INTEGER not null default 0,
 pageChunk TEXT,
 pageChunkSummary TEXT,
 rollingSummary TEXT,
 conversation TEXT,
 chunkSize INTEGER not null,
 maxTokens INTEGER not null default ${defaultMaxTokens},
 narrator TEXT,
 read_tstamp TEXT,
 primary key(read_tstamp))`
);
dbLogging.run();

function insertSamplePDF(
  bTitle,
  filePath,
  isPrintPage,
  title,
  synopsis,
  isQuiz,
  isPrintChunkSummary,
  narrator,
  today
) {
  const dbExamplePDFBook = db.prepare(
    `insert or replace into pdfs (bTitle, filePath, isPrintPage) values (?,?,?)`
  );
  dbExamplePDFBook.run(bTitle, filePath, isPrintPage);

  const dbExamplePDFBookmark = db.prepare(
    `insert or replace into bookmarks (bTitle, title, synopsis, isQuiz, isPrintChunkSummary, narrator) values (?,?,?,?,?,?)`
  );
  dbExamplePDFBookmark.run(
    bTitle,
    title,
    synopsis,
    isQuiz,
    isPrintChunkSummary,
    narrator
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
  1,
  "Mr. T",
  today.toString()
);
insertSamplePDF(
  "World Models: A Path to AGI",
  "./library/a_path_towards_agi.pdf",
  0,
  "Frankenstein",
  "In this research paper, Yann Lecunn outlines a hypothetical software architecture that would allow for learning and creation of a differentiable, configurable world model that might reach parity with human mental faculties",
  1,
  1,
  1,
  "",
  today.toString()
);

console.log("initialized database");
