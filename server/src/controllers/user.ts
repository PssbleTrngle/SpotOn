import { APIRequest, App } from '../index';
import User from '../models/User';

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
            const noSpotify = req.query.simple == true;
            const user = await findUser(req);
            if (!user) return res.status(404).json({ success: false, reason: 'User not found' });

            const playlists = await user.getPlaylists();
            if (noSpotify) res.json({ success: true, data: playlists });

            const fetched = await Promise.all(playlists.map(p => p.fetchSpotify()
                .then(spotify => ({ ...p.toJSON(), spotify }))
            ));
            
            res.json({ success: true, data: fetched });

        });

        app.get('/api/user/:user?', async (req, res) => {
            const user = await findUser(req);
            if (user) res.json({ success: true, data: user })
            else res.status(404).json({ success: false, reason: 'User not found' });
        });

    }
}