import { App } from '../index';
import User from '../models/User';

export default {
    register(app: App) {

        app.get('/api/user/:id', async (req, res) => {
            const { id } = req.params;
            const user = User.findByPk(id);
            if (user) res.json({ success: true, data: user })
            else res.status(404).json({ success: false, reason: 'Not found' });
        });

        app.get('/api/user/', async (req, res) => {
            res.json({ success: true, data: req.user })
        });

    }
}