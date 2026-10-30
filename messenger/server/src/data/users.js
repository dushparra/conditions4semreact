export const users = [
  {
    id: "u1",
    nickname: "Alex",
    phone: "+79990000000",
    bio: "Student",
    password: "123456"
  },
  {
    id: "u2",
    nickname: "Maria",
    phone: "+79990000001",
    bio: "QA trainee",
    password: "123456"
  },
  {
    id: "u3",
    nickname: "Sam",
    phone: "+79990000002",
    bio: "Frontend learner",
    password: "123456"
  }
];

const activeTokens = new Map();

export function findUserByPhone(phone) {
  return users.find((user) => user.phone === phone);
}

export function getUserById(id) {
  return users.find((user) => user.id === id);
}

export function issueToken(userId) {
  const token = `token-${userId}`;
  activeTokens.set(token, userId);
  return token;
}

export function getUserIdByToken(token) {
  return activeTokens.get(token);
}
