import re

with open("server.ts", "r") as f:
    text = f.read()

target = """      }

      updatedLogs.push(`Automation Engine: Email alert dispatched to ${updated.emailRecipient}.`);
    } else {"""

replacement = """      }

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

text = text.replace(target, replacement)

with open("server.ts", "w") as f:
    f.write(text)
