let isInitted = false;

function initTests() {
  if (isInitted) {
    return;
  }

  require('source-map-support').install();

  require('./util/chai-setup');

  const EXPECTED_REJECTION_COUNT = 0;
  const rejectionLog = [];
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    rejectionLog.push({
      reason,
    });
  });

  process.on('exit', (code) => {
    if (rejectionLog.length) {
      console.error(`Unhandled rejections: ${rejectionLog.length}`);
      rejectionLog.forEach((rejection) => {
        console.error(rejection);
      });

      if (rejectionLog.length > EXPECTED_REJECTION_COUNT) {
        process.exitCode = code || 1;
      }
    }
    console.log('No unhandled exceptions');
  });

  isInitted = true;
}

module.exports = {
  initTests,
};
