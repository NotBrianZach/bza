import { ink } from "ink-mde";
import express from "express";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
export const app = express();
const server = createServer(app);
export const io = new Server(server);

io.on("connection", socket => {
  console.log("A user connected");

  socket.on("message", data => {
    console.log("Message received:", data);
    socket.broadcast.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const logStream = fs.createWriteStream("server.log", { flags: "a" }); // create a writable stream to the file

// redirect console output to the file
function serverLog(data) {
  logStream.write(data + "\n");
}

function serverLogError(data) {
  logStream.write("error" + data + "\n");
}

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

// Update the server's socket.io connection to handle the 'requestMarkdown' event
io.on("connection", socket => {
  console.log("A user connected");

  socket.on("markdown", data => {
    io.emit("markdown", data);
  });

  // Add this event listener
  socket.on("requestMarkdown", () => {
    io.emit("requestMarkdown", {});
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// start the server
app.listen(8675, () => {
  console.log("Server started on port 8675");
});
