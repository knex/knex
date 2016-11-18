
export default function queryInterfaceMixin(TargetClass) {

  TargetClass.prototype.with = function with$() {
    return this.queryBuilder().with(...arguments)
  }
  TargetClass.prototype.select = function select() {
    return this.queryBuilder().select(...arguments)
  }
  TargetClass.prototype.as = function as() {
    return this.queryBuilder().as(...arguments)
  }
  TargetClass.prototype.columns = function columns() {
    return this.queryBuilder().columns(...arguments)
  }
  TargetClass.prototype.column = function column() {
    return this.queryBuilder().column(...arguments)
  }
  TargetClass.prototype.from = function from() {
    return this.queryBuilder().from(...arguments)
  }
  TargetClass.prototype.fromJS = function fromJS() {
    return this.queryBuilder().fromJS(...arguments)
  }
  TargetClass.prototype.into = function into() {
    return this.queryBuilder().into(...arguments)
  }
  TargetClass.prototype.withSchema = function withSchema() {
    return this.queryBuilder().withSchema(...arguments)
  }
  TargetClass.prototype.table = function table() {
    return this.queryBuilder().table(...arguments)
  }
  TargetClass.prototype.distinct = function distinct() {
    return this.queryBuilder().distinct(...arguments)
  }
  TargetClass.prototype.join = function join() {
    return this.queryBuilder().join(...arguments)
  }
  TargetClass.prototype.joinRaw = function joinRaw() {
    return this.queryBuilder().joinRaw(...arguments)
  }
  TargetClass.prototype.innerJoin = function innerJoin() {
    return this.queryBuilder().innerJoin(...arguments)
  }
  TargetClass.prototype.leftJoin = function leftJoin() {
    return this.queryBuilder().leftJoin(...arguments)
  }
  TargetClass.prototype.leftOuterJoin = function leftOuterJoin() {
    return this.queryBuilder().leftOuterJoin(...arguments)
  }
  TargetClass.prototype.rightJoin = function rightJoin() {
    return this.queryBuilder().rightJoin(...arguments)
  }
  TargetClass.prototype.rightOuterJoin = function rightOuterJoin() {
    return this.queryBuilder().rightOuterJoin(...arguments)
  }
  TargetClass.prototype.outerJoin = function outerJoin() {
    return this.queryBuilder().outerJoin(...arguments)
  }
  TargetClass.prototype.fullOuterJoin = function fullOuterJoin() {
    return this.queryBuilder().fullOuterJoin(...arguments)
  }
  TargetClass.prototype.crossJoin = function crossJoin() {
    return this.queryBuilder().crossJoin(...arguments)
  }
  TargetClass.prototype.where = function where() {
    return this.queryBuilder().where(...arguments)
  }
  TargetClass.prototype.andWhere = function andWhere() {
    return this.queryBuilder().andWhere(...arguments)
  }
  TargetClass.prototype.orWhere = function orWhere() {
    return this.queryBuilder().orWhere(...arguments)
  }
  TargetClass.prototype.whereNot = function whereNot() {
    return this.queryBuilder().whereNot(...arguments)
  }
  TargetClass.prototype.orWhereNot = function orWhereNot() {
    return this.queryBuilder().orWhereNot(...arguments)
  }
  TargetClass.prototype.whereRaw = function whereRaw() {
    return this.queryBuilder().whereRaw(...arguments)
  }
  TargetClass.prototype.whereWrapped = function whereWrapped() {
    return this.queryBuilder().whereWrapped(...arguments)
  }
  TargetClass.prototype.havingWrapped = function havingWrapped() {
    return this.queryBuilder().havingWrapped(...arguments)
  }
  TargetClass.prototype.orWhereRaw = function orWhereRaw() {
    return this.queryBuilder().orWhereRaw(...arguments)
  }
  TargetClass.prototype.whereExists = function whereExists() {
    return this.queryBuilder().whereExists(...arguments)
  }
  TargetClass.prototype.orWhereExists = function orWhereExists() {
    return this.queryBuilder().orWhereExists(...arguments)
  }
  TargetClass.prototype.whereNotExists = function whereNotExists() {
    return this.queryBuilder().whereNotExists(...arguments)
  }
  TargetClass.prototype.orWhereNotExists = function orWhereNotExists() {
    return this.queryBuilder().orWhereNotExists(...arguments)
  }
  TargetClass.prototype.whereIn = function whereIn() {
    return this.queryBuilder().whereIn(...arguments)
  }
  TargetClass.prototype.orWhereIn = function orWhereIn() {
    return this.queryBuilder().orWhereIn(...arguments)
  }
  TargetClass.prototype.whereNotIn = function whereNotIn() {
    return this.queryBuilder().whereNotIn(...arguments)
  }
  TargetClass.prototype.orWhereNotIn = function orWhereNotIn() {
    return this.queryBuilder().orWhereNotIn(...arguments)
  }
  TargetClass.prototype.whereNull = function whereNull() {
    return this.queryBuilder().whereNull(...arguments)
  }
  TargetClass.prototype.orWhereNull = function orWhereNull() {
    return this.queryBuilder().orWhereNull(...arguments)
  }
  TargetClass.prototype.whereNotNull = function whereNotNull() {
    return this.queryBuilder().whereNotNull(...arguments)
  }
  TargetClass.prototype.orWhereNotNull = function orWhereNotNull() {
    return this.queryBuilder().orWhereNotNull(...arguments)
  }
  TargetClass.prototype.whereBetween = function whereBetween() {
    return this.queryBuilder().whereBetween(...arguments)
  }
  TargetClass.prototype.whereNotBetween = function whereNotBetween() {
    return this.queryBuilder().whereNotBetween(...arguments)
  }
  TargetClass.prototype.andWhereBetween = function andWhereBetween() {
    return this.queryBuilder().andWhereBetween(...arguments)
  }
  TargetClass.prototype.andWhereNotBetween = function andWhereNotBetween() {
    return this.queryBuilder().andWhereNotBetween(...arguments)
  }
  TargetClass.prototype.orWhereBetween = function orWhereBetween() {
    return this.queryBuilder().orWhereBetween(...arguments)
  }
  TargetClass.prototype.orWhereNotBetween = function orWhereNotBetween() {
    return this.queryBuilder().orWhereNotBetween(...arguments)
  }
  TargetClass.prototype.groupBy = function groupBy() {
    return this.queryBuilder().groupBy(...arguments)
  }
  TargetClass.prototype.groupByRaw = function groupByRaw() {
    return this.queryBuilder().groupByRaw(...arguments)
  }
  TargetClass.prototype.orderBy = function orderBy() {
    return this.queryBuilder().orderBy(...arguments)
  }
  TargetClass.prototype.orderByRaw = function orderByRaw() {
    return this.queryBuilder().orderByRaw(...arguments)
  }
  TargetClass.prototype.union = function union() {
    return this.queryBuilder().union(...arguments)
  }
  TargetClass.prototype.unionAll = function unionAll() {
    return this.queryBuilder().unionAll(...arguments)
  }
  TargetClass.prototype.having = function having() {
    return this.queryBuilder().having(...arguments)
  }
  TargetClass.prototype.havingRaw = function havingRaw() {
    return this.queryBuilder().havingRaw(...arguments)
  }
  TargetClass.prototype.orHaving = function orHaving() {
    return this.queryBuilder().orHaving(...arguments)
  }
  TargetClass.prototype.orHavingRaw = function orHavingRaw() {
    return this.queryBuilder().orHavingRaw(...arguments)
  }
  TargetClass.prototype.offset = function offset() {
    return this.queryBuilder().offset(...arguments)
  }
  TargetClass.prototype.limit = function limit() {
    return this.queryBuilder().limit(...arguments)
  }
  TargetClass.prototype.count = function count() {
    return this.queryBuilder().count(...arguments)
  }
  TargetClass.prototype.countDistinct = function countDistinct() {
    return this.queryBuilder().countDistinct(...arguments)
  }
  TargetClass.prototype.min = function min() {
    return this.queryBuilder().min(...arguments)
  }
  TargetClass.prototype.max = function max() {
    return this.queryBuilder().max(...arguments)
  }
  TargetClass.prototype.sum = function sum() {
    return this.queryBuilder().sum(...arguments)
  }
  TargetClass.prototype.sumDistinct = function sumDistinct() {
    return this.queryBuilder().sumDistinct(...arguments)
  }
  TargetClass.prototype.avg = function avg() {
    return this.queryBuilder().avg(...arguments)
  }
  TargetClass.prototype.avgDistinct = function avgDistinct() {
    return this.queryBuilder().avgDistinct(...arguments)
  }
  TargetClass.prototype.increment = function increment() {
    return this.queryBuilder().increment(...arguments)
  }
  TargetClass.prototype.decrement = function decrement() {
    return this.queryBuilder().decrement(...arguments)
  }
  TargetClass.prototype.first = function first() {
    return this.queryBuilder().first(...arguments)
  }
  TargetClass.prototype.debug = function debug() {
    return this.queryBuilder().debug(...arguments)
  }
  TargetClass.prototype.pluck = function pluck() {
    return this.queryBuilder().pluck(...arguments)
  }
  TargetClass.prototype.insert = function insert() {
    return this.queryBuilder().insert(...arguments)
  }
  TargetClass.prototype.update = function update() {
    return this.queryBuilder().update(...arguments)
  }
  TargetClass.prototype.returning = function returning() {
    return this.queryBuilder().returning(...arguments)
  }
  TargetClass.prototype.del = function del() {
    return this.queryBuilder().del(...arguments)
  }
  TargetClass.prototype.delete = TargetClass.prototype.del

  TargetClass.prototype.truncate = function truncate() {
    return this.queryBuilder().truncate(...arguments)
  }
  TargetClass.prototype.transacting = function transacting() {
    return this.queryBuilder().transacting(...arguments)
  }
  TargetClass.prototype.connection = function connection() {
    return this.queryBuilder().connection(...arguments)
  }

}
