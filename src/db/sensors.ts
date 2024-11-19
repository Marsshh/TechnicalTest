import pool from './index';

export const saveSensor = async (type: string, location: { lat: number; lng: number }) => {
    console.log(`Saving sensor: Type=${type}, Location=(${location.lat}, ${location.lng})`); 

    const query = `
        INSERT INTO sensors (type, location)
        VALUES ($1, ST_SetSRID(ST_Point($2, $3), 4326))
        RETURNING *;
    `;
    const values = [type, location.lng, location.lat];

    try {
        const result = await pool.query(query, values);
        console.log('Sensor saved:', result.rows[0]); 
        return result.rows[0];
    } catch (error) {
        console.error('Error saving sensor:', error); 
        throw error;
    }
};

export const getAllSensors = async () => {
    const query = `
        SELECT id, type, 
               ST_X(location::geometry) AS lng, 
               ST_Y(location::geometry) AS lat, 
               created_at
        FROM sensors;
    `;
    const result = await pool.query(query);
    return result.rows;
};
