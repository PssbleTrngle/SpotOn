import { Model, HasOneGetAssociationMixin, Association, Sequelize, INTEGER, STRING } from "sequelize";
import Label from "./Label";
import User from "./User";

export default class Labeled extends Model {

    public id!: number;
    public songID!: string;
    public labelID!: number;
    public labeledBy!: string;

    public getLabel!: HasOneGetAssociationMixin<Label>;

    public static associations: {
        label: Association<Labeled, Label>;
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
            labeledBy: {
                type: STRING(64),
                allowNull: true,
            },
        }, {
            sequelize, tableName: 'labeled', defaultScope: {
                include: ['label']
            }, indexes: [{
                fields: ['songID', 'labelID', 'labeledBy'],
                unique: true,
            }]
        });
    }

    static relations() {
        Labeled.belongsTo(User, {
            targetKey: 'id',
            foreignKey: 'labeledBy',
        });

        Labeled.belongsTo(Label, {
            targetKey: 'id',
            foreignKey: 'labelID',
            as: 'label',
        })

    }

}