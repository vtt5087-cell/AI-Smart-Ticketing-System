const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'src/App.tsx');
let appContent = fs.readFileSync(appTsxPath, 'utf8');

// Remove import
appContent = appContent.replace(/import \{ FontPickerModal, FONT_OPTIONS \} from '\.\/components\/FontPickerModal';\n/, '');
appContent = appContent.replace(/,\n  Type/, ''); // Remove Type icon import

// Remove state variables for font
appContent = appContent.replace(/  \/\/ Font & Typography Readability State[\s\S]*?  \/\/ Session \/ Authentication state/m, '  // Session / Authentication state');

// Remove font button
appContent = appContent.replace(/          \{\/\* Typography \/ Eye Comfort Font Picker Button \*\/\}[\s\S]*?          \{\/\* Dark Mode Toggle \*\/}/m, '          {/* Dark Mode Toggle */}');

// Remove modal at the bottom
appContent = appContent.replace(/      \{\/\* Font & Readability Options Modal \*\/\}[\s\S]*?      \/>/, '');

fs.writeFileSync(appTsxPath, appContent, 'utf8');
