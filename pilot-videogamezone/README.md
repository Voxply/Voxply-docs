# Wavvon pilot on web.videogamezone.eu — runbook

First external hub operator pilot. The hub belongs to the friend (owner);
we provide the artifacts and support. Companion docs: `docs/docs/hosting.md`,
`docs/docs/hub-operator-guide.md`, `DEMO-HUB.md` (workspace root).

Surveyed 2026-06-12: OVH VPS, Ubuntu 24.04 LTS, 2 vCPU / 3.7 GiB (2.5 free),
26 GB disk free, Docker 29.5.3, nginx with 13 vhosts, MySQL, mail.
Wildcard DNS `*.videogamezone.eu` → 135.125.204.25 (direct, not Cloudflare).
Wildcard LE cert `*.videogamezone.eu` already on the box.
Ports 3000 TCP / 3001 UDP free.

## Files in this folder

| File | Goes to | Needs root |
|---|---|---|
| `wavvon.videogamezone.eu` | `/etc/nginx/sites-available/` + symlink in `sites-enabled/` | yes |
| `docker-compose.yml` | `~/wavvon/docker-compose.yml` (anachim's home) | no |

## Gate (before anything on the server)

The published hub image lacks the CORS layer and `--doctor` (both on
`develop`, hub commit `054fa09`). Either:

- **A (preferred):** merge `develop` → `main` in Wavvon-server, cut v0.2.1
  so CI publishes `ghcr.io/wavvon/hub:latest`; or
- **B (pilot shortcut):** build from `develop` locally, then
  `docker save wavvon-hub:develop | ssh anachim@web.videogamezone.eu docker load`
  and switch the image line in the compose file.

## One-time setup (friend / root)

1. `sudo usermod -aG docker anachim` — note: docker group ≈ root-equivalent;
   his call. Re-login for it to take effect.
2. Install vhost — friend chose the symlink-from-home variant so we can
   edit it without root (file stays at `/home/anachim/wavvon/`):
   `sudo ln -s /home/anachim/wavvon/wavvon.videogamezone.eu /etc/nginx/sites-enabled/`
   `sudo nginx -t && sudo systemctl reload nginx`
   (`nginx -t` BEFORE reload — protects the other 13 sites.)
   ⚠️ While the symlink exists, NEVER delete or chmod the file in ~/wavvon:
   a dangling include fails `nginx -t` for the WHOLE config and blocks every
   future reload (incl. certbot renewals) for all 13 sites.
   Edits to the file still need a root `systemctl reload nginx` to apply.
3. Firewall: allow **3001/udp** in ufw (if active: `sudo ufw allow 3001/udp`)
   AND in the OVH control panel firewall if one is attached to the IP.
   Voice fails silently without this.

## Owner key (friend, before first boot)

He installs the desktop client, copies his pubkey from Settings → Identity
(64 hex chars), and it goes into `WAVVON_OWNER_PUBKEY` in the compose file.
Set before first boot — a fresh hub has no owner otherwise.

## Launch (anachim, no root)

```bash
mkdir -p ~/wavvon && cd ~/wavvon        # compose file goes here
docker compose up -d
docker compose exec hub /wavvon-hub --doctor   # expect PASS lines
curl -s https://wavvon.videogamezone.eu/health  # {"status":"ok",...}
curl -s https://wavvon.videogamezone.eu/info    # hub identity JSON
```

## Verification checklist

- [ ] `/health` returns ok over TLS
- [ ] Desktop client joins `https://wavvon.videogamezone.eu`
- [ ] Web client (wavvon.github.io/Wavvon-web) joins it — proves CORS in prod
- [ ] Two clients in a voice channel — proves UDP 3001 end to end
- [ ] Friend's existing sites still up (spot-check 2–3 vhosts)
- [ ] Back up `hub_identity.json` from the `wavvon_hub-data` volume once:
      `docker compose cp hub:/data/hub_identity.json ~/wavvon/hub_identity.backup.json`
      (it IS the hub's identity; keep a copy off the box)

## Rollback / full cleanup ("don't break anything" guarantee)

```bash
cd ~/wavvon && docker compose down -v   # container + data volume gone
# ORDER MATTERS: remove the symlink BEFORE deleting anything in ~/wavvon
sudo rm /etc/nginx/sites-enabled/wavvon.videogamezone.eu
sudo nginx -t && sudo systemctl reload nginx
rm -rf ~/wavvon                          # only after the symlink is gone
# (no ufw rule was needed — no firewall on the box)
```

Nothing else on the box is touched: no packages installed, no system
config edited, data confined to the Docker volume and `~/wavvon`.

## Open items

- [ ] v0.2.1 release (gate A) or dev image transfer (gate B)
- [ ] Friend: docker group, vhost install, UDP 3001, owner pubkey
- [ ] After stable: list his hub on discovery (his call), federation test
      against one of our hubs — first real two-operator alliance test
