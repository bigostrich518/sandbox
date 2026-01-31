/**
 * EMAIL VELOCITY BACKEND
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Copy this code into the script editor.
 * 4. Run the 'setup' function once to create the header row.
 * 5. Set up a Trigger:
 *    - Function: logEmailStats
 *    - Event Source: Time-driven
 *    - Type: Minutes timer
 *    - Interval: Every 5 minutes (or 10, 15)
 * 6. Deploy as Web App:
 *    - Deploy > New Deployment > Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Copy the Web App URL and paste it into the frontend app.
 */

// CONFIGURATION
const SHEET_NAME = 'VelocityData';
// SECURITY: Change this to a secret processing key. 
// You will need to enter this in the frontend dashboard to access data.
const API_KEY = 'velocity123';

function setup() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        // Headers: Timestamp, Inflow (New Messages), Outflow (Archived/Deleted), Inbox Total, Unread Total
        sheet.appendRow(['Timestamp', 'Inflow', 'Outflow', 'Inbox Total', 'Unread Total']);
    }
}

function logEmailStats() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return; // Run setup first

    const now = new Date();

    // DYNAMIC TIME WINDOW: Get the last run time from storage, or default to 1 hour ago if first run
    const scriptProperties = PropertiesService.getScriptProperties();
    const lastRunStr = scriptProperties.getProperty('LAST_RUN_TIME');
    let lastRunTime = lastRunStr ? new Date(parseInt(lastRunStr)) : new Date(now.getTime() - (60 * 60 * 1000));

    // Save THIS run time for next time
    scriptProperties.setProperty('LAST_RUN_TIME', now.getTime().toString());

    // Convert to seconds for Gmail query
    const timeQuery = Math.floor(lastRunTime.getTime() / 1000);

    // 1. INFLOW: Messages received since the last run
    const inflowQuery = `after:${timeQuery} -from:me`;
    const inflowThreads = GmailApp.search(inflowQuery);
    const inflowCount = inflowThreads.length;

    // 2. EXIT VELOCITY (SENT): Messages sent by me since the last run
    const sentQuery = `after:${timeQuery} from:me`;
    const sentThreads = GmailApp.search(sentQuery);
    const sentCount = sentThreads.length;

    // SNAPSHOT METRICS
    const unreadCount = GmailApp.getInboxUnreadCount();

    // Note: We are deprecating "Total Inbox" using search because it hits API limits (max 500).
    // Unless we use Advanced Gmail API, Unread is the best proxy for "Active Load".
    const totalInboxThreads = 0; // Deprecated placeholder

    // STORE: [Timestamp, Inflow, Sent, Inbox(Deprecated), Unread]
    sheet.appendRow([now, inflowCount, sentCount, totalInboxThreads, unreadCount]);

    // Prune old data (keep last 30 days ~ 8640 rows at 5min interval)
    const lastRow = sheet.getLastRow();
    if (lastRow > 9000) {
        sheet.deleteRows(2, lastRow - 9000);
    }
}

function doGet(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    // Return last 1000 rows (approx 3-4 days of data at 5min interval)
    const lastRow = sheet.getLastRow();
    const startRow = Math.max(2, lastRow - 1000);
    const numRows = lastRow - startRow + 1;

    let data = [];
    if (numRows > 0) {
        data = sheet.getRange(startRow, 1, numRows, 5).getValues();
    }

    // Format: [Timestamp, Inflow, Outflow, InboxTotal, UnreadTotal]
    const response = {
        status: 'success',
        data: data.map(row => ({
            ts: row[0],
            inflow: row[1],
            sent: row[2], // Was 'outflow', now 'sent'
            inbox: row[3],
            unread: row[4]
        }))
    };

    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}
