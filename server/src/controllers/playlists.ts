import { App, ApiFunc } from '../index';
import { Operators, GroupOperator } from '../models/Operator';
import Playlist from '../models/Playlist';
import Rule from '../models/Rule';
import { IRule, Stats } from '../../../client/src/models';
import l from 'lodash';
import { Type } from '../models/Category';

export default {
    register(app: App) {

        app.get('/api/playlist/:playlist', async (req, res) => {
            const playlist = await Playlist.scope('full').findByPk(req.params.playlist);
            if (!playlist) return res.status(404).json({ success: false, reason: 'Playlist not found' });

            res.json({ success: true, data: await playlist.fetchData() });
        });

        app.post('/api/playlist/:playlist/sync', async (req, res) => {
            const playlist = await Playlist.scope('full').findByPk(req.params.playlist);
            if (!playlist) return res.status(404).json({ success: false, reason: 'Playlist not found' });
            try {
                await playlist.sync();
                res.json({ success: true });
            } catch (e) {
                res.status(500).send({ success: false, reason: e.message });
            }
        });

        app.get('/api/operators/example', async (req, res) => {
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

        app.get('/api/operators', (_, res) => {
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

        app.post('/api/playlist/create', validateRule, async (req, res) => {
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

    }
}