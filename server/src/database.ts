import { Sequelize } from 'sequelize';
import { info, success } from '.';
import { FORCE_DB as FLUSH_DB } from './config';
import Label from './models/Label';
import Labeled from './models/Labeled';
import Playlist from './models/Playlist';
import Rule, { Category, Value } from "./models/Rule";
import User from './models/User';

require('sequelize-hierarchy')(Sequelize);
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
});

async function setKeyContraints(enabled: boolean) {
    const mode = enabled ? 'ON' : 'OFF';
    await sequelize.query(`PRAGMA foreign_keys = ${mode};`, { raw: true });
}

export default {
    async setup() {

        const models = [User, Label, Labeled, Playlist, Rule, Category, Value]

        models.forEach(m => m.setup(sequelize));
        models.forEach(m => m.relations());

        if (FLUSH_DB) {
            info('Flushing Database...');
            await setKeyContraints(false);
        }

        await sequelize.sync({ force: FLUSH_DB, alter: FLUSH_DB });
        await setKeyContraints(true);

        success('Database running');

    }
}