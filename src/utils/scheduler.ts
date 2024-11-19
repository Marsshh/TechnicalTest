import cron from 'node-cron';
import { fetchSensorData } from '../services/fetchSensorData';

console.log('Scheduler initialized!');

// Executes every 15 min
cron.schedule('*/15 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Running scheduled task: fetchSensorData`);
    try {
        await fetchSensorData();
        console.log(`[${new Date().toISOString()}] Scheduled task completed successfully!`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error during scheduled task:`, error);
    }
});
