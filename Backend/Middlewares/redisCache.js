const redisRepo = require('../Repos/Redis.Repo');
const logger = require('../Config/logger');

/**
 * Universal Redis Cache-Aside & HTTP Cache Middleware (Option B)
 * @param {number} redisTTL - Cache TTL in seconds for Redis (default: 3600s / 1 hour)
 * @param {number} httpMaxAge - HTTP Cache-Control max-age in seconds for browsers (default: 300s / 5 min)
 */
const redisCache = (redisTTL = 3600, httpMaxAge = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      res.set('Cache-Control', 'no-store');
      return next();
    }

    // Set HTTP Cache-Control Header
    if (httpMaxAge > 0) {
      res.set('Cache-Control', `public, max-age=${httpMaxAge}`);
    } else {
      res.set('Cache-Control', 'no-cache');
    }

    const cacheKey = `cache:GET:${req.originalUrl}`;

    try {
      const cachedData = await redisRepo.get(cacheKey);

      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.status(200).json(cachedData);
      }

      res.set('X-Cache', 'MISS');

      // Monkey-patch res.json to capture response and store in Redis on success
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Only cache successful 200 responses
        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          redisRepo.set(cacheKey, body, redisTTL).catch((err) => {
            logger.warn({ err: err.message, cacheKey }, 'Failed to write cache in redisCache middleware');
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.warn({ err: error.message, cacheKey }, 'Redis cache middleware error — bypassing to controller');
      next();
    }
  };
};

/**
 * Cache Invalidation Middleware
 * Deletes keys matching patterns from Redis on successful mutation operations
 * @param {string|string[]} patterns - Key pattern(s) to invalidate (e.g. 'cache:GET:/api/products*')
 */
const invalidateCache = (patterns) => {
  const patternList = Array.isArray(patterns) ? patterns : [patterns];

  return (req, res, next) => {
    // Hook into response finish event to invalidate cache after DB mutation succeeds
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        patternList.forEach((pattern) => {
          redisRepo.deleteByPattern(pattern).catch((err) => {
            logger.warn({ err: err.message, pattern }, 'Failed to invalidate cache pattern');
          });
        });
      }
    });

    next();
  };
};

module.exports = {
  redisCache,
  invalidateCache,
};
