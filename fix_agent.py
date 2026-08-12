with open("src/components/AgentDashboard.tsx", "r") as f:
    text = f.read()

text = text.replace("<Mail,\n  Archive className", "<Mail className")

# Fix the import if it's messed up
text = text.replace("import {\n  User,\n  ShieldAlert,\n  MessageSquare,\n  LayoutGrid,\n  Mail,\n  Archive\n} from 'lucide-react';", "import {\n  User,\n  ShieldAlert,\n  MessageSquare,\n  LayoutGrid,\n  Mail,\n  Archive\n} from 'lucide-react';")

with open("src/components/AgentDashboard.tsx", "w") as f:
    f.write(text)
