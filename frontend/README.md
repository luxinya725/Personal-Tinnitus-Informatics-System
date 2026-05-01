## Run Locally
**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Run in production

1. Build container
   `docker build -t quietspace .`
2. Run container detached
   `docker run -d -p 443:443 -p 80:80 quietspace`