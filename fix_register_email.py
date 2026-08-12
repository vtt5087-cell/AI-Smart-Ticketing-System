import re

with open("server.ts", "r") as f:
    text = f.read()

target = """  users.push(newUser);

  // Generate dynamic session token"""

replacement = """  users.push(newUser);

  // Dispatch confirmation email
  dispatch_ticket_email(
    'account-creation',
    newUser.email,
    'Account Creation Confirmation',
    `Dear ${newUser.name},\n\nYour account has been successfully created on the Automation Control System.\n\nRole: ${newUser.role}\nEmail: ${newUser.email}\n\nThank you!`
  ).catch(err => console.error('Failed to send registration email:', err));

  // Generate dynamic session token"""

text = text.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(text)
