export interface IUser {
  id: string;
}

export interface WithID {
  id: number | string,
}

export interface List<T> {
  items: T[];
}

export interface ILabel {
  name: string;
  id: number;
  color: string;
  tracks?: ITrack[];
}

export interface ISpotify extends IModel {
  description?: string;
  images: IImage[]
}

export interface IPlaylist {
  spotifyID?: string;
  id: number;
  tracks?: ITrack[];
  rule?: IRule;
  name: string;
  spotify?: ISpotify;
}

interface IUrls {
  spotify: string;
}

export interface IModel {
  external_urls: IUrls;
  name: string;
  id: string;
  uri: string;
}

export interface IImage {
  height?: number;
  width?: number;
  url: string;
}

export interface IAlbum extends IModel {
  artists: IArtist[];
  images: IImage[]
}

export interface IArtist extends IModel {
  type: string;
}

export const Stats: {
  [key: string]: [number, number];
} = {
  acousticness: [0, 1],
  danceability: [0, 1],
  energy: [0, 1],
  instrumentalness: [0, 1],
  liveness: [0, 1],
  loudness: [-60, 0],
  speechiness: [0, 1],
  valence: [0, 1],
  tempo: [0, 250],
}

export type IFeatures = {
  [key: string]: number | undefined;
} & {
  id: string;
}

export interface ITrack extends IModel {
  artists: IArtist[];
  album: IAlbum;
  explicit: boolean;
  labels: ILabel[];
  popularity: number;
  features?: IFeatures;
}

export interface IValue {
  key: string;
  value: string;
}

export interface ICategory {
  type: string,
  values: { [key: string]: string },
  text: string,
}

export interface IOperator {
  name: string;
  isGroup: boolean;
  maxChildren?: number;
}

export interface IRule {
  operator: IOperator;
  children?: IRule[];
  category?: ICategory;
}

export type Response<D> = {
  success: true,
  data?: D,
  reason?: undefined;
} | {
  success: false,
  reason: string,
  data?: undefined;
}