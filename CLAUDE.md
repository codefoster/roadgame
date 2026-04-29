# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
# First time setup
python3 -m venv .venv
.venv/bin/pip install kivy

# Run locally (requires WSLg or a display)
.venv/bin/python main.py
```

## Android packaging (WSL only)

```bash
# Install buildozer once
pip3 install buildozer cython

# Build debug APK (first run takes 15-30 min)
buildozer android debug

# Output lands in bin/
```

## Architecture

`main.py` bootstraps a Kivy `ScreenManager` and registers screens from `src/screens/`. Each screen is a `kivy.uix.screenmanager.Screen` subclass that builds its own widget tree in `__init__`.

New screens go in `src/screens/`, reusable widgets in `src/components/`. Register new screens in `main.py` via `sm.add_widget(MyScreen(name="myscreen"))`.

Timed/recurring logic uses `kivy.clock.Clock.schedule_interval` — always cancel the returned event handle on screen exit or release to avoid runaway callbacks.

## Deployment target

- Android API 34, min API 21, architectures `arm64-v8a` + `armeabi-v7a`
- Package: `com.codefoster.roadgame`
- Config lives in `buildozer.spec`
