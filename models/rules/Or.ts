import Joi from "joi";
import GroupOperation from "./GroupOperation";

export default class Or extends GroupOperation<boolean, boolean> {
   
   childType() {
      return Joi.boolean()
   }

   merge(children: boolean[]) {
      return children.reduce((a, b) => a || b, false)
   }

}