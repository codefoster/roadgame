from kivy.app import App
from kivy.uix.screenmanager import ScreenManager

from src.screens.start_screen import StartScreen
from src.screens.main_screen import MainScreen


class RoadGameApp(App):
    coins = 0
    pending_upgrades = []  # upgrade keys applied when entering main screen
    badges = set()
    active_badges = set()       # badges selected for the current game (max 5)
    badge_cooldowns = {}        # {badge_id: games_remaining_on_cooldown}

    def build(self):
        sm = ScreenManager()
        sm.add_widget(StartScreen(name="start"))
        sm.add_widget(MainScreen(name="main"))
        return sm


if __name__ == "__main__":
    RoadGameApp().run()
