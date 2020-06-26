# SpotOn
Label songs and create playlists using complex expressions

## Setup
```bash
docker pull dockergelb/spoton
docker run -d --name "SpotOn" --env-file ./.env -p 8080:8080 -v db:/server/db dockergelb/spoton
```

Will host the docker container on port 8080.
Create a virtual host using apache or nginx to access it via https and a subdomain