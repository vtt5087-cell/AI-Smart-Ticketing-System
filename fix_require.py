import re

with open("server.ts", "r") as f:
    text = f.read()

target = """app.get("/api/email-logs", (req, res) => {
  res.json(require('./src/services/email_service').emailDispatchLogs);
});"""

replacement = """app.get("/api/email-logs", (req, res) => {
  res.json(emailDispatchLogs);
});"""

text = text.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(text)
