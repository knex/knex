describe("DatabaseSqlServerSchemaGrammarTest", function() {

  it("testBasicCreateTable", function() {
    var blueprint = new Blueprint('users');
    blueprint.create();
    blueprint.increments('id');
    blueprint.string('email');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('create table "users" ("id" int identity primary key not null, "email" nvarchar(255) not null)', $statements[0]);
  });

  it("placeholder", function() {
    var blueprint = new Blueprint('users');
    blueprint.increments('id');
    blueprint.string('email');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "id" int identity primary key not null, "email" nvarchar(255) not null', $statements[0]);
  });


  it("testDropTable", function() {
    var blueprint = new Blueprint('users');
    blueprint.drop();
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('drop table "users"', $statements[0]);
  });


  it("testDropColumn", function() {
    var blueprint = new Blueprint('users');
    blueprint.dropColumn('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" drop column "foo"', $statements[0]);
  });

  it("placeholder", function() {
    var blueprint = new Blueprint('users');
    blueprint.dropColumn(array('foo', 'bar'));
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" drop column "foo", "bar"', $statements[0]);
  });

  it("placeholder", function() {
    var blueprint = new Blueprint('users');
    blueprint.dropColumn('foo', 'bar');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" drop column "foo", "bar"', $statements[0]);
  });


  it("testDropPrimary", function() {
    var blueprint = new Blueprint('users');
    blueprint.dropPrimary('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" drop constraint foo', $statements[0]);
  });


  it("testDropUnique", function() {
    var blueprint = new Blueprint('users');
    blueprint.dropUnique('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('drop index foo on "users"', $statements[0]);
  });


  it("testDropIndex", function() {
    var blueprint = new Blueprint('users');
    blueprint.dropIndex('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('drop index foo on "users"', $statements[0]);
  });


  it("testDropForeign", function() {
    var blueprint = new Blueprint('users');
    blueprint.dropForeign('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" drop constraint foo', $statements[0]);
  });


  it("testDropTimestamps", function() {
    var blueprint = new Blueprint('users');
    blueprint.dropTimestamps();
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" drop column "created_at", "updated_at"', $statements[0]);
  });


  it("testRenameTable", function() {
    var blueprint = new Blueprint('users');
    blueprint.rename('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('sp_rename "users", "foo"', $statements[0]);
  });


  it("testAddingPrimaryKey", function() {
    var blueprint = new Blueprint('users');
    blueprint.primary('foo', 'bar');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add constraint bar primary key ("foo")', $statements[0]);
  });


  it("testAddingUniqueKey", function() {
    var blueprint = new Blueprint('users');
    blueprint.unique('foo', 'bar');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('create unique index bar on "users" ("foo")', $statements[0]);
  });


  it("testAddingIndex", function() {
    var blueprint = new Blueprint('users');
    blueprint.index(array('foo', 'bar'), 'baz');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('create index baz on "users" ("foo", "bar")', $statements[0]);
  });


  it("testAddingIncrementingID", function() {
    var blueprint = new Blueprint('users');
    blueprint.increments('id');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "id" int identity primary key not null', $statements[0]);
  });


  it("testAddingBigIncrementingID", function() {
    var blueprint = new Blueprint('users');
    blueprint.bigIncrements('id');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "id" bigint identity primary key not null', $statements[0]);
  });


  it("testAddingString", function() {
    var blueprint = new Blueprint('users');
    blueprint.string('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" nvarchar(255) not null', $statements[0]);

    var blueprint = new Blueprint('users');
    blueprint.string('foo', 100);
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" nvarchar(100) not null', $statements[0]);

    var blueprint = new Blueprint('users');
    blueprint.string('foo', 100).nullable().default('bar');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" nvarchar(100) null default \'bar\'', $statements[0]);
  });


  it("testAddingText", function() {
    var blueprint = new Blueprint('users');
    blueprint.text('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" nvarchar(max) not null', $statements[0]);
  });


  it("testAddingBigInteger", function() {
    var blueprint = new Blueprint('users');
    blueprint.bigInteger('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" bigint not null', $statements[0]);

    var blueprint = new Blueprint('users');
    blueprint.bigInteger('foo', true);
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" bigint identity primary key not null', $statements[0]);
  });


  it("testAddingInteger", function() {
    var blueprint = new Blueprint('users');
    blueprint.integer('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" int not null', $statements[0]);

    var blueprint = new Blueprint('users');
    blueprint.integer('foo', true);
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" int identity primary key not null', $statements[0]);
  });


  it("testAddingMediumInteger", function() {
    var blueprint = new Blueprint('users');
    blueprint.mediumInteger('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" int not null', $statements[0]);
  });


  it("testAddingTinyInteger", function() {
    var blueprint = new Blueprint('users');
    blueprint.tinyInteger('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" tinyint not null', $statements[0]);
  });


  it("testAddingSmallInteger", function() {
    var blueprint = new Blueprint('users');
    blueprint.smallInteger('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" smallint not null', $statements[0]);
  });


  it("testAddingFloat", function() {
    var blueprint = new Blueprint('users');
    blueprint.float('foo', 5, 2);
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" float not null', $statements[0]);
  });


  it("testAddingDouble", function() {
    var blueprint = new Blueprint('users');
    blueprint.double('foo', 15, 2);
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" float not null', $statements[0]);
  });


  it("testAddingDecimal", function() {
    var blueprint = new Blueprint('users');
    blueprint.decimal('foo', 5, 2);
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" decimal(5, 2) not null', $statements[0]);
  });


  it("testAddingBoolean", function() {
    var blueprint = new Blueprint('users');
    blueprint.boolean('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" bit not null', $statements[0]);
  });


  it("testAddingEnum", function() {
    var blueprint = new Blueprint('users');
    blueprint.enum('foo', array('bar', 'baz'));
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" nvarchar(255) not null', $statements[0]);
  });


  it("testAddingDate", function() {
    var blueprint = new Blueprint('users');
    blueprint.date('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" date not null', $statements[0]);
  });


  it("testAddingDateTime", function() {
    var blueprint = new Blueprint('users');
    blueprint.dateTime('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" datetime not null', $statements[0]);
  });


  it("testAddingTime", function() {
    var blueprint = new Blueprint('users');
    blueprint.time('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" time not null', $statements[0]);
  });


  it("testAddingTimeStamp", function() {
    var blueprint = new Blueprint('users');
    blueprint.timestamp('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" datetime not null', $statements[0]);
  });


  it("testAddingTimeStamps", function() {
    var blueprint = new Blueprint('users');
    blueprint.timestamps();
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "created_at" datetime not null, "updated_at" datetime not null', $statements[0]);
  });


  it("testAddingBinary", function() {
    var blueprint = new Blueprint('users');
    blueprint.binary('foo');
    $statements = blueprint.toSQL($this.getConnection(), $this.getGrammar());

    equal(1, count($statements));
    equal('alter table "users" add "foo" varbinary(max) not null', $statements[0]);
  });

});