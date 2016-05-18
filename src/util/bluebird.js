// Use this shim module rather than "bluebird/js/main/promise"
// when bundling for client
export default () => require('bluebird')
