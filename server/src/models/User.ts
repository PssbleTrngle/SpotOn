import chalk from "chalk";
import l from "lodash";
import { Association, HasManyCreateAssociationMixin, HasManyGetAssociationsMixin, INTEGER, Model, Sequelize, STRING } from "sequelize";
import { debug } from "..";
import { IUser } from "../models";
import Api from "../api";
import Label from "./Label";
import Labeled from "./Labeled";
import Playlist from "./Playlist";

export default class User extends Model implements IUser {

    public id!: string;
    public accessToken!: string;
    public refreshToken!: string;
    public expires!: number;

    public createLabel!: HasManyCreateAssociationMixin<Label>;
    public getLabeled!: HasManyGetAssociationsMixin<Labeled>;
    public getLabels!: HasManyGetAssociationsMixin<Label>;
    public getPlaylists!: HasManyGetAssociationsMixin<Playlist>;
    public createPlaylist!: HasManyCreateAssociationMixin<Playlist>;

    public async labelsFor(songID: string) {
        const labeled = await Labeled.findAll({
            where: {
                songID, userID: this.id
            }
        });

        return await Promise.all(labeled.map(l => l.getLabel()));
    }

    public async labeledWith(label: Label) {
        const labeled = await Labeled.findAll({
            where: {
                labelID: label.id, userID: this.id
            }
        });

        return await Promise.all(labeled.map(l => l.songID));
    }

    public async label(songID: string, label: Label) {
        return Labeled.create({ songID, userID: this.id, labelID: label.id })
    }

    public api() {
        return new Api(this);
    }

    public async allTracks(includeFeatures = false) {

        const api = this.api();
        const labeled = await this.getLabeled();
        const tracks = api.tracks(l.uniq(labeled.map(l => l.songID)));
        const saved = api.saved(50, 0).then(a => a.map(t => t.track));
        const all = await Promise.all([tracks, saved]).then(a => a.reduce((a, b) => [...a, ...b], []))
        const unique = l.uniqBy(all, t => t.id);

        debug(`Found ${chalk.bold(unique.length)} tracks for user`);

        if(includeFeatures) return api.addFeatures(unique);
        else return unique;

    }

    public static associations: {
        labels: Association<User, Label>,
        labeled: Association<User, Labeled>
        playlists: Association<User, Playlist>
    };

    static setup(sequelize: Sequelize) {
        User.init({
            id: {
                type: STRING(64),
                primaryKey: true,
            },
            accessToken: {
                type: STRING(),
                allowNull: true,
            },
            refreshToken: {
                type: STRING(),
                allowNull: true,
            },
            expires: {
                type: INTEGER(),
                allowNull: true,
            }
        }, {
            sequelize,
            tableName: 'users'
        });
    }

    static relations() {
        User.hasMany(Label, {
            sourceKey: 'id',
            foreignKey: 'userID',
            as: 'labels',
            hooks: true,
            onDelete: 'CASCADE',
        });

        User.hasMany(Labeled, {
            sourceKey: 'id',
            foreignKey: 'userID',
            as: 'labeled',
            hooks: true,
            onDelete: 'CASCADE',
        });

        User.hasMany(Playlist, {
            sourceKey: 'id',
            foreignKey: 'userID',
            as: 'playlists',
            hooks: true,
            onDelete: 'CASCADE',
        });

    }

}