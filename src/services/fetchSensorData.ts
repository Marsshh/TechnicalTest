import axios from 'axios';
import { saveSensor } from '../db/sensors';
import { saveTelemetry } from '../db/telemetry';
import dotenv from 'dotenv';


dotenv.config();

console.log('File fetchSensorData.ts is running!');

const SENSOR_URL = process.env.SENSOR_URL || '';
const AUTH = { 
    username: process.env.SENSOR_AUTH_USER || '', 
    password: process.env.SENSOR_AUTH_PASS || '' 
};

export const fetchSensorData = async () => {
    console.log('fetchSensorData function started'); 

    try {
        console.log('Attempting GET request to the sensor endpoint...');
        const response = await axios.get(SENSOR_URL, { auth: AUTH });

        console.log('Response received:', {
            status: response.status,
            headers: response.headers,
        });

        const sensorDocs = response.data.docs;

        console.log('Documents received:', {
            count: Array.isArray(sensorDocs) ? sensorDocs.length : 'Invalid format',
            data: sensorDocs,
        });

        if (!Array.isArray(sensorDocs)) {
            throw new Error('Unexpected response format: docs is not an array');
        }

        for (const [index, doc] of sensorDocs.entries()) {
            console.log(`Processing document ${index + 1} of ${sensorDocs.length}:`, doc);

            const payload = doc.DecodedPayload;
            const metadata = doc.WirelessMetadata.LoRaWAN;

            if (!payload || !metadata) {
                console.warn('Skipping invalid document:', doc);
                continue;
            }

            console.log('Saving sensor...');
            const sensor = await saveSensor('environmental', { lat: 0, lng: 0 }); 
            console.log('Sensor saved:', sensor);

            console.log('Saving telemetry data...');
            for (const [key, value] of Object.entries(payload)) {
                console.log(`Saving telemetry: Key=${key}, Value=${value}`);
                await saveTelemetry(sensor.id, key, value as number);
            }

            console.log(`Data saved successfully for timestamp ${metadata.Timestamp}`);
        }

        console.log('All sensor data processed successfully!');
    } catch (error: any) {
        console.error('Error during fetchSensorData execution:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data || null,
        });
    }
};

if (require.main === module) {
    console.log('Calling fetchSensorData...');
    fetchSensorData()
        .then(() => console.log('fetchSensorData completed!'))
        .catch((error) => console.error('Error in fetchSensorData:', error));
}
