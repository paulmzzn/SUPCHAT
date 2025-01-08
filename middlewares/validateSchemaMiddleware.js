// middlewares/validateSchemaMiddleware.js
import { validationResult } from 'express-validator';

export function validateSchemaMiddleware(schema) {
  return [
    ...schema,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    },
  ];
}