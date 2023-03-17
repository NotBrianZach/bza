import db from "./dbConnect.mjs";

export function loadBookmarks(limit) {
  const stmt = db.prepare("SELECT * FROM bookmarks order by tStamp limit ?");
  const allBookmarks = stmt.all(limit);
  return allBookmarks;
}

export function loadBookmark(bTitle) {
  const stmt = db.prepare(
    "SELECT * FROM bookmarks where bTitle=? order by tStamp limit 1"
  );
  const bookmark = stmt.get(bTitle);
  console.log("bookmark", bookmark);
  return bookmark;
}

export function insertPDF(
  title,
  tStamp,
  synopsis,
  narrator,
  chunkSize,
  rollingSummary,
  isPrintPage,
  isPrintChunkSummary,
  isPrintRollingSummary,
  filePath,
  isImage
) {
  const stmt0 = db.prepare(`insert into pdfs (bTitle, tStamp,
  filePath,
  isImage
 ) values (?,?,?,?)`);
  stmt0.run(title, tStamp, filePath, isImage);
  const stmt = db.prepare(`insert into bookmarks  (bTitle, tStamp,
  title,
  synopsis,
  narrator,
  chunkSize,
  rollingSummary,
  isPrintPage,
  isPrintChunkSummary,
  isPrintRollingSummary
 ) values (?,?,?,?,?,?,?,?,?,?)`);
  return stmt.run(
    title,
    tStamp,
    title,
    synopsis,
    narrator,
    chunkSize,
    rollingSummary,
    isPrintPage,
    isPrintChunkSummary,
    isPrintRollingSummary
  );
}

export function saveQuiz(quiz, grade) {
  const stmt = db.prepare("insert into quizzes values ()");
  const allBookmarks = stmt.all(limit);
  return allBookmarks;
}

// return {  };
