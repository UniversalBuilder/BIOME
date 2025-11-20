const express = require('express');
const os = require('os');

const router = express.Router();

router.get('/username', (req, res) => {
  try {
    const info = os.userInfo();
    const envUser = process.env.USERNAME || process.env.USER || null;
    const username = (info && info.username) || envUser || 'unknown';
    res.json({ username });
  } catch (e) {
    const envUser = process.env.USERNAME || process.env.USER || 'unknown';
    res.json({ username: envUser });
  }
});

module.exports = router;
