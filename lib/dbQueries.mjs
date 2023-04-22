// import db from "./dbConnect.mjs";
import pool from "./dbConnect.mjs";
import { devLog } from "./utils.mjs";
import { Configuration, OpenAIApi } from "openai";
// import { supabaseClient } from "./lib/supabase";
async function poolQuery(statement, args) {
  devLog(`poolQuery: ${statement}, ${args}`);
  try {
    const res = await pool.query(statement, args);
    devLog(`poolQuery res: ${JSON.stringify(res)}`);
    return res.rows;
  } catch (err) {
    throw {
      error: "sql execution error",
      msg: `statement:  ${statement}, args: ${args}`
    };
  }
}

async function poolQueryFirstRow(statement, args) {
  devLog(`poolQuery: ${statement}, ${args}`);
  try {
    const res = await pool.query(statement, args);
    devLog(`poolQuery res: ${JSON.stringify(res)}`);
    return res.rows[0];
  } catch (err) {
    throw {
      error: "sql execution error",
      msg: `statement:  ${statement}, args: ${args}`
    };
  }
}
// async function poolQuery(statement, args) {
//   devLog(`poolQuery: ${statement}, ${args}`);
//   return pool
//     .query(statement, args)
//     .then(res => {
//       devLog(`poolQuery res: ${JSON.stringify(res)}`);
//       Promise.resolve(res.rows);
//     })
//     .catch(err =>
//       Promise.reject({
//         error: "sql execution error",
//         msg: `statement:  ${statement}, args: ${args}`
//       })
//     );
//   // pool.query(statement, args, (err, result) => {
//   //   if (err) {
//   //     const errObj = {
//   //       error: "sql execution error",
//   //       msg: `statement:  ${statement}, args: ${args}`
//   //     };
//   //     console.error(JSON.stringify(errObj));
//   //     return errObj;
//   //   } else {
//   //     devLog(`poolQuery result ${JSON.stringify(result)}`);
//   //     return result.rows;
//   //   }
//   // });
// }

export async function generateEmbeddings(
  bTitle,
  tStamp,
  pageNum,
  documentStrings
) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  });
  const openAi = new OpenAIApi(configuration);

  // Assuming each document is a string
  for (const documentString of documentStrings) {
    // OpenAI recommends replacing newlines with spaces for best results
    const input = document.replace(/\n/g, " ");

    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input
    });

    const [{ embedding }] = embeddingResponse.data.data;

    poolQuery(
      'insert into embeddings ("bTitle", "tStamp", "pageNum", content, embedding) values ($1, $2, $3, $4, $5)',
      [bTitle, tStamp, pageNum, document, embedding]
    );
  }
}

export async function loadBookmarksBy(orderBy, limit) {
  return await poolQuery("SELECT * FROM bookmarks order by $1 limit $2", [
    orderBy,
    limit
  ]);
}

export async function loadBookmark(bTitle, tStamp) {
  if (bTitle === undefined) {
    return await poolQueryFirstRow(
      `SELECT * FROM bookmarks order by "tStamp" limit 1`
    );
  }
  if (tStamp === undefined) {
    return await poolQueryFirstRow(
      `SELECT * FROM bookmarks where "bTitle"=$1 order by "tStamp" limit 1`,
      [bTitle]
    );
  }
  return await poolQueryFirstRow(
    `SELECT * FROM bookmarks where "bTitle"=$1 and "tStamp" = $2`,
    [bTitle, tStamp]
  );
}

export async function loadMDTable(filePath) {
  return await poolQuery(`SELECT * FROM markdown where "filePath"=$1`, [
    filePath
  ]);
}

// filePath text primary key,
// articleType TEXT not null default 'article',
// title TEXT not null default '',
// synopsis TEXT not null default '',
// createdTStamp TEXT not null,
// charPageLength INTEGER not null default ${defaultCharPageLength},
// readerExe text not null default 'vmd',
// readerArgs text,
// readerStateFile text
export async function insertMD(filePath, title, tStamp, articleType) {
  return pool.query(
    `insert or replace into markdown (
  "filePath",
  title,
  "createdTStamp",
  "articleType"
 ) values ($1,$2,$3,$4)`,
    [filePath, title, tStamp, articleType]
  );
}

export async function insertBookmark(
  filePath,
  title,
  tStamp,
  synopsis,
  pageNum = 0,
  narrator,
  sliceSize = 2,
  rollingSummary = "",
  isPrintPage,
  isPrintSliceSummary,
  isPrintRollingSummary
) {
  return await poolQuery(
    `insert or replace into bookmarks  (
  "filePath",
  "bTitle",
  "tStamp",
  "pageNum",
  narrator,
  "sliceSize",
  "rollingSummary",
  "isPrintPage",
  "isPrintSliceSummary",
  "isPrintRollingSummary"
 ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      filePath,
      title,
      tStamp,
      narrator,
      pageNum,
      sliceSize,
      rollingSummary,
      isPrintPage,
      isPrintSliceSummary,
      isPrintRollingSummary
    ]
  );
}

// export function saveSubloop(quiz, grade) {
//   const stmt = db.prepare("insert into quizzes values ()");
//   const allBookmarks = stmt.all(limit);
//   return allBookmarks;
// }

// return {  };
