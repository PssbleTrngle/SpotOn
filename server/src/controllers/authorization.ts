import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-spotify';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URL, SCOPES, SESSION_SECRET } from '../config';
import { ApiFunc, App } from '../index';
import User from '../models/User';

export default {
    register(app: App) {

        passport.serializeUser((user: any, done) => {
            done(null, user.id);
        });

        passport.deserializeUser((id: string, done) => {
            User.findByPk(id)
                .then(u => done(null, u))
                .catch(e => done(e));
        });

        passport.use(new Strategy({
            clientID: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            callbackURL: REDIRECT_URL,
        }, async (accessToken, refreshToken, expires, profile, done) => {
            User.findOrCreate({ where: { id: profile.id } })
                .then(r => r[0])
                .then(u => u.update({ accessToken, refreshToken, expires }))
                .then(u => done(null, u))
                .catch(e => done(e));
        }));

        app.use(session({ secret: SESSION_SECRET, resave: true, saveUninitialized: true }));
        app.use(passport.initialize());
        app.use(passport.session());

        app.get('/login', passport.authenticate('spotify', {
            scope: SCOPES,
        }));

        app.get('/authorize', passport.authenticate('spotify', {
            failureRedirect: '/login',
        }), (req, res) => res.redirect('http://localhost:3000'));

        const auth: ApiFunc = (req, res, next) => {
            if (req.isAuthenticated()) return next();
            res.status(401).json({ success: false, reason: 'Unauthorized' })
        };

        app.use('/api', auth);

    }
}