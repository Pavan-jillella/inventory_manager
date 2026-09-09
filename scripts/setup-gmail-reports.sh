#!/bin/bash
# Run locally. Secrets travel through stdin, never command arguments or files.
set -euo pipefail
set +x
cd "$(dirname "$0")/.."
command -v firebase >/dev/null || { echo 'Install Firebase CLI and sign in first.'; exit 1; }
test -d functions/node_modules/nodemailer || npm ci --prefix functions
read -r -p 'Gmail sender address [jkalyan190301@gmail.com]: ' report_sender
report_sender=${report_sender:-jkalyan190301@gmail.com}
read -r -s -p 'Gmail App Password (hidden): ' report_password
printf '\n'
trap 'unset report_password' EXIT
test -n "$report_password" || { echo 'No App Password entered. Nothing was configured.'; exit 1; }
# Verify SMTP authentication without sending a message.
printf '%s' "$report_password" | REPORT_SETUP_SENDER="$report_sender" node --input-type=commonjs -e '
const fs = require("node:fs");
const nodemailer = require("./functions/node_modules/nodemailer");
const transport = nodemailer.createTransport({host:"smtp.gmail.com",port:587,requireTLS:true,connectionTimeout:30000,socketTimeout:30000,auth:{user:process.env.REPORT_SETUP_SENDER,pass:fs.readFileSync(0,"utf8").replace(/\s/g,"")}});
transport.verify().then(()=>{transport.close();console.log("Gmail connection verified. No message sent.");}).catch(()=>{transport.close();console.error("Gmail rejected the connection. Check the sender and App Password.");process.exitCode=1;});
'
printf '%s' 'smtp.gmail.com' | firebase functions:secrets:set REPORT_EMAIL_SMTP_HOST --project country-inn-suites --data-file /dev/stdin
printf '%s' '587' | firebase functions:secrets:set REPORT_EMAIL_SMTP_PORT --project country-inn-suites --data-file /dev/stdin
printf '%s' "$report_sender" | firebase functions:secrets:set REPORT_EMAIL_SMTP_USER --project country-inn-suites --data-file /dev/stdin
printf '%s' "$report_sender" | firebase functions:secrets:set REPORT_EMAIL_FROM --project country-inn-suites --data-file /dev/stdin
printf '%s' "${report_password// /}" | firebase functions:secrets:set REPORT_EMAIL_SMTP_PASS --project country-inn-suites --data-file /dev/stdin
unset report_password
firebase deploy --config firebase.reports.json --project country-inn-suites --only functions
echo 'Report backend deployed. Choose recipients and delivery time in Admin > Settings, then save.'
