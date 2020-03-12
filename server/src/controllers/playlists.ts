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

        app.get('/api/playlist/:playlist', async (req, res) => {
            const playlist = await Playlist.scope('full').findByPk(req.params.playlist);
            if (!playlist) return res.status(404).json({ success: false, reason: 'Playlist not found' });

            res.json({ success: true, data: await playlist.fetchData() });
        });

        app.post('/api/playlist/:playlist/sync', async (req, res) => {
            const playlist = await Playlist.findByPk(req.params.playlist);
            if (!playlist) return res.status(404).json({ success: false, reason: 'Playlist not found' });
            try {
                await playlist.sync();
                res.json({ success: true });
            } catch (e) {
                res.status(500).send({ success: false, reason: e.message });
            }
        });

    }
}