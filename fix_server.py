import re

with open("server.ts", "r") as f:
    text = f.read()

endpoint = """
// POST /api/tickets/:id/auto-respond
app.post("/api/tickets/:id/auto-respond", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const ticketIndex = tickets.findIndex(t => t.id === id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  const existingTicket = tickets[ticketIndex];
  
  if (existingTicket.aiAutoRespond === false) {
     return res.json(existingTicket);
  }

  try {
    const ai = getAi();
    
    // Construct context
    let conversation = existingTicket.messages?.map(m => `${m.senderName}: ${m.text}`).join("\n") || "";
    
    const prompt = `You are a helpful AI support agent. Respond to the user's latest message based on this ticket context.
    Ticket Category: ${existingTicket.category}
    Ticket Subject: ${existingTicket.title}
    Ticket Description: ${existingTicket.description}
    
    Conversation history:
    ${conversation}
    
    User just said: ${message}
    
    Provide a concise, helpful, and professional response to the user.`;

    const response = await generateContentWithRetry(ai, prompt, undefined);
    
    if (response && response.text) {
      const aiMessage = {
        id: `m-${Date.now()}`,
        sender: 'agent' as const,
        senderName: 'AI Support',
        text: response.text,
        createdAt: new Date().toISOString()
      };
      
      existingTicket.messages = [...(existingTicket.messages || []), aiMessage];
    }
  } catch (err: any) {
    console.error("Auto-respond failed:", err.message);
  }

  res.json(existingTicket);
});

"""

# Insert before DELETE /api/tickets/:id
text = text.replace("// DELETE /api/tickets/:id - Only AGENT or ADMIN can delete", endpoint + "// DELETE /api/tickets/:id - Only AGENT or ADMIN can delete")

with open("server.ts", "w") as f:
    f.write(text)
