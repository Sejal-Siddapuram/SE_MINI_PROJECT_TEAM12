const app = require('./app');
const { PORT } = require('./config/env');
const { connectDB } = require('./config/db');
const ensureAdminExists = require('./utils/seedAdmin');

async function start() {
  try {
    await connectDB();
    await ensureAdminExists();
    app.listen(PORT, () => {
      console.log(`[server] CampusReady API running at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
