#!/usr/bin/env node

import pool from "../lib/dbConnect.mjs";

// supposedly, according to a quick google
// 1800 is about how many characters are on the page of a typical book
const defaultCharPageLength = 1800;
// const pool = new Pool()
const createTableQueries = [
  `
CREATE TABLE IF NOT EXISTS markdown (
  "filePath" TEXT PRIMARY KEY,
  "articleType" TEXT NOT NULL DEFAULT 'article',
  title TEXT NOT NULL DEFAULT '',
  "createdTStamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "charPageLength" INTEGER NOT NULL DEFAULT ${defaultCharPageLength},
  "readerExe" TEXT NOT NULL DEFAULT '',
  "readerArgs" TEXT,
  "readerStateFile" TEXT
);
`,

  // articleTypes: ["book", "research paper", "monograph", "news article", "article"],

  `create table if not exists bookmarks (
    bookmarkId SERIAL PRIMARY KEY,
    "bTitle" TEXT not null,
    "tStamp" TIMESTAMP not null,
    "parentConvId" INTEGER,
    "pageNum" INTEGER not null default 0,
    "rollingSummary" TEXT not null default '',
    "isQuiz" boolean default false,
    "isPrintPage" boolean default false,
    "isPrintSliceSummary" boolean default false,
    "isPrintRollingSummary" boolean default false,
    "sliceSize" INTEGER not null default 2,
    maxTokens INTEGER not null default 2,
    synopsis TEXT not null default '',
    narrator TEXT,
    "filePath" TEXT not null,
    FOREIGN KEY ("filePath") references markdown("filePath")
    )`,
  `CREATE INDEX bookmarks_filePath_idx ON bookmarks (filePath);`,

  // key = quiz
  // gptOut = "[1. how fast can a swallow fly 2. ]"
  // userInput = "[1. 200 mph]"
  // key = answer
  // gptOut = "1. how fast can a swallow fly"

  `create table if not exists subLoops (
    "bTitle" TEXT not null,
    "tStamp" TIMESTAMP not null,
    ordering INTEGER not null,
    "loopKey" text not null,
    "userInputs" text not null default '',
    "gptOut" text not null default '',
    primary key("bTitle", "tStamp", "loopKey"))`,

  `create table if not exists contexts (
    "bTitle" TEXT not null,
    "tStamp" TEXT not null,
    ordering INTEGER not null,
    embedding vector (1024),
    append text not null default '',
    "prependSummary" text not null default '',
    "appendSummary" text not null default '',
    primary key("bTitle", "tStamp", ordering))`,

  // save and resume conversations within single iteration of event loop
  // help to avoid proliferation of bookmark timestamps by adding a nested level of them to resume individual conversations from
  // (tStamp+title identifies all conversations you had in a session, conversationTStamp more granular sorting)
  `CREATE TABLE IF NOT EXISTS quiz_configs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL
  );``create table if not exists conversations (
 "bTitle" TEXT,
 "tStamp" TIMESTAMP NOT NULL DEFAULT REFERENCES,
 "conversationTStamp" TIMESTAMP NOT NULL DEFAULT NOW(),
 conversation TEXT,
 primary key("bTitle", "tStamp", "conversationTStamp"))`,

  // roughly following https://supabase.com/blog/openai-embeddings-postgres-vector
  `create table if not exists embeddings (
    "bTitle" TEXT not null,
    "tStamp" TEXT not null,
    "pageNum" INTEGER not null,
    content TEXT not null,
    embedding vector(1024),
    primary key("bTitle", "tStamp"))`,
  ` create index on embeddings
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
`,

  `
create or replace function match_documents (
  "queryEmbedding" vector(1024),
  "similarityThreshold" float,
  "matchCount" int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    id,
    content,
    1 - (documents.embedding <=> "queryEmbedding") as similarity
  from documents
  where 1 - (documents.embedding <=> "queryEmbedding") > "similarityThreshold"
  order by documents.embedding <=> "queryEmbedding"
  limit "matchCount";
end;
$$;
`
];

const executeQueries = async (client, queries) => {
  return Promise.all(
    queries.map(query =>
      client
        .query(query)
        .catch(err => console.error("Error executing query", err.stack))
    )
  );
};

pool.connect(async (err, client, release) => {
  if (err) {
    return console.error(
      "Error acquiring db client when initializing postgres db",
      err.stack
    );
  }
  try {
    const results = await executeQueries(client, createTableQueries);
    console.log("Database schema init successful");
  } catch (error) {
    console.error("Error executing queries:", error);
  } finally {
    release();
  }
});
