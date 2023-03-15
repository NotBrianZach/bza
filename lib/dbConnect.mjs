import Database from "better-sqlite3";
const db = new Database("./bookmarks.sq3", {
  timeout: 2000 // 2 seconds
});
db.pragma("journal_mode = WAL");
export default db;
