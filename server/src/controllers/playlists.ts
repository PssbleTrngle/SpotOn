import l from 'lodash';
import { IRule, Stats } from '../models';
import { ApiFunc, App } from '../index';
import { Type } from '../models/Category';
import { GroupOperator, Operators } from '../models/Operator';
import Playlist from '../models/Playlist';
import Rule from '../models/Rule';
import { findModel } from './resource';

export default {
    register(app: App) {

        app.get('/api/playlist', async (req, res) => {
            const noSpotify = req.query.simple === 'true';

            const playlists = await req.user.getPlaylists();
            if (noSpotify) res.json({ success: true, data: playlists });

            const fetched = await Promise.all(playlists.map(p => p.fetchSpotify()
                .then(spotify => ({ ...p.toJSON(), spotify }))
            ));
            
            res.json({ success: true, data: fetched });
        });

        app.get('/api/playlist/:id', findModel(Playlist, 'full', async (req, res) => {
            res.json({ success: true, data: await req.model.fetchData() });
        }));

        app.post('/api/playlist/:id/sync', findModel(Playlist, 'full', async (req, res) => {
            try {
                await req.model.sync();
                res.json({ success: true });
            } catch (e) {
                res.status(500).send({ success: false, reason: e.message });
            }
        }));

        app.get('/api/operator/example', async (req, res) => {
            const labels = await req.user.getLabels();
            const label = (c: number) => l.shuffle([
                ...labels.map(Rule.forLabel)
            ]).slice(0, c);

            const constants = [20, 40, 60, 80];
            const numbers = (c: number) => l.shuffle([
                ...Object.keys(Stats).map(s => Rule.has('stat', s, { key: s })),
                ...constants.map(i => i.toString()).map(i => Rule.has('number', i, { value: i }))
            ]).slice(0, c);

            const operator = l.shuffle(Operators.filter(o => o instanceof GroupOperator))[0] as GroupOperator<Type>;
            const children = operator.accept === Type.LOGIC
                ? label(2)
                : numbers(2);

            const rule: IRule = { operator, children };

            res.json({ success: true, data: rule });

        });

        app.get('/api/operator', (_, res) => {
            res.json({ success: true, data: Operators })
        });

        const validateRule: ApiFunc = async (req, res, next) => {
            const { rule } = req.body;
            try {

                Rule.validate(rule);
                next();

            } catch (e) {
                res.status(400).json({ success: false, reason: e.message, ...e })
            }

        };

        app.post('/api/playlist/validate', validateRule, (_, res) =>
            res.json({ success: true })
        );

        app.post('/api/playlist', validateRule, async (req, res) => {
            const { rule: irule, name } = req.body;

            try {

                if (!(/[a-z0-9-_ ]{3,20}/i.test(name))) throw new Error('You dipshit forgot to enter a name')

                const rule = await Rule.createNested(irule);
                const playlist = await req.user.createPlaylist({ name, ruleID: rule.id })

                res.json({ success: true, data: playlist.id });

            } catch (e) {
                res.status(400).json({ success: false, reason: e.message, ...e })
            }

        })

        app.delete('/api/playlist/:id', findModel(Playlist, async (req, res) => {
            await req.model.destroy();
            res.json({ success: true });
        }));

    }
}