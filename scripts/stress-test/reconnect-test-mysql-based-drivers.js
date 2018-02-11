/**
 * Test case for figuring out robust way to recognize if connection is dead
 * for mysql based drivers.
 */
const Bluebird = require('bluebird');
const toxiproxy = require('toxiproxy-node-client');
const toxicli = new toxiproxy.Toxiproxy('http://localhost:8474');
const rp = require('request-promise-native');

async function stdMysqlQuery(con, sql) {  
  return new Promise((resolve, reject) => {
    try {
      con.query(sql, function (error, results, fields) {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });    
    } catch (err) {
      reject(err); // double sure...
    }
  });
}

// ALL THE DRIVERS HAS DIFFERENT BAG OF TRICKS TO RECOVER AND
// RECOGNIZE WHEN CONNECTION HAS BEEN CLOSED

// ------------- setup mysql db driver connection
const mysql = require('mysql');
let mysqlCon = {state: 'disconnected'};
async function mysqlQuery(sql) {
  // best way to check if connection is still alive
  if (mysqlCon.state === 'disconnected') {
    mysqlCon = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'mysqlrootpassword',
      port: 23306
    });
    // not always triggered, if this happens during query
    mysqlCon.on('error', err => {
      console.log('- STATS Mysql connection died:', err);
    });
  }
  return stdMysqlQuery(mysqlCon, sql);
}

// ------------- setup mysql2 db driver connection
const mysql2 = require('mysql2');
let mysql2Con = {_fatalError: 'initmefirst'};
async function mysql2Query(sql) {
  if (mysql2Con._fatalError) {
    mysql2Con = mysql2.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'mysqlrootpassword',
      port: 23306
    });
    mysql2Con.on('error', err => {
      console.log('Mysql2 connection died:', err);
    });
  }
  return stdMysqlQuery(mysql2Con, sql);
}

const counters = {};
function setMysqlQueryCounters(name) {
  const counts = counters[name] = {queries: 0, results: 0, errors: 0};
}
setMysqlQueryCounters('mysql');
setMysqlQueryCounters('mysql2');

const _ = require('lodash');

// start printing out counters
let lastCounters = _.cloneDeep(counters);

setInterval(() => {
  const reqsPerSec = {};
  for (let key of Object.keys(counters)) {
    reqsPerSec[key] = {
      queries: (counters[key].queries - lastCounters[key].queries) / 2,
      results: (counters[key].results - lastCounters[key].results) / 2,
      errors: (counters[key].errors - lastCounters[key].errors) / 2,
    }
  }
  console.log('------------------------ STATS PER SECOND ------------------------');
  console.dir(reqsPerSec, {colors: true});
  console.log('------------------------------- EOS ------------------------------');
  lastCounters = _.cloneDeep(counters);
}, 2000);  


async function main() {

  async function recreateProxy(serviceName, listenPort, proxyToPort) {
    try {
      await rp.delete({
        url: `${toxicli.host}/proxies/${serviceName}`
      });  
    } catch(err) {}

    const proxy = await toxicli.createProxy({
      name: serviceName,
      listen: `0.0.0.0:${listenPort}`,
      upstream: `${serviceName}:${proxyToPort}`
    });

    // add some latency
    await proxy.addToxic(new toxiproxy.Toxic(proxy, {
      type: 'latency',
      attributes: {latency: 1, jitter: 1}
    }));

    // cause connections to be closed every some transferred bytes
    await proxy.addToxic(new toxiproxy.Toxic(proxy, {
      type: 'limit_data',
      attributes: {bytes: 1500}
    }));
  }


  // create TCP proxies for simulating bad connections etc.
  async function recreateProxies() {
    console.log('----- Recreating proxies -> cutting connections completely');
    await recreateProxy('postgresql', 25432, 5432);
    await recreateProxy('mysql', 23306, 3306);
    await recreateProxy('oracledbxe', 21521, 1521);
  }
  setInterval(() => recreateProxies(), 5000);

  async function loopQueries(prefix, query) {
    const counts = counters[prefix];

    while(true) {
      try {
        counts.queries += 1;
        // without this delay we endup to busy failure loop
        await Bluebird.delay(0);
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
  while(true) {
    await Bluebird.delay(1000);
  }
}

main().then(() => console.log('DONE')).catch(err => console.log(err));
