import { APIResponse, App, success, debug, APIRequest, ApiFunc } from '../index';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { Strategy } from 'passport-spotify';
import bcrypt from 'bcrypt';
import chalk from 'chalk';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URL, SCOPES, SESSION_SECRET } from '../config';
import { readSync } from 'fs';
import { resolveNaptr } from 'dns';
import session from 'express-session';
import Api from '../api';
import { isArray } from 'util';
import { ITrack, IRule, Operator } from '../../../client/src/models'
import { Op, where } from 'sequelize';
import User from '../models/User';
import Label from '../models/Label';
import Labeled from '../models/Labeled';
import Playlist, { Rule, Category } from '../models/Playlist';
import { OperationalError } from 'bluebird';

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
        }), (req, res) => res.redirect(`/test`));

        const auth: ApiFunc = (req, res, next) => {
            if (req.isAuthenticated()) return next();
            res.status(401).json({ success: false, reason: 'Unauthorized' })
        };

        app.use('/api', auth);

        app.get('/test', async (req, res) => {

            const randomColor = () => {
                const [r, g, b] = [0, 0, 0]
                    .map(() => Math.floor(Math.random() * 256))
                    .map(i => i.toString(16));
                return `${r}${g}${b}`;
            }

            if (await Label.count() === 0) {

                const labels = await Promise.all(['party', 'chill', 'loud', 'study', 'ice-age'].map(name =>
                    req.user.createLabel({ name, color: randomColor() })
                ));

                const lr = () => {
                    const c = Math.floor(Math.random() * labels.length);
                    return labels.sort(() => Math.random() - 0.5).slice(0, c);
                }

                const [party, chill, loud, study, iceage] = labels;

                const tracks = await req.user.api().saved(30);
                const choosen = tracks.map(i => i.track)
                await Promise.all(choosen.map(t =>
                    Promise.all(lr().map(l => req.user.label(t.id, l)))
                ));

                debug('Created Test Data')

                const p1 = Promise.all([Operator.AND, Operator.OR, Operator.XOR, Operator.WITHOUT].map(async operator => {
                    const rule = await Rule.createNested({
                        operator,
                        children: [
                            Rule.forLabel(party),
                            Rule.forLabel(loud)
                        ]
                    })

                    await req.user.createPlaylist({ name: Operator[operator], ruleID: rule.id });
                }));

                const p2 = Promise.all((await Label.findAll()).map(async label => {
                    const rule = await Rule.createNested(Rule.forLabel(label))
                    await req.user.createPlaylist({ name: label.name, ruleID: rule.id });
                }));

                const complex: IRule = {
                    operator: Operator.WITHOUT,
                    children: [
                        {
                            operator: Operator.OR,
                            children: [
                                Rule.forLabel(party),
                                {
                                    operator: Operator.AND,
                                    children: [
                                        Rule.forLabel(study),
                                        Rule.forLabel(loud),
                                    ]
                                },
                                Rule.forLabel(iceage),
                            ]
                        },
                        Rule.forLabel(chill)
                    ]
                }

                const p3 = Rule.createNested(complex)
                    .then(({ id }) => req.user.createPlaylist({ ruleID: id, name: 'Complex' }));

                await Promise.all([p1, p2, p3]);

            }

            res.redirect('http://localhost:3000')

        });

    }
}