import re
with open("server.ts", "r") as f:
    text = f.read()

# Fix the newline
text = text.replace("join(\"\n\");", "join(\"\\n\");")

with open("server.ts", "w") as f:
    f.write(text)
