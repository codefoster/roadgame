from kivy.app import App
from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.graphics import Color, Rectangle


class StartScreen(Screen):

    _SHOP_ITEMS = [
        ('head_start',   'Head Start',    'Begin with +50 pts on the board',       5),
        ('credit_boost', 'Credit Boost',  'Start with +25 extra credits',          10),
        ('rival_chill',  'Rival Chill',   'Rival skips its first 5 actions',       15),
        ('golden_touch', 'Golden Touch',  'Bingo card starts with 2 pre-marked\ngolden squares', 20),
    ]

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

        btn_online = Button(
            text="Online Play",
            font_size="24sp",
            size_hint=(0.5, None),
            height=70,
            pos_hint={"center_x": 0.5},
        )
        btn_online.bind(on_press=self._start_online)
        layout.add_widget(btn_online)

        btn_shop = Button(
            text="Shop",
            font_size="24sp",
            size_hint=(0.35, None),
            height=60,
            pos_hint={"center_x": 0.5},
        )
        btn_shop.bind(on_press=lambda x: self._toggle_shop())
        layout.add_widget(btn_shop)

        btn_badges = Button(
            text="Badges",
            font_size="24sp",
            size_hint=(0.35, None),
            height=60,
            pos_hint={"center_x": 0.5},
        )
        btn_badges.bind(on_press=lambda x: self._toggle_badges())
        layout.add_widget(btn_badges)

        layout.add_widget(Label())  # bottom spacer
        self.add_widget(layout)

        # Shop overlay — hidden until toggled.
        shop_panel = BoxLayout(
            orientation='vertical',
            pos_hint={'center_x': 0.5, 'center_y': 0.5},
            size_hint=(0.92, 0.80),
            padding=12, spacing=8,
        )
        with shop_panel.canvas.before:
            Color(0.10, 0.10, 0.10, 0.97)
            _shop_bg = Rectangle(pos=shop_panel.pos, size=shop_panel.size)
        shop_panel.bind(
            pos=lambda w, v: setattr(_shop_bg, 'pos', v),
            size=lambda w, v: setattr(_shop_bg, 'size', v),
        )

        # Header row
        shop_hdr = BoxLayout(size_hint=(1, None), height=44, spacing=8)
        shop_hdr.add_widget(Label(text="Shop", font_size="24sp", bold=True))
        self._coin_label = Label(text="Coins: 0", font_size="20sp",
                                 color=(1, 0.85, 0, 1))
        shop_hdr.add_widget(self._coin_label)
        btn_close = Button(text="Close", size_hint=(None, 1), width=90, font_size="15sp")
        btn_close.bind(on_press=lambda x: self._toggle_shop())
        shop_hdr.add_widget(btn_close)
        shop_panel.add_widget(shop_hdr)

        # One row per item
        for key, name, desc, cost in self._SHOP_ITEMS:
            row = BoxLayout(size_hint=(1, None), height=72, spacing=10)
            info = BoxLayout(orientation='vertical', size_hint_x=0.6)
            info.add_widget(Label(text=name, font_size="17sp", bold=True,
                                  halign='left', valign='middle',
                                  size_hint_y=None, height=26))
            info.add_widget(Label(text=desc, font_size="12sp",
                                  halign='left', valign='top',
                                  text_size=(None, None),
                                  size_hint_y=None, height=44))
            row.add_widget(info)
            row.add_widget(Label(text=f"{cost} coins", font_size="15sp",
                                 color=(1, 0.85, 0, 1), size_hint_x=0.2))
            btn_buy = Button(text="Buy", font_size="16sp", size_hint_x=0.2)
            btn_buy.bind(on_press=lambda x, k=key, c=cost: self._buy_upgrade(k, c))
            row.add_widget(btn_buy)
            shop_panel.add_widget(row)

        self._shop_panel = shop_panel
        self._shop_visible = False

        # Badges overlay — hidden until toggled.
        badges_panel = BoxLayout(
            orientation='vertical',
            pos_hint={'center_x': 0.5, 'center_y': 0.5},
            size_hint=(0.92, 0.80),
            padding=12, spacing=8,
        )
        with badges_panel.canvas.before:
            Color(0.10, 0.10, 0.10, 0.97)
            _badges_bg = Rectangle(pos=badges_panel.pos, size=badges_panel.size)
        badges_panel.bind(
            pos=lambda w, v: setattr(_badges_bg, 'pos', v),
            size=lambda w, v: setattr(_badges_bg, 'size', v),
        )

        # Header row
        badges_hdr = BoxLayout(size_hint=(1, None), height=44, spacing=8)
        badges_hdr.add_widget(Label(text="Badges", font_size="24sp", bold=True))
        self._badges_count_label = Label(text="0 / 20", font_size="18sp",
                                         color=(0.6, 0.2, 1, 1))
        badges_hdr.add_widget(self._badges_count_label)
        btn_close_badges = Button(text="Close", size_hint=(None, 1), width=90, font_size="15sp")
        btn_close_badges.bind(on_press=lambda x: self._toggle_badges())
        badges_hdr.add_widget(btn_close_badges)
        badges_panel.add_widget(badges_hdr)

        # Selection counter row
        sel_row = BoxLayout(size_hint=(1, None), height=28)
        self._selected_label = Label(
            text="Selected: 0 / 5  (select up to 5 badges for this game)",
            font_size="13sp",
            color=(0.3, 0.85, 0.3, 1),
        )
        sel_row.add_widget(self._selected_label)
        badges_panel.add_widget(sel_row)

        # Scrollable list of badges
        scroll = ScrollView(size_hint=(1, 1))
        self._badges_list = BoxLayout(
            orientation='vertical',
            size_hint_y=None,
            spacing=4,
        )
        self._badges_list.bind(minimum_height=self._badges_list.setter('height'))
        scroll.add_widget(self._badges_list)
        badges_panel.add_widget(scroll)

        self._badges_panel = badges_panel
        self._badges_visible = False
        self._pending_badge_selection = set()

    def _start_game(self, instance):
        self.manager.current = "main"

    def _start_online(self, instance):
        self.manager.current = "lobby"

    def _toggle_shop(self):
        self._shop_visible = not self._shop_visible
        if self._shop_visible:
            self._coin_label.text = f"Coins: {App.get_running_app().coins}"
            self.add_widget(self._shop_panel)
        else:
            self.remove_widget(self._shop_panel)

    def _toggle_badges(self):
        from src.screens.main_screen import MainScreen as _MS
        self._badges_visible = not self._badges_visible
        if self._badges_visible:
            app = App.get_running_app()
            earned = app.badges
            cooldowns = app.badge_cooldowns
            all_badges = _MS._BADGES
            self._pending_badge_selection = set(app.active_badges)
            self._badges_count_label.text = f"{len(earned)} / {len(all_badges)}"
            n = len(self._pending_badge_selection)
            self._selected_label.text = f"Selected: {n} / 5  (select up to 5 badges for this game)"
            self._badges_list.clear_widgets()
            for badge_id, name, desc in all_badges:
                if badge_id not in earned:
                    continue
                row = BoxLayout(size_hint=(1, None), height=60, spacing=8)
                info = BoxLayout(orientation='vertical', size_hint_x=0.62)
                lbl_name = Label(
                    text=f"[b]{name}[/b]",
                    markup=True,
                    font_size="15sp",
                    color=(0.6, 0.2, 1, 1),
                    size_hint_y=None, height=26,
                    halign='left', valign='middle',
                )
                lbl_desc = Label(
                    text=desc,
                    font_size="11sp",
                    color=(0.9, 0.9, 0.9, 1),
                    size_hint_y=None, height=30,
                    halign='left', valign='middle',
                )
                info.add_widget(lbl_name)
                info.add_widget(lbl_desc)
                row.add_widget(info)
                cd = cooldowns.get(badge_id, 0)
                if cd > 0:
                    btn = Button(
                        text=f"Cooldown: {cd}",
                        font_size="12sp",
                        size_hint_x=0.38,
                        disabled=True,
                    )
                else:
                    is_sel = badge_id in self._pending_badge_selection
                    btn = Button(
                        text="Active" if is_sel else "Select",
                        font_size="13sp",
                        size_hint_x=0.38,
                        background_color=(0.3, 0.7, 0.3, 1) if is_sel else (1, 1, 1, 1),
                    )
                    btn.bind(on_press=lambda x, bid=badge_id, b=btn: self._toggle_badge_select(bid, b))
                row.add_widget(btn)
                self._badges_list.add_widget(row)
            if not earned:
                self._badges_list.add_widget(Label(
                    text="No badges earned yet. Get a double-golden bingo to earn one!",
                    font_size="14sp",
                    color=(0.6, 0.6, 0.6, 1),
                    size_hint_y=None,
                    height=60,
                    halign='center',
                    valign='middle',
                ))
            self.add_widget(self._badges_panel)
        else:
            App.get_running_app().active_badges = set(self._pending_badge_selection)
            self.remove_widget(self._badges_panel)

    def _toggle_badge_select(self, badge_id, btn):
        if badge_id in self._pending_badge_selection:
            self._pending_badge_selection.discard(badge_id)
            btn.text = "Select"
            btn.background_color = (1, 1, 1, 1)
        else:
            if len(self._pending_badge_selection) >= 5:
                return
            self._pending_badge_selection.add(badge_id)
            btn.text = "Active"
            btn.background_color = (0.3, 0.7, 0.3, 1)
        n = len(self._pending_badge_selection)
        self._selected_label.text = f"Selected: {n} / 5  (select up to 5 badges for this game)"

    def _buy_upgrade(self, key, cost):
        app = App.get_running_app()
        if 'leprechaun' in app.badges:
            cost = max(1, cost - 3)
        if app.coins < cost:
            return
        app.coins -= cost
        app.pending_upgrades.append(key)
        self._coin_label.text = f"Coins: {app.coins}"
