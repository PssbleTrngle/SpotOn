export interface IUser {
  id: string;
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

export interface IPlaylist {
  id: string;
  tracks?: ITrack[];
  rule?: IRule;
  name: string;
  spotify?: IModel & {
    description?: string;
    images: IImage[]
  }
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

interface IImage {
  height: number;
  width: number;
  url: string;
}

export interface IAlbum extends IModel {
  artists: IArtist[];
  images: IImage[]
}

export interface IArtist extends IModel {
  type: string;
}

export const AudioCategories = [
  'acousticness',
  'danceability',
  'energy',
  'instrumentalness',
  'liveness',
  'loudness',
  'speechiness',
  'valence',
  'tempo',
]

export interface IAudioFeatures {
  [key: string]: number;
}

export interface ITrack extends IModel {
  artists: IArtist[];
  album: IAlbum;
  explicit: boolean;
  labels: ILabel[];
  popularity: number;
}

export enum Operator {
  AND, OR, WITHOUT, XOR, HAS, PLACEHOLDER, ALL
}

export const GroupOperators = [
  Operator.AND,
  Operator.OR,
  Operator.WITHOUT,
  Operator.XOR,
];

export interface ICategory {
  type: string,
  value: string,
  text?: string,
}

export interface IRule {
  operator: Operator;
  children?: IRule[];
  category?: ICategory;
}

export type Response<D> = {
  success: true,
  data?: D,
} | {
  success: false,
  reason: string,
}