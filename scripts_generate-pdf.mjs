import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../");
const OUT  = path.join(ROOT, "screenshots", "ACRS-showcase.pdf");

const W = 595.28;
const H = 841.89;
const M = 36; // margin

const AMBER = "#FF8F00";
const NAVY  = "#0D1117";
const TEXT  = "#C9D1D9";
const MUTED = "#8B949E";
const CARD  = "#161B22";

// ─── helpers ─────────────────────────────────────────────────────────────────

function beginPage(doc) {
  doc.addPage({ size: [W, H] });
  // clip entire page so text can NEVER overflow and trigger auto blank pages
  doc.save();
  doc.rect(0, 0, W, H).clip();
  doc.rect(0, 0, W, H).fill(NAVY);
  // top amber bar
  doc.rect(0, 0, W, 4).fill(AMBER);
}

function endPage(doc, page, total) {
  const y = H - 26;
  doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.4).stroke("#21262D");
  doc.font("Helvetica").fontSize(6).fillColor(MUTED)
    .text("India.RUNS — ACRS Platform  •  Confidential", M, y + 7, { lineBreak: false });
  doc.font("Helvetica").fontSize(6).fillColor(MUTED)
    .text(`Page ${page} of ${total}`, W - M - 50, y + 7, { width: 50, align: "right", lineBreak: false });
  doc.restore(); // release clip
}

function header(doc, title, sub) {
  doc.rect(M, 14, 24, 24).fill("#1C2128").stroke(AMBER + "66").lineWidth(0.8);
  doc.font("Helvetica-Bold").fontSize(6).fillColor(AMBER)
    .text("INDIA", M + 3, 20, { lineBreak: false })
    .text(".RUNS", M + 3, 27, { lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
    .text(title, M + 32, 18, { lineBreak: false });
  doc.font("Helvetica").fontSize(7).fillColor(MUTED)
    .text(sub, M + 32, 29, { lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(5.5).fillColor(AMBER)
    .text("ADVERSARIAL CANDIDATE RANKING SYSTEM", W - M - 155, 24, { width: 155, align: "right", lineBreak: false });
  doc.moveTo(M, 46).lineTo(W - M, 46).lineWidth(0.4).stroke("#21262D");
}

function pill(doc, x, y, label, bg, fg, fontSize = 7) {
  const tw = doc.font("Helvetica-Bold").fontSize(fontSize).widthOfString(label);
  const pw = tw + 10, ph = 13;
  doc.roundedRect(x, y, pw, ph, 3).fill(bg);
  doc.font("Helvetica-Bold").fontSize(fontSize).fillColor(fg)
    .text(label, x + 5, y + 3, { lineBreak: false });
  return pw + 4;
}

function card(doc, x, y, w, h) {
  doc.roundedRect(x, y, w, h, 5).fill(CARD).stroke("#21262D").lineWidth(0.5);
}

function statBox(doc, x, y, label, value, color) {
  card(doc, x, y, 108, 50);
  doc.font("Helvetica").fontSize(6).fillColor(MUTED)
    .text(label.toUpperCase(), x + 8, y + 8, { lineBreak: false, characterSpacing: 0.4 });
  doc.font("Helvetica-Bold").fontSize(19).fillColor(color)
    .text(value, x + 8, y + 20, { lineBreak: false });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function addDashboard(doc) {
  beginPage(doc);
  header(doc, "Dashboard — Command Center", "Real-time hiring intelligence overview");

  const Y = 55;
  doc.font("Helvetica-Bold").fontSize(13).fillColor(TEXT).text("Command Center", M, Y, { lineBreak: false });
  doc.font("Helvetica").fontSize(8).fillColor(MUTED)
    .text("Adversarial stress-testing for defensible hiring decisions", M, Y + 16, { lineBreak: false });

  // stat row
  const stats = [
    { label: "Total Candidates", value: "24", color: "#58A6FF" },
    { label: "Flagged Profiles",  value: "3",  color: "#F85149" },
    { label: "Highly Robust",     value: "14", color: "#3FB950" },
    { label: "Avg Score",         value: "72.4", color: AMBER },
  ];
  stats.forEach((s, i) => statBox(doc, M + i * 115, Y + 32, s.label, s.value, s.color));

  const PY = Y + 96;

  // ── left: New Ranking form ──
  const LW = 242, FH = 316;
  card(doc, M, PY, LW, FH);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(TEXT)
    .text("New Adversarial Ranking", M + 10, PY + 12, { lineBreak: false });
  doc.font("Helvetica").fontSize(7).fillColor(MUTED)
    .text("Stress-test candidates against a job description", M + 10, PY + 24, { lineBreak: false });

  const fields = [
    { label: "JOB TITLE",         val: "Senior Backend Engineer",                           lines: 1 },
    { label: "JOB DESCRIPTION",   val: "We are looking for a Senior Backend Engineer\nwith 5+ years Python, Django, AWS…",  lines: 2 },
    { label: "CANDIDATE RESUMES", val: "Arjun Mehta — 7 yrs Python, AWS, Docker\n---\nPriya Nair — 4 yrs Django, PostgreSQL", lines: 3 },
  ];
  let fy = PY + 42;
  fields.forEach(f => {
    doc.font("Helvetica-Bold").fontSize(5.5).fillColor(MUTED)
      .text(f.label, M + 10, fy, { lineBreak: false, characterSpacing: 0.5 });
    fy += 9;
    const fh = f.lines * 14 + 4;
    doc.roundedRect(M + 10, fy, LW - 20, fh, 3).fill("#0D1117").stroke("#30363D").lineWidth(0.5);
    doc.font("Helvetica").fontSize(7).fillColor(TEXT)
      .text(f.val, M + 14, fy + 4, { width: LW - 28, lineBreak: false });
    fy += fh + 8;
  });

  // CTA
  doc.roundedRect(M + 10, fy + 4, LW - 20, 24, 4).fill(AMBER);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(NAVY)
    .text("▶  Start Adversarial Ranking", M + 10, fy + 10, { width: LW - 20, align: "center", lineBreak: false });

  // ── right: Recent Rankings ──
  const RX = M + LW + 12, RW = W - M - RX;
  card(doc, RX, PY, RW, FH);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(TEXT)
    .text("Recent Rankings", RX + 10, PY + 12, { lineBreak: false });
  doc.font("Helvetica").fontSize(7).fillColor(MUTED)
    .text("Click a row to view full results", RX + 10, PY + 24, { lineBreak: false });

  const ranks = [
    { title: "Senior Backend Engineer",  status: "completed", n: 8 },
    { title: "ML Research Scientist",    status: "completed", n: 12 },
    { title: "Product Manager — Growth", status: "running",   n: 6 },
    { title: "DevOps Lead",              status: "pending",   n: 5 },
  ];
  const sc = { completed: "#3FB950", running: AMBER, pending: "#58A6FF" };
  let ry = PY + 40;
  ranks.forEach(r => {
    doc.moveTo(RX, ry).lineTo(RX + RW, ry).lineWidth(0.3).stroke("#21262D");
    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
      .text(r.title, RX + 10, ry + 8, { width: RW - 50, lineBreak: false });
    const c = sc[r.status] ?? MUTED;
    pill(doc, RX + 10, ry + 21, r.status.toUpperCase(), c + "22", c, 6);
    doc.font("Helvetica").fontSize(6.5).fillColor(MUTED)
      .text(`${r.n} candidates`, RX + 90, ry + 24, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(MUTED)
      .text("›", RX + RW - 22, ry + 16, { lineBreak: false });
    ry += 46;
  });
}

// ─── Ranking Results ─────────────────────────────────────────────────────────

function addRankingResults(doc) {
  beginPage(doc);
  header(doc, "Ranking Results", "Adversarial stress-test leaderboard with explainability");

  const Y = 55;
  doc.font("Helvetica-Bold").fontSize(13).fillColor(TEXT)
    .text("Senior Backend Engineer", M, Y, { lineBreak: false });

  let cx = M;
  const chips = [
    { l: "8 Candidates", bg: "#1C2128",   fg: TEXT },
    { l: "2 Flagged",    bg: "#F8514922", fg: "#F85149" },
    { l: "5 Robust",     bg: "#3FB95022", fg: "#3FB950" },
    { l: "Avg 74.2",     bg: "#FF8F0022", fg: AMBER },
  ];
  chips.forEach(c => { cx += pill(doc, cx, Y + 16, c.l, c.bg, c.fg, 6.5); });

  // mini kpi strip
  const kpiY = Y + 34;
  [
    { l: "TOTAL",          v: "8",    color: TEXT },
    { l: "FLAGGED",        v: "2",    color: "#F85149" },
    { l: "HIGHLY ROBUST",  v: "5",    color: "#3FB950" },
    { l: "AVG ROBUSTNESS", v: "78.3", color: AMBER },
  ].forEach((k, i) => {
    card(doc, M + i * 124, kpiY, 118, 36);
    doc.font("Helvetica").fontSize(5.5).fillColor(MUTED)
      .text(k.l, M + i*124 + 8, kpiY + 6, { lineBreak: false, characterSpacing: 0.4 });
    doc.font("Helvetica-Bold").fontSize(14).fillColor(k.color)
      .text(k.v, M + i*124 + 8, kpiY + 15, { lineBreak: false });
  });

  // leaderboard
  const tY = kpiY + 46;
  const cols = [M, M+26, M+152, M+210, M+268, M+326, M+388, M+450];
  const hdrs = ["#", "Candidate", "Final", "Fit", "Robust", "Risk", "Verdict", ""];

  doc.rect(M, tY, W - M*2, 15).fill("#1C2128");
  hdrs.forEach((h, i) => {
    doc.font("Helvetica-Bold").fontSize(5.5).fillColor(MUTED)
      .text(h.toUpperCase(), cols[i], tY + 5, { lineBreak: false, characterSpacing: 0.3 });
  });

  const rows = [
    { rank: "🏆", name: "Arjun Mehta",      final: 91.2, fit: 88.4, robust: 94.1, risk: "low",    verdict: "Strong Hire", star: true },
    { rank: "#2",  name: "Priya Nair",        final: 83.7, fit: 81.2, robust: 86.3, risk: "low",    verdict: "Hire",        star: true },
    { rank: "#3",  name: "Vikram Sinha",      final: 74.5, fit: 79.8, robust: 69.2, risk: "medium", verdict: "Consider",    star: false },
    { rank: "#4",  name: "Aisha Patel",       final: 68.1, fit: 65.3, robust: 71.0, risk: "low",    verdict: "Consider",    star: true },
    { rank: "#5",  name: "Rahul Desai ⚠",    final: 52.3, fit: 77.1, robust: 27.5, risk: "high",   verdict: "Reject",      star: false },
    { rank: "#6",  name: "Sneha Iyer",        final: 48.9, fit: 46.2, robust: 51.6, risk: "low",    verdict: "Reject",      star: false },
    { rank: "#7",  name: "Karan Malhotra ⚠", final: 31.4, fit: 58.8, robust: 4.0,  risk: "high",   verdict: "Reject",      star: false },
    { rank: "#8",  name: "Deepa Krishnan",    final: 29.7, fit: 28.1, robust: 31.3, risk: "low",    verdict: "Reject",      star: false },
  ];
  const riskC    = { low: "#3FB950", medium: AMBER, high: "#F85149" };
  const verdictC = { "Strong Hire": "#3FB950", Hire: "#3FB950", Consider: AMBER, Reject: "#F85149" };
  const scoreC   = v => v >= 80 ? "#3FB950" : v >= 60 ? AMBER : "#F85149";

  rows.forEach((r, i) => {
    const ry2 = tY + 15 + i * 26;
    doc.rect(M, ry2, W - M*2, 26).fill(i % 2 === 0 ? "#0D1117" : "#161B22");
    doc.font("Helvetica-Bold").fontSize(8).fillColor(i === 0 ? AMBER : MUTED)
      .text(r.rank, cols[0], ry2 + 9, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
      .text(r.name, cols[1], ry2 + 5, { width: 115, lineBreak: false });
    if (r.star) doc.font("Helvetica").fontSize(6).fillColor("#3FB950")
      .text("Robust", cols[1], ry2 + 16, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(scoreC(r.final))
      .text(r.final.toFixed(1), cols[2], ry2 + 9, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(scoreC(r.fit))
      .text(r.fit.toFixed(1),   cols[3], ry2 + 9, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(scoreC(r.robust))
      .text(r.robust.toFixed(1),cols[4], ry2 + 9, { lineBreak: false });
    pill(doc, cols[5], ry2 + 7, r.risk.toUpperCase(),  riskC[r.risk]    + "22", riskC[r.risk],    6);
    pill(doc, cols[6], ry2 + 7, r.verdict,             verdictC[r.verdict] + "22", verdictC[r.verdict], 6);
  });

  // flag banner
  const bY = tY + 15 + rows.length * 26 + 8;
  doc.roundedRect(M, bY, W - M*2, 22, 4).fill("#F8514910").stroke("#F8514930").lineWidth(0.5);
  doc.font("Helvetica").fontSize(7).fillColor("#F85149")
    .text("⚠  2 candidates flagged for high manipulation risk — keyword stuffing & anomalous rank instability detected.", M + 10, bY + 8, { width: W - M*2 - 20, lineBreak: false });

  // explainability teaser box
  const eY = bY + 34;
  card(doc, M, eY, W - M*2, 158);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(TEXT)
    .text("Explainability — Arjun Mehta  #1", M + 10, eY + 10, { lineBreak: false });

  // 5 tabs
  const tabs = ["Profile", "Match Analysis", "Adversarial Tests", "Red Flags", "Verdict"];
  let tx = M + 10;
  tabs.forEach((t, i) => {
    const active = i === 2;
    const tw2 = doc.font("Helvetica-Bold").fontSize(7).widthOfString(t) + 12;
    doc.roundedRect(tx, eY + 24, tw2, 16, 3)
      .fill(active ? AMBER + "22" : "#21262D")
      .stroke(active ? AMBER + "66" : "#30363D").lineWidth(0.5);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(active ? AMBER : MUTED)
      .text(t, tx + 6, eY + 29, { lineBreak: false });
    tx += tw2 + 4;
  });

  // adversarial tests content
  const tests = [
    { type: "Skill Swap",          shift: 0, robust: true  },
    { type: "Experience Fluff",    shift: 0, robust: true  },
    { type: "Keyword Stuffing",    shift: 1, robust: true  },
    { type: "Irrelevant Skills",   shift: 0, robust: true  },
    { type: "Experience Reduction",shift: 1, robust: true  },
  ];
  const testCols = [M + 10, M + 150, M + 300, M + 390];
  const thY = eY + 46;
  ["Perturbation Type", "Rank Before → After", "Shift", "Robust?"].forEach((h, i) => {
    doc.font("Helvetica-Bold").fontSize(5.5).fillColor(MUTED)
      .text(h.toUpperCase(), testCols[i], thY, { lineBreak: false, characterSpacing: 0.3 });
  });
  tests.forEach((t, i) => {
    const ty2 = thY + 12 + i * 18;
    doc.font("Helvetica").fontSize(7.5).fillColor(TEXT)
      .text(t.type, testCols[0], ty2, { lineBreak: false });
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED)
      .text(`#1 → #${1 + t.shift}`, testCols[1], ty2, { lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(t.shift === 0 ? "#3FB950" : AMBER)
      .text(`${t.shift === 0 ? "0" : "+"+t.shift}`, testCols[2], ty2, { lineBreak: false });
    pill(doc, testCols[3], ty2 - 2, t.robust ? "YES" : "NO",
      (t.robust ? "#3FB950" : "#F85149") + "22",
      t.robust ? "#3FB950" : "#F85149", 6);
  });
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#3FB950")
    .text("Robustness Score: 94.1 / 100  —  Highly Robust ✓", M + 10, eY + 140, { lineBreak: false });
}

// ─── Admin Panel ─────────────────────────────────────────────────────────────

function addAdmin(doc) {
  beginPage(doc);
  header(doc, "Admin Panel", "Configure adversary engine and perturbation settings");

  const Y = 55;
  doc.font("Helvetica-Bold").fontSize(13).fillColor(TEXT)
    .text("Admin Panel", M, Y, { lineBreak: false });
  doc.font("Helvetica").fontSize(8).fillColor(MUTED)
    .text("Configure the adversary engine and system settings", M, Y + 16, { lineBreak: false });

  // ── Engine config card ──
  const CY = Y + 34;
  card(doc, M, CY, W - M*2, 104);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
    .text("⚡  Adversary Engine Configuration", M + 10, CY + 11, { lineBreak: false });

  doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
    .text("Number of Variants", M + 10, CY + 30, { lineBreak: false });
  doc.font("Helvetica").fontSize(7).fillColor(MUTED)
    .text("Stress tests generated per candidate", M + 10, CY + 41, { lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(20).fillColor(AMBER)
    .text("5", W - M - 28, CY + 28, { lineBreak: false });

  const sliderX = M + 10, sliderW = W - M*2 - 50, sliderY = CY + 57;
  doc.rect(sliderX, sliderY, sliderW, 4).fill("#21262D");
  doc.rect(sliderX, sliderY, sliderW * 0.4, 4).fill(AMBER);
  doc.circle(sliderX + sliderW * 0.4, sliderY + 2, 5).fill(AMBER);
  doc.font("Helvetica").fontSize(5.5).fillColor(MUTED)
    .text("3 (Fast)", sliderX, sliderY + 8, { lineBreak: false })
    .text("10 (Thorough)", W - M - 60, sliderY + 8, { lineBreak: false });

  doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
    .text("Perturbation Intensity", M + 10, CY + 80, { lineBreak: false });
  ["Low", "Medium", "High"].forEach((lvl, i) => {
    const bx = M + 150 + i * 90;
    const active = lvl === "Medium";
    doc.roundedRect(bx, CY + 78, 84, 18, 4)
      .fill(active ? AMBER + "22" : "#21262D")
      .stroke(active ? AMBER + "88" : "#30363D").lineWidth(0.5);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(active ? AMBER : MUTED)
      .text(lvl, bx, CY + 83, { width: 84, align: "center", lineBreak: false });
  });

  // ── Perturbation types ──
  const PY = CY + 116;
  const perturbs = [
    { label: "Skill Swap",                  desc: "Replace 1-3 key skills with irrelevant ones", on: true },
    { label: "Experience Fluff",            desc: "Inflate experience by 2-10 years",            on: true },
    { label: "Keyword Stuffing",            desc: "Add 5-15 repetitions of key skills",          on: true },
    { label: "Irrelevant Skills",           desc: "Add 2-5 random irrelevant skills",            on: true },
    { label: "Experience Reduction",        desc: "Reduce experience by 2-7 years",              on: true },
    { label: "Skill Removal",               desc: "Remove 1-3 important skills",                 on: true },
    { label: "Education Downgrade",         desc: "Lower education level by 1-2 steps",          on: false },
    { label: "Education Upgrade",           desc: "Raise education level artificially",           on: false },
    { label: "Company Reputation Change",   desc: "Change company prestige level",               on: false },
    { label: "Award Exaggeration",          desc: "Add fake awards and certifications",           on: false },
    { label: "Publication Falsification",   desc: "Add fake publications and research",           on: false },
  ];

  // 2 columns
  const COLS = 2;
  const ROWS = Math.ceil(perturbs.length / COLS);
  const colW = (W - M*2 - 20) / COLS;
  const rowH = 32;
  const cardH = ROWS * rowH + 36;
  card(doc, M, PY, W - M*2, cardH);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
    .text("🛡  Perturbation Types", M + 10, PY + 10, { lineBreak: false });
  doc.font("Helvetica").fontSize(7).fillColor(MUTED)
    .text("6 / 11 active", W - M - 60, PY + 12, { width: 50, align: "right", lineBreak: false });

  perturbs.forEach((p, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const px = M + 10 + col * (colW + 8);
    const py = PY + 30 + row * rowH;
    doc.roundedRect(px, py, colW, rowH - 4, 4)
      .fill(p.on ? AMBER + "0C" : "#21262D")
      .stroke(p.on ? AMBER + "44" : "#30363D").lineWidth(0.5);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(p.on ? TEXT : MUTED)
      .text(p.label, px + 8, py + 5, { width: colW - 28, lineBreak: false });
    doc.font("Helvetica").fontSize(6).fillColor(MUTED)
      .text(p.desc, px + 8, py + 16, { width: colW - 28, lineBreak: false });
    // toggle
    doc.roundedRect(px + colW - 20, py + 9, 14, 10, 3)
      .fill(p.on ? AMBER : "#30363D");
    if (p.on) doc.font("Helvetica-Bold").fontSize(6).fillColor(NAVY)
      .text("✓", px + colW - 18, py + 11, { lineBreak: false });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const doc = new PDFDocument({ autoFirstPage: false, size: [W, H] });
  const stream = fs.createWriteStream(OUT);
  doc.pipe(stream);

  addDashboard(doc);        endPage(doc, 1, 3);
  addRankingResults(doc);   endPage(doc, 2, 3);
  addAdmin(doc);            endPage(doc, 3, 3);

  doc.end();
  await new Promise(res => stream.on("finish", res));
  console.log("✓ PDF written to:", OUT);
}

main().catch(err => { console.error(err); process.exit(1); });
