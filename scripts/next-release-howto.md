# Checklist for crating knex @next releases

1. Go through all commits since the last release and add them to CHANGELOG.md under unreleased changes section.
2. Commit changes to CHANGELOG
3. Check that master compiles and tests are running fine (check also that CI tests are passing)

```sh
      npm run build

      # run bunch of tests, but skipping coverage which doesn't really work locally at least
      npm plaintest
      npm bin_test
      npm oracledb:test
      npm mssql:init
      npm mssql:test
      npm mssql:destroy
```

4. Update package.json version to be e.g. 0.16.0-next1 or 0.16.0-next2 and commit yo master
5. Publish it under @next tag 

```sh
      npm publish --tag next
```
