# Road Game

A road trip spotting game for Android built with Python and Kivy. Players watch for things out the window, rack up credits by holding the Watch button, then spend those credits to score Sightings. Difficulty ramps up as your score grows.

## How to Play

There are three buttons and a toggle switch:

### Spot (A)
When you see something out the window — an animal, a building, a sign, anything in the distance or up close — press Spot to score it. The sky and the road don't count. Each press costs one Credit and scores one Sighting.

### Watch (B)
Once you've spotted something, keep your eyes on it and hold Watch (or toggle it on with the switch) to accumulate **Credits** the whole time you're watching. The longer you hold your gaze, the more credits you build up — and the better the power-up you'll earn for that hold.

When your target goes out of sight, if you immediately lock onto something new you don't need to toggle Watch off and back on. Just press Spot for the new thing and Watch resets automatically — then start watching again.

### Switch (C)
Switches the active **Category** between Nature and Man-made. Costs 20 points (more at higher scores). Pressing Switch also acts as a Spot.

### Toggle switch
Flips Watch between hold-to-accumulate and tap-to-toggle mode.

---

## Power-ups

When you accumulate enough Credits during a hold, a power-up appears in the **Power-ups** dropdown:

| Credits held | Tier |
|---|---|
| 10+ | Level 1 |
| 30+ | Level 2 |
| 60+ | Level 3 |

The option upgrades to the best tier you reach before committing. Select it from the dropdown to activate it.

### Level 1
| Power-up | Effect |
|---|---|
| 5 sec ∞ looks | Temporarily floods Credits, then resets |
| 5 sec 2x pnts. | Double points on every Spot for 5 seconds |
| Best next power-up | Next power-up earned is always the best variant |
| Next switch free | Next Switch press has no point penalty |
| Double next hold | Next A or C press won't reset your Watch timer |

### Level 2
| Power-up | Effect |
|---|---|
| 10 sec ∞ looks | Same as 1a but for 10 seconds |
| 10 sec 2x pnts. | Same as 1b but for 10 seconds |
| Next hold 2x pnts. for lks. | During the next hold, every Spot is worth double |
| 3x pnts. looking at grass, 5s | Shows a Grass switch — if on, Spots score triple for 5 seconds |
| Next power-up lvl+1 | Next earned power-up is bumped up one tier |

### Level 3
| Power-up | Effect |
|---|---|
| Flip next C to +20 | Next Switch gives +20 instead of costing points |
| 2× pending now | Doubles your current pending Credits immediately |
| Roll again | Re-rolls the top power-up in the list |
| Next A = looks × pnts. | Next Spot scores your full Credit balance and clears it |
| Next hold linear pnts. | During the next hold, each tick scores directly in an increasing sequence (1, 2, 3…) |

---

## Random Flashes

Events flash on screen periodically and have real effects when they resolve:

| Flash | Effect |
|---|---|
| Switch! | Press Switch within 3 seconds or lose points |
| Nature: -X lks, -Y pts | Penalises you if your category is currently Nature |
| Man-made: -X lks, -Y pts | Penalises you if your category is currently Man-made |
| Next 10 lks: switch cat. | Next 10 Spot presses require a category switch or cost 5 pts each |
| Power-up stolen! (purple) | Removes the top power-up from your list |

---

## Difficulty Scaling

The game gets harder as your Sightings score climbs:

| Score | Watch speed | Switch penalty | Flash frequency |
|---|---|---|---|
| 0–199 | 1s per credit | −20 pts | every 30–90s |
| 200–499 | 1.5s per credit | −20 pts | every 30–90s |
| 500–799 | 2s per credit | −30 pts | every 30–90s |
| 800–999 | 3s per credit | −40 pts | every 15–45s |
| 1000+ | 4s per credit | −50 pts | every 15–45s |

Credits also decay passively once you accumulate too many:

| Score | Drain amount | Kicks in above |
|---|---|---|
| 500+ | −1 every 10s | 150 credits |
| 800+ | −2 every 10s | 100 credits |
| 1000+ | −2 every 10s | 45 credits |

Power-ups in your list also expire at high scores (5 min at 800+, 3 min at 1000+), and the "Power-up stolen!" flash is twice as likely above 800.

A yellow **Level Up Difficulty** flash appears when you cross each threshold.

---

## Running Locally

Requires a display (WSLg, Linux desktop, or macOS/Windows with Kivy support).

```bash
python3 -m venv .venv
.venv/bin/pip install kivy
.venv/bin/python main.py
```

## Building for Android

```bash
pip3 install buildozer cython
buildozer android debug
# APK lands in bin/
```

Target: Android API 34, min API 21, `arm64-v8a` + `armeabi-v7a`.
