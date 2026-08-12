import re

with open("server.ts", "r") as f:
    text = f.read()

old_prompt = """const prompt = `Draft a professional email to the user confirming receipt of their ticket. 
        Ticket ID: ${updated.id}
        Category: ${updated.category}
        Priority: ${updated.urgency}
        Assigned Agent: ${updated.assignedAgent}
        Ticket Description: ${updated.description}
        
        Write a professional email body confirming receipt and explaining that ${updated.assignedAgent} is reviewing the request. Include ticket details. Format as plain text.`;"""

new_prompt = """const prompt = `Draft a professional email to the user confirming receipt of their ticket. 
        Ticket ID: ${updated.id}
        Category: ${updated.category}
        Priority: ${updated.urgency}
        Assigned Agent: ${updated.assignedAgent}
        Date Created: ${updated.createdAt}
        Original Employee Message: ${updated.description}
        
        Write a professional email body. Include:
        - A Greeting
        - Ticket ID
        - Category
        - Priority
        - Assigned Agent
        - Date Created
        - Original Employee Message
        - Next Steps (explaining that ${updated.assignedAgent} is reviewing the request).
        Format as plain text.`;"""

text = text.replace(old_prompt, new_prompt)

with open("server.ts", "w") as f:
    f.write(text)
