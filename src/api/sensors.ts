import express from 'express';
import { getAllSensors } from '../db/sensors';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const sensors = await getAllSensors();
        res.json(sensors);
    } catch (error) {
        res.status(500).send('Error retrieving sensors');
    }
});

export default router;
