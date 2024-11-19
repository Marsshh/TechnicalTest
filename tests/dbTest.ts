import pool from '../src/db/index'

const testDbConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW();');
        console.log('Database connected successfully:', result.rows[0]);
    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        pool.end();
    }
};

testDbConnection();
