import React, { useContext, Dispatch, SetStateAction, useState } from "react";
import classes from 'classnames';

const DialogContext = React.createContext<Dispatch<SetStateAction<DialogProps | null>>>(() => { });

export function useDialog() {
   const setCurrent = useContext(DialogContext);
   return {
      open: (e: DialogProps) => setCurrent(e),
      close: () => setCurrent(null),
   }
}
interface DialogProps {
   text: string;
   action: () => unknown;
}
export function Dialog({ action, text }: DialogProps) {
   const { close } = useDialog();

   return (
      <div className='dialog'>
         <h1>{text}</h1>
         <button className='yes' onClick={() => {
            action();
            close();
         }}>Yes</button>
         <button className='cancel' onClick={close}>Cancel</button>
      </div>
   )

}

export function Curtain({ hidden }: { hidden: boolean }) {
   const { close } = useDialog();
   return <div className={classes('curtain', { hidden })} onClick={close} />
}

export const Provider = DialogContext.Provider;

export function useDialogProvider() {
    return useState<DialogProps | null>(null);
}