from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button


class StartScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        layout = BoxLayout(orientation="vertical", padding=60, spacing=30)

        layout.add_widget(Label())  # top spacer
        layout.add_widget(Label(text="Road Game", font_size="64sp", bold=True))
        layout.add_widget(Label(
            text="Spot things. Watch them. Score points.",
            font_size="20sp",
        ))
        layout.add_widget(Label())  # middle spacer

        btn_play = Button(
            text="Play",
            font_size="40sp",
            size_hint=(0.5, None),
            height=100,
            pos_hint={"center_x": 0.5},
        )
        btn_play.bind(on_press=self._start_game)
        layout.add_widget(btn_play)

        layout.add_widget(Label())  # bottom spacer
        self.add_widget(layout)

    def _start_game(self, instance):
        self.manager.current = "main"
