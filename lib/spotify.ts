import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Session } from "next-auth";
import { ApiError } from 'next/dist/next-server/server/api-utils';
import { stringify } from 'querystring';
import List from '../interfaces/List';
import Playlist, { ExtendedPlaylist } from '../interfaces/Playlist';
import Track, { SavedTrack } from '../interfaces/Track';
import Tag from '../models/Tag';
import { serialize } from './database';

function isAxiosError(err: any): err is AxiosError {
   return err.isAxiosError === true
}

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env
const base64 = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')

interface TokenResponse {
   access_token: string
   expires_in: number
}

async function refresh(session: Session) {
   const { data } = await axios.post<TokenResponse>('https://accounts.spotify.com/api/token', stringify({
      grant_type: 'refresh_token',
      refresh_token: session.user.token.refreshToken,
   }), {
      headers: {
         Authorization: `Basic ${base64}`
      }
   })

   session.user.token.expiresAt = new Date().getTime() + data.expires_in
   session.user.token.accessToken = data.access_token
}

async function request<R>(endpoint: string, session: Session, config?: AxiosRequestConfig) {
   try {

      if (0 <= new Date().getTime()) {
         console.warn('Token expired')
         await refresh(session)
      }

      const { data } = await axios.get<R>(endpoint, {
         baseURL: 'https://api.spotify.com/v1',
         ...config,
         headers: {
            Authorization: `Bearer ${session.user.token.accessToken}`,
            ...config?.headers,
         },
      })

      return data

   } catch (err) {
      if (isAxiosError(err)) console.error(err.response?.data)
      else console.error(err.message)
      throw new ApiError(500, 'API Error')
   }
}

export async function getSavedTracks(session: Session, { limit = 20, offset = 0 } = {}) {
   const query = stringify({ limit, offset })
   return request<List<SavedTrack>>(`me/tracks?${query}`, session).then(t => populate(t))
}

export async function getTracks(session: Session, ids: string[]) {
   const query = stringify({ ids: ids.slice(0, 50).join(',') })
   return request<{ tracks: Track }>(`tracks?${query}`, session).then(r => r.tracks)
}

export function getPlaylists(session: Session) {
   return request<List<Playlist>>(`users/${session.user.id}/playlists`, session)
}

export function getPlaylist(session: Session, id: string) {
   return request<ExtendedPlaylist>(`playlists/${id}`, session)
}

interface Populate {
   (tracks: List<SavedTrack>): Promise<List<SavedTrack>>
   (tracks: List<Track>): Promise<List<Track>>
   (tracks: Array<SavedTrack>): Promise<Array<SavedTrack>>
   (tracks: Array<Track>): Promise<Array<Track>>
}

const populate: Populate = async (tracks: any) => {

   const items: Array<SavedTrack | Track> = Array.isArray(tracks) ? tracks : tracks.items
   const mapped = await Promise.all(items.map(async t => {

      const tags = await Tag.find({ tracks: 'track' in t ? t.track.id : t.id }).then(serialize)

      if ('track' in t) return { ...t, track: { ...t.track, tags } }
      else return { ...t, tags }

   }))

   return Array.isArray(tracks) ? mapped : { ...tracks, items: mapped }
}