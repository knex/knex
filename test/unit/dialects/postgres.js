var knex   = require('../../../knex');

describe("Postgres Unit Tests", function() {

	it('Validates searchPath as Array/String', function() {
		var knexInstance = knex({
			client: 'pg',
		});

		expect(function() {
			knexInstance.client.setSchemaSearchPath(null, {});
		}).to.throw(TypeError);

		expect(function() {
			knexInstance.client.setSchemaSearchPath(null, 4);
		}).to.throw(TypeError);


		var fakeQueryFn = function(expectedSearchPath) {
			return {
					query: function(sql, callback) {
						try {
							expect(sql).to.equal('set search_path to ' + expectedSearchPath);
							callback(null);
						} catch(error) {
							callback(error);
						}
				}
			};
		};

		return knexInstance.client.setSchemaSearchPath(fakeQueryFn('"public,knex"'), 'public,knex')
			.then(function() {
				return knexInstance.client.setSchemaSearchPath(fakeQueryFn('"public","knex"'), ['public', 'knex']);
			})
			.then(function() {
				return knexInstance.client.setSchemaSearchPath(fakeQueryFn('"public"'), 'public')
			});
	});

});