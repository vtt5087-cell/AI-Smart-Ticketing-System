import re

with open("server.ts", "r") as f:
    text = f.read()

# Remove the POST auto-respond endpoint
pattern = r"// POST /api/tickets/:id/auto-respond.*?// DELETE /api/tickets/:id - Only AGENT or ADMIN can delete"
text = re.sub(pattern, "// DELETE /api/tickets/:id - Only AGENT or ADMIN can delete", text, flags=re.DOTALL)

with open("server.ts", "w") as f:
    f.write(text)
