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
// 1. 'Add a loan' page
router.get("/make-a-loan", function (req, res) {
    res.sendFile(path.join(path.normalize(__dirname + '/..') + "/loans/add.html"));
    var hasInitParam = false;
    var newQuery = "";
    //This function also receive preset barcode, isbn, and dueDate
    //to set in the form, support changing due date of existing loan in the same page as making a new loan
    if (isRealValue(req.query.barcode)){
        var barcode = req.query.barcode;
        newQuery += (barcode != "") ? "?barcode="+barcode : "";
        hasInitParam = true;
    }
    if (isRealValue(req.query.isbn)){
        var isbn = req.query.isbn;
        if (hasInitParam) {
            newQuery += (msg != "") ? "&isbn="+isbn : "";
        } else {
            newQuery += (msg != "") ? "?isbn="+isbn : "";
            hasInitParam = true;
        }
    }
    if (isRealValue(req.query.dueDate)){
        var dueDate = req.query.dueDate;
        if (hasInitParam) {
            newQuery += (msg != "") ? "&dueDate="+dueDate : "";
        } else {
            newQuery += (msg != "") ? "?dueDate="+dueDate : "";
            hasInitParam = true;
        }
    }
    if (isRealValue(req.query.msg)) {
        var msg = req.query.msg;
        if (hasInitParam) {
            newQuery += (msg != "") ? "&msgDisplay="+msg : "";
        } else {
            newQuery += (msg != "") ? "?msgDisplay="+msg : "";
        }
        if (isRealValue(req.query.msgType)){
            var msgType = req.query.msgType;
            newQuery += (msgType != "") ? "&msgType="+msgType : "";
        }
        res.redirect("/loans/make-a-loan" + newQuery);
    }
});

// 2. 'Get a user’s current loan list or loan history' page
router.get("/view-by-user", function (req, res) {
    res.sendFile(path.join(path.normalize(__dirname + '/..') + "/loans/view-by-user.html"));
    var hasBarcode = false;
    var newQuery = "";
    //This function also receive preset barcode when we finished loan making or loan due date changing process (which previous step is from this page) and redirect to this page again
    //The barcode will be input in the search bar, and loan list or loan history of that user will be appeared automatically.
    if (isRealValue(req.query.barcode)){
        var barcode = req.query.barcode;
        newQuery += (barcode != "") ? "?barcode="+barcode : "";
        hasBarcode = true;
    }
    if (isRealValue(req.query.msg)) {
        var msg = req.query.msg;
        if (hasBarcode) {
            newQuery += (msg != "") ? "&msgDisplay="+msg : "";
        } else {
            newQuery += (msg != "") ? "?msgDisplay="+msg : "";
        }
        if (isRealValue(req.query.msgType)){
            var msgType = req.query.msgType;
            newQuery += (msgType != "") ? "&msgType="+msgType : "";
        }
        res.redirect("/loans/view-by-user" + newQuery);
    }
});

// 3. 'Get user currently borrowing or borrowed a book' page
router.get("/view-by-book", function (req, res) {
    res.sendFile(path.join(path.normalize(__dirname + '/..') + "/loans/view-by-book.html"));
    var hasIsbn = false;
    var newQuery = "";
    //This function also receive preset isbn when we finished loan due date changing process (which previous step is from this page) and redirect to this page again
    //The isbn will be input in the search bar, and loan list or loan history of that book will be appeared automatically.
    if (isRealValue(req.query.isbn)){
        var isbn = req.query.isbn;
        newQuery += (isbn != "") ? "?isbn="+isbn : "";
        hasIsbn = true;
    }
    if (isRealValue(req.query.msg)) {
        var msg = req.query.msg;
        if (hasIsbn) {
            newQuery += (msg != "") ? "&msgDisplay="+msg : "";
        } else {
            newQuery += (msg != "") ? "?msgDisplay="+msg : "";
        }
        if (isRealValue(req.query.msgType)){
            var msgType = req.query.msgType;
            newQuery += (msgType != "") ? "&msgType="+msgType : "";
        }
        res.redirect("/loans/view-by-book" + newQuery);
    }
});
// End: Route for created page

router.get("/", function(req, res) {
    db.Loan.findAll().then(function(loans) {
        ret.json(loans, res);
    });
});

router.get("/:loanID", function(req, res) {
    db.Loan.findByPk(req.params.loanID).then(function(loan) {
        if (loan) {
            ret.json(loan, res);
        } else {
            res.end();
        }
    });
});

//Newly Added API
//API: get all loans of a book, defined by book ID
router.get("/books/:bookID", function(req, res) {
    db.Loan.findAndCountAll({
        where: { BookId: req.params.bookID },
        include: [ { model: db.Book }, { model: db.User } ]
    }).then(function(loans) {
        if (loans) {
            ret.json(loans, res);
        } else {
            res.end();
        }
    });
});

//API: get all loans of a book (which are not returned), defined by book ID
router.get("/books/:bookID/not-returned", function(req, res) {
    db.Loan.findAndCountAll({
        where: { BookId: req.params.bookID, returned: false },
        include: [ { model: db.Book }, { model: db.User } ]
    }).then(function(loans) {
        if (loans) {
            ret.json(loans, res);
        } else {
            res.end();
        }
    });
});

//API: return the book by loan ID
//and redirect back to the previous page (View loans of a user, View users borrowing/borrowed a book) by checking header
router.put("/:loanID/return", function(req, res) {
    db.Loan.findByPk(req.params.loanID).then(function(loan) {
        if (loan) {
            loan.returned = true;
            loan.save().then(function(loan) {
                var dueDate = loan.dueDate.toDateString().substring(4);
                if (req.headers.referer.indexOf('view-by-book') != -1) {
                    const query = querystring.stringify({
                        "msg": "The book has returned successfully! [ Title : "+req.body.book+", Due Date : "+dueDate+", User : "+req.body.user+" ]",
                        "msgType": "success",
                        "isbn": req.body.isbn
                    });
                    res.redirect("/loans/view-by-book?"+query);
                } else {
                    const query = querystring.stringify({
                        "msg": "The book has returned successfully! [ Title : "+req.body.book+", Due Date : "+dueDate+", User : "+req.body.user+" ]",
                        "msgType": "success",
                        "barcode": req.body.barcode
                    });
                    res.redirect("/loans/view-by-user?"+query);
                }
            });
        } else {
            if (req.headers.referer.indexOf('view-by-book') != -1) {
                const query = querystring.stringify({
                    "msg": "Error: This loan not found, cannot return the book.",
                    "msgType": "fail",
                    "isbn": req.body.isbn
                });
                res.redirect("/loans/view-by-book?"+query);
            } else {
                const query = querystring.stringify({
                    "msg": "Error: This loan not found, cannot return the book.",
                    "msgType": "fail",
                    "barcode": req.body.barcode
                });
                res.redirect("/loans/view-by-user?"+query);
            }
        }
    }).catch(function(error) {
        console.log(error);
        if (req.headers.referer.indexOf('view-by-book') != -1) {
            const query = querystring.stringify({
                "msg": "Some errors happened! Please check the result of your transaction. If fail, please try again.",
                "msgType": "fail",
                "isbn": req.body.isbn
            });
            res.redirect("/loans/view-by-book?"+query);
        } else {
            const query = querystring.stringify({
                "msg": "Some errors happened! Please check the result of your transaction. If fail, please try again.",
                "msgType": "fail",
                "barcode": req.body.barcode
            });
            res.redirect("/loans/view-by-user?"+query);
        }
    });
});
//End of added API

//Editted API
//set a new due date to a loan, editted by set attribute 'returned' to be false
router.put("/:loanID", function(req, res) {
    db.Loan.findByPk(req.params.loanID).then(function(loan) {
        if (loan) {
            loan.dueDate = new Date(req.body.dueDate);
            loan.returned = false;
            loan.save().then(function(loan) {
                ret.json(loan, res);
            });
        } else {
            res.end();
        }
    });
});

//Editted API
//Delete a loan
//and redirect back to the previous page (View loans of a user, View users borrowing/borrowed a book) by checking header
router.delete("/:loanID", function(req, res) {
    db.Loan.findByPk(req.params.loanID)
        .then(function(loan) {
            if (loan) {
                loan.destroy();
                var dueDate = loan.dueDate.toDateString().substring(4);
                if (req.headers.referer.indexOf('view-by-book') != -1) {
                    const query = querystring.stringify({
                        "msg": "Delete loan successfully! [ Title : "+req.body.book+", Due Date : "+dueDate+", User : "+req.body.user+" ]",
                        "msgType": "success",
                        "isbn": req.body.isbn
                    });
                    res.redirect("/loans/view-by-book?"+query);
                } else {
                    const query = querystring.stringify({
                        "msg": "Delete loan successfully! [ Title : "+req.body.book+", Due Date : "+dueDate+", User : "+req.body.user+" ]",
                        "msgType": "success",
                        "barcode": req.body.barcode
                    });
                    res.redirect("/loans/view-by-user?"+query);
                }
            } else {
                if (req.headers.referer.indexOf('view-by-book') != -1) {
                    const query = querystring.stringify({
                        "msg": "Error: This loan not found, cannot delete this loan.",
                        "msgType": "fail",
                        "isbn": req.body.isbn
                    });
                    res.redirect("/loans/view-by-book?"+query);
                } else {
                    const query = querystring.stringify({
                        "msg": "Error: This loan not found, cannot delete this loan.",
                        "msgType": "fail",
                        "barcode": req.body.barcode
                    });
                    res.redirect("/loans/view-by-user?"+query);
                }
            }
        })
        .catch(function(error) {
            console.log(error);
            if (req.headers.referer.indexOf('view-by-book') != -1) {
                const query = querystring.stringify({
                    "msg": "Some errors happened! Please check the result of your transaction. If fail, please try again.",
                    "msgType": "fail",
                    "isbn": req.body.isbn
                });
                res.redirect("/loans/view-by-book?"+query);
            } else {
                const query = querystring.stringify({
                    "msg": "Some errors happened! Please check the result of your transaction. If fail, please try again.",
                    "msgType": "fail",
                    "barcode": req.body.barcode
                });
                res.redirect("/loans/view-by-user?"+query);
            }
        });
});

module.exports = router;
