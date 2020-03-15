import bodyParser from 'body-parser';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
import express, { NextFunction } from 'express';
import { ParamsDictionary, Request, Response } from 'express-serve-static-core';
import { Server } from 'http';
import { DEBUG, PORT } from './config';
import AuthController from './controllers/authorization';
import LabelsController from './controllers/labels';
import PlaylistController from './controllers/playlists';
import TrackCOntroller from './controllers/tracks';
import UserController from './controllers/user';
import Database from './database';
import { ValidateError } from './models/Operator';
import User from './models/User';

export const error = (...s: unknown[]) => console.log(chalk.red('❌ ', ...s));
export const info = (...s: unknown[]) => console.log(chalk.cyanBright(...s));
export const success = (...s: unknown[]) => console.log(chalk.greenBright('✔ ', ...s));
export const warn = (...s: unknown[]) => console.log(chalk.yellow('⚠ ', ...s));
export const debug = DEBUG ? (...s: unknown[]) => console.log(chalk.bgGray.white(...s)) : () => { }

export const exists = (e => !!e) as <T>(e: T | null | undefined | void) => e is T;

info('Starting server...');

const app: App = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

type R = {
    success: true,
    data?: any,
} | {
    success: false,
    reason: string,
    [key: string]: any,
}
export type APIResponse = Response<R>;
export type APIRequest = Request<ParamsDictionary, APIResponse, any> & {
    user: User
};
export type ApiFunc<R extends Request = APIRequest> = (req: R, res: APIResponse, next: NextFunction) => unknown;
export type App = {
    get(url: string, ...func: ApiFunc[]): unknown,
    post(url: string, ...func: ApiFunc[]): unknown,
    use(url: string, ...func: ApiFunc[]): unknown,
} & express.Express;

[
    AuthController,
    PlaylistController,
    LabelsController,
    UserController,
    TrackCOntroller,
].forEach(c => c.register(app as App));

async function start() {

    try {
        await Database.setup();

        return new Promise<Server>(res => {
            const server = app.listen(PORT, () => {
                success(`Server started on port ${chalk.underline(PORT)}`);
                console.log('');
                res(server);
            })
        });

    } catch (e) {
        error('Encountered an error on server startup')
        console.log(e);
    }

}

start();
