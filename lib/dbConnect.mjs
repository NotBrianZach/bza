import Database from "better-sqlite3";
import { devLog } from "./utils.mjs";
import fs from "fs";

// devLog("db path", process.env.DB_PATH);
const db = new Database(`${process.env.DB_PATH}`, {
  verbose: stmt => {
    fs.writeFileSync(
      `${process.env.DB_PATH}.log`,
      `${stmt}\n`,
      { flag: "a+" },
      err => {
        if (err) {
          devLog("error writing to db log", err);
        }
      }
    );
  },
  timeout: 2000 // 2 seconds
});
db.pragma("journal_mode = WAL");
export default db;
