const Knex = require('../../../lib/index');
const { expect } = require('chai');
const { SQLTokenListVisitor } = require('../../../lib/query/token-visitors');

describe("Token visitor", () => {
    const knex = Knex({
        client: 'sqlite3',
        connection: {
            filename: ':memory:'
        }
    });
    describe("tokenization and serializers", () => {
        it('allows transformation of token list through a fluent API', () => {
            const input = 'select id from users where user_id = 1';
            let visitor = new SQLTokenListVisitor(input);
            const tokens = visitor.tokens;
            expect(tokens).to.eql([
                'select',
                'id',
                'from',
                'users',
                'where',
                'user_id',
                '=',
                '1'
            ]);
            expect(visitor.toString()).to.eql(input);
            visitor
                .findToken('select')
                .insertAfter('name')
                .last()
                .insertAfter(',');
            expect(visitor.toString()).to.eql('select name , id from users where user_id = 1');
            visitor = new SQLTokenListVisitor(input);
            visitor
                .findToken('select')
                .insertAfter(['name', ','])
            expect(visitor.toString()).to.eql('select name , id from users where user_id = 1');
            visitor = new SQLTokenListVisitor(input);
            visitor
                .findToken('select')
                .insertAfter('name,')
            expect(visitor.toString()).to.eql('select name , id from users where user_id = 1');
            visitor = new SQLTokenListVisitor(input);
            visitor
                .findToken('select')
                .next('where')
                .selectPrev()
                .replace('teams');
            expect(visitor.toString()).to.eql('select id from teams where user_id = 1');
            visitor
                .findToken('where')
                .next('=')
                .select()
                .replace('<>');
            expect(visitor.toString()).to.eql('select id from teams where user_id <> 1');
            visitor
                .findToken('select')
                .next('from')
                .next('where')
                .next('<>')
                .selectNext()
                .replace('2');
            expect(visitor.toString()).to.eql('select id from teams where user_id <> 2');
        })
    });
    describe("QueryBuilder#transformToken", () => {
        it("allows transformation of tokens through visitors", () => {
            const sql = knex('users')
                .select('*')
                .from('users')
                .where({ user_id: 1 })
                .transformRawTokens((t) => {
                    t.findToken('select')
                        .next('*')
                        .select()
                        .replace('id')
                })
                .toString();
            expect(sql).to.eql('select id from `users` where `user_id` = 1');
        });
    });
});