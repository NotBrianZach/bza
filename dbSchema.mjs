import db from "./lib/dbConnect.mjs";

// fileTypes: ["pdf", "html", "url", "epub", "", "txt"], "" = plaintext
// articleTypes: ["book", "research paper", "monograph"],

const defaultChunkSize = 2;
const defaultMaxTokens = 2;
// 1800 is about how many characters are on the page of a typical book
// supposedly, according to a quick google
const defaultCharPageLength = 1800;

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

console.log("initialized database");
