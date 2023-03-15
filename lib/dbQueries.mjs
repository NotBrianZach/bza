import db from "./dbConnect.mjs";

export function loadBookmarks(limit) {
  const stmt = db.prepare(
    "SELECT * FROM bookmarks order by last_read_tstamp limit ?"
  );
  const allBookmarks = stmt.all(limit);
  return allBookmarks;
}
