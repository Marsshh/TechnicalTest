import pool from './index';

export const saveTelemetry = async (sensorId: number, key: string, value: number) => {
    const query = `
        INSERT INTO telemetry (sensor_id, key, value)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [sensorId, key, value];
    const result = await pool.query(query, values);
    return result.rows[0];
};
