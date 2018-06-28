var Connection = require('tedious').Connection;

var config = {
  userName: "sa",
  password: "S0meVeryHardPassword",
  server: "localhost",
  options: {
    database: "knex_test",
  }
};

let didConnect = false;
let tryCount = 0;

function tryToConnect() {
  tryCount++;
  if (tryCount > 50) {
    console.log("Giving up... it fails if it fails");
    process.exit(0);
  }

  console.log("Connecting... to mssql");

  var connection = new Connection(config);

  connection.on('end', () => {
    if (!didConnect) {
      console.log("Couldnt connnect yet... try again in two secs...");
      setTimeout(tryToConnect, 2000);
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
      console.log("Connecting mssql server was a great success!");
      didConnect = true;
    } else {
      console.log("Error was passed to connect event.");
    }
    connection.close();
  });
}

tryToConnect();