module.exports = {
  apps: [
    {
      name: 'mini-ecommerce-backend',
      script: './server.js',
      instances: 4,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
