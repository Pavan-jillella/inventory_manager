/* eslint-env node */
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');
const { defineSecret } = require('firebase-functions/params');

admin.initializeApp();
const db = admin.firestore();
const smtpHost = defineSecret('REPORT_EMAIL_SMTP_HOST');
const smtpPort = defineSecret('REPORT_EMAIL_SMTP_PORT');
const smtpUser = defineSecret('REPORT_EMAIL_SMTP_USER');
const smtpPass = defineSecret('REPORT_EMAIL_SMTP_PASS');
const smtpFrom = defineSecret('REPORT_EMAIL_FROM');

const SHIFT_ORDER = ['morning', 'afternoon', 'night'];
const SHIFT_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};

const parseEmails = (raw) =>
  String(raw || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const escapeCsv = (value) => {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const createCsv = (logs) => {
  const header = [
    'Timestamp',
    'Shift',
    'Item',
    'Category',
    'Quantity',
    'RateType',
    'UnitRate',
    'TotalAmount',
    'Payment',
    'Staff',
    'Room',
    'Notes',
  ];
  const lines = [header.join(',')];
  logs.forEach((log) => {
    lines.push([
      log.timestamp || '',
      log.shiftLabel || SHIFT_LABELS[log.shift] || '',
      log.itemName || '',
      log.itemCategory || 'Other',
      log.quantity || 0,
      log.rateType || '',
      Number(log.unitRate || 0).toFixed(2),
      Number(log.totalAmount || 0).toFixed(2),
      log.paymentMethod || '',
      log.staffName || 'Unknown',
      log.roomNumber || '',
      log.notes || '',
    ].map(escapeCsv).join(','));
  });
  return lines.join('\n');
};

const getDateRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString(), reportDate: start };
};

const createTransporter = () => {
  const host = smtpHost.value();
  const port = Number(smtpPort.value() || 587);
  const user = smtpUser.value();
  const pass = smtpPass.value();
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

exports.sendDailyShiftReport = onSchedule(
  {
    schedule: '0 7 * * *',
    timeZone: 'America/New_York',
    memory: '256MiB',
    secrets: [smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom],
  },
  async () => {
    const settingsSnap = await db.collection('settings').doc('app').get();
    if (!settingsSnap.exists) {
      logger.info('settings/app not found. Skipping report.');
      return;
    }
    const settings = settingsSnap.data() || {};
    const emailReports = settings.emailReports || {};
    const recipients = parseEmails(emailReports.recipients);
    const sender = smtpFrom.value();
    if (!emailReports.enabled || recipients.length === 0 || !sender) {
      logger.info('Email reports disabled or missing recipients/sender.');
      return;
    }

    const transporter = createTransporter();
    if (!transporter) {
      logger.error('SMTP configuration missing. Cannot send report.');
      return;
    }

    const { startIso, endIso, reportDate } = getDateRange();
    const snap = await db
      .collection('logs')
      .where('timestamp', '>=', startIso)
      .where('timestamp', '<=', endIso)
      .get();
    const logs = snap.docs.map((doc) => doc.data());
    const grouped = SHIFT_ORDER.reduce((acc, shiftId) => {
      acc[shiftId] = logs.filter((log) => log.shift === shiftId);
      return acc;
    }, {});

    const summaryRows = SHIFT_ORDER.map((shiftId) => {
      const shiftLogs = grouped[shiftId];
      const entries = shiftLogs.length;
      const qty = shiftLogs.reduce((sum, log) => sum + Number(log.quantity || 0), 0);
      const amount = shiftLogs.reduce((sum, log) => sum + Number(log.totalAmount || 0), 0);
      return `<tr><td>${SHIFT_LABELS[shiftId]}</td><td>${entries}</td><td>${qty}</td><td>$${amount.toFixed(2)}</td></tr>`;
    }).join('');

    const reportDateText = reportDate.toISOString().slice(0, 10);
    const subject = `Daily Shift Report - ${reportDateText}`;
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Daily Combined Shift Report</h2>
        <p>Report date: <strong>${reportDateText}</strong></p>
        <table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse;">
          <thead><tr><th>Shift</th><th>Entries</th><th>Items</th><th>Revenue</th></tr></thead>
          <tbody>${summaryRows}</tbody>
        </table>
        <p>Attached: combined shift CSV.</p>
      </div>
    `;

    const attachmentContent = createCsv(logs);
    await transporter.sendMail({
      from: sender,
      to: recipients.join(','),
      subject,
      html,
      attachments: [
        {
          filename: `shift-report-${reportDateText}.csv`,
          content: attachmentContent,
          contentType: 'text/csv',
        },
      ],
    });

    await db.collection('settings').doc('app').set(
      {
        emailReports: {
          ...emailReports,
          lastSentAt: new Date().toISOString(),
        },
      },
      { merge: true }
    );
  }
);
