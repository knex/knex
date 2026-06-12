const obj = {};
Object.defineProperty(obj, 'client', {
  get() {
    throw new Error('threw on .client access');
  },
});
module.exports = obj;
