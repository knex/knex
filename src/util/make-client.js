import inherits from 'inherits';

// Ensure the client has fresh objects so we can tack onto
// the prototypes without mutating them globally.
export default function makeClient(ParentClient) {

  if (typeof ParentClient.prototype === 'undefined') {
    throw new Error('A valid parent client must be passed to makeClient')
  }

  function Client(config) {
    ParentClient.call(this, config)
  }
  inherits(Client, ParentClient)

  return Client
}
