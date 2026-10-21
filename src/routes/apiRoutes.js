import express from 'express';
const router = express.Router();
import v1Router from './v1/v1Router.js';
import { requireDatabase } from '../middlewares/dbMiddleware.js';

// Answer 503 straight away when MongoDB is unreachable instead of letting
// Mongoose buffer the query until it times out after 10 seconds.
router.use(requireDatabase);

router.use('/v1',v1Router);
export default router;
