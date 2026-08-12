import re

def fix_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # Add hover:border-slate-300 dark:hover:border-slate-600 for border-slate-200 ... dark:border-slate-700 ... placeholder
    # Or just replace it everywhere in inputs:
    # `bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500`
    
    old_str = "'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500'"
    new_str = "'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500'"
    content = content.replace(old_str, new_str)
    
    with open(path, 'w') as f:
        f.write(content)

fix_file('src/components/UserDashboard.tsx')
fix_file('src/components/Login.tsx')

print("Fixed hover borders.")
