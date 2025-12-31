// Very small in-memory auth service for demo purposes
const users = [
  { id: 1, username: 'admin', password: 'admin', role: 'admin', name: 'Administrator' },
  { id: 2, username: 'user', password: 'user', role: 'user', name: 'Regular User' },
];

let current = null;
const pendingSms = {}; // phone -> code

export async function login(username, password) {
  const u = users.find((x) => x.username === username && x.password === password);
  if (u) {
    current = { id: u.id, username: u.username, role: u.role, name: u.name };
    return new Promise((res) => setTimeout(() => res(current), 150));
  }
  return new Promise((res, rej) => setTimeout(() => rej(new Error('Invalid credentials')), 150));
}

export async function logout() {
  current = null;
  return new Promise((res) => setTimeout(() => res(true), 80));
}

export function getCurrent() { return current; }

export async function register(username, password, name, phone, email, addressObj) {
  if (users.find((u) => u.username === username)) {
    return new Promise((res, rej) => setTimeout(() => rej(new Error('User already exists')), 120));
  }
  const id = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const role = username === 'admin' && password === 'admin' ? 'admin' : 'user';
  const u = {
    id,
    username,
    password,
    role,
    name: name || username,
    phone: phone || '',
    email: email || '',
    address: addressObj || { street: '', city: '', state: '', postalCode: '', country: '' },
  };
  users.push(u);
  current = { id: u.id, username: u.username, role: u.role, name: u.name };
  return new Promise((res) => setTimeout(() => res(current), 150));
}

export async function sendSmsCode(phone) {
  // simulate sending SMS, store a 4-digit code
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  pendingSms[phone] = code;
  // in a real app we'd send the SMS here
  return new Promise((res) => setTimeout(() => res({ success: true, code }), 150));
}

export async function verifySmsCode(phone, code) {
  const expected = pendingSms[phone];
  if (expected && expected === String(code)) {
    delete pendingSms[phone];
    return new Promise((res) => setTimeout(() => res({ verified: true }), 120));
  }
  return new Promise((res, rej) => setTimeout(() => rej(new Error('Invalid code')), 120));
}
