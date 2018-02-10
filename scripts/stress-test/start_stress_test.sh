# To run this test you need to be in this directory + have node >= 8
docker-compose up --no-start
docker-compose start
node stress-test.js | grep -A 3 -- "- STATS "
docker-compose down
