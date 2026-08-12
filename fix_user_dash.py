import re

with open("src/components/UserDashboard.tsx", "r") as f:
    text = f.read()

pattern = r"\{/\* Left Column: System Updates & Service logs \*/\}(.*?)\{/\* Right Column: Customer Official Response / Chat Workspace \*/\}"
text = re.sub(pattern, "{/* Right Column: Customer Official Response / Chat Workspace */}", text, flags=re.DOTALL)

text = text.replace('className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800`}', 'className={`pt-4 border-t border-slate-100 dark:border-slate-800`}')

with open("src/components/UserDashboard.tsx", "w") as f:
    f.write(text)
