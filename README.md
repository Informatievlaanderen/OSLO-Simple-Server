# OSLO Simple Server
OSLO Simple Server is a static content server that automatically detects changes in the content and reloads using a CRON job to display the updated content. This server is designed to serve the content in the dist folder.

## Getting Started
Install the dependencies: `npm install`
Build the project: `npm run build`
Start the server: `npm start`
quick setup: `npm run dev`

### Environment Variables
You can specify the following environment variables in the .env file. Please refer to the `.env.example` file for an example.

```
PORT: The port on which the server runs. Default is 3000.
TARGET_DIR: The directory that the server serves. Default is dist.
TMP_DIR: The temporary directory used for downloading and extracting the updated content. Default is tmp.
FILE_URL: The URL from which the server fetches the updated content.
FILE_NAME: The name of the file that the server downloads from the FILE_URL. Default is dist.tar.
```

## Docker

### Build the Docker image
```bash
docker build -t oslo-simple-server .
```

### Run the Docker container
```bash
docker run -d -p 8080:3000 simple-server  # Replace 8080 with the port you want to use and 3000 with the port from your .env
```
