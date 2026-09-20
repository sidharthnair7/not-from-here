# Deploying the hosted copy

One Docker image runs the whole thing: Spring Boot serves the API and the built React app from the same origin, so
there is no CORS, no proxy and no second process. The hosted copy uses **Pl@ntNet** as its proposer (plants only,
free tier, no GPU), the local build uses **Ollama** (the whole catalogue). Same gate, same rules, same ledger.

## What you need

- A box with Docker (a free-tier EC2 `t3.micro`, Ubuntu 24.04, is enough to *run* it; see "building on the box"
  before you try to build there).
- Ports **22** and **80** open in the security group.
- A Pl@ntNet API key (free: sign up at https://my.plantnet.org, then "API key" in the account settings). It is passed
  as an environment variable and never written into the repo.

## Option A: run the published image (preferred)

Every push to `main` builds the image on GitHub Actions and publishes it as
`ghcr.io/sidharthnair7/not-from-here:latest` (`.github/workflows/image.yml`). The package has to be public once
(GitHub: repo → Packages → not-from-here → Package settings → Change visibility → Public), after that anyone can pull.

```bash
sudo apt-get update && sudo apt-get install -y docker.io
sudo usermod -aG docker $USER && newgrp docker

docker run -d --name nfh --restart unless-stopped -p 80:8080 \
  -e LLM_PROVIDER=plantnet \
  -e PLANTNET_API_KEY=paste_the_key_here \
  -v nfh-data:/app/data -v nfh-cache:/app/cache \
  ghcr.io/sidharthnair7/not-from-here:latest

curl http://localhost/api/health
# {"status":"ok","provider":"plantnet","proposers":["plantnet:v2/all"]}
```

Open `http://<public-ip>/` in a browser. The badge under the Check button should say **Live**.

To update after a new push: `docker pull ghcr.io/sidharthnair7/not-from-here:latest && docker rm -f nfh` and run the
same `docker run` again. The ledger lives in the `nfh-data` volume and survives restarts and updates.

## Option B: build on the box

The build needs about 2 GB of memory (Node for the frontend, Maven for the backend). A `t3.micro` has 1 GB, so add
swap first, or build on a `t3.small` and run on the micro.

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER && newgrp docker

git clone https://github.com/sidharthnair7/not-from-here.git && cd not-from-here
PLANTNET_API_KEY=paste_the_key_here docker compose up -d --build
curl http://localhost/api/health
```

## What the hosted copy can and cannot do

- A plant photo: Pl@ntNet proposes real species names, the four rules decide, a REPORT goes into the shared ledger.
  A plant that is not on the Ontario list is refused under its own name (rule 2). A native lookalike (cattail) is
  refused with the how-to-tell guide.
- An insect, mussel or fish photo: nothing is proposed, and the card says so: "The proposer on this server covers
  plants only (Pl@ntNet)." Those species need the local build with the vision model.
- Quota: the free tier is 500 identifications a day. `remainingIdentificationRequests` is in every Pl@ntNet reply.

## Local run with the same proposer

```bash
# .env in the repo root (git-ignored):  PLANTNET_API_KEY=...
LLM_PROVIDER=plantnet ./mvnw spring-boot:run
```
