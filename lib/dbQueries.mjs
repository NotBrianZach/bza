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
  if (tStamp === undefined) {
    stmt = db.prepare(
      "SELECT * FROM bookmarks where bTitle=? order by tStamp limit 1"
    );
    const bookmark = stmt.get(bTitle);
  } else {
    stmt = db.prepare("SELECT * FROM bookmarks where bTitle=? and tStamp = ?");
    bookmark = stmt.get(bTitle, tStamp);
  }
  devLog("bookmark loaded", bookmark);
  return bookmark;
}

export function loadMDTable(bTitle) {
  const stmt = db.prepare(
    "SELECT * FROM md where bTitle=? order by tStamp limit 1"
  );
  const pdfTable = stmt.get(bTitle);
  console.log("pdfTable", pdfTable);
  return pdfTable;
}

export function insertMD(
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
  filePath,
  articleType
) {
  return db
    .prepare(
      `insert into md (bTitle, tStamp,
  charPerPage,
  articleType
 ) values (?,?,?,?)`
    )
    .run(title, tStamp, filePath, articleType);
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
  filePath,
  isImage
) {
  const stmt = db.prepare(`insert into bookmarks  (bTitle, tStamp,
  title,
  synopsis,
  narrator,
  pageNum,
  chunkSize,
  rollingSummary,
  isPrintPage,
  isPrintChunkSummary,
  isPrintRollingSummary
 ) values (?,?,?,?,?,?,?,?,?,?,?)`);
  return stmt.run(
    title,
    tStamp,
    title,
    synopsis,
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
