function doPost(e) {
    var sheet = SpreadsheetApp.openById("1uUSgEOtTmEwsEzWMtNsshrQKkAXEZpY8fjbFARAjqX0").getSheets()[0];
    var data = JSON.parse(e.postData.contents);

    // Handle OTP Sending
    if (data.action === "sendOTP") {
        return handleSendOTP(data);
    }

    // Handle Order Logging (Defaults to this if no action or if it's an order)
    return handleOrderLogging(sheet, data);
}

function handleSendOTP(data) {
    var email = data.email;
    var otp = data.otp;

    var subject = "Your Verification Code - Choshma Zone";
    var htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #000; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Choshma Zone</h1>
      </div>
      <h2 style="color: #333; text-align: center;">Verification Code</h2>
      <p style="color: #555; line-height: 1.6;">Hello,</p>
      <p style="color: #555; line-height: 1.6;">Your verification code for tracking your order at <strong>Choshma Zone</strong> is:</p>
      <div style="background: #f4f4f4; padding: 25px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #000; margin: 25px 0; border-radius: 8px; border: 1px dashed #ccc;">
        ${otp}
      </div>
      <p style="color: #555; line-height: 1.6;">This code is valid for a short time. Please do not share this code with anyone.</p>
      <p style="color: #555; line-height: 1.6;">If you didn't request this code, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 11px; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} Choshma Zone. All rights reserved.</p>
    </div>
  `;

    try {
        MailApp.sendEmail({
            to: email,
            subject: subject,
            htmlBody: htmlBody
        });
    } catch (err) {
        console.error("Email Error: " + err.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "message": "OTP Sent" })).setMimeType(ContentService.MimeType.JSON);
}

function handleOrderLogging(sheet, data) {
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

    var customerName = data.firstName + " " + data.lastName;
    var paymentMethodDisplay = "";
    var paymentDescription = "";
    var bkashNumber = "";
    var trxId = "";

    if (data.paymentMethod === 'bkash') {
        paymentMethodDisplay = "bKash";
        paymentDescription = "bKash Payment";
        bkashNumber = "'" + data.bkashNumber;
        trxId = data.bkashTrxId;
    } else {
        paymentMethodDisplay = "COD";
        paymentDescription = "Cash on Delivery";
    }

    var itemsString = data.items.map(function (item) {
        return item.title + " (" + item.style + ") x" + item.quantity;
    }).join(", ");

    // STRICT COLUMN ORDER:
    // 1. Date, 2. Time, 3. Timestamp, 4. Order ID, 5. Customer Name, 6. Email, 7. Phone, 8. Address, 9. City, 10. Zip, 11. Payment Method, 12. Payment Details, 13. Bkash Number, 14. Transaction ID, 15. Order Items, 16. Total Amount
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
        bkashNumber,
        trxId,
        itemsString,
        data.totalAmount
    ]);

    // Send Order Confirmation Email
    try {
        var subject = "Order Confirmation #" + (data.orderId || "N/A") + " - Choshma Zone";
        var htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #333; text-align: center;">Order Received!</h2>
                <p>Hello ${customerName},</p>
                <p>Thank you for your order at <strong>Choshma Zone</strong>. We have successfully received your order and it is currently being processed.</p>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
                    <p style="margin: 5px 0;"><strong>Order ID:</strong> #${data.orderId || "N/A"}</p>
                    <p style="margin: 5px 0;"><strong>Total Amount:</strong> ৳${data.totalAmount}</p>
                    <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethodDisplay}</p>
                </div>
                <p>We will notify you once your order has been shipped. You can track your order on our website using your phone number.</p>
                <p>Best regards,<br><strong>The Choshma Zone Team</strong></p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 11px; color: #999; text-align: center;">This is an automated message, please do not reply.</p>
            </div>
        `;
        MailApp.sendEmail({
            to: data.email,
            subject: subject,
            htmlBody: htmlBody
        });
    } catch (e) {
        console.error("Order Email Error: " + e.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" })).setMimeType(ContentService.MimeType.JSON);
}
