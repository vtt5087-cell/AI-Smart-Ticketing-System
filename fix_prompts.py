import re

with open("server.ts", "r") as f:
    text = f.read()

# Fix draftRes prompt in POST /api/tickets
target1 = """      const prompt = `Draft a professional formal response to this customer inquiry.
      Category: ${updatedTicket.category}
      Urgency: ${updatedTicket.urgency}
      Inquiry: ${updatedTicket.description}`;"""
replacement1 = """      const prompt = `Draft a professional formal response to this customer inquiry.
      Ticket ID: ${updatedTicket.id}
      Customer Name: ${updatedTicket.createdBy}
      Category: ${updatedTicket.category}
      Urgency: ${updatedTicket.urgency}
      Inquiry: ${updatedTicket.description}
      
      Provide a concise, helpful, and professional response.
      Do NOT ask for a phone number or use any bracketed placeholders like [Customer Name] or [Ticket_Number].
      Always use the actual Customer Name ("${updatedTicket.createdBy}") and Ticket ID ("${updatedTicket.id}").
      Sign off with "Best regards," followed by the AI Support Team and reference the Customer Name.`;"""
text = text.replace(target1, replacement1)

# Fix chat reply prompt in PUT /api/tickets/:id
target2 = """          const prompt = `You are a helpful AI support agent. Respond to the user's latest message based on this ticket context.
          Ticket Category: ${updatedTicket.category}
          Ticket Subject: ${updatedTicket.title}
          Ticket Description: ${updatedTicket.description}
          
          Conversation history:
          ${conversation}
          
          Provide a concise, helpful, and professional response to the user.`;"""
replacement2 = """          const prompt = `You are a helpful AI support agent. Respond to the user's latest message based on this ticket context.
          Ticket ID: ${updatedTicket.id}
          Customer Name: ${updatedTicket.createdBy}
          Ticket Category: ${updatedTicket.category}
          Ticket Subject: ${updatedTicket.title}
          Ticket Description: ${updatedTicket.description}
          
          Conversation history:
          ${conversation}
          
          Provide a concise, helpful, and professional response to the user.
          Do NOT ask for a phone number or use bracketed placeholders like [Customer Name] or [Ticket_Number].
          Always use the actual Customer Name ("${updatedTicket.createdBy}") and Ticket ID ("${updatedTicket.id}").
          Sign off with "Best regards," followed by the AI Support Team and reference the Customer Name.`;"""
text = text.replace(target2, replacement2)

# Fix API generate-response prompt
target3 = """app.post("/api/generate-response", authenticate, authorize(['AGENT', 'ADMIN']), async (req, res) => {
  const { category, urgency, tone, description, stream } = req.body;
  
  const fallbackDraft = `Dear Valued Customer,\n\nThank you for reaching out to our support team regarding your ${category || 'service'} request.\n\nWe have logged your case with ${urgency || 'Medium'} urgency. Our team is actively reviewing the inquiry details provided:\n"${description || 'Customer inquiry'}"\n\nWe will follow up with further updates shortly.\n\nSincerely,\nOperations Support Desk`;
  try {
    const ai = getAi();
    const prompt = `Draft a ${tone || 'Formal'} professional response to the following customer inquiry.
    Category: ${category}
    Urgency: ${urgency}
    Tone: ${tone}
    
    Inquiry:
    ${description}`;"""
replacement3 = """app.post("/api/generate-response", authenticate, authorize(['AGENT', 'ADMIN']), async (req, res) => {
  const { category, urgency, tone, description, stream, ticketId, customerName } = req.body;
  
  const fallbackDraft = `Dear Valued Customer,\n\nThank you for reaching out to our support team regarding your ${category || 'service'} request.\n\nWe have logged your case with ${urgency || 'Medium'} urgency. Our team is actively reviewing the inquiry details provided:\n"${description || 'Customer inquiry'}"\n\nWe will follow up with further updates shortly.\n\nSincerely,\nOperations Support Desk`;
  try {
    const ai = getAi();
    const prompt = `Draft a ${tone || 'Formal'} professional response to the following customer inquiry.
    Ticket ID: ${ticketId || 'Unknown'}
    Customer Name: ${customerName || 'Customer'}
    Category: ${category}
    Urgency: ${urgency}
    Tone: ${tone}
    
    Inquiry:
    ${description}
    
    Provide a concise, helpful, and professional response.
    Do NOT ask for a phone number or use any bracketed placeholders like [Customer Name] or [Ticket_Number].
    Always use the actual Customer Name ("${customerName || 'Customer'}") and Ticket ID ("${ticketId || 'Unknown'}").
    Sign off with "Best regards," followed by the AI Support Team and reference the Customer Name.`;"""
text = text.replace(target3, replacement3)

with open("server.ts", "w") as f:
    f.write(text)
