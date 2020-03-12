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

export async function findUser(req: APIRequest) {
    const { user } = req.params;
    return user ? await User.findByPk(user) : req.user;
}

export default {
    register(app: App) {

        app.get('/api/track/:id/audio-features/', async (req, res) => {
            const { id } = req.params;
            req.user.api().audioFeatures(id)
                .then(data => res.json({ success: true, data }))
                .catch(e => res.status(505).json({ success: false, reason: e.message }))
        });

    }
}