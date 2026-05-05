import random

from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
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
        self._b_tick = 0  # tick counter used by D-mode's escalating bonus
        self._d_mode = False
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
        self._next_hold_linear = False         # True after 3a; next hold gives triangular point awards
        self._linear_mode = False              # True during a 3a-enhanced hold
        self._linear_press_count = 0           # A-press counter for triangular sequence
        self._next_a_multiply = False          # True after 3d; next A awards looks-count points and clears looks
        self._next_c_flip = False              # True after 3a; next C gives +20 instead of −20
        self._flash_c_window = False           # True for 3 sec after "Switch categories" flash
        self._flash_c_event = None             # scheduled penalty if C isn't pressed in time
        self._category = "Nature"              # current category; toggled by every real C press
        self._forced_c_remaining = 0           # A presses still requiring a C swap; each wrong A costs 5 pts

        with self.canvas.before:
            self._flash_color = Color(0, 0, 0, 0)
            self._flash_rect = Rectangle(pos=self.pos, size=self.size)
        self.bind(pos=self._update_flash_rect, size=self._update_flash_rect)
        self._schedule_next_flash()

        layout = BoxLayout(orientation="vertical", padding=40, spacing=20)

        # Top row: empty spacer on the left, D-mode dropdown pinned to the right.
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
        self.label_c = Label(text="Changes: 0", font_size="48sp")
        self.label_cat = Label(text="Category: Nature", font_size="24sp")

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
        "3d": "(L3)Next A = looks × pnts.",
        "3e": "(L3)Next hold linear pnts.",
    }

    _FLASH_OPTIONS = [
        ((1, 0, 0, 1), "Switch!"),
        ((0, 1, 0, 1), "Nature: -10 lks, -25 pts"),
        ((1, 1, 1, 1), "Man-made: -25 lks, -10 pts"),
        ((0, 0, 1, 1), "Next 10 lks: switch cat."),
        ((1, 1, 0, 1), "Power-up stolen!"),
    ]

    def _update_flash_rect(self, *args):
        self._flash_rect.pos = self.pos
        self._flash_rect.size = self.size

    def _schedule_next_flash(self):
        Clock.schedule_once(self._do_flash, random.uniform(30, 90))

    def _do_flash(self, dt):
        color, text = random.choice(self._FLASH_OPTIONS)
        self._run_flash(color, text, flashes_remaining=3)

    def _run_flash(self, color, text, flashes_remaining):
        if flashes_remaining == 0:
            self._schedule_next_flash()
            if text == "Switch!":
                self._start_flash_c_window()
            elif text == "Nature: -10 lks, -25 pts":
                if self._category == "Nature":
                    self.score_b = max(0, self.score_b - 10)
                    self.score_a = max(0, self.score_a - 25)
                    self.label_b.text = f"Credits: {self.score_b}"
                    self.label_a.text = f"Sightings: {self.score_a}"
                    self.btn_a.disabled = self.score_b < 1
            elif text == "Man-made: -25 lks, -10 pts":
                if self._category == "Man-made":
                    self.score_b = max(0, self.score_b - 25)
                    self.score_a = max(0, self.score_a - 10)
                    self.label_b.text = f"Credits: {self.score_b}"
                    self.label_a.text = f"Sightings: {self.score_a}"
                    self.btn_a.disabled = self.score_b < 1
            elif text == "Next 10 lks: switch cat.":
                self._forced_c_remaining = 10
            elif text == "Power-up stolen!":
                if self.dropdown_d.values:
                    self.dropdown_d.values = self.dropdown_d.values[1:]
            return
        self._flash_color.rgba = color
        self.flash_label.text = text
        Clock.schedule_once(
            lambda dt: self._flash_pause(color, text, flashes_remaining), 0.3
        )

    def _toggle_category(self):
        self._category = "Man-made" if self._category == "Nature" else "Nature"
        self.label_cat.text = f"Category: {self._category}"

    def _start_flash_c_window(self):
        self._flash_c_window = True
        self._flash_c_event = Clock.schedule_once(self._flash_c_penalty, 3)

    def _flash_c_penalty(self, dt):
        self._flash_c_window = False
        self._flash_c_event = None
        self.score_a = max(0, self.score_a - 20)
        self.label_a.text = f"Sightings: {self.score_a}"

    def _flash_pause(self, color, text, flashes_remaining):
        self._flash_color.rgba = (0, 0, 0, 0)
        self.flash_label.text = ""
        Clock.schedule_once(
            lambda dt: self._run_flash(color, text, flashes_remaining - 1), 0.2
        )

    def _commit_b(self):
        # Bank pending credits. Per-hold flags (linear mode, hold 2x) are cleared
        # by _end_hold, not here, so mid-hold A presses don't lose those effects.
        self.score_b += self._pending_b
        self._pending_b = 0
        self._b_tick = 0
        self._d_mode = False
        self.dropdown_d.text = "Power-ups"
        self.dropdown_d.disabled = False
        self.label_b.text = f"Credits: {self.score_b}"
        self.btn_a.disabled = self.score_b < 1

    def _end_hold(self):
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
        self._run_tier = tier
        if force_sub_e:
            sub = "e"
            self._force_sub_e = False
        else:
            sub = random.choice("e")
        key = f"{tier}{sub}"
        name = self._OPTION_NAMES.get(key, f"Option {key}")
        if self._run_option is not None:
            # Upgrade: swap the previous run option for the better one.
            self.dropdown_d.values = tuple(
                name if v == self._run_option else v
                for v in self.dropdown_d.values
            )
        else:
            # First option this run — append and lock until run ends.
            self.dropdown_d.values = tuple(self.dropdown_d.values) + (name,)
            if self._clock_event:
                self.dropdown_d.disabled = True
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
            self._clock_event.cancel()
            self._clock_event = Clock.schedule_interval(self._add_b_point, 1)

    def _on_d_select(self, instance, value):
        # Spinner sets text to the picked option; snap it back to "Power-ups" so the label
        # is stable. The "Power-ups" callback is the recursion base case.
        if value == "Power-ups":
            return
        values = list(self.dropdown_d.values)
        values.remove(value)
        self.dropdown_d.values = tuple(values)
        self.dropdown_d.text = "Power-ups"
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
        values[target_idx] = random.choice(candidates)
        self.dropdown_d.values = tuple(values)

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
        else:
            self._d_mode = True

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
            self.score_a += self.score_b
            self.label_a.text = f"Sightings: {self.score_a}"
            self.score_b = 0
            self.label_b.text = "Credits: 0"
            self.btn_a.disabled = True
            return
        if self._grass_mode and self.grass_switch.active:
            self.score_a += 3
        elif self._double_points or self._hold_double_points:
            self.score_a += 2
        else:
            self.score_a += 1
        self.label_a.text = f"Sightings: {self.score_a}"
        self.score_b = max(0, self.score_b - 1)
        self.label_b.text = f"Credits: {self.score_b}"
        self.btn_a.disabled = self.score_b < 1

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
                self._clock_event = Clock.schedule_interval(self._add_b_point, 1)
                self.btn_b.background_color = (0, 0, 4, 255)
        else:
            self._end_run()
            self._activate_hold_powerups()
            self._clock_event = Clock.schedule_interval(self._add_b_point, 1)

    def _b_release(self, instance):
        # Hold-mode only: releasing B stops the timer and commits.
        if not self._toggle_mode:
            if self._clock_event:
                self._clock_event.cancel()
                self._clock_event = None
            self._end_hold()

    def _press_c(self, instance):
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
            self._apply_a_score()
            return
        if self._next_c_flip:
            self._next_c_flip = False
            self.score_a += 20
            self.label_a.text = f"Sightings: {self.score_a}"
            self._toggle_category()
            self._apply_a_score()
            return
        if self._next_ac_keep_b:
            self._next_ac_keep_b = False
        else:
            self._reset_b_timer()
        self.score_a -= 20
        self.label_a.text = f"Sightings: {self.score_a}"
        if self.score_a <= -1:
            self.score_a = 0
            self.label_a.text = f"Sightings: {self.score_a}"
        self._toggle_category()
        self._apply_a_score()

    def _add_b_point(self, dt):
        if self._linear_mode:
            self._linear_press_count += 1
            self.score_a += self._linear_press_count
            self.label_a.text = f"Sightings: {self.score_a}"
            return
        # Clock callback: adds one Look per tick to the pending buffer.
        self._pending_b += 1
        self._update_d_options()
        self.label_b.text = f"Credits: {self.score_b} (+{self._pending_b})"
