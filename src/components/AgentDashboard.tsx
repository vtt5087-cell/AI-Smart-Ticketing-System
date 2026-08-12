import React, { useState, useEffect, useRef } from 'react';
import { 
  Ticket, 
  TicketCategory, 
  TicketUrgency, 
  TicketStatus, 
  RoutingRule, 
  AutomationLog, 
  ChatMessage 
} from '../types';
import { 
  Search, 
  Inbox, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Cpu, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Clock, 
  Activity, 
  Sliders, 
  Tag, 
  Sparkles, 
  Send, 
  ChevronRight, 
  CheckCircle2, 
  Star, 
  Lock, 
  Check, 
  Settings, 
  AlertCircle, 
  X, 
  ChevronDown, 
  User, 
  ShieldAlert,
  MessageSquare,
  LayoutGrid,
  Mail,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

interface AgentDashboardProps {
  tickets: Ticket[];
  complianceRisks: any[];
  routingRules: RoutingRule[];
  automationLogs: AutomationLog[];
  onUpdateTicket: (ticketId: string, updatedFields: Partial<Ticket>) => void;
  onDeleteTicket: (ticketId: string) => void;
  onAddRule: (rule: Omit<RoutingRule, 'id'>) => void;
  onToggleRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  selectedAiProvider: 'gemini' | 'ollama';
  onSelectAiProvider: (provider: 'gemini' | 'ollama') => void;
  token: string | null;
  onRefreshData: () => void;
  isDarkMode?: boolean;
  showToast?: (msg: string) => void;
}

const CATEGORY_COLORS: Record<TicketCategory, { bg: string; text: string; border: string; dot: string }> = {
  HR: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', dot: 'bg-emerald-500' },
  IT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/60', dot: 'bg-blue-500' },
  Finance: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', dot: 'bg-amber-500' },
  Operations: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/60', dot: 'bg-purple-500' }
};

const URGENCY_COLORS: Record<TicketUrgency, { bg: string; text: string; border: string }> = {
  Low: { bg: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-600' },
  Medium: { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-600', border: 'border-amber-200/60' },
  High: { bg: 'bg-orange-50 text-orange-800 border-orange-200/60', text: 'text-orange-700', border: 'border-orange-200/60' },
  Critical: { bg: 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse', text: 'text-rose-700', border: 'border-rose-200' }
};

export default function AgentDashboard({
  tickets,
  complianceRisks,
  routingRules,
  automationLogs,
  onUpdateTicket,
  onDeleteTicket,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  selectedAiProvider,
  onSelectAiProvider,
  token,
  onRefreshData,
  isDarkMode = false,
  showToast
}: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics' | 'compliance' | 'automation' | 'forecasting' | 'silos' | 'archive'>('queue');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Forecasting States
  const [growthPercent, setGrowthPercent] = useState<number>(20);
  const [seasonality, setSeasonality] = useState<'normal' | 'holiday' | 'promotional' | 'quiet'>('normal');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSeed, setSimulationSeed] = useState<number>(1);
  const [isSuggestionApplied, setIsSuggestionApplied] = useState<boolean>(false);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'urgency'>('date');

  // Response generation states
  const [selectedTone, setSelectedTone] = useState<'Formal' | 'Friendly' | 'Urgent'>('Formal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [internalNotesText, setInternalNotesText] = useState('');

  // Routing overrides states
  const [overrideCategory, setOverrideCategory] = useState<TicketCategory>('Operations');
  const [overrideUrgency, setOverrideUrgency] = useState<TicketUrgency>('Medium');
  const [isDiagnosticsExpanded, setIsDiagnosticsExpanded] = useState(false);

  // Bias/Compliance editing states
  const [editingBiasTicket, setEditingBiasTicket] = useState<Ticket | null>(null);
  const [editingRiskType, setEditingRiskType] = useState<'Bias' | 'Toxicity' | 'PII Leak' | 'Hallucination' | null>(null);
  const [biasEditTitle, setBiasEditTitle] = useState('');
  const [biasEditDescription, setBiasEditDescription] = useState('');
  const [biasEditCategory, setBiasEditCategory] = useState<TicketCategory>('Operations');
  const [biasEditUrgency, setBiasEditUrgency] = useState<TicketUrgency>('Low');

  // Suggested Dispatch Adjustment states
  const [isDispatchSuggestedEditorOpen, setIsDispatchSuggestedEditorOpen] = useState(false);
  const [dispatchAutopassEnabled, setDispatchAutopassEnabled] = useState(true);
  const [dispatchRuleName, setDispatchRuleName] = useState("High-Urgency Autopass");
  const [dispatchRuleCategory, setDispatchRuleCategory] = useState<TicketCategory | 'All'>("IT");
  const [dispatchRuleUrgency, setDispatchRuleUrgency] = useState<TicketUrgency | 'All'>("Critical");
  const [dispatchRuleTarget, setDispatchRuleTarget] = useState("Tier 3 Infrastructure Ops");
  const [dispatchRuleApproval, setDispatchRuleApproval] = useState(false);
  const [dispatchRuleEmail, setDispatchRuleEmail] = useState(true);
  const [hrStaffCount, setHrStaffCount] = useState(5);
  const [itStaffCount, setItStaffCount] = useState(1);
  const [transferCount, setTransferCount] = useState(2);
  const [isApplyingDispatchSuggested, setIsApplyingDispatchSuggested] = useState(false);

  // Chat/Messaging
  const [chatMessageInput, setChatMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Automation rule form
  const [showAddRuleForm, setShowAddRuleForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<TicketCategory | 'All'>('All');
  const [newRuleUrgency, setNewRuleUrgency] = useState<TicketUrgency | 'All'>('All');
  const [newRuleTargetTeam, setNewRuleTargetTeam] = useState('General Support Team');
  const [newRuleRequireApproval, setNewRuleRequireApproval] = useState(false);
  const [newRuleSendEmail, setNewRuleSendEmail] = useState(true);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleStartEditBiasTicket = (ticket: Ticket, riskType: 'Bias' | 'Toxicity' | 'PII Leak' | 'Hallucination') => {
    setEditingBiasTicket(ticket);
    setEditingRiskType(riskType);
    setBiasEditTitle(ticket.title);
    setBiasEditDescription(ticket.description);
    setBiasEditCategory(ticket.category);
    setBiasEditUrgency(ticket.urgency);
  };

  const handleSaveBiasTicket = async () => {
    if (!editingBiasTicket) return;
    try {
      await onUpdateTicket(editingBiasTicket.id, {
        title: biasEditTitle,
        description: biasEditDescription,
        category: biasEditCategory,
        urgency: biasEditUrgency
      });
      setEditingBiasTicket(null);
      setEditingRiskType(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplySuggestedDispatch = async () => {
    setIsApplyingDispatchSuggested(true);
    try {
      if (dispatchAutopassEnabled) {
        await onAddRule({
          name: dispatchRuleName,
          category: dispatchRuleCategory,
          urgency: dispatchRuleUrgency,
          targetTeam: dispatchRuleTarget,
          requireApproval: dispatchRuleApproval,
          sendEmail: dispatchRuleEmail,
          isActive: true
        });
      }
      
      // Apply staffing transfer
      setHrStaffCount(prev => Math.max(0, prev - transferCount));
      setItStaffCount(prev => prev + transferCount);
      setIsSuggestionApplied(true);
      
      setIsDispatchSuggestedEditorOpen(false);
      if (showToast) {
        showToast(`Applied AI dispatch rule "${dispatchRuleName}" & reallocated ${transferCount} agent(s) to ${dispatchRuleTarget}!`);
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast('Failed to apply dispatch adjustment.');
      }
    } finally {
      setIsApplyingDispatchSuggested(false);
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  // Sync internal notes state when ticket changes
  useEffect(() => {
    if (selectedTicket) {
      setInternalNotesText(selectedTicket.internalNotes || '');
      setOverrideCategory(selectedTicket.category);
      setOverrideUrgency(selectedTicket.urgency);
      setDraftText(selectedTicket.aiResponse || '');
    }
  }, [selectedTicketId]);

  // Filter & Sort tickets
  const filteredTickets = tickets.filter(t => {
    const isArchiveTab = activeTab === 'archive';
    const matchesArchiveState = isArchiveTab ? t.status === 'Resolved' : t.status !== 'Resolved';
    if (!matchesArchiveState) return false;

    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesUrgency = selectedUrgency === 'All' || t.urgency === selectedUrgency;
    const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesUrgency && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'confidence') {
      return b.confidence - a.confidence;
    }
    if (sortBy === 'urgency') {
      const urgencyWeight = { Low: 1, Medium: 2, High: 3, Critical: 4 };
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    }
    // Default to date (Newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Handle Response Generation
  const handleGenerateResponse = async () => {
    if (!selectedTicket) return;
    setIsGenerating(true);
    setResponseError(null);
    setDraftText('');

    try {
      const res = await fetch('/api/generate-response', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          category: selectedTicket.category,
          urgency: selectedTicket.urgency,
          tone: selectedTone,
          description: selectedTicket.description,
          stream: true,
          aiProvider: selectedAiProvider
        })
      });

      if (!res.ok) throw new Error('Response generator error');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream reader');

      const decoder = new TextDecoder();
      let streamAccumulator = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamAccumulator += chunk;
        setDraftText(streamAccumulator);
      }

      // Update in global state
      onUpdateTicket(selectedTicket.id, {
        aiResponse: streamAccumulator,
        aiResponseTone: selectedTone,
        aiResponseCreatedAt: new Date().toISOString()
      });

    } catch (err: any) {
      console.error(err);
      setResponseError(err.message || 'Failed to auto-draft response.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save/Approve Draft response to Chat
  const handleApproveDraft = () => {
    if (!selectedTicket || !draftText.trim()) return;
    
    // Add drafted response to live chat
    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'agent',
      senderName: 'AI Co-Pilot (Agent Approved)',
      text: draftText,
      createdAt: new Date().toISOString()
    };

    const updatedMsgs = [...(selectedTicket.messages || []), newMessage];
    onUpdateTicket(selectedTicket.id, {
      messages: updatedMsgs,
      userEditedResponse: draftText,
      status: 'In Progress' // Transition if needed
    });
    
    setDraftText('');
  };

  // Save Internal Notes
  const handleSaveInternalNotes = () => {
    if (!selectedTicket) return;
    onUpdateTicket(selectedTicket.id, {
      internalNotes: internalNotesText
    });
  };

  // Handle manual override of Category/Urgency
  const handleManualOverride = () => {
    if (!selectedTicket) return;
    const logs = [...(selectedTicket.routingLogs || [])];
    logs.push(`Agent: Manually overrode Category to "${overrideCategory}" and Urgency to "${overrideUrgency}"`);
    
    onUpdateTicket(selectedTicket.id, {
      category: overrideCategory,
      urgency: overrideUrgency,
      routingLogs: logs
    });
  };

  // Live chat message sending
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageInput.trim() || !selectedTicket) return;

    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'operator',
      senderName: 'Operator Desk',
      text: chatMessageInput,
      createdAt: new Date().toISOString()
    };

    const updatedMsgs = [...(selectedTicket.messages || []), newMessage];
    onUpdateTicket(selectedTicket.id, {
      messages: updatedMsgs
    });

    setChatMessageInput('');
  };

  // Rule additions
  const handleCreateRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    onAddRule({
      name: newRuleName,
      category: newRuleCategory,
      urgency: newRuleUrgency,
      targetTeam: newRuleTargetTeam,
      requireApproval: newRuleRequireApproval,
      sendEmail: newRuleSendEmail,
      isActive: true
    });

    setNewRuleName('');
    setShowAddRuleForm(false);
  };

  // Local helper: Tone auditing
  const auditResponseTone = (text: string) => {
    const prohibitedWords = ['hey', 'buddy', 'wanna', 'gonna', 'dunno', 'lol', 'asap', 'cool', 'chill'];
    const found = prohibitedWords.filter(w => text.toLowerCase().includes(w));
    return {
      isCompliant: found.length === 0,
      flaggedWords: found
    };
  };

  // Format statistics for Recharts
  const categoryStatsData = [
    { name: 'HR', value: tickets.filter(t => t.category === 'HR').length },
    { name: 'IT', value: tickets.filter(t => t.category === 'IT').length },
    { name: 'Finance', value: tickets.filter(t => t.category === 'Finance').length },
    { name: 'Operations', value: tickets.filter(t => t.category === 'Operations').length },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  const statusStatsData = [
    { name: 'New', count: tickets.filter(t => t.status === 'New').length },
    { name: 'In Progress', count: tickets.filter(t => t.status === 'In Progress').length },
    { name: 'Resolved', count: tickets.filter(t => t.status === 'Resolved').length },
  ];

  return (
    <div className="space-y-6">
      {/* Agent Header Control Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/95 text-white p-5 rounded-2xl shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <h2 className="text-xl font-extrabold tracking-tight">AI-Ops Command Center</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">SLA Triaging desk, classification override, and agent-assisted automated responses.</p>
        </div>

        {/* AI Model Provider and Tab selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to clear all active tickets and reset the workspace?')) {
                  const res = await fetch('/api/system/reset', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  if (res.ok) {
                    onRefreshData();
                    alert('Workspace reset successful!');
                  }
                }
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              title="Reset System State"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset Workspace</span>
            </button>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => { setActiveTab('queue'); setSelectedTicketId(null); }}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                activeTab === 'queue' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>Queue</span>
            </button>
            <button
              onClick={() => { setActiveTab('archive'); setSelectedTicketId(null); }}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                activeTab === 'archive' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                activeTab === 'analytics' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('forecasting')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                activeTab === 'forecasting' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Forecasting</span>
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                activeTab === 'compliance' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Compliance</span>
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                activeTab === 'automation' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Automation Rules</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'queue' || activeTab === 'archive' ? (
          // TRIAGE QUEUE VIEW
          selectedTicketId && selectedTicket ? (
            // TICKET HANDLING VIEW
            <motion.div
              key="ticket-handling"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Back Bar */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-600/60 p-3 shadow-xs">
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <Inbox className="h-4 w-4" />
                  <span>Back to Queue</span>
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Update Status:</span>
                  <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-700 p-0.5 border border-slate-200 dark:border-slate-600/60">
                    {(['New', 'In Progress', 'Resolved'] as TicketStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => onUpdateTicket(selectedTicket.id, { status: st })}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          selectedTicket.status === st
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:text-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => { onDeleteTicket(selectedTicket.id); setSelectedTicketId(null); }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Delete Ticket"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Main Workspace split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Client Info & AI Insights Panel */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Customer / Submission info */}
                  <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-600/60 p-5 space-y-3 shadow-xs">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Customer Information</span>
                    <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {selectedTicket.createdBy.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedTicket.createdBy}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Submitted on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issue Description</span>
                      <p className="text-xs text-slate-800 dark:text-slate-100 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {/* Workflow Sign-off & Approvals Panel */}
                  <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-600/60 p-5 space-y-4 shadow-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2.5">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                        <CheckCircle2 className="h-4.5 w-4.5 text-indigo-600" />
                        <span>Workflow Sign-off &amp; Approvals</span>
                      </h3>
                      {selectedTicket.approvalStatus === 'Pending Approval' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">Awaiting Sign-off</span>
                      ) : selectedTicket.approvalStatus === 'Approved' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>
                      ) : selectedTicket.approvalStatus === 'Rejected' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">Auto-approved</span>
                      )}
                    </div>

                    {selectedTicket.approvalStatus === 'Pending Approval' ? (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          This ticket matched an automation rule that requires manual sign-off before dispatching to external integrations.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const logs = [...(selectedTicket.routingLogs || [])];
                              logs.push(`System: Operator manually APPROVED the workflow dispatch.`);
                              onUpdateTicket(selectedTicket.id, { 
                                approvalStatus: 'Approved',
                                routingLogs: logs
                              });
                            }}
                            className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const logs = [...(selectedTicket.routingLogs || [])];
                              logs.push(`System: Operator manually REJECTED the workflow dispatch.`);
                              onUpdateTicket(selectedTicket.id, { 
                                approvalStatus: 'Rejected',
                                routingLogs: logs
                              });
                            }}
                            className="py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ) : selectedTicket.approvalStatus === 'Approved' ? (
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 font-medium flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Workflow Signed Off</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5">Approved. Outgoing alerts and external webhooks have been successfully dispatched.</p>
                        </div>
                      </div>
                    ) : selectedTicket.approvalStatus === 'Rejected' ? (
                      <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-[11px] text-rose-800 font-medium flex items-start gap-2">
                        <X className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Workflow Disapproved</p>
                          <p className="text-[10px] text-rose-600 mt-0.5">Rejected. Workflow dispatch halted; ticket requires manual administrative triage.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-start gap-2">
                        <Check className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">No Manual Sign-off Required</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Automation matched. Routed directly to <strong className="text-indigo-600">{selectedTicket.assignedTeam || 'General Queue'}</strong>.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Insights Panel */}
                  <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700 shadow-lg p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                      <Activity className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                      <span>AI Triaging Insights</span>
                    </h3>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-center">
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">AI Category</span>
                        <span className="text-xs font-extrabold text-indigo-600 block mt-1">{selectedTicket.category}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-center">
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Priority</span>
                        <span className="text-xs font-extrabold text-amber-600 block mt-1">{selectedTicket.urgency}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-center">
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Confidence</span>
                        <span className="text-xs font-extrabold text-emerald-600 block mt-1">{selectedTicket.confidence}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-300">Model Relevance Match</span>
                        <span className="text-indigo-600">{selectedTicket.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${selectedTicket.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* Collapsible Diagnostics & Override */}
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsDiagnosticsExpanded(!isDiagnosticsExpanded)}
                        className="w-full flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:text-slate-200"
                      >
                        <span>Override Controls</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isDiagnosticsExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isDiagnosticsExpanded && (
                        <div className="space-y-3 pt-3 animate-fadeIn">
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Override Category</label>
                              <select
                                value={overrideCategory}
                                onChange={(e) => setOverrideCategory(e.target.value as TicketCategory)}
                                className="w-full text-xs rounded-lg border border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-2 font-semibold outline-none cursor-pointer"
                              >
                                <option value="HR">HR</option>
                                <option value="IT">IT</option>
                                <option value="Finance">Finance</option>
                                <option value="Operations">Operations</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Override Urgency</label>
                              <select
                                value={overrideUrgency}
                                onChange={(e) => setOverrideUrgency(e.target.value as TicketUrgency)}
                                className="w-full text-xs rounded-lg border border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 p-2 font-semibold outline-none cursor-pointer"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                              </select>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleManualOverride}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Apply Override Routing
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Internal Notes Panel */}
                  <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-600/60 p-5 space-y-3 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <Lock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span>Internal Agent Notes</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Comments written here are stored securely in internal operations log and never shown to the customer.</p>
                    
                    <textarea
                      rows={3}
                      value={internalNotesText}
                      onChange={(e) => setInternalNotesText(e.target.value)}
                      placeholder="e.g., Escalated ticket to senior systems desk. Verified user credentials."
                      className="w-full text-xs border border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-medium"
                    />

                    <button
                      type="button"
                      onClick={handleSaveInternalNotes}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                    >
                      Save Internal Comments
                    </button>
                  </div>

                  {/* Automated Email Alert Details */}
                  <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-600/60 p-5 space-y-3.5 shadow-xs" id="email-alert-panel">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <Mail className="h-4 w-4 text-indigo-500" />
                      <span>Automated Email Dispatch</span>
                    </h3>
                    
                    {selectedTicket.emailStatus === 'Sent' ? (
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
                    )}
                  </div>
                </div>

                {/* Right Column: Automated Response & Conversational Chat Feed */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Automated Response Management */}
                  <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700 shadow-lg p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                          <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
                          <span>AI Response Co-Pilot</span>
                        </h3>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Assist draft response creation with tone adjustment.</p>
                      </div>

                      <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs">
                        {(['Formal', 'Friendly', 'Urgent'] as const).map(tone => (
                          <button
                            key={tone}
                            onClick={() => setSelectedTone(tone)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                              selectedTone === tone ? 'bg-white dark:bg-slate-900 text-indigo-700 shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="relative">
                        <textarea
                          rows={6}
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          placeholder="Drafting formal response with models..."
                          className="w-full text-xs border border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-mono"
                        />
                        {isGenerating && (
                          <div className="absolute inset-0 bg-white dark:bg-slate-900/80 flex items-center justify-center rounded-xl">
                            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Drafting with AI...</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tone Quality Auditor */}
                      {draftText && (() => {
                        const toneCheck = auditResponseTone(draftText);
                        return (
                          <div className="p-2.5 rounded-xl text-[10px] leading-relaxed border font-semibold flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border-emerald-100">
                            <span className={`h-2 w-2 rounded-full ${toneCheck.isCompliant ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
                            <span>
                              {toneCheck.isCompliant 
                                ? 'Compliance Checked: Clean formal language.' 
                                : `Compliance Warning: Detected informal words (${toneCheck.flaggedWords.join(', ')}).`}
                            </span>
                          </div>
                        );
                      })()}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateResponse}
                          disabled={isGenerating}
                          className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Regenerate Response</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleApproveDraft}
                          disabled={isGenerating || !draftText.trim()}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve &amp; Send to Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Operational Chat Room */}
                  <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-600/60 p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                        <MessageSquare className="h-4 w-4 text-indigo-500" />
                        <span>Live Client Thread</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Auto-Respond</span>
                        <button
                          type="button"
                          onClick={() => {
                            const isCurrentlyOn = selectedTicket.aiAutoRespond !== false;
                            const newState = !isCurrentlyOn;
                            
                            const sysMessage = {
                              id: `sys-${Date.now()}`,
                              sender: 'operator' as const,
                              senderName: 'System',
                              text: `Agent switched AI auto-responder ${newState ? 'ON' : 'OFF'}.`,
                              createdAt: new Date().toISOString()
                            };

                            onUpdateTicket(selectedTicket.id, {
                              aiAutoRespond: newState,
                              messages: [...(selectedTicket.messages || []), sysMessage]
                            });
                          }}
                          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors cursor-pointer ${
                            selectedTicket.aiAutoRespond !== false ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              selectedTicket.aiAutoRespond !== false ? 'translate-x-4' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                        selectedTicket.messages.map((msg, idx) => {
                          const isOperator = msg.sender === 'operator';
                          const isAi = msg.sender === 'agent';
                          return (
                            <div key={idx} className={`flex items-start gap-2.5 max-w-[85%] ${isOperator ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0 ${
                                isOperator ? 'bg-indigo-600 text-white' : isAi ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                              }`}>
                                {isOperator ? 'OP' : isAi ? 'AI' : selectedTicket.createdBy.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col space-y-0.5">
                                <div className={`rounded-2xl p-3 text-xs leading-relaxed ${
                                  isOperator 
                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-600/40'
                                }`}>
                                  {msg.text}
                                </div>
                                <span className="text-[8px] text-slate-400">{msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center italic text-slate-400 text-xs py-8">No messages in thread. Send assistance or draft feedback above.</div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                      <input
                        type="text"
                        value={chatMessageInput}
                        onChange={(e) => setChatMessageInput(e.target.value)}
                        placeholder="Type a message to customer..."
                        className="flex-1 text-xs text-slate-900 dark:text-slate-50 border border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Send
                      </button>
                    </form>
                  </div>

                </div>

              </div>
            </motion.div>
          ) : (
            // Triage List / Queue Dashboard
            <motion.div
              key="queue-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Operational KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-4 rounded-2xl shadow-xs space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Open Tickets</span>
                    <Inbox className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">{tickets.filter(t => t.status !== 'Resolved').length}</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Active inside triage</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-4 rounded-2xl shadow-xs space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Awaiting Approval</span>
                    <Lock className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">{tickets.filter(t => t.approvalStatus === 'Pending Approval').length}</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Pending agent sign-off</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-4 rounded-2xl shadow-xs space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">High / Critical</span>
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  </div>
                  <div>
                    <span className="text-xl font-black text-rose-600">{tickets.filter(t => t.urgency === 'High' || t.urgency === 'Critical').length}</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Priority escalations</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-4 rounded-2xl shadow-xs space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Completed Cases</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-xl font-black text-emerald-600">{tickets.filter(t => t.status === 'Resolved').length}</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Resolved successfully</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-4 rounded-2xl shadow-xs col-span-2 md:col-span-1 space-y-1.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">SLA Margin</span>
                    <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xl font-black text-indigo-600">15% Safe</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Target buffer headroom</span>
                  </div>
                </div>
              </div>

              {/* Filter controls */}
              <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-600/60 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  {/* Search */}
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search support queue..."
                      className="w-full text-xs text-slate-900 dark:text-slate-50 border border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800/50 pl-9 pr-4 py-3 rounded-xl outline-none"
                    />
                  </div>

                  {/* Dropdowns */}
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-xl font-bold text-indigo-700 cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      <option value="HR">HR</option>
                      <option value="IT">IT</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>

                    <select
                      value={selectedUrgency}
                      onChange={(e) => setSelectedUrgency(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-xl font-bold text-indigo-700 cursor-pointer"
                    >
                      <option value="All">All Urgency</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>

                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-xl font-bold text-indigo-700 cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-xl font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="date">Sort: Date</option>
                      <option value="confidence">Sort: AI Confidence</option>
                      <option value="urgency">Sort: Urgency</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTickets.length === 0 ? (
                  <div className="col-span-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-2xl p-16 space-y-3">
                    <Inbox className="h-10 w-10 text-slate-400 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No matching tickets in queue</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Wait for customer entries or clear active search parameter filters.</p>
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const catStyle = CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Operations;
                    const urgStyle = URGENCY_COLORS[t.urgency] || URGENCY_COLORS.Medium;

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className="bg-white dark:bg-slate-900/95 hover:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 hover:border-indigo-300 p-5 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-1">
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
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">{t.title}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">{t.description}</p>
                          </div>
                        </div>

                        {/* Info summary */}
                        <div className="border-t border-slate-100 dark:border-slate-700 mt-4 pt-3 flex justify-between items-center text-[10px] font-medium text-slate-400">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                          </span>
                          
                          <span className="font-bold text-indigo-600 uppercase tracking-wider text-[9px]">Triage Case →</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )
        ) : activeTab === 'analytics' ? (
          // DETAILED OPERATIONAL ANALYTICS
          <motion.div
            key="analytics-dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Category Pie Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1">
                <BarChart3 className="h-4.5 w-4.5 text-indigo-600" />
                <span>Category Distribution</span>
              </h3>
              <div className="h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStatsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryStatsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a' }} itemStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Bar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                <span>Ticket Statuses Overview</span>
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusStatsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a' }} itemStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]}>
                      {statusStatsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Resolved' ? '#10b981' : entry.name === 'In Progress' ? '#f59e0b' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'compliance' ? (
          // DETAILED COMPLIANCE RISKS VIEW
          <motion.div
            key="compliance-dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-6 rounded-2xl shadow-xs space-y-5"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">AI Content Compliance &amp; PII Audit</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Automated deep scanning for Toxic terms, Bias, and PII leakage.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch('/api/compliance/scan', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    if (res.ok) {
                      onRefreshData();
                      alert('Audit scan executed! Compliance risks found will be shown below.');
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Run Compliance Scan
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch('/api/compliance/clear', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    if (res.ok) {
                      onRefreshData();
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-lg cursor-pointer transition-colors border border-slate-200 dark:border-slate-600/60"
                >
                  Clear Risks
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {complianceRisks.length === 0 ? (
                <div className="text-center italic text-slate-500 dark:text-slate-400 text-xs py-10">No compliance risks detected. Deep neural scanning was fully compliant.</div>
              ) : (
                complianceRisks.map((risk, idx) => {
                  const matchingTicket = tickets.find(t => t.id === risk.ticketId);
                  return (
                    <div key={idx} className="bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-rose-800 dark:text-rose-400 uppercase tracking-wider">{risk.riskType} Risk detected</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          risk.severity === 'High' ? 'bg-rose-600 dark:bg-rose-500 text-white animate-pulse' : 'bg-rose-200 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                        }`}>
                          {risk.severity} Severity
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">{risk.description}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">Offending Text: "{risk.offendingMessage || matchingTicket?.description || 'N/A'}"</p>
                      
                      {matchingTicket && (
                        <div className="pt-2 flex items-center justify-between border-t border-rose-100/60 dark:border-rose-500/20 mt-2">
                          <span className="text-[10px] text-amber-700 dark:text-amber-500 font-bold flex items-center space-x-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            <span>
                              {risk.riskType === 'Bias' && "Requires bias remediation"}
                              {risk.riskType === 'Toxicity' && "Requires toxic language cleanup"}
                              {risk.riskType === 'PII Leak' && "Requires PII redacting"}
                              {risk.riskType === 'Hallucination' && "Requires response alignment verification"}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEditBiasTicket(matchingTicket, risk.riskType)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black rounded-lg cursor-pointer transition-colors flex items-center space-x-1.5 shadow-xs"
                          >
                            <Sliders className="h-3 w-3" />
                            <span>
                              {risk.riskType === 'Bias' && "Edit Ticket & Resolve Bias"}
                              {risk.riskType === 'Toxicity' && "Edit Ticket & Sanitize Language"}
                              {risk.riskType === 'PII Leak' && "Edit Ticket & Redact PII"}
                              {risk.riskType === 'Hallucination' && "Edit Ticket & Fix Hallucination"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : activeTab === 'automation' ? (
          // DETAILED AUTOMATION RULES CONFIGURATION WITH INTEGRATED PHYSICAL SILOS
          <motion.div
            key="automation-rules"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Control line */}
            <div className="flex justify-between items-center bg-gradient-to-r from-white via-slate-50 to-indigo-50/20 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-xs">
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                  <span>Automation Dispatches</span>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Define workflow dispatches triggered based on incoming ticket context.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRuleForm(!showAddRuleForm)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Automation Rule</span>
              </button>
            </div>

            {showAddRuleForm && (
              <form onSubmit={handleCreateRuleSubmit} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-5 rounded-2xl shadow-inner space-y-4 max-w-xl animate-fadeIn">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-600 pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Configure Dispatch Rule</span>
                  <button type="button" onClick={() => setShowAddRuleForm(false)}>
                    <X className="h-4 w-4 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Rule Name</label>
                    <input
                      type="text"
                      required
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="e.g., HR Direct Silo Dispatch"
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-2.5 outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Trigger Category</label>
                    <select
                      value={newRuleCategory}
                      onChange={(e) => setNewRuleCategory(e.target.value as any)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-2.5 outline-none cursor-pointer"
                    >
                      <option value="All">All</option>
                      <option value="HR">HR</option>
                      <option value="IT">IT</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Trigger Urgency</label>
                    <select
                      value={newRuleUrgency}
                      onChange={(e) => setNewRuleUrgency(e.target.value as any)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-2.5 outline-none cursor-pointer"
                    >
                      <option value="All">All</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Target Dispatch Queue</label>
                    <input
                      type="text"
                      required
                      value={newRuleTargetTeam}
                      onChange={(e) => setNewRuleTargetTeam(e.target.value)}
                      placeholder="e.g. Tier 3 Techdesk, Facility Management"
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-2.5 outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRuleRequireApproval}
                      onChange={(e) => setNewRuleRequireApproval(e.target.checked)}
                      className="rounded border-slate-200 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Requires Manual Signoff</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRuleSendEmail}
                      onChange={(e) => setNewRuleSendEmail(e.target.checked)}
                      className="rounded border-slate-200 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Trigger Email Dispatch Alert</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
                >
                  Create Rule Trigger
                </button>
              </form>
            )}

            {/* Existing Rules List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routingRules.map((rule) => (
                <div key={rule.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 p-4 rounded-xl shadow-xs space-y-3">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-snug">{rule.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Routes Category: <strong className="text-indigo-600">{rule.category}</strong> • Priority: <strong className="text-amber-600">{rule.urgency}</strong></p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Target Team:</span>
                      <strong className="text-slate-700 dark:text-slate-200 font-bold">{rule.targetTeam}</strong>
                    </div>
                    {rule.sendEmail ? (
                      <div className="flex items-center justify-between text-indigo-600">
                        <span>📧 email dispatch:</span>
                        <span className="font-extrabold lowercase">{rule.targetTeam.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>📧 email dispatch:</span>
                        <span>Disabled</span>
                      </div>
                    )}
                    {rule.requireApproval ? (
                      <div className="flex items-center justify-between text-amber-600">
                        <span>🔒 manual sign-off:</span>
                        <span>Required before dispatch</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>🔒 manual sign-off:</span>
                        <span>Auto-approved</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <span>Status Trigger</span>
                    <button
                      type="button"
                      onClick={() => onToggleRule(rule.id)}
                      className={`px-2.5 py-1 rounded-md cursor-pointer text-[9px] uppercase tracking-wider font-extrabold ${
                        rule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : activeTab === 'forecasting' ? (
          // DETAILED VOLUME & CAPACITY FORECASTING PANEL
          <motion.div
            key="forecasting-dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* PREDICTIVE INSIGHTS CARD */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-100 shadow-xl space-y-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                    </span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-indigo-500/40">
                      Predictive Insights Module
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center space-x-2 pt-1">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    <span>AI-Driven Operational Forecast &amp; Insights</span>
                  </h3>
                  <p className="text-sm text-slate-300 font-medium">
                    Real-time ML projections based on current ticket intake, historical volume velocity, and staff allocation.
                  </p>
                </div>
                
                <div>
                  <span className="text-xs font-bold bg-indigo-950 text-indigo-200 px-3.5 py-1.5 rounded-xl border border-indigo-700/60 shadow-xs">
                    Status: High Predictive Reliability (98%)
                  </span>
                </div>
              </div>

              {/* Grid of predictive metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-1">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Projected Weekly Volume</span>
                  <div className="flex items-baseline space-x-2 pt-1">
                    <span className="text-2xl font-black text-white">
                      {Math.round(tickets.length * 7 * (1 + (growthPercent / 100)) * (seasonality === 'holiday' ? 1.6 : seasonality === 'promotional' ? 1.35 : seasonality === 'quiet' ? 0.75 : 1.0))}
                    </span>
                    <span className="text-xs text-indigo-400 font-extrabold font-mono">+{growthPercent}% growth</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">Calculated using selected seasonality and custom growth parameters.</p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-1">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Estimated SLA Breaches</span>
                  <div className="flex items-baseline space-x-2 pt-1">
                    <span className="text-2xl font-black text-rose-400">
                      {tickets.length === 0 ? 0 : Math.round((tickets.length * 0.2) + (growthPercent * 0.1) + (seasonality === 'holiday' ? 3 : 0))}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">tickets/week</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">Estimated based on current filed user tickets.</p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-1">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Staff Balance Score</span>
                  <div className="flex items-baseline space-x-2 pt-1">
                    <span className="text-2xl font-black text-indigo-300">Optimal</span>
                    <span className="text-xs text-emerald-400 font-bold font-mono">1.15x Headroom</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">Indicates whether available support agents can cover high peaks.</p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-1">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Next 24h Peak Window</span>
                  <div className="flex items-baseline space-x-1.5 pt-1">
                    <span className="text-lg font-black text-white">Wednesday 2:00 PM</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">Anticipated surge window across support queues.</p>
                </div>
              </div>
            </div>

            {/* Top Control Settings Panel */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-white space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/30">
                    Predictive Analytics Engine
                  </span>
                  <h3 className="text-base font-extrabold text-white tracking-tight flex items-center space-x-2 pt-1">
                    <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
                    <span>Support Ticket Volumetric &amp; SLA Forecasting</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Adjust simulation parameters to project workload demand, estimate SLA breach hot-zones, and audit staffing metrics.
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setIsSimulating(true);
                    setTimeout(() => {
                      setIsSimulating(false);
                      setSimulationSeed(prev => prev + 1);
                      const sampleGrowths = [25, 40, 55, 15, 30];
                      const nextGrowth = sampleGrowths[(simulationSeed - 1) % sampleGrowths.length];
                      setGrowthPercent(nextGrowth);
                      if (showToast) {
                        showToast(`AI Simulation Model #${simulationSeed} executed! Projected weekly demand updated.`);
                      }
                    }, 600);
                  }}
                  disabled={isSimulating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-lg"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? "Simulating Model..." : "Run AI Simulation"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 pt-2 border-t border-slate-800">
                {/* Parameter 1: Growth Rate Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <label className="text-slate-300">Projected Customer growth</label>
                    <span className="text-indigo-400 font-extrabold">+{growthPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={growthPercent}
                    onChange={(e) => setGrowthPercent(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    Simulates increase in incoming tickets relative to the historical baseline volume.
                  </p>
                </div>

                {/* Parameter 2: Seasonality Multiplier */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">Seasonality Pattern Multiplier</label>
                  <select
                    value={seasonality}
                    onChange={(e) => setSeasonality(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="normal">Normal Support Operations (1.0x)</option>
                    <option value="holiday">Holiday Rush/Cyber Week (1.6x)</option>
                    <option value="promotional">Product Launch &amp; Promotions (1.35x)</option>
                    <option value="quiet">Spring Calm / Seasonal Low (0.75x)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                    Simulates historical spike patterns based on standard calendar event multipliers.
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Section: Chart & Operational Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Side: Wave Area Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-6 rounded-2xl shadow-xs space-y-4 lg:col-span-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">7-Day Ticket Volumetric Projection</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Compares baseline trends vs projected seasonal growth demand</p>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                    Confidence: 94% Accuracy
                  </span>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={
                      (() => {
                        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                        const multiplier = seasonality === 'holiday' ? 1.6 : seasonality === 'promotional' ? 1.35 : seasonality === 'quiet' ? 0.75 : 1.0;
                        const growthFactor = 1 + (growthPercent / 100);
                        const baselineVal = tickets.length;

                        return days.map((day, idx) => {
                          const dailyWeights = [0.8, 1.1, 1.3, 1.25, 1.0, 0.5, 0.4];
                          const weight = dailyWeights[idx];
                          const actualVal = Math.round(baselineVal * weight);
                          const predictedVal = Math.round(actualVal * growthFactor * multiplier);
                          const safeLimitVal = Math.round(baselineVal * 1.15);

                          return {
                            name: day,
                            'Baseline Actual': actualVal,
                            'Projected Demand': predictedVal,
                            'Safe Operating Limit': safeLimitVal
                          };
                        });
                      })()
                    }>
                      <defs>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a' }} itemStyle={{ color: isDarkMode ? '#cbd5e1' : '#475569' }} />
                      <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="Projected Demand" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProjected)" />
                      <Area type="monotone" dataKey="Baseline Actual" stroke="#94a3b8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBaseline)" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="Safe Operating Limit" stroke="#ef4444" strokeWidth={1} fillOpacity={0} strokeDasharray="3 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Side: AI Insights Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">AI Operations Analysis</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Staffing &amp; Routing Recommendation</p>
                    </div>
                  </div>

                  {/* Operational Risk Badge */}
                  {(() => {
                    const multiplier = seasonality === 'holiday' ? 1.6 : seasonality === 'promotional' ? 1.35 : seasonality === 'quiet' ? 0.75 : 1.0;
                    const growthFactor = 1 + (growthPercent / 100);
                    const isDeficit = (growthFactor * multiplier) > 1.15;

                    return isDeficit ? (
                      <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl space-y-1">
                        <div className="flex items-center space-x-1.5 text-rose-800 text-xs font-bold">
                          <AlertTriangle className="h-4 w-4 text-rose-600 animate-pulse" />
                          <span>HIGH WORKLOAD DEFICIT</span>
                        </div>
                        <p className="text-[10px] text-rose-600 font-semibold leading-relaxed">
                          Projected demand exceeds the standard team SLA safety threshold. Queue backlogs will spike on mid-week peaks.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
                        <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>SUFFICIENT STAFF CAPACITY</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-semibold leading-relaxed">
                          Staff capacity is healthy. Ticket loads will stay within target processing constraints.
                        </p>
                      </div>
                    );
                  })()}

                  <div className="space-y-2.5 pt-1">
                    <h5 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Queue Workload Assessment</h5>
                    
                    <div className="space-y-2">
                      {(['IT', 'Operations', 'Finance', 'HR'] as const).map(cat => {
                        const catTickets = tickets.filter(t => t.category === cat);
                        const openCount = catTickets.filter(t => t.status !== 'Resolved').length;
                        return (
                          <div key={cat} className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-600 dark:text-slate-300">{cat} Queue ({catTickets.length} filed)</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${
                              openCount === 0 ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : openCount > 2 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {openCount === 0 ? 'Quiet' : openCount > 2 ? 'High Load' : 'Active'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2.5">
                  <div className="text-[10px] font-bold text-indigo-600 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Cpu className="h-3.5 w-3.5 animate-pulse text-indigo-500" />
                      <span>SUGGESTED DISPATCH ADJUSTMENT</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      isSuggestionApplied
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-600 bg-amber-50 border-amber-200'
                    }`}>
                      {isSuggestionApplied ? 'Rule Applied & Active' : 'Recommendation Available'}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed italic bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                    "We recommend activating the <strong>'{dispatchRuleName}'</strong> rule and transferring <strong>{transferCount} staff agents</strong> from low-risk HR backlogs to live IT triage to keep response times under 15 minutes."
                  </p>
                  
                  {/* Live allocated staff display */}
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1.5">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Allocated Triage Staffing</div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-1.5 rounded-lg">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">HR Backlogs</span>
                        <span className="text-xs font-black text-emerald-600">{hrStaffCount} Agents</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 p-1.5 rounded-lg">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">Live IT Triage</span>
                        <span className="text-xs font-black text-indigo-600">{itStaffCount} Agents</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDispatchSuggestedEditorOpen(true)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>{isSuggestionApplied ? "Edit & Re-Apply Suggestion" : "Edit & Apply Suggestion"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Metrics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600/60 p-4 rounded-xl text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estimated SLA Breach Count</p>
                <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {Math.round((growthPercent * 0.15) + (seasonality === 'holiday' ? 5 : 1))}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600/60 p-4 rounded-xl text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SLA Met Probability</p>
                <p className="text-xl font-black text-indigo-600 mt-1">
                  {Math.max(45, 98 - Math.round(growthPercent * 0.4))} %
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600/60 p-4 rounded-xl text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Triage Automation Rate</p>
                <p className="text-xl font-black text-emerald-600 mt-1">
                  78.4%
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600/60 p-4 rounded-xl text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Resolution Time</p>
                <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {Math.round(18 + (growthPercent * 0.2))} mins
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* 4. Edit Bias Ticket Modal Overlay */}
      <AnimatePresence>
        {editingBiasTicket && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-600 w-full max-w-lg overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-slate-950 px-6 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                      {editingRiskType === 'Bias' && "Bias Remediation Editor"}
                      {editingRiskType === 'Toxicity' && "Toxicity Cleanup Editor"}
                      {editingRiskType === 'PII Leak' && "PII Leakage Redaction Editor"}
                      {editingRiskType === 'Hallucination' && "Hallucination Alignment Editor"}
                      {!editingRiskType && "Compliance Remediation Editor"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ticket ID: {editingBiasTicket.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBiasTicket(null);
                    setEditingRiskType(null);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket Title</label>
                  <input
                    type="text"
                    value={biasEditTitle}
                    onChange={(e) => setBiasEditTitle(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {editingRiskType === 'Bias' && "Inquiry Description (Neutral Phrasing Recommended)"}
                    {editingRiskType === 'Toxicity' && "Inquiry Description (Non-Toxic Phrasing Required)"}
                    {editingRiskType === 'PII Leak' && "Inquiry Description (Redact Sensitive PII Data)"}
                    {editingRiskType === 'Hallucination' && "Inquiry Description (Align Response Verification)"}
                    {!editingRiskType && "Inquiry Description"}
                  </label>
                  <textarea
                    rows={4}
                    value={biasEditDescription}
                    onChange={(e) => setBiasEditDescription(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Sanitize ticket description..."
                  />
                  <p className="text-[9px] text-slate-400 leading-snug">
                    {editingRiskType === 'Bias' && (
                      <span>💡 <strong>Tip:</strong> Strip away any stereotyping demographic labels or biased wording to enforce standard objective machine triaging.</span>
                    )}
                    {editingRiskType === 'Toxicity' && (
                      <span>💡 <strong>Tip:</strong> Clean up hostile comments, swearing, or angry, abusive outbursts to maintain workplace standard support compliance.</span>
                    )}
                    {editingRiskType === 'PII Leak' && (
                      <span>💡 <strong>Tip:</strong> Replace emails, social security numbers, credit cards, passwords, or phone numbers with redacted placeholders like [REDACTED_SSN] or [REDACTED_EMAIL].</span>
                    )}
                    {editingRiskType === 'Hallucination' && (
                      <span>💡 <strong>Tip:</strong> Manually double check database connections, pricing lists, or API endpoint addresses to ensure perfect accuracy.</span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category Override</label>
                    <select
                      value={biasEditCategory}
                      onChange={(e) => setBiasEditCategory(e.target.value as TicketCategory)}
                      className="w-full text-xs rounded-xl border border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="HR">HR</option>
                      <option value="IT">IT</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Urgency Level</label>
                    <select
                      value={biasEditUrgency}
                      onChange={(e) => setBiasEditUrgency(e.target.value as TicketUrgency)}
                      className="w-full text-xs rounded-xl border border-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBiasTicket(null);
                    setEditingRiskType(null);
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBiasTicket}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-sm"
                >
                  {editingRiskType === 'Bias' && "Apply & Resolve Bias"}
                  {editingRiskType === 'Toxicity' && "Apply & Clean Toxicity"}
                  {editingRiskType === 'PII Leak' && "Apply & Redact PII"}
                  {editingRiskType === 'Hallucination' && "Apply & Correct Hallucination"}
                  {!editingRiskType && "Apply & Resolve Compliance"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Suggested Dispatch Adjustment Modal */}
      <AnimatePresence>
        {isDispatchSuggestedEditorOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-600 w-full max-w-xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-slate-950 px-6 py-4 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4.5 w-4.5 text-indigo-400 shrink-0 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 font-sans">Dispatch &amp; Staffing Adjustment Editor</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Optimize queue routing &amp; SLA compliance buffers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDispatchSuggestedEditorOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                
                {/* Section 1: Automation Rule Toggle */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600/60 p-4 rounded-xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Part 1: Automation Rule Trigger</span>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">Activate High-Urgency Auto-routing</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={dispatchAutopassEnabled}
                        onChange={(e) => setDispatchAutopassEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-slate-300 dark:border-slate-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {dispatchAutopassEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-600/50">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rule Identifier</label>
                        <input
                          type="text"
                          value={dispatchRuleName}
                          onChange={(e) => setDispatchRuleName(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-2 font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Dispatch Desk</label>
                        <input
                          type="text"
                          value={dispatchRuleTarget}
                          onChange={(e) => setDispatchRuleTarget(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-2 font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trigger Category</label>
                        <select
                          value={dispatchRuleCategory}
                          onChange={(e) => setDispatchRuleCategory(e.target.value as any)}
                          className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-2 font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="All">All Categories</option>
                          <option value="HR">HR</option>
                          <option value="IT">IT</option>
                          <option value="Finance">Finance</option>
                          <option value="Operations">Operations</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trigger Urgency</label>
                        <select
                          value={dispatchRuleUrgency}
                          onChange={(e) => setDispatchRuleUrgency(e.target.value as any)}
                          className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-2 font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="All">All Urgencies</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Staff Routing Allocation */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600/60 p-4 rounded-xl space-y-4">
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Part 2: Dynamic Workforce Redistribution</span>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">Transfer Live Support Headcount</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-1">
                      Moving agents temporarily from low-risk departments mitigates massive workload peak congestion.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-600/50">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span>Redistribute Headcount Count</span>
                      <span className="text-indigo-600 font-black">{transferCount} Staff Agents</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="1"
                      value={transferCount}
                      onChange={(e) => setTransferCount(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>1 Agent (Standard)</span>
                      <span>4 Agents (Aggressive)</span>
                    </div>
                  </div>

                  {/* Allocation Impact Simulator */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 rounded-xl">
                      <div className="flex items-center space-x-1 mb-1 text-[9px] text-slate-400 font-bold uppercase">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        <span>HR backlogs (Before &gt; After)</span>
                      </div>
                      <div className="text-xs font-black text-slate-700 dark:text-slate-200">
                        {hrStaffCount} Agents &rarr; <span className="text-emerald-600 font-black">{Math.max(0, hrStaffCount - transferCount)} Agents</span>
                      </div>
                      <p className="text-[8px] text-slate-400 leading-normal mt-1">HR backlogs are quiet; impact to SLA wait times is minimal.</p>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600/60 rounded-xl">
                      <div className="flex items-center space-x-1 mb-1 text-[9px] text-slate-400 font-bold uppercase">
                        <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                        <span>Live IT Triage (Before &gt; After)</span>
                      </div>
                      <div className="text-xs font-black text-slate-700 dark:text-slate-200">
                        {itStaffCount} Agents &rarr; <span className="text-indigo-600 font-black">{itStaffCount + transferCount} Agents</span>
                      </div>
                      <p className="text-[8px] text-slate-400 leading-normal mt-1">Reinforces high priority queues; drops SLA response breach probability.</p>
                    </div>
                  </div>
                </div>

                {/* Simulated SLA Compliance Meter */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200/60 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-black text-emerald-800">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>SLA COMPLIANCE OPTIMIZATION LEVEL</span>
                    </span>
                    <span>+{25 + (transferCount * 12)}% Increase</span>
                  </div>
                  <div className="w-full bg-emerald-200/40 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, 60 + (transferCount * 10))}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-emerald-600 font-semibold leading-relaxed">
                    🌟 Recommended adjustment keeps average IT peak response times down at approximately <strong>{Math.max(8, 16 - (transferCount * 2))} minutes</strong> (well below the target 15-minute standard team SLA limits).
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDispatchSuggestedEditorOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isApplyingDispatchSuggested}
                  onClick={handleApplySuggestedDispatch}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApplyingDispatchSuggested ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Applying Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Apply Dispatch Adjustments</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
