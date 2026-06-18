# [knex.js](http://knexjs.org)

[![npm バージョン](http://img.shields.io/npm/v/knex.svg)](https://npmjs.org/package/knex)
[![npm ダウンロード](https://img.shields.io/npm/dm/knex.svg)](https://npmjs.org/package/knex)
![](https://github.com/knex/knex/workflows/CI/badge.svg)
[![カバレッジステータス](https://coveralls.io/repos/knex/knex/badge.svg?branch=master)](https://coveralls.io/r/knex/knex?branch=master)
[![デペンデンシーステータス](https://david-dm.org/knex/knex.svg)](https://david-dm.org/knex/knex)
[![Gitter チャット](https://badges.gitter.im/tgriesser/knex.svg)](https://gitter.im/tgriesser/knex)
[![言語グレード : JavaScript](https://img.shields.io/lgtm/grade/javascript/g/knex/knex.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/knex/knex/context:javascript)

> **_フレキシブル_で、 _ポータブル_、そして _楽しく_ 使える　SQL クエリビルダー!**

すぐに使い始められて、多数の言語対応(MSSQL, MySQL, PostgreSQL, SQLite3, Oracle (Oracle Wallet 認証も含む)) Node.js用のクエリビルダーです。特徴：

- [トランザクション](https://knexjs.org/#Transactions)
- [コネクションプーリング](https://knexjs.org/#Installation-pooling)
- [クエリのストリーミング　](https://knexjs.org/#Interfaces-Streams)
- [プロミス](https://knexjs.org/#Interfaces-Promises) もしくは [コールバック](https://knexjs.org/#Interfaces-Callbacks) のAPI
- [テストスイーツを通る](https://github.com/knex/knex/actions)

Node.js versions 10以上をサポートしています。

* [全ドキュメンテーション](https://knexjs.org) を読み、使い始めてください!
* knexをビルドするには [プラグインとツールのリスト](https://github.com/knex/knex/blob/master/ECOSYSTEM.md) をブラウジングしてください。
* 問題の解決策を探すために [wiki　レシピ](https://github.com/knex/knex/wiki/Recipes)をチェックしてください。 
* 古いバージョンにアップグレードしなければいけなくなった場合は、[マイグレーションガイド](https://github.com/knex/knex/blob/master/UPGRADING.md)をご覧ください。

 [GitHub 討論ページ](https://github.com/knex/knex/issues) でバグの報告や機能についての話し合いができます。または [@kibertoad](http://twitter.com/kibertoad)までツイートを送信してください。

 サポートやご質問がございましたら [Gitter チャンネル](https://gitter.im/tgriesser/knex)にご参加ください。

knexベースの オブジェクト関係マッピングに関しては以下をご覧ください:

- https://github.com/Vincit/objection.js
- https://github.com/mikro-orm/mikro-orm
- https://bookshelfjs.org

与えられたクエリからknexが生成するSQLをご覧になるには [Knex クエリラボ](https://michaelavila.com/knex-querylab/)をご利用ください。

## 例

[Webサイト](http://knexjs.org)に幾つかの例があります。こちらが一番初めの一歩になります:

```js
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './data.db',
  },
});

try {

  // テーブルの作成
  await knex.schema
    .createTable('users', table => {
      table.increments('id');
      table.string('user_name');
    })
    // ...その他
    .createTable('accounts', table => {
      table.increments('id');
      table.string('account_name');
      table
        .integer('user_id')
        .unsigned()
        .references('users.id');
    })

  // そして、そのテーブルをクエリします...
  const insertedRows = await knex('users').insert({ user_name: 'Tim' })

  // ...and using the insert id, insert into the other table.
//...そしてidの挿入を使用して、他のテーブルを挿入します。
  await knex('accounts').insert({ account_name: 'knex', user_id: insertedRows[0] })

  // 両方の列をクエリします
  const selectedRows = await knex('users')
    .join('accounts', 'users.id', 'accounts.user_id')
    .select('users.user_name as user', 'accounts.account_name as account')

  // 結果にmapを適用します
  const enrichedRows = selectedRows.map(row => ({ ...row, active: true }))

  // 最後にキャッチステートメントを加えます
} catch(e) {
  console.error(e);
};
```

## TypeScript の例
```ts
import { Knex, knex } from 'knex'

interface User {
  id: number;
  age: number;
  name: string;
  active: boolean;
  departmentId: number;
}

const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: './data.db',
  },
};

const knexInstance = knex(config);

try {
  const users = await knex<User>('users').select('id', 'age');
} catch (err) {
  // エラーハンドリング
}
```
##  ESMモジュールの使い方


もしNode アプリケーションを`--experimental-modules`で起動させているのなら、`knex.mjs`が自動的に選択され、名前のついたESM import がすぐに使えます。
しかしながら、もし名前のあるインポートを使用したいのなら、以下のようにknexをインポートする必要があります：
```js
import { knex } from 'knex/knex.mjs'
```

デフォルトインポートをそのままお使いになってもいいです：
```js
import knex from 'knex'
```


もしTypeScriptをお使いにならないで、IDEにIntelliSenseを正常に作動させたい場合、typeをはっきり明記することをおすすめします：
```js
/**
 * @type {Knex}
 */
const database = knex({
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      user : 'your_database_user',
      password : 'your_database_password',
      database : 'myapp_test'
    }
  });
database.migrate.latest();
```

