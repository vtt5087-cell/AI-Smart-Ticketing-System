import re

with open("src/components/AgentDashboard.tsx", "r") as f:
    text = f.read()

old_block = """                    {selectedTicket.emailStatus === 'Sent' ? (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100 text-[10px] font-bold">
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>OUTGOING EMAIL DISPATCHED</span>
                        </div>
                          
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-600/60 text-xs">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Recipient Contact</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedTicket.emailRecipient}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Subject Line</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{selectedTicket.emailSubject}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Message Content</span>
                            <pre className="font-mono text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-700 mt-1 whitespace-pre-wrap leading-normal">
                              {selectedTicket.emailBody}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-bold">
                          <AlertCircle className="h-4 w-4 text-slate-400" />
                          <span>NO AUTOMATED EMAIL SENT</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                          The active routing rule for this ticket's category ({selectedTicket.category}) and urgency ({selectedTicket.urgency}) is not configured to send an email notification, or the ticket was filed manually outside standard trigger matrices.
                        </p>
                      </div>
                    )}"""


new_block = """                    {selectedTicket.emailStatus === 'Sent' ? (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100 text-[10px] font-bold">
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>OUTGOING EMAIL DISPATCHED</span>
                        </div>
                          
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-600/60 text-xs">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Recipient Contact</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedTicket.emailRecipient}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Subject Line</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{selectedTicket.emailSubject}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Message Content</span>
                            <pre className="font-mono text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-700 mt-1 whitespace-pre-wrap leading-normal">
                              {selectedTicket.emailBody}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : selectedTicket.emailStatus === 'Failed' ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-2.5 rounded-xl border border-rose-100 dark:border-rose-800 text-[10px] font-bold">
                          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                          <span>EMAIL DISPATCH FAILED</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                          The system attempted to send an email to {selectedTicket.emailRecipient} but failed. Check server logs.
                        </p>
                      </div>
                    ) : selectedTicket.emailStatus === 'Pending' ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl border border-amber-100 dark:border-amber-800 text-[10px] font-bold">
                          <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-spin" />
                          <span>EMAIL DISPATCH PENDING</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                          The system is currently attempting to send the email to {selectedTicket.emailRecipient}.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-bold">
                          <AlertCircle className="h-4 w-4 text-slate-400" />
                          <span>NO AUTOMATED EMAIL SENT</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                          The active routing rule for this ticket's category ({selectedTicket.category}) and urgency ({selectedTicket.urgency}) is not configured to send an email notification, or the ticket was filed manually outside standard trigger matrices.
                        </p>
                      </div>
                    )}"""

text = text.replace(old_block, new_block)

with open("src/components/AgentDashboard.tsx", "w") as f:
    f.write(text)
