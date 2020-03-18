const path = require("path");
const Sequelize = require("sequelize");

const dataDir = path.join(__dirname, "data");

// initialise a database connection
const sequelize = new Sequelize("libraryDB", null, null, {
    dialect: "sqlite",
    storage: "data/library.sqlite"
});

// connect to the database
sequelize.authenticate().then(
    function() {
        console.log("Connection has been established successfully.");
    },
    function(err) {
        console.log("Unable to connect to the database:", err);
    }
);

//  MODELS

// Author has a Name
const Author = sequelize.define("Author", {
    name: Sequelize.STRING
});

// Book has a Title and an ISBN number
// Editted : add 'noOfCopies' (number of copies) to each book to make a book to be able to have more than 1 copy.
const Book = sequelize.define("Book", {
    title: Sequelize.STRING,
    isbn: Sequelize.STRING,
    noOfCopies: Sequelize.INTEGER
});

// Book has one or more Authors
Book.belongsToMany(Author, { through: "author_books" });
// Author has written one or more Books
Author.belongsToMany(Book, { through: "author_books" });

// User has a Name, a Barcode and a MemberType (which can be Staff or Student)
const User = sequelize.define("User", {
    name: Sequelize.STRING,
    barcode: Sequelize.STRING,
    memberType: Sequelize.ENUM("Staff", "Student")
});

// Loan has a DueDate
// Editted : add 'returned' flag to each loan to make the loan can be kept after book returning, without deleting that loan.
const Loan = sequelize.define("Loan", {
    dueDate: Sequelize.DATE,
    returned: Sequelize.BOOLEAN
});

// A User can have many Loans
User.hasMany(Loan, { as: "Loans" });
Loan.belongsTo(User);
// Editted relationship : A Book can have many Loans (but one copy per one loan)
Book.hasMany(Loan, { as: "Loans" });
Loan.belongsTo(Book);

//  SYNC SCHEMA
const initialiseDatabase = function(wipeAndClear, repopulate) {
    sequelize.sync({ force: wipeAndClear }).then(
        function() {
            console.log("Database Synchronised");
            if (repopulate) {
                repopulate();
            }
        },
        function(err) {
            console.log("An error occurred while creating the tables:", err);
        }
    );
};

module.exports = {
    initialiseDatabase,
    Author,
    Book,
    User,
    Loan
};
