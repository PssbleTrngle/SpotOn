import { INTEGER, Sequelize, STRING } from "sequelize";
import { ILabel } from "../models";
import Labeled from "./Labeled";
import OwnerModel from "./OwnerModel";
import User from "./User";

export default class Label extends OwnerModel implements ILabel {

    public static NAME_REG = /^[A-Z \-]{4,32}$/i;

    public id!: number;
    public color!: string;
    public name!: string;
    public icon?: string;

    static setup(sequelize: Sequelize) {
        Label.init({
            id: {
                type: INTEGER(),
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: STRING(32),
                allowNull: false,
            },
            icon: {
                type: STRING(42),
                allowNull: true,
            },
            userID: {
                type: STRING(64),
                allowNull: false,
            },
            color: {
                type: STRING(6),
                allowNull: false,
            }
        }, { sequelize, tableName: 'labels' });
    }

    static relations() {
        Label.belongsTo(User, {
            targetKey: 'id',
            foreignKey: 'userID',
        });

        Label.hasMany(Labeled, {
            sourceKey: 'id',
            foreignKey: 'labelID',
            hooks: true,
            onDelete: 'CASCADE',
        });
    }

}