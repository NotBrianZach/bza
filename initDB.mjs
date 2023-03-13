import Database from "better-sqlite3";

// fileTypes: ["pdf", "html", "url", "epub", "", "txt"], "" = plaintext
// articleTypes: ["book", "research paper", "monograph"],
// exampleCharacterValues: ["", "socrates", "lao-tzu", "mike tyson"],

const defaultChunkSize = 2;
const defaultMaxTokens = 2;
const defaultCharPageLength = 2;

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
  `create table if not exists contexts (bTitle TEXT primary key,
    order int not null,
    prepend text not null default '',
    append text not null default '',
    prependSummary text not null default '',
    appendSummary text not null default '' primary key(bTitle, order))`
);
dbContexts.run();
const dbPDFs = db.prepare(
  `create table if not exists pdfs (bTitle TEXT primary key,
 filepath text not null,
 isPrintPage boolean default false,
 readerExe text not null default 'mupdf',
 readerArgs not null default '-Y 2',
 isImage boolean default false)`
);
dbPDFs.run();
// 1800 is about how many characters are on the page of a typical book
// supposedly, according to a quick google
const dbHTML = db.prepare(
  `create table if not exists htmls (bTitle TEXT primary key,
 filepath text not null,
 isPrintPage boolean default true,
 charPageLength INTEGER not null default ${defaultCharPageLength},
 readerExe text,
 readerArgs text
 )`
);
dbHTML.run();

const dbPlaintxt = db.prepare(
  `create table if not exists plaintxts (bTitle TEXT primary key,
 filepath text not null,
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
 read_tstamp TEXT primary key(read_tstamp))`
);
dbLogging.run();

// const dbExamplePDFBook = db.prepare(
// `create table if not exists pdfs (bTitle TEXT primary key,
//  filepath text not null,
//  isPrintPage boolean default true,
//  charPageLength INTEGER not null default ${defaultCharPageLength},
//  readerExe text,
//  readerArgs text
// `INSERT OR REPLACE INTO clientNotes (phone, clientName, petName, breed, gender, age, weight, lastPriceUpdate, pricesJSON, schdJSON, prfDaysJSON, notesJSON, groomJSON, historyJSONList, priceHistoryJSONList) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
//   `insert into`
//   //   Frankenstein: {
//   //     pageNumber: 0,
//   //     articleType: "book",
//   //     chunkSize: 2,
//   //     narrator: "Mr. T",
//   //     title: "Frankenstein",
//   //     synopsis:
//   //       "A scientist, Victor Von Frankenstein creates life by infusing corpses with lightning. His Misshapen creature seeks the affection of his father and failing that, the creation of a bride, but Frankenstein refuses leading to a climactic chase across the world as the creature rebels against his creator.",
//   //     isPrintPage: true,
//   //     isPrintChunkSummary: true,
//   //     isPrintRollingSummary: true,
//   //     quiz: false,
//   //     path: "./Frankenstein.pdf",
//   //     url: "",
//   //     max_tokens: 2000,
//   //     executable: "xpdf",
//   //     exeArguments: "-z 200",
//   //     prependContext: [""],
//   //     appendContext: [""]
// );

dbExamplePDFBook.run();
// pdf: {
//   },
//   "World Models": {
//     pageNumber: 0,
//     articleType: "book",
//     chunkSize: 2,
//     title: "World Models: A Path to AGI",
//     narrator: "",
//     synopsis:
//       "In this research paper, Yann Lecunn outlines a hypothetical software architecture that would allow for learning and creation of a differentiable, configurable world model that might reach parity with human mental faculties",
//     isPrintPage: false,
//     isPrintChunkSummary: false,
//     isPrintRollingSummary: false,
//     quiz: true,
//     path: "./a_path_towards_agi.pdf",
//     url: "",
//     max_tokens: 2000,
//     executable: "xpdf",
//     exeArguments: "-z 200",
//     prependContext: [""],
//     appendContext: [""]
//   }
// },

console.log("initialized database");
