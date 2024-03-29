/**
 * Test case for figuring out robust way to recognize if connection is dead
 * for mysql based drivers.
 */
const delay = require('../../lib/execution/internal/delay');
const toxiproxy = require('toxiproxy-node-client');
const toxicli = new toxiproxy.Toxiproxy('http://localhost:8474');
const rp = require('request-promise-native');

async function stdMysqlQuery(con, sql) {
  return new Promise((resolve, reject) => {
    try {
      con.query(
        {
          sql,
          timeout: 4000,
        },
        function (error, results, fields) {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    } catch (err) {
      reject(err); // double sure...
    }
  });
}

// ALL THE DRIVERS HAS DIFFERENT BAG OF TRICKS TO RECOVER AND
// RECOGNIZE WHEN CONNECTION HAS BEEN CLOSED

// ------------- setup mysql db driver connection
const mysql = require('mysql');
let mysqlCon = { state: 'disconnected' };
async function mysqlQuery(sql) {
  // best way to check if connection is still alive
  if (mysqlCon.state === 'disconnected') {
    console.log('reconnecting mysql');
    mysqlCon = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'mysqlrootpassword',
      port: 23306,
      connectTimeout: 500,
    });
    // not always triggered, if this happens during query
    mysqlCon.on('error', (err) => {
      console.log('- STATS Mysql connection died:', err);
    });
  }
  return stdMysqlQuery(mysqlCon, sql);
}

// ------------- setup mysql2 db driver connection
const mysql2 = require('mysql2');
let mysql2Con = { _fatalError: 'initmefirst' };
async function mysql2Query(sql) {
  if (mysql2Con._fatalError) {
    console.log('reconnecting mysql2');
    mysql2Con = mysql2.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'mysqlrootpassword',
      port: 23306,
      connectTimeout: 500,
    });
    mysql2Con.on('error', (err) => {
      console.log('- STATS Mysql2 connection died:', err);
    });
  }
  console.log('================ MYSQL2 Running query....');
  const res = await stdMysqlQuery(mysql2Con, sql);
  console.log('=========== done');
  return res;
}

const counters = {};
function setMysqlQueryCounters(name) {
  counters[name] = { queries: 0, results: 0, errors: 0 };
}
setMysqlQueryCounters('mysql');
setMysqlQueryCounters('mysql2');

const _ = require('lodash');

// start printing out counters
let lastCounters = _.cloneDeep(counters);

setInterval(() => {
  const reqsPerSec = {};
  for (const key of Object.keys(counters)) {
    reqsPerSec[key] = {
      queries: counters[key].queries - lastCounters[key].queries,
      results: counters[key].results - lastCounters[key].results,
      errors: counters[key].errors - lastCounters[key].errors,
    };
  }
  console.log(
    '------------------------ STATS PER SECOND ------------------------'
  );
  console.dir(reqsPerSec, { colors: true });
  console.log(
    '------------------------------- EOS ------------------------------'
  );
  lastCounters = _.cloneDeep(counters);

  // if hang
  ///if (reqsPerSec.mysql2.queries === 0) process.exit(0);
}, 1000);

async function main() {
  async function recreateProxy(serviceName, listenPort, proxyToPort) {
    try {
      await rp.delete({
        url: `${toxicli.host}/proxies/${serviceName}`,
      });
    } catch (err) {
      /* empty */
    }

    const proxy = await toxicli.createProxy({
      name: serviceName,
      listen: `0.0.0.0:${listenPort}`,
      upstream: `${serviceName}:${proxyToPort}`,
    });

    // add some latency
    await proxy.addToxic(
      new toxiproxy.Toxic(proxy, {
        type: 'latency',
        attributes: { latency: 1, jitter: 1 },
      })
    );

    // cause connections to be closed every some transferred bytes
    await proxy.addToxic(
      new toxiproxy.Toxic(proxy, {
        type: 'limit_data',
        attributes: { bytes: 1000 },
      })
    );
  }

  // create TCP proxies for simulating bad connections etc.
  async function recreateProxies() {
    console.log('----- Recreating proxies -> cutting connections completely');
    await recreateProxy('postgresql', 25432, 5432);
    await recreateProxy('mysql', 23306, 3306);
    await recreateProxy('oracledb', 21521, 1521);
  }
  setInterval(() => recreateProxies(), 2000);

  async function loopQueries(prefix, query) {
    const counts = counters[prefix];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        counts.queries += 1;
        // without this delay we endup to busy failure loop
        await delay(0);
        await query();
        counts.results += 1;
      } catch (err) {
        counts.errors += 1;
        console.log(prefix, err);
      }
    }
  }

  await recreateProxies();

  loopQueries('mysql', () => mysqlQuery('select 1'));
  loopQueries('mysql2', () => mysql2Query('select 1'));

  // wait forever
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await delay(1000);
  }
}

main()
  .then(() => console.log('DONE'))
  .catch((err) => console.log(err));
