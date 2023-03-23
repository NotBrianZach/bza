import { ink } from "ink-mde";
import express from "express";
const app = express();
import fs from "fs";

const logStream = fs.createWriteStream("server.log", { flags: "a" }); // create a writable stream to the file

// redirect console output to the file
console.log = function(data) {
  logStream.write(data + "\n");
};

// use the middleware to log requests to the file
app.use((req, res, next) => {
  const logEntry = `${new Date().toISOString()} - ${req.method} ${req.url}`;
  console.log(logEntry);
  next();
});

// const PORT = process.env.PORT || 3000;

// Serve static files
// app.use(express.static(path.join(__dirname, '.')));

// // Route to serve the HTML file
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'index.html'));
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// The only requirement is an HTML element.
// ink(document.getElementById('editor'))
app.get("/", function(req, res) {
  console.log("server get /");
  fs.readFile("ink.html", inkFile => {
    res.send(inkFile);
  });
});

// start the server
app.listen(8675, () => {
  console.log("Server started on port 8675");
});
