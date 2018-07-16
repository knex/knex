const PAUSE_BETWEEN_CONNECTIONS = 2000;
const CONNECTION_ATTEMPTS = (3 * 60 * 1000) / PAUSE_BETWEEN_CONNECTIONS; // roughly 3 minutes

const Connection = require('tedious').Connection;

const config = {
  userName: 'sa',
  password: 'S0meVeryHardPassword',
  server: 'localhost',
  options: {
    database: 'knex_test',
  },
};

let didConnect = false;
let tryCount = 0;

function tryToConnect() {
  tryCount++;
  if (tryCount > CONNECTION_ATTEMPTS) {
    console.log('Giving up... it fails if it fails');
    process.exit(1);
  }

  console.log('Connecting... to mssql');

  const connection = new Connection(config);

  connection.on('end', () => {
    if (!didConnect) {
      console.log(
        `Couldnt connnect yet... try again in ${PAUSE_BETWEEN_CONNECTIONS}ms...`
      );
      setTimeout(tryToConnect, PAUSE_BETWEEN_CONNECTIONS);
    }
  });

  connection.on('error', () => {
    // prevent leaking errors.. driver seems to sometimes emit error event,
    // sometimes connect event with error
    // and some times just closes connection without error / connect events
    // (debug event says that socket was ended and thats it...)
  });

  connection.on('connect', (err) => {
    if (!err) {
      console.log('Connecting mssql server was a great success!');
      didConnect = true;
    } else {
      console.log('Error was passed to connect event.');
    }
    connection.close();
  });
}

tryToConnect();
