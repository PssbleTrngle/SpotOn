import { Association, HasOneGetAssociationMixin, INTEGER, Sequelize, STRING } from "sequelize";
import Label from "./Label";
import OwnerModel from "./OwnerModel";
import User from "./User";

export default class Labeled extends OwnerModel {

    public id!: number;
    public songID!: string;
    public labelID!: number;

    public getLabel!: HasOneGetAssociationMixin<Label>;

    public static associations: {
        label: Association<Labeled, Label>;
        user: Association<OwnerModel, User>;
    };

    static setup(sequelize: Sequelize) {
        
        Labeled.init({
            id: {
                type: INTEGER(),
                primaryKey: true,
                autoIncrement: true,
            },
            songID: {
                type: STRING(64),
                allowNull: true,
            },
            labelID: {
                type: INTEGER(),
                allowNull: false,
            },
            userID: {
                type: STRING(64),
                allowNull: false,
            },
        }, {
            sequelize, tableName: 'labeled', defaultScope: {
                include: ['label']
            }, indexes: [{
                fields: ['songID', 'labelID', 'userID'],
                unique: true,
            }]
        });
    }

    static relations() {
        Labeled.belongsTo(User, {
            targetKey: 'id',
            foreignKey: 'userID',
        });

        Labeled.belongsTo(Label, {
            targetKey: 'id',
            foreignKey: 'labelID',
            as: 'label',
        })

    }

}