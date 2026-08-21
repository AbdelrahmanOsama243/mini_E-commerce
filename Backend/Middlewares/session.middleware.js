const session = require("express-session");
const store = require("../Config/RedisStore");

const sessionMiddleware = session({
  store: store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
});

module.exports = sessionMiddleware;
