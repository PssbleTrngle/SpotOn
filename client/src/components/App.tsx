import React, { ReactNode, useState, useEffect, useContext } from 'react';
import '../style/general.scss';
import { Route, Switch, BrowserRouter as Router, Redirect, useLocation } from 'react-router-dom';
import API, { useApi, Loading } from '../Api';
import Songs from './Songs';
import { IUser } from '../models';
import { Provider, Curtain, Dialog, useDialogProvider } from './Dialog';
import Labels from './Labels';
import Navbar from './Navbar';
import Playlist from './Playlist';

const UserContext = React.createContext<IUser | null>(null);
export function useUser(): IUser | never {
   const user = useContext(UserContext);
   if (user) return user;
   throw new Error('User not found but expected');
}

export function exists<T>(t: T | undefined | null | void): t is T {
   return !!t;
}

export function unique<T>(t: T, i: number, a: T[]) {
   return !a.find((t2, i2) => i2 < i && t2 === t);
}

function App() {
   const [user, loading] = useApi<IUser>('user');
   const [dialog, setDialog] = useDialogProvider();

   useEffect(() => {
      if (!user && !loading) window.open('http://localhost:8080/login', '_self');
   })

   return (
      <>
         {user ?
            <UserContext.Provider value={user}>
               <Provider value={setDialog}>
                  <Router>

                     {dialog && <Dialog {...dialog} />}
                     <Curtain hidden={!dialog} />

                     <Navbar />
                     <Section />

                  </Router>
               </Provider>
            </UserContext.Provider>

            : <Loading />
         }
      </>
   );
}

function Section() {
   const path = useLocation().pathname.slice(1) + '/';
   const key = path.slice(0, path.indexOf('/'));

   useEffect(() => {
      document.title = 'Spot On - ' + key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
   }, [key]);

   return (
      <section id={key}>
         <div className='container'>
            <Switch>

               <Route path='/songs'>
                  <Songs />
               </Route>

               <Route path='/labels/:id?'>
                  <Labels />
               </Route>

               <Route path='/playlists/:id?'>
                  <Playlist />
               </Route>

               <Route path='/' exact>
                  <Redirect to='/songs' />
               </Route>

               <Route>
                  <h1>404 - Not Found</h1>
               </Route>

            </Switch>
         </div>
      </section>
   );
}

interface LazyProps<M> {
   promise: Promise<M | undefined>;
   fallback?: ReactNode;
   render?: (m: M) => ReactNode;
}
export function Lazy<M>(props: LazyProps<M>): JSX.Element {
   const { promise, fallback, render } = props;
   const [result, setResult] = useState<M | undefined | null>(null);

   useEffect(() => {
      promise
         .catch(() => undefined)
         .then(r => setResult(r));
   });

   const emoji = '😭😢😥'.split('').sort(() => Math.random() - 0.5)[0];

   /* Promise not yet resolved */
   if (result === null) return <>{fallback ?? <span className='wait'></span>}</>;
   /* Promise resolved but either errored or response was empty */
   if (result === undefined) return <>{fallback ?? <span>Not Found {emoji}</span>}</>;
   /* Promise successfully resolved */
   return <>{render ? render(result) : result}</>;
}

function useSubmit(endpoint: string) {
   const [message, setMessage] = useState<null | string>(null);

   function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const data = {} as any;
      new FormData(e.currentTarget).forEach((e, k) => data[k] = e);
      API.post(endpoint, data)
         .then(() => null)
         .catch((e: Error) => e.message)
         .then(setMessage);
   }

   return { onSubmit, message };
}

export default App;