[app]
title = Road Game
package.name = roadgame
package.domain = com.codefoster

source.dir = .
source.include_exts = py,png,jpg,kv,atlas

version = 0.1

requirements = python3,kivy

orientation = portrait
fullscreen = 0

android.permissions = INTERNET
android.api = 34
android.minapi = 21
android.ndk = 25b
android.sdk = 34
android.archs = arm64-v8a, armeabi-v7a

android.allow_backup = True

[buildozer]
log_level = 2
warn_on_root = 1
