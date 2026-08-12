import { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Sliders, 
  Activity,
  LogOut,
  Lock,
  ShieldAlert,
  Loader2,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, RoutingRule, AutomationLog } from './types';
import UserDashboard from './components/UserDashboard';
import AgentDashboard from './components/AgentDashboard';
import Login from './components/Login';

export default function App() {
  // Theme state (Dark Mode default)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // Session / Authentication state
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });

  // Custom lightweight path router
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Core system collections (State synced with Server)
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [complianceRisks, setComplianceRisks] = useState<any[]>([]);

  const [selectedAiProvider, setSelectedAiProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);

  // Helper to change path smoothly
  const navigate = (to: string) => {
    window.history.pushState(null, '', to);
    setCurrentPath(to);
  };

  // Toast notifier helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Listen to popstate event for native backward/forward browser button support
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);



  const safeJson = async (res: Response) => {
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      const text = await res.text();
      if (!text) throw new Error("Empty response body");
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse response:", e);
      throw new Error("Invalid response format from server.");
    }
  };

  // Secure API fetch request wrapper injecting token headers automatically


  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    const response = await fetch(url, {
      ...options,
      headers
    });
    if (response.status === 401) {
      handleForceLogout();
      showToast('Session expired. Please sign in again.');
      throw new Error('Unauthorized');
    }
    return response;
  };

  // Perform clean local & remote logout, clearing administrative state
  const handleForceLogout = () => {
    setUser(null);
    setToken(null);
    setTickets([]);
    setRoutingRules([]);
    setAutomationLogs([]);
    setComplianceRisks([]);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  const onLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Logout API call failed:", e);
      }
    }
    handleForceLogout();
    showToast('Logged out successfully.');
  };

  // Login handler
  const onLoginSuccess = (authenticatedUser: any, sessionToken: string) => {
    setUser(authenticatedUser);
    setToken(sessionToken);
    localStorage.setItem('auth_user', JSON.stringify(authenticatedUser));
    localStorage.setItem('auth_token', sessionToken);
  };

  // Fetch all collections stateful on mount / login
  const loadOperationsData = async () => {
    if (!token || !user) return;
    try {
      const resTickets = await fetchWithAuth('/api/tickets');
      if (resTickets.ok) {
        const data = await safeJson(resTickets);
        setTickets(data);
      }

      if (user.role === 'AGENT' || user.role === 'ADMIN') {
        const resRules = await fetchWithAuth('/api/rules');
        if (resRules.ok) {
          const rules = await safeJson(resRules);
          setRoutingRules(rules);
        }

        const resLogs = await fetchWithAuth('/api/logs');
        if (resLogs.ok) {
          const logs = await safeJson(resLogs);
          setAutomationLogs(logs);
        }

        const resCompliance = await fetchWithAuth('/api/compliance');
        if (resCompliance.ok) {
          const risks = await safeJson(resCompliance);
          setComplianceRisks(risks);
        }
      }
    } catch (err: any) {
      if (err && err.message === 'Unauthorized') {
        console.warn("Session was stale or invalid; cleared local credentials.");
      } else {
        console.error("Failed to load secure operations data", err);
      }
    }
  };

  useEffect(() => {
    if (token && user) {
      setIsLoadingInitial(true);
      loadOperationsData().finally(() => {
        setIsLoadingInitial(false);
      });
    }
  }, [token, user?.id]);

  // Route Guards & Access Control Checks
  useEffect(() => {
    if (!token || !user) {
      if (currentPath === '/user/dashboard' || currentPath === '/agent/dashboard') {
        const targetIsAgent = currentPath.startsWith('/agent');
        navigate(targetIsAgent ? '/agent/login' : '/');
        showToast('Access Denied: Please sign in first.');
      }
      return;
    }

    if (user.role === 'USER') {
      if (currentPath.startsWith('/agent') || currentPath === '/agent/dashboard') {
        navigate('/user/dashboard');
        showToast('Unauthorized Access: Standard users are restricted from Agent views.');
      } else if (currentPath === '/' || currentPath === '/login' || currentPath === '/agent/login') {
        navigate('/user/dashboard');
      }
    }

    if (user.role === 'AGENT' || user.role === 'ADMIN') {
      if (currentPath === '/' || currentPath === '/agent/login' || currentPath === '/login' || currentPath === '/user/dashboard') {
        navigate('/agent/dashboard');
      }
    }
  }, [currentPath, user, token]);

  // Operations: Submit a new ticket
  const onCreateTicket = async (subject: string, description: string) => {
    setIsClassifying(true);
    try {
      const res = await fetchWithAuth('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({ title: subject, description })
      });
      if (res.ok) {
        const newTicket = await safeJson(res);
        if (!newTicket || !newTicket.id) {
           showToast(`Submission failed: Invalid response from server.`);
           return;
        }
        setTickets(prev => [newTicket, ...prev]);
        showToast(`Ticket submitted successfully! Category "${newTicket.category}" allocated by AI.`);
        loadOperationsData();
      } else {
        const errData = await safeJson(res);
        showToast(`Submission failed: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error filing ticket.');
    } finally {
      setIsClassifying(false);
    }
  };

  // Operations: Update existing ticket fields
  const onUpdateTicket = async (ticketId: string, updatedFields: Partial<Ticket>) => {
    const originalTicket = tickets.find(t => t.id === ticketId);
    
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updatedFields } : t));

    try {
      const res = await fetchWithAuth(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) {
        const errData = await safeJson(res);
        showToast(`Action Denied: ${errData.error || 'Unauthorized modification'}`);
        if (originalTicket) {
          setTickets(prev => prev.map(t => t.id === ticketId ? originalTicket : t));
        }
      } else {
        const savedTicket = await safeJson(res);
        setTickets(prev => prev.map(t => t.id === ticketId ? savedTicket : t));
        if (user.role === 'AGENT' || user.role === 'ADMIN') {
          const resComp = await fetchWithAuth('/api/compliance');
          if (resComp.ok) {
            const risks = await safeJson(resComp);
            setComplianceRisks(risks);
          }
        }
      }
    } catch (err) {
      console.error(err);
      if (originalTicket) {
        setTickets(prev => prev.map(t => t.id === ticketId ? originalTicket : t));
      }
    }
  };

  // Operations: Send live support message from the user
  const onSendUserMessage = async (ticketId: string, text: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    if (text.startsWith('CUSTOMER_CSAT_RATING:')) {
      const parts = text.split(':');
      const rating = parseInt(parts[1], 10);
      const comment = parts[2] ? parts[2].replace(/"/g, '') : '';
      
      onUpdateTicket(ticketId, {
        csatRating: rating,
        csatComment: comment
      });
      return;
    }

    const newMessage = {
      id: `m-${Date.now()}`,
      sender: 'user' as const,
      senderName: user ? user.name : 'Customer',
      text,
      createdAt: new Date().toISOString()
    };

    const updatedMsgs = [...(ticket.messages || []), newMessage];
    onUpdateTicket(ticketId, {
      messages: updatedMsgs
    });
  };

  // Operations: Delete a ticket from the system
  const onDeleteTicket = async (ticketId: string) => {
    try {
      const res = await fetchWithAuth(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        showToast('Ticket deleted from active database.');
      } else {
        const errData = await safeJson(res);
        showToast(`Failed to delete: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Operations: Add routing automation rule (Prepend to top)
  const onAddRule = async (rule: Omit<RoutingRule, 'id'>) => {
    try {
      const res = await fetchWithAuth('/api/rules', {
        method: 'POST',
        body: JSON.stringify(rule)
      });
      if (res.ok) {
        const newRule = await safeJson(res);
        // Prepend rule to top of list
        setRoutingRules(prev => [newRule, ...prev]);
        showToast(`Automation trigger "${newRule.name}" created at top of list!`);
      } else {
        const errData = await safeJson(res);
        showToast(`Failed to create rule: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Operations: Toggle routing rule status
  const onToggleRule = async (ruleId: string) => {
    const rule = routingRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    const originalIsActive = rule.isActive;
    setRoutingRules(prev => prev.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r));

    try {
      const res = await fetchWithAuth(`/api/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !originalIsActive })
      });
      if (!res.ok) {
        const errData = await safeJson(res);
        showToast(`Failed to toggle: ${errData.error}`);
        setRoutingRules(prev => prev.map(r => r.id === ruleId ? { ...r, isActive: originalIsActive } : r));
      } else {
        showToast('Rule active status updated.');
      }
    } catch (err) {
      console.error(err);
      setRoutingRules(prev => prev.map(r => r.id === ruleId ? { ...r, isActive: originalIsActive } : r));
    }
  };

  // Operations: Delete automation rule
  const onDeleteRule = async (ruleId: string) => {
    try {
      const res = await fetchWithAuth(`/api/rules/${ruleId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRoutingRules(prev => prev.filter(r => r.id !== ruleId));
        showToast('Automation rule destroyed.');
      } else {
        const errData = await safeJson(res);
        showToast(`Failed to delete rule: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-200 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 ${
      isDarkMode ? 'dark' : ''
    }`}>
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-semibold py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700"
          >
            <ShieldAlert className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global App Navigation Bar */}
      <nav className={`border-b sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between shadow-md transition-colors ${
        'bg-slate-900 border-slate-800 text-white dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-100 dark:backdrop-blur-md'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-md">
            AI
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight leading-none text-white">AI Ticketing Desk</h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Enterprise Operations &amp; Support</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors border border-slate-700 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title={'Switch to Dark Mode dark:Switch dark:to dark:Light dark:Mode'}
          >
            {isDarkMode ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-indigo-300" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-800/80 rounded-xl px-3 py-1.5 border border-slate-700">
                <UserIcon className="h-4 w-4 text-pink-400" />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-200 leading-none">{user.name}</p>
                  <p className="text-[10px] text-pink-400 font-bold uppercase mt-0.5 tracking-wider">{user.role}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-rose-400 transition-colors border border-slate-700 rounded-xl hover:bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 uppercase tracking-wider text-xs">Secured</span>
            </div>
          )}
        </div>
      </nav>

      {/* Main View Grid */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto flex flex-col justify-center">
        {isLoadingInitial ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-20">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Syncing operations data...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!token || !user ? (
              <motion.div
                key="auth-routes"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="py-6 flex items-center justify-center"
              >
                {currentPath === '/agent/login' ? (
                  <Login 
                    isAgentPortal={true}
                    onLoginSuccess={onLoginSuccess}
                    navigate={navigate}
                    showToast={showToast}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <Login 
                    isAgentPortal={false}
                    onLoginSuccess={onLoginSuccess}
                    navigate={navigate}
                    showToast={showToast}
                    isDarkMode={isDarkMode}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="dashboard-routes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                {user.role === 'USER' ? (
                  <UserDashboard 
                    tickets={tickets}
                    onCreateTicket={onCreateTicket}
                    isSubmitting={isClassifying}
                    onSendUserMessage={onSendUserMessage}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <AgentDashboard 
                    tickets={tickets}
                    complianceRisks={complianceRisks}
                    routingRules={routingRules}
                    automationLogs={automationLogs}
                    onUpdateTicket={onUpdateTicket}
                    onDeleteTicket={onDeleteTicket}
                    onAddRule={onAddRule}
                    onToggleRule={onToggleRule}
                    onDeleteRule={onDeleteRule}
                    selectedAiProvider={selectedAiProvider}
                    onSelectAiProvider={setSelectedAiProvider}
                    token={token}
                    onRefreshData={loadOperationsData}
                    isDarkMode={isDarkMode}
                    showToast={showToast}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer className={`py-4 border-t text-center text-xs font-semibold uppercase tracking-wider transition-colors ${
        'border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
      }`}>
        AI Ticketing System • Operations Control &amp; Triage Engine
      </footer>


    </div>
  );
}

