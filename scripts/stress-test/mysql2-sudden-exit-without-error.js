/**
 * Test case when mysql2 driver strangely exits when one tries to send query
 * to dead connection.
 */

const delay = require('../../lib/util/delay');
const toxiproxy = require('toxiproxy-node-client');
const toxicli = new toxiproxy.Toxiproxy('http://localhost:8474');
const rp = require('request-promise-native');

// drops old toxicproxy and creates new
async function recreateProxy(serviceName, listenPort, proxyToPort) {
  try {
    await rp.delete({
      url: `${toxicli.host}/proxies/${serviceName}`,
    });
  } catch (err) {
    // there was no proxy by that name... its ok
  }

  const proxy = await toxicli.createProxy({
    name: serviceName,
    listen: `0.0.0.0:${listenPort}`,
    upstream: `${serviceName}:${proxyToPort}`,
  });
}

async function insanelyParanoidQuery(con) {
  console.log('sending query');
  const res = await new Promise((resolve, reject) => {
    try {
      con.query('select 1', [], function (err, rows, fields) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    } catch (err) {
      console.log('Huh synchronous exception?! (shouldnt be possible)');
      reject(err);
    }
  });
  console.log(res);
}

async function main() {
  // create proxy from localhost:23306 -> mysqldocker:3306
  await recreateProxy('mysql', 23306, 3306);

  // ------------- setup mysql2 db driver connection
  const mysql2 = require('mysql2'); // with mysql this works...
  const mysql2Con = await mysql2.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysqlrootpassword',
    port: 23306,
  });

  mysql2Con.on('error', function (err) {
    console.log("I'm dead", err);
  });

  console.log('Going to cut connections');

  // cut connection during recreate
  await recreateProxy('mysql', 23306, 3306);

  console.log('Proxy recreated... start waiting');

  // wait forever
  while (true) {
    await delay(1000);
    try {
      await insanelyParanoidQuery(mysql2Con);
    } catch (err) {
      console.log('query failed:', err);
    }
    await recreateProxy('mysql', 23306, 3306);
  }
}

main()
  .then(() => console.log('Process stopped normally'))
  .catch((err) => {
    console.log('Process stopped to failure', err);
  });

console.log('Waiting for eventloop to stop...');

process.on('uncaughtException', function (err) {
  console.log('uncaughtException', err);
});

process.on('exit', function () {
  console.log(
    'Did someone call process.exit() or wat? exitCode:',
    process.exitCode
  );
});
