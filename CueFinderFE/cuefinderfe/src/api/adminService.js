// Simple in-memory admin service
let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', banned: false },
  { id: 2, name: 'Bob', email: 'bob@example.com', banned: false },
];

export async function getUsers() {
  return new Promise((res) => setTimeout(() => res([...users]), 120));
}

export async function banUser(id) {
  const u = users.find((x) => x.id === id);
  if (u) u.banned = true;
  return new Promise((res) => setTimeout(() => res(u || null), 80));
}

export async function unbanUser(id) {
  const u = users.find((x) => x.id === id);
  if (u) u.banned = false;
  return new Promise((res) => setTimeout(() => res(u || null), 80));
}

export async function createUser(user) {
  const id = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const item = { ...user, id, banned: false };
  users.push(item);
  return new Promise((res) => setTimeout(() => res(item), 80));
}
