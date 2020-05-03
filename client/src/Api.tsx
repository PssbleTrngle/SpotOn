import querystring, { ParsedUrlQueryInput } from 'querystring';
import React, { SyntheticEvent, useEffect, useState } from 'react';
import { Response } from "./models";
import classes from 'classnames';

const API_URL = '/api';

/**
 * React hook to subscibe to a specific api endpoint
 * @param endpoint The url
 * @param params Optional query parameters
 */
export function useApi<R>(endpoint: string, params?: ParsedUrlQueryInput) {
    const [result, setResult] = useState<undefined | R>();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | undefined>();

    const query = querystring.encode(params);
    useEffect(() => {
        setLoading(true);
        setResult(undefined);

        return API.subscribe<R>(endpoint, query).then((r, e) => {
            setResult(r);
            setMessage(e?.message);
            setLoading(false);
        })
    }, [query, endpoint]);

    return [result, loading, message] as [R | undefined, boolean, string | undefined];
}

export function useSubmit<R = any>(method: 'put' | 'post' | 'delete', endpoint: string, data?: any, cb?: (r?: R) => unknown) {
    const [error, setError] = useState<any>();
    const [inProgress, setLoading] = useState(false);

    const post = (e?: SyntheticEvent) => {
        e?.preventDefault();
        setLoading(true);
        API.method<R>(method, endpoint, data)
            .then(r => {
                if (cb) cb(r);
                return undefined;
            })
            .catch(e => e as Error)
            .then(e => {
                setError(e);
                setLoading(false);
            });
    }

    const message = error?.message;
    return { message, error, valid: !message, post, inProgress };
}

export function Loading({ relative }: { relative?: boolean }) {
    return <div className={classes('loading', { relative })} />;
}

type Render<R> = (result: R) => JSX.Element | null;
export function useLoading<R>(enpoint: string, params: ParsedUrlQueryInput | Render<R>, render?: Render<R>): JSX.Element | null {
    const p = typeof params === 'object' ? params : undefined;
    const r = typeof params === 'function' ? params : render;
    const [result, loading] = useApi<R>(enpoint, p);

    if (loading) return <Loading />
    if (!result) return <span>Not found</span>
    return r ? r(result) : null;
}

interface IObserver<O> {
    url: string;
    params?: ParsedUrlQueryInput | string;
    callback: (result?: O, error?: Error) => unknown;
}

class Api {

    observers: Set<IObserver<any>> = new Set();

    call<O>(observer: IObserver<O>) {
        const { url, params, callback } = observer;
        this.fetch<O>(url, params)
            .then(r => callback(r))
            .catch(e => callback(undefined, new Error(e.message)));
    }

    update() {
        this.observers.forEach(o => this.call(o));
    }

    async fetch<O>(endpoint: string, params?: ParsedUrlQueryInput | string) {
        const query = typeof params === 'string' ? params : querystring.encode(params ?? {});
        return this.method<O>('get', `${endpoint}/?${query}`);
    }

    public async audio(url: string) {

        /*
        const response = await fetch(require('../test.mp3'), {
        });

        const content = await response.body?.getReader().read();
        if (!content?.value) throw new Error('No audio found');

        const blob = new Blob([content.value], { type: 'audio/mp3' })
        return URL.createObjectURL(blob);
*/
    }

    async method<O>(method: 'get' | 'post' | 'delete' | 'put', endpoint: string, args?: any, update = true) {

        let url = endpoint;
        if (!url.startsWith(API_URL)) url = `${API_URL}/${url}`
        if (method !== 'get') url += '/';

        const response = await fetch(url, {
            method: method.toUpperCase(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: args ? JSON.stringify(args) : undefined,
        });

        if (update && method !== 'get') this.update();

        const json = await response.json() as Response<O>;
        if(json.success) return json.data;
        throw new Error(json.reason)
    }

    async post<O = string>(url: string, args: any = {}, update = true) {
        return this.method<O>('post', url, args, update);
    }

    async put<O = string>(url: string, args: any = {}, update = true) {
        return this.method<O>('put', url, args, update);
    }

    async delete<O = string>(url: string, args: any = {}, update = true) {
        return this.method<O>('delete', url, args, update);
    }

    subscribe<O>(url: string, params?: ParsedUrlQueryInput | string) {
        return {
            then: (callback: (result?: O, error?: Error) => unknown) => {
                const o = { url, params, callback };
                this.observers.add(o);
                this.call(o);
                return () => {
                    this.observers.delete(o);
                }
            }
        }
    }

}

export const API = new Api();

export default API;