import { Sequelize, INTEGER, STRING, DATE, ENUM, literal, HasManyRemoveAssociationMixin, HasManyGetAssociationsMixin, HasOneGetAssociationMixin } from 'sequelize';
import { FORCE_DB as FLUSH_DB, DEBUG } from './config';
import { success, info } from '.';
import User from './models/User';
import Label from './models/Label';
import Labeled from './models/Labeled';
import Playlist, { Rule, Category } from './models/Playlist';

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

        const models = [User, Label, Labeled, Playlist, Rule, Category]

        models.forEach(m => m.setup(sequelize));
        models.forEach(m => m.relations());

        if (FLUSH_DB) {
            info('Flushing Database...');
            await setKeyContraints(false);
        }

        await sequelize.sync({ force: FLUSH_DB, alter: DEBUG });
        await setKeyContraints(true);

        success('Database running');

    }
}