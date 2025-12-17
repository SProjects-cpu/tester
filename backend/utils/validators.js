import { body, param, query } from 'express-validator';

export const startupValidators = {
  create: [
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
    body('founderName').trim().notEmpty().withMessage('Founder name is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('sector').trim().notEmpty().withMessage('Sector is required')
  ],

  update: [
    param('id').isMongoId().withMessage('Invalid startup ID')
  ]
};

export const authValidators = {
  login: [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],

  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ]
};

export const smcValidators = {
  create: [
    body('startupId').isMongoId().withMessage('Invalid startup ID'),
    body('date').notEmpty().withMessage('Date is required'),
    body('timeSlot')
      .isIn(['10 AM', '11 AM', '2 PM', '3 PM'])
      .withMessage('Invalid time slot')
  ],

  complete: [
    param('id').isMongoId().withMessage('Invalid schedule ID'),
    body('panelistName').trim().notEmpty().withMessage('Panelist name is required'),
    body('feedback').trim().notEmpty().withMessage('Feedback is required')
  ]
};

export const guestValidators = {
  create: [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('email').optional().isEmail().withMessage('Valid email is required')
  ]
};
