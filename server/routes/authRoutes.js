const router = require('express').Router();
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/register', c.register);
router.post('/login', c.login);
router.post('/refresh', c.refresh);
router.post('/logout', protect, c.logout);
router.get('/me', protect, c.me);
router.post('/create-admin', protect, authorize('superAdmin'), c.createAdmin);

module.exports = router;
