import { Association, HasOneGetAssociationMixin, INTEGER, Sequelize, STRING } from "sequelize";
import { warn } from "..";
import { IPlaylist } from "../../../client/src/models";
import OwnerModel from "./OwnerModel";
import Rule from "./Rule";
import User from "./User";

export default class Playlist extends OwnerModel {

    public id!: number;

    public spotifyID!: string | null;
    public name!: string;

    public ruleID!: number;

    public rule?: Rule;

    public getRule!: HasOneGetAssociationMixin<Rule>;

    public static associations: {
        rule: Association<Playlist, Rule>;
        user: Association<OwnerModel, User>;
    };

    public async findTracks() {
        const { rule } = this;
        if (!rule) {
            warn('Trying to load tracks without rule present');
            return [];
        }

        const user = await this.getUser();
        const tracks = await user.allTracks(true);
        const f = rule.filter();
        return tracks.filter(t => f(t, user.api()));

    }

    public async sync(create = true) {

        if (this.spotifyID === null) {
            if (create) await this.addToSpotify();
            else throw new Error('Playlist has not yet been added to Spotify');
        }
        const user = await this.getUser();
        await user.api().syncTracks(this, true);

    }

    public async addToSpotify() {
        const user = await this.getUser();
        const spotify = await user.api().createPlaylist(this);
        this.update({ spotifyID: spotify.id });
        return spotify;
    }

    public async fetchSpotify(fields?: string[]) {

        const user = await this.getUser();
        const spotify = this.spotifyID ? await user.api().playlist(this.spotifyID, fields) : undefined;
        if (spotify?.name && spotify.name !== this.name) await this.update({ name: spotify.name })
        return spotify;

    }

    /**
     * Can only be called on playlists returned by the 'full' scope
     * @returns the playlist as well as its matching tracks and spotify data
     */
    public async fetchData(): Promise<IPlaylist> {

        const tracks = await this.findTracks();
        const spotify = await this.fetchSpotify();

        return { ...this.toJSON() as IPlaylist, tracks, spotify };

    }

    static setup(sequelize: Sequelize) {
        Playlist.init({
            id: {
                type: INTEGER(),
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: STRING(),
                allowNull: false,
            },
            spotifyID: {
                type: STRING(),
                allowNull: true,
            },
            userID: {
                type: STRING(64),
                allowNull: false,
            },
            ruleID: {
                type: INTEGER(),
                allowNull: false,
            }
        }, {
            sequelize, tableName: 'playlists'
        });
    }

    static relations() {
        Playlist.belongsTo(User, {
            targetKey: 'id',
            foreignKey: 'userID',
            as: 'user',
        });

        Playlist.belongsTo(Rule, {
            targetKey: 'id',
            foreignKey: 'ruleID',
            as: 'rule',
        });

        Playlist.addScope('full', {
            include: [
                { model: Rule, as: 'rule', include: [{ model: Rule, as: 'descendents', hierarchy: true }] as any[] }
            ]
        })

    }

}