import random
from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button


class MainScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        layout = BoxLayout(padding=40)

        self.btn = Button(
            text="Press me!",
            font_size="24sp",
            background_color=self._random_color(),
        )
        self.btn.bind(on_press=self.change_color)

        layout.add_widget(self.btn)
        self.add_widget(layout)

    def change_color(self, instance):
        instance.background_color = self._random_color()

    def _random_color(self):
        return [random.random(), random.random(), random.random(), 1]
