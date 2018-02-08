
import { isString, tail } from 'lodash'
import ColumnCompiler from './columncompiler'
import TableCompiler from './tablecompiler'
import SchemaCompiler from './compiler'

// Push a new query onto the compiled "sequence" stack,
// creating a new formatter, returning the compiler.
export function pushQuery(query) {
  if (!query) return;
  if (isString(query)) {
    query = {sql: query};
  }
  if (!query.bindings) {
    query.bindings = this.formatter.bindings;
  }
  this.sequence.push(query);

  let builder;
  if (this instanceof ColumnCompiler) {
    builder = this.columnBuilder;
  } else if (this instanceof TableCompiler) {
    builder = this.tableBuilder;
  } else if (this instanceof SchemaCompiler) {
    builder = this.builder;
  }

  this.formatter = this.client.formatter(builder);
}

// Used in cases where we need to push some additional column specific statements.
export function pushAdditional(fn) {
  const child = new this.constructor(this.client, this.tableCompiler, this.columnBuilder);
  fn.call(child, tail(arguments));
  this.sequence.additional = (this.sequence.additional || []).concat(child.sequence);
}
