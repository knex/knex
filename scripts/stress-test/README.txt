# Test scripts to evaluate stability of drivers / pool etc.

# To run this test you need to be in this directory + have node >= 8
# and startup docker containers with proxy and sql servers

docker-compose up --no-start
docker-compose start

# Select different test script to run:

node mysql2-random-hanging-every-now-and-then.js 2> /dev/null | grep -B500 -A2 -- "- STATS" 
node mysql2-sudden-exit-without-error
node knex-stress-test.js | grep -A 3 -- "- STATS "
node reconnect-test-mysql-based-drivers.js 2> /dev/null | grep -A 3 -- "- STATS "

# Shut down docker instances when done:

docker-compose down
