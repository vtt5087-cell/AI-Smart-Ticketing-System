export type TicketCategory = 'HR' | 'IT' | 'Finance' | 'Operations';
export type TicketUrgency = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'New' | 'In Progress' | 'Resolved';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'operator';
  senderName: string;
  text: string;
  createdAt: string;
  model?: 'gemini' | 'ollama';
}

export interface ApprovalStep {
  stepName: string;
  approverRole: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
  updatedAt?: string;
  notes?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  urgency: TicketUrgency;
  createdBy: string;
  confidence: number; // confidence score of classification (0-100)
  tags: string[];
  createdAt: string;
  status: TicketStatus;
  aiResponse: string | null;
  aiResponseTone: 'Formal' | 'Friendly' | 'Urgent' | null;
  aiResponseCreatedAt: string | null;
  userEditedResponse: string | null;
  aiResponseTimeSeconds?: number; // time taken by AI to generate response in seconds
  messages?: ChatMessage[];
  // Week 7 - Workflow Automation & Integration
  assignedTeam?: string;
  assignedAgent?: string;
  emailStatus?: 'Sent' | 'Failed' | 'Pending' | 'Not Sent';
  emailRecipient?: string;
  emailSubject?: string;
  emailBody?: string;
  approvalStatus?: 'Not Required' | 'Pending Approval' | 'Approved' | 'Rejected';
  approvalSteps?: ApprovalStep[];
  routingLogs?: string[];
  jiraIssueKey?: string;
  slackChannel?: string;
  pagerDutyIncidentId?: string;
  autopilotActive?: boolean;
  integrationPayloads?: Record<string, string>;
  claimedBy?: string | null;
  csatRating?: number | null;
  csatComment?: string | null;
  internalNotes?: string;
  aiAutoRespond?: boolean;
}

export interface RoutingRule {
  id: string;
  name: string;
  category: TicketCategory | 'All';
  urgency: TicketUrgency | 'All';
  targetTeam: string;
  requireApproval: boolean;
  sendEmail: boolean;
  isActive: boolean;
  autopilot?: boolean;
  syncJira?: boolean;
  syncSlack?: boolean;
}

export interface AutomationLog {
  id: string;
  ticketId: string;
  ticketTitle: string;
  ruleName: string;
  timestamp: string;
  actions: string[];
}

export interface CategorySummary {
  category: TicketCategory;
  count: number;
  percentage: number;
}

export interface ForecastData {
  date: string;
  actualVolume?: number;
  projectedVolume: number;
}

export interface ComplianceRisk {
  id: string;
  ticketId: string;
  riskType: 'Bias' | 'Toxicity' | 'PII Leak' | 'Hallucination';
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  createdAt: string;
  status: 'Open' | 'Reviewed' | 'Resolved';
  transparencyNote?: string;
  offendingMessage?: string;
  detailedAnalysis?: string;
}

export interface AnalyticsData {
  totalTickets: number;
  categoryDistribution: CategorySummary[];
  urgencyDistribution: { urgency: TicketUrgency; count: number }[];
  statusDistribution: { status: TicketStatus; count: number }[];
  dailyVolume: { date: string; count: number }[];
  averageConfidence: number;
  averageAiResponseTimeSeconds: number;
}
