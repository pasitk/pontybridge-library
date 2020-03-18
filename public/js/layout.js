//Including headers in every pages by using jQuery
$("header").load("/header", function() {
    // Initialise Layout and Menus
    var subMenuUser = document.getElementById("sub-menu-users");
    var subMenuBook = document.getElementById("sub-menu-books");
    var subMenuLoan = document.getElementById("sub-menu-loans");
    document.getElementById('main-menu-users').addEventListener('click', function(){
        changeDisplay(subMenuUser, true);
    });
    document.getElementById('main-menu-books').addEventListener('click', function(){
        changeDisplay(subMenuBook, true);
    });
    document.getElementById('main-menu-loans').addEventListener('click', function(){
        changeDisplay(subMenuLoan, true);
    });

    var menuMobile = document.getElementsByClassName("main-menu-item-mobile");
    for (var i = 0; i < menuMobile.length; i++)
    {
        menuMobile[i].addEventListener('click', function(event){
            var mainMenuId = this.getAttribute("id");
            var subMenu = document.getElementById("sub-"+mainMenuId);
            changeDisplay(subMenu, false);
        });
    }

    var menuTextsAndArrows = document.querySelectorAll(".main-menu-item-mobile div");
    for (var i = 0; i < menuTextsAndArrows.length; i++)
    {
        menuTextsAndArrows[i].addEventListener('click', function(event){
            event.preventDefault();
        });
    }
});

//When each page is loaded, initialise system message in all related pages and datepicker in loan making page.
$(document).ready(function() {
    //Initialise System Message
    //This code was written by myself, but inspired by learning from tutorial in Stackoverflow.com post by Quentin
    //accessed 15-12-2019
    //https://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-get-parameters
    var url_string = window.location.href; //window.location.href
    var url = new URL(url_string);
    var msgDisplay = url.searchParams.get("msgDisplay");
    var msgType = url.searchParams.get("msgType");
    var barcode = url.searchParams.get("barcode");
    var isbn = url.searchParams.get("isbn");
    var dueDate = url.searchParams.get("dueDate");
    if (isRealValue(msgDisplay) && (msgDisplay != "")) {
        var alertDialogBox = document.getElementById("alert-box");
        alertDialogBox.classList.remove("hidden");
        var alertDialogBoxDiv = document.querySelector("#alert-box > div");
        alertDialogBoxDiv.innerHTML = msgDisplay;
        if (isRealValue(msgType) && (msgType != "")) {
            if (msgType == "success") {
                alertDialogBox.classList.add("success");
            } else if (msgType == "fail") {
                alertDialogBox.classList.add("fail");
            } 
        }
    }
    if (url.pathname == "/loans/view-by-user" && isRealValue(barcode) && (barcode != "")) {
        var searchUserBox = document.getElementById("search-users-box");
        searchUserBox.value = barcode;
        document.getElementById("search-users-btn").click();
    }
    if (url.pathname == "/loans/view-by-book" && isRealValue(isbn) && (isbn != "")) {
        var searchBookBox = document.getElementById("search-books-box");
        searchBookBox.value = isbn;
        document.getElementById("search-books-btn").click();
    }
    if (url.pathname == "/loans/make-a-loan") {
        var backEditBtn = document.querySelector("#back-edit-loan");
        var resetEditBtn = document.querySelector("#reset-loan");
        if (isRealValue(barcode) && (barcode != "")) {
            var barcodeBox = document.getElementById("barcode");
            barcodeBox.value = barcode;
            barcodeBox.setAttribute("disabled", true);
            barcodeBox.oninput();
            backEditBtn.style.display = "inline-block";
            resetEditBtn.style.display = "none";
        }
        if (isRealValue(isbn) && (isbn != "")) {
            var isbnBox = document.getElementById("isbn");
            isbnBox.value = isbn;
            isbnBox.setAttribute("disabled", true);
            isbnBox.oninput();
            backEditBtn.style.display = "inline-block";
            resetEditBtn.style.display = "none";
        }
        if (isRealValue(dueDate) && (dueDate != "")) {
            var dueDateBox = document.getElementById("dueDate");
            dueDateBox.value = dueDate;
            dueDateBox.onchange();
        }
    }

    //Add this chunk of code for browsers which <input type="date"> is not supported.
    //Use jQuery UI datepicker instead
    //This code is adapted from stackoverflow.com answer by adeneo
    //accessed 9-1-2020
    //https://stackoverflow.com/questions/18020950/how-to-make-input-type-date-supported-on-all-browsers-any-alternatives
    //and jQury UI is downloaded from: https://jqueryui.com/
    if ( $('#dueDate')[0] != undefined ) {
        if ( $('#dueDate')[0].type != 'date' ) {
            $('#dueDate').datepicker();
        } 
    }
});

//Function for checking real existence of object with not 'null' and not 'undefined'
//This code is from stackoverflow.com answer by aquinas and John
//accessed 15-12-2019
//https://stackoverflow.com/questions/12535403/javascript-test-object-object-null-object-undefined
function isRealValue(obj) {
    return obj && obj !== 'null' && obj !== 'undefined';
}

//Function to control opening/closing of the menus in header
function changeDisplay(elem, isDesktop){
    if (elem.style["display"] == "none" || elem.style["display"] == "" || !isRealValue(elem.style["display"])) {
        if (isDesktop) closeAllSubMenu();
        elem.style["display"] = "block";
    }
    else if (elem.style["display"] == "block") {
        elem.style["display"] = "none";
    }
}

//Function to close all menus in desktop site, using under changeDisplay() function
function closeAllSubMenu(){
    var allSubMenu = document.getElementsByClassName("menu-dropdown-items-desktop");

    for (var i = 0; i < allSubMenu.length; i++)
    {
        allSubMenu[i].style["display"] = "none";
    }
}

//Function to go back to latest page before current page
function backToLatestPageBefore() {
    window.history.back();
}

//Function for opening modal to confirm user deleting and setting related data in the view
function openDeleteUserModal(modalId, userId, name, barcode, memberType) {
    openModal(modalId);
    var form = document.querySelector("#form-user-delete");
    form.setAttribute("action","/users/"+userId);
    var idDiv = document.querySelector("#"+modalId+" #id-value");
    idDiv.innerHTML = userId;
    var nameDiv = document.querySelector("#"+modalId+" #name-value");
    nameDiv.innerHTML = name;
    var barcodeDiv = document.querySelector("#"+modalId+" #barcode-value");
    barcodeDiv.innerHTML = barcode;
    var memberTypeDiv = document.querySelector("#"+modalId+" #memberType-value");
    memberTypeDiv.innerHTML = memberType;
}

//Function for opening modal to confirm book deleting and setting related data in the view
function openDeleteBookModal(modalId, bookId, title, isbn, authors, noOfCopies) {
    openModal(modalId);
    var form = document.querySelector("#form-book-delete");
    form.setAttribute("action","/books/"+bookId);
    var idDiv = document.querySelector("#"+modalId+" #id-value");
    idDiv.innerHTML = bookId;
    var titleDiv = document.querySelector("#"+modalId+" #title-value");
    titleDiv.innerHTML = title;
    var isbnDiv = document.querySelector("#"+modalId+" #isbn-value");
    isbnDiv.innerHTML = isbn;
    var authorsDiv = document.querySelector("#"+modalId+" #authors-value");
    authorsDiv.innerHTML = authors;
    var noOfCopiesDiv = document.querySelector("#"+modalId+" #noOfCopies-value");
    noOfCopiesDiv.innerHTML = noOfCopies;
}

//Function for opening modal to confirm loan deleting / setting related data in the view and input
function openDeleteLoanModal(modalId, loanId, userData, barcode, title, isbn, createdAt, dueDate) {
    openModal(modalId);
    var form = document.querySelector("#form-loan-delete");
    form.setAttribute("action","/loans/"+loanId);
    var idDiv = document.querySelector("#"+modalId+" #delete-loan-id-value");
    idDiv.innerHTML = loanId;
    var userDataDiv = document.querySelector("#"+modalId+" #delete-loan-user-data-value");
    userDataDiv.innerHTML = userData;
    var barcodeDiv = document.querySelector("#"+modalId+" #delete-loan-barcode-value");
    barcodeDiv.innerHTML = barcode;
    var titleDiv = document.querySelector("#"+modalId+" #delete-loan-title-value");
    titleDiv.innerHTML = title;
    var isbnDiv = document.querySelector("#"+modalId+" #delete-loan-isbn-value");
    isbnDiv.innerHTML = isbn;
    var createdAtDiv = document.querySelector("#"+modalId+" #delete-loan-createdAt-value");
    createdAtDiv.innerHTML = createdAt;
    var dueDateDiv = document.querySelector("#"+modalId+" #delete-loan-dueDate-value");
    dueDateDiv.innerHTML = dueDate;

    var bookDataDeleteLoanModalDiv = document.getElementById("book-data-delete-loan-modal");
    bookDataDeleteLoanModalDiv.value = title;
    var userDataDeleteLoanModalInput = document.getElementById("user-data-delete-loan-modal");
    userDataDeleteLoanModalInput.value = userData;
    var barcodeDataDeleteLoanModalInput = document.getElementById("barcode-data-delete-loan-modal");
    barcodeDataDeleteLoanModalInput.value = barcode;
    var isbnDataDeleteLoanModalInput = document.getElementById("isbn-data-delete-loan-modal");
    isbnDataDeleteLoanModalInput.value = isbn;
}

//Function for opening modal to confirm book returning / setting related data in the view and input
function openReturnLoanModal(modalId, loanId, userData, barcode, title, isbn, createdAt, dueDate) {
    openModal(modalId);
    var form = document.querySelector("#form-loan-return");
    form.setAttribute("action","/loans/"+loanId+"/return");
    var idDiv = document.querySelector("#"+modalId+" #return-loan-id-value");
    idDiv.innerHTML = loanId;
    var userDataDiv = document.querySelector("#"+modalId+" #return-loan-user-data-value");
    userDataDiv.innerHTML = userData;
    var barcodeDiv = document.querySelector("#"+modalId+" #return-loan-barcode-value");
    barcodeDiv.innerHTML = barcode;
    var titleDiv = document.querySelector("#"+modalId+" #return-loan-title-value");
    titleDiv.innerHTML = title;
    var isbnDiv = document.querySelector("#"+modalId+" #return-loan-isbn-value");
    isbnDiv.innerHTML = isbn;
    var createdAtDiv = document.querySelector("#"+modalId+" #return-loan-createdAt-value");
    createdAtDiv.innerHTML = createdAt;
    var dueDateDiv = document.querySelector("#"+modalId+" #return-loan-dueDate-value");
    dueDateDiv.innerHTML = dueDate;

    var bookDataReturnLoanModalDiv = document.getElementById("book-data-return-loan-modal");
    bookDataReturnLoanModalDiv.value = title;
    var userDataReturnLoanModalInput = document.getElementById("user-data-return-loan-modal");
    userDataReturnLoanModalInput.value = userData;
    var barcodeDataReturnLoanModalInput = document.getElementById("barcode-data-return-loan-modal");
    barcodeDataReturnLoanModalInput.value = barcode;
    var isbnDataReturnLoanModalInput = document.getElementById("isbn-data-return-loan-modal");
    isbnDataReturnLoanModalInput.value = isbn;
}

//Function to change 'display' value of the modal, using under control of other related functions
function openModal(modalId) {
    var modal = document.querySelector("#"+modalId);
    modal.style.display = "block";
}

//Function to change 'display' value of the modal (to hide), using under control of other related functions
function closeModal(modalId) {
    var modal = document.querySelector("#"+modalId);
    modal.style.display = "none";
}