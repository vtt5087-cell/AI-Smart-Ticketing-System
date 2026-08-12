import re

def fix_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # Find patterns like `${isDarkMode ? 'class1' : 'class2'}`
    def replacer(match):
        dark_classes = match.group(1).replace("'", "").replace('"', '').strip()
        light_classes = match.group(2).replace("'", "").replace('"', '').strip()
        
        # Split and prefix dark classes
        dark_parts = ['dark:' + c for c in dark_classes.split()]
        combined = light_classes + ' ' + ' '.join(dark_parts)
        # remove extra spaces
        combined = ' '.join(combined.split())
        return combined

    pattern = r"\$\{isDarkMode\s*\?\s*['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]\}"
    new_content = re.sub(pattern, replacer, content)

    # Some are not inside template literals:
    # isDarkMode ? 'bg-slate-800...' : 'bg-slate-50...'
    def replacer2(match):
        dark_classes = match.group(1).replace("'", "").replace('"', '').strip()
        light_classes = match.group(2).replace("'", "").replace('"', '').strip()
        dark_parts = ['dark:' + c for c in dark_classes.split()]
        combined = light_classes + ' ' + ' '.join(dark_parts)
        combined = ' '.join(combined.split())
        return "'" + combined + "'"

    pattern2 = r"isDarkMode\s*\?\s*['\"]([^'\"]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]"
    new_content = re.sub(pattern2, replacer2, new_content)

    with open(path, 'w') as f:
        f.write(new_content)

fix_file('src/components/UserDashboard.tsx')
fix_file('src/components/Login.tsx')
fix_file('src/App.tsx')

print("Fixed.")
