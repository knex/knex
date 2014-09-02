'use strict';

/*jslint node:true, nomen: true*/
var inherits = require('util').inherits;
var Readable = require('stream').Readable;

var _ = require('lodash');

function OracleQueryStream(connection, sql, bindings, options) {
    try {
        Readable.call(this, _.merge({}, {
            objectMode: true,
            highWaterMark: 1000
        }, options));

        this.oracleReader = connection.reader(sql, bindings || []);
    } catch (err) {
        throw err;
    }
}

inherits(OracleQueryStream, Readable);

OracleQueryStream.prototype._read = function () {
    var self = this;

    this.oracleReader.nextRow(function (err, row) {
        if (err) {
            return self.emit('error', err);
        }

        if (!row) {
            process.nextTick(function () {
                self.push(null);
            });
        }

        self.push(row);
    });
};

module.exports = OracleQueryStream;
