import re

with open("server.ts", "r") as f:
    text = f.read()

target = """// AUTOMATION LOGS & COMPLIANCE ENDPOINTS"""

replacement = """app.get("/api/email-logs", authenticate, (req, res) => {
  res.json(require('./src/services/email_service').emailDispatchLogs);
});

// AUTOMATION LOGS & COMPLIANCE ENDPOINTS"""

text = text.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(text)
