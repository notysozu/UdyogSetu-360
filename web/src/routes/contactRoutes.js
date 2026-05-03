const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const contact = require('../controllers/contactController');

const router = express.Router();

router.get('/contact', contact.showContactForm);
router.post('/contact', asyncHandler(contact.createContactRequest));

module.exports = router;
