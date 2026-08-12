const session = require("express-session");
const redisStore = require("connect-redis");
const redisClient = require("./Redis");

const RedisStore = redisStore(session);

const store = new RedisStore({
  client: redisClient.client,
  prefix: "session:",
  disableTouch: true,
  disableTouchOnDestroy: true,
});

module.exports = store;
