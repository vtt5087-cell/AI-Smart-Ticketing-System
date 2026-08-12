const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/AgentDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The AI Model selector is around line 451
const toReplace = `          <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">AI Model:</span>
            <button
              onClick={() => onSelectAiProvider('gemini')}
              className={\`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer \${
                selectedAiProvider === 'gemini' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }\`}
            >
              Gemini
            </button>
            <button
              onClick={() => onSelectAiProvider('ollama')}
              className={\`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer \${
                selectedAiProvider === 'ollama' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }\`}
            >
              Heuristic
            </button>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to clear all active tickets and reset the workspace?')) {
                  const res = await fetch('/api/system/reset', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': \`Bearer \${token}\`
                    }
                  });
                  if (res.ok) {
                    onRefreshData();
                    alert('Workspace reset successful!');
                  }
                }
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition-colors border border-slate-700 flex items-center gap-1 cursor-pointer ml-1"
              title="Reset System State"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset State</span>
            </button>
          </div>`;

const replacement = `          <div className="flex items-center space-x-1.5">
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to clear all active tickets and reset the workspace?')) {
                  const res = await fetch('/api/system/reset', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': \`Bearer \${token}\`
                    }
                  });
                  if (res.ok) {
                    onRefreshData();
                    alert('Workspace reset successful!');
                  }
                }
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              title="Reset System State"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset Workspace</span>
            </button>
          </div>`;

content = content.replace(toReplace, replacement);
fs.writeFileSync(filePath, content, 'utf8');
