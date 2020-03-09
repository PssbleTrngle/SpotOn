import { Sequelize, INTEGER, STRING, DATE, ENUM, literal, HasManyRemoveAssociationMixin, HasManyGetAssociationsMixin, HasOneGetAssociationMixin } from 'sequelize';
import { FORCE_DB, DEBUG } from './config';
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

namespace Database {

    export async function setup() {

        const models = [User, Label, Labeled, Playlist, Rule, Category]
        
        models.forEach(m => m.setup(sequelize));
        models.forEach(m => m.relations());

        if (FORCE_DB) info('Flushing Database...');
        await sequelize.sync({ force: FORCE_DB, alter: DEBUG });

        success('Database running');

    }

}

export default Database;