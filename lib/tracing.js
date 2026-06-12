// Tracing support via node:diagnostics_channel TracingChannel.
// Zero-cost when no APM subscribers are attached.

const dc = (() => {
  try {
    return 'getBuiltinModule' in process
      ? process.getBuiltinModule('node:diagnostics_channel')
      : require('node:diagnostics_channel');
  } catch {
    return undefined;
  }
})();

const hasTracingChannel = typeof (dc && dc.tracingChannel) === 'function';

// Check explicitly for `false` rather than truthiness because `hasSubscribers`
// is not available on all Node.js versions that support TracingChannel.
// When `hasSubscribers` is `undefined` (older Node), we assume there are
// subscribers and trace unconditionally, keeping the zero-cost optimization
// only for versions where we can reliably check.
function shouldTrace(channel) {
  return !!channel && channel.hasSubscribers !== false;
}

const noop = () => {};

// --- Channels ---

const queryChannel = hasTracingChannel
  ? dc.tracingChannel('knex:query')
  : undefined;

const transactionChannel = hasTracingChannel
  ? dc.tracingChannel('knex:transaction')
  : undefined;

const poolAcquireChannel = hasTracingChannel
  ? dc.tracingChannel('knex:pool:acquire')
  : undefined;

// Plain channel (fire-and-forget) for pool release — no async lifecycle needed.
const poolReleaseChannel = dc ? dc.channel('knex:pool:release') : undefined;

// --- Trace helpers ---

function traceQuery(fn, contextFactory) {
  if (!shouldTrace(queryChannel)) {
    return fn();
  }
  const traced = queryChannel.tracePromise(fn, contextFactory());
  traced.catch(noop);
  return traced;
}

function traceTransaction(fn, contextFactory) {
  if (!shouldTrace(transactionChannel)) {
    return fn();
  }
  const traced = transactionChannel.tracePromise(fn, contextFactory());
  traced.catch(noop);
  return traced;
}

function tracePoolAcquire(fn, contextFactory) {
  if (!shouldTrace(poolAcquireChannel)) {
    return fn();
  }
  const traced = poolAcquireChannel.tracePromise(fn, contextFactory());
  traced.catch(noop);
  return traced;
}

function publishPoolRelease(context) {
  if (!poolReleaseChannel || !poolReleaseChannel.hasSubscribers) {
    return;
  }
  poolReleaseChannel.publish(context);
}

// --- Connection info helper ---

function getConnectionInfo(connectionSettings) {
  if (!connectionSettings) {
    return {
      database: undefined,
      serverAddress: undefined,
      serverPort: undefined,
    };
  }

  // Handle Unix socket / Windows named pipe
  if (connectionSettings.socketPath || connectionSettings.path) {
    return {
      database: connectionSettings.database,
      serverAddress: connectionSettings.socketPath || connectionSettings.path,
      serverPort: undefined,
    };
  }

  return {
    database: connectionSettings.database,
    serverAddress: connectionSettings.host,
    serverPort: connectionSettings.port,
  };
}

module.exports = {
  queryChannel,
  transactionChannel,
  poolAcquireChannel,
  poolReleaseChannel,
  traceQuery,
  traceTransaction,
  tracePoolAcquire,
  publishPoolRelease,
  getConnectionInfo,
};
