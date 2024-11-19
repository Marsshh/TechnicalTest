import './utils/scheduler';
import express from 'express';
import telemetryRouter from './api/telemetry';

console.log('Application started!');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api', telemetryRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


