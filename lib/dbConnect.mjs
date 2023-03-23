import Database from "better-sqlite3";
import { devLog } from "./utils.mjs";

devLog("db path", process.env.DB_PATH);
const db = new Database(`${process.env.DB_PATH}`, {
  verbose: console.log,
  timeout: 2000 // 2 seconds
});
db.pragma("journal_mode = WAL");
export default db;
