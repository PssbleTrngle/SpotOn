require('dotenv').config()

export const HOST = process.env.HOST || 'localhost';
export const PORT = process.env.PORT || 8080;

export const DEBUG = process.env.DEBUG === 'true';
export const FORCE_DB = false;

export const CLIENT_ID = process.env.CLIENT_ID as string;
export const CLIENT_SECRET = process.env.CLIENT_SECRET as string;
if(!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('No client secret/id defined as enviroment variables!');
}

export const REDIRECT_URL = `http://${HOST}:${PORT}/authorize`
export const SCOPES = [
    'streaming',
    'user-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'user-library-read',
    'user-read-recently-played',
];

export const API_URL = 'https://api.spotify.com/v1/';
export const CLIENT_URL = DEBUG ? 'http://localhost:3000' : '/';

export const SESSION_SECRET = 'Yasaasasas'