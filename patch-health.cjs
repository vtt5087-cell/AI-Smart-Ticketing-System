const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  'const PORT = process.env.PORT || 3000;',
  'const PORT = process.env.PORT || 3000;\n\n// Health Check Endpoint\napp.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));\n'
);
fs.writeFileSync('server.ts', code);
