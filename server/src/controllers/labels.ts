import { App, APIRequest } from '../index';
import { isArray } from 'util';
import { ITrack } from '../../../client/src/models'
import { Op } from 'sequelize';
import Label from '../models/Label';
import Labeled from '../models/Labeled';
import { findUser } from './user';

function findTracks(req: APIRequest): string[] {
    const { tracks, track } = req.body;
    if (tracks && isArray(tracks)) return tracks;
    else if (track) return [track];
    throw new Error('No Track specified')
}

export default {
    register(app: App) {

        app.post('/api/label/create', async (req, res) => {
            const { name } = req.body;

            const randomColor = () => {
                const [r, g, b] = [0, 0, 0]
                    .map(() => Math.floor(Math.random() * 256))
                    .map(i => i.toString(16));
                return `${r}${g}${b}`;
            }

            if (Label.NAME_REG.test(name)) {
                req.user.createLabel({ name, color: randomColor() })
                    .then(() => res.json({ success: true }))
                    .catch((e: Error) => res.json({ success: false, reason: e.message }));

            } else res.json({ success: false, reason: 'Invalid Label Name' })
        });

        app.post('/api/track/add-label', async (req, res) => {
            const { label: labelID } = req.body;

            try {

                const tracks = findTracks(req);
                const label = await Label.findByPk(labelID);
                if (!label) throw new Error('No label specified');
                const r = await Promise.all(
                    tracks.map(songID => req.user.label(songID, label)
                        .then(() => true)
                        .catch(e => false))
                );
                res.json({ success: true, data: r.filter(b => b) })

            } catch (e) {
                res.status(400).json({ success: false, reason: e.message });
            }

        })

        app.post('/api/track/remove-label', async (req, res) => {
            const { label: labelID } = req.body;

            try {

                const tracks = findTracks(req);
                const label = await Label.findByPk(labelID);
                if (!label) throw new Error('No label specified');

                const data = Labeled.destroy({
                    where: {
                        labeledBy: req.user.id,
                        labelID: label.id,
                        songID: { [Op.in]: tracks },
                    }
                })
                res.json({ success: true, data })

            } catch (e) {
                res.status(400).json({ success: false, reason: e.message });
            }

        });

        app.get('/api/user/:user?/labels/:track?', async (req, res) => {
            const { track } = req.params;
            const user = await findUser(req);
            if (!user) return res.status(404).json({ success: false, reason: 'User not found' });

            if (track) {
                res.json({ success: true, data: await user.labelsFor(track) })
            } else {
                res.json({ success: true, data: await user.getLabels() })
            }
        });

        app.post('/api/label/:label/edit', async (req, res) => {
            const { label: labelID } = req.params;

            const label = await Label.findByPk(labelID);
            if (!label) return res.status(404).json({ success: false, reason: 'Label not found' });
            if (label.createdBy !== req.user.id) return res.status(403).json({ success: false, reason: 'Not your label' });

            const { color: color, name } = req.body;

            if (color) {
                const match = color.toString().match(/#?([a-z0-9]{6})/i);
                if (!match) return res.status(400).json({ success: false, reason: 'Invalid color code' });
                await label.update({ color: match[1] });
            }

            if (name) {
                if (!Label.NAME_REG.test(name)) return res.status(400).json({ success: false, reason: 'Invalid label name' });
                await label.update({ name });
            }

            res.json({ success: true });
        });

        app.get('/api/label/:label', async (req, res) => {
            const { label: labelID } = req.params;

            const label = await Label.findByPk(labelID);
            if (!label) return res.status(404).json({ success: false, reason: 'Label not found' });

            const ids = await req.user.labeledWith(label);
            const tracks: ITrack[] = ids.length > 0 ? await req.user.api().tracks(ids) : [];

            res.json({ success: true, data: { ...label.toJSON(), tracks } })
        });

    }
}