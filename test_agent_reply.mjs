import fetch from 'node-fetch';

async function test() {
  // 1. Register a user
  let res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: 'test_user@gmail.com', password: '123', role: 'USER' })
  });
  let data = await res.json();
  const userToken = data.token;

  // 2. Register an agent
  res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Agent', email: 'test_agent@company.com', password: '123', role: 'AGENT', passcode: 'agentpass123' })
  });
  data = await res.json();
  const agentToken = data.token;

  // 3. User creates a ticket
  res = await fetch('http://localhost:3000/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ title: 'Help with login', description: 'I cannot login to my account.' })
  });
  data = await res.json();
  const ticketId = data.id;
  console.log("Created ticket:", ticketId);

  // 4. Agent replies
  const messages = data.messages || [];
  messages.push({
    id: 'm-123',
    sender: 'operator',
    senderName: 'Operator Desk',
    text: 'Please reset your password.',
    createdAt: new Date().toISOString()
  });

  res = await fetch(`http://localhost:3000/api/tickets/${ticketId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${agentToken}` },
    body: JSON.stringify({ messages })
  });
  const putData = await res.json();
  console.log("Agent replied. Ticket ID:", putData.id);

  // Wait a bit for email dispatch
  await new Promise(r => setTimeout(r, 2000));

  // 5. Fetch email logs
  res = await fetch('http://localhost:3000/api/email-logs');
  const logs = await res.json();
  console.log("Email logs:", JSON.stringify(logs, null, 2));
}

test().catch(console.error);
