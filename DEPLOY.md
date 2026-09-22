# Deploying to AWS Lightsail

This app needs a host with a real public IP and open UDP ports, because the voice feature uses
server-side WebRTC (not just HTTP/WebSocket) — that's why this isn't a typical "push to Render/Vercel"
deploy. Everything below happens in your AWS account / your server's terminal, since I don't have
access to either — this is a step-by-step guide for you to run.

## 1. Create the Lightsail instance

1. AWS Lightsail console → **Create instance**.
2. Platform: Linux/Unix → **OS Only** → **Ubuntu 22.04 LTS**.
3. Pick a plan — the $10/mo tier (2 GB RAM) is a safe choice; the $5/mo tier will likely work too for a demo.
4. Name it (e.g. `healthcare-voice-agent`) and create it.

## 2. Attach a static IP

Lightsail's default public IP can change if the instance restarts. You need a fixed one, since it
goes into the app's config.

1. Instance page → **Networking** tab → **Create static IP**.
2. Attach it to your new instance.
3. Note this IP — it's your `PUBLIC_IP` value later.

## 3. Open the right ports (firewall)

Same **Networking** tab → **IPv4 Firewall** → add rules:

| Application | Protocol | Port range |
|---|---|---|
| SSH | TCP | 22 (likely already there) |
| HTTP | TCP | 80 |
| HTTPS | TCP | 443 |
| Custom | UDP | 40000–40100 |

That UDP range is where WebRTC audio actually flows — it must match `ICE_PORT_MIN`/`ICE_PORT_MAX`
in your `.env` later.

## 4. Point a domain at it (required for HTTPS)

Browsers only allow microphone access (`getUserMedia`) over HTTPS (or localhost). Let's Encrypt (used
below) needs a real domain — it can't issue a certificate for a bare IP address.

Add an **A record** at your DNS provider: `your-domain.com` → the static IP from step 2. If you don't
have a domain yet, this is the point to get one (any registrar works) before continuing.

## 5. SSH in and install prerequisites

Use the Lightsail console's browser-based SSH button, or SSH from your terminal with the downloaded key.

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx git build-essential
node -v   # sanity check, should be v20.x
```

`build-essential` is needed because `better-sqlite3` compiles a native module on install.

## 6. Get the code onto the box

Simplest path — push this repo to a GitHub repo you control, then on the server:

```bash
git clone <your-repo-url> healthcare-voice-agent
cd healthcare-voice-agent
npm install
npm run build
```

(If you'd rather not use git, `scp -r` the project folder up instead, excluding `node_modules` and `dist`.)

## 7. Configure environment variables

```bash
cp .env.example .env
nano .env
```

Fill in:
- `ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY` — your real keys
- `PUBLIC_IP` — the static IP from step 2
- `ICE_PORT_MIN=40000`, `ICE_PORT_MAX=40100` — matching the firewall rule from step 3
- Leave `PORT=3000` (nginx will proxy 443 → 3000)

## 8. Run it as a service

```bash
sudo cp deploy/healthcare-voice-agent.service /etc/systemd/system/
sudo nano /etc/systemd/system/healthcare-voice-agent.service
# fix User and WorkingDirectory if your username or path differs from ubuntu/home/ubuntu

sudo systemctl daemon-reload
sudo systemctl enable --now healthcare-voice-agent
sudo systemctl status healthcare-voice-agent   # should say "active (running)"
```

## 9. Set up nginx + HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/healthcare-voice-agent
sudo nano /etc/nginx/sites-available/healthcare-voice-agent
# replace "your-domain.com" with your real domain

sudo ln -s /etc/nginx/sites-available/healthcare-voice-agent /etc/nginx/sites-enabled/
sudo nginx -t   # should say "syntax is ok" / "test is successful"
sudo systemctl reload nginx

sudo certbot --nginx -d your-domain.com
# certbot will edit the nginx config to add the TLS block and set up auto-renewal
```

## 10. Test it

Visit `https://your-domain.com` from a **different network** than the server (e.g. your phone on
cellular data, not the same wifi) — this is the real test, since same-network testing can mask WebRTC
issues that only show up across the open internet. Start a conversation and confirm you actually hear
the agent.

## If audio doesn't connect

This is the one part of this setup I couldn't test directly (it needs your real AWS account and a
client on a different network to verify). If the page loads and text-based bits work but you never
hear audio or the mic never seems to connect:

- Double check the UDP firewall rule (step 3) and `ICE_PORT_MIN`/`ICE_PORT_MAX` in `.env` actually match.
- Check the service logs: `sudo journalctl -u healthcare-voice-agent -f` while you try connecting —
  look for errors from `werift` or the ICE negotiation.
- Confirm `PUBLIC_IP` in `.env` is exactly the static IP, not the instance's private IP.

Come back with whatever shows up in those logs and I can help debug further from there.
