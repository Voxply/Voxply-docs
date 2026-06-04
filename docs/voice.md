# Voice

Real-time voice over UDP, Opus-encoded, with RNNoise denoise and voice
activity detection. The capture/encode/playback side lives in the
`voice/` crate in Voxply-desktop; the hub-side UDP relay lives in the
`hub/` crate in Voxply-server. Both sides share the wire format
defined in the `voice/` crate.

## Pipeline

```
mic capture (cpal)
   ↓
RNNoise denoise + VAD
   ↓
Opus encode
   ↓
UDP packet (hub/ crate UDP relay in Voxply-server)
   ↓
Opus decode
   ↓
playback (cpal)
```

## Files

All paths below are in the `voice/` crate of Voxply-desktop:

| Stage              | File |
|--------------------|------|
| Pipeline orch.     | `voice/src/pipeline.rs` |
| Audio capture      | `voice/src/capture.rs` |
| Denoise + VAD      | `voice/src/denoise.rs` |
| Opus codec         | `voice/src/codec.rs` |
| UDP transport      | `voice/src/transport.rs` |
| Wire protocol      | `voice/src/protocol.rs` |
| Audio output       | `voice/src/playback.rs` |
| Device enumeration | `voice/src/devices.rs` |

## Why UDP, not WebRTC

- Predictable latency under loss (we control retransmission policy: none).
- Smaller dependency footprint.
- We already have hub identity for auth — we don't need DTLS-SRTP machinery.

## Why RNNoise + VAD

- RNNoise is small, real-time, and good enough for voice.
- VAD avoids transmitting silence (saves bandwidth + reduces background
  noise on the channel).

## Hub-side relay

The hub's UDP listener (default port 3001) receives encrypted/signed Opus
frames from users currently in voice on a channel and fans them out to
the other connected users on that channel. Frames are not transcoded;
the hub is just an SFU-style relay.

> Note: there's no separate "voice channel" type. Every Voxply channel
> is both text and voice — joining voice is something a user does
> *in* a channel, not a property of the channel itself. See
> [decisions.md](decisions.md).

## Self-mute / self-deafen

Client-side. Self-mute stops capture; self-deafen stops decoding incoming
streams. Neither involves the hub — it's purely UI state. (Hub-side
mute, e.g. moderator mute, is a different mechanism — see roles and
moderation.)

## What's not done

- E2E encryption between voice participants (today the hub sees frames
  as it relays them — see [`threat-model.md`](threat-model.md))
- Cross-hub voice (alliance-wide voice rooms)
- **Per-user gain** — designed in [`voice-volume.md`](voice-volume.md);
  requires adding `sender_id` to fan-out packets and splitting the receive
  pipeline by sender
- **Proximity / spatial attenuation** — designed in
  [`proximity-voice.md`](proximity-voice.md); requires per-user gain first
- Multiple audio output device routing (assign different speakers/headsets
  per participant or per channel; device enumeration is already in
  `voice/src/devices.rs`)
