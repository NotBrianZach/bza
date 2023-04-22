#!/usr/bin/env node

import pool from "../lib/dbConnect.mjs";

// supposedly, according to a quick google
// 1800 is about how many characters are on the page of a typical book
const defaultCharPageLength = 1800;
// const pool = new Pool()
const createTableQueries = [
  `
CREATE TABLE IF NOT EXISTS markdown (
  filePath TEXT PRIMARY KEY,
  articleType TEXT NOT NULL DEFAULT 'article',
  title TEXT NOT NULL DEFAULT '',
  createdTStamp TEXT NOT NULL,
  charPageLength INTEGER NOT NULL DEFAULT ${defaultCharPageLength},
  readerExe TEXT NOT NULL DEFAULT '',
  readerArgs TEXT,
  readerStateFile TEXT
);
`,

  // articleTypes: ["book", "research paper", "monograph", "news article", "article"],

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
    synopsis TEXT not null default '',
    narrator TEXT,
    filePath TEXT not null,
    FOREIGN KEY (filePath) references markdown(filePath),
    primary key(bTitle, tStamp))`,

  // key = quiz
  // gptOut = "[1. how fast can a swallow fly 2. ]"
  // userInput = "[1. 200 mph]"
  // key = answer
  // gptOut = "1. how fast can a swallow fly"

  `create table if not exists subLoops (
    bTitle TEXT not null,
    tStamp text not null,
    ordering INTEGER not null,
    loopKey text not null,
    userInputs text not null default '',
    gptOut text not null default '',
    primary key(bTitle, tStamp, loopKey))`,

  `create table if not exists contexts (
    bTitle TEXT not null,
    tStamp TEXT not null,
    ordering INTEGER not null,
    embedding vector (1536),
    append text not null default '',
    prependSummary text not null default '',
    appendSummary text not null default '',
    primary key(bTitle, tStamp, ordering))`,

  // save and resume conversations within single iteration of event loop
  // help to avoid proliferation of bookmark timestamps by adding a nested level of them to resume individual conversations from
  // (tStamp+title identifies all conversations you had in a session, conversationTStamp more granular sorting)
  // TODO not sure if some of these properties will simply be inherited from bookmarks

  `create table if not exists conversations (
 bTitle TEXT,
 tStamp TEXT,
 conversationTStamp TEXT,
 conversation TEXT,
 primary key(bTitle, tStamp, conversationTStamp))`,

  // roughly following https://supabase.com/blog/openai-embeddings-postgres-vector
  `create table if not exists embeddings (
    bTitle TEXT not null,
    tStamp TEXT not null,
    pageNum INTEGER not null,
    content TEXT not null,
    embedding vector(1536),
    primary key(bTitle, tStamp))`,
  ` create index on embeddings
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
`,

  `
create or replace function match_documents (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
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
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > similarity_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
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
