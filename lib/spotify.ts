import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Session } from "next-auth";
import { ApiError } from 'next/dist/next-server/server/api-utils';
import { stringify } from 'querystring';
import List from '../interfaces/List';
import Playlist, { ExtendedPlaylist } from '../interfaces/Playlist';
import Track, { SavedTrack } from '../interfaces/Track';
import Tag from '../models/Tag';
import cacheOr from './cache';
import { serialize } from './database';

function isAxiosError(err: any): err is AxiosError {
   return err.isAxiosError === true
}

async function request<R>(endpoint: string, session: Session, config?: AxiosRequestConfig) {
   try {

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

export function getSavedTracks(session: Session, { limit = 20, offset = 0 } = {}) {
   return cacheOr(`${session.user.id}/saved/${offset}-${limit}`, () => {
      const query = stringify({ limit, offset })
      return request<List<SavedTrack>>(`me/tracks?${query}`, session)
   }).then(t => populate(t))
}

export async function getTracks(session: Session, ids: string[]) {
   if (ids.length === 0) return []
   const query = stringify({ ids: ids.slice(0, 50).join(',') })
   return request<{ tracks: Track[] }>(`tracks?${query}`, session).then(r => r.tracks)
}

export function getPlaylists(session: Session) {
   return cacheOr(`${session.user.id}/playlists`, () =>
      request<List<Playlist>>(`users/${session.user.id}/playlists`, session)
   )
}

export function getPlaylist(session: Session, id: string) {
   return cacheOr(`playlist/${id}`, () =>
      request<ExtendedPlaylist>(`playlists/${id}`, session)
   )
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