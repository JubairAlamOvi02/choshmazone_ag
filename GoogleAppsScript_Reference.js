function doPost(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var date, time, timestamp;

    if (data.orderDate && data.orderTime) {
        date = data.orderDate;
        time = data.orderTime;
        timestamp = date + " " + time; // Combined for Timestamp column
    } else {
        var now = new Date();
        date = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
        time = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");
        timestamp = now.toString();
    }

    // Combine Name
    var customerName = data.firstName + " " + data.lastName;

    // Combine Payment Details
    var paymentDetails = "";
    if (data.paymentMethod === 'bkash') {
        paymentDetails = "Number: " + (data.bkashNumber || "") + ", TrxID: " + (data.bkashTrxId || "");
    } else {
        paymentDetails = "Cash on Delivery";
    }

    // Flatten items
    var itemsString = data.items.map(function (item) {
        return item.title + " (" + item.style + ") x" + item.quantity;
    }).join(", ");

    // STRICT COLUMN ORDER:
    // 1. Date
    // 2. Time
    // 3. Timestamp
    // 4. Order ID
    // 5. Customer Name
    // 6. Email
    // 7. Phone
    // 8. Address
    // 9. City
    // 10. Zip
    // 11. Payment Method
    // 12. Payment Details (bKash/COD)
    // 13. Order Items
    // 14. Total Amount

    sheet.appendRow([
        date,
        time,
        timestamp,
        data.orderId || "N/A",
        customerName,
        data.email,
        data.phone,
        data.address,
        data.city,
        data.zip,
        data.paymentMethod,
        paymentDetails,
        itemsString,
        data.totalAmount
    ]);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" })).setMimeType(ContentService.MimeType.JSON);
}
