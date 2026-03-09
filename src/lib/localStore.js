const PREFIX = 'app_data_';

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function getAll(entityName) {
  try {
    const data = localStorage.getItem(PREFIX + entityName);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveAll(entityName, items) {
  try {
    localStorage.setItem(PREFIX + entityName, JSON.stringify(items));
  } catch (e) {
    console.error('LocalStore save error:', e);
  }
}

function applySort(items, sort) {
  if (!sort) return items;
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = a[key], bv = b[key];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return desc ? -cmp : cmp;
  });
}

function applyFilter(items, query) {
  return items.filter(item => {
    return Object.entries(query).every(([key, value]) => {
      if (value && typeof value === 'object' && value.$in) {
        return value.$in.includes(item[key]);
      }
      return item[key] === value;
    });
  });
}

export function createEntity(entityName) {
  return {
    async list(sort = '', limit = 1000) {
      let items = getAll(entityName);
      items = applySort(items, sort);
      if (limit) items = items.slice(0, limit);
      return items;
    },

    async create(data) {
      const items = getAll(entityName);
      const newItem = {
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
      };
      items.push(newItem);
      saveAll(entityName, items);
      return newItem;
    },

    async update(id, data) {
      const items = getAll(entityName);
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...data };
        saveAll(entityName, items);
        return items[idx];
      }
      throw new Error(`Item not found in ${entityName}: ${id}`);
    },

    async delete(id) {
      const items = getAll(entityName);
      saveAll(entityName, items.filter(i => i.id !== id));
    },

    async filter(query, sort = '', limit = 1000) {
      let items = getAll(entityName);
      items = applyFilter(items, query);
      items = applySort(items, sort);
      if (limit) items = items.slice(0, limit);
      return items;
    },

    async get(id) {
      const items = getAll(entityName);
      const item = items.find(i => i.id === id);
      if (!item) throw new Error(`Item not found in ${entityName}: ${id}`);
      return item;
    },
  };
}

const CURRENT_USER_KEY = 'app_current_user';
const USERS_KEY = PREFIX + 'users';

function getUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function ensureDefaultAdmin() {
  const users = getUsers();
  if (users.length === 0) {
    const admin = {
      id: 'default_admin',
      first_name: 'Admin',
      last_name: 'Kullanıcı',
      email: 'admin@system.local',
      role: 'admin',
      vip_level: 'vip-3',
      level: 5,
      badges: [],
      created_date: new Date().toISOString(),
    };
    saveUsers([admin]);
    return admin;
  }
  return users[0];
}

export const localAuth = {
  me() {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        const users = getUsers();
        const fresh = users.find(u => u.id === userData.id);
        return Promise.resolve(fresh || userData);
      } catch {
        // fall through
      }
    }
    const admin = ensureDefaultAdmin();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(admin));
    return Promise.resolve(admin);
  },

  login(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  list(sort = '', limit = 1000) {
    ensureDefaultAdmin();
    let users = getUsers();
    users = applySort(users, sort);
    if (limit) users = users.slice(0, limit);
    return Promise.resolve(users);
  },

  create(data) {
    ensureDefaultAdmin();
    const users = getUsers();
    const newUser = {
      ...data,
      id: generateId(),
      created_date: new Date().toISOString(),
      badges: data.badges || [],
    };
    users.push(newUser);
    saveUsers(users);
    return Promise.resolve(newUser);
  },

  update(id, data) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      saveUsers(users);
      const current = localStorage.getItem(CURRENT_USER_KEY);
      if (current) {
        try {
          const c = JSON.parse(current);
          if (c.id === id) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[idx]));
          }
        } catch {
          // ignore
        }
      }
      return Promise.resolve(users[idx]);
    }
    return Promise.reject(new Error('User not found'));
  },

  delete(id) {
    const users = getUsers();
    saveUsers(users.filter(u => u.id !== id));
    return Promise.resolve();
  },

  filter(query, sort = '', limit = 1000) {
    let users = getUsers();
    users = applyFilter(users, query);
    users = applySort(users, sort);
    if (limit) users = users.slice(0, limit);
    return Promise.resolve(users);
  },
};
