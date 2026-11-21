const router = require('express').Router();
const c = require('../controllers/screenController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const admins = [protect, authorize('theatreAdmin', 'superAdmin')];

router.get('/', c.list);
router.get('/mine', ...admins, c.mine);
router.post('/', ...admins, c.create);
router.delete('/:id', ...admins, c.remove);

module.exports = router;
