import { debug, error } from ".";
import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';
import { API_URL } from "./config";
import chalk = require("chalk");
import User from "./models/User";
import querystring from 'querystring';
import { ITrack } from "../../client/src/models";
import Playlist from "./models/Playlist";

const fetchLabels = async (track: ITrack, user: User): Promise<ITrack> => {
    const labels = await user.labelsFor(track.id);
    return { ...track, labels }
}

interface ITrackInfo {
    track: ITrack;
}

export class Api {

    private axios: AxiosInstance;

    constructor(private user: User) {
        this.axios = axios.create({
            baseURL: API_URL,
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            }
        });
    }

    public async saved(limit = 50, offset = 0) {

        if (limit > 50) {
            const p: Promise<ITrackInfo[]>[] = [];
            for (let o = 0; o < limit / 50; o++)
                p.push(this.saved(50, offset + o * 50));
            return Promise.all(p).then(a => a.reduce((a, b) => [...a, ...b], []))
        }

        const response = await this.get<{ items: ITrackInfo[] }>('me/tracks', {
            limit: Math.max(10, limit),
            offset,
        });
        const items = await Promise.all(
            response.items.map(i => fetchLabels(i.track, this.user).then(track => ({ ...i, track })))
        )
        return items as ITrackInfo[];
    }

    public async playlist(id: string) {
        return await this.get(`playlists/${id}`, {
            fields: 'description,images,external_urls,name,id,uri'
        });
    }

    public async createPlaylist(playlist: Playlist) {
        return await this.post(`users/${this.user.id}/playlists`, {
            description: 'Created by SpotOn',
            name: playlist.name,
        });
    }

    public async syncTracks(playlist: Playlist, replace: boolean) {
        if (!playlist.spotifyID) throw new Error('Playlist has not yet been created on Spotify');

        const endpoint = `playlists/${playlist.spotifyID}/tracks`;
        const tracks = await playlist.findTracks();
        const data = { uris: tracks.slice(0, 100).map(t => t.uri) };

        if (replace) this.put(endpoint, data);
        else this.post(endpoint, data);
    }

    public async tracks(...id: string[]) {
        const ids = id.slice(0, 50).join(',');
        const response = await this.get<{ tracks: ITrack[] }>('tracks', { ids })
        const tracks = await Promise.all(response.tracks.map(t => fetchLabels(t, this.user)))
        return tracks;
    }

    private async get<O = any>(endpoint: string, query: any = {}) {

        const url = `${endpoint}?${querystring.encode(query)}`

        try {
            const response = await this.axios.get(url);
            return response.data as O;
        } catch (e) {
            error(`Failed fetching ${chalk.underline(url)} with error ${e.message}`)
            error(e.response.data.message);
            throw new Error('Not found')
        }

    }

    private async post<O = any>(endpoint: string, data: any = {}) {

        try {
            const response = await this.axios.post(endpoint, data);
            return response.data as O;
        } catch (e) {
            error(`Failed posting to ${chalk.underline(endpoint)} with error ${e.message}`)
            error(e.response.data.message);
            throw new Error('Internal Error')
        }

    }

    private async put<O = any>(endpoint: string, data: any = {}) {

        try {
            const response = await this.axios.put(endpoint, data);
            return response.data as O;
        } catch (e) {
            error(`Failed posting to ${chalk.underline(endpoint)} with error ${e.message}`)
            error(e.response.data.message);
            throw new Error('Internal Error')
        }

    }

}

export default Api;