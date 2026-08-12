import re

with open("server.ts", "r") as f:
    text = f.read()

# Make callback async
text = text.replace("app.put(\"/api/tickets/:id\", authenticate, (req: any, res) => {", "app.put(\"/api/tickets/:id\", authenticate, async (req: any, res) => {")

new_code = """
  // Check if we need to auto-respond to a user message
  if (updatedTicket.aiAutoRespond !== false) {
    const oldMsgsLength = existingTicket.messages?.length || 0;
    const newMsgsLength = updatedTicket.messages?.length || 0;
    if (newMsgsLength > oldMsgsLength) {
      const latestMsg = updatedTicket.messages[newMsgsLength - 1];
      if (latestMsg.sender === 'user' && !latestMsg.text.startsWith('CUSTOMER_CSAT_RATING:')) {
        try {
          const ai = getAi();
          let conversation = updatedTicket.messages.map((m: any) => `${m.senderName}: ${m.text}`).join("\\n");
          
          const prompt = `You are a helpful AI support agent. Respond to the user's latest message based on this ticket context.
          Ticket Category: ${updatedTicket.category}
          Ticket Subject: ${updatedTicket.title}
          Ticket Description: ${updatedTicket.description}
          
          Conversation history:
          ${conversation}
          
          Provide a concise, helpful, and professional response to the user.`;

          const response = await generateContentWithRetry(ai, prompt, undefined);
          
          if (response && response.text) {
            const aiMessage = {
              id: `m-${Date.now()}`,
              sender: 'agent',
              senderName: 'AI Support',
              text: response.text,
              createdAt: new Date().toISOString()
            };
            updatedTicket.messages = [...updatedTicket.messages, aiMessage];
          }
        } catch (err: any) {
          console.error("Auto-respond failed:", err.message);
        }
      }
    }
  }

  tickets[ticketIndex] = updatedTicket;
  res.json(updatedTicket);
});
"""

pattern = r"  tickets\[ticketIndex\] = updatedTicket;\s+res\.json\(updatedTicket\);\s+\}\);"
text = re.sub(pattern, new_code.strip(), text)

with open("server.ts", "w") as f:
    f.write(text)
