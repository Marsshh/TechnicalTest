import { saveSensor } from '../src/db/sensors';

const testSaveSensor = async () => {
    try {
        const sensor = await saveSensor('temperature', { lat: 40.7128, lng: -74.0060 });
        console.log('Sensor saved:', sensor);
    } catch (error) {
        console.error('Error saving sensor:', error);
    }
};

testSaveSensor();
