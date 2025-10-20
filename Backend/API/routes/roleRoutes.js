const express = require('express');
const router = express.Router();

const RoleController = require('../Controller/RoleController');

router.get('/', RoleController.getAll);
router.get('/:name', RoleController.getByName);
router.post('/', RoleController.create);
router.put('/:name', RoleController.update);
router.delete('/:name', RoleController.delete);


module.exports = router;