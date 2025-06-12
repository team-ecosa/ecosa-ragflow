module.exports = {
  apps: [
    {
      name: 'ecosa-ragflow-web',
      script: './server.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 9280,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      time: true,
    },
  ],
};
