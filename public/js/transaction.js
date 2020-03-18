//Function for checking real existence of object with not 'null' and not 'undefined'
//This code is from Stackoverflow.com answer by aquinas and John
//accessed 15-12-2019
//https://stackoverflow.com/questions/12535403/javascript-test-object-object-null-object-undefined
function isRealValue(obj) {
    return obj && obj !== 'null' && obj !== 'undefined';
}

//Get All Users' detail to display in 'All Users' Page
function getAllUsers(id) {
    fetch('/users', {
        method: 'GET'
    }).then((response) => {
        return response.json();
    }).then(function(data) {
        if (data.length == 0) {
            constructNoResultTable(id, '8');
        } else {
            constructUserTable(data, id);
        }
    }).catch((error) => {
        constructErrorUserTable(id);
        console.log("error : "+error);
    })
}

//Get All books' detail with authors to display in 'All books' Page
function getAllBooksWithAuthors(id) {
    fetch('/books?allEntities=true', {
        method: 'GET'
    }).then((response) => {
        return response.json();
    }).then(function(data) {
        if (data.length == 0) {
            constructNoResultTable(id, '9');
        } else {
            constructBookTable(data, id);
        }
    }).catch((error) => {
        constructErrorBookTable(id);
        console.log("error : "+error);
    })
}

//Search users by defined value (name, barcode) and search method (starts with, contains) and display those users' data in a table
function searchUsers(id) {
    var searchType = document.getElementById("searchType").value;
    var searchMethod = document.getElementById("searchMethod").value;
    var value = document.getElementById("search-users-box").value;
    clearTable(id);
    fetch('/search?type=user&'+searchType+'='+value+'&searchMethod='+searchMethod, {
        method: 'GET'
    }).then((response) => {
        return response.json();
    }).then(function(data) {
        if (data.length == 0) {
            constructNoResultTable(id, '8');
        } else {
            constructUserTable(data, id);
        }
    }).catch((error) => {
        constructErrorUserTable(id);
        console.log("error : "+error);
    })
}

//Search loans of a user by defined barcode, display user's data and display loans in a table
function getUserLoansByBarcode(divIdForUserDetail, tableIdForLoans) {
    var barcode = document.getElementById("search-users-box").value;
    var type = document.getElementById("searchType").value;
    var userDetailDiv = document.getElementById(divIdForUserDetail);
    userDetailDiv.innerHTML = "";
    userDetailDiv.classList.remove("success-text");
    userDetailDiv.classList.remove("warning-text");
    userDetailDiv.classList.remove("fail-text");

    var userId = -1;
    var userData = "";

    clearTable(tableIdForLoans);

    if (!isRealValue(barcode)) {
        userDetailDiv.innerHTML = "Please fill user's barcode first!";
        userDetailDiv.classList.add("fail-text");
        constructNoResultTable(tableIdForLoans, '10');
        return;
    }

    fetch('/search?type=user&barcode='+barcode+'&searchMethod=exactlyMatch', {
        method: 'GET'
    }).then((response) => {
        return response.json();
    }).then(function(data) {
        if (data.length == 0) {
            userDetailDiv.innerHTML = "Sorry, User not found!";
            userDetailDiv.classList.add("fail-text");
        } else {
            userDetailDiv.innerHTML = "User Found: " + data[0].name+" ("+data[0].memberType+")";
            userDetailDiv.classList.add("success-text");
            userId = data[0].id;
            userData = data[0].name+" ("+data[0].memberType+")";
        }
    }).catch((error) => {
        userDetailDiv.innerHTML = "Error: Finding user error!";
        userDetailDiv.classList.add("fail-text");
        console.log("error : "+error);
    }).then(() => {
        if(userId != -1) {
            var url = '/users/'+userId+'/loans';
            if (type == 'current') url += '/not-returned';
            fetch(url, {
                method: 'GET'
            }).then((response) => {
                return response.json();
            }).then(function(data) {
                if (data.length == 0) {
                    constructNoResultTable(tableIdForLoans, '10');
                } else {
                    constructLoanTable(data, userData, barcode, tableIdForLoans);
                }
            }).catch((error) => {
                constructErrorLoanTable(tableIdForLoans);
                console.log("error : "+error);
            })
        }
    })
}

//Search users who are borrowing or borrowed books by defined isbn and borrowing status, display book's data and display loans in a table
function getBookBorrowerByIsbn(divIdForBookDetail, tableIdForLoans) {
    var isbn = document.getElementById("search-books-box").value;
    var type = document.getElementById("searchType").value;
    var bookDetailDiv = document.getElementById(divIdForBookDetail);
    bookDetailDiv.innerHTML = "";
    bookDetailDiv.classList.remove("success-text");
    bookDetailDiv.classList.remove("warning-text");
    bookDetailDiv.classList.remove("fail-text");

    var bookId = -1;
    var bookTitle = '';

    clearTable(tableIdForLoans);

    if (!isRealValue(isbn)) {
        bookDetailDiv.innerHTML = "Please fill ISBN number first!";
        bookDetailDiv.classList.add("fail-text");
        constructNoResultTable(tableIdForLoans, '11');
        return;
    }

    fetch('/search?type=book&isbn='+isbn+'&searchMethod=exactlyMatch', {
        method: 'GET'
    }).then((response) => {
        return response.json();
    }).then(function(data) {
        if (data.length == 0) {
            bookDetailDiv.innerHTML = "Sorry, Book not found!";
            bookDetailDiv.classList.add("fail-text");
        } else {
            var authors = "";
            for (var i = 0; i < data[0].Authors.length; i++) {
                authors += data[0].Authors[i].name;
                if (i != data[0].Authors.length-1) {
                    authors += ", ";
                }
            }
            bookDetailDiv.innerHTML = "Book Found: " + data[0].title+" (Authors: "+authors+")";
            bookDetailDiv.classList.add("success-text");
            bookId = data[0].id;
            bookTitle = data[0].title;
        }
    }).catch((error) => {
        bookDetailDiv.innerHTML = "Error: Finding book error!";
        bookDetailDiv.classList.add("fail-text");
        console.log("error : "+error);
    }).then(() => {
        if(bookId != -1) {
            var url = "/loans/books/"+bookId;
            if (type == "current") url += "/not-returned" //Change API to search only loans which the books are not returned
            fetch(url, {
                method: 'GET'
            }).then((response) => {
                return response.json();
            }).then(function(data) {
                if (data.rows.length == 0) {
                    constructNoResultTable(tableIdForLoans, '11');
                } else {
                    constructBorrowerTable(data.rows, bookTitle, isbn, tableIdForLoans);
                }
            }).catch((error) => {
                constructErrorBorrowerTable(tableIdForLoans);
                console.log("error : "+error);
            })
        }
    })
}

//Search books by defined value (title, isbn, author) and search method (starts with, contains) and display those books' data in a table
function searchBooks(id) {
    var searchType = document.getElementById("searchType").value;
    var searchMethod = document.getElementById("searchMethod").value;
    var value = document.getElementById("search-books-box").value;
    clearTable(id);
    var url = '';
    if (searchType=='author') {
        url = '/search?type='+searchType+'&name='+value+'&searchMethod='+searchMethod;
        fetch(url, {
                method: 'GET'
            }).then((response) => {
                return response.json();
            }).then(function(data) {
                var finalData = [];
                for (var i = 0; i < data.length; i++) { 
                    for (var j = 0; j < data[i].Books.length; j++) {
                        var index = -1;
                        finalData.find(function(item, k){
                            if(item.id === data[i].Books[j].id){
                                index = k;
                            }
                        });
                        if (index == -1) {
                            delete data[i].Books[j].author_books;
                            finalData.push(data[i].Books[j]);
                        } 
                    }
                }
                if (finalData.length == 0) {
                    constructNoResultTable(id, '9');
                } else {
                    constructBookTable(finalData, id);
                }
            }).catch((error) => {
                constructErrorBookTable(id);
                console.log("error : "+error);
            })
    } else {
        url = '/search?type=book&'+searchType+'='+value+'&searchMethod='+searchMethod;
        fetch(url, {
                method: 'GET'
            }).then((response) => {
                return response.json();
            }).then(function(data) {
                if (data.length == 0) {
                    constructNoResultTable(id, '9');
                } else {
                    constructBookTable(data, id);
                }
            }).catch((error) => {
                constructErrorBookTable(id);
                console.log("error : "+error);
            })
    }
}

//Get a user's detail and call the function for displaying this data 
function getUserDetail(formId, fnView, fnViewError) {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var msgType = url.searchParams.get("msgType");
    var id = url.searchParams.get("id");
    if (isRealValue(msgType) && (msgType == "fail")) {
        return;
    }
    fetch('/users/'+id, {
        method: 'GET'
    }).then((response) => {
        return response.json();
    }).then(function(data) {
        fnView(data, formId);
    }).catch((error) => {
        fnViewError(id);
        console.log("error : "+error);
    })
}

//Fill user's data into 'Edit User' form
function setupEditUserDetailForm(data, formId) {
    var form = document.querySelector("#"+formId);
    form.setAttribute("action","/users/"+data.id)
    var nameInput = document.querySelector("#"+formId+" > #name");
    var barcodeInput = document.querySelector("#"+formId+" > #barcode");
    var memberTypeSelect = document.querySelector("#"+formId+" > #memberType");
    var created = document.querySelector("#"+formId+" #created");
    var updated = document.querySelector("#"+formId+" #updated");
    nameInput.value = data.name;
    barcodeInput.value = data.barcode;
    memberTypeSelect.value = data.memberType;
    var createdDate = new Date(data.createdAt);
    var updatedDate = new Date(data.updatedAt);
    created.innerHTML = "Created at : "+ createDateTimeStringFromDateObject(createdDate);
    updated.innerHTML = "Updated at : "+createDateTimeStringFromDateObject(updatedDate);
}

//Redirect to 'Edit User' form and display error message, use when facing error of user's data retrieving
function setupEditUserDetailFormErrorCase(id) { 
    window.location.replace("/users/edit?id="+id+"&msgDisplay=Error: Cannot get current data of user id "+id+"&msgType=fail");
}

//Get a book's detail with author(s) and call the function for displaying this data 
function getBookDetail(formId, fnView, fnViewError) {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var msgType = url.searchParams.get("msgType");
    var id = url.searchParams.get("id");
    if (isRealValue(msgType) && (msgType == "fail")) {
        return;
    }
    fetch('/books/'+id+'?allEntities=true', {
        method: 'GET'
    }).then((response) => {
        return response.json();
    }).then(function(data) {
        fnView(data, formId);
    }).catch((error) => {
        fnViewError(id);
        console.log("error : "+error);
    })
}

//Fill book's data into 'Edit Book' form and running input validation function
function setupEditBookDetailForm(data, formId) {
    var form = document.querySelector("#"+formId);
    form.setAttribute("action","/books/"+data.id)
    var titleInput = document.querySelector("#"+formId+" > #title");
    var isbnInput = document.querySelector("#"+formId+" > #isbn");
    var oldIsbnInput = document.querySelector("#"+formId+" > #oldIsbn");
    var authorsInput = document.querySelector("#"+formId+" > #authors");
    var noOfCopiesInput = document.querySelector("#"+formId+" > #noOfCopies");
    var created = document.querySelector("#"+formId+" #created");
    var updated = document.querySelector("#"+formId+" #updated");
    titleInput.value = data.title;
    isbnInput.value = data.isbn;
    oldIsbnInput.value = data.isbn;
    noOfCopiesInput.value = data.noOfCopies;
    var authors = '';
    for (var i = 0; i < data.Authors.length; i++) {
        authors += data.Authors[i].name;
        if (i != data.Authors.length-1) {
            authors += ', '
        }
    }
    authorsInput.value = authors;
    var createdDate = new Date(data.createdAt);
    var updatedDate = new Date(data.updatedAt);
    created.innerHTML = "Created at : "+ createDateTimeStringFromDateObject(createdDate);
    updated.innerHTML = "Updated at : "+ createDateTimeStringFromDateObject(updatedDate);

    isbnInput.oninput();    //Call ISBN validation
}

//Redirect to 'Edit book' form and display error message, use when facing error of book's data retrieving
function setupEditBookDetailFormErrorCase(id) {
    window.location.replace("/books/edit?id="+id+"&msgDisplay=Error: Cannot get current data of book id "+id+"&msgType=fail");
}

//Displaying users' data in defined table
function constructUserTable(jsonList, id) {
    var tableBody = document.querySelector("#"+id+" tbody")
    for (var i = 0; i < jsonList.length; i++) { 
        var row = document.createElement('tr'); 
        var id = "";
        var name = "";
        var barcode = "";
        var memberType = "";
        // Each user's data from JSON
        for (key in jsonList[i]) { 
            var col = document.createElement('td');
            col.setAttribute('class', key); 
            if(key == "createdAt" || key == "updatedAt") {
                col.innerHTML = createDateTimeStringFromDateObject(new Date(jsonList[i][key]), true);
            } else {
                col.innerHTML = jsonList[i][key];
            }
            row.appendChild(col);

            if (key=="id") {
                id = jsonList[i][key];
            } else if (key=="name") {
                name = jsonList[i][key];
            } else if (key=="barcode") {
                barcode = jsonList[i][key];
            } else if (key=="memberType") {
                memberType = jsonList[i][key];
            }
        }

        // Column for edit button
        var colDel = document.createElement('td');
        colDel.setAttribute('class', 'edit'); 
        colDel.innerHTML = '<a href="/users/edit?id='+id+'">Update</a>';
        row.appendChild(colDel);

        // Column for delete button
        var colDel = document.createElement('td');
        colDel.setAttribute('class', 'delete'); 
        colDel.innerHTML = '<a href="#" onclick="openDeleteUserModal(\'modal-delete-user\',\''+id+'\',\''+name+'\',\''+barcode+'\',\''+memberType+'\')">Remove</a>';
        row.appendChild(colDel);

        tableBody.appendChild(row);
    } 
}

//Displaying books' data in defined table
function constructBookTable(jsonList, id) {
    var tableBody = document.querySelector("#"+id+" tbody")
    for (var i = 0; i < jsonList.length; i++) { 
        var row = document.createElement('tr'); 
        var id = "";
        var title = "";
        var isbn = "";
        var authors = "";
        var noOfCopies = "";
        // Each book's data from JSON
        for (key in jsonList[i]) { 
            var col = document.createElement('td');
            col.setAttribute('class', key); 
            if (key == "createdAt" || key == "updatedAt") {
                col.innerHTML = createDateTimeStringFromDateObject(new Date(jsonList[i][key]), true);
            } else if (key == "Authors") {
                var authorsList = jsonList[i][key];
                authorsList.forEach(element => {
                    authors += element.name + ", ";
                });
                if (authors != "") authors = authors.substr(0, authors.length-2);
                col.innerHTML = authors;
            } else {
                col.innerHTML = jsonList[i][key];
            }
            row.appendChild(col);

            if (key=="id") {
                id = jsonList[i][key];
            } else if (key=="title") {
                title = jsonList[i][key];
            } else if (key=="isbn") {
                isbn = jsonList[i][key];
            } else if (key=="noOfCopies") {
                noOfCopies = jsonList[i][key];
            }
        }

        // Column for edit button
        var colDel = document.createElement('td');
        colDel.setAttribute('class', 'edit'); 
        colDel.innerHTML = '<a href="/books/edit?id='+id+'">Edit</a>';
        row.appendChild(colDel);

        // Column for delete button
        var colDel = document.createElement('td');
        colDel.setAttribute('class', 'delete'); 
        colDel.innerHTML = '<a href="#" onclick="openDeleteBookModal(\'modal-delete-book\',\''+id+'\',\''+title+'\',\''+isbn+'\',\''+authors+'\',\''+noOfCopies+'\')">Remove</a>';
        row.appendChild(colDel);

        tableBody.appendChild(row);
    } 
}

//Displaying loans' data in defined table
function constructLoanTable(jsonList, userData, barcode, id) {
    var tableBody = document.querySelector("#"+id+" tbody")
    for (var i = 0; i < jsonList.length; i++) { 
        var row = document.createElement('tr'); 
        var id = "";
        var title = "";
        var isbn = "";
        var dueDate = "";
        var dueDateForCalendar = "";
        var returned = false;
        var createdAt = "";
        var updatedAt = "";
        // Each loan's data from JSON
        var keyDefined = ['id','title','isbn','dueDate','createdAt','returned','updatedAt'];
        keyDefined.forEach((key) => {
            var col = document.createElement('td');
            col.setAttribute('class', key); 
            if (key == "createdAt") {
                col.innerHTML = createDateTimeStringFromDateObject(new Date(jsonList[i][key]), true);
                createdAt = createDateTimeStringFromDateObject(new Date(jsonList[i][key]), true);
            } else if (key == "updatedAt") {
                col.innerHTML = createDateTimeStringFromDateObject(new Date(jsonList[i][key]), true);
                updatedAt = createDateTimeStringFromDateObject(new Date(jsonList[i][key]), true);
            } else if (key == "dueDate") {
                var dueDateObject = new Date(jsonList[i][key]);

                col.innerHTML = createDateStringFromDateObject(dueDateObject, true);
                dueDate = createDateStringFromDateObject(dueDateObject, true);
                
                var day = ("0" + dueDateObject.getDate()).slice(-2);
                var month = ("0" + (dueDateObject.getMonth() + 1)).slice(-2);
                dueDateForCalendar = dueDateObject.getFullYear()+"-"+(month)+"-"+(day);

                var today = new Date();
                var todayAtUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0))
                var dueDateAtUTC = new Date(Date.UTC(dueDateObject.getFullYear(), dueDateObject.getMonth(), dueDateObject.getDate(), 0, 0, 0, 0));
                if (todayAtUTC > dueDateAtUTC && jsonList[i]['returned'] == false) {
                    row.classList.add('late');
                    var dateDiff = (todayAtUTC.getTime()-dueDateAtUTC.getTime())/(1000*60*60*24);
                    col.innerHTML = col.innerHTML + '<br/><span class="late-text">(Late ' + dateDiff + ' Days)</span>';
                }
            } else if (key == "title") {
                col.innerHTML = jsonList[i]['Book'][key];
                title = jsonList[i]['Book'][key];
            } else if (key == "isbn") {
                col.innerHTML = jsonList[i]['Book'][key];
                isbn = jsonList[i]['Book'][key];
            } else if (key == "id") {
                col.innerHTML = jsonList[i][key];
                id = jsonList[i][key];
            } else if (key == "returned") {
                returned = jsonList[i][key];
                if (returned == true) {
                    col.innerHTML = "Yes";
                } else {
                    col.innerHTML = "No";
                }
            } else {
                col.innerHTML = jsonList[i][key];
            }
            row.appendChild(col);
        })

        // Column for delete button
        var colDel = document.createElement('td');
        colDel.setAttribute('class', 'delete'); 
        colDel.innerHTML = '<a href="#" onclick="openDeleteLoanModal(\'modal-delete-loan\',\''+id+'\',\''+userData+'\',\''+barcode+'\',\''+title+'\',\''+isbn+'\',\''+createdAt+'\',\''+dueDate+'\')">Delete</a>';
        row.appendChild(colDel);

        // Column for edit button
        var colDel = document.createElement('td');
        colDel.setAttribute('class', 'edit'); 
        if (!returned) {
            colDel.innerHTML = '<a href="/loans/make-a-loan?barcode='+barcode+'&isbn='+isbn+'&dueDate='+dueDateForCalendar+'">Update</a>';
        }
        row.appendChild(colDel);

        // Column for return button
        var colDel = document.createElement('td');
        colDel.setAttribute('class', 'return'); 
        if (!returned) {
            colDel.innerHTML = '<a href="#" onclick="openReturnLoanModal(\'modal-return-loan\',\''+id+'\',\''+userData+'\',\''+barcode+'\',\''+title+'\',\''+isbn+'\',\''+createdAt+'\',\''+dueDate+'\')">Return</a>';
        }
        row.appendChild(colDel);

        tableBody.appendChild(row);
    } 
}

//Displaying loan borrowers' data in defined table
function constructBorrowerTable(jsonList, bookTitle, isbn, id) {
    var tableBody = document.querySelector("#"+id+" tbody")
    for (var i = 0; i < jsonList.length; i++) { 
        var row = document.createElement('tr'); 
        var id = "";
        var name = "";
        var memberType = "";
        var barcode = "";
        var dueDate = "";
        var dueDateForCalendar = "";
        var returned = false;
        var createdAt = "";
        var updatedAt = "";
        // Each loan's data from JSON
        var keyDefined = ['id','name','memberType','barcode','dueDate','createdAt','returned','updatedAt'];
        keyDefined.forEach((key) => {
            var col = document.createElement('td');
            col.setAttribute('class', key); 
            if (key == "createdAt") {
                col.innerHTML = createDateTimeStringFromDateObject(new Date(jsonList[i][key]), true);
                createdAt = createDateTimeStringFromDateObject(new Date(jsonList[i][key]), true);
            } else if (key == "updatedAt") {
                col.innerHTML = createDateTimeStringFromDateObject(new Date(jsonList[i][key]), true);
                updatedAt = createDateTimeStringFromDateObject(new Date(jsonList[i][key]), true);
            } else if (key == "dueDate") {
                var dueDateObject = new Date(jsonList[i][key]);
                col.innerHTML = createDateStringFromDateObject(dueDateObject, true);
                dueDate = createDateStringFromDateObject(dueDateObject, true);
                
                var day = ("0" + dueDateObject.getDate()).slice(-2);
                var month = ("0" + (dueDateObject.getMonth() + 1)).slice(-2);
                dueDateForCalendar = dueDateObject.getFullYear()+"-"+(month)+"-"+(day);

                var today = new Date();
                var todayAtUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0))
                var dueDateAtUTC = new Date(Date.UTC(dueDateObject.getFullYear(), dueDateObject.getMonth(), dueDateObject.getDate(), 0, 0, 0, 0));
                if (todayAtUTC > dueDateAtUTC && jsonList[i]['returned'] == false) {
                    row.classList.add('late');
                    var dateDiff = (todayAtUTC.getTime()-dueDateAtUTC.getTime())/(1000*60*60*24);
                    col.innerHTML = col.innerHTML + '<br/><span class="late-text">(Late ' + dateDiff + ' Days)</span>';
                }
            } else if (key == "name") {
                col.innerHTML = jsonList[i]['User'][key];
                name = jsonList[i]['User'][key];
            } else if (key == "memberType") {
                col.innerHTML = jsonList[i]['User'][key];
                memberType = jsonList[i]['User'][key];
            } else if (key == "barcode") {
                col.innerHTML = jsonList[i]['User'][key];
                barcode = jsonList[i]['User'][key];
            } else if (key == "id") {
                col.innerHTML = jsonList[i][key];
                id = jsonList[i][key];
            } else if (key == "returned") {
                returned = jsonList[i][key];
                if (returned == true) {
                    col.innerHTML = "Yes";
                } else {
                    col.innerHTML = "No";
                }
            } else {
                col.innerHTML = jsonList[i][key];
            }
            row.appendChild(col);
        })

        var borrowerDataForDisplayinModal = name + ' (' + memberType + ')';

        // Column for delete button
        var colDel = document.createElement('td');
        colDel.setAttribute('class', 'delete'); 
        colDel.innerHTML = '<a href="#" onclick="openDeleteLoanModal(\'modal-delete-loan\',\''+id+'\',\''+borrowerDataForDisplayinModal+'\',\''+barcode+'\',\''+bookTitle+'\',\''+isbn+'\',\''+createdAt+'\',\''+dueDate+'\')">Delete</a>';
        row.appendChild(colDel);

        // Column for edit button
        var colDel = document.createElement('td');
        colDel.setAttribute('class', 'edit'); 
        if (!returned) {
            colDel.innerHTML = '<a href="/loans/make-a-loan?barcode='+barcode+'&isbn='+isbn+'&dueDate='+dueDateForCalendar+'">Update</a>';
        }
        row.appendChild(colDel);

        // Column for return button
        var colDel = document.createElement('td');
        colDel.setAttribute('class', 'return'); 
        if (!returned) {
            colDel.innerHTML = '<a href="#" onclick="openReturnLoanModal(\'modal-return-loan\',\''+id+'\',\''+borrowerDataForDisplayinModal+'\',\''+barcode+'\',\''+bookTitle+'\',\''+isbn+'\',\''+createdAt+'\',\''+dueDate+'\')">Return</a>';
        }
        row.appendChild(colDel);

        tableBody.appendChild(row);
    } 
}

//Delete all rows in defined table
function clearTable(id) {
    var tableBody = document.querySelector("#"+id+" tbody")
    var allRow = tableBody.childNodes;
    var allRowArray = Array.from(allRow);
    for (var i = 0; i < allRowArray.length; i++) { 
        tableBody.removeChild(allRowArray[i]);
    } 
}

//Create table row to display sentence 'Np result found'
function constructNoResultTable(id, colNo) {
    var tableBody = document.querySelector("#"+id+" tbody")
    var row = document.createElement('tr'); 
    
    // Column for display error
    var colDel = document.createElement('td');
    colDel.setAttribute('colspan', colNo); 
    colDel.setAttribute('class', 'error');
    colDel.innerHTML = 'No result found.';
    row.appendChild(colDel);

    tableBody.appendChild(row);
}

//Create table row to display error message about retrieving users list
function constructErrorUserTable(id) {
    var tableBody = document.querySelector("#"+id+" tbody")
    var row = document.createElement('tr'); 
    
    // Column for display error
    var colDel = document.createElement('td');
    colDel.setAttribute('colspan', '8'); 
    colDel.setAttribute('class', 'error');
    colDel.innerHTML = 'Error: cannot retrieve users list';
    row.appendChild(colDel);

    tableBody.appendChild(row);
}

//Create table row to display error message about retrieving books list
function constructErrorBookTable(id) {
    var tableBody = document.querySelector("#"+id+" tbody")
    var row = document.createElement('tr'); 
    
    // Column for display error
    var colDel = document.createElement('td');
    colDel.setAttribute('colspan', '9'); 
    colDel.setAttribute('class', 'error');
    colDel.innerHTML = 'Error: cannot retrieve books list';
    row.appendChild(colDel);

    tableBody.appendChild(row);
}

//Create table row to display error message about retrieving loans list
function constructErrorLoanTable(id) {
    var tableBody = document.querySelector("#"+id+" tbody")
    var row = document.createElement('tr'); 
    
    // Column for display error
    var colDel = document.createElement('td');
    colDel.setAttribute('colspan', '10'); 
    colDel.setAttribute('class', 'error');
    colDel.innerHTML = 'Error: cannot retrieve loans list';
    row.appendChild(colDel);

    tableBody.appendChild(row);
}

//Create table row to display error message about retrieving loans' borrowers list
function constructErrorBorrowerTable(id) {
    var tableBody = document.querySelector("#"+id+" tbody")
    var row = document.createElement('tr'); 
    
    // Column for display error
    var colDel = document.createElement('td');
    colDel.setAttribute('colspan', '11'); 
    colDel.setAttribute('class', 'error');
    colDel.innerHTML = 'Error: cannot retrieve loans list';
    row.appendChild(colDel);

    tableBody.appendChild(row);
}

//Checking whether the barcode which user filled has been already used by other users or not
function isDuplicateBarcode(value) {
    var validateMessageDiv = document.getElementById("barcode-validate");
    var submitBtn = document.getElementById("submit-add");
    if (value.length == 0) {
        validateMessageDiv.innerHTML = "";
        submitBtn.removeAttribute("disabled")
    } else if (value.indexOf('-') != -1 || value.indexOf('e') != -1) {
        validateMessageDiv.innerHTML = "Barcode can contain only zero or positive integer.";
        submitBtn.setAttribute("disabled", true);
        if (validateMessageDiv.classList.contains("success-text")) {
            validateMessageDiv.classList.remove("success-text");
        }
        if (validateMessageDiv.classList.contains("warning-text")) {
            validateMessageDiv.classList.remove("warning-text");
        }
        validateMessageDiv.classList.add("fail-text");
    } else {
        fetch('/search?type=user&barcode='+value+'&searchMethod=anyParts', {
            method: 'GET'
        }).then((response) => {
            return response.json();
        }).then(function(data) {
            var isDuplicate = false;
            for(var i = 0; i < data.length; i++) {
                if (data[i].barcode == value) {
                    isDuplicate = true;
                    break;
                }
            }
            if (isDuplicate) {  //If it has been used, notify user with error message
                validateMessageDiv.innerHTML = "This barcode has already been used, please select another one.";
                submitBtn.setAttribute("disabled", true);
                if (validateMessageDiv.classList.contains("success-text")) {
                    validateMessageDiv.classList.remove("success-text");
                }
                if (validateMessageDiv.classList.contains("warning-text")) {
                    validateMessageDiv.classList.remove("warning-text");
                }
                validateMessageDiv.classList.add("fail-text");
            } else {            //If it has not been used, notify user with normal message
                validateMessageDiv.innerHTML = "You can use this barcode";
                submitBtn.removeAttribute("disabled")
                if (validateMessageDiv.classList.contains("fail-text")) {
                    validateMessageDiv.classList.remove("fail-text");
                }
                if (validateMessageDiv.classList.contains("warning-text")) {
                    validateMessageDiv.classList.remove("warning-text");
                }
                validateMessageDiv.classList.add("success-text");
            }
        }).catch((error) => {   //If checking process error, notify user with warning message
            if (validateMessageDiv.classList.contains("success-text")) {
                validateMessageDiv.classList.remove("success-text");
            }
            if (validateMessageDiv.classList.contains("fail-text")) {
                validateMessageDiv.classList.remove("fail-text");
            }
            submitBtn.setAttribute("disabled", true);
            validateMessageDiv.classList.add("warning-text");
            validateMessageDiv.innerHTML = "Warning: Barcode Checking Failed.";
            console.log("error : "+error);
        })
    }
}

//Checking whether the isbn which user filled has been already used before in the system or not
function isDuplicateISBN(value, hasOldValue) {
    var oldValue = document.getElementById("oldIsbn").value;
    var validateMessageDiv = document.getElementById("isbn-validate");
    var submitBtn = hasOldValue ? document.getElementById("submit-edit") : document.getElementById("submit-add");
    if (value.length == 0) {
        validateMessageDiv.innerHTML = "";
        submitBtn.removeAttribute("disabled")
    } else if (value.indexOf('-') != -1 || value.indexOf('e') != -1) {
        validateMessageDiv.innerHTML = "ISBN can contain only zero or positive integer.";
        submitBtn.setAttribute("disabled", true);
        if (validateMessageDiv.classList.contains("success-text")) {
            validateMessageDiv.classList.remove("success-text");
        }
        if (validateMessageDiv.classList.contains("warning-text")) {
            validateMessageDiv.classList.remove("warning-text");
        }
        validateMessageDiv.classList.add("fail-text");
    } else {
        if (!hasOldValue || (hasOldValue && value != oldValue)) {
            //In case of adding new book or editing book detail and input value is different from the current stored value
            fetch('/search?type=book&isbn='+value+'&searchMethod=anyParts', {
                method: 'GET'
            }).then((response) => {
                return response.json();
            }).then(function(data) {
                var isDuplicate = false;
                for(var i = 0; i < data.length; i++) {
                    if (data[i].isbn == value) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (isDuplicate) {  //If it has been used, notify user with error message and tell user to add copies of existed book instead
                    validateMessageDiv.innerHTML = "The book with the same ISBN has already added into system. If you want to add copies of this book, please update book detail instead.";
                    submitBtn.setAttribute("disabled", true);
                    if (validateMessageDiv.classList.contains("success-text")) {
                        validateMessageDiv.classList.remove("success-text");
                    }
                    if (validateMessageDiv.classList.contains("warning-text")) {
                        validateMessageDiv.classList.remove("warning-text");
                    }
                    validateMessageDiv.classList.add("fail-text");
                } else {            //If it has not been used, notify user with message
                    validateMessageDiv.innerHTML = "This ISBN never be used on the system";
                    submitBtn.removeAttribute("disabled")
                    if (validateMessageDiv.classList.contains("fail-text")) {
                        validateMessageDiv.classList.remove("fail-text");
                    }
                    if (validateMessageDiv.classList.contains("warning-text")) {
                        validateMessageDiv.classList.remove("warning-text");
                    }
                    validateMessageDiv.classList.add("success-text");
                }
            }).catch((error) => {   //If checking process error, notify user with warning message
                if (validateMessageDiv.classList.contains("success-text")) {
                    validateMessageDiv.classList.remove("success-text");
                }
                if (validateMessageDiv.classList.contains("fail-text")) {
                    validateMessageDiv.classList.remove("fail-text");
                }
                submitBtn.setAttribute("disabled", true);
                validateMessageDiv.classList.add("warning-text");
                validateMessageDiv.innerHTML = "Warning: ISBN Checking Failed.";
                console.log("error : "+error);
            })
        } else {
            //In case of editing book detail but input value still be the same with current stored value
            validateMessageDiv.innerHTML = "This is the same ISBN";
            submitBtn.removeAttribute("disabled")
            if (validateMessageDiv.classList.contains("fail-text")) {
                validateMessageDiv.classList.remove("fail-text");
            }
            if (validateMessageDiv.classList.contains("warning-text")) {
                validateMessageDiv.classList.remove("warning-text");
            }
            validateMessageDiv.classList.add("success-text");
        }
    }
}

//Checking whether the due date which user filled is from tomorrow onwards or not
//Using in making loan form, so after checking it has to call function to check form readiness for submission again
function isValidDueDate(value) {
    var validateMessageDiv = document.getElementById("date-validate");
    var submitBtn = document.getElementById("submit-loan");
    if (value.length == 0) {
        validateMessageDiv.innerHTML = "";
    } else {
        var today = new Date();
        today.setHours(0,0,0,0);
        var selectedDate = new Date(value);
        if (today >= selectedDate) {    //If it is not the date from tomorrow onwards, notify user with error message and tell user to select new due date again
            validateMessageDiv.innerHTML = "Cannot set date to be today or before today, please try again.";
            submitBtn.setAttribute("disabled", true);
            if (validateMessageDiv.classList.contains("success-text")) {
                validateMessageDiv.classList.remove("success-text");
            }
            if (validateMessageDiv.classList.contains("warning-text")) {
                validateMessageDiv.classList.remove("warning-text");
            }
            validateMessageDiv.classList.add("fail-text");
        } else {                        //If the due dute is applicable, notify user with message.
            validateMessageDiv.innerHTML = "Possible due date";
            submitBtn.removeAttribute("disabled")
            if (validateMessageDiv.classList.contains("fail-text")) {
                validateMessageDiv.classList.remove("fail-text");
            }
            if (validateMessageDiv.classList.contains("warning-text")) {
                validateMessageDiv.classList.remove("warning-text");
            }
            validateMessageDiv.classList.add("success-text");
        }
    }
    checkLoanFormReadiness();           //Call function to check form readiness for submission
}

//Checking whether the barcode which user filled represents a user or not
//Using in making loan form, so after checking it has to call function to check form readiness for submission again
function getUserByBarcode(value) {
    var validateMessageDiv = document.getElementById("barcode-validate");
    if (value.length == 0) {
        validateMessageDiv.innerHTML = "";
        validateMessageDiv.classList.remove("success-text");
        validateMessageDiv.classList.remove("warning-text");
        validateMessageDiv.classList.remove("fail-text");
        checkLoanFormReadiness();
    } else {
        fetch('/search?type=user&barcode='+value+'&searchMethod=exactlyMatch', {
            method: 'GET'
        }).then((response) => {
            return response.json();
        }).then(function(data) {
            if (data.length == 0) {     //If it does not represent any users, notify user with error message and tell user to fill new barcode again
                validateMessageDiv.innerHTML = "User not found, please try again.";
                if (validateMessageDiv.classList.contains("success-text")) {
                    validateMessageDiv.classList.remove("success-text");
                }
                if (validateMessageDiv.classList.contains("warning-text")) {
                    validateMessageDiv.classList.remove("warning-text");
                }
                validateMessageDiv.classList.add("fail-text");
                var formElement = document.getElementById("form-loans-add");
                var lastPart = formElement.getAttribute("action").substring(formElement.getAttribute("action").indexOf("/",7));
                formElement.setAttribute("action","/users/"+lastPart);
            } else {                    //If the barcode represents a user, notify user with message, display user's data, and set attribute 'action' to the form to make form ready for submission.
                validateMessageDiv.innerHTML = "User found: "+data[0].name+" / Type : "+data[0].memberType;
                if (validateMessageDiv.classList.contains("fail-text")) {
                    validateMessageDiv.classList.remove("fail-text");
                }
                if (validateMessageDiv.classList.contains("warning-text")) {
                    validateMessageDiv.classList.remove("warning-text");
                }
                validateMessageDiv.classList.add("success-text");
                var formElement = document.getElementById("form-loans-add");
                var lastPart = formElement.getAttribute("action").substring(formElement.getAttribute("action").indexOf("/",7));
                formElement.setAttribute("action","/users/"+data[0].id+lastPart);
            }
        }).catch((error) => {           //If checking has error, notify user with warning message.
            if (validateMessageDiv.classList.contains("success-text")) {
                validateMessageDiv.classList.remove("success-text");
            }
            if (validateMessageDiv.classList.contains("fail-text")) {
                validateMessageDiv.classList.remove("fail-text");
            }
            validateMessageDiv.classList.add("warning-text");
            validateMessageDiv.innerHTML = "Warning: Cannot check user existence.";
            console.log("error : "+error);
            var formElement = document.getElementById("form-loans-add");
            var lastPart = formElement.getAttribute("action").substring(formElement.getAttribute("action").indexOf("/",7));
            formElement.setAttribute("action","/users/"+lastPart);
        }).then(() => {
            checkLoanFormReadiness();
        })
    }
}

//Checking whether the isbn which user filled represents a book or not
//Using in making loan form, so after checking it has to call function to check form readiness for submission again
function getBookByIsbn(value) {
    var validateMessageDiv = document.getElementById("isbn-validate");
    if (value.length == 0) {
        validateMessageDiv.innerHTML = "";
        validateMessageDiv.classList.remove("success-text");
        validateMessageDiv.classList.remove("warning-text");
        validateMessageDiv.classList.remove("fail-text");
        checkLoanFormReadiness();
    } else {
        fetch('/search?type=book&isbn='+value+'&searchMethod=exactlyMatch', {
            method: 'GET'
        }).then((response) => {
            return response.json();
        }).then(function(data) {    //If it does not represent any books, notify user with error message and tell user to fill new isbn again
            if (data.length == 0) {
                validateMessageDiv.innerHTML = "Book not found, please try again.";
                if (validateMessageDiv.classList.contains("success-text")) {
                    validateMessageDiv.classList.remove("success-text");
                }
                if (validateMessageDiv.classList.contains("warning-text")) {
                    validateMessageDiv.classList.remove("warning-text");
                }
                validateMessageDiv.classList.add("fail-text");
                var formElement = document.getElementById("form-loans-add");
                var firstPart = formElement.getAttribute("action").substring(0,formElement.getAttribute("action").lastIndexOf("/")+1);
                formElement.setAttribute("action",firstPart);
            } else {                //If the barcode represents a user, notify user with message, display book's data, and set attribute 'action' to the form to make form ready for submission
                var authors = "";
                for (var i = 0; i< data[0].Authors.length; i++) {
                    authors = authors+data[0].Authors[i].name;
                    if (i != data[0].Authors.length-1) {
                        authors = authors + ", ";
                    }
                }
                validateMessageDiv.innerHTML = "Book found: "+data[0].title+" / Type : "+authors;
                if (validateMessageDiv.classList.contains("fail-text")) {
                    validateMessageDiv.classList.remove("fail-text");
                }
                if (validateMessageDiv.classList.contains("warning-text")) {
                    validateMessageDiv.classList.remove("warning-text");
                }
                validateMessageDiv.classList.add("success-text");
                var formElement = document.getElementById("form-loans-add");
                var firstPart = formElement.getAttribute("action").substring(0,formElement.getAttribute("action").lastIndexOf("/")+1);
                formElement.setAttribute("action",firstPart+data[0].id);
            }
        }).catch((error) => {       //If checking has error, notify user with warning message.
            if (validateMessageDiv.classList.contains("success-text")) {
                validateMessageDiv.classList.remove("success-text");
            }
            if (validateMessageDiv.classList.contains("fail-text")) {
                validateMessageDiv.classList.remove("fail-text");
            }
            validateMessageDiv.classList.add("warning-text");
            validateMessageDiv.innerHTML = "Warning: Cannot check book existence.";
            console.log("error : "+error);
            var formElement = document.getElementById("form-loans-add");
            var firstPart = formElement.getAttribute("action").substring(0,formElement.getAttribute("action").lastIndexOf("/")+1);
            formElement.setAttribute("action",firstPart);
        }).then(() => {
            checkLoanFormReadiness();
        })
    }
}

//Check all conditions for permitting a loan.
//If pass, enable submit button. If fail, disable it.
function checkLoanFormReadiness() {
    var isbnValidateMessageDiv = document.getElementById("isbn-validate");
    var barcodeValidateMessageDiv = document.getElementById("barcode-validate");
    var dateValidateMessageDiv = document.getElementById("date-validate");
    var loanedAlertDiv = document.querySelector("#loaned-alert");
    var readyAlertDiv = document.querySelector("#ready-alert");
    var outOfCopiesAlertDiv = document.querySelector("#out-of-copies-alert");
    loanedAlertDiv.style.display = "none";
    readyAlertDiv.style.display = "none";
    outOfCopiesAlertDiv.style.display = "none";

    var isIsbnBlank = !isbnValidateMessageDiv.classList.contains("success-text") && !isbnValidateMessageDiv.classList.contains("fail-text") && !isbnValidateMessageDiv.classList.contains("warning-text");
    var isBarcodeBlank = !barcodeValidateMessageDiv.classList.contains("success-text") && !barcodeValidateMessageDiv.classList.contains("fail-text") && !barcodeValidateMessageDiv.classList.contains("warning-text");
    var isDateBlank = !dateValidateMessageDiv.classList.contains("success-text") && !dateValidateMessageDiv.classList.contains("fail-text") && !dateValidateMessageDiv.classList.contains("warning-text");

    var isAllPassed = isbnValidateMessageDiv.classList.contains("success-text") && barcodeValidateMessageDiv.classList.contains("success-text") && dateValidateMessageDiv.classList.contains("success-text");

    var submitBtn = document.getElementById("submit-loan");

    //Submit button will be enabled if every values are checked and pass checking, or when the form is blank (but submission still be prevented in this case due to blank value)
    if ((isIsbnBlank && isBarcodeBlank && isDateBlank) || isAllPassed) {
        submitBtn.removeAttribute("disabled");
        if (isAllPassed) {
            var formElement = document.getElementById("form-loans-add");
            var userId = formElement.getAttribute("action").substring(7,formElement.getAttribute("action").indexOf("/",7));
            var bookId = formElement.getAttribute("action").substring(formElement.getAttribute("action").lastIndexOf("/")+1);
            
            //Check if user has already loaned this book, the form submission will mean to change due date of the book
            fetch('/users/'+userId+'/loans', {
                method: 'GET'
            }).then((response) => {
                return response.json();
            }).then(function(data) {
                var alreadyLoaned = false;
                for (var i = 0; i < data.length; i++) {
                    if (data[i].BookId == bookId && !data[i].returned) {
                        alreadyLoaned = true;
                    }
                }
                if (alreadyLoaned) {
                    loanedAlertDiv.style.display = "block";
                } else {
                    //If the user has not loan the book before, check whether there is/are copy/copies of this book remain or not.
                    //If not, disable the submit button. If there is/are copy/copies left, continue enable submit button.
                    //In both cases, notify checking result to user.
                    fetch('/loans/books/'+bookId+'/not-returned', {
                        method: 'GET'
                    }).then((response) => {
                        return response.json();
                    }).then(function(data) {
                        if ((data.count == 0) || (data.count > 0 && data.count < data.rows[0].Book.noOfCopies)) {
                            readyAlertDiv.style.display = "block";
                        }
                        else {
                            outOfCopiesAlertDiv.style.display = "block";
                            submitBtn.setAttribute("disabled", true);
                        }
                    }).catch((error) => {
                        console.log("error : "+error);
                    })
                }
            }).catch((error) => {
                console.log("error : "+error);
            })
        } 
    } else {
        submitBtn.setAttribute("disabled", true);
    }
}