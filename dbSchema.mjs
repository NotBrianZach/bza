import db from "./lib/dbConnect.mjs";

// fileTypes: ["pdf", "html", "url", "epub", "", "txt"], "" = plaintext
// articleTypes: ["book", "research paper", "monograph"],

const defaultChunkSize = 2;
const defaultMaxTokens = 2;
// 1800 is about how many characters are on the page of a typical book
// supposedly, according to a quick google
const defaultCharPageLength = 1800;

const dbBookmarks = db.prepare(
  `create table if not exists bookmarks (bTitle TEXT not null,
 tStamp TEXT not null,
 title TEXT not null default '',
 synopsis TEXT not null default '',
 pageNum INTEGER not null default 0,
 rollingSummary TEXT not null default '',
 fileType TEXT not null default 'pdf',
 isQuiz boolean default false,
 isPrintPage boolean default false,
 isPrintChunkSummary boolean default false,
 isPrintRollingSummary boolean default false,
 chunkSize INTEGER not null default ${defaultChunkSize},
 maxTokens INTEGER not null default ${defaultMaxTokens},
 narrator TEXT,
 primary key(bTitle, tStamp))`
);
dbBookmarks.run();

// const dbQuizzes = db.prepare(
//   `create table if not exists quizzes (bTitle TEXT not null,
//     tStamp text not null,
//     quiz text not null,
//     answer text not null default '',
//     primary key(bTitle, tStamp))`
// );
// dbQuizzes.run();

// key = quiz
// gptOut = "[1. how fast can a swallow fly 2. ]"
// userInput = "[1. 200 mph]"
// key = answer
// gptOut = "1. how fast can a swallow fly"
// const dbSubloops = db.prepare(
//   `create table if not exists quizzes (bTitle TEXT not null,
//     tStamp text not null,
//     key text not null,
//     userInputs text not null default '',
//     gptOut text not null default '',
//     primary key(bTitle, tStamp, key))`
// );
// dbQuizzes.run();

const dbContexts = db.prepare(
  `create table if not exists contexts (bTitle TEXT not null,
    tStamp TEXT not null,
    ordering integer not null,
    prepend text not null default '',
    append text not null default '',
    prependSummary text not null default '',
    appendSummary text not null default '',
    primary key(bTitle, tStamp, ordering))`
);
dbContexts.run();

const dbEmbeddings = db.prepare(
  `create table if not exists embeddings (bTitle TEXT not null,
    tStamp TEXT not null,
    ordering integer not null,
    prepend text not null default '',
    append text not null default '',
    prependSummary text not null default '',
    appendSummary text not null default '',
    primary key(bTitle, tStamp, ordering))`
);
dbEmbeddings.run();

const dbMD = db.prepare(
  `create table if not exists md (bTitle TEXT not null,
 tStamp TEXT not null,
 filePath text not null,
 charPageLength INTEGER not null default ${defaultCharPageLength},
 readerExe text,
 readerArgs text,
primary key (bTitle, tStamp)
 )`
);
dbMD.run();

// const dbPDFs = db.prepare(
//   `create table if not exists pdfs (bTitle TEXT not null,
//     tStamp text not null,
//  filePath text not null,
//  readerExe text not null default 'mupdf',
//  readerArgs not null default '-Y 2',
//  isImage boolean default false, primary key(bTitle, tStamp))`
// );
// dbPDFs.run();

// const dbHTML = db.prepare(
//   `create table if not exists htmls (bTitle TEXT not null,
//  tStamp TEXT not null,
//  filePath text not null,
//  charPageLength INTEGER not null default ${defaultCharPageLength},
//  readerExe text,
//  readerArgs text,
//  primary key(bTitle, tStamp)
//  )`
// );
// dbHTML.run();

// const dbPlaintxt = db.prepare(
//   `create table if not exists plaintxts (bTitle TEXT not null,
//  tStamp TEXT not null,
//  filePath text not null,
//  charPageLength INTEGER not null default ${defaultCharPageLength},
//  readerExe text,
//  readerArgs text,
// primary key (bTitle, tStamp)
//  )`
// );
// dbPlaintxt.run();

// const dbURL = db.prepare(
//   `create table if not exists urls (bTitle TEXT not null,
//   tStamp text not null,
//  charPageLength INTEGER not null default ${defaultCharPageLength} ,
//  readerExe text,
//  readerArgs text,
//  primary key (bTitle, tStamp)
//  )`
// );
// dbURL.run();

// save and resume conversations within single iteration of event loop
// help to avoid proliferation of bookmark timestamps by adding a nested level of them to resume individual conversations from
// (tStamp+title identifies all conversations you had in a session whereas conversationTStamp sort those perhaps)
// TODO not sure if some of these properties will simply be inherited from bookmarks
const conversationStore = db.prepare(
  `create table if not exists conversations (bTitle TEXT,
 pageNum INTEGER not null default 0,
 pageChunk TEXT,
 pageChunkSummary TEXT,
 rollingSummary TEXT,
 conversation TEXT,
 chunkSize INTEGER not null,
 maxTokens INTEGER not null default ${defaultMaxTokens},
 narrator TEXT,
 tStamp TEXT,
 conversationTStamp TEXT,
 primary key(bTitle, tStamp, conversationTStamp))`
);
conversationStore.run();

console.log("initialized database");
