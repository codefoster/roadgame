import random
import string

from kivy.app import App
from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.graphics import Color, Rectangle

from src.networking.relay import RelayClient, new_room_code


def _new_sender_id():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))


class LobbyScreen(Screen):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._client = None
        self._role = None
        self._sender_id = _new_sender_id()

        layout = BoxLayout(orientation='vertical', padding=50, spacing=18)

        layout.add_widget(Label(
            text="Online Play",
            font_size="40sp", bold=True,
            size_hint_y=None, height=60,
        ))

        self._status = Label(
            text="Create a room or enter a code to join.",
            font_size="17sp",
            size_hint_y=None, height=50,
        )
        layout.add_widget(self._status)

        # Room code display (host shows this to friend)
        self._code_label = Label(
            text="",
            font_size="52sp", bold=True,
            color=(1, 0.85, 0, 1),
            size_hint_y=None, height=80,
        )
        layout.add_widget(self._code_label)

        # Room code input (guest types this)
        self._code_input = TextInput(
            hint_text="Room code",
            font_size="36sp",
            multiline=False,
            size_hint_y=None, height=70,
            halign='center',
        )
        layout.add_widget(self._code_input)

        # Create / Join row
        action_row = BoxLayout(size_hint=(1, None), height=70, spacing=16)
        self._btn_create = Button(text="Create Room", font_size="22sp")
        self._btn_create.bind(on_press=self._create_room)
        self._btn_join = Button(text="Join Room", font_size="22sp")
        self._btn_join.bind(on_press=self._join_room)
        action_row.add_widget(self._btn_create)
        action_row.add_widget(self._btn_join)
        layout.add_widget(action_row)

        self._btn_start = Button(
            text="Start Game",
            font_size="30sp",
            size_hint_y=None, height=90,
            disabled=True,
        )
        self._btn_start.bind(on_press=self._launch_game)
        layout.add_widget(self._btn_start)

        btn_back = Button(
            text="Back",
            font_size="18sp",
            size_hint_y=None, height=50,
        )
        btn_back.bind(on_press=self._go_back)
        layout.add_widget(btn_back)

        layout.add_widget(Label())  # spacer
        self.add_widget(layout)

    # ── Room actions ──────────────────────────────────────────────────────────

    def _create_room(self, *_):
        code = new_room_code()
        self._role = 'host'
        self._code_label.text = code
        self._code_input.disabled = True
        self._btn_create.disabled = True
        self._btn_join.disabled = True
        self._status.text = "Share this code with your friend, then wait..."
        self._client = RelayClient(code, self._sender_id, self._on_message)
        self._client.start()

    def _join_room(self, *_):
        code = self._code_input.text.strip().upper()
        if len(code) < 4:
            self._status.text = "Enter the room code your friend shared."
            return
        self._role = 'guest'
        self._code_label.text = code
        self._code_input.disabled = True
        self._btn_create.disabled = True
        self._btn_join.disabled = True
        self._status.text = f"Connecting to {code}..."
        self._client = RelayClient(code, self._sender_id, self._on_message)
        self._client.start()
        self._client.send(t='join')

    def _on_message(self, msg):
        t = msg.get('t')
        if t == 'join' and self._role == 'host':
            self._status.text = "Friend connected! Tap Start Game when ready."
            self._btn_start.disabled = False
        elif t == 'welcome' and self._role == 'guest':
            self._status.text = "Connected! Waiting for host to start..."
        elif t == 'start':
            self._launch_game()

    def _launch_game(self, *_):
        if self._role == 'host':
            self._client.send(t='start')
            # Also send a welcome so the guest's lobby shows "connected"
            self._client.send(t='welcome')
        app = App.get_running_app()
        app.mp_client = self._client
        app.mp_active = True
        app.mp_role = self._role
        self.manager.current = 'main'

    def _go_back(self, *_):
        self._cleanup()
        self.manager.current = 'start'

    def _cleanup(self):
        if self._client:
            self._client.stop()
            self._client = None
        app = App.get_running_app()
        app.mp_client = None
        app.mp_active = False
        app.mp_role = None

    def on_leave(self):
        self._code_label.text = ""
        self._code_input.text = ""
        self._code_input.disabled = False
        self._btn_create.disabled = False
        self._btn_join.disabled = False
        self._btn_start.disabled = True
        self._status.text = "Create a room or enter a code to join."
        self._role = None
        self._client = None
        self._sender_id = _new_sender_id()
