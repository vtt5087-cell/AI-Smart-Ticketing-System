const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(appTsxPath, 'utf8');

// Replace everything between }, []); and // Secure API fetch request wrapper
content = content.replace(/  \}, \[\]\);[\s\S]*?  \/\/ Secure API fetch request wrapper/, `  }, []);

  const safeJson = async (res: Response) => {
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      return { error: "Invalid server response format." };
    }
  };

  // Secure API fetch request wrapper`);

fs.writeFileSync(appTsxPath, content, 'utf8');
