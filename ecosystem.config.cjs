module.exports = {
  apps: [
    {
      name: "kids-assessment",
      script: "scripts/start-production.mjs",
      cwd: __dirname + "/..",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: "3000",
      },
    },
  ],
};
