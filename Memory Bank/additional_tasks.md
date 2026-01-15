
# Additional Tasks

## Completed
- [x] Update currency to Taka (৳) in all relevant files:
    - `src/components/ProductCard.jsx`
    - `src/components/Cart/CartItem.jsx`
    - `src/pages/ProductDetails.jsx`
    - `src/pages/Checkout.jsx`
    - `src/components/Shop/FilterSidebar.jsx`
- [x] Create Google Apps Script reference for splitting Timestamp into Date and Time columns (`GoogleAppsScript_Reference.js`)
    - Updated frontend to send local `orderDate` and `orderTime`.
    - Updated script reference to use client-provided timestamp.
- [x] Add Order ID and organize columns per user request.
    - Updated script reference to match exact header: `Date`, `Time`, `Timestamp`, `Order ID`, `Customer Name`, `Email`, `Phone`, `Address`, `City`, `Zip`, `Payment Method`, `Payment Details`, `Bkash Number`, `Transaction ID`, `Order Items`, `Total Amount`.
    - Implemented logic to split bKash details into separate columns.

**Status**: All additional tasks requested by the user involving Currency and Google Sheets customizations have been implemented and verified.
