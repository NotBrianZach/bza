import db from "./dbConnect.mjs";
import { devLog } from "./utils.mjs";

export function loadBookmarksBy(orderBy, limit) {
  const stmt = db.prepare("SELECT * FROM bookmarks order by ? limit ?");
  const allBookmarks = stmt.all(orderBy, limit);
  return allBookmarks;
}

export function loadBookmark(bTitle, tStamp) {
  let stmt;
  let bookmark;
  if (bTitle === undefined) {
    return db.prepare("SELECT * FROM bookmarks order by tStamp limit 1").get();
  }
  if (tStamp === undefined) {
    return db
      .prepare("SELECT * FROM bookmarks where bTitle=? order by tStamp limit 1")
      .get(bTitle);
  }
  return db
    .prepare("SELECT * FROM bookmarks where bTitle=? and tStamp = ?")
    .get(bTitle, tStamp);
}

export function loadMDTable(filePath) {
  return db.prepare("SELECT * FROM md where filePath=?").get(filePath);
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
export function insertMD(
  filePath,
  title,
  synopsis,
  tStamp,
  articleType,
  pageNum
) {
  return db
    .prepare(
      `insert or replace into md (
  filePath,
  title,
  synopsis,
  createdTStamp,
  articleType
 ) values (?,?,?,?,?)`
    )
    .run(filePath, title, synopsis, tStamp, articleType);
  // charPerPage,
}

export function insertBookmark(
  title,
  tStamp,
  synopsis,
  narrator,
  pageNum,
  chunkSize,
  rollingSummary,
  isPrintPage,
  isPrintChunkSummary,
  isPrintRollingSummary,
  filePath
) {
  const stmt = db.prepare(`insert into bookmarks  (bTitle, tStamp,
  narrator,
  pageNum,
  chunkSize,
  rollingSummary,
  isPrintPage,
  isPrintChunkSummary,
  isPrintRollingSummary
 ) values (?,?,?,?,?,?,?,?,?)`);
  return stmt.run(
    title,
    tStamp,
    narrator,
    pageNum,
    chunkSize,
    rollingSummary,
    isPrintPage,
    isPrintChunkSummary,
    isPrintRollingSummary
  );
}

// export function saveSubloop(quiz, grade) {
//   const stmt = db.prepare("insert into quizzes values ()");
//   const allBookmarks = stmt.all(limit);
//   return allBookmarks;
// }

// return {  };
