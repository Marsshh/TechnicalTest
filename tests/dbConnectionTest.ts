import pool from '../src/db';

const testDbConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW();');
        console.log('Database connection successful:', result.rows[0]);
    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        pool.end();
    }
};

testDbConnection();
