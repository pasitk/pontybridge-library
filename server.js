const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const db = require("./data");
const path = require("path")

const router = express.Router();
const bodyParser = require('body-parser');
const methodOverride = require('method-override')

let authorsRouter = require("./routes/authors");
let booksRouter = require("./routes/books");
let usersRouter = require("./routes/users");
let loansRouter = require("./routes/loans");
let searchRouter = require("./routes/search");

let server = express();

// interpret JSON body of requests
server.use(express.json());

// interpret url-encoded queries
server.use(express.urlencoded({ extended: false }));

// allow CORS
server.use(cors());

// allow CORS preflight for all routes
server.options("*", cors());

server.use("/authors", authorsRouter);
server.use("/books", booksRouter);
server.use("/users", usersRouter);
server.use("/loans", loansRouter);
server.use("/search", searchRouter);

// Add new routes : Index page and header part
// and make folder public contains html, css, and some .js files.
server.use('/', router);
server.use(express.static('public'))

server.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + "/index.html"));
});

server.get('/header', function (req, res) {
    res.sendFile(path.join(__dirname + "/header.html"));
});
// End of new routes

// handle errors last
server.use(function(err, req, res, next) {
    res.status = err.status || 500;
    res.send(err);
});

// connect to the database and start the server running
db.initialiseDatabase(false, null);
const port = process.env.PORT || 3000;
server.listen(port, function() {
    console.log("server listening");
});
