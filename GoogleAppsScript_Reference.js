function doPost(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var date, time, timestamp;

    if (data.orderDate && data.orderTime) {
        date = data.orderDate;
        time = data.orderTime;
        timestamp = date + " " + time;
    } else {
        var now = new Date();
        date = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
        time = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");
        timestamp = now.toString();
    }

    // Combine Name
    var customerName = data.firstName + " " + data.lastName;

    // Logic for separate columns
    var paymentMethodDisplay = "";
    var paymentDescription = "";
    var bkashNumber = "";
    var trxId = "";

    if (data.paymentMethod === 'bkash') {
        paymentMethodDisplay = "bKash";
        paymentDescription = "bKash Payment";
        bkashNumber = "'" + data.bkashNumber; // Adding ' to force text format in Sheets prevents scientific notation or number formatting issues
        trxId = data.bkashTrxId;
    } else {
        paymentMethodDisplay = "COD";
        paymentDescription = "Cash on Delivery";
    }

    // Flatten items
    var itemsString = data.items.map(function (item) {
        return item.title + " (" + item.style + ") x" + item.quantity;
    }).join(", ");

    // STRICT COLUMN ORDER (User Requested):
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
    // 13. Bkash Number (New separate column)
    // 14. Transaction ID (TrxID) (New separate column)
    // 15. Order Items
    // 16. Total Amount

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
        paymentMethodDisplay,
        paymentDescription,
        bkashNumber, // Column 13: Only populated if bKash
        trxId,       // Column 14: Only populated if bKash
        itemsString,
        data.totalAmount
    ]);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" })).setMimeType(ContentService.MimeType.JSON);
}
