import { ILabel, IRule, Operator, ITrack, ICategory } from "../../../client/src/models";
import { Model, Sequelize, INTEGER, STRING, Association, HasOneGetAssociationMixin, JSON, CreateOptions, VIRTUAL } from "sequelize";
import User from "./User";
import Api from "../api";
import Bluebird from "bluebird";
import { debug, error, warn } from "..";
import chalk from "chalk";
import Label from "./Label";

export class Category extends Model implements ICategory {

    id!: number;
    value!: string;
    type!: string;
    text?: string;

    static setup(sequelize: Sequelize) {
        Category.init({
            id: {
                type: INTEGER(),
                primaryKey: true,
                autoIncrement: true,
            },
            value: {
                type: STRING(64),
                allowNull: false,
            },
            type: {
                type: STRING(32),
                allowNull: false,
            },
            text: {
                type: STRING(32),
                allowNull: true,
            }
        }, { sequelize, tableName: 'categories' });
    }

    static relations() { }

}

export class Rule extends Model implements IRule {

    id!: number;
    operator!: Operator;
    categoryID!: number | null;
    parent!: number | null;

    children?: Rule[];
    category?: Category;

    static async createNested(values: any, options?: CreateOptions) {
        const { children, category, ...rest }: IRule = values;
        if (!children && !category) throw new Error('Either child rules or a category must be provided');

        const vals = { ...rest } as any;

        if (category) {
            const cat = await Category.create(category);
            vals.categoryID = cat.id;
        }

        const rule = await Rule.create(vals, options);

        if (children) {
            await Promise.all(children.map(r =>
                Rule.createNested({ ...r, parentId: rule.id }))
            )
        }

        return rule;
    }

    static setup(sequelize: Sequelize) {
        Rule.init({
            id: {
                type: INTEGER(),
                primaryKey: true,
                autoIncrement: true,
            },
            categoryID: {
                type: INTEGER(),
                allowNull: true,
            },
            operator: {
                type: INTEGER(),
                allowNull: false,
            }
        }, {
            sequelize, tableName: 'rules'
        });
    }

    public static associations: {
        category: Association<Rule, Category>;
        children: Association<Rule, Rule>;
    };

    static relations() {

        // There is no definition for this libary
        //@ts-ignore
        Rule.isHierarchy();

        Rule.belongsTo(Category, {
            targetKey: 'id',
            foreignKey: 'categoryID',
            as: 'category',
        });

        Rule.addScope('defaultScope', {
            include: ['category']
        })
    }

    static forLabel(label: ILabel): IRule {
        return {
            operator: Operator.HAS,
            category: {
                type: 'label',
                value: label.id.toString(),
                text: label.name,
            }
        };
    }

    filter(): (track: ITrack) => boolean {
        const { operator, category, children, id } = this;

        if (operator === Operator.HAS) {
            if (category) return t => this.has(t);
            warn(`Rule has no category defined but claims to (id: ${chalk.bold(id)})`)
            return () => false;
        }

        if (children && children.length >= 2) {
            const filters = children.map(r => r.filter())
            const [a, b] = filters;

            switch (operator) {

                case Operator.AND:
                    return filters.reduce((f1, f2) => t => f1(t) && f2(t), () => true);

                case Operator.OR:
                    return filters.reduce((f1, f2) => t => f1(t) || f2(t), () => false);

                case Operator.XOR:
                    return t => (a(t) && !b(t)) || (!a(t) && b(t));

                case Operator.WITHOUT:
                    return t => a(t) && !b(t);

            }
        }

        warn(`Invalid operator ${chalk.italic(operator)} for rule length of ${chalk.bold(children?.length ?? 0)} (id: ${chalk.bold(id)})`);
        return () => false;
    }

    has(track: ITrack): boolean {
        if (this.category) {
            const i = Number.parseInt(this.category.value);
            switch (this.category.type) {
                case 'label': return track.labels.map(l => l.id).includes(i)
            }
        }
        warn(`Invalid category type ${chalk.italic(this.category)} (id: ${chalk.bold(this.id)})`);
        return false;
    }

}

export default class Playlist extends Model {

    public id!: number;

    public spotifyID!: string | null;
    public name!: string;

    public userID!: string;
    public ruleID!: number;

    public rule?: Rule;

    public getUser!: HasOneGetAssociationMixin<User>;
    public getRule!: HasOneGetAssociationMixin<Rule>;

    public static associations: {
        user: Association<Playlist, User>;
        rule: Association<Playlist, Rule>;
    };

    public async findTracks() {
        const { rule } = this;
        if (!rule) return [];

        const user = await this.getUser();
        const tracks = await user.allTracks();
        return tracks.filter(rule.filter());

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

    public async fetchData() {

        const user = await this.getUser();
        const tracks = await this.findTracks();
        const spotify = this.spotifyID ? await user.api().playlist(this.spotifyID) : null;
        if (spotify && spotify.name !== this.name) await this.update({ name: spotify.name })

        return { ...this.toJSON(), tracks, spotify };

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