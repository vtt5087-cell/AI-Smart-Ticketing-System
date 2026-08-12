import re

with open("src/components/AgentDashboard.tsx", "r") as f:
    text = f.read()

# Add Bell to imports
if "Bell," not in text and "{ Bell }" not in text:
    text = text.replace("import { ", "import { Bell, ", 1)

# Add state
if "const [showNotification, setShowNotification]" not in text:
    text = text.replace(
        "const [chatMessage, setChatMessage] = useState('');",
        "const [chatMessage, setChatMessage] = useState('');\n  const [showNotification, setShowNotification] = useState(false);"
    )

# trigger notification in handleSendChatMessage
target_handle = """  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedTicket) return;

    const messages = [...(selectedTicket.messages || [])];
    messages.push({
      id: `m-${Date.now()}`,
      sender: 'operator',
      senderName: user.name || 'System',
      text: chatMessage,
      createdAt: new Date().toISOString()
    });

    onUpdateTicket(selectedTicket.id, { messages });
    setChatMessage('');
  };"""
replacement_handle = """  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedTicket) return;

    const messages = [...(selectedTicket.messages || [])];
    messages.push({
      id: `m-${Date.now()}`,
      sender: 'operator',
      senderName: user.name || 'System',
      text: chatMessage,
      createdAt: new Date().toISOString()
    });

    onUpdateTicket(selectedTicket.id, { messages });
    setChatMessage('');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };"""
text = text.replace(target_handle, replacement_handle)

# trigger for AI auto respond
target_ai_resp = """      const messages = [...(selectedTicket.messages || [])];
      messages.push({
        id: `m-${Date.now()}`,
        sender: 'agent',
        senderName: 'AI Support',
        text: data.response,
        createdAt: new Date().toISOString()
      });
      onUpdateTicket(selectedTicket.id, { messages });"""
replacement_ai_resp = """      const messages = [...(selectedTicket.messages || [])];
      messages.push({
        id: `m-${Date.now()}`,
        sender: 'agent',
        senderName: 'AI Support',
        text: data.response,
        createdAt: new Date().toISOString()
      });
      onUpdateTicket(selectedTicket.id, { messages });
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);"""
text = text.replace(target_ai_resp, replacement_ai_resp)

# Add bell to header
target_header = """            <h1 className="text-xl font-extrabold tracking-tight">Agent Workspace</h1>
            <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
              Triaging Operations, HR, Finance, and IT requests.
            </p>
          </div>
          <div className="flex items-center gap-3">"""
replacement_header = """            <h1 className="text-xl font-extrabold tracking-tight">Agent Workspace</h1>
            <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
              Triaging Operations, HR, Finance, and IT requests.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative mr-2">
              <Bell className={`h-6 w-6 transition-all duration-300 ${showNotification ? 'text-indigo-500 animate-bounce' : 'text-slate-400 dark:text-slate-500'}`} />
              {showNotification && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-ping" />
              )}
              {showNotification && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </div>"""
text = text.replace(target_header, replacement_header)

with open("src/components/AgentDashboard.tsx", "w") as f:
    f.write(text)
