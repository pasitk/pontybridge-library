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
// 1. 'Add a user' page
router.get("/add", function (req, res) {
    res.sendFile(path.join(path.normalize(__dirname + '/..') + "/users/add.html"));
    if (isRealValue(req.query.msg)) {
        var msg = req.query.msg;
        var newQuery = (msg != "") ? "?msgDisplay="+msg : "";
        if (isRealValue(req.query.msgType)){
            var msgType = req.query.msgType;
            newQuery += (msgType != "") ? "&msgType="+msgType : "";
        }
        res.redirect("/users/add" + newQuery);
    }
});

// 2. 'Edit User Detail' Page
router.get("/edit", function (req, res) {
    res.sendFile(path.join(path.normalize(__dirname + '/..') + "/users/edit.html"));
    var newQuery = "?id="+req.query.userID;
    if (isRealValue(req.query.msg)) {
        var msg = req.query.msg;
        var newQuery = (msg != "") ? "&msgDisplay="+msg : "";
        if (isRealValue(req.query.msgType)){
            var msgType = req.query.msgType;
            newQuery += (msgType != "") ? "&msgType="+msgType : "";
        }
        res.redirect("/users/edit" + newQuery);
    }
});

// 3. 'View All Users' Page
router.get("/view-all", function (req, res) {
    res.sendFile(path.join(path.normalize(__dirname + '/..') + "/users/view-all.html"));
    if (isRealValue(req.query.msg)) {
        var msg = req.query.msg;
        var newQuery = (msg != "") ? "?msgDisplay="+msg : "";
        if (isRealValue(req.query.msgType)){
            var msgType = req.query.msgType;
            newQuery += (msgType != "") ? "&msgType="+msgType : "";
        }
        res.redirect("/users/view-all" + newQuery);
    }
});
// End: Route for created page

router.get("/", function(req, res) {
    db.User.findAll().then(function(users) {
        ret.json(users, res);
    });
});

router.get("/:userID", function(req, res) {
    db.User.findByPk(req.params.userID).then(function(user) {
        if (user) {
            ret.json(user, res);
        } else {
            res.end();
        }
    });
});

//Editted API
//to include book data when retrieve loans list
router.get("/:userID/loans", function(req, res) {
    db.Loan.findAll({
        where: { userId: req.params.userID },
        include: [ { model: db.Book } ]
    }).then(function(loans) {
        ret.json(loans, res);
    });
});

//Newly Added API
//get loans list (with book data), filter only the loans which the boos are not returned 
router.get("/:userID/loans/not-returned", function(req, res) {
    db.Loan.findAll({
        where: { userId: req.params.userID, returned: false },
        include: [ { model: db.Book } ]
    }).then(function(loans) {
        ret.json(loans, res);
    });
});

//Editted API : Making a loan
//add process of checking remaining book copies before allow making a loan
//set 'returned' flag to be false as an initial state for every loans
router.post("/:userID/loans/:bookID", function(req, res) {
    //Find the user first
    db.User.findByPk(req.params.userID).then(function(user) {
        if (user) {
            //Followed by finding book
            db.Book.findByPk(req.params.bookID).then(function(book) {
                if (book) {
                    //If the book found, count the number of book copies which are loaned 
                    db.Loan.findAndCountAll({
                        where: { BookId: req.params.bookID, returned: false },
                        include: [ { model: db.Book }, { model: db.User } ]
                    }).then(function(loans) {
                        //And check if user has already loaned that book
                        //which means this transaction will become a due date changing instead
                        var alreadyLoaned = false;
                        for (var i = 0; i < loans.rows.length; i++) {
                            if (loans.rows[i].UserId == req.params.userID) {
                                alreadyLoaned = true;
                            }
                        }
                        //If there is no book copy left, just inform user and send user back to 'making a loan' page
                        if (loans && loans.count >= book.noOfCopies && !alreadyLoaned) {
                            const query = querystring.stringify({
                                "msg": "Error: Sorry, no copies of this book left for loaning now.",
                                "msgType": "fail"
                            });
                            res.redirect("/loans/make-a-loan?"+query);
                        } else {
                            //If due date changing or loan making is possible, do it.
                            //Then redirect user back to 'view loans by user' page.
                            db.Loan.findOrCreate({
                                where: { UserId: req.params.userID, BookId: req.params.bookID, returned: false }
                            }).spread(function(loan, created) {
                                loan.dueDate = new Date(req.body.dueDate);
                                loan.returned = false;
                                loan.save().then(function(loan) {
                                    var resultMsg = "";
                                    if (created) {
                                        resultMsg = "This book is loaned successfully! [ User : "+user.name+" ("+user.memberType+") / Book : "+book.title+" / Due Date : "+req.body.dueDate+" ]";
                                    } else {
                                        resultMsg = "This book's due date has changed successfully! [ User : "+user.name+" ("+user.memberType+") / Book : "+book.title+" / New Due Date : "+req.body.dueDate+" ]";
                                    }
                                    const query = querystring.stringify({
                                        "msg": resultMsg,
                                        "msgType": "success",
                                        "barcode": user.barcode
                                    });
                                    res.redirect("/loans/view-by-user?"+query);
                                });
                            });
                        }
                    });
                }
            });
        } else {
            //If user not found, redirect back to 'making a loan' page.
            const query = querystring.stringify({
                "msg": "Error: User not found, please try again.",
                "msgType": "fail"
            });
            res.redirect("/loans/make-a-loan?"+query);
        }
    });
});

//Editted API : add a new user
//add redirect process after adding success or fail.
router.post("/", function(req, res) {
    db.User.create({
        name: req.body.name,
        barcode: req.body.barcode,
        memberType: req.body.memberType
    }).then(function(user) {
        const query = querystring.stringify({
            "msg": "Add a new user successfully! [ Name : "+user.name+", Barcode : "+user.barcode+", Type : "+user.memberType+" ]",
            "msgType": "success"
        });
        res.redirect("/users/view-all?"+query);
    }).catch(function(error) {
        console.log(error);
        const query = querystring.stringify({
            "msg": "Add a new user failed! Please try again.",
            "msgType": "fail"
        });
        res.redirect("/users/add?"+query);
    });
});

//Editted API : edit user's detail
//add redirect process after editing success or fail.
router.put("/:userID", function(req, res) {
    db.User.findByPk(req.params.userID).then(function(user) {
        if (user) {
            (user.name = req.body.name),
            (user.barcode = req.body.barcode),
            (user.memberType = req.body.memberType),
            user.save().then(function(user) {
                const query = querystring.stringify({
                    "msg": "Edit user's detail successfully! [ Name : "+user.name+", Barcode : "+user.barcode+", Type : "+user.memberType+" ]",
                    "msgType": "success"
                });
                res.redirect("/users/view-all?"+query);
            });
        } else {
            const query = querystring.stringify({
                "msg": "Error: User ID "+req.params.userID+" not found, cannot edit user's data.",
                "msgType": "fail"
            });
            res.redirect("/users/view-all?"+query);
        }
    }).catch(function(error) {
        console.log(error);
        const query = querystring.stringify({
            "msg": "Some errors happened! Please check the result of your transaction. If fail, please try again.",
            "msgType": "fail"
        });
        res.redirect("/users/view-all?"+query);
    });
});

//Editted API : delete a user
//to delete all loans of that user after deleting
//and redirect process after deleting success or fail.
router.delete("/:userID", function(req, res) {
    db.User.findByPk(req.params.userID)
        .then(function(user) {
            if (user) {
                user.destroy();                         // Delete user
                db.Loan.destroy({                       // Delete loans of that user
                    where: {
                        userId: req.params.userID
                    }
                }).then(() => {
                    const query = querystring.stringify({
                        "msg": "Delete user successfully! [ Name : "+user.name+", Barcode : "+user.barcode+", Type : "+user.memberType+" ]",
                        "msgType": "success"
                    });
                    res.redirect("/users/view-all?"+query);
                });
            } else {
                const query = querystring.stringify({
                    "msg": "Error: User ID "+req.params.userID+" not found, cannot delete this user.",
                    "msgType": "fail"
                });
                res.redirect("/users/view-all?"+query);
            }
        }).catch(function(error) {
            console.log(error);
            const query = querystring.stringify({
                "msg": "Some errors happened! Please check the result of your transaction. If fail, please try again.",
                "msgType": "fail"
            });
            res.redirect("/users/view-all?"+query);
        });
});

module.exports = router;
