const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(appTsxPath, 'utf8');

const regex = /  const safeJson = async \(res: Response\) => \{[\s\S]*?  \};\n/g;
content = content.replace(regex, '');

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

content = content.replace('  // Secure API fetch request wrapper', safeJsonHelper + '\n  // Secure API fetch request wrapper');

fs.writeFileSync(appTsxPath, content, 'utf8');
