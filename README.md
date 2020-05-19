# SpotOn
Label songs and create playlists using complex expressions

## Setup
```
docker pull dockergelb/spoton && docker run -d --name spoton dockergelb/spoton:latest
```

## Docker Volumes
The container uses two volumes:
- ./db: Stores the sqlite database
- ./public Stores the build frontend

## Client
The frontend is a react application written in typescript

## Server
The backend is an express server with an sqlite databse managed by Sequlize.
It uses Passport to authenticate the user against the Spotify API

## Rest API

### Labels

```
GET /api/label
```
Lists all labels of the current user

```
GET /api/label/:id
```
Displays a specific label and the tracks it is assigned to

```
PUT /api/label/:id
```
Updates a specific label

```
POST /api/label
```
Creates a new label

### Playlists

```
GET /api/playlist
```
List all playlists of the current user
