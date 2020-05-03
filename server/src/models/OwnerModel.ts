import { Model, HasOneGetAssociationMixin, Association } from "sequelize";
import User from "./User";

export default class OwnerModel extends Model {

    public userID!: string;

    public getUser!: HasOneGetAssociationMixin<User>;

    public static associations: {
        user: Association<OwnerModel, User>;
    };

}