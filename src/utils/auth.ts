import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { expressjwt } from 'express-jwt';
import jwks from 'jwks-rsa';
import dotenv from 'dotenv';

dotenv.config();

// Middleware JWT
export const checkJwt = expressjwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    }) as any,
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
});

// Middleware to check roles
export const checkAdminRole = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(403).json({ message: 'No token provided' });
        return;
    }

    try {
        const decoded = jwt.decode(token) as { [key: string]: any };
        const roles = decoded['https://arnau-riskfactor-app/roles'] || [];
        if (!roles.includes('admin')) {
            res.status(403).json({ message: 'Admin role required' });
            return;
        }
        next(); 
    } catch (error) {
        console.error('Error verifying roles:', error);
        res.status(403).json({ message: 'Invalid token or role' });
    }
};