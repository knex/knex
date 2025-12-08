# Warning: Dead Code

The `oracle` dialect is mostly dead code at this point. However, a handful of its methods are still referenced by the `oracledb` dialect. So, we are in the process of migrating those methods over to the `oracledb` dialect where they belong. Once that task is completed, we will officially remove the `oracle` dialect.

In short: do not use the `oracle` dialect. Use the `oracledb` dialect instead.
