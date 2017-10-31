// Temporary solution. Use connection.queryStream() when next ibm_db version is released; currently on 1.01
// source: https://github.com/gildean/node-ibm_db/blob/bbb6ec11167fa35ffa64e8c2e31ed5b9657a1e06/lib/odbc.js

/*jslint node:true, nomen: true*/
// import inherits from 'inherits';
import { Readable } from 'stream';

function Db2QueryStream(connection, sql, bindings, options) {
  const stream = new Readable({ objectMode: true });
  let results;
  stream._read = () => {
    // after the first internal call to _read, the 'results' should be set
    // and the stream can continue fetching the results
    if (results) return this._fetchStreamingResults(results, stream);
    // in the first call to _read the stream starts to emit data once we've queried for results
    return connection.query(sql, bindings, (err, result) => {
      if (err) return process.nextTick(() => {
        stream.emit('error', err);
      });
      results = result;
      return this._fetchStreamingResults(results, stream);
    });
  };
  return stream;
}


Db2QueryStream.prototype._fetchStreamingResults = (results, stream) => {
  return results.fetch((err, data) => {
    if (err) return process.nextTick(function () {
      stream.emit('error', err);
    });
    // when no more data returns, return push null to indicate the end of stream
    if (!data) return stream.push(null);
    // if pushing the data returns 'true', that means we can query and push more immediately
    // otherwise the _read function will be called again (executing this function)
    // once the reading party is ready to receive more
    if (stream.push(data)) return this._fetchStreamingResults(results, stream);
  });
};

export default Db2QueryStream;