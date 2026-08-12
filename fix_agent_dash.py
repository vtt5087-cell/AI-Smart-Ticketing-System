import re

with open("src/components/AgentDashboard.tsx", "r") as f:
    text = f.read()

# Fix Customer Information Name
text = text.replace(
    'CU',
    '{selectedTicket.createdBy.substring(0, 2).toUpperCase()}'
)
text = text.replace(
    '<h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Support Client</h4>',
    '<h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedTicket.createdBy}</h4>'
)

# Fix generate-response payload
target_payload = """        body: JSON.stringify({
          category: selectedTicket.category,
          urgency: selectedTicket.urgency,
          tone: selectedTone,
          description: selectedTicket.description,
          stream: true
        })"""
replacement_payload = """        body: JSON.stringify({
          category: selectedTicket.category,
          urgency: selectedTicket.urgency,
          tone: selectedTone,
          description: selectedTicket.description,
          stream: true,
          ticketId: selectedTicket.id,
          customerName: selectedTicket.createdBy
        })"""
text = text.replace(target_payload, replacement_payload)

# Display Ticket ID in the ticket list
target_ticket_list = """                          <div className="flex justify-between items-start gap-1">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}>
                              {t.category}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold border ${urgStyle.bg}`}>
                              {t.urgency}
                            </span>
                          </div>"""
replacement_ticket_list = """                          <div className="flex justify-between items-start gap-1">
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400`}>
                              {t.id.substring(0, 8)}
                            </span>
                            <div className="flex space-x-1">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}>
                                {t.category}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold border ${urgStyle.bg}`}>
                                {t.urgency}
                              </span>
                            </div>
                          </div>"""
text = text.replace(target_ticket_list, replacement_ticket_list)

# Inside the Live Client Thread, let's fix the message sender rendering
target_sender = """                              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${
                                isOperator ? 'bg-indigo-600 text-white' : isAi ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                              }`}>
                                {isOperator ? 'OP' : isAi ? 'AI' : '{selectedTicket.createdBy.substring(0, 2).toUpperCase()}'}
                              </div>"""
# I already replaced 'CU' with '{selectedTicket.createdBy.substring(0, 2).toUpperCase()}' globally. Wait, let me check if that broke anything.
with open("src/components/AgentDashboard.tsx", "w") as f:
    f.write(text)
