const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(appTsxPath, 'utf8');

const safeJsonHelper = `
  const safeJson = async (res: Response) => {
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      return { error: "Invalid server response format." };
    }
  };
`;

// Insert it right before fetchWithAuth
content = content.replace('  // Secure API fetch request wrapper', safeJsonHelper + '\n  // Secure API fetch request wrapper');

// Replace all await res*.json() with await safeJson(res*)
content = content.replace(/await\s+([a-zA-Z0-9_]+)\.json\(\)/g, 'await safeJson($1)');

fs.writeFileSync(appTsxPath, content, 'utf8');
