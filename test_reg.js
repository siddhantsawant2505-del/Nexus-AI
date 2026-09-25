fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: `tester_${Date.now()}@local.dev`,
    password: 'Password123',
    codename: `AGENT_${Date.now()}`
  })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)));
