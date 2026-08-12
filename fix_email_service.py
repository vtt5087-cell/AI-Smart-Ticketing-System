import re

with open("src/services/email_service.ts", "r") as f:
    text = f.read()

# Replace password passing to strip spaces
text = text.replace("pass: process.env.SMTP_PASSWORD,", "pass: process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\\s+/g, '') : undefined,")

with open("src/services/email_service.ts", "w") as f:
    f.write(text)
