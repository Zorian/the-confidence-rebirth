/**
 * The Confidence Rebirth: lead CRM web app.
 * Receives the site's forms (application + course waitlist) and keeps one row per woman
 * in the "Leads" tab, matched by WhatsApp number, then email, then Instagram handle.
 *
 * Setup (in the theconfidencerebirth@gmail.com account):
 * 1. Open the Leads Google Sheet > Extensions > Apps Script. Paste this file in, save.
 * 2. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Deploy, approve.
 * 3. Copy the Web app URL (ends in /exec) into PAY.hook in main/index.html.
 */

const TAB = "Leads";
const COLS = ["First seen", "Last update", "Name", "WhatsApp", "Email", "Instagram", "Stage",
  "Method", "Course waitlist", "Offer", "Commit", "Invest", "Result", "Wants help with",
  "Consent", "Paid", "Added to Circle", "Confidence Type"];
// stages only ever move forward
const RANK = { "Quiz": 1, "Waitlist": 2, "Free member": 3, "Applied": 4, "Call booked": 5, "Paid": 6 };
const METHODS = { headtoe: "Head to Toe", beyond: "Beyond the Mirror", gogetter: "Go Getter", boundary: "Boundary Boss", comeback: "Comeback" };

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents || "{}");
    if (d.type === "quiz" || d.type === "quiz_join") saveQuiz(d);
    else if (d.type === "quiz_lead") { save(d); saveQuiz(d); quizEmail(d); }
    else save(d);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out({ ok: true, service: "Confidence Rebirth leads" }); }

function save(d) {
  const sh = sheet();
  const data = sh.getDataRange().getValues();
  const col = name => COLS.indexOf(name);
  const digits = v => String(v || "").replace(/\D/g, "");
  const low = v => String(v || "").trim().toLowerCase().replace(/^@+/, "");

  const phone = digits(d.phone), email = low(d.email), ig = low(d.ig);
  let r = -1;
  for (let i = 1; i < data.length && r < 0; i++) if (phone && digits(data[i][col("WhatsApp")]) === phone) r = i;
  for (let i = 1; i < data.length && r < 0; i++) if (email && low(data[i][col("Email")]) === email) r = i;
  for (let i = 1; i < data.length && r < 0; i++) if (ig && low(data[i][col("Instagram")]) === ig) r = i;

  const row = r < 0 ? COLS.map(() => "") : data[r].slice();
  while (row.length < COLS.length) row.push("");
  const now = new Date();
  const set = (name, v) => { if (v !== undefined && v !== null && v !== "") row[col(name)] = v; };
  const stage = s => { if ((RANK[s] || 0) > (RANK[row[col("Stage")]] || 0)) row[col("Stage")] = s; };
  const method = METHODS[d.method] || d.method || "";

  if (r < 0) row[col("First seen")] = now;
  row[col("Last update")] = now;
  set("Name", d.name);
  if (d.phone) row[col("WhatsApp")] = "'" + intl(d.phone); // always +country code
  set("Email", d.email);
  if (d.ig) row[col("Instagram")] = "@" + String(d.ig).replace(/^@+/, "");
  set("Consent", d.consent);

  if (d.type === "waitlist") {
    const list = String(row[col("Course waitlist")] || "").split(", ").filter(String);
    if (method && list.indexOf(method) < 0) list.push(method);
    row[col("Course waitlist")] = list.join(", ");
    stage("Waitlist");
  } else if (d.type === "quiz_lead") {
    set("Confidence Type", d.ctype);
    stage("Quiz");
  } else if (d.type === "waitlist_note") {
    const prev = row[col("Wants help with")];
    row[col("Wants help with")] = prev ? prev + "\n" + d.note : d.note;
  } else { // application
    set("Method", method);
    set("Offer", d.offer === "one" ? "1:1" : d.offer === "masterclass" ? "Masterclass" : d.offer);
    set("Commit", d.commit);
    set("Invest", d.invest);
    set("Result", d.result);
    stage("Applied");
  }

  if (r < 0) {
    const n = sh.getLastRow() + 1;
    row[col("Paid")] = false; row[col("Added to Circle")] = false;
    sh.getRange(n, 1, 1, COLS.length).setValues([row]);
    sh.getRange(n, col("Paid") + 1, 1, 2).insertCheckboxes();
  } else sh.getRange(r + 1, 1, 1, COLS.length).setValues([row]);
}

// "07…" is read as UK, "00…" becomes "+", anything else gets a "+"
function intl(v) {
  let s = String(v || "").trim(), d = s.replace(/\D/g, "");
  const plus = /^\+/.test(s) || /^00/.test(d);
  if (/^00/.test(d)) d = d.slice(2); else if (!plus && /^0/.test(d)) d = "44" + d.slice(1);
  return d ? "+" + d : "";
}

// Quiz tab: one anonymous row per finished quiz; "Joined community" ticks when she clicks the join button
const QUIZ_COLS = ["Date", "Confidence Type", "Method", "Focus", "Struggles", "Source", "Left details", "Joined community", "ID"];
function saveQuiz(d) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("Quiz");
  if (!sh) sh = ss.insertSheet("Quiz");
  if (sh.getLastRow() === 0) {
    sh.appendRow(QUIZ_COLS); sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, QUIZ_COLS.length).setFontWeight("bold");
  }
  if (d.type === "quiz_join" || d.type === "quiz_lead") {
    if (!d.id) return;
    const ids = sh.getRange(1, QUIZ_COLS.length, sh.getLastRow(), 1).getValues();
    const c = QUIZ_COLS.indexOf(d.type === "quiz_join" ? "Joined community" : "Left details") + 1;
    for (let i = ids.length - 1; i > 0; i--) if (ids[i][0] === d.id) { sh.getRange(i + 1, c).setValue("Yes"); return; }
    return;
  }
  sh.appendRow([new Date(), d.ctype || "", d.method || "", d.focus || "", d.struggles || "", d.source || "", "", "", d.id || ""]);
}

// The one automatic email: her result, Dani's video and her free seat. Sent from the account that owns this script.
function quizEmail(d) {
  if (!d.email || MailApp.getRemainingDailyQuota() < 1) return;
  const esc = v => String(v || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const first = String(d.name || "").trim().split(/\s+/)[0];
  const type = (d.the ? d.the + " " : "") + d.ctype;
  const btn = (href, text) => '<a href="' + esc(href) + '" style="display:inline-block;background:#F3E2A0;color:#2B2623;border:1px solid #2B2623;border-radius:999px;padding:14px 26px;font:600 13px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;text-decoration:none">' + text + '</a>';
  const p = t => '<p style="margin:0 0 16px">' + t + '</p>';
  let html = '<div style="max-width:520px;margin:0 auto;padding:28px 22px;background:#F7F3EA;color:#2B2623;font:16px/1.6 Arial,sans-serif">'
    + p("Hi " + esc(first) + ",")
    + '<p style="margin:0 0 6px">Your Confidence Type is</p><h1 style="margin:0 0 12px;font:400 38px/1.1 Georgia,serif">' + esc(type) + '</h1>'
    + p("<em>" + esc(d.hook) + "</em>")
    + p("<b>Try this today:</b> " + esc(d.win));
  if (d.video) html += p('<a href="' + esc(d.video) + '" style="color:#B4382F">Watch Dani\'s video for your type</a>');
  html += p("Your next step is live with Dani. " + (d.workshop ? "Her free workshop is on <b>" + esc(d.workshop) + "</b>, and s" : "S") + "he speaks to the " + esc(d.ctype) + " Confidence Type directly.")
    + '<p style="margin:0 0 22px">' + btn(d.join, "Save my free seat") + '</p>'
    + p("See you there,<br>The Confidence Rebirth")
    + '<p style="margin:24px 0 0;font-size:12px;color:#776D66">You got this because you took the confidence quiz at theconfidencerebirth.com. Reply STOP and we won\'t email you again.</p></div>';
  MailApp.sendEmail({ to: d.email, subject: "Your Confidence Type: " + type, htmlBody: html, name: "The Confidence Rebirth", replyTo: "theconfidencerebirth@gmail.com" });
}

// Run once from the editor: adds the new Leads heading, creates the Quiz tab, and asks Google for permission to send email
function setup() {
  const sh = sheet();
  sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight("bold");
  saveQuiz({ type: "quiz_join" });
  Logger.log("Emails left today: " + MailApp.getRemainingDailyQuota());
}

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TAB);
  if (!sh) sh = ss.insertSheet(TAB);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLS.length).setFontWeight("bold");
  }
  return sh;
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Run this once from the editor to check the Sheet fills in.
function test() {
  save({ type: "waitlist", method: "boundary", name: "Test", phone: "+44 7700 900000", ig: "test", consent: "yes" });
  save({ type: "waitlist_note", method: "boundary", phone: "+44 7700 900000", note: "Saying no at work" });
}
