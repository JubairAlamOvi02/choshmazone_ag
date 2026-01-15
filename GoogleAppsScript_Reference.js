function doPost(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var now = new Date();
    var date = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
    var time = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");

    // Flatten items for readable format in sheet
    var itemsString = data.items.map(function (item) {
        return item.title + " (" + item.style + ") x" + item.quantity;
    }).join(", ");

    sheet.appendRow([
        date, // Date in first column
        time, // Time in second column
        data.email,
        data.phone,
        data.firstName,
        data.lastName,
        data.address,
        data.city,
        data.zip,
        data.country,
        data.paymentMethod,
        data.bkashNumber || "",
        data.bkashTrxId || "",
        itemsString,
        data.totalAmount
    ]);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" })).setMimeType(ContentService.MimeType.JSON);
}
