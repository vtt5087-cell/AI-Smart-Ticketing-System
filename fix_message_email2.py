import re

with open("server.ts", "r") as f:
    text = f.read()

target = """// Check if we need to auto-respond to a user message
  if (updatedTicket.aiAutoRespond !== false) {
    const oldMsgsLength = existingTicket.messages?.length || 0;
    const newMsgsLength = updatedTicket.messages?.length || 0;

    if (newMsgsLength > oldMsgsLength) {
      const latestMsg = updatedTicket.messages[newMsgsLength - 1];

      if (latestMsg.sender === 'user' && !latestMsg.text.startsWith('CUSTOMER_CSAT_RATING:')) {
        try {
          const ai = getAi();"""

replacement = """  // Check for new messages to dispatch emails and auto-respond
  const oldMsgsLength = existingTicket.messages?.length || 0;
  const newMsgsLength = updatedTicket.messages?.length || 0;

  if (newMsgsLength > oldMsgsLength) {
    const latestMsg = updatedTicket.messages[newMsgsLength - 1];

    if (latestMsg.sender === 'user') {
      if (updatedTicket.assignedAgent) {
        const agentUser = users.find(u => u.name === updatedTicket.assignedAgent);
        const agentEmail = agentUser ? agentUser.email : `${updatedTicket.assignedAgent.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`;
        
        dispatch_ticket_email(
          updatedTicket.id,
          agentEmail,
          `New reply from user on Ticket #${updatedTicket.id}`,
          `Hello ${updatedTicket.assignedAgent},\n\nThe user (${updatedTicket.createdBy}) has replied to the ticket: ${updatedTicket.title}\n\nUser Message:\n"${latestMsg.text}"\n\nPlease check the agent dashboard to respond.`
        ).catch(err => console.error('Failed to send agent reply email:', err));
      }
    } else if (latestMsg.sender === 'agent' && latestMsg.senderName !== 'AI Support') {
      dispatch_ticket_email(
        updatedTicket.id,
        updatedTicket.createdBy,
        `New reply on your ticket #${updatedTicket.id}`,
        `Hello,\n\nA support agent (${latestMsg.senderName}) has replied to your ticket: ${updatedTicket.title}\n\nAgent Message:\n"${latestMsg.text}"\n\nYou can reply by visiting your dashboard.`
      ).catch(err => console.error('Failed to send user reply email:', err));
    }
  }

  // Check if we need to auto-respond to a user message
  if (updatedTicket.aiAutoRespond !== false) {
    if (newMsgsLength > oldMsgsLength) {
      const latestMsg = updatedTicket.messages[newMsgsLength - 1];

      if (latestMsg.sender === 'user' && !latestMsg.text.startsWith('CUSTOMER_CSAT_RATING:')) {
        try {
          const ai = getAi();"""

text = text.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(text)
