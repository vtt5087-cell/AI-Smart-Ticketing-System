const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

// Increase JSON limit
content = content.replace('app.use(express.json());', 'app.use(express.json({ limit: \'50mb\' }));');

// Add global error handler
const errorHandler = `
// Global error handler to ensure JSON responses for all errors
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Vite & Static file handler`;

content = content.replace('// Vite & Static file handler', errorHandler);

fs.writeFileSync(serverPath, content, 'utf8');
