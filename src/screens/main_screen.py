import random

from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.switch import Switch
from kivy.uix.spinner import Spinner
from kivy.clock import Clock
from kivy.graphics import Color, Rectangle


class MainScreen(Screen):
    """Scoreboard screen: A awards points, B accumulates 'Looks' over time, C deducts."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Committed scores shown in the labels.
        self.score_a = 0
        self.score_b = 0
        # Looks earned during the current B press are buffered here until commit,
        # so a single hold/toggle session can be reset or discarded as one unit.
        self._pending_b = 0
        self._clock_event = None  # active Clock interval while B is being held/toggled
        self._toggle_mode = False  # Switch state: tap-to-toggle vs press-and-hold for B
        self._run_tier = 0     # highest tier crossed in the current B run
        self._run_option = None  # name of the option earned this run (upgraded in-place)
        self._double_points_event = None   # Clock event for 1b/2b double-points timer
        self._grass_event = None           # Clock event for 2d grass-mode timer
        self._infinite_looks_event = None  # Clock interval for 1a/2a infinite-looks ticks
        self._powerup_ticks_left = 0
        self._pre_powerup_score_b = 0
        self._double_points = False  # True while 1b power-up is active
        self._force_sub_e = False    # True after 1c is used; next power-up rolls sub 'e'
        self._next_c_free = False    # True after 1d is used; next C press is a no-op
        self._next_ac_keep_b = False  # True after 1e is used; next A/C press keeps B running
        self._next_hold_2x = False    # True after 2c is used; next B run converts looks to 2x points
        self._hold_double_points = False  # True during a 2c-enhanced B run
        self._grass_mode = False          # True while 2d is active; A gives 3x if grass switch is on
        self._next_powerup_level_up = False   # True after 2e; next power-up earned is one tier higher
        self._level_up_used_this_run = False   # True once 2e boost is applied in the current run
        self._next_hold_linear = False         # True after 3e; next hold gives triangular point awards
        self._linear_mode = False              # True during a 3a-enhanced hold
        self._linear_press_count = 0           # A-press counter for triangular sequence
        self._next_a_multiply = False          # True after 3d; next A awards looks-count points and clears looks
        self._next_c_flip = False              # True after 3a; next C gives +20 instead of −20
        self._flash_c_window = False           # True for 3 sec after "Switch categories" flash
        self._flash_c_event = None             # scheduled penalty if C isn't pressed in time
        self._category = "Nature"              # current category; toggled by every real C press
        self._forced_c_remaining = 0           # A presses still requiring a C swap; each wrong A costs 5 pts
        self._powerup_expiry_events = {}       # {name: Clock event} for timed power-up expiry
        self._decay_event = None               # set after layout; ticks credit decay every 10 s
        self._level_flash_busy = False         # prevents overlapping level-up flashes
        self._challenge = None                 # active challenge dict or None
        self._best_hold = 0                    # longest single natural-hold credit count this session
        self._patience_event = None            # fires +5 pts after 30s without spotting
        self._levelup_reprieve_window = False  # True during 5s pay-to-delay window
        self._levelup_reprieve_threshold = None
        self._levelup_reprieve_event = None
        self._levelup_reprieved = set()        # thresholds already offered a reprieve (no second chance)
        self._condition = 'sunny'
        self._rainy_a_counter = 0
        self._bingo_card = []
        self._bingo_marked = [False] * 9
        self._bingo_buttons = []
        self._bingo_visible = False

        with self.canvas.before:
            self._flash_color = Color(0, 0, 0, 0)
            self._flash_rect = Rectangle(pos=self.pos, size=self.size)
        self.bind(pos=self._update_flash_rect, size=self._update_flash_rect)
        self._schedule_next_flash()

        layout = BoxLayout(orientation="vertical", padding=40, spacing=20)

        # Control row: condition selector, bingo toggle.
        control_row = BoxLayout(size_hint=(1, None), height=44, spacing=6)
        self.spinner_condition = Spinner(
            text="Sunny",
            values=("Sunny", "Rainy", "Foggy", "Night"),
            font_size="15sp",
            size_hint_x=0.4,
        )
        self.spinner_condition.bind(text=self._on_condition_select)
        control_row.add_widget(self.spinner_condition)
        self.btn_bingo = Button(text="Bingo", font_size="15sp")
        self.btn_bingo.bind(on_press=lambda x: self._toggle_bingo())
        control_row.add_widget(self.btn_bingo)
        layout.add_widget(control_row)

        # Power-ups dropdown row.
        top_row = BoxLayout(size_hint=(1, None), height=50)
        top_row.add_widget(Label())
        self.dropdown_d = Spinner(
            text="Power-ups",
            values=(),
            font_size="20sp",
            size_hint=(None, 1),
            width=230,
        )
        self.dropdown_d.bind(text=self._on_d_select)
        top_row.add_widget(self.dropdown_d)
        layout.add_widget(top_row)

        self.label_a = Label(text="Sightings: 0", font_size="48sp")
        self.label_b = Label(text="Credits: 0", font_size="48sp")
        self.label_cat = Label(text="Category: Nature", font_size="24sp")
        self.label_best = Label(text="Best hold: —", font_size="18sp")

        # C button on left (above A), switch on right (above B)
        switch_c_layout = BoxLayout(spacing=20, size_hint=(1, 0.6))
        self.utn_c = Button(text="Switch", font_size="32sp")
        self.utn_c.bind(on_press=self._press_c)
        self.toggle_switch = Switch(active=False)
        self.toggle_switch.bind(active=self._on_switch)
        switch_c_layout.add_widget(self.utn_c)
        switch_c_layout.add_widget(self.toggle_switch)

        # Grass row — hidden until 2d power-up is active.
        # Left half (above A): label + switch together. Right half: empty spacer above B.
        self.grass_row = BoxLayout(size_hint=(1, None), height=0)
        grass_left = BoxLayout(size_hint_x=0.5, spacing=10)
        grass_left.add_widget(Label(text="Grass?", font_size="20sp"))
        self.grass_switch = Switch(active=False)
        grass_left.add_widget(self.grass_switch)
        self.grass_row.add_widget(grass_left)
        self.grass_row.add_widget(Label(size_hint_x=0.5))  # spacer above B

        btn_layout = BoxLayout(spacing=20, size_hint=(1, 1.5))
        self.btn_a = Button(text="Spot", font_size="32sp", disabled=True)
        self.btn_b = Button(text="Watch", font_size="32sp")
        self.btn_a.bind(on_press=self._press_a)
        self.btn_b.bind(on_press=self._b_press, on_release=self._b_release)

        btn_layout.add_widget(self.btn_a)
        btn_layout.add_widget(self.btn_b)
        layout.add_widget(self.label_a)
        layout.add_widget(self.label_b)
        layout.add_widget(self.label_cat)
        layout.add_widget(self.label_best)
        layout.add_widget(switch_c_layout)
        layout.add_widget(self.grass_row)
        layout.add_widget(btn_layout)

        self.add_widget(layout)

        # Overlaid label shown during flashes — added after layout so it renders on top.
        from kivy.uix.label import Label as _Label
        self.flash_label = _Label(
            text="",
            font_size="48sp",
            bold=True,
            color=(0, 0, 0, 1),
            pos_hint={"center_x": 0.5, "center_y": 0.6},
            size_hint=(1, None),
            height=80,
        )
        self.add_widget(self.flash_label)

        # Bingo overlay — hidden until toggled.
        bingo_panel = BoxLayout(
            orientation='vertical',
            pos_hint={'center_x': 0.5, 'center_y': 0.45},
            size_hint=(0.92, 0.62),
            padding=8, spacing=5,
        )
        with bingo_panel.canvas.before:
            Color(0.12, 0.12, 0.12, 0.96)
            _bingo_bg = Rectangle(pos=bingo_panel.pos, size=bingo_panel.size)
        bingo_panel.bind(
            pos=lambda w, v: setattr(_bingo_bg, 'pos', v),
            size=lambda w, v: setattr(_bingo_bg, 'size', v),
        )
        bingo_hdr = BoxLayout(size_hint=(1, None), height=38, spacing=8)
        bingo_hdr.add_widget(Label(text="BINGO", font_size="20sp", bold=True))
        btn_close_bingo = Button(text="Close", size_hint=(None, 1), width=80, font_size="14sp")
        btn_close_bingo.bind(on_press=lambda x: self._toggle_bingo())
        bingo_hdr.add_widget(btn_close_bingo)
        bingo_panel.add_widget(bingo_hdr)
        bingo_grid = GridLayout(cols=3, spacing=4)
        self._bingo_buttons = []
        for i in range(9):
            btn = Button(text="...", font_size="12sp")
            btn.bind(on_press=lambda x, idx=i: self._mark_bingo_cell(idx))
            self._bingo_buttons.append(btn)
            bingo_grid.add_widget(btn)
        bingo_panel.add_widget(bingo_grid)
        self._bingo_panel = bingo_panel
        # Panel is NOT added to the widget tree until the user opens it,
        # because a disabled Kivy widget still consumes touches in its bounds.

        self._decay_event = Clock.schedule_interval(self._tick_decay, 10)
        self._new_bingo_card()

    _OPTION_NAMES = {
        "1a": "(L1)5 sec ∞ looks",
        "1b": "(L1)5 sec 2x pnts.",
        "1c": "(L1)Best next power-up",
        "1d": "(L1)Next switch free",
        "1e": "(L1)Double next hold",
        "2a": "(L2)10 sec ∞ looks",
        "2b": "(L2)10 sec 2x pnts.",
        "2c": "(L2)Next hold 2xpnts. for lks.",
        "2d": "(L2)3x pnts. looking at grass, 5s",
        "2e": "(L2)Next power-up lvl+1",
        "3a": "(L3)Flip next C to +20",
        "3b": "(L3)2× pending now",
        "3c": "(L3)Roll again",
        "3d": "(L3)Next A = looks × pnts.", #Should make this xpoints under 50
        "3e": "(L3)Next hold linear pnts.",
    }

    # (min_score, tick_interval_seconds) — checked highest-first.
    _DIFFICULTY_STEPS = [
        (1000, 3.0),
        (800,  2.5),
        (500,  2.0),
        (200,  1.5),
        (0,    1.0),
    ]

    _CONDITIONS = ['sunny', 'rainy', 'foggy', 'night']
    _CONDITION_LABELS = {
        'sunny': 'Sunny', 'rainy': 'Rainy', 'foggy': 'Foggy', 'night': 'Night',
    }
    _BINGO_ITEMS = [
        "Bridge", "Tunnel", "Cow", "Truck stop", "Billboard",
        "Water tower", "Church", "School bus", "Semi truck",
        "Road work", "River/lake", "Train", "Gas station",
        "Rest area", "Police car", "Barn", "Wind turbine",
        "Boat", "Silo", "Mountain", "State sign",
        "Motorcycle", "Fast food", "Fire truck", "Tractor",
    ]

    def _b_interval(self):
        for threshold, interval in self._DIFFICULTY_STEPS:
            if self.score_a >= threshold:
                return interval
        return 1.0

    def _c_penalty(self):
        if self.score_a >= 1000:
            return 50
        elif self.score_a >= 800:
            return 40
        elif self.score_a >= 500:
            return 30
        return 20

    def _flash_penalties(self):
        """Returns (nature_lks, nature_pts, manmade_lks, manmade_pts) for the current score tier."""
        if self.score_a >= 1000:
            return 30, 40, 40, 30
        elif self.score_a >= 800:
            return 25, 40, 40, 25
        elif self.score_a >= 500:
            return 15, 30, 30, 15
        return 10, 25, 25, 10

    def _tick_decay(self, dt):
        if self.score_a >= 1000:
            if self.score_b <= 45:
                return
            amount = 2
        elif self.score_a >= 800:
            if self.score_b <= 100:
                return
            amount = 2
        elif self.score_a >= 500:
            if self.score_b <= 150:
                return
            amount = 1
        else:
            return
        self.score_b = max(0, self.score_b - amount)
        if self._pending_b:
            self.label_b.text = f"Credits: {self.score_b} (+{self._pending_b})"
        else:
            self.label_b.text = f"Credits: {self.score_b}"
        self.btn_a.disabled = self.score_b < 1

    def _powerup_expiry_time(self):
        if self.score_a >= 1000:
            return 180
        elif self.score_a >= 800:
            return 300
        return None

    def _schedule_powerup_expiry(self, name):
        expiry = self._powerup_expiry_time()
        if expiry is None:
            return
        event = Clock.schedule_once(lambda dt, n=name: self._expire_powerup(n), expiry)
        self._powerup_expiry_events[name] = event

    def _cancel_powerup_expiry(self, name):
        event = self._powerup_expiry_events.pop(name, None)
        if event:
            event.cancel()

    def _expire_powerup(self, name):
        self._powerup_expiry_events.pop(name, None)
        values = list(self.dropdown_d.values)
        if name in values:
            values.remove(name)
            self.dropdown_d.values = tuple(values)

    _LEVEL_THRESHOLDS = (200, 500, 800, 1000)

    def _check_level_thresholds(self, old_score):
        for t in self._LEVEL_THRESHOLDS:
            if old_score < t <= self.score_a:
                if self._levelup_reprieve_window:
                    break  # already in a reprieve window, skip
                if t not in self._levelup_reprieved:
                    self._offer_levelup_reprieve(t)
                else:
                    self._do_level_up_flash()
                break

    def _do_level_up_flash(self):
        if self._level_flash_busy:
            return
        self._level_flash_busy = True
        self._run_level_flash(3)

    def _run_level_flash(self, blinks):
        if blinks == 0:
            self._level_flash_busy = False
            return
        self._flash_color.rgba = (1, 1, 0, 1)
        self.flash_label.text = "Level Up Difficulty"
        Clock.schedule_once(lambda dt: self._level_flash_pause(blinks), 0.4)

    def _level_flash_pause(self, blinks):
        self._flash_color.rgba = (0, 0, 0, 0)
        self.flash_label.text = ""
        Clock.schedule_once(lambda dt: self._run_level_flash(blinks - 1), 0.2)

    def _offer_levelup_reprieve(self, threshold):
        self._levelup_reprieve_window = True
        self._levelup_reprieve_threshold = threshold
        self._flash_color.rgba = (1, 0.7, 0, 1)
        self.flash_label.text = "Level up! Press C to pay 20 pts and delay"
        self._levelup_reprieve_event = Clock.schedule_once(self._levelup_reprieve_expired, 5)

    def _levelup_reprieve_expired(self, dt):
        self._levelup_reprieve_window = False
        self._levelup_reprieve_threshold = None
        self._levelup_reprieve_event = None
        self._flash_color.rgba = (0, 0, 0, 0)
        self.flash_label.text = ""
        self._do_level_up_flash()

    def _update_flash_rect(self, *args):
        self._flash_rect.pos = self.pos
        self._flash_rect.size = self.size

    def _schedule_next_flash(self):
        if self._condition == 'night':
            delay = random.uniform(8, 25)
        elif self.score_a >= 800:
            delay = random.uniform(15, 45)
        else:
            delay = random.uniform(30, 90)
        Clock.schedule_once(self._do_flash, delay)

    def _do_flash(self, dt):
        nlks, npts, mlks, mpts = self._flash_penalties()
        watch_target = max(5, int(20 / self._b_interval()))
        options = [
            ((1, 0, 0, 1), "Switch!"),
            ((0, 1, 0, 1), f"Nature: -{nlks} lks, -{npts} pts"),
            ((1, 1, 1, 1), f"Man-made: -{mlks} lks, -{mpts} pts"),
            ((0, 0, 1, 1), "Next 10 lks: switch cat."),
            ((0.6, 0, 1, 1), "Power-up stolen!"),
            ((1, 0.5, 0, 1), "Challenge: Spot 3 in 20s!"),
            ((0, 0.9, 0.9, 1), f"Challenge: Watch {watch_target} credits!"),
            ((0.4, 1, 0.4, 1), "Challenge: Earn an L2+ power-up!"),
            ((1, 0.2, 0.8, 1), "Challenge: Switch 2× in 30s!"),
        ]
        weights = [1, 1, 1, 1, 2, 1, 1, 1, 1] if self.score_a >= 800 else [1, 1, 1, 1, 1, 1, 1, 1, 1]
        color, text = random.choices(options, weights=weights)[0]
        self._run_flash(color, text, flashes_remaining=3)

    def _run_flash(self, color, text, flashes_remaining):
        if flashes_remaining == 0:
            self._schedule_next_flash()
            if text == "Switch!":
                self._start_flash_c_window()
            elif text.startswith("Nature: -"):
                if self._category == "Nature":
                    nlks, npts, _, _ = self._flash_penalties()
                    self.score_b = max(0, self.score_b - nlks)
                    self.score_a = max(0, self.score_a - npts)
                    self.label_b.text = f"Credits: {self.score_b}"
                    self.label_a.text = f"Sightings: {self.score_a}"
                    self.btn_a.disabled = self.score_b < 1
            elif text.startswith("Man-made: -"):
                if self._category == "Man-made":
                    _, _, mlks, mpts = self._flash_penalties()
                    self.score_b = max(0, self.score_b - mlks)
                    self.score_a = max(0, self.score_a - mpts)
                    self.label_b.text = f"Credits: {self.score_b}"
                    self.label_a.text = f"Sightings: {self.score_a}"
                    self.btn_a.disabled = self.score_b < 1
            elif text == "Next 10 lks: switch cat.":
                self._forced_c_remaining = 10
            elif text == "Power-up stolen!":
                if self.dropdown_d.values:
                    stolen = self.dropdown_d.values[0]
                    self._cancel_powerup_expiry(stolen)
                    self.dropdown_d.values = self.dropdown_d.values[1:]
            elif text.startswith("Challenge: "):
                if self._challenge is None:
                    self._start_challenge_from_text(text)
            return
        self._flash_color.rgba = color
        self.flash_label.text = "???" if self._condition == 'foggy' else text
        Clock.schedule_once(
            lambda dt: self._flash_pause(color, text, flashes_remaining), 0.3
        )

    def _toggle_category(self):
        self._category = "Man-made" if self._category == "Nature" else "Nature"
        self.label_cat.text = f"Category: {self._category}"
        if self._challenge and self._challenge['type'] == 'switch':
            self._challenge['progress'] += 1
            if self._challenge['progress'] >= self._challenge['target']:
                self._complete_challenge()

    def _start_flash_c_window(self):
        self._flash_c_window = True
        self._flash_c_event = Clock.schedule_once(self._flash_c_penalty, 3)

    def _flash_c_penalty(self, dt):
        self._flash_c_window = False
        self._flash_c_event = None
        self.score_a = max(0, self.score_a - self._c_penalty())
        self.label_a.text = f"Sightings: {self.score_a}"

    def _flash_pause(self, color, text, flashes_remaining):
        self._flash_color.rgba = (0, 0, 0, 0)
        self.flash_label.text = ""
        Clock.schedule_once(
            lambda dt: self._run_flash(color, text, flashes_remaining - 1), 0.2
        )

    def _show_flash_once(self, color, text):
        self._flash_color.rgba = color
        self.flash_label.text = text
        Clock.schedule_once(self._clear_flash_once, 1.0)

    def _clear_flash_once(self, dt):
        self._flash_color.rgba = (0, 0, 0, 0)
        self.flash_label.text = ""

    def _start_challenge_from_text(self, text):
        if "Spot 3 in 20s" in text:
            self._start_challenge('spot', target=3, window_sec=20, reward_pts=10, reward_lks=0)
        elif text.startswith("Challenge: Watch ") and "credits!" in text:
            target = int(text.split()[2])
            self._start_challenge('watch', target=target, window_sec=60, reward_pts=0, reward_lks=15)
        elif "L2+" in text:
            self._start_challenge('powerup', target=2, window_sec=45, reward_pts=20, reward_lks=0)
        elif "Switch 2×" in text:
            self._start_challenge('switch', target=2, window_sec=30, reward_pts=15, reward_lks=0)

    def _start_challenge(self, ctype, target, window_sec, reward_pts, reward_lks):
        self._challenge = {
            'type': ctype,
            'target': target,
            'progress': 0,
            'deadline_event': Clock.schedule_once(self._expire_challenge, window_sec),
            'reward_pts': reward_pts,
            'reward_lks': reward_lks,
        }

    def _expire_challenge(self, dt):
        self._challenge = None

    def _complete_challenge(self):
        if self._challenge is None:
            return
        ch = self._challenge
        self._challenge = None
        ch['deadline_event'].cancel()
        if ch['reward_pts'] > 0:
            old = self.score_a
            self.score_a += ch['reward_pts']
            self.label_a.text = f"Sightings: {self.score_a}"
            self._check_level_thresholds(old)
        if ch['reward_lks'] > 0:
            self.score_b += ch['reward_lks']
            self.label_b.text = f"Credits: {self.score_b}"
            self.btn_a.disabled = self.score_b < 1
        reward = f"+{ch['reward_pts']} pts" if ch['reward_pts'] > 0 else f"+{ch['reward_lks']} lks"
        self._show_flash_once((0, 1, 0.5, 1), f"Challenge done! {reward}")

    def _schedule_patience(self):
        if self._patience_event:
            self._patience_event.cancel()
        if self.score_b > 0:
            self._patience_event = Clock.schedule_once(self._give_patience_bonus, 30)

    def _give_patience_bonus(self, dt):
        self._patience_event = None
        if self.score_b < 1:
            return
        old = self.score_a
        self.score_a += 5
        self.label_a.text = f"Sightings: {self.score_a}"
        self._check_level_thresholds(old)
        self._show_flash_once((0.6, 0.8, 1, 1), "Patience +5 pts!")
        self._patience_event = Clock.schedule_once(self._give_patience_bonus, 30)

    def _commit_b(self):
        # Bank pending credits. Per-hold flags (linear mode, hold 2x) are cleared
        # by _end_hold, not here, so mid-hold A presses don't lose those effects.
        self.score_b += self._pending_b
        self._pending_b = 0
        self.dropdown_d.text = "Power-ups"
        self.dropdown_d.disabled = False
        self.label_b.text = f"Credits: {self.score_b}"
        self.btn_a.disabled = self.score_b < 1

    def _end_hold(self):
        if self._pending_b > self._best_hold and self._pending_b > 0:
            self._best_hold = self._pending_b
            self.label_best.text = f"Best hold: {self._best_hold}"
            key = f"1{random.choice('abcde')}"
            name = self._OPTION_NAMES[key]
            self.dropdown_d.values = tuple(self.dropdown_d.values) + (name,)
            self._schedule_powerup_expiry(name)
            self._show_flash_once((0, 1, 0.3, 1), f"New record! {self._best_hold} credits!")
        self._hold_double_points = False
        self._linear_mode = False
        self._linear_press_count = 0
        self._commit_b()

    def _update_d_options(self):
        # The option upgrades as you cross higher tiers within a run — one slot per run,
        # but it reflects the best tier you reached before committing.
        if self._pending_b >= 60:
            tier = 3
        elif self._pending_b >= 30:
            tier = 2
        elif self._pending_b >= 10:
            tier = 1
        else:
            return
        force_sub_e = self._force_sub_e
        if self._next_powerup_level_up:
            # Re-applied on every tier upgrade within the run; consumed when the run ends.
            if tier < 3:
                tier += 1
            else:
                force_sub_e = True
            self._level_up_used_this_run = True
        if tier <= self._run_tier:
            return
        if self._challenge and self._challenge['type'] == 'powerup' and tier >= 2:
            self._complete_challenge()
        self._run_tier = tier
        if force_sub_e:
            sub = "e"
            self._force_sub_e = False
        else:
            sub = random.choice("abcde")
        key = f"{tier}{sub}"
        name = self._OPTION_NAMES.get(key, f"Option {key}")
        if self._run_option is not None:
            # Upgrade: swap the previous run option for the better one.
            self._cancel_powerup_expiry(self._run_option)
            self.dropdown_d.values = tuple(
                name if v == self._run_option else v
                for v in self.dropdown_d.values
            )
            self._schedule_powerup_expiry(name)
        else:
            # First option this run — append and lock until run ends.
            self.dropdown_d.values = tuple(self.dropdown_d.values) + (name,)
            if self._clock_event:
                self.dropdown_d.disabled = True
            self._schedule_powerup_expiry(name)
        self._run_option = name

    def _end_run(self):
        # Consume the level-up flag only if it was actually applied in this run.
        if self._level_up_used_this_run:
            self._next_powerup_level_up = False
            self._level_up_used_this_run = False
        self._run_tier = 0
        self._run_option = None

    def _activate_hold_powerups(self):
        if self._next_hold_2x:
            self._hold_double_points = True
            self._next_hold_2x = False
        if self._next_hold_linear:
            self._linear_mode = True
            self._linear_press_count = 0
            self._next_hold_linear = False

    def _reset_b_timer(self):
        # Commit any pending Looks, then — if the timer is still running (toggle mode) —
        # restart the interval so the next tick is a full second after this press.
        self._commit_b()
        if self._clock_event:
            self._end_run()
            self._linear_mode = False
            self._linear_press_count = 0
            if self._next_hold_linear:
                self._linear_mode = True
                self._next_hold_linear = False
            self._clock_event.cancel()
            self._clock_event = Clock.schedule_interval(self._add_b_point, self._b_interval())

    def _on_d_select(self, instance, value):
        # Spinner sets text to the picked option; snap it back to "Power-ups" so the label
        # is stable. The "Power-ups" callback is the recursion base case.
        if value == "Power-ups":
            return
        values = list(self.dropdown_d.values)
        values.remove(value)
        self.dropdown_d.values = tuple(values)
        self.dropdown_d.text = "Power-ups"
        self._cancel_powerup_expiry(value)
        self._activate_powerup(value)

    def _reroll_top_powerup(self):
        values = list(self.dropdown_d.values)
        if not values:
            return
        # Find the first item that isn't Roll again (already removed by _on_d_select, but guard anyway).
        roll_again_name = self._OPTION_NAMES.get("3c")
        target_idx, target_name = next(
            ((i, v) for i, v in enumerate(values) if v != roll_again_name), (None, None)
        )
        if target_idx is None:
            return
        # Determine tier by reverse-looking up the name in _OPTION_NAMES.
        tier = next(
            (int(k[0]) for k, v in self._OPTION_NAMES.items() if v == target_name), None
        )
        if tier is None:
            return
        # Candidates: same tier, not 'e', not Roll again, not the current option.
        candidates = [
            v for k, v in self._OPTION_NAMES.items()
            if k[0] == str(tier) and k[1] != "e" and k != "3c" and v != target_name
        ]
        if not candidates:
            return
        new_name = random.choice(candidates)
        self._cancel_powerup_expiry(target_name)
        values[target_idx] = new_name
        self.dropdown_d.values = tuple(values)
        self._schedule_powerup_expiry(new_name)

    def _activate_powerup(self, name):
        if name == self._OPTION_NAMES.get("1a"):
            self._start_infinite_looks(duration_sec=5)
        elif name == self._OPTION_NAMES.get("1b"):
            self._start_double_points(duration_sec=5)
        elif name == self._OPTION_NAMES.get("1c"):
            self._force_sub_e = True
        elif name == self._OPTION_NAMES.get("1d"):
            self._next_c_free = True
        elif name == self._OPTION_NAMES.get("1e"):
            self._next_ac_keep_b = True
        elif name == self._OPTION_NAMES.get("2a"):
            self._start_infinite_looks(duration_sec=10)
        elif name == self._OPTION_NAMES.get("2b"):
            self._start_double_points(duration_sec=10)
        elif name == self._OPTION_NAMES.get("2c"):
            self._next_hold_2x = True
        elif name == self._OPTION_NAMES.get("2d"):
            self._start_grass_mode(duration_sec=5)
        elif name == self._OPTION_NAMES.get("2e"):
            self._next_powerup_level_up = True
        elif name == self._OPTION_NAMES.get("3a"):
            self._next_c_flip = True
        elif name == self._OPTION_NAMES.get("3b"):
            self._pending_b *= 2
            self.label_b.text = f"Credits: {self.score_b} (+{self._pending_b})"
        elif name == self._OPTION_NAMES.get("3c"):
            self._reroll_top_powerup()
        elif name == self._OPTION_NAMES.get("3d"):
            self._next_a_multiply = True
        elif name == self._OPTION_NAMES.get("3e"):
            self._next_hold_linear = True

    def _start_double_points(self, duration_sec):
        if self._double_points_event:
            self._double_points_event.cancel()
        self._double_points = True
        self._double_points_event = Clock.schedule_once(self._end_double_points, duration_sec)

    def _end_double_points(self, dt):
        self._double_points = False
        self._double_points_event = None

    def _start_grass_mode(self, duration_sec):
        if self._grass_event:
            self._grass_event.cancel()
        self._grass_mode = True
        self.grass_switch.active = True
        self.grass_row.height = 50
        self._grass_event = Clock.schedule_once(self._end_grass_mode, duration_sec)

    def _end_grass_mode(self, dt):
        self._grass_mode = False
        self.grass_row.height = 0
        self._grass_event = None

    def _start_infinite_looks(self, duration_sec):
        if self._infinite_looks_event:
            self._infinite_looks_event.cancel()
        self._pre_powerup_score_b = self.score_b
        self._powerup_ticks_left = duration_sec * 2  # tick every 0.5 s
        self._infinite_looks_event = Clock.schedule_interval(self._tick_infinite_looks, 0.5)

    def _tick_infinite_looks(self, dt):
        self.score_b += 20
        self.label_b.text = f"Credits: {self.score_b} (+{self._pending_b})"
        self._powerup_ticks_left -= 1
        if self._powerup_ticks_left <= 0:
            self._infinite_looks_event.cancel()
            self._infinite_looks_event = None
            self.score_b = self._pre_powerup_score_b
            self.label_b.text = f"Credits: {self.score_b}"
            self.btn_a.disabled = self.score_b < 1

    def _on_switch(self, instance, value):
        # Flip between hold-to-accumulate and tap-to-toggle. If the user flips off mid-run,
        # cancel the active timer and commit so we don't strand pending Looks.
        self._toggle_mode = value
        if not value and self._clock_event:
            self._clock_event.cancel()
            self._clock_event = None
            self._end_hold()
            self.btn_b.background_color = (1, 1, 1, 255)

    def _apply_a_score(self):
        if self._next_a_multiply:
            self._next_a_multiply = False
            old = self.score_a
            self.score_a += self.score_b
            self.label_a.text = f"Sightings: {self.score_a}"
            self._check_level_thresholds(old)
            self.score_b = 0
            self.label_b.text = "Credits: 0"
            self.btn_a.disabled = True
        else:
            old = self.score_a
            if self._grass_mode and self.grass_switch.active:
                pts = 3
            elif self._double_points or self._hold_double_points:
                pts = 2
            else:
                pts = 1
            if self._condition == 'rainy':
                self._rainy_a_counter += 1
                if self._rainy_a_counter % 2 == 0:
                    pts = 0
            self.score_a += pts
            self.label_a.text = f"Sightings: {self.score_a}"
            self._check_level_thresholds(old)
            self.score_b = max(0, self.score_b - 1)
            self.label_b.text = f"Credits: {self.score_b}"
            self.btn_a.disabled = self.score_b < 1
        if self._challenge and self._challenge['type'] == 'spot':
            self._challenge['progress'] += 1
            if self._challenge['progress'] >= self._challenge['target']:
                self._complete_challenge()
        self._schedule_patience()

    def _press_a(self, instance):
        # A "spends" one banked Look to award one Point (two while 1b is active).
        if self._forced_c_remaining > 0:
            self._forced_c_remaining -= 1
            self.score_a = max(0, self.score_a - 5)
            self.label_a.text = f"Sightings: {self.score_a}"
            return
        if self._next_ac_keep_b:
            self._next_ac_keep_b = False
            self.label_b.text = f"Credits: {self.score_b} (+{self._pending_b})"
        else:
            self._reset_b_timer()
        self._apply_a_score()

    def _b_press(self, instance):
        # In toggle mode, the press alternates start/stop. In hold mode, the press just
        # starts the timer; _b_release stops it.
        if self._toggle_mode:
            if self._clock_event:
                self._clock_event.cancel()
                self._clock_event = None
                self._end_hold()
                self.btn_b.background_color = (1, 1, 1, 255)
            else:
                self._end_run()
                self._activate_hold_powerups()
                self._clock_event = Clock.schedule_interval(self._add_b_point, self._b_interval())
                self.btn_b.background_color = (0, 0, 4, 255)
        else:
            self._end_run()
            self._activate_hold_powerups()
            self._clock_event = Clock.schedule_interval(self._add_b_point, self._b_interval())

    def _b_release(self, instance):
        # Hold-mode only: releasing B stops the timer and commits.
        if not self._toggle_mode:
            if self._clock_event:
                self._clock_event.cancel()
                self._clock_event = None
            self._end_hold()

    def _press_c(self, instance):
        if self._levelup_reprieve_window:
            self._levelup_reprieve_window = False
            t = self._levelup_reprieve_threshold
            self._levelup_reprieve_threshold = None
            if self._levelup_reprieve_event:
                self._levelup_reprieve_event.cancel()
                self._levelup_reprieve_event = None
            self._flash_color.rgba = (0, 0, 0, 0)
            self.flash_label.text = ""
            if self.score_a >= 20:
                self.score_a -= 20
                self.label_a.text = f"Sightings: {self.score_a}"
                self._levelup_reprieved.add(t)
                self._show_flash_once((0, 0.8, 1, 1), "Level-up delayed! -20 pts")
            else:
                self._do_level_up_flash()
            return
        # C always acts as A (awards a point, spends a look), plus its own effect.
        if self._flash_c_window:
            self._flash_c_window = False
            if self._flash_c_event:
                self._flash_c_event.cancel()
                self._flash_c_event = None
            self._toggle_category()
            self._apply_a_score()
            return
        if self._forced_c_remaining > 0:
            self._forced_c_remaining -= 1
            self._toggle_category()
            self._apply_a_score()
            return
        if self._next_c_free:
            self._next_c_free = False
            self._reset_b_timer()
            self._toggle_category()
            self._apply_a_score()
            return
        if self._next_c_flip:
            self._next_c_flip = False
            self._reset_b_timer()
            old = self.score_a
            self.score_a += 20
            self.label_a.text = f"Sightings: {self.score_a}"
            self._check_level_thresholds(old)
            self._toggle_category()
            self._apply_a_score()
            return
        if self._next_ac_keep_b:
            self._next_ac_keep_b = False
        else:
            self._reset_b_timer()
        self.score_a = max(0, self.score_a - self._c_penalty())
        self.label_a.text = f"Sightings: {self.score_a}"
        self._toggle_category()
        if self.score_b >= 1:
            self._apply_a_score()

    def _add_b_point(self, dt):
        if self._linear_mode:
            self._linear_press_count += 1
            old = self.score_a
            self.score_a += self._linear_press_count
            self.label_a.text = f"Sightings: {self.score_a}"
            self._check_level_thresholds(old)
            return
        # Clock callback: adds one Look per tick to the pending buffer.
        self._pending_b += 2 if self._condition == 'rainy' else 1
        self._update_d_options()
        self.label_b.text = f"Credits: {self.score_b} (+{self._pending_b})"
        if self._challenge and self._challenge['type'] == 'watch':
            if self._pending_b >= self._challenge['target']:
                self._complete_challenge()

    def _on_condition_select(self, instance, value):
        self._condition = value.lower()

    # ── Bingo ─────────────────────────────────────────────────────────────────

    def _new_bingo_card(self):
        self._bingo_card = random.sample(self._BINGO_ITEMS, 9)
        self._bingo_marked = [False] * 9
        self._update_bingo_ui()

    def _update_bingo_ui(self):
        for i, btn in enumerate(self._bingo_buttons):
            btn.text = self._bingo_card[i] if i < len(self._bingo_card) else "?"
            btn.background_color = (0.2, 0.75, 0.2, 1) if self._bingo_marked[i] else (1, 1, 1, 1)

    def _toggle_bingo(self, *args):
        self._bingo_visible = not self._bingo_visible
        if self._bingo_visible:
            self.add_widget(self._bingo_panel, index=1)  # below flash_label
        else:
            self.remove_widget(self._bingo_panel)

    def _mark_bingo_cell(self, idx):
        self._bingo_marked[idx] = not self._bingo_marked[idx]
        self._update_bingo_ui()
        if self._bingo_marked[idx]:
            self._check_bingo()

    def _check_bingo(self):
        m = self._bingo_marked
        lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6],
        ]
        for line in lines:
            if all(m[i] for i in line):
                old = self.score_a
                self.score_a += 25
                self.label_a.text = f"Sightings: {self.score_a}"
                self._check_level_thresholds(old)
                self._show_flash_once((1, 1, 0, 1), "BINGO! +25 pts!")
                Clock.schedule_once(lambda dt: self._new_bingo_card(), 2.0)
                break

