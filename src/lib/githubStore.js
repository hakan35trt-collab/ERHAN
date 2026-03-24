// GitHub-backed data store — all data saved to the repo under /data/ folder.
// Requires VITE_GITHUB_TOKEN, VITE_GITHUB_REPO env vars set in Railway.

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'hakan35trt-collab/ERHAN';
const GITHUB_BRANCH = 'main';
const DATA_BRANCH = import.meta.env.VITE_DATA_BRANCH || 'data';
const DATA_DIR = 'data';
export const BACKUP_DIR = 'yedekler';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
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
  return items.filter(item =>
    Object.entries(query).every(([key, value]) => {
      if (value && typeof value === 'object') {
        if (value.$in)  return value.$in.includes(item[key]);
        if (value.$nin) return !value.$nin.includes(item[key]);
        if (value.$gt)  return item[key] > value.$gt;
        if (value.$gte) return item[key] >= value.$gte;
        if (value.$lt)  return item[key] < value.$lt;
        if (value.$lte) return item[key] <= value.$lte;
        if (value.$ne)  return item[key] !== value.$ne;
      }
      return item[key] === value;
    })
  );
}

// ─── GitHub API ────────────────────────────────────────────────────────────────

export async function ghGet(path) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${DATA_BRANCH}&t=${Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );
  if (res.status === 404) return { content: null, sha: null };
  if (!res.ok) throw new Error(`GH GET ${path}: ${res.status}`);
  const data = await res.json();
  const raw = atob(data.content.replace(/\n/g, ''));
  const content = JSON.parse(decodeURIComponent(escape(raw)));
  return { content, sha: data.sha };
}

export async function ghPut(path, content, sha, message) {
  const raw = unescape(encodeURIComponent(JSON.stringify(content, null, 2)));
  const encoded = btoa(raw);
  const body = { message: message || `data: ${path}`, content: encoded, branch: DATA_BRANCH };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const status = res.status;
    throw Object.assign(new Error(`GH PUT ${path}: ${status}`), { status, body: err });
  }
  const result = await res.json();
  return result.content?.sha || null;
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

const _cache = {};   // entityName → items[]
const _sha   = {};   // entityName → sha string

async function readItems(entityName) {
  if (_cache[entityName]) return [..._cache[entityName]];
  const path = `${DATA_DIR}/${entityName}.json`;
  const { content, sha } = await ghGet(path);
  const items = Array.isArray(content) ? content : [];
  _cache[entityName] = items;
  _sha[entityName] = sha;
  return [...items];
}

async function writeItems(entityName, items, retried = false) {
  const path = `${DATA_DIR}/${entityName}.json`;
  const sha = _sha[entityName];
  try {
    const newSha = await ghPut(path, items, sha, `data: update ${entityName}`);
    _cache[entityName] = [...items];
    _sha[entityName] = newSha;
  } catch (e) {
    if (!retried && (e.status === 409 || e.status === 422 || e.status === 404)) {
      delete _cache[entityName];
      delete _sha[entityName];
      const { sha: freshSha } = await ghGet(path);
      _sha[entityName] = freshSha;
      return writeItems(entityName, items, true);
    }
    throw e;
  }
}

// ─── Write queue per entity (serializes concurrent writes) ────────────────────

const _queues = {};
function enqueue(entityName, fn) {
  if (!_queues[entityName]) _queues[entityName] = Promise.resolve();
  const p = _queues[entityName].then(fn);
  _queues[entityName] = p.catch(() => {});
  return p;
}

// ─── Generic entity factory ───────────────────────────────────────────────────

export function createGitHubEntity(entityName) {
  return {
    list: async (sort = '', limit = 1000) => {
      let items = await readItems(entityName);
      if (sort) items = applySort(items, sort);
      if (limit) items = items.slice(0, limit);
      return items;
    },

    create: (data) => enqueue(entityName, async () => {
      const items = await readItems(entityName);
      const newItem = { ...data, id: data.id || generateId(), created_date: data.created_date || new Date().toISOString() };
      items.push(newItem);
      await writeItems(entityName, items);
      return newItem;
    }),

    update: (id, data) => enqueue(entityName, async () => {
      const items = await readItems(entityName);
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) throw new Error(`Not found: ${id}`);
      items[idx] = { ...items[idx], ...data };
      await writeItems(entityName, items);
      return items[idx];
    }),

    delete: (id) => enqueue(entityName, async () => {
      const items = await readItems(entityName);
      await writeItems(entityName, items.filter(i => i.id !== id));
    }),

    filter: async (query, sort = '', limit = 1000) => {
      let items = await readItems(entityName);
      items = applyFilter(items, query);
      if (sort) items = applySort(items, sort);
      if (limit) items = items.slice(0, limit);
      return items;
    },

    get: async (id) => {
      const items = await readItems(entityName);
      const item = items.find(i => i.id === id);
      if (!item) throw new Error(`Not found: ${id}`);
      return item;
    },

    bulkCreate: (dataArray) => enqueue(entityName, async () => {
      if (!Array.isArray(dataArray) || !dataArray.length) return [];
      const items = await readItems(entityName);
      const created = dataArray.map(d => ({ ...d, id: d.id || generateId(), created_date: d.created_date || new Date().toISOString() }));
      items.push(...created);
      await writeItems(entityName, items);
      return created;
    }),

    bulkUpdate: (updates) => enqueue(entityName, async () => {
      if (!Array.isArray(updates) || !updates.length) return [];
      const items = await readItems(entityName);
      for (const { id, data } of updates) {
        const idx = items.findIndex(i => i.id === id);
        if (idx !== -1) items[idx] = { ...items[idx], ...data };
      }
      await writeItems(entityName, items);
      return items;
    }),
  };
}

// ─── GitHub-backed auth ───────────────────────────────────────────────────────

const USERS_ENTITY = 'users';
const SESSION_KEY = 'app_current_user';

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
function setSession(user) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export const githubAuth = {
  async me() {
    const session = getSession();
    if (!session) return null;
    try {
      const users = await readItems(USERS_ENTITY);
      const fresh = users.find(u => u.id === session.id);
      if (fresh) { setSession(fresh); return fresh; }
    } catch { return session; }
    return null;
  },

  async login(email, password) {
    const users = await readItems(USERS_ENTITY);
    const user = users.find(
      u => u.email?.toLowerCase() === email?.toLowerCase() && u.password === password
    );
    if (user) { setSession(user); return user; }
    return null;
  },

  async findByEmailAsync(email) {
    const users = await readItems(USERS_ENTITY);
    return users.find(u => u.email?.toLowerCase() === email?.toLowerCase()) || null;
  },

  logout() { setSession(null); },

  async seedDefaultAdmin() {
    // Only add if the specific admin email doesn't exist yet
    // Never overwrites existing users
    try {
      const users = await readItems(USERS_ENTITY);
      if (users.find(u => u.email === 'erhanyaman1938@gmail.com')) return; // already exists
      const admin = {
        id: 'default_erhan_admin',
        first_name: 'ERHAN', last_name: 'YAMAN',
        email: 'erhanyaman1938@gmail.com', password: 'yamann01As',
        role: 'admin', vip_level: 'vip-3', badges: [],
        created_date: new Date().toISOString(),
      };
      users.push(admin);
      await writeItems(USERS_ENTITY, users);
    } catch (e) {
      // Non-fatal — data/users.json already pre-populated in GitHub repo
      console.warn('seedDefaultAdmin (non-fatal):', e.message);
    }
  },

  list: (sort = '', limit = 1000) => createGitHubEntity(USERS_ENTITY).filter({}, sort, limit),
  create: (data) => createGitHubEntity(USERS_ENTITY).create(data),
  delete: (id) => createGitHubEntity(USERS_ENTITY).delete(id),

  update: (id, data) => enqueue(USERS_ENTITY, async () => {
    const users = await readItems(USERS_ENTITY);
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...data };
    await writeItems(USERS_ENTITY, users);
    const session = getSession();
    if (session?.id === id) setSession(users[idx]);
    return users[idx];
  }),

  filter: async (query, sort = '', limit = 1000) => {
    let users = await readItems(USERS_ENTITY);
    users = applyFilter(users, query);
    if (sort) users = applySort(users, sort);
    if (limit) users = users.slice(0, limit);
    return users;
  },

  async updateMyUserData(data) {
    const session = getSession();
    if (!session) return null;
    return githubAuth.update(session.id, data);
  },
};

// ─── Monthly auto-backup ──────────────────────────────────────────────────────

const ALL_ENTITIES = [
  'visitors','logs','announcements','messages','notifications',
  'authorizationConfigs','frequentVisitors','staff','shiftConfigurations',
  'directoryConfigs','points','notes','noteReads','visitorAlerts',
  'visitTypes','badges','users',
];

const MONTH_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

export async function checkAndRunAutoBackup() {
  if (!GITHUB_TOKEN) return;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  if (localStorage.getItem('last_auto_backup') === monthKey) return;

  try {
    const backupData = { backup_date: now.toISOString(), backup_type: 'auto_monthly' };
    for (const name of ALL_ENTITIES) {
      try { const { content } = await ghGet(`${DATA_DIR}/${name}.json`); backupData[name] = content || []; }
      catch { backupData[name] = []; }
    }
    const p = n => String(n).padStart(2, '0');
    const fname = `${BACKUP_DIR}/${now.getFullYear()}-${p(now.getMonth()+1)}-${MONTH_TR[now.getMonth()]}-${p(now.getDate())}-${p(now.getHours())}-${p(now.getMinutes())}.json`;
    await ghPut(fname, backupData, null, `yedek: ${now.getFullYear()} ${MONTH_TR[now.getMonth()]} otomatik yedek`);
    localStorage.setItem('last_auto_backup', monthKey);
    console.log('Otomatik yedek alındı:', fname);
  } catch (e) { console.warn('Otomatik yedek başarısız:', e); }
}

export async function createManualBackup() {
  if (!GITHUB_TOKEN) throw new Error('GitHub token ayarlanmamış.');
  const now = new Date();
  const backupData = { backup_date: now.toISOString(), backup_type: 'manual' };
  for (const name of ALL_ENTITIES) {
    try { const { content } = await ghGet(`${DATA_DIR}/${name}.json`); backupData[name] = content || []; }
    catch { backupData[name] = []; }
  }
  const p = n => String(n).padStart(2, '0');
  const fname = `${BACKUP_DIR}/${now.getFullYear()}-${p(now.getMonth()+1)}-${MONTH_TR[now.getMonth()]}-${p(now.getDate())}-${p(now.getHours())}-${p(now.getMinutes())}-manuel.json`;
  await ghPut(fname, backupData, null, `yedek: manuel yedek ${now.toLocaleDateString('tr-TR')}`);
  return fname;
}
