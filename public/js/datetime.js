function createDateTimeStringFromDateObject(d, shortMonth = false) {
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dateStr = d.getDate()+" "+(shortMonth? shortMonths[d.getMonth()]:months[d.getMonth()])+" "+d.getFullYear();
    var timeStr = (d.getHours() < 10 ? '0' : '') + d.getHours() + ":" +(d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ":" + (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
    return dateStr+", "+timeStr;
}

function createDateStringFromDateObject(d, shortMonth = false) {
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dateStr = d.getDate()+" "+(shortMonth? shortMonths[d.getMonth()]:months[d.getMonth()])+" "+d.getFullYear();
    return dateStr;
}