import re

def fix_file(path):
    with open(path, 'r') as f:
        content = f.read()

    tooltip_style = "contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a' }} itemStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}"
    
    content = content.replace('<Tooltip />', f'<Tooltip {tooltip_style} />')
    content = content.replace("<Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />", f"<Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} {tooltip_style} />")
    
    with open(path, 'w') as f:
        f.write(content)

fix_file('src/components/AgentDashboard.tsx')
print("Tooltips fixed.")
