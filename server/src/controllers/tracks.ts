import { APIRequest, App } from '../index';
import User from '../models/User';

export async function findUser(req: APIRequest) {
    const { user } = req.params;
    return user ? await User.findByPk(user) : req.user;
}

export default {
    register(app: App) {

        app.get('/api/saved', async (req, res) => {

            const limit = Number.parseInt(req.query.limit?.toString() ?? '');
            const offset = Number.parseInt(req.query.offset?.toString() ?? '');

            if (isNaN(offset)) return res.status(403).send({ success: false, reason: 'Invalid offset' })
            if (isNaN(limit)) return res.status(403).send({ success: false, reason: 'Invalid limit' })

            req.user.api().saved(limit, offset)
                .then(data => res.json({ success: true, data }))
                .catch(e => res.status(500).json({ success: false, reason: e.message }))
        });

        app.get('/api/tracks', async (req, res) => {

            req.user.allTracks()
                .then(data => res.json({ success: true, data }))
                .catch(e => res.status(500).json({ success: false, reason: e.message }))
        });

        app.get('/api/track/:id/features/', async (req, res) => {
            const { id } = req.params;
            req.user.api().features(id)
                .then(data => res.json({ success: true, data }))
                .catch(e => res.status(500).json({ success: false, reason: e.message }))
        });

    }
}