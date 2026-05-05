# QuietSpace - Tinnitus Tracker
React app made as functional prototype for course 02808 Personal Data Interaction (Spring 2026)

# Frontend
You can find the frontend in the frontend folder. See the README.md within the frontend folder to see how to deploy to production. It has been built by Juno, Yuling and Xinya and deployed to junos.dk by Juno on own server.

# Data processing
Check the src folder for the data processing that is done with python.

To run it, you need to install uv package manager:
https://docs.astral.sh/uv/getting-started/installation/

Make sure your environment is synchronized
```
uv sync
```

You can run the data pipeline directly from the repository root folder using 
```
uv run main.py
```

# References
- https://docs.docker.com/guides/reactjs/containerize/#step-5-build-the-reactjs-application-image