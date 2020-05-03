import axios, { AxiosError, AxiosInstance } from 'axios';
import querystring from 'querystring';
import { debug, error } from ".";
import { IFeatures, ILabel, ISpotify, ITrack, Stats } from "../../client/src/models";
import { API_URL } from "./config";
import Playlist from "./models/Playlist";
import User from "./models/User";
import chalk = require("chalk");

const fetchLabels = async (track: ITrack, user: User): Promise<ITrack> => {
    const labels = await user.labelsFor(track.id) as ILabel[];
    return { ...track, labels }
}

interface ITrackInfo {
    track: ITrack;
}

export class Api {

    private printError(url: string, e: AxiosError) {
        error(`Failed fetching ${chalk.underline(url).slice(0, 20)} with error`)
        error(e.message);
        if (e.response) error(e.response.data.message ?? JSON.stringify(e.response.data));
        return new Error('Server Error')
    }

    private axios: AxiosInstance;

    constructor(private user: User) {
        this.axios = axios.create({
            baseURL: API_URL,
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            }
        });
    }

    private parseFeatures(raw: IFeatures) {
        const clamp = (v: number, min: number, max: number) => {
            const f = (v - min) / max;
            return Math.max(0, Math.min(1, f)) * 100;
        }

        return Object.keys(Stats).reduce((o, s) => ({
            ...o, [s]: clamp(raw[s] ?? 0, ...Stats[s])
        }), raw)
    }

    public async features<T extends string | string[]>(id: T): Promise<T extends string ? IFeatures : IFeatures[]> {
        if (Array.isArray(id)) {

            const { audio_features } = await this.get<{ audio_features: IFeatures[] }>(`audio-features`, { ids: (id as string[]).slice(0, 100).join(',') });
            return audio_features.map(r => this.parseFeatures(r)) as any;

        } else {

            const raw = await this.get<IFeatures>(`audio-features/${id}`);
            return this.parseFeatures(raw) as any;

        }
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

    public async playlist(id: string, fields = ['description', 'images', 'external_urls', 'name', 'id', 'uri']) {
        return await this.get<ISpotify>(`playlists/${id}`, {
            fields: fields.join(',')
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
        debug(`Sync adding ${chalk.bold(tracks.length)} tracks`)

        if (tracks.length > 0) {
            const data = { uris: tracks.slice(0, 100).map(t => t.uri) };

            if (replace) this.put(endpoint, data);
            else this.post(endpoint, data);

        }
    }

    public async addFeatures(tracks: ITrack[]) {

        const features = await this.features(tracks.map(t => t.id));
        return tracks.map(t => ({ ...t, features: features.find(f => f.id === t.id) }))

    }

    public async tracks(id: string[], includeFeatures = false) {
        if (id.length === 0) return [];

        const ids = id.slice(0, 50).join(',');
        const response = await this.get<{ tracks: ITrack[] }>('tracks', { ids })

        /* Fetch Labels */
        const tracks = await Promise.all(response.tracks.map(t => fetchLabels(t, this.user)))

        /* Fetch Audio features */
        if (includeFeatures) return this.addFeatures(tracks);

        return tracks;
    }

    private async get<O = any>(endpoint: string, query: any = {}) {

        const url = `${endpoint}?${querystring.encode(query)}`

        try {
            const response = await this.axios.get(url);
            return response.data as O;
        } catch (e) {
            throw this.printError(url, e);
        }

    }

    private async post<O = any>(endpoint: string, data: any = {}) {

        try {
            const response = await this.axios.post(endpoint, data);
            return response.data as O;
        } catch (e) {
            throw this.printError(endpoint, e);
        }

    }

    private async put<O = any>(endpoint: string, data: any = {}) {

        try {
            const response = await this.axios.put(endpoint, data);
            return response.data as O;
        } catch (e) {
            throw this.printError(endpoint, e);
        }

    }

}

export default Api;