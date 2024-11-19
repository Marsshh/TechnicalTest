import { saveTelemetry } from '../src/db/telemetry';

const testSaveTelemetry = async () => {
    try {
        const telemetry = await saveTelemetry(1, 'humidity', 75.5); 
        console.log('Telemetry saved:', telemetry);
    } catch (error) {
        console.error('Error saving telemetry:', error);
    }
};

testSaveTelemetry();
