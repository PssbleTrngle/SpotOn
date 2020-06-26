The container can be run using

```bash
docker run -d --name "SpotOn" --env-file ./.env -p 8080:8080 -v db:/server/db dockergelb/spoton
```