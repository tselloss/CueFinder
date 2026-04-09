export const AUTH_TOKEN_STORAGE_KEY = 'authToken';
export const AUTH_USER_STORAGE_KEY = 'user';

const storageCache = new Map();

function hasLocalStorage() {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
}

function resolveMaybePromise(value) {
  return value && typeof value.then === 'function' ? value : Promise.resolve(value);
}

export function createMemoryStorageAdapter(initialValues = {}) {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    getItemSync(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
}

export function createWebStorageAdapter(storage = hasLocalStorage() ? globalThis.localStorage : null) {
  if (!storage) {
    return createMemoryStorageAdapter();
  }

  return {
    getItem(key) {
      return storage.getItem(key);
    },
    getItemSync(key) {
      return storage.getItem(key);
    },
    setItem(key, value) {
      storage.setItem(key, value);
    },
    removeItem(key) {
      storage.removeItem(key);
    },
    clear() {
      storage.clear();
    },
  };
}

let activeStorageAdapter = hasLocalStorage()
  ? createWebStorageAdapter()
  : createMemoryStorageAdapter();

export function configureStorage(adapter) {
  activeStorageAdapter = adapter || createMemoryStorageAdapter();
  return activeStorageAdapter;
}

export function getStorageAdapter() {
  return activeStorageAdapter;
}

export async function hydrateStorage(keys = []) {
  const adapter = getStorageAdapter();

  for (const key of keys) {
    let value = null;

    if (typeof adapter.getItemSync === 'function') {
      value = adapter.getItemSync(key);
    } else if (typeof adapter.getItem === 'function') {
      value = await resolveMaybePromise(adapter.getItem(key));
    }

    if (value === null || typeof value === 'undefined') {
      storageCache.delete(key);
      continue;
    }

    storageCache.set(key, value);
  }
}

export function getStoredValue(key, fallbackValue = null) {
  if (storageCache.has(key)) {
    return storageCache.get(key);
  }

  const adapter = getStorageAdapter();
  if (typeof adapter.getItemSync === 'function') {
    const value = adapter.getItemSync(key);
    if (value !== null && typeof value !== 'undefined') {
      storageCache.set(key, value);
      return value;
    }
  }

  return fallbackValue;
}

export async function setStoredValue(key, value) {
  if (value === null || typeof value === 'undefined') {
    return removeStoredValue(key);
  }

  storageCache.set(key, value);

  const adapter = getStorageAdapter();
  if (typeof adapter.setItem === 'function') {
    await resolveMaybePromise(adapter.setItem(key, value));
  }

  return value;
}

export async function removeStoredValue(key) {
  storageCache.delete(key);

  const adapter = getStorageAdapter();
  if (typeof adapter.removeItem === 'function') {
    await resolveMaybePromise(adapter.removeItem(key));
  }
}

export async function clearStoredValues(keys = []) {
  if (!keys.length) {
    storageCache.clear();

    const adapter = getStorageAdapter();
    if (typeof adapter.clear === 'function') {
      await resolveMaybePromise(adapter.clear());
    }
    return;
  }

  await Promise.all(keys.map((key) => removeStoredValue(key)));
}