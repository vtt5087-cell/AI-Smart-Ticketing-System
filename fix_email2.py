import re

with open("server.ts", "r") as f:
    text = f.read()

pattern = r"\} catch \(e\) \{(.*?)\} catch \(e\) \{(.*?)\}.*?updatedLogs.push\(`Automation Engine: Email alert dispatched to \$\{updated.emailRecipient\}\.`\);"

def replace_fn(m):
    return """} catch (e) {""" + m.group(2) + """}

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
      }"""

new_text = re.sub(pattern, replace_fn, text, flags=re.DOTALL)

with open("server.ts", "w") as f:
    f.write(new_text)
