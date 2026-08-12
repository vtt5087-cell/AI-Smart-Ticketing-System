async function test() {
  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User Test', email: 'user@test.com', password: 'password', role: 'USER' })
  });
  const data = await res.json();
  const token = data.token;
  
  const createRes = await fetch('http://localhost:3000/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ title: 'Test Ticket', description: 'Testing user reply' })
  });
  const newTicket = await createRes.json();
  console.log("Created:", newTicket.id);

  const updateRes = await fetch(`http://localhost:3000/api/tickets/${newTicket.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ messages: [{ id: 'm-1', text: 'Reply', sender: 'user', senderName: 'User Test', createdAt: new Date().toISOString() }] })
  });
  console.log("Update status:", updateRes.status);
  console.log("Update response:", await updateRes.text());
}
test();
