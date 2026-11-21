const router = require('express').Router();
const c = require('../controllers/showController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const admins = [protect, authorize('theatreAdmin', 'superAdmin')];

router.get('/', c.list);
router.get('/manage', ...admins, c.manage); // keep above '/:id'
router.get('/:id', c.get);
router.post('/', ...admins, c.create);
router.put('/:id', ...admins, c.update);
router.delete('/:id', ...admins, c.remove);

module.exports = router;
