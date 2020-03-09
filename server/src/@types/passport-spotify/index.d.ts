declare module 'passport-spotify' {

    import { Strategy as BaseStrategy } from 'passport-strategy';

    export class Strategy extends BaseStrategy {

        constructor(options: {
            clientID: string,
            clientSecret: string,
            callbackURL: string,
        }, auth: (
            accessToken: string,
            refreshToken: string,
            expires_in: number,
            profile: any,
            done: (err: any, done?: any) => void,
        ) => unknown)

    }

}