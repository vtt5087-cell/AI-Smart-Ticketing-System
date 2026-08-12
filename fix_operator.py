import re

with open("server.ts", "r") as f:
    text = f.read()

target = """    } else if (latestMsg.sender === 'agent' && latestMsg.senderName !== 'AI Support') {"""

replacement = """    } else if ((latestMsg.sender === 'agent' || latestMsg.sender === 'operator') && latestMsg.senderName !== 'AI Support' && latestMsg.senderName !== 'System') {
      const actualAgentName = req.user.name || latestMsg.senderName;
      latestMsg.senderName = actualAgentName; // ensure the name is the agent's real name
"""

text = text.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(text)
