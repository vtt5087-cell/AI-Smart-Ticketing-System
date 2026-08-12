import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketCategory } from '../types';
import { 
  Plus, 
  Inbox, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Send,
  MessageSquare,
  Filter,
  Archive
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

interface UserDashboardProps {
  tickets: Ticket[];
  onCreateTicket: (subject: string, description: string) => Promise<void>;
  isSubmitting: boolean;
  onSendUserMessage: (ticketId: string, text: string) => void;
  isDarkMode?: boolean;
}

export default function UserDashboard({ 
  tickets, 
  onCreateTicket, 
  isSubmitting,
  onSendUserMessage,
  isDarkMode = false
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'archive'>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [chatMessage, setChatMessage] = useState('');

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    await onCreateTicket(subject, description);
    setSubject('');
    setDescription('');
    setActiveTab('list');
    if (tickets.length > 0) {
      setSelectedTicketId(tickets[0].id);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedTicketId) return;
    onSendUserMessage(selectedTicketId, chatMessage);
    setChatMessage('');
  };

  const filteredTickets = tickets.filter(t => {
    const isArchiveTab = activeTab === 'archive';
    const matchesArchiveState = isArchiveTab ? t.status === 'Resolved' : t.status !== 'Resolved';
    if (!matchesArchiveState) return false;

    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || t.category === selectedCategoryFilter;
    const matchesStatus = selectedStatusFilter === 'All' || t.status === selectedStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'New':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Resolved
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Dashboard Sub-Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl border p-5 shadow-sm transition-colors ${
        'bg-white border-slate-200 text-slate-800 dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-100'
      }`}>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Customer Support Portal</h2>
          <p className={`text-sm mt-1 text-slate-500 dark:text-slate-400`}>
            Submit support tickets and track resolution status in real-time.
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedTicketId(null);
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'list' && !selectedTicketId
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border dark:border-slate-700'
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>My Tickets</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('archive');
              setSelectedTicketId(null);
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'archive' && !selectedTicketId
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border dark:border-slate-700'
            }`}
          >
            <Archive className="h-4 w-4" />
            <span>Archive</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('create');
              setSelectedTicketId(null);
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Submit a Ticket</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12">
          <AnimatePresence mode="wait">
            {selectedTicketId && selectedTicket ? (
              // TICKET DETAIL VIEW
              <motion.div
                key="ticket-detail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-2xl border p-6 space-y-6 shadow-lg transition-colors ${
                  'bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100'
                }`}
              >
                {/* Back bar */}
                <div className={`flex justify-between items-center border-b pb-4 border-slate-100 dark:border-slate-800`}>
                  <button
                    onClick={() => setSelectedTicketId(null)}
                    className={`flex items-center space-x-2 text-sm font-bold transition-colors cursor-pointer ${
                      'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to My Tickets</span>
                  </button>
                  {getStatusBadge(selectedTicket.status)}
                </div>

                {/* Ticket Summary Section */}
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Subject</span>
                    <h3 className="text-xl font-bold leading-snug mt-1">{selectedTicket.title}</h3>
                    <p className={`text-xs mt-1 text-slate-500 dark:text-slate-400`}>
                      Submitted on {new Date(selectedTicket.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className={`rounded-xl p-4 border bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/60`}>
                    <span className={`text-xs font-bold uppercase tracking-wider block mb-1.5 text-slate-500 dark:text-slate-400`}>
                      Original Description
                    </span>
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-200`}>
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>

                {/* Response / Updates Area */}
                <div className={`pt-4 border-t border-slate-100 dark:border-slate-800`}>
                  {/* Right Column: Customer Official Response / Chat Workspace */}
                  <div className="space-y-4">
                    <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-2 text-slate-600 dark:text-slate-300`}>
                      <MessageSquare className="h-4 w-4 text-indigo-400" />
                      <span>Formal Support Response</span>
                    </h4>

                    <div className="space-y-4">
                      {selectedTicket.userEditedResponse || selectedTicket.aiResponse ? (
                        <div className={`rounded-xl p-4 border shadow-sm leading-relaxed text-sm whitespace-pre-wrap ${
                          'bg-indigo-50/60 border-indigo-100 text-slate-800 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-slate-200'
                        }`}>
                          {selectedTicket.userEditedResponse || selectedTicket.aiResponse}
                        </div>
                      ) : (
                        <div className={`border rounded-xl p-6 text-center italic text-sm ${
                          'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400'
                        }`}>
                          Our team is currently reviewing your issue. A formal support response will appear here shortly.
                        </div>
                      )}

                      {/* Conversational Live Chat Feed */}
                      {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                        <div className={`border-t pt-4 space-y-3 border-slate-100 dark:border-slate-800`}>
                          <span className={`block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400`}>
                            Live Chat Conversation
                          </span>
                          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                            {selectedTicket.messages.map((msg) => {
                              const isMe = msg.sender === 'user';
                              return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                  <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                                    isMe 
                                      ? 'bg-indigo-600 text-white font-medium rounded-tr-none' 
                                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:rounded-tl-none dark:border dark:border-slate-700'
                                  }`}>
                                    <p className="font-bold text-xs mb-0.5 opacity-90">{msg.senderName}</p>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                  </div>
                                  <span className={`text-[10px] mt-0.5 px-1 text-slate-400 dark:text-slate-500`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Chat reply field */}
                      {selectedTicket.status !== 'Resolved' && (
                        <form onSubmit={handleSendChat} className={`flex gap-2 border-t pt-3 border-slate-100 dark:border-slate-800`}>
                          <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            placeholder="Type a message to the agent..."
                            className={`flex-1 text-sm border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium ${
                              'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500'
                            }`}
                          />
                          <button
                            type="submit"
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors flex items-center justify-center cursor-pointer shadow-sm font-bold"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>

                {/* CSAT Customer Feedback Form */}
                {selectedTicket.status === 'Resolved' && !selectedTicket.csatRating && (
                  <div className={`border rounded-xl p-4 mt-6 ${
                    'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300'
                  }`}>
                    <span className="text-sm font-bold block mb-1">How was your service experience?</span>
                    <p className="text-xs mb-3 opacity-90">Please rate the resolution for this ticket.</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => {
                            onSendUserMessage(selectedTicket.id, `CUSTOMER_CSAT_RATING:${starValue}:"Great service resolution!"`);
                          }}
                          className={`px-3.5 py-2 text-xs font-bold rounded-lg border shadow-sm cursor-pointer transition-colors ${
                            'bg-white hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-400 dark:border-slate-700'
                          }`}
                        >
                          {starValue} ★
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'create' ? (
              // NEW TICKET CREATION FORM
              <motion.div
                key="ticket-create"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-2xl border shadow-lg p-6 max-w-2xl mx-auto transition-colors ${
                  'bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100'
                }`}
              >
                <div className={`flex items-center space-x-2 border-b pb-4 mb-5 border-slate-100 dark:border-slate-800`}>
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-base font-bold uppercase tracking-wider">Submit a Support Ticket</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300`}>
                      Subject / Issue Summary
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Printer offline on 3rd floor, password reset issue"
                      className={`w-full text-sm rounded-xl border p-3.5 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-600 dark:text-slate-300`}>
                      Description
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide full details of your issue, error codes, and steps to reproduce..."
                      className={`w-full text-sm rounded-xl border p-3.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500'
                      }`}
                    />
                  </div>

                  <div className={`flex items-center justify-end gap-3 border-t pt-4 border-slate-100 dark:border-slate-800`}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                        'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                    >
                      {isSubmitting ? (
                        <span>Analyzing &amp; Filing...</span>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              // TICKETS LIST VIEW WITH ENHANCED FILTERING
              <motion.div
                key="tickets-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Metrics Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`border p-5 rounded-2xl shadow-xs space-y-1 transition-colors ${
                    'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider block text-slate-500 dark:text-slate-400`}>
                      Total Filed Tickets
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black">{tickets.length}</span>
                      <span className={`text-xs font-semibold text-slate-500 dark:text-slate-400`}>Logged cases</span>
                    </div>
                  </div>

                  <div className={`border p-5 rounded-2xl shadow-xs space-y-1 transition-colors ${
                    'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider block text-slate-500 dark:text-slate-400`}>
                      Open Tickets
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-indigo-400">{tickets.filter(t => t.status !== 'Resolved').length}</span>
                      <span className="text-xs text-indigo-400 font-semibold">Active attention</span>
                    </div>
                  </div>

                  <div className={`border p-5 rounded-2xl shadow-xs space-y-1 transition-colors ${
                    'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider block text-slate-500 dark:text-slate-400`}>
                      Resolved Cases
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-400">{tickets.filter(t => t.status === 'Resolved').length}</span>
                      <span className="text-xs text-emerald-400 font-semibold">Completed</span>
                    </div>
                  </div>
                </div>

                {/* Filter Toolbar Section */}
                <div className={`rounded-2xl border p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between ${
                  'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                }`}>
                  {/* Search query box */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search my submitted tickets by keyword..."
                      className={`w-full text-sm rounded-xl border pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${
                        'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500'
                      }`}
                    />
                  </div>

                  {/* Filter Selectors */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-4 w-4 text-indigo-400 shrink-0" />
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className={`text-xs font-semibold rounded-xl border px-3 py-2 outline-none cursor-pointer ${
                          'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <option value="All">Category: All</option>
                        <option value="HR">HR</option>
                        <option value="IT">IT</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>

                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className={`text-xs font-semibold rounded-xl border px-3 py-2 outline-none cursor-pointer ${
                        'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <option value="All">Status: All</option>
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>

                    {(selectedCategoryFilter !== 'All' || selectedStatusFilter !== 'All' || searchQuery) && (
                      <button
                        onClick={() => {
                          setSelectedCategoryFilter('All');
                          setSelectedStatusFilter('All');
                          setSearchQuery('');
                        }}
                        className={`text-xs font-bold underline px-2 py-1 transition-colors cursor-pointer ${
                          'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300'
                        }`}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {filteredTickets.length === 0 ? (
                  <div className={`rounded-2xl border border-dashed p-12 text-center space-y-3 ${
                    'bg-white border-slate-300 text-slate-500 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-400'
                  }`}>
                    <Inbox className="h-10 w-10 text-slate-400 mx-auto" />
                    <div>
                      <h3 className="text-base font-bold">No tickets match your filter criteria</h3>
                      <p className="text-xs mt-1">Try adjusting your category/status filters or search term.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Submit a New Ticket
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`rounded-2xl border p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                          'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800/80 dark:text-slate-100'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400`}>
                              {ticket.id.slice(0, 8)}
                            </span>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold leading-snug line-clamp-2">{ticket.title}</h4>
                            <p className={`text-xs line-clamp-3 mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400`}>
                              {ticket.description}
                            </p>
                          </div>
                        </div>

                        <div className={`border-t mt-4 pt-3 flex justify-between items-center text-xs font-medium ${
                          'border-slate-100 text-slate-500 dark:border-slate-800 dark:text-slate-400'
                        }`}>
                          <span>Category: <strong className="text-indigo-400 font-bold">{ticket.category}</strong></span>
                          <span className="text-indigo-400 font-bold flex items-center space-x-1 hover:underline">
                            <span>View ticket</span>
                            <span>→</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

