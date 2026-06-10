# Extending

To extend knex's builders, we have the following methods

```js
knex.SchemaBuilder.extend('functionName', function () {
  console.log('Custom Schema Builder Function');
  return this;
});
knex.TableBuilder.extend('functionName', function () {
  console.log('Custom Table Builder Function');
  return this;
});
knex.ViewBuilder.extend('functionName', function () {
  console.log('Custom View Builder Function');
  return this;
});
knex.ColumnBuilder.extend('functionName', function () {
  console.log('Custom Column Builder Function');
  return this;
});
```

To add typescript support you can add the following (.d.ts):

```ts
import 'knex';
declare module 'knex' {
  namespace Knex {
    interface SchemaBuilder {
      functionName(): Knex.SchemaBuilder;
    }
    interface TableBuilder {
      functionName(): Knex.TableBuilder;
    }
    interface ViewBuilder {
      functionName(): Knex.ViewBuilder;
    }
    interface ColumnBuilder {
      functionName(): Knex.ColumnBuilder;
    }
  }
}
```
