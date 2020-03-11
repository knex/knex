const LeaseConnectionFromClient = (client) =>
  async function withConnection(next) {
    const connection = await client.acquireConnection();
    try {
      return await next(connection);
    } finally {
      await client.releaseConnection(connection);
    }
  };

function ReuseConnection(connection) {
  let previous = Promise.resolve();

  function reuseConnection(next) {
    const basePromise = previous.then(() => next(connection));
    previous = basePromise.catch((err) => {});
    return basePromise.then((x) => x);
  }

  return reuseConnection;
}

Object.assign(exports, {
  LeaseConnectionFromClient,
  ReuseConnection,
});
