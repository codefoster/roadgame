from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.clock import Clock


class MainScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.score = 0
        self._clock_event = None

        layout = BoxLayout(orientation="vertical", padding=40, spacing=20)

        self.score_label = Label(text="Score: 0", font_size="48sp")

        btn_layout = BoxLayout(spacing=20, size_hint=(1, 0.3))
        btn_a = Button(text="A", font_size="32sp")
        btn_b = Button(text="B", font_size="32sp")
        btn_b.bind(on_press=self._start_scoring, on_release=self._stop_scoring)

        btn_layout.add_widget(btn_a)
        btn_layout.add_widget(btn_b)

        layout.add_widget(self.score_label)
        layout.add_widget(btn_layout)

        self.add_widget(layout)

    def _start_scoring(self, instance):
        self._clock_event = Clock.schedule_interval(self._add_point, 1)

    def _stop_scoring(self, instance):
        if self._clock_event:
            self._clock_event.cancel()
            self._clock_event = None

    def _add_point(self, dt):
        self.score += 1
        self.score_label.text = f"Score: {self.score}"
