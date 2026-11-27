const router = require('express').Router();
const c = require('../controllers/theatreAdminApplicationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', c.submit);
router.get('/', protect, authorize('superAdmin'), c.list);
router.patch('/:id/approve', protect, authorize('superAdmin'), c.approve);
router.patch('/:id/reject', protect, authorize('superAdmin'), c.reject);

module.exports = router;
