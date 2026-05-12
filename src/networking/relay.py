"""
Thin relay client that uses ntfy.sh as a free message broker.
Room topics are prefixed with "roadgame-" to avoid collisions.
Both players subscribe to the same topic; each message carries a
sender tag so players ignore their own echoed messages.
"""

import json
import random
import string
import threading
import time
import urllib.error
import urllib.request

RELAY = "https://ntfy.sh"


def new_room_code(n=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))


class RelayClient:
    def __init__(self, room_code, sender_id, message_handler=None):
        """
        room_code   – shared code both players enter
        sender_id   – unique string for this device so echoed messages are ignored
        message_handler – callable(msg: dict) invoked on the Kivy main thread
        """
        self._topic = f"roadgame-{room_code.upper()}"
        self._sender = sender_id
        self._handler = message_handler
        self._stop = threading.Event()
        self._thread = None
        self._last_id = "all"

    def set_message_handler(self, handler):
        self._handler = handler

    def start(self):
        self._stop.clear()
        self._thread = threading.Thread(target=self._poll_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()

    def send(self, **payload):
        payload["_from"] = self._sender
        body = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{RELAY}/{self._topic}",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        threading.Thread(target=self._do_post, args=(req,), daemon=True).start()

    def _do_post(self, req):
        try:
            urllib.request.urlopen(req, timeout=8)
        except Exception:
            pass

    def _poll_loop(self):
        from kivy.clock import Clock
        while not self._stop.is_set():
            try:
                url = f"{RELAY}/{self._topic}/json?poll=1&since={self._last_id}"
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=20) as resp:
                    for raw in resp:
                        if self._stop.is_set():
                            return
                        raw = raw.decode().strip()
                        if not raw:
                            continue
                        try:
                            envelope = json.loads(raw)
                            self._last_id = envelope.get("id", self._last_id)
                            msg = json.loads(envelope.get("message", "{}"))
                            if msg and msg.get("_from") != self._sender and self._handler:
                                Clock.schedule_once(lambda dt, m=msg: self._handler(m), 0)
                        except Exception:
                            pass
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    time.sleep(15)
            except Exception:
                pass
            self._stop.wait(3)
