import re

with open("server.ts", "r") as f:
    text = f.read()

# Make it async
text = text.replace("function runWorkflowAutomation(ticket: any, rulesList: RoutingRule[]): { updatedTicket: any, triggeredRule: RoutingRule | null } {", "async function runWorkflowAutomation(ticket: any, rulesList: RoutingRule[]): Promise<{ updatedTicket: any, triggeredRule: RoutingRule | null }> {")

# Change the sync calls
text = text.replace("const { updatedTicket, triggeredRule } = runWorkflowAutomation(createdTicket, routingRules);", "const { updatedTicket, triggeredRule } = await runWorkflowAutomation(createdTicket, routingRules);")
text = text.replace("const { updatedTicket: autoTicket, triggeredRule } = runWorkflowAutomation(updatedTicket, routingRules);", "const { updatedTicket: autoTicket, triggeredRule } = await runWorkflowAutomation(updatedTicket, routingRules);")


new_email_block = """
    if (matchedRule.sendEmail) {
      updated.emailStatus = 'Sent';
      updated.emailRecipient = `${matchedRule.targetTeam.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`;
      updated.emailSubject = `[ALERT] ${updated.urgency} Urgency - New ${updated.category} Ticket #${updated.id}`;
      
      try {
        const ai = getAi();
        const prompt = `Draft a professional email to the user confirming receipt of their ticket. 
        Ticket ID: ${updated.id}
        Category: ${updated.category}
        Priority: ${updated.urgency}
        Assigned Agent: ${updated.assignedAgent}
        Ticket Description: ${updated.description}
        
        Write a professional email body confirming receipt and explaining that ${updated.assignedAgent} is reviewing the request. Include ticket details. Format as plain text.`;
        
        const response = await generateContentWithRetry(ai, prompt, undefined);
        updated.emailBody = response && response.text ? response.text : `Dear User,\n\nYour ticket has been received and routed to ${matchedRule.targetTeam}.\n\nTicket Reference: ${updated.id}\nCategory: ${updated.category}\nUrgency: ${updated.urgency}\n\nPlease review and take appropriate action.\n\nRegards,\nAutomation Control System`;
      } catch (e) {
        updated.emailBody = `Dear User,\n\nYour ticket has been received and routed to ${matchedRule.targetTeam}.\n\nTicket Reference: ${updated.id}\nCategory: ${updated.category}\nUrgency: ${updated.urgency}\n\nPlease review and take appropriate action.\n\nRegards,\nAutomation Control System`;
      }

      updatedLogs.push(`Automation Engine: Email alert dispatched to ${updated.emailRecipient}.`);
    } else {
"""

old_email_block = """
    if (matchedRule.sendEmail) {
      updated.emailStatus = 'Sent';
      updated.emailRecipient = `${matchedRule.targetTeam.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`;
      updated.emailSubject = `[ALERT] ${updated.urgency} Urgency - New ${updated.category} Ticket #${updated.id}`;
      updated.emailBody = `Dear ${matchedRule.targetTeam},\\n\\nAn operations ticket has been automatically routed to your queue.\\n\\nTicket Reference: ${updated.id}\\nCategory: ${updated.category}\\nUrgency: ${updated.urgency}\\n\\nPlease review and take appropriate action.\\n\\nRegards,\\nAutomation Control System`;
      updatedLogs.push(`Automation Engine: Email alert dispatched to ${updated.emailRecipient}.`);
    } else {
"""

text = text.replace(old_email_block.strip(), new_email_block.strip())

with open("server.ts", "w") as f:
    f.write(text)
