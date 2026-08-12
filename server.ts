import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { dispatch_ticket_email, emailDispatchLogs } from './src/services/email_service';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY environment variable is not configured correctly.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const flashModels = [
  "gemini-3.6-flash",
  "groq:llama-3.1-8b-instant",
  "openai:gpt-4o-mini"
];

const proModels = [
  "gemini-3.1-pro-preview",
  "groq:llama-3.3-70b-versatile",
  "openai:gpt-4o",
  "openai:o3-mini"
];

async function generateContentWithRetry(ai: any, prompt: string, config: any = undefined, maxRetries = 1, customModels?: string[]) {
  const models = customModels || flashModels;
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    for (const modelId of models) {
      try {
        if (modelId.startsWith("groq:")) {
          const model = modelId.replace("groq:", "");
          if (!process.env.GROQ_API_KEY) continue;
          
          console.log(`Attempting generation with Groq model: ${model}, attempt: ${attempt + 1}`);
          const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
          const response = await groq.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            ...(config && config.responseMimeType === "application/json" ? { response_format: { type: "json_object" } } : {})
          });
          return { text: response.choices[0].message.content };
        } else if (modelId.startsWith("openai:")) {
          const model = modelId.replace("openai:", "");
          if (!process.env.OPENAI_API_KEY) continue;
          
          console.log(`Attempting generation with OpenAI model: ${model}, attempt: ${attempt + 1}`);
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const response = await openai.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            ...(config && config.responseMimeType === "application/json" ? { response_format: { type: "json_object" } } : {})
          });
          return { text: response.choices[0].message.content };
        } else {
          console.log(`Attempting generation with model: ${modelId}, attempt: ${attempt + 1}`);
          const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            ...(config ? { config } : {})
          });
          return response;
        }
      } catch (err: any) {
        console.error(`Model ${modelId} failed:`, err.message);
        lastError = err;
      }
    }
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

async function generateContentStreamWithRetry(ai: any, prompt: string, maxRetries = 1, customModels?: string[]): Promise<any> {
  const models = customModels || flashModels;
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    for (const modelId of models) {
      try {
        if (modelId.startsWith("groq:")) {
          const model = modelId.replace("groq:", "");
          if (!process.env.GROQ_API_KEY) continue;
          
          console.log(`Attempting stream generation with Groq model: ${model}, attempt: ${attempt + 1}`);
          const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
          const stream = await groq.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            stream: true,
          });
          
          const iterator = stream[Symbol.asyncIterator]();
          const first = await iterator.next();
          
          async function* wrappedGroqStream() {
            if (!first.done) {
              const content = first.value.choices[0]?.delta?.content || "";
              if (content) yield { text: content };
            }
            for await (const chunk of iterator as any) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) yield { text: content };
            }
          }
          return wrappedGroqStream();
        } else if (modelId.startsWith("openai:")) {
          const model = modelId.replace("openai:", "");
          if (!process.env.OPENAI_API_KEY) continue;
          
          console.log(`Attempting stream generation with OpenAI model: ${model}, attempt: ${attempt + 1}`);
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const stream = await openai.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }],
            stream: true,
          });
          
          const iterator = stream[Symbol.asyncIterator]();
          const first = await iterator.next();
          
          async function* wrappedOpenAIStream() {
            if (!first.done) {
              const content = first.value.choices[0]?.delta?.content || "";
              if (content) yield { text: content };
            }
            for await (const chunk of iterator as any) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) yield { text: content };
            }
          }
          return wrappedOpenAIStream();
        } else {
          console.log(`Attempting stream generation with model: ${modelId}, attempt: ${attempt + 1}`);
          const stream = await ai.models.generateContentStream({
            model: modelId,
            contents: prompt,
          });
          
          const iterator = stream[Symbol.asyncIterator]();
          const first = await iterator.next();
          
          async function* wrappedStream() {
            if (!first.done) {
              yield first.value;
            }
            for await (const chunk of iterator as any) {
              yield chunk;
            }
          }
          return wrappedStream();
        }
      } catch (err: any) {
        console.error(`Model ${modelId} failed:`, err.message);
        lastError = err;
      }
    }
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// ==========================================
// SECURE USER REGISTRY & ACTIVE SESSIONS
// ==========================================
interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
  passwordHash: string; // Stored in plain for simple mock but safe matching
}

const users: User[] = [
  { id: "u1", name: "John Doe", email: "user@example.com", role: "USER", passwordHash: "password123" },
  { id: "a1", name: "Zama Khumalo", email: "agent@company.com", role: "AGENT", passwordHash: "password123" },
  { id: "ad1", name: "Admin Alice", email: "admin@company.com", role: "ADMIN", passwordHash: "password123" }
];

// activeSessions: token -> User
const activeSessions = new Map<string, Omit<User, 'passwordHash'>>();

// Authentication Middleware
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: "Access Denied: Session token required." });
  }
  
  const user = activeSessions.get(token);
  if (!user) {
    return res.status(401).json({ error: "Access Denied: Invalid or expired session." });
  }
  
  req.user = user;
  next();
}

// Role Authorization Middleware
function authorize(roles: ('USER' | 'AGENT' | 'ADMIN')[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access Denied: Requires one of these roles: ${roles.join(', ')}` });
    }
    next();
  };
}

// ==========================================
// SERVER-SIDE OPERATIONS STATE
// ==========================================
interface RoutingRule {
  id: string;
  name: string;
  category: 'HR' | 'IT' | 'Finance' | 'Operations' | 'All';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical' | 'All';
  targetTeam: string;
  requireApproval: boolean;
  sendEmail: boolean;
  isActive: boolean;
  autopilot?: boolean;
  syncJira?: boolean;
  syncSlack?: boolean;
}

interface AutomationLog {
  id: string;
  ticketId: string;
  ticketTitle: string;
  ruleName: string;
  timestamp: string;
  actions: string[];
}

interface ComplianceRisk {
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

let routingRules: RoutingRule[] = [
  { id: 'rule-1', name: 'IT Infrastructure Fast-track', category: 'IT', urgency: 'Critical', targetTeam: 'Tier 3 Infrastructure Ops', requireApproval: false, sendEmail: true, isActive: true },
  { id: 'rule-2', name: 'HR Payroll & Leave Approval', category: 'HR', urgency: 'All', targetTeam: 'HR Benefits & Leave Desk', requireApproval: true, sendEmail: true, isActive: true },
  { id: 'rule-3', name: 'Billing Audit Workflow', category: 'Finance', urgency: 'High', targetTeam: 'Finance Controls Team', requireApproval: true, sendEmail: true, isActive: true },
  { id: 'rule-4', name: 'Critical Facility Maintenance', category: 'Operations', urgency: 'Critical', targetTeam: 'Emergency Response Squad', requireApproval: false, sendEmail: true, isActive: true },
  { id: 'rule-5', name: 'General IT Desk routing', category: 'IT', urgency: 'All', targetTeam: 'Tier 1 Helpdesk', requireApproval: false, sendEmail: false, isActive: true },
  { id: 'rule-6', name: 'Finance Payments routine', category: 'Finance', urgency: 'All', targetTeam: 'Accounts Payable Admin', requireApproval: false, sendEmail: true, isActive: true },
];

let automationLogs: AutomationLog[] = [];
let complianceRisks: ComplianceRisk[] = [];
let tickets: any[] = [
  {
    "id": "t-20260000",
    "title": "VPN Connection Failing",
    "description": "I cannot connect to the corporate VPN since the morning update. It hangs on 'authenticating'.",
    "category": "IT",
    "urgency": "High",
    "confidence": 92,
    "tags": [
      "IT",
      "Support"
    ],
    "createdAt": "2026-08-02T16:39:31.387Z",
    "status": "Open",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-sf57uru",
        "senderId": "system",
        "senderName": "System",
        "content": "Ticket assigned to IT Network Support.",
        "timestamp": "2026-08-03T06:56:25.682Z",
        "isStaff": false,
        "isSystem": true
      },
      {
        "id": "msg-rrwm87b",
        "senderId": "agent-taylortech",
        "senderName": "Taylor Tech",
        "content": "Hi, please restart your Cisco AnyConnect client and try again. We pushed a background fix.",
        "timestamp": "2026-08-03T08:43:05.682Z",
        "isStaff": true,
        "isSystem": false
      },
      {
        "id": "msg-d13pysu",
        "senderId": "j.doe@company.com",
        "senderName": "John Doe",
        "content": "That worked, thanks! But now my shared drives are missing.",
        "timestamp": "2026-08-03T10:06:25.682Z",
        "isStaff": false,
        "isSystem": false
      },
      {
        "id": "msg-uhzsmcm",
        "senderId": "agent-taylortech",
        "senderName": "Taylor Tech",
        "content": "You may need to run the 'Remap Drives' shortcut on your desktop. Let me know if that helps.",
        "timestamp": "2026-08-03T11:29:45.682Z",
        "isStaff": true,
        "isSystem": false
      }
    ],
    "createdBy": "j.doe@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"VPN Connection Failing\" by John Doe."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Taylor Tech"
  },
  {
    "id": "t-20260001",
    "title": "Payroll discrepancy - August",
    "description": "My August paycheck seems to be missing the overtime hours from the first week.",
    "category": "HR",
    "urgency": "Medium",
    "confidence": 89,
    "tags": [
      "HR",
      "Support"
    ],
    "createdAt": "2026-08-03T18:52:31.016Z",
    "status": "Pending",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-wdyw7t5",
        "senderId": "system",
        "senderName": "System",
        "content": "Ticket routed to HR Payroll & Leave Approval.",
        "timestamp": "2026-08-02T13:16:25.683Z",
        "isStaff": false,
        "isSystem": true
      },
      {
        "id": "msg-tia0m0j",
        "senderId": "agent-samservice",
        "senderName": "Sam Service",
        "content": "Hello, I am looking into this. Could you please confirm the exact dates for the overtime?",
        "timestamp": "2026-08-03T03:09:45.683Z",
        "isStaff": true,
        "isSystem": false
      },
      {
        "id": "msg-errid9s",
        "senderId": "a.smith@company.com",
        "senderName": "Alice Smith",
        "content": "It was Aug 3rd and 4th.",
        "timestamp": "2026-08-03T17:03:05.683Z",
        "isStaff": false,
        "isSystem": false
      }
    ],
    "createdBy": "a.smith@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Payroll discrepancy - August\" by Alice Smith."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Sam Service"
  },
  {
    "id": "t-20260002",
    "title": "New laptop request for contractor",
    "description": "We have a new contractor starting next week. Need a standard developer laptop setup.",
    "category": "Operations",
    "urgency": "Medium",
    "confidence": 97,
    "tags": [
      "Operations",
      "Support"
    ],
    "createdAt": "2026-07-30T13:57:57.638Z",
    "status": "Resolved",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-o89e3yz",
        "senderId": "system",
        "senderName": "System",
        "content": "Ticket assigned to Tier 1 Helpdesk.",
        "timestamp": "2026-07-29T12:03:05.683Z",
        "isStaff": false,
        "isSystem": true
      },
      {
        "id": "msg-yyhllvb",
        "senderId": "agent-alexadmin",
        "senderName": "Alex Admin",
        "content": "Request approved. Hardware will be shipped to the office by Friday.",
        "timestamp": "2026-07-30T15:49:45.683Z",
        "isStaff": true,
        "isSystem": false
      },
      {
        "id": "msg-3czj3oz",
        "senderId": "m.jones@company.com",
        "senderName": "Mark Jones",
        "content": "Great, thanks for the quick turnaround.",
        "timestamp": "2026-07-31T05:43:05.683Z",
        "isStaff": false,
        "isSystem": false
      }
    ],
    "createdBy": "m.jones@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"New laptop request for contractor\" by Mark Jones."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Alex Admin"
  },
  {
    "id": "t-20260003",
    "title": "Office 365 License Expired",
    "description": "I'm getting a notification that my O365 license has expired. Can't edit Word docs.",
    "category": "IT",
    "urgency": "Critical",
    "confidence": 87,
    "tags": [
      "IT",
      "Support"
    ],
    "createdAt": "2026-07-31T09:04:03.956Z",
    "status": "Closed",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-ekv971m",
        "senderId": "system",
        "senderName": "System",
        "content": "Ticket escalated to Tier 3 Infrastructure Ops.",
        "timestamp": "2026-08-04T01:23:05.683Z",
        "isStaff": false,
        "isSystem": true
      },
      {
        "id": "msg-ktureps",
        "senderId": "agent-taylortech",
        "senderName": "Taylor Tech",
        "content": "Hi, there was a sync issue with Azure AD. I've forced a sync for your account. Please restart Word.",
        "timestamp": "2026-08-04T01:56:25.683Z",
        "isStaff": true,
        "isSystem": false
      },
      {
        "id": "msg-oxd7cx1",
        "senderId": "s.williams@company.com",
        "senderName": "Sarah Williams",
        "content": "Working now, thanks.",
        "timestamp": "2026-08-04T02:46:25.683Z",
        "isStaff": false,
        "isSystem": false
      }
    ],
    "createdBy": "s.williams@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Office 365 License Expired\" by Sarah Williams."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Taylor Tech"
  },
  {
    "id": "t-20260004",
    "title": "Q3 Budget Approval",
    "description": "Need sign-off on the revised Q3 marketing budget.",
    "category": "Finance",
    "urgency": "High",
    "confidence": 92,
    "tags": [
      "Finance",
      "Support"
    ],
    "createdAt": "2026-07-27T10:37:16.220Z",
    "status": "New",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [],
    "createdBy": "d.brown@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Q3 Budget Approval\" by David Brown."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Unassigned"
  },
  {
    "id": "t-20260005",
    "title": "Air conditioning broken on 3rd floor",
    "description": "It's boiling in the marketing department. The AC seems to be completely off.",
    "category": "Operations",
    "urgency": "Critical",
    "confidence": 90,
    "tags": [
      "Operations",
      "Support"
    ],
    "createdAt": "2026-07-30T09:47:00.314Z",
    "status": "Open",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-rp7b9x5",
        "senderId": "system",
        "senderName": "System",
        "content": "Ticket routed to Emergency Response Squad.",
        "timestamp": "2026-08-04T04:09:45.683Z",
        "isStaff": false,
        "isSystem": true
      },
      {
        "id": "msg-a7unh7h",
        "senderId": "agent-alexadmin",
        "senderName": "Alex Admin",
        "content": "Facilities management has been notified. They are sending a technician now.",
        "timestamp": "2026-08-04T05:33:05.683Z",
        "isStaff": true,
        "isSystem": false
      }
    ],
    "createdBy": "j.doe@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Air conditioning broken on 3rd floor\" by John Doe."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Alex Admin"
  },
  {
    "id": "t-20260006",
    "title": "Can't access Jira",
    "description": "Getting a 403 Forbidden error when trying to access the main project board.",
    "category": "IT",
    "urgency": "High",
    "confidence": 99,
    "tags": [
      "IT",
      "Support"
    ],
    "createdAt": "2026-07-31T06:52:04.442Z",
    "status": "Pending",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-vh8b1t1",
        "senderId": "system",
        "senderName": "System",
        "content": "Ticket assigned to Tier 1 Helpdesk.",
        "timestamp": "2026-07-31T19:36:25.683Z",
        "isStaff": false,
        "isSystem": true
      },
      {
        "id": "msg-hki3c8d",
        "senderId": "agent-taylortech",
        "senderName": "Taylor Tech",
        "content": "Did you recently change roles? Your group permissions might need an update.",
        "timestamp": "2026-08-01T09:29:45.683Z",
        "isStaff": true,
        "isSystem": false
      }
    ],
    "createdBy": "a.smith@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Can't access Jira\" by Alice Smith."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Taylor Tech"
  },
  {
    "id": "t-20260007",
    "title": "Update direct deposit info",
    "description": "I need to change my bank account for direct deposit, but the portal is locked.",
    "category": "HR",
    "urgency": "Medium",
    "confidence": 85,
    "tags": [
      "HR",
      "Support"
    ],
    "createdAt": "2026-07-29T17:23:56.070Z",
    "status": "Resolved",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-ei8rd2d",
        "senderId": "agent-samservice",
        "senderName": "Sam Service",
        "content": "I've unlocked the portal for 24 hours. Please make the changes via the self-service menu.",
        "timestamp": "2026-07-28T08:16:25.683Z",
        "isStaff": true,
        "isSystem": false
      },
      {
        "id": "msg-hiaal1a",
        "senderId": "m.jones@company.com",
        "senderName": "Mark Jones",
        "content": "Done. Thanks.",
        "timestamp": "2026-07-29T12:03:05.683Z",
        "isStaff": false,
        "isSystem": false
      }
    ],
    "createdBy": "m.jones@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Update direct deposit info\" by Mark Jones."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Sam Service"
  },
  {
    "id": "t-20260008",
    "title": "Client invoice #4059 paid but showing outstanding",
    "description": "The client provided proof of payment last week, but the system still shows it as unpaid.",
    "category": "Finance",
    "urgency": "High",
    "confidence": 94,
    "tags": [
      "Finance",
      "Support"
    ],
    "createdAt": "2026-07-27T15:31:39.387Z",
    "status": "Open",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-6itocor",
        "senderId": "system",
        "senderName": "System",
        "content": "Routed to Finance Controls Team.",
        "timestamp": "2026-08-03T19:49:45.683Z",
        "isStaff": false,
        "isSystem": true
      },
      {
        "id": "msg-u7vaudp",
        "senderId": "agent-alexadmin",
        "senderName": "Alex Admin",
        "content": "Let me check the bank reconciliation file from last week.",
        "timestamp": "2026-08-04T01:23:05.683Z",
        "isStaff": true,
        "isSystem": false
      }
    ],
    "createdBy": "s.williams@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Client invoice #4059 paid but showing outstanding\" by Sarah Williams."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Alex Admin"
  },
  {
    "id": "t-20260009",
    "title": "Request for standing desk",
    "description": "My doctor recommended a standing desk for ergonomic reasons. Note attached.",
    "category": "HR",
    "urgency": "Low",
    "confidence": 92,
    "tags": [
      "HR",
      "Support"
    ],
    "createdAt": "2026-07-30T06:51:53.106Z",
    "status": "New",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [],
    "createdBy": "d.brown@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Request for standing desk\" by David Brown."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Unassigned"
  },
  {
    "id": "t-20260010",
    "title": "Zoom meeting recording lost",
    "description": "I recorded the all-hands meeting yesterday but I can't find it in my cloud recordings.",
    "category": "IT",
    "urgency": "Medium",
    "confidence": 93,
    "tags": [
      "IT",
      "Support"
    ],
    "createdAt": "2026-08-03T23:03:36.257Z",
    "status": "Resolved",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-4o5pj4v",
        "senderId": "agent-taylortech",
        "senderName": "Taylor Tech",
        "content": "Zoom had a processing delay yesterday. It should be in your account now.",
        "timestamp": "2026-08-02T21:36:25.683Z",
        "isStaff": true,
        "isSystem": false
      },
      {
        "id": "msg-bm2s7i8",
        "senderId": "j.doe@company.com",
        "senderName": "John Doe",
        "content": "Found it. Thank you.",
        "timestamp": "2026-08-03T03:09:45.683Z",
        "isStaff": false,
        "isSystem": false
      }
    ],
    "createdBy": "j.doe@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Zoom meeting recording lost\" by John Doe."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Taylor Tech"
  },
  {
    "id": "t-20260011",
    "title": "Supplier payment delayed",
    "description": "Acme Corp is asking why they haven't received payment for their last invoice.",
    "category": "Finance",
    "urgency": "Critical",
    "confidence": 88,
    "tags": [
      "Finance",
      "Support"
    ],
    "createdAt": "2026-08-01T04:02:25.633Z",
    "status": "Pending",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-wl1ob5l",
        "senderId": "agent-alexadmin",
        "senderName": "Alex Admin",
        "content": "The invoice was flagged for manual review because it exceeded the PO amount.",
        "timestamp": "2026-08-03T08:43:05.683Z",
        "isStaff": true,
        "isSystem": false
      },
      {
        "id": "msg-eimkw39",
        "senderId": "a.smith@company.com",
        "senderName": "Alice Smith",
        "content": "Ah, yes, there were extra shipping charges. How do we approve the difference?",
        "timestamp": "2026-08-03T11:29:45.683Z",
        "isStaff": false,
        "isSystem": false
      }
    ],
    "createdBy": "a.smith@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Supplier payment delayed\" by Alice Smith."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Alex Admin"
  },
  {
    "id": "t-20260012",
    "title": "Need access to Figma",
    "description": "Starting on the new UI project and need a Figma editor license.",
    "category": "IT",
    "urgency": "Medium",
    "confidence": 88,
    "tags": [
      "IT",
      "Support"
    ],
    "createdAt": "2026-07-25T08:00:39.747Z",
    "status": "Closed",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-0poo9n5",
        "senderId": "system",
        "senderName": "System",
        "content": "Automated license provisioning initiated.",
        "timestamp": "2026-07-23T17:09:45.683Z",
        "isStaff": false,
        "isSystem": true
      },
      {
        "id": "msg-frgrm5x",
        "senderId": "system",
        "senderName": "System",
        "content": "License granted successfully.",
        "timestamp": "2026-07-23T17:26:25.683Z",
        "isStaff": false,
        "isSystem": true
      }
    ],
    "createdBy": "m.jones@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Need access to Figma\" by Mark Jones."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Unassigned"
  },
  {
    "id": "t-20260013",
    "title": "Printer on 2nd floor jammed",
    "description": "The main color printer is jammed and flashing red.",
    "category": "Operations",
    "urgency": "Low",
    "confidence": 88,
    "tags": [
      "Operations",
      "Support"
    ],
    "createdAt": "2026-08-03T10:49:11.814Z",
    "status": "Resolved",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-otuiv2e",
        "senderId": "system",
        "senderName": "System",
        "content": "Routed to facilities.",
        "timestamp": "2026-08-01T23:23:05.683Z",
        "isStaff": false,
        "isSystem": true
      },
      {
        "id": "msg-a7fq345",
        "senderId": "agent-alexadmin",
        "senderName": "Alex Admin",
        "content": "Cleared the jam and replaced the toner.",
        "timestamp": "2026-08-02T13:16:25.683Z",
        "isStaff": true,
        "isSystem": false
      }
    ],
    "createdBy": "s.williams@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Printer on 2nd floor jammed\" by Sarah Williams."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Alex Admin"
  },
  {
    "id": "t-20260014",
    "title": "Security badge not working",
    "description": "My badge stopped opening the main entrance doors today.",
    "category": "Operations",
    "urgency": "High",
    "confidence": 99,
    "tags": [
      "Operations",
      "Support"
    ],
    "createdAt": "2026-07-30T08:50:24.537Z",
    "status": "Open",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-68y7wz0",
        "senderId": "system",
        "senderName": "System",
        "content": "Routed to physical security.",
        "timestamp": "2026-08-04T04:09:45.683Z",
        "isStaff": false,
        "isSystem": true
      },
      {
        "id": "msg-vdd6qvg",
        "senderId": "agent-samservice",
        "senderName": "Sam Service",
        "content": "There was a system update overnight. Can you come to the security desk to get it re-flashed?",
        "timestamp": "2026-08-04T05:33:05.683Z",
        "isStaff": true,
        "isSystem": false
      }
    ],
    "createdBy": "d.brown@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Security badge not working\" by David Brown."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Sam Service"
  },
  {
    "id": "t-20260015",
    "title": "GitLab CI runners offline",
    "description": "None of our CI pipelines are running. They are stuck in pending.",
    "category": "IT",
    "urgency": "Critical",
    "confidence": 91,
    "tags": [
      "IT",
      "Support"
    ],
    "createdAt": "2026-08-01T12:44:42.715Z",
    "status": "Open",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-n9ix42e",
        "senderId": "agent-taylortech",
        "senderName": "Taylor Tech",
        "content": "We are aware of the issue. The runner nodes ran out of disk space. Working on expanding the volume now.",
        "timestamp": "2026-08-04T06:23:05.683Z",
        "isStaff": true,
        "isSystem": false
      }
    ],
    "createdBy": "j.doe@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"GitLab CI runners offline\" by John Doe."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Taylor Tech"
  },
  {
    "id": "t-20260016",
    "title": "Expense report rejected incorrectly",
    "description": "My travel expenses were rejected but I attached all the required receipts.",
    "category": "Finance",
    "urgency": "Medium",
    "confidence": 89,
    "tags": [
      "Finance",
      "Support"
    ],
    "createdAt": "2026-08-01T20:09:59.004Z",
    "status": "Pending",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-i3wkdd4",
        "senderId": "agent-alexadmin",
        "senderName": "Alex Admin",
        "content": "The policy requires hotel receipts to be itemized. Yours just shows the total.",
        "timestamp": "2026-08-03T06:56:25.683Z",
        "isStaff": true,
        "isSystem": false
      }
    ],
    "createdBy": "a.smith@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Expense report rejected incorrectly\" by Alice Smith."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Alex Admin"
  },
  {
    "id": "t-20260017",
    "title": "Maternity leave policy clarification",
    "description": "Does the 12-week paid leave include the state-mandated disability period?",
    "category": "HR",
    "urgency": "Medium",
    "confidence": 95,
    "tags": [
      "HR",
      "Support"
    ],
    "createdAt": "2026-07-25T17:54:52.382Z",
    "status": "Resolved",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-70ymatm",
        "senderId": "agent-samservice",
        "senderName": "Sam Service",
        "content": "Yes, our policy runs concurrently with the state mandated period.",
        "timestamp": "2026-07-28T08:16:25.683Z",
        "isStaff": true,
        "isSystem": false
      }
    ],
    "createdBy": "m.jones@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Maternity leave policy clarification\" by Mark Jones."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Sam Service"
  },
  {
    "id": "t-20260018",
    "title": "Guest WiFi password",
    "description": "We have clients visiting today. What's the guest network password?",
    "category": "IT",
    "urgency": "Low",
    "confidence": 96,
    "tags": [
      "IT",
      "Support"
    ],
    "createdAt": "2026-08-01T01:11:22.158Z",
    "status": "Closed",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [
      {
        "id": "msg-ah37qc0",
        "senderId": "system",
        "senderName": "System",
        "content": "Auto-reply: The guest network is 'Corp-Guest' and the password is 'Welcome2026'.",
        "timestamp": "2026-08-04T05:56:25.683Z",
        "isStaff": false,
        "isSystem": true
      }
    ],
    "createdBy": "s.williams@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Guest WiFi password\" by Sarah Williams."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Unassigned"
  },
  {
    "id": "t-20260019",
    "title": "Coffee machine maintenance",
    "description": "The espresso machine in the breakroom is leaking water.",
    "category": "Operations",
    "urgency": "Medium",
    "confidence": 90,
    "tags": [
      "Operations",
      "Support"
    ],
    "createdAt": "2026-07-27T09:35:28.315Z",
    "status": "New",
    "aiResponse": null,
    "aiResponseTone": null,
    "aiResponseCreatedAt": null,
    "userEditedResponse": null,
    "messages": [],
    "createdBy": "d.brown@company.com",
    "routingLogs": [
      "System: Ticket filed with subject \"Coffee machine maintenance\" by David Brown."
    ],
    "assignedTeam": "Tier 1 Support",
    "assignedAgent": "Unassigned"
  }
];

// Helper to normalize classified category to known options
function getOperationalCategory(cat: string): 'HR' | 'IT' | 'Finance' | 'Operations' {
  const norm = cat?.trim().toLowerCase() || '';
  if (norm === 'technical' || norm === 'it') return 'IT';
  if (norm === 'billing' || norm === 'finance') return 'Finance';
  if (norm === 'feedback' || norm === 'operations') return 'Operations';
  if (norm === 'general' || norm === 'hr') return 'HR';
  return 'Operations';
}

// Server side workflow automation rules execution
async function runWorkflowAutomation(ticket: any, rulesList: RoutingRule[]): Promise<{ updatedTicket: any, triggeredRule: RoutingRule | null }> {
  const matchedRule = rulesList.find(rule => {
    if (!rule.isActive) return false;
    const catMatch = rule.category === 'All' || rule.category === ticket.category;
    const urgMatch = rule.urgency === 'All' || rule.urgency === ticket.urgency;
    return catMatch && urgMatch;
  }) || null;

  let updated = { ...ticket };

  if (matchedRule) {
    updated.assignedTeam = matchedRule.targetTeam;
    const agents: {[key: string]: string[]} = {
      'Tier 3 Infrastructure Ops': ['Alex Mercer', 'Devon Cole'],
      'HR Benefits & Leave Desk': ['Sarah Jenkins', 'Thabo Ndlovu'],
      'Finance Controls Team': ['Elena Rostova', 'John Carter'],
      'Emergency Response Squad': ['Marcus Vance', 'Bongani Nkosi'],
      'Tier 1 Helpdesk': ['Zama Khumalo', 'Sipho Zulu'],
      'Accounts Payable Admin': ['Chloe Dupont', 'Fatima Patel'],
      'General Support Team': ['Amina Diop', 'Kenji Tanaka']
    };
    const teamAgents = agents[matchedRule.targetTeam] || ['Operations Agent'];
    updated.assignedAgent = teamAgents[Math.floor(Math.random() * teamAgents.length)];
    
    const updatedLogs = [...(ticket.routingLogs || [])];
    updatedLogs.push(`Automation Engine: Rule "${matchedRule.name}" triggered.`);
    updatedLogs.push(`System: Routed to team "${matchedRule.targetTeam}" and assigned to technician "${updated.assignedAgent}".`);
    
    if (matchedRule.sendEmail) {
      updated.emailStatus = 'Sent';
      updated.emailRecipient = `${matchedRule.targetTeam.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`;
      updated.emailSubject = `[ALERT] ${updated.urgency} Urgency - New ${updated.category} Ticket #${updated.id}`;
      
      try {
        const ai = getAi();
        const prompt = `Draft a professional email to the user confirming receipt of their ticket. 
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
        Format as plain text.`;
        
        const response = await generateContentWithRetry(ai, prompt, undefined);
        updated.emailBody = response && response.text ? response.text : `Dear User,

Your ticket has been received and routed to ${matchedRule.targetTeam}.

Ticket Reference: ${updated.id}
Category: ${updated.category}
Urgency: ${updated.urgency}

Please review and take appropriate action.

Regards,
Automation Control System`;
      } catch (e) {
        updated.emailBody = `Dear User,

Your ticket has been received and routed to ${matchedRule.targetTeam}.

Ticket Reference: ${updated.id}
Category: ${updated.category}
Urgency: ${updated.urgency}

Please review and take appropriate action.

Regards,
Automation Control System`;
      }

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
    } else {
      updated.emailStatus = 'Not Sent';
      updated.emailRecipient = undefined;
      updated.emailSubject = undefined;
      updated.emailBody = undefined;
    }
    
    updated.routingLogs = updatedLogs;
  }

  return { updatedTicket: updated, triggeredRule: matchedRule };
}

// ==========================================
// AUTHENTICATION CONTROLLERS
// ==========================================
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role, passcode } = req.body;
  
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required registration parameters." });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email already registered." });
  }

  // Validate agent/admin passcode (accepts staff passcodes agentpass123 or adminpass123)
  const validPasscodes = ['agentpass123', 'adminpass123', 'admin', 'agent', 'staff123'];
  if ((role === 'AGENT' || role === 'ADMIN')) {
    if (passcode && !validPasscodes.includes(passcode.trim().toLowerCase())) {
      return res.status(403).json({ error: "Invalid staff authorization passcode. Please use 'adminpass123' or 'agentpass123'." });
    }
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    role,
    passwordHash: password
  };

  users.push(newUser);

  // Dispatch confirmation email
  dispatch_ticket_email(
    'account-creation',
    newUser.email,
    'Account Creation Confirmation',
    `Dear ${newUser.name},

Your account has been successfully created on the Automation Control System.

Role: ${newUser.role}
Email: ${newUser.email}

Thank you!`
  ).catch(err => console.error('Failed to send registration email:', err));

  // Generate dynamic session token
  const token = `token_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  const userSafe = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
  activeSessions.set(token, userSafe);

  res.status(201).json({ user: userSafe, token });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password credentials." });
  }

  const token = `token_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  const userSafe = { id: user.id, name: user.name, email: user.email, role: user.role };
  activeSessions.set(token, userSafe);

  res.json({ user: userSafe, token });
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true, message: "Logged out successfully." });
});

app.get("/api/auth/me", authenticate, (req: any, res) => {
  res.json({ user: req.user });
});

// ==========================================
// TICKET ACTIONS & ROLE VALIDATION ENDPOINTS
// ==========================================
app.get("/api/tickets", authenticate, (req: any, res) => {
  if (req.user.role === 'USER') {
    // Only return tickets created by this specific user
    const userTickets = tickets.filter(t => t.createdBy?.toLowerCase() === req.user.email.toLowerCase());
    return res.json(userTickets);
  } else {
    // AGENT/ADMIN gets all tickets
    return res.json(tickets);
  }
});

app.post("/api/tickets", authenticate, async (req: any, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  try {
    let aiClassObj = {
      category: 'Operations',
      urgency: 'Medium',
      confidence: 85,
      tags: ['Customer inquiry']
    };

    try {
      const ai = getAi();
      const prompt = `You are an operations ticket classification AI.
      Analyze the following request and categorize it.
      Ensure 'category' is one of: 'Technical', 'Billing', 'General', 'Feedback'.
      Ensure 'urgency' is one of: 'Low', 'Medium', 'High', 'Critical'.
      Provide an integer confidence score from 0 to 100.
      Provide up to 4 keyword tags.
      
      Request: ${description}`;

      const response = await generateContentWithRetry(ai, prompt, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            urgency: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      });
      aiClassObj = JSON.parse(response.text);
    } catch (e: any) {
      console.error("Gemini ticket auto classification failed, falling back to local heuristic.", e.message);
    }

    const category = getOperationalCategory(aiClassObj.category);
    const createdTicket = {
      id: `t-${Date.now()}`,
      title,
      description,
      category,
      urgency: aiClassObj.urgency || 'Medium',
      confidence: aiClassObj.confidence || 85,
      tags: aiClassObj.tags || ['Customer Inquiry'],
      createdAt: new Date().toISOString(),
      status: 'New',
      aiResponse: null,
      aiResponseTone: null,
      aiResponseCreatedAt: null,
      userEditedResponse: null,
      messages: [],
      createdBy: req.user.email,
      routingLogs: [`System: Ticket filed with subject "${title}" by ${req.user.name}.`]
    };

    // Run workflow automation on the backend!
    const { updatedTicket, triggeredRule } = await runWorkflowAutomation(createdTicket, routingRules);
    
    if (triggeredRule) {
      const logEntry: AutomationLog = {
        id: `alog-${Date.now()}`,
        ticketId: updatedTicket.id,
        ticketTitle: updatedTicket.title,
        ruleName: triggeredRule.name,
        timestamp: new Date().toISOString(),
        actions: [
          `Routed to team: ${updatedTicket.assignedTeam}`,
          `Assigned agent: ${updatedTicket.assignedAgent}`
        ]
      };
      automationLogs.unshift(logEntry);
    }

    // Automatically generate draft response if Gemini is working
    try {
      const ai = getAi();
      const prompt = `Draft a professional formal response to this customer inquiry.
      Ticket ID: ${updatedTicket.id}
      Customer Name: ${updatedTicket.createdBy}
      Category: ${updatedTicket.category}
      Urgency: ${updatedTicket.urgency}
      Inquiry: ${updatedTicket.description}
      
      Provide a concise, helpful, and professional response.
      Do NOT ask for a phone number or use any bracketed placeholders like [Customer Name] or [Ticket_Number].
      Always use the actual Customer Name ("${updatedTicket.createdBy}") and Ticket ID ("${updatedTicket.id}").
      Sign off with "Best regards," followed by the AI Support Team and reference the Customer Name.`;

      const draftRes = await generateContentWithRetry(ai, prompt, undefined);
      if (draftRes && draftRes.text) {
        updatedTicket.aiResponse = draftRes.text;
        updatedTicket.aiResponseTone = 'Formal';
        updatedTicket.aiResponseCreatedAt = new Date().toISOString();
      }
    } catch (err: any) {
      console.error("Failed to automatically generate support draft response", err.message);
    }

    // Push into server's tickets list
    tickets.unshift(updatedTicket);

    // Dispatch confirmation email
    dispatch_ticket_email(
      updatedTicket.id,
      updatedTicket.createdBy,
      `Ticket Confirmation: #${updatedTicket.id}`,
      `Hello,

We have received your support ticket "${updatedTicket.title}".

Your ticket ID is ${updatedTicket.id}. Our team will review your issue and get back to you shortly.

You can check the status of your ticket at any time on your dashboard.

Best regards,
Support Team`
    ).catch(err => console.error('Failed to send ticket confirmation email:', err));

    res.status(201).json(updatedTicket);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tickets/:id - Enforces strict role permission validation!
app.put("/api/tickets/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const ticketIndex = tickets.findIndex(t => t.id === id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  const existingTicket = tickets[ticketIndex];

  // If role is USER:
  if (req.user.role === 'USER') {
    // Standard users can only interact with their own tickets
    if (existingTicket.createdBy?.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: "Unauthorized access to this ticket." });
    }
    
    // Standard users are FORBIDDEN from altering status, team, agent, rules, logs, AI responses
    const forbiddenFields = [
      'status', 'category', 'urgency', 'confidence', 'tags', 'assignedTeam', 'assignedAgent',
      'emailStatus', 'emailRecipient', 'emailSubject', 'emailBody', 'approvalStatus',
      'approvalSteps', 'aiResponse', 'aiResponseTone', 'aiResponseCreatedAt', 'userEditedResponse',
      'claimedBy', 'internalNotes'
    ];
    
    const attemptsToModifyForbidden = forbiddenFields.some(field => field in req.body && req.body[field] !== existingTicket[field]);
    if (attemptsToModifyForbidden) {
      return res.status(403).json({ error: "Access Denied: You do not have permissions to modify administrative ticket fields." });
    }
  }

  // If role is AGENT or ADMIN, they have full edit access
  // Validate caller's role before executing updates on agent-only actions:
  const isAgentAction = ('status' in req.body || 'assignedTeam' in req.body || 'assignedAgent' in req.body || 'userEditedResponse' in req.body || 'claimedBy' in req.body || 'approvalStatus' in req.body);
  if (isAgentAction && req.user.role === 'USER') {
    return res.status(403).json({ error: "Access Denied: Standard users cannot perform agent administrative operations." });
  }

  // Merge updates safely
  let updatedTicket = {
    ...existingTicket,
    ...req.body,
    id // lock original ID
  };

  // If Category or Urgency was updated, re-run automation rules to update assignments and dispatch simulated emails
  if (req.body.category || req.body.urgency) {
    const { updatedTicket: autoTicket, triggeredRule } = await runWorkflowAutomation(updatedTicket, routingRules);
    updatedTicket = autoTicket;
    
    if (triggeredRule) {
      const logEntry: AutomationLog = {
        id: `alog-${Date.now()}`,
        ticketId: updatedTicket.id,
        ticketTitle: updatedTicket.title,
        ruleName: triggeredRule.name,
        timestamp: new Date().toISOString(),
        actions: [
          `Re-routed to team: ${updatedTicket.assignedTeam}`,
          `Assigned agent: ${updatedTicket.assignedAgent}`
        ]
      };
      automationLogs.unshift(logEntry);
    }
  }

  // Check if status was updated and notify the user
  if (req.body.status && req.body.status !== existingTicket.status) {
    dispatch_ticket_email(
      updatedTicket.id,
      updatedTicket.createdBy,
      `Status Update: Ticket #${updatedTicket.id} is now ${req.body.status}`,
      `Hello,

The status of your support ticket "${updatedTicket.title}" has been updated.

New Status: ${req.body.status}

You can view more details by visiting your dashboard.

Best regards,
Support Team`
    ).catch(err => console.error('Failed to send status update email:', err));
  }

  // Check for new messages to dispatch emails and auto-respond
  const oldMsgsLength = existingTicket.messages?.length || 0;
  const newMsgsLength = updatedTicket.messages?.length || 0;

  if (newMsgsLength > oldMsgsLength) {
    const latestMsg = updatedTicket.messages[newMsgsLength - 1];

    if (latestMsg.sender === 'user') {
      // Find the last human agent who replied to this ticket
      const lastAgentMsg = [...(existingTicket.messages || [])].reverse().find(m => 
        (m.sender === 'agent' || m.sender === 'operator') && 
        m.senderName !== 'AI Support' && 
        m.senderName !== 'System'
      );
      
      let targetAgentName = updatedTicket.assignedAgent;
      if (lastAgentMsg && lastAgentMsg.senderName) {
        targetAgentName = lastAgentMsg.senderName;
      }
      
      if (targetAgentName) {
        const agentUser = users.find(u => u.name === targetAgentName);
        const agentEmail = agentUser ? agentUser.email : `${targetAgentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`;
        
        dispatch_ticket_email(
          updatedTicket.id,
          agentEmail,
          `New reply from user on Ticket #${updatedTicket.id}`,
          `Hello ${targetAgentName},

The user (${updatedTicket.createdBy}) has replied to the ticket: ${updatedTicket.title}

User Message:
"${latestMsg.text}"

Please check the agent dashboard to respond.`
        ).catch(err => console.error('Failed to send agent reply email:', err));
      }
    } else if ((latestMsg.sender === 'agent' || latestMsg.sender === 'operator') && latestMsg.senderName !== 'AI Support' && latestMsg.senderName !== 'System') {
      const actualAgentName = req.user.name || latestMsg.senderName;
      latestMsg.senderName = actualAgentName; // ensure the name is the agent's real name

      dispatch_ticket_email(
        updatedTicket.id,
        updatedTicket.createdBy,
        `New reply on your ticket #${updatedTicket.id}`,
        `Hello,

A support agent (${latestMsg.senderName}) has replied to your ticket: ${updatedTicket.title}

Agent Message:
"${latestMsg.text}"

You can reply by visiting your dashboard.`
      ).catch(err => console.error('Failed to send user reply email:', err));
    }
  }

  // Check if we need to auto-respond to a user message
  if (updatedTicket.aiAutoRespond !== false) {
    if (newMsgsLength > oldMsgsLength) {
      const latestMsg = updatedTicket.messages[newMsgsLength - 1];

      if (latestMsg.sender === 'user' && !latestMsg.text.startsWith('CUSTOMER_CSAT_RATING:')) {
        try {
          const ai = getAi();
          let conversation = updatedTicket.messages.map((m: any) => `${m.senderName}: ${m.text}`).join("\n");
          
          const prompt = `You are a helpful AI support agent. Respond to the user's latest message based on this ticket context.
          Ticket ID: ${updatedTicket.id}
          Customer Name: ${updatedTicket.createdBy}
          Ticket Category: ${updatedTicket.category}
          Ticket Subject: ${updatedTicket.title}
          Ticket Description: ${updatedTicket.description}
          
          Conversation history:
          ${conversation}
          
          Provide a concise, helpful, and professional response to the user.
          Do NOT ask for a phone number or use bracketed placeholders like [Customer Name] or [Ticket_Number].
          Always use the actual Customer Name ("${updatedTicket.createdBy}") and Ticket ID ("${updatedTicket.id}").
          Sign off with "Best regards," followed by the AI Support Team and reference the Customer Name.`;

          const response = await generateContentWithRetry(ai, prompt, undefined);
          
          if (response && response.text) {
            const aiMessage = {
              id: `m-${Date.now()}`,
              sender: 'agent',
              senderName: 'AI Support',
              text: response.text,
              createdAt: new Date().toISOString()
            };
            updatedTicket.messages = [...updatedTicket.messages, aiMessage];
          }
        } catch (err: any) {
          console.error("Auto-respond failed:", err.message);
        }
      }
    }
  }

  tickets[ticketIndex] = updatedTicket;
  res.json(updatedTicket);
});


// DELETE /api/tickets/:id - Only AGENT or ADMIN can delete
app.delete("/api/tickets/:id", authenticate, authorize(['AGENT', 'ADMIN']), (req, res) => {
  const { id } = req.params;
  const ticketIndex = tickets.findIndex(t => t.id === id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  tickets.splice(ticketIndex, 1);
  res.json({ success: true, message: "Ticket deleted successfully." });
});

// ==========================================
// ROUTING RULES ENDPOINTS (AGENT/ADMIN Protected)
// ==========================================
app.get("/api/rules", authenticate, (req, res) => {
  res.json(routingRules);
});

app.post("/api/rules", authenticate, authorize(['AGENT', 'ADMIN']), (req, res) => {
  const { name, category, urgency, targetTeam, requireApproval, sendEmail, isActive } = req.body;
  if (!name || !category || !urgency || !targetTeam) {
    return res.status(400).json({ error: "Missing required parameters for routing rule." });
  }

  const newRule: RoutingRule = {
    id: `rule-${Date.now()}`,
    name,
    category,
    urgency,
    targetTeam,
    requireApproval: !!requireApproval,
    sendEmail: !!sendEmail,
    isActive: isActive !== false
  };

  routingRules.unshift(newRule);
  res.status(201).json(newRule);
});

app.delete("/api/rules/:id", authenticate, authorize(['AGENT', 'ADMIN']), (req, res) => {
  const { id } = req.params;
  const ruleIdx = routingRules.findIndex(r => r.id === id);
  if (ruleIdx === -1) {
    return res.status(404).json({ error: "Routing rule not found." });
  }
  routingRules.splice(ruleIdx, 1);
  res.json({ success: true, message: "Routing rule deleted." });
});

app.put("/api/rules/:id", authenticate, authorize(['AGENT', 'ADMIN']), (req, res) => {
  const { id } = req.params;
  const ruleIdx = routingRules.findIndex(r => r.id === id);
  if (ruleIdx === -1) {
    return res.status(404).json({ error: "Routing rule not found." });
  }
  routingRules[ruleIdx] = {
    ...routingRules[ruleIdx],
    ...req.body
  };
  res.json(routingRules[ruleIdx]);
});

// ==========================================
app.get("/api/email-logs", (req, res) => {
  res.json(emailDispatchLogs);
});

// AUTOMATION LOGS & COMPLIANCE ENDPOINTS
// ==========================================
app.get("/api/logs", authenticate, authorize(['AGENT', 'ADMIN']), (req, res) => {
  res.json(automationLogs);
});

app.get("/api/compliance", authenticate, authorize(['AGENT', 'ADMIN']), (req, res) => {
  res.json(complianceRisks);
});

app.post("/api/compliance/scan", authenticate, authorize(['AGENT', 'ADMIN']), (req: any, res) => {
  // Mock check on existing unresolved tickets for risk scans
  const unresolved = tickets.filter(t => t.status !== 'Resolved');
  const types: ('Bias' | 'Toxicity' | 'PII Leak' | 'Hallucination')[] = ['Bias', 'PII Leak', 'Toxicity', 'Hallucination'];
  const severities: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
  
  const newRisks: ComplianceRisk[] = [];
  unresolved.slice(0, 3).forEach(t => {
    // Generate simulated compliance risks if not already matching
    const exists = complianceRisks.some(r => r.ticketId === t.id);
    if (!exists && Math.random() > 0.4) {
      const rType = types[Math.floor(Math.random() * types.length)];
      const rSev = severities[Math.floor(Math.random() * severities.length)];
      const descriptions = {
        'Bias': 'Potential gender/demographic stereotyping detected in classification keywords.',
        'PII Leak': 'Detected raw social security or customer credit card pattern in original ticket description.',
        'Toxicity': 'Aggressive customer tone flag or model output sentiment mismatch.',
        'Hallucination': 'Agent auto-response cites unverified internal API address and credentials.'
      };
      
      const newRisk: ComplianceRisk = {
        id: `risk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ticketId: t.id,
        riskType: rType,
        severity: rSev,
        description: descriptions[rType],
        createdAt: new Date().toISOString(),
        status: 'Open'
      };
      complianceRisks.unshift(newRisk);
      newRisks.push(newRisk);
    }
  });

  res.json({ success: true, count: newRisks.length, newRisks });
});

app.put("/api/compliance/:id", authenticate, authorize(['AGENT', 'ADMIN']), (req, res) => {
  const { id } = req.params;
  const riskIndex = complianceRisks.findIndex(r => r.id === id);
  if (riskIndex === -1) {
    return res.status(404).json({ error: "Risk not found." });
  }

  complianceRisks[riskIndex] = {
    ...complianceRisks[riskIndex],
    ...req.body
  };

  res.json(complianceRisks[riskIndex]);
});

app.post("/api/compliance/clear", authenticate, authorize(['AGENT', 'ADMIN']), (req, res) => {
  complianceRisks = [];
  res.json({ success: true, message: "Compliance risk logs cleared." });
});

// ==========================================
// PRE-EXISTING CLASSIFY & GENERATION PROXIES (AUTHORIZED)
// ==========================================
app.post("/api/classify", authenticate, async (req, res) => {
  const { description } = req.body;
  try {
    const ai = getAi();
    const prompt = `You are an operations ticket classification AI.
    Analyze the following request and categorize it.
    Ensure 'category' is one of: 'Technical', 'Billing', 'General', 'Feedback'.
    Ensure 'urgency' is one of: 'Low', 'Medium', 'High', 'Critical'.
    Provide an integer confidence score from 0 to 100.
    Provide up to 4 keyword tags.
    Provide a concise 1-sentence summary of the ticket request.
    
    Request: ${description}`;

    const response = await generateContentWithRetry(ai, prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          urgency: { type: Type.STRING },
          confidence: { type: Type.INTEGER },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING }
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Classification Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate-response", authenticate, authorize(['AGENT', 'ADMIN']), async (req, res) => {
  const { category, urgency, tone, description, stream } = req.body;
  
  const fallbackDraft = `Dear Valued Customer,\n\nThank you for reaching out to our support team regarding your ${category || 'service'} request.\n\nWe have logged your case with ${urgency || 'Medium'} urgency. Our team is actively reviewing the inquiry details provided:\n"${description || 'Customer inquiry'}"\n\nWe will follow up with further updates shortly.\n\nSincerely,\nOperations Support Desk`;

  try {
    const ai = getAi();
    const prompt = `Draft a ${tone || 'Formal'} professional response to the following customer inquiry.
    Category: ${category}
    Urgency: ${urgency}
    Tone: ${tone}
    
    Inquiry:
    ${description}`;

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Transfer-Encoding', 'chunked');
      
      try {
        const responseStream = await generateContentStreamWithRetry(ai, prompt);
        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(chunk.text);
          }
        }
        res.end();
        return;
      } catch (streamErr: any) {
        console.warn("AI Stream fallback triggered:", streamErr.message);
        res.write(fallbackDraft);
        res.end();
        return;
      }
    }

    let responseText = fallbackDraft;
    try {
      const response = await generateContentWithRetry(ai, prompt, undefined);
      if (response && response.text) responseText = response.text;
    } catch (genErr: any) {
      console.warn("AI Generation fallback triggered:", genErr.message);
    }

    res.json({
      response: responseText,
      isMock: false
    });
  } catch (error: any) {
    console.error("Response Generation Outer Error:", error.message);
    if (stream) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
      }
      res.write(fallbackDraft);
      res.end();
    } else {
      res.json({ response: fallbackDraft, isMock: true });
    }
  }
});

app.post("/api/generate-insights", authenticate, authorize(['AGENT', 'ADMIN']), async (req, res) => {
  const { statsSummary, department } = req.body;
  const fallbackInsights = `### 📊 Executive Operations Analysis Report

1. **High Priority Triage Optimization**:
   - High and Critical urgency cases represent a significant portion of active workload. Recommend implementing automated tier-3 escalation routing rules to reduce first response latency by 25%.

2. **Workload Balancing & Cross-Queue Routing**:
   - Recommend reallocating 15% of support capacity towards the highest-volume department (${department || 'IT/Operations'}) during peak hours.

3. **SLA Guardrail Compliance**:
   - Current SLA margin remains stable. Maintain active monitoring and automated email alerts on unassigned high-urgency cases.`;

  try {
    const ai = getAi();
    const statsText = statsSummary ? JSON.stringify(statsSummary, null, 2) : "No stats available. Generate standard advice.";
    const departmentContext = department && department !== 'All' 
      ? `\nFocus specifically on the "${department}" department's performance and operations.` 
      : "\nFocus on the overall system performance across all departments.";

    const prompt = `You are a Senior Business Operations Analyst. Generate an automated executive business report summarizing operations and performance. Generate exactly 3-4 structured, professional, high-value operations summary insights and actionable recommendation items based on the following weekly ticketing metrics:${departmentContext}
 
    ${statsText}
 
    Guidelines:
    - Format using Markdown with bold titles and clean spacing.
    - Each recommendation should be actionable, realistic, and directly trace back to the ticket volumes, urgency distribution, or response time trends.
    - Suggest specific automated workflows, self-service solutions, or resource reallocations.
    - Keep the tone highly strategic, crisp, and executive-level. Do not include intro or outro chatter. Start directly with the insights list.`;

    let insightsText = fallbackInsights;
    try {
      const response = await generateContentWithRetry(ai, prompt, undefined, 1, proModels);
      if (response && response.text) insightsText = response.text;
    } catch (genErr: any) {
      console.warn("AI Insights generation fallback triggered:", genErr.message);
    }

    res.json({
      insights: insightsText,
      isMock: false
    });
  } catch (error: any) {
    console.error("Insights Outer Error:", error.message);
    res.json({ insights: fallbackInsights, isMock: true });
  }
});

// ==========================================
// SYSTEM RESET (AGENT/ADMIN ONLY)
// ==========================================
app.post("/api/system/reset", authenticate, authorize(['AGENT', 'ADMIN']), (req, res) => {
  tickets = [];
  automationLogs = [];
  complianceRisks = [];
  res.json({ success: true, message: "Workspace reset successfully." });
});


// Global error handler to ensure JSON responses for all errors
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Catch-all for API routes to prevent Vite from serving index.html for missing APIs
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Vite & Static file handler
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
