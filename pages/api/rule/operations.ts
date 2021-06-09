import wrapper from "../../../lib/wrapper";
import { getOperations } from "../../../models/Operations";
import GroupOperation from "../../../models/rules/GroupOperation";
import { IOperation } from "../../../models/rules/Operation";

export default wrapper(async (req, res, session) => {

   if (req.method === 'GET') {

      const operations = await Promise.all(getOperations().map<Promise<IOperation>>(
         async ([name, operation]) => ({
            name,
            values: await operation.values(session),
            display: name,
            isGroup: operation instanceof GroupOperation
         })
      ))

      return res.json(operations)
   }

   res.status(400).json({
      error: 'Invalid method'
   })

})