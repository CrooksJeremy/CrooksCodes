require('dotenv').config();
const app = require('./app');

if (!process.env.ADMIN_TOKEN) {
  console.warn('⚠️  WARNING: ADMIN_TOKEN not set in .env file!');
  console.warn('   Protected routes will not work.');
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});