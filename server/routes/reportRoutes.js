const router = require('express').Router();
const c = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect, authorize('theatreAdmin', 'superAdmin'));
router.get('/movies', c.byMovie);
router.get('/shows', c.byShow);

module.exports = router;
