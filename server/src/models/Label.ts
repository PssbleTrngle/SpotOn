import { ILabel } from "../../../client/src/models";
import { Model, Sequelize, INTEGER, STRING } from "sequelize";
import User from "./User";

export default class Label extends Model implements ILabel {

    public id!: number;
    public color!: string;
    public name!: string;
    public createdBy!: string;

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
            createdBy: {
                type: STRING(64),
                allowNull: true,
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
            foreignKey: 'createdBy',
        });

    }

}