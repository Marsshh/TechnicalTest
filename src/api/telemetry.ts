import express, { Request, Response, NextFunction } from "express";
import { checkJwt, checkAdminRole } from "../utils/auth"; 
import { getAllSensors, saveSensor } from "../db/sensors"; 
import pool from "../db/index"; 

const router = express.Router();

// get sensors
router.get(
  "/sensors",
  checkJwt as unknown as (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const sensors = await getAllSensors(); 
      res.json(sensors); 
    } catch (error) {
      console.error("Error fetching sensors:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// get sensor types
router.get(
  "/sensors/types",
  checkJwt as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const query = "SELECT DISTINCT type FROM sensors";
      const result = await pool.query(query);

      if (result.rows.length === 0) {
        res.status(404).json({ message: "No sensor types found" });
        return;
      }

      res.json(result.rows.map((row) => row.type));
    } catch (error) {
      console.error("Error fetching sensor types:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Get keys by sensor type
router.get(
  "/sensors/:type/keys",
  checkJwt as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response): Promise<void> => {
    const { type } = req.params;

    try {
      const query = `
        SELECT DISTINCT key 
        FROM telemetry t
        INNER JOIN sensors s ON t.sensor_id = s.id
        WHERE s.type = $1
      `;
      const result = await pool.query(query, [type]);

      if (result.rows.length === 0) {
        res.status(404).json({ message: "No keys found for the given sensor type" });
        return;
      }

      res.json(result.rows.map((row) => row.key));
    } catch (error) {
      console.error("Error fetching keys for sensor type:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Get sensors by type
router.get(
  "/sensors/by-type/:type",
  checkJwt as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response): Promise<void> => {
    const { type } = req.params;

    try {
      const query = `
        SELECT id, type, location, created_at 
        FROM sensors
        WHERE type = $1
      `;
      const result = await pool.query(query, [type]);

      if (result.rows.length === 0) {
        res.status(404).json({ message: "No sensors found for the given type" });
        return;
      }

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching sensors by type:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// summary
router.get(
    "/telemetry/summary",
    checkJwt as unknown as (
      req: Request,
      res: Response,
      next: NextFunction
    ) => void,
    async (req: Request, res: Response): Promise<void> => {
      const { sensorId, from, to } = req.query;
  
      
      if (from && isNaN(Date.parse(from as string))) {
        res.status(400).json({ message: '"from" parameter is not a valid date' });
        return;
      }
      if (to && isNaN(Date.parse(to as string))) {
        res.status(400).json({ message: '"to" parameter is not a valid date' });
        return;
      }
      if (sensorId && isNaN(Number(sensorId))) {
        res
          .status(400)
          .json({ message: '"sensorId" parameter is not a valid number' });
        return;
      }
  
      try {
        let query = `
          SELECT key, 
                 AVG(value::numeric) AS average, 
                 MIN(value::numeric) AS minimum, 
                 MAX(value::numeric) AS maximum
          FROM telemetry
          WHERE 1=1
        `;
        const params: any[] = [];
  
        if (sensorId) {
          query += ` AND sensor_id = $${params.length + 1}`;
          params.push(sensorId);
        }
        if (from) {
          query += ` AND timestamp >= $${params.length + 1}`;
          params.push(new Date(from as string));
        }
        if (to) {
          query += ` AND timestamp <= $${params.length + 1}`;
          params.push(new Date(to as string));
        }
  
        query += " GROUP BY key";
  
        const result = await pool.query(query, params);
  
        if (result.rows.length === 0) {
          res.status(404).json({ message: "No summary data found" });
          return;
        }
  
        // parseFloat results
        const formattedRows = result.rows.map((row) => ({
          key: row.key,
          average: parseFloat(row.average).toFixed(2),
          minimum: parseFloat(row.minimum).toFixed(2),
          maximum: parseFloat(row.maximum).toFixed(2),
        }));
  
        res.json(formattedRows);
      } catch (error) {
        console.error("Error fetching telemetry summary:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  );
  
// Get the n-latest telemetry data points per sensor and key
router.get(
  "/telemetry/latest",
  checkJwt as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response): Promise<void> => {
    const { sensorId, key, limit } = req.query;

    if (!sensorId || isNaN(Number(sensorId))) {
      res.status(400).json({ message: '"sensorId" parameter is required and must be a valid number' });
      return;
    }
    if (!key) {
      res.status(400).json({ message: '"key" parameter is required' });
      return;
    }
    if (!limit || isNaN(Number(limit))) {
      res.status(400).json({ message: '"limit" parameter is required and must be a valid number' });
      return;
    }

    try {
      const query = `
        SELECT id, sensor_id, key, value, timestamp 
        FROM telemetry
        WHERE sensor_id = $1 AND key = $2
        ORDER BY timestamp DESC
        LIMIT $3
      `;
      const result = await pool.query(query, [sensorId, key, limit]);

      if (result.rows.length === 0) {
        res.status(404).json({ message: "No telemetry data found" });
        return;
      }

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching latest telemetry data:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Get the n-latest telemetry data points per sensor and location / area
router.get(
  "/telemetry/latest/location",
  checkJwt as unknown as (req: Request, res: Response, next: NextFunction) => void,
  async (req: Request, res: Response): Promise<void> => {
    const { lat, lng, radius, limit } = req.query;

    if (!lat || isNaN(Number(lat)) || !lng || isNaN(Number(lng))) {
      res.status(400).json({ message: '"lat" and "lng" parameters are required and must be valid numbers' });
      return;
    }
    if (!radius || isNaN(Number(radius))) {
      res.status(400).json({ message: '"radius" parameter is required and must be a valid number' });
      return;
    }
    if (!limit || isNaN(Number(limit))) {
      res.status(400).json({ message: '"limit" parameter is required and must be a valid number' });
      return;
    }

    try {
      const query = `
        SELECT t.id, t.sensor_id, t.key, t.value, t.timestamp, s.location
        FROM telemetry t
        INNER JOIN sensors s ON t.sensor_id = s.id
        WHERE ST_DWithin(
          s.location::geography,
          ST_MakePoint($1, $2)::geography,
          $3
        )
        ORDER BY t.timestamp DESC
        LIMIT $4
      `;
      const result = await pool.query(query, [lng, lat, radius, limit]);

      if (result.rows.length === 0) {
        res.status(404).json({ message: "No telemetry data found within the specified area" });
        return;
      }

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching telemetry data by location:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);



// create Sensor (POST)
router.post(
    "/sensors",
    checkJwt as unknown as (req: Request, res: Response, next: NextFunction) => void,
    checkAdminRole,
    async (req: Request, res: Response): Promise<void> => {
      const { type, location } = req.body;
      try {
        const sensor = await saveSensor(type, location);
        res.status(201).json(sensor);
      } catch (error) {
        console.error("Error creating sensor:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  );
  
  // update Sensor (PUT)
  router.put(
    "/sensors/:id",
    checkJwt as unknown as (req: Request, res: Response, next: NextFunction) => void,
    checkAdminRole,
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const { type, location } = req.body;
      try {
        const query = `
          UPDATE sensors SET type = $1, location = ST_SetSRID(ST_Point($2, $3), 4326)
          WHERE id = $4 RETURNING *;
        `;
        const result = await pool.query(query, [type, location.lng, location.lat, id]);
        if (result.rows.length === 0) {
          res.status(404).json({ message: "Sensor not found" });
          return;
        }
        res.json(result.rows[0]);
      } catch (error) {
        console.error("Error updating sensor:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  );
  
  // New telemetry (POST)
  router.post(
    "/telemetry",
    checkJwt as unknown as (req: Request, res: Response, next: NextFunction) => void,
    checkAdminRole,
    async (req: Request, res: Response): Promise<void> => {
      const { sensorId, key, value } = req.body;
      try {
        const query = `
          INSERT INTO telemetry (sensor_id, key, value) 
          VALUES ($1, $2, $3) RETURNING *;
        `;
        const result = await pool.query(query, [sensorId, key, value]);
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error("Error adding telemetry:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  );
  
  //  (DELETE)
  router.delete(
    "/telemetry/:id",
    checkJwt as unknown as (req: Request, res: Response, next: NextFunction) => void,
    checkAdminRole,
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      try {
        const query = `DELETE FROM telemetry WHERE id = $1 RETURNING *;`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
          res.status(404).json({ message: "Telemetry not found" });
          return;
        }
        res.json(result.rows[0]);
      } catch (error) {
        console.error("Error deleting telemetry:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  );

export default router;
