const router = require('express').Router();
const c = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', c.create);
router.get('/my', c.my);
router.patch('/:id/cancel', c.cancel);

module.exports = router;
