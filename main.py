import json
import os

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
        self._load_state()
        sm = ScreenManager()
        sm.add_widget(StartScreen(name="start"))
        sm.add_widget(MainScreen(name="main"))
        return sm

    def _save_path(self):
        return os.path.join(self.user_data_dir, 'save.json')

    def _load_state(self):
        try:
            with open(self._save_path()) as f:
                data = json.load(f)
            self.coins = data.get('coins', 0)
            self.badges = set(data.get('badges', []))
            self.badge_cooldowns = {k: v for k, v in data.get('badge_cooldowns', {}).items()}
        except Exception:
            pass

    def save_state(self):
        data = {
            'coins': self.coins,
            'badges': list(self.badges),
            'badge_cooldowns': self.badge_cooldowns,
        }
        try:
            with open(self._save_path(), 'w') as f:
                json.dump(data, f)
        except Exception:
            pass

    def on_pause(self):
        self.save_state()
        return True  # returning True allows the app to resume on Android

    def on_stop(self):
        self.save_state()


if __name__ == "__main__":
    RoadGameApp().run()
