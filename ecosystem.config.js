module.exports = {
  apps: [
    {
      name: 'devocionales-api',
      cwd: '/var/www/devocionales4.0/packages/backend',
      script: 'dist/index.js',
      instances: 1, // Solo 1 instancia en 2GB RAM
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      max_memory_restart: '400M', // Reiniciar si excede 400MB
      error_file: '/var/log/devocionales/api-error.log',
      out_file: '/var/log/devocionales/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart strategy
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      // Monitoreo
      watch: false
    }
  ]
};
