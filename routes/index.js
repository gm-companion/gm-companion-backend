const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'gm-companion' });
});

router.get('/test', (req, res) => {
  res.send('Hello World!');
});

module.exports = router;
