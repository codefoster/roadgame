from kivy.app import App
from kivy.uix.screenmanager import ScreenManager, Screen

from src.screens.main_screen import MainScreen


class RoadGameApp(App):
    def build(self):
        sm = ScreenManager()
        sm.add_widget(MainScreen(name="main"))
        return sm


if __name__ == "__main__":
    RoadGameApp().run()
