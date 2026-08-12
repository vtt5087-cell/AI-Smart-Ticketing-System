async function test() {
  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'test', email: 'test3@test.com', password: 'password', role: 'ADMIN', passcode: 'adminpass123' })
  });
  const data = await res.json();
  const token = data.token;
  
  const endpoints = ['/api/tickets', '/api/rules', '/api/logs', '/api/compliance'];
  for (const ep of endpoints) {
    const r = await fetch(`http://localhost:3000${ep}`, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log(ep, r.status, (await r.text()).slice(0, 50));
  }
}
test();
