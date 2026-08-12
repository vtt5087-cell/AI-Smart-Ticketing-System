const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/AgentDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = {
  'bg-white': 'bg-white dark:bg-slate-900',
  'bg-slate-50': 'bg-slate-50 dark:bg-slate-800',
  'bg-slate-100': 'bg-slate-100 dark:bg-slate-700',
  'bg-slate-200': 'bg-slate-200 dark:bg-slate-600',
  'border-slate-100': 'border-slate-100 dark:border-slate-700',
  'border-slate-200': 'border-slate-200 dark:border-slate-600',
  'border-slate-300': 'border-slate-300 dark:border-slate-500',
  'text-slate-500': 'text-slate-500 dark:text-slate-400',
  'text-slate-600': 'text-slate-600 dark:text-slate-300',
  'text-slate-700': 'text-slate-700 dark:text-slate-200',
  'text-slate-800': 'text-slate-800 dark:text-slate-100',
  'text-slate-900': 'text-slate-900 dark:text-slate-50',
};

// Also replace things that were already "dark" theme hardcoded, because they would look bad in light mode!
// Wait, is there any?
// Let's first just do the light ones since the user complained about them not having a dark mode.

for (const [light, darkPair] of Object.entries(replacements)) {
  // Use a regex to match the class name when it is whole word, and avoid replacing it multiple times if run twice
  const regex = new RegExp(`\\b${light}\\b(?! dark:)`, 'g');
  content = content.replace(regex, darkPair);
}

// Write it back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed AgentDashboard dark mode');
