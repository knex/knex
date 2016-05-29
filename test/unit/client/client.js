/*global expect, describe, it*/

'use strict';

var Promise   = global.testPromise = require('../../../lib/promise')
var MSSQL_Client = require('../../../lib/dialects/mssql')

var clients = {
    mssql: new MSSQL_Client({})
}


describe("Client", function () {

    var reqMock = {
        input: sinon.stub().returns(true),
        query: sinon.stub().returns(Promise.resolve(true))
    };
    var connectionMock = {
        request : sinon.stub().returns(reqMock)
    };



    it("mssql should allow safe bigint ", function (done) {
        var bigintTimestamp = 1464294366973;
        var negativeBigintTimestamp = -1464294366973;
        clients.mssql.query(connectionMock, clients.mssql.queryBuilder().select('*').from('users').where('expiry', bigintTimestamp).toQuery())
            .catch(function(error){
                expect(error).to.be.undefined
            })
            .then(function(){
                return clients.mssql.query(connectionMock, clients.mssql.queryBuilder().select('*').from('users').where('expiry', negativeBigintTimestamp).toQuery())
            })
            .catch(function(error){
                expect(error).to.be.undefined
            })
            .then(function(res){
                expect(res).to.be.true;
            })
            .finally(done);
    });

    it("mssql should not allow unsafe bigint ", function (done) {
        var unsafeBigint = 99071992547409911;
        var negativeUnsafeBigint = -99071992547409911;
        clients.mssql.query(connectionMock, clients.mssql.queryBuilder().select('*').from('users').where('expiry', unsafeBigint).toQuery())
            .catch(function(error){
                expect(error).to.be.an('Error');
                expect(error.message).to.contain('Bigint must be safe integer or must be passed as string');
                expect(reqMock.query.callCount).to.equal(1);
            })
            .then(function(){
                return clients.mssql.query(connectionMock, clients.mssql.queryBuilder().select('*').from('users').where('expiry', negativeUnsafeBigint).toQuery())
            })
            .catch(function(error){
                expect(error).to.be.an('Error');
                expect(error.message).to.contain('Bigint must be safe integer or must be passed as string');
                expect(reqMock.query.callCount).to.equal(1);
            })
            .finally(done);
    });
});