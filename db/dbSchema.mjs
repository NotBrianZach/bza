import db from "../lib/dbConnect.mjs";

// md = markdown
// 1800 is about how many characters are on the page of a typical book
// supposedly, according to a quick google
const defaultCharPageLength = 1800;
// articleTypes: ["book", "research paper", "monograph", "news article", "article"],
const dbMd = db
  .prepare(
    `create table if not exists md (
 filePath text primary key,
 articleType TEXT not null default 'article',
 title TEXT not null default '',
 synopsis TEXT not null default '',
 createdTStamp TEXT not null,
 charPageLength INTEGER not null default ${defaultCharPageLength},
 readerExe text not null default '',
 readerArgs text,
 readerStateFile text
 )`
  )
  .run();
console.log("dbMd status", dbMd);

const dbBookmarks = db
  .prepare(
    `create table if not exists bookmarks (
 bTitle TEXT not null,
 tStamp TEXT not null,
 pageNum INTEGER not null default 0,
 rollingSummary TEXT not null default '',
 isQuiz boolean default false,
 isPrintPage boolean default false,
 isPrintSliceSummary boolean default false,
 isPrintRollingSummary boolean default false,
 sliceSize INTEGER not null default 2,
 maxTokens INTEGER not null default 2,
 narrator TEXT,
 filePath TEXT not null,
 FOREIGN KEY (filePath) references md(filePath),
 primary key(bTitle, tStamp))`
  )
  .run();
console.log("dbBookmarks status", dbBookmarks);

// key = quiz
// gptOut = "[1. how fast can a swallow fly 2. ]"
// userInput = "[1. 200 mph]"
// key = answer
// gptOut = "1. how fast can a swallow fly"
const dbSubloops = db
  .prepare(
    `create table if not exists subLoops (
    bTitle TEXT not null,
    tStamp text not null,
    ordering INTEGER not null,
    loopKey text not null,
    userInputs text not null default '',
    gptOut text not null default '',
    primary key(bTitle, tStamp, loopKey))`
  )
  .run();
console.log("dbSubloops status", dbSubloops);

const dbContexts = db
  .prepare(
    `create table if not exists contexts (
    bTitle TEXT not null,
    tStamp TEXT not null,
    ordering INTEGER not null,
    embedding text not null default '',
    append text not null default '',
    prependSummary text not null default '',
    appendSummary text not null default '',
    primary key(bTitle, tStamp, ordering))`
  )
  .run();
console.log("dbContexts status", dbContexts);

const dbEmbeddings = db
  .prepare(
    `create table if not exists embeddings (
    bTitle TEXT not null,
    tStamp TEXT not null,
    pageNum INTEGER not null,
    embedding TEXT not null,
    primary key(bTitle, tStamp))`
  )
  .run();
console.log("dbEmbeddings status", dbEmbeddings);

// save and resume conversations within single iteration of event loop
// help to avoid proliferation of bookmark timestamps by adding a nested level of them to resume individual conversations from
// (tStamp+title identifies all conversations you had in a session, conversationTStamp more granular sorting)
// TODO not sure if some of these properties will simply be inherited from bookmarks
const dbConversations = db
  .prepare(
    `create table if not exists conversations (
 bTitle TEXT,
 tStamp TEXT,
 conversationTStamp TEXT,
 conversation TEXT,
 primary key(bTitle, tStamp, conversationTStamp))`
  )
  .run();
console.log("dbConversations status", dbConversations);

console.log("initialized database");
