class Hooks {
  constructor(client) {
    this.client = client;
    this.hooks = {
      // Fires before requesting connection from pool
      beforeAcquire: [],
      // Fires after connection acquired
      afterAcquire: [],
      // Fires before releasing connection back to pool
      beforeRelease: [],
      // Fires after connection released
      afterRelease: [],
      // Fires during compilation phase
      // Can modify builder before SQL generation
      beforeCompile: [],
      // Fires after SQL generated but before execution
      // Can modify SQL/bindings if needed
      afterCompile: [],
      // Final point before database execution
      // Cannot modify SQL but can track/validate
      beforeExecute: [],
      // Fires after successful execution
      afterExecute: [],
    };
  }

  register(event, callback) {
    if (!this.hooks[event]) {
      throw new Error(`Unknown hook type: ${event}`);
    }
    this.hooks[event].push(callback);
  }

  async run(name, ...args) {
    const list = this.hooks[name];
    if (!list || list.length === 0) return;
    for (const fn of list) {
      const result = fn(...args);
      if (result && result.then && typeof result.then === 'function') {
         await result;
      }
    }
  }
}

module.exports = Hooks;
