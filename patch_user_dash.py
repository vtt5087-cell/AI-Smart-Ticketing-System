import re

with open("src/components/UserDashboard.tsx", "r") as f:
    text = f.read()

# Add Bell to imports if not there
if "Bell" not in text:
    text = text.replace("import { ", "import { Bell, ", 1)

# Add state for notification
if "const [showNotification, setShowNotification]" not in text:
    text = text.replace(
        "const [chatMessage, setChatMessage] = useState('');",
        "const [chatMessage, setChatMessage] = useState('');\n  const [showNotification, setShowNotification] = useState(false);"
    )

# Add notification trigger to handleSendChat
target_handle = """  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedTicket) return;

    const messages = [...(selectedTicket.messages || [])];
    messages.push({
      id: `m-${Date.now()}`,
      sender: 'user',
      senderName: user.name || 'Support Client',
      text: chatMessage,
      createdAt: new Date().toISOString()
    });

    onUpdateTicket(selectedTicket.id, { messages });
    setChatMessage('');
  };"""
replacement_handle = """  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedTicket) return;

    const messages = [...(selectedTicket.messages || [])];
    messages.push({
      id: `m-${Date.now()}`,
      sender: 'user',
      senderName: user.name || 'Support Client',
      text: chatMessage,
      createdAt: new Date().toISOString()
    });

    onUpdateTicket(selectedTicket.id, { messages });
    setChatMessage('');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };"""
text = text.replace(target_handle, replacement_handle)

# Add bell icon to UI
target_header = """        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button"""
replacement_header = """        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative mr-2">
            <Bell className={`h-6 w-6 transition-all duration-300 ${showNotification ? 'text-indigo-500 animate-bounce' : 'text-slate-400 dark:text-slate-500'}`} />
            {showNotification && (
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-ping" />
            )}
            {showNotification && (
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </div>
          <button"""
text = text.replace(target_header, replacement_header)

with open("src/components/UserDashboard.tsx", "w") as f:
    f.write(text)
