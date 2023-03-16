import db from "./dbConnect.mjs";

export function loadBookmarks(limit) {
  const stmt = db.prepare("SELECT * FROM bookmarks order by tStamp limit ?");
  const allBookmarks = stmt.all(limit);
  return allBookmarks;
}

export async function loadBookmark(bTitle) {
  const stmt = db.prepare(
    "SELECT * FROM bookmarks where bTitle=? order by tStamp limit 1"
  );
  const bookmark = await stmt.get(bTitle);
  return bookmark;
}

export function saveQuiz(quiz, grade) {
  const stmt = db.prepare("insert into quizzes values ()");
  const allBookmarks = stmt.all(limit);
  return allBookmarks;
}

// return {  };
