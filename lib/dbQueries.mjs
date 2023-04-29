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
      error: `poolQuery sql execution error ${err}`,
      msg: `statement:  ${statement}, args: ${args}`
    };
  }
}

function keyReplacer(obj, keyReplacements) {
  // var obj = {foo: 'bar', baz: 'qux', abc: 'def'};

  // var keyReplacements = {foo: 'newFoo', abc: 'newAbc'};

  return _.mapObject(obj, function(value, key) {
    if (keyReplacements[key]) {
      return keyReplacements[key];
    } else {
      return key;
    }
  });

  // console.log(newObj); // {newFoo: 'bar', baz: 'qux', newAbc: 'def'}
}

async function poolQueryFirstRow(statement, args) {
  devLog(`poolQueryFirstRow: ${statement}, ${args}`);
  try {
    const res = await pool.query(statement, args);
    devLog(`poolQueryFirstRow res: ${JSON.stringify(res)}`);
    return res.rows[0];
  } catch (err) {
    throw {
      error: `poolQueryFirstRow, sql execution error ${err}`,
      msg: `statement:  ${statement}, args: ${args}`
    };
  }
}

function buildInsertQuery({
  tableOperationString,
  afterTableOperationString,
  argObject
}) {
  const queryArgs = Object.keys(argObject);
  const queryValues = Object.values(argObject);
  // queryArgs, queryValues
  const filteredQueryValues = queryValues.filter(
    val => val !== null && val !== undefined && val !== ""
  );
  const filteredQueryArgs = queryArgs.filter(
    key =>
      argObject[key] !== null &&
      argObject[key] !== undefined &&
      argObject[key] !== ""
  );

  const builtInsertQuery = `${tableOperationString} (
  ${filteredQueryArgs.map(val => `"${val}"`).join(", ")}
) values (${filteredQueryArgs
    .map((_, i) => "$" + (i + 1))
    .join(", ")}) ${afterTableOperationString}`;

  return { builtInsertQuery, filteredQueryValues };
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

export async function loadMarkdownDataFromDBWithFilepath(filePath) {
  return await poolQueryFirstRow(`SELECT * FROM markdown where "filePath"=$1`, [
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
  return await poolQueryFirstRow(
    `insert or replace into markdown (
  "filePath",
  title,
  "createdTStamp",
  "articleType"
 ) values ($1,$2,$3,$4)`,
    [filePath, title, tStamp, articleType]
  );
}

export async function insertBookmark({
  filePath,
  bTitle,
  tStamp,
  synopsis,
  pageNum = 0,
  narrator,
  sliceSize = 2,
  rollingSummary,
  isPrintPage,
  isPrintSliceSummary,
  isPrintRollingSummary
}) {
  devLog("insertBookmark args", arguments);

  const queryObj = buildInsertQuery({
    tableOperationString: "insert into bookmarks",
    afterTableOperationString: "on conflict do nothing",
    argObject: keyReplacer(arguments[0], { title: "bTitle" })
  });

  return await poolQueryFirstRow(
    queryObj.builtInsertQuery,
    queryObj.filteredQueryValues
  );
}

async function getSubloopConfigs(subloopName) {
  const result = await poolQuery("SELECT name, description FROM quiz_configs");
  return result.rows;
}

// export async function insertBookmark({
//   filePath,
//   title,
//   synopsis,
//   pageNum = 0,
//   narrator,
//   sliceSize = 2,
//   rollingSummary,
//   isPrintPage,
//   isPrintSliceSummary,
//   isPrintRollingSummary
// }) {
//   devLog("insertBookmark args", arguments);

//   const queryObj = buildInsertQuery(
//     "insert into bookmarks",
//     "on conflict do nothing",
//     {
//       ...arguments[0],
//       title: undefined,
//       bTitle: arguments[0].title
//     }
//   );

//   return await poolQueryFirstRow(
//     queryObj.builtQuery,
//     queryObj.filteredQueryValues
//   );
// }

// export function saveSubloop(quiz, grade) {
//   const stmt = db.prepare("insert into quizzes values ()");
//   const allBookmarks = stmt.all(limit);
//   return allBookmarks;
// }

// return {  };
