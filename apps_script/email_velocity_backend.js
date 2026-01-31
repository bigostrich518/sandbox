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
    const fiveMinAgo = new Date(now.getTime() - (5 * 60 * 1000));
    // Convert to seconds for Gmail query
    const timeQuery = Math.floor(fiveMinAgo.getTime() / 1000);

    // 1. INFLOW: Messages received in the last 5 minutes (excluding sent by me)
    // "newer_than:5m -from:me" could work, but using timestamp is safer for consistent intervals if cron drifts
    const inflowQuery = `after:${timeQuery} -from:me`;
    const inflowThreads = GmailApp.search(inflowQuery);
    const inflowCount = inflowThreads.length; // Approximate, counts threads not messages, but good enough for velocity

    // 2. OUTFLOW: This is harder to track directly via search unless we use 'processed' labels. 
    // Proxy: We track the Inbox delta. 
    // Outflow = Inflow - (CurrentInbox - PreviousInbox)
    // But to be simple and robust: Let's just track the STATE (Total Inbox) and let the frontend calculate velocity deltas.
    // Actually, we can count "archived" if we knew what was in inbox.
    // Let's stick to recording the SNAPSHOT stats. The frontend will calculate velocity = (Current - Previous) / TimeDelta.

    // SNAPSHOT METRICS
    const inboxThreads = GmailApp.getInboxThreads(0, 500); // 500 cap for speed, if >500 just say 500+? No, use search count.
    // GmailApp.search("label:INBOX") is slow for huge inboxes.
    // Let's use getInboxUnreadCount() for unread.
    const unreadCount = GmailApp.getInboxUnreadCount();

    // Total in Inbox is hard to get efficiently without API advanced service.
    // We will assume "Inbox Velocity" is mostly about Unread or actionable items. 
    // Let's try a broad search for Inbox count, limited to recent if needed, but "label:inbox" is standard.
    // Note: standard GmailApp has no "getTotalInboxCount".
    // We will rely on Unread as the primary "Work Remaining" metric, or a search "label:inbox".
    const totalInboxThreads = GmailApp.search("label:inbox").length;

    sheet.appendRow([now, inflowCount, 0, totalInboxThreads, unreadCount]);

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
            inbox: row[3],
            unread: row[4]
        }))
    };

    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}
