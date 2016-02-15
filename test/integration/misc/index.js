/*global describe, expect, it*/

'use strict';

module.exports = function(knex) {

	var dialect = knex.client.config.dialect;

	describe('Miscellaneous', function() {

		if(dialect === 'postgres') {
			it('When Socket is closed by server, acquire a new connection and retry running the query.', function() {
				return knex.raw('SELECT 1 = 1')
					.then(function() {
						var qBuilder = knex.raw('SELECT 1 = 1');

						var Runner = qBuilder.client.runner(qBuilder);
						Runner.run();

						qBuilder.once('query', function() {
							//Kill the socket by nullifying the handle
							Runner.connection.connection.stream._handle = null;
						});

						return qBuilder;
					})
					.catch(function(error) {
						//TODO: Temporary
						expect(error).to.deep.equal({});
					})
			});
		}

	});

};