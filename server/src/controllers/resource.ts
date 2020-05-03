import { Model } from 'sequelize';
import { ApiFunc, APIRequest } from '../index';
import OwnerModel from '../models/OwnerModel';
import User from '../models/User';

export async function findUser(req: APIRequest) {
    const { user } = req.params;
    return user ? await User.findByPk(user) : req.user;
}

type ModelRequest<M extends Model> = APIRequest & {
    model: M;
};

export function findModel<M extends Model>(resource: typeof Model & { new(): M }, nextOrScope: string | ApiFunc<ModelRequest<M>>, nextOptional?: ApiFunc<ModelRequest<M>>): ApiFunc {
    const scope = typeof nextOrScope === 'string' ? nextOrScope : undefined;
    const next = typeof nextOrScope === 'function' ? nextOrScope : nextOptional;

    return async function (req, res, n) {
        const { id } = req.params;

        const data = scope
            ? await resource.scope(scope).findByPk(id) as M
            : await resource.findByPk(id) as M

        if (!data) res.status(404).json({ success: false, reason: 'Not Found' })
        else if (data instanceof OwnerModel && data.userID !== req.user.id)
            res.status(403).json({ success: false, reason: 'Not Authorized' })

        else if (next) {

            const reqNext = req as ModelRequest<M>;
            reqNext.model = data;

            next(reqNext, res, n);
        }
    }
}