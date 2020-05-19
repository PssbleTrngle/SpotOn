import chalk from "chalk";
import { Association, CreateOptions, HasOneSetAssociationMixin, INTEGER, Model, Sequelize, STRING, VIRTUAL } from "sequelize";
import { warn } from "..";
import { ICategory, IRule, ITrack, IValue } from "../models";
import Api from "../api";
import Operator, { findOperator } from "./Operator";

export class Value extends Model implements IValue {

    id!: number;
    value!: string;
    key!: string;

    static setup(sequelize: Sequelize) {
        Value.init({
            id: {
                type: INTEGER(),
                primaryKey: true,
                autoIncrement: true,
            },
            value: {
                type: STRING(64),
                allowNull: false,
            },
            key: {
                type: STRING(32),
                allowNull: false,
            },
            categoryID: {
                type: INTEGER(),
                allowNull: false,
            }
        }, { sequelize, tableName: 'valuez' });
    }

    static relations() { }

}

export class Category extends Model implements ICategory {

    id!: number;
    type!: string;
    text!: string;

    private vals!: Value[];
    values!: { [key: string]: string }

    static setup(sequelize: Sequelize) {
        Category.init({
            id: {
                type: INTEGER(),
                primaryKey: true,
                autoIncrement: true,
            },
            type: {
                type: STRING(32),
                allowNull: false,
            },
            text: {
                type: STRING(32),
                allowNull: true,
            },
            values: {
                type: VIRTUAL,
                get(this: Category) {
                    return this.vals.reduce((o, { key, value }) => ({ ...o, [key]: value }), {});
                },
                set() { }
            }
        }, {
            sequelize, tableName: 'categories', defaultScope: {
                include: ['vals'],
            }
        });
    }

    static relations() {
        Category.hasMany(Value, {
            as: 'vals',
            foreignKey: 'categoryID',
            sourceKey: 'id',
        })
    }

    public static associations: {
        vals: Association<Category, Value>;
    };

}

class Rule extends Model implements IRule {

    id!: number;
    parent?: number;
    operatorKey!: string;

    operator!: Operator;
    children?: Rule[];
    category?: Category;

    public setCategory!: HasOneSetAssociationMixin<Category, number>;

    static async createNested(values: any, options?: CreateOptions) {
        const { children, category, ...rest } = values as IRule;
        if (!children && !category) throw new Error('Either child rules or a category must be provided');

        const rule = await Rule.create(rest, options);

        if (category) {
            const cat = await Category.create(category);

            await Promise.all(Object.keys(category.values)
                .map(k => ([k, category.values[k]]))
                .map(([key, value]) => Value.create({ value, key, categoryID: cat.id }))
            );

            rule.setCategory(cat);
        }

        if (children) {
            await Promise.all(children.reverse().map(r =>
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
            operatorKey: {
                type: STRING(16),
                allowNull: false,
            },
            operator: {
                type: VIRTUAL,
                get(this: Rule) {
                    return findOperator(this.getDataValue('operatorKey'));
                },
                set(this: Rule, o: Operator) {
                    this.setDataValue('operatorKey', o.name)
                }
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

    static has(type: string, text: string, values: { [key: string]: string }): IRule {
        const operator = findOperator('has');
        return {
            operator, category: {
                type, values, text,
            }
        }
    }

    static forLabel(label: { name: string, id: number }): IRule {
        return Rule.has('label', label.name, {
            labelID: label.id.toString()
        });
    }

    static validate(rule: IRule) {
        const operator = findOperator(rule.operator.name);
        if (!operator) throw new Error('Operator not found');

        if (!operator.isGroup && (rule.children ?? []).length > 0) throw new Error('No children allowed')

        operator.filter({ ...rule, level: 0, index: 0 });
    }

    filter(): (track: ITrack, api: Api) => boolean {

        try {
            return (t, a) => {
                const r = this.operator.filter({ ...this, level: 0, index: 0 })(t, a);
                return !!r;
            };
        } catch (e) {
            warn(`Invalid rule for operator ${chalk.bold(this.operator.name)}`)
            warn(e.message);
            return () => false;
        }
    }

}

export default Rule;