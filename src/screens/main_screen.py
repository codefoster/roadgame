from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.switch import Switch
from kivy.clock import Clock


class MainScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.score_a = 0
        self.score_b = 0
        self._pending_b = 0
        self._b_tick = 0
        self._d_mode = False
        self._clock_event = None
        self._toggle_mode = False

        layout = BoxLayout(orientation="vertical", padding=40, spacing=20)

        top_row = BoxLayout(size_hint=(1, None), height=50)
        top_row.add_widget(Label())
        self.btn_d = Button(text="D", font_size="20sp", size_hint=(None, 1), width=60)
        self.btn_d.bind(on_press=self._press_d)
        top_row.add_widget(self.btn_d)
        layout.add_widget(top_row)

        self.label_a = Label(text="Points: 0", font_size="48sp")
        self.label_b = Label(text="Looks: 0", font_size="48sp")
        self.label_c = Label(text="Changes: 0", font_size="48sp")

        # C button on left (above A), switch on right (above B)
        switch_c_layout = BoxLayout(spacing=20, size_hint=(1, 0.45))
        self.utn_c = Button(text="Switch", font_size="32sp")
        self.utn_c.bind(on_press=self._press_c)
        self.toggle_switch = Switch(active=False)
        self.toggle_switch.bind(active=self._on_switch)
        switch_c_layout.add_widget(self.utn_c)
        switch_c_layout.add_widget(self.toggle_switch)

        btn_layout = BoxLayout(spacing=20, size_hint=(1, 0.5))
        self.btn_a = Button(text="A", font_size="32sp", disabled=True)
        self.btn_b = Button(text="B", font_size="32sp")
        self.btn_a.bind(on_press=self._press_a)
        self.btn_b.bind(on_press=self._b_press, on_release=self._b_release)

        btn_layout.add_widget(self.btn_a)
        btn_layout.add_widget(self.btn_b)
        layout.add_widget(self.label_a)
        layout.add_widget(self.label_b)
        layout.add_widget(switch_c_layout)
        layout.add_widget(btn_layout)

        self.add_widget(layout)

    def _commit_b(self):
        self.score_b += self._pending_b
        self._pending_b = 0
        self._b_tick = 0
        self._d_mode = False
        self.btn_d.background_color = (1, 1, 1, 1)
        self.label_b.text = f"Looks: {self.score_b}"
        self.btn_a.disabled = self.score_b < 1

    def _press_d(self, instance):
        self._d_mode = True
        self.btn_d.background_color = (0.2, 0.8, 0.2, 1)

    def _on_switch(self, instance, value):
        self._toggle_mode = value
        if not value and self._clock_event:
            self._clock_event.cancel()
            self._clock_event = None
            self._commit_b()
            self.btn_b.background_color = (1, 1, 1, 255)

    def _press_a(self, instance):
        self._commit_b()
        self.score_a += 1
        self.label_a.text = f"Points: {self.score_a}"
        self.score_b = max(0, self.score_b - 1)
        self.label_b.text = f"Looks: {self.score_b}"
        self.btn_a.disabled = self.score_b < 1

    def _b_press(self, instance):
        if self._toggle_mode:
            if self._clock_event:
                self._clock_event.cancel()
                self._clock_event = None
                self._commit_b()
                self.btn_b.background_color = (1, 1, -1, 255)
            else:
                self._clock_event = Clock.schedule_interval(self._add_b_point, 1)
                self.btn_b.background_color = (0, 0, 4, 255)
        else:
            self._clock_event = Clock.schedule_interval(self._add_b_point, 1)

    def _b_release(self, instance):
        if not self._toggle_mode:
            if self._clock_event:
                self._clock_event.cancel()
                self._clock_event = None
            self._commit_b()

    def _press_c(self, instance):
        self.score_a -= 20
        self.label_a.text = f"Points: {self.score_a}"
        if self.score_a <= -1:
            self.score_a = 0
            self.label_a.text = f"Points: {self.score_a}"

    def _add_b_point(self, dt):
        if self._d_mode:
            self._b_tick += 1
            self._pending_b += self._b_tick
        else:
            self._pending_b += 1
        self.label_b.text = f"Looks: {self.score_b} (+{self._pending_b})"
