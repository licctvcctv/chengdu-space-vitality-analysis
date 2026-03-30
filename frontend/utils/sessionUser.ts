import { User, userStorage } from './userStorage';

const safeParse = (raw: string | null): unknown => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const isValidUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'number' &&
    typeof record.username === 'string' &&
    typeof record.role === 'string' &&
    typeof record.status === 'boolean'
  );
};

export const persistSessionUser = (user: User) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('currentUserId', String(user.id));
  localStorage.setItem('lastLoginUsername', user.username);
  localStorage.setItem('userRole', user.role);
  localStorage.setItem('isLoggedIn', 'true');
};

export const resolveSessionUser = (): User | null => {
  const currentUserRaw = safeParse(localStorage.getItem('currentUser'));
  if (isValidUser(currentUserRaw) && currentUserRaw.status) {
    return currentUserRaw;
  }

  const allUsers = userStorage.getUsers();
  const lastLoginUsername = localStorage.getItem('lastLoginUsername') || '';
  const currentUserId = Number(localStorage.getItem('currentUserId'));
  const role = localStorage.getItem('userRole');

  const byUsername = allUsers.find((user) => user.username === lastLoginUsername && user.status);
  const byId = Number.isFinite(currentUserId)
    ? allUsers.find((user) => user.id === currentUserId && user.status)
    : undefined;
  const byRole =
    role === 'admin' || role === 'user'
      ? allUsers.find((user) => user.role === role && user.status)
      : undefined;

  const recoveredUser = byUsername || byId || byRole || null;
  if (recoveredUser) {
    persistSessionUser(recoveredUser);
  }

  return recoveredUser;
};
