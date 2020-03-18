const express = require("express");
const router = express.Router();

const db = require("../data");
const ret = require("../lib/return");
const path = require("path")
const querystring = require('querystring');

const bodyParser = require('body-parser');
const methodOverride = require('method-override');

//Use module 'method-override' to make 'PUT' and 'DELETE' request possible
//This code was adapted from Philip Mateescu's code
//accessed 23-12-2019
//https://philipm.at/2017/method-override_in_expressjs.html
router.use(methodOverride('_method'));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

//Function for checking real existence of object with not 'null' and not 'undefined'
//This code is from Stackoverflow.com answer by aquinas and John
//accessed 15-12-2019
//https://stackoverflow.com/questions/12535403/javascript-test-object-object-null-object-undefined
function isRealValue(obj) {
    return obj && obj !== 'null' && obj !== 'undefined';
}

//Routing for newly created page
//All these newly created routings use redirect() with a system message attachment, the message (if exist) will be shown in destination page
//This code is adapted from Stackoverflow.com answer by Marie Sajan and user272735
//accessed 11-12-2019
//https://stackoverflow.com/questions/32538193/express-res-sendfile-with-query-string
// 1. 'Add a book' page
router.get("/add", function (req, res) {
    res.sendFile(path.join(path.normalize(__dirname + '/..') + "/books/add.html"));
    if (isRealValue(req.query.msg)) {
        var msg = req.query.msg;
        var newQuery = (msg != "") ? "?msgDisplay="+msg : "";
        if (isRealValue(req.query.msgType)){
            var msgType = req.query.msgType;
            newQuery += (msgType != "") ? "&msgType="+msgType : "";
        }
        res.redirect("/books/add" + newQuery);
    }
});

// 2. 'Edit book detail' page
router.get("/edit", function (req, res) {
    res.sendFile(path.join(path.normalize(__dirname + '/..') + "/books/edit.html"));
    var newQuery = "?id="+req.query.bookID;
    if (isRealValue(req.query.msg)) {
        var msg = req.query.msg;
        var newQuery = (msg != "") ? "&msgDisplay="+msg : "";
        if (isRealValue(req.query.msgType)){
            var msgType = req.query.msgType;
            newQuery += (msgType != "") ? "&msgType="+msgType : "";
        }
        res.redirect("/books/edit" + newQuery);
    }
});

// 3. 'View all books' page
router.get("/view-all", function (req, res) {
    res.sendFile(path.join(path.normalize(__dirname + '/..') + "/books/view-all.html"));
    if (isRealValue(req.query.msg)) {
        var msg = req.query.msg;
        var newQuery = (msg != "") ? "?msgDisplay="+msg : "";
        if (isRealValue(req.query.msgType)){
            var msgType = req.query.msgType;
            newQuery += (msgType != "") ? "&msgType="+msgType : "";
        }
        res.redirect("/books/view-all" + newQuery);
    }
});
//End: Route for created page

router.get("/", function(req, res) {
    if (req.query.allEntities == "true") {
        db.Book.findAll({ include: [db.Author] }).then(function(books) {
            ret.json(books, res);
        });
    } else {
        db.Book.findAll().then(function(books) {
            ret.json(books, res);
        });
    }
});

router.get("/:bookID", function(req, res) {
    if (req.query.allEntities == "true") {
        db.Book.findByPk(req.params.bookID, { include: [db.Author] }).then(function(book) {
            if (book) {
                ret.json(book, res);
            } else {
                res.end();
            }
        });
    } else {
        db.Book.findByPk(req.params.bookID).then(function(book) {
            if (book) {
                ret.json(book, res);
            } else {
                res.end();
            }
        });
    }
});

//Edited API : create a new book with author(s)
router.post("/", function(req, res) {
    db.Book.create({ 
        title: req.body.title,
        isbn: req.body.isbn,
        noOfCopies: req.body.noOfCopies
    }).then(function(book) {
        //When finished creating a book record in database, just find that book again and create or/and add author(s) to that book
        //Then redirect to 'View all book' page
        db.Book.findByPk(book.id, { include: [db.Author] }).then(function(book) {
            if (book) {
                var allAuthors = req.body.authors.split(",");
                for (var i = 0; i < allAuthors.length; i++) {
                    db.Author.findCreateFind({ where: { name: allAuthors[i].trim() } }).spread(function(author, created) {
                        book.addAuthor(author);
                        book.reload();
                    });
                }
                const query = querystring.stringify({
                    "msg": "Add a new book successfully! [ Title : "+book.title+", ISBN : "+book.isbn+" ]",
                    "msgType": "success"
                });
                res.redirect("/books/view-all?"+query);
            } else {
                const query = querystring.stringify({
                    "msg": "Add a new book failed! Please try again.",
                    "msgType": "fail"
                });
                res.redirect("/books/add?"+query);
            }
        });
    }).catch(function(error) {
        console.log(error);
        const query = querystring.stringify({
            "msg": "Add a new book failed! Please try again.",
            "msgType": "fail"
        });
        res.redirect("/books/add?"+query);
    });;
});

//Edited API : add author(s) to a book
//Every authors' name will be in only one string using comma ',' as a delimeter
router.post("/:bookID/authors", function(req, res) {
    db.Book.findByPk(req.params.bookID, { include: [db.Author] }).then(function(book) {
        if (book) {
            var allAuthors = req.body.name.split(",");
            for (var i = 0; i < allAuthors.length; i++) {
                db.Author.findCreateFind({ where: { name: allAuthors[i].trim() } }).spread(function(author, created) {
                    book.addAuthor(author);
                    book.reload().then(function(book) {
                        if (i == allAuthors.length-1) {
                            ret.json(book, res);
                        }
                    });
                });
            }
        } else {
            res.end();
        }
    });
});

router.post("/:bookID/authors/:authorID", function(req, res) {
    db.Book.findByPk(req.params.bookID, { include: [db.Author] }).then(function(book) {
        if (book) {
            db.Author.findByPk(req.params.authorID).then(function(author) {
                if (author) {
                    book.addAuthor(author);
                    book.reload().then(function(book) {
                        ret.json(book, res);
                    });
                }
            });
        } else {
            res.end();
        }
    });
});

//Edited API : edit book's detail
//Every authors' name will be in only one string using comma ',' as a delimeter
router.put("/:bookID", function(req, res) {
    db.Book.findByPk(req.params.bookID).then(function(book) {
        if (book) {
            //Find the book first. If the book is not found, just redirect to 'View all book' page and display error to inform user.
            db.Loan.findAndCountAll({
                where: { BookId: req.params.bookID, returned: false },
                include: [ { model: db.Book }, { model: db.User } ]
            }).then(function(data) {
                //Due to new attribute 'noOfCopies' or number of copies of each book,
                //We have to prevent editing book detail if user is trying to decrease number of copies 
                //to be less than number of copies which are loaned in that time

                //If is can be edited, replace old attibute value with a new one
                if ((data.count == 0) || (data.count > 0 && data.count <= req.body.noOfCopies)) {
                    book.title = req.body.title;
                    book.isbn = req.body.isbn;
                    book.noOfCopies = req.body.noOfCopies;
                    book.setAuthors([]);
                    var allAuthors = req.body.authors.split(",");
                    var allAuthorsList = [];

                    //Add or/and create new authors and set these authors to the book, then save, and redirect to 'View all book' page 
                    var promises = allAuthors.map(function(authorName){
                        return db.Author.findCreateFind({ where: { name: authorName.trim() } }).spread(function(author, created) { 
                            allAuthorsList.push(author);
                        }).catch((error) => {
                            console.log(error);
                        });
                    });
                    Promise.all(promises).then(() => {
                        return book.setAuthors(allAuthorsList);
                    }).then(() => {
                        return book.save();
                    }).then(() => {
                        const query = querystring.stringify({
                            "msg": "Edit book's detail successfully! [ Title : "+book.title+", ISBN : "+book.isbn+", No. of Copies : "+book.noOfCopies+" ]",
                            "msgType": "success"
                        });
                        res.redirect("/books/view-all?"+query);
                    });
                } else {
                    const query = querystring.stringify({
                        "msg": "Error: Cannot edit '"+book.title+"' book's detail: There are "+data.count+" copies borrowed while the number you filled was less than "+data.count,
                        "msgType": "fail"
                    });
                    res.redirect("/books/view-all?"+query);
                }
            }).catch((error) => {
                console.log(error);
                const query = querystring.stringify({
                    "msg": "Some errors happened! Please check the result of your transaction. If fail, please try again.",
                    "msgType": "fail"
                });
                res.redirect("/books/view-all?"+query);
            })
        } else {
            const query = querystring.stringify({
                "msg": "Error: Book ID "+req.params.bookID+" not found, cannot edit book's data.",
                "msgType": "fail"
            });
            res.redirect("/books/view-all?"+query);
        }
    });
});

//Edited API : delete a book
//Delete the book before delete all loans of that book
router.delete("/:bookID", function(req, res) {
    //Find the book first. If the book is not found, just redirect to 'View all book' page and display error to inform user.
    db.Book.findByPk(req.params.bookID)
        .then(function(book) {
            if (book) {
                //Delete the book before delete all loans of that book
                book.destroy();
                db.Loan.destroy({
                    where: {
                        BookId: req.params.bookID
                    }
                }).then(() => {
                    const query = querystring.stringify({
                        "msg": "Delete book successfully! [ Title : "+book.title+", ISBN : "+book.isbn+" ]",
                        "msgType": "success"
                    });
                    res.redirect("/books/view-all?"+query);
                }).catch((error) => {
                    console.log(error);
                    const query = querystring.stringify({
                        "msg": "Some errors happened! Please check the result of your transaction. If fail, please try again.",
                        "msgType": "fail"
                    });
                    res.redirect("/books/view-all?"+query);
                });
            } else {
                const query = querystring.stringify({
                    "msg": "Error: Book ID "+req.params.bookID+" not found, cannot delete this book.",
                    "msgType": "fail"
                });
                res.redirect("/books/view-all?"+query);
            }
        }).catch(function(error) {
            const query = querystring.stringify({
                "msg": "Some errors happened! Please check the result of your transaction. If fail, please try again.",
                "msgType": "fail"
            });
            res.redirect("/books/view-all?"+query);
        });
});

module.exports = router;
