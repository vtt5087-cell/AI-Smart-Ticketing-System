import re

with open("server.ts", "r") as f:
    text = f.read()

import_statement = """import { dispatch_ticket_email, emailDispatchLogs } from './src/services/email_service';\n"""
text = text.replace("import OpenAI from \"openai\";\n", "import OpenAI from \"openai\";\n" + import_statement)

old_email_block = """    if (matchedRule.sendEmail) {
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
        updated.emailBody = response && response.text ? response.text : `Dear User,\\n\\nYour ticket has been received and routed to ${matchedRule.targetTeam}.\\n\\nTicket Reference: ${updated.id}\\nCategory: ${updated.category}\\nUrgency: ${updated.urgency}\\n\\nPlease review and take appropriate action.\\n\\nRegards,\\nAutomation Control System`;
      } catch (e) {
        updated.emailBody = `Dear User,\\n\\nYour ticket has been received and routed to ${matchedRule.targetTeam}.\\n\\nTicket Reference: ${updated.id}\\nCategory: ${updated.category}\\nUrgency: ${updated.urgency}\\n\\nPlease review and take appropriate action.\\n\\nRegards,\\nAutomation Control System`;
      }

      updatedLogs.push(`Automation Engine: Email alert dispatched to ${updated.emailRecipient}.`);
    } else {"""

new_email_block = """    if (matchedRule.sendEmail) {
      updated.emailStatus = 'Pending';
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
        updated.emailBody = response && response.text ? response.text : `Dear User,\\n\\nYour ticket has been received and routed to ${matchedRule.targetTeam}.\\n\\nTicket Reference: ${updated.id}\\nCategory: ${updated.category}\\nUrgency: ${updated.urgency}\\n\\nPlease review and take appropriate action.\\n\\nRegards,\\nAutomation Control System`;
      } catch (e) {
        updated.emailBody = `Dear User,\\n\\nYour ticket has been received and routed to ${matchedRule.targetTeam}.\\n\\nTicket Reference: ${updated.id}\\nCategory: ${updated.category}\\nUrgency: ${updated.urgency}\\n\\nPlease review and take appropriate action.\\n\\nRegards,\\nAutomation Control System`;
      }

      // Dispatch the real email using nodemailer
      const emailResult = await dispatch_ticket_email(
        updated.id,
        updated.emailRecipient,
        updated.emailSubject,
        updated.emailBody
      );

      if (emailResult.success) {
        updated.emailStatus = 'Sent';
        updatedLogs.push(`Automation Engine: Real email dispatched successfully to ${updated.emailRecipient}.`);
      } else {
        updated.emailStatus = 'Failed';
        updatedLogs.push(`Automation Engine: Email dispatch failed for ${updated.emailRecipient}. Error: ${emailResult.error}`);
      }
    } else {"""

text = text.replace(old_email_block, new_email_block)

with open("server.ts", "w") as f:
    f.write(text)
