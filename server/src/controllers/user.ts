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
import { ITrack, IRule, Opererator } from '../../../client/src/models'
import { Op, where } from 'sequelize';
import User from '../models/User';
import Label from '../models/Label';
import Labeled from '../models/Labeled';
import Playlist, { Rule, Category } from '../models/Playlist';
import { OperationalError } from 'bluebird';

export async function findUser(req: APIRequest) {
    const { user } = req.params;
    return user ? await User.findByPk(user) : req.user;
}

export default {
    register(app: App) {

        app.get('/api/user/saved', async (req, res) => {

            const { limit, offset } = req.query;
            req.user.api().saved(limit, offset)
                .then(data => res.json({ success: true, data }))
                .catch(e => res.status(505).json({ success: false, reason: e.message }))
        });

        app.get('/api/user/tracks', async (req, res) => {

            req.user.allTracks()
                .then(data => res.json({ success: true, data }))
                .catch(e => res.status(505).json({ success: false, reason: e.message }))
        });

        app.get('/api/user/:user?/playlists', async (req, res) => {
            const user = await findUser(req);
            if (!user) return res.status(404).json({ success: false, reason: 'User not found' });

            const playlists = await user.getPlaylists();
            res.json({ success: true, data: playlists });
        });

        app.get('/api/user/:user?', async (req, res) => {
            const user = await findUser(req);
            if (user) res.json({ success: true, data: user })
            else res.status(404).json({ success: false, reason: 'User not found' });
        });

    }
}