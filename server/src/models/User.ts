import { Model, HasOneGetAssociationMixin, Association, HasManyCreateAssociationMixin, HasManyGetAssociationsMixin, Sequelize, STRING, INTEGER } from "sequelize";
import Label from "./Label";
import Labeled from "./Labeled";
import { IUser } from "../../../client/src/models";
import Playlist from "./Playlist";
import Api from "../api";
import l from "lodash";

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
                songID, labeledBy: this.id
            }
        });

        return await Promise.all(labeled.map(l => l.getLabel()));
    }

    public async labeledWith(label: Label) {
        const labeled = await Labeled.findAll({
            where: {
                labelID: label.id, labeledBy: this.id
            }
        });

        return await Promise.all(labeled.map(l => l.songID));
    }

    public async label(songID: string, label: Label) {
        return Labeled.create({ songID, labeledBy: this.id, labelID: label.id })
    }

    public api() {
        return new Api(this);
    }

    public async allTracks() {

        const labeled = await this.getLabeled();
        const tracks = this.api().tracks(...l.uniq(labeled.map(l => l.songID)));
        const saved = this.api().saved(50, 0).then(a => a.map(t => t.track));
        const all = await Promise.all([tracks, saved]).then(a => a.reduce((a, b) => [...a, ...b], []))
        return l.uniqBy(all, t => t.id);

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
            foreignKey: 'createdBy',
            as: 'labels'
        });

        User.hasMany(Labeled, {
            sourceKey: 'id',
            foreignKey: 'labeledBy',
            as: 'labeled'
        });

        User.hasMany(Playlist, {
            sourceKey: 'id',
            foreignKey: 'userID',
            as: 'playlists',
        });

    }

}