import re

with open("server.ts", "r") as f:
    text = f.read()

target = """app.get("/api/email-logs", authenticate, (req, res) => {"""

replacement = """app.get("/api/email-logs", (req, res) => {"""

text = text.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(text)
