const { RedisStore } = require("connect-redis");
const redisClient = require("./Redis");



const store = new RedisStore({
  client: redisClient.redisClient,
  prefix: "session:",
  disableTouch: true,
  disableTouchOnDestroy: true,
});

module.exports = store;
