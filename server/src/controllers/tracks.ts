import { APIRequest, App } from '../index';
import User from '../models/User';

export async function findUser(req: APIRequest) {
    const { user } = req.params;
    return user ? await User.findByPk(user) : req.user;
}

export default {
    register(app: App) {

        app.get('/api/track/:id/features/', async (req, res) => {
            const { id } = req.params;
            req.user.api().features(id)
                .then(data => res.json({ success: true, data }))
                .catch(e => res.status(505).json({ success: false, reason: e.message }))
        });

    }
}