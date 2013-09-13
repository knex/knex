var JoinClause = require('../../../lib/builder/joinclause').JoinClause;

describe('JoinClause', function () {

  var joinclause;
  beforeEach(function() {
    joinclause = new JoinClause('outer', 'users');
  });

  describe('constructor', function() {

    it('taking the type of join, and the table name being joined', function() {
      expect(joinclause.joinType).to.equal('outer');
      expect(joinclause.table).to.equal('users');
    });

    it('sets an empty clauses array', function() {
      expect(joinclause.clauses).to.eql([]);
    });

  });

  describe('on', function() {

    it('adds an item to the clauses array for the JoinClause object', function() {
      joinclause.on('accounts.id', '=', 'users.id');
      expect(joinclause.clauses).to.have.length(1);
      expect(joinclause.clauses[0].first).to.equal('accounts.id');
      expect(joinclause.clauses[0].operator).to.equal('=');
      expect(joinclause.clauses[0].second).to.equal('users.id');
      expect(joinclause.clauses[0].bool).to.equal('and');
    });

  });

  describe('andOn', function() {

    it('is an alias for the "on" method', function() {
      var stub = sinon.stub(joinclause, 'on');
      joinclause.andOn();
      stub.should.have.been.calledOnce;
    });

  });

  describe('orOn', function() {

    it('adds an item to the clauses array, with an "or" in the boolean spot', function() {
      joinclause.orOn('accounts.id', '=', 'users.account_id');
      expect(joinclause.clauses[0].bool).to.equal('or');
    });

  });

});
