const express = require("express");
const router = express.Router();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const db = require("../data");
const ret = require("../lib/return");

//Editted function
//to make it support searching with 'Starts with (keyword)', 'Exactly Match with (keyword)' methods. 
function getSearchParams(queryParams, modelFields, searchMethod) {
    let searchParams = {};
    modelFields.forEach(function(p) {
        p = p.toLowerCase();
        if (queryParams[p]) {
            if (searchMethod.toLowerCase() === "startswith") {              // Starts with (keyword)
                searchParams[p] = {
                    [Op.like]: queryParams[p] + "%"
                };
            } else if (searchMethod.toLowerCase() === "exactlymatch") {     // Exactly Match with (keyword)
                searchParams[p] = {
                    [Op.eq]: queryParams[p]
                };
            } else {
                searchParams[p] = {
                    [Op.like]: "%" + queryParams[p] + "%"                   // Contains (keyword) - Original method provided
                };
            }
        }
    });
    console.log(searchParams);
    return searchParams;
}

//Editted function
//Make searching attributes different between books, authors, and users.
function findAll(model, params, res) {
    if (model == db.Book) {             //In case of book, include 'authors' data to make data requesting more simple.
        model.findAll({ where: params, include: [db.Author] } ).then(function(results) {
            if (results) {
                ret.json(results, res);
            } else {
                res.end();
            }
        });
    } else if (model == db.Author) {    //In case of author, include 'books (with that book's authors)' data to make data requesting more simple.
        model.findAll({ where: params, include: [ { model: db.Book , include: [ db.Author ] } ] } ).then(function(results) {
            if (results) {
                ret.json(results, res);
            } else {
                res.end();
            }
        });
    } else {                            //In case of user, just still be the same
        model.findAll({ where: params }).then(function(results) {
            if (results) {
                ret.json(results, res);
            } else {
                res.end();
            }
        });
    }
}

//Editted API
//to make searching support different types of search methods ('Starts with (keyword)', 'Exactly Match with (keyword)', 'Contains (Keyword)')
router.get("/", function(req, res) {
    if (req.query.type.toLowerCase() === "book") {
        findAll(db.Book, getSearchParams(req.query, ["title", "isbn"], req.query.searchMethod), res);
    } else if (req.query.type.toLowerCase() === "author") {
        findAll(db.Author, getSearchParams(req.query, ["name"], req.query.searchMethod), res);
    } else if (req.query.type.toLowerCase() === "user") {
        findAll(db.User, getSearchParams(req.query, ["name", "barcode", "memberType"], req.query.searchMethod), res);
    } else {
        res.end();
    }
});

module.exports = router;
