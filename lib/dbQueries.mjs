import Database from "better-sqlite3";

const db = new Database("./bookmarks.sq3", {
  // fileMustExist: true,
  timeout: 2000 // 2 seconds
  // verbose: sqlstatement => console.log(`sqlite3 trace ${sqlstatement}`)
});
db.pragma("journal_mode = WAL");
