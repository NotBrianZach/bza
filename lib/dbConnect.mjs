import pg from "pg";
import { devLog } from "./utils.mjs";
const { Pool } = pg;
import fs from "fs";

devLog("postgres url", process.env.PGURL);
const pool = new Pool({
  connectionString: process.env.PGURL,
  connectionTimeoutMillis: 2000 // 2 seconds
});

pool.on("connect", client => {
  client.on("query", stmt => {
    fs.writeFileSync(
      `${process.env.DB_PATH}.log`,
      `${stmt.text}\n`,
      { flag: "a+" },
      err => {
        if (err) {
          devLog("error writing to db log", err);
        }
      }
    );
  });
});

export default pool;
