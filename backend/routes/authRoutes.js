const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Map endpoints directly to controller execution handlers
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;