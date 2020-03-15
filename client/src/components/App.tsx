import { faCompactDisc, faDrum, faGuitar, faHeadphones, faMusic, faRecordVinyl } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import classes from 'classnames';
import React, { ReactNode, useContext, useEffect, useState, useMemo } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { Loading, useApi } from '../Api';
import { IImage, IUser } from '../models';
import '../style/general.scss';
import { Curtain, Dialog, Provider, useDialogProvider } from './Dialog';
import Labels from './Labels';
import Navbar from './Navbar';
import Playlist from './Playlist';
import Songs from './Songs';
import Builder from './RuleBuilder';

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

const ICONS = [faHeadphones, faMusic, faGuitar, faDrum, faRecordVinyl, faCompactDisc];

export function Image({ url, alt, ...rest }: IImage & { alt: string }) {
   const [hasImage, setImage] = useState(false);

   const icon = useMemo(() => ICONS[Math.floor(Math.random() * ICONS.length)], [])

   return <div className='img' style={{ ...rest }}>
      <img
         onLoad={() => setImage(true)}
         onError={() => setImage(false)}
         draggable={false}
         src={url}
         {... { alt }}
      />
      {!hasImage && <Icon icon={icon} />}
   </div>
}

interface IPage {
   path: string;
   component: () => JSX.Element;
   key?: string;
}
const pages: IPage[] = [
   { path: '/songs', component: Songs },
   { path: '/labels/:id?', component: Labels },
   { path: '/playlists/create', component: Builder, key: 'create' },
   { path: '/playlists/:id', component: Playlist, key: 'playlist' },
   { path: '/playlists', component: Playlist },
]

function Page({ page }: { page: IPage }) {

   const path = useLocation().pathname.slice(1) + '/';
   const key = page.key ?? path.slice(0, path.indexOf('/'));

   useEffect(() => {
      document.title = 'Spot On - ' + key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
   }, [key]);

   return (
      <div className={classes('container', key)}>
         <page.component />
      </div>
   );
}

function Section() {

   return (
      <section>
         <Switch>

            {pages.map(page =>
               <Route key={page.path} path={page.path}>
                  <Page {...{ page }} />
               </Route >
            )}

            <Route path='/' exact>
               <Redirect to='/songs' />
            </Route>

            <Route>
               <h1>404 - Not Found</h1>
            </Route>

         </Switch>
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

export default App;