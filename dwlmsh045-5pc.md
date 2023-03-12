# msh patch for dwl-0.4

2023-03-12 Sunday 16:06 04:06:21 PM

This is minsoehan's combining the following 5 patches to dwl-v04

1. autostart
2. alwayscenter
3. keycodes
4. msh-cursorwarp
5. shiftview

```
$ cd /path/to/dwl-v04
$ cp /path/to/thispatchfile.diff ./
$ patch -p1 < ./thispatchfile.diff
```
Using the folling patch, config.def.h will be splitted into 3 files as config.h, kbconfig.h and ruconfig.h files.

```diff
This is minsoehan's combining the following 5 patches to dwl-v04
    1. autostart
    2. alwayscenter
    3. keycodes
    4. msh-cursorwarp
    5. shiftview
Using the folling patch, config.def.h will be splitted into 3 files as
config.h, kbconfig.h and ruconfig.h files.

--- a/config.mk	2022-12-31 03:18:07.000000000 +0630
+++ b/config.mk	2023-02-22 15:14:26.792991056 +0630
@@ -7,8 +7,6 @@
 PREFIX = /usr/local
 MANDIR = $(PREFIX)/share/man
 
-XWAYLAND =
-XLIBS =
 # Uncomment to build XWayland support
-#XWAYLAND = -DXWAYLAND
-#XLIBS = xcb xcb-icccm
+XWAYLAND = -DXWAYLAND
+XLIBS = xcb xcb-icccm
--- a/dwl.c	2022-12-31 03:18:07.000000000 +0630
+++ b/dwl.c	2023-02-22 15:14:26.792991056 +0630
@@ -130,7 +130,7 @@
 
 typedef struct {
 	uint32_t mod;
-	xkb_keysym_t keysym;
+	xkb_keycode_t keycode;
 	void (*func)(const Arg *);
 	const Arg arg;
 } Key;
@@ -220,6 +220,7 @@
 static void arrangelayer(Monitor *m, struct wl_list *list,
 		struct wlr_box *usable_area, int exclusive);
 static void arrangelayers(Monitor *m);
+static void autostartexec(void);
 static void axisnotify(struct wl_listener *listener, void *data);
 static void buttonpress(struct wl_listener *listener, void *data);
 static void chvt(const Arg *arg);
@@ -255,7 +256,7 @@
 static void fullscreennotify(struct wl_listener *listener, void *data);
 static void incnmaster(const Arg *arg);
 static void inputdevice(struct wl_listener *listener, void *data);
-static int keybinding(uint32_t mods, xkb_keysym_t sym);
+static int keybinding(uint32_t mods, xkb_keycode_t keycode);
 static void keypress(struct wl_listener *listener, void *data);
 static void keypressmod(struct wl_listener *listener, void *data);
 static void killclient(const Arg *arg);
@@ -289,6 +290,7 @@
 static void setpsel(struct wl_listener *listener, void *data);
 static void setsel(struct wl_listener *listener, void *data);
 static void setup(void);
+static void sigchld(int unused);
 static void spawn(const Arg *arg);
 static void startdrag(struct wl_listener *listener, void *data);
 static void tag(const Arg *arg);
@@ -389,7 +391,6 @@
 static void createnotifyx11(struct wl_listener *listener, void *data);
 static Atom getatom(xcb_connection_t *xc, const char *name);
 static void sethints(struct wl_listener *listener, void *data);
-static void sigchld(int unused);
 static void xwaylandready(struct wl_listener *listener, void *data);
 static struct wl_listener new_xwayland_surface = {.notify = createnotifyx11};
 static struct wl_listener xwayland_ready = {.notify = xwaylandready};
@@ -406,6 +407,9 @@
 /* compile-time check if all tags fit into an unsigned int bit array. */
 struct NumTags { char limitexceeded[LENGTH(tags) > 31 ? -1 : 1]; };
 
+static pid_t *autostart_pids;
+static size_t autostart_len;
+
 /* function implementations */
 void
 applybounds(Client *c, struct wlr_box *bbox)
@@ -460,6 +464,8 @@
 					mon = m;
 		}
 	}
+	c->geom.x = (mon->w.width - c->geom.width) / 2 + mon->m.x;
+	c->geom.y = (mon->w.height - c->geom.height) / 2 + mon->m.y;
 	wlr_scene_node_reparent(&c->scene->node, layers[c->isfloating ? LyrFloat : LyrTile]);
 	setmon(c, mon, newtags);
 }
@@ -545,6 +551,27 @@
 }
 
 void
+autostartexec(void) {
+	const char *const *p;
+	size_t i = 0;
+
+	/* count entries */
+	for (p = autostart; *p; autostart_len++, p++)
+		while (*++p);
+
+	autostart_pids = calloc(autostart_len, sizeof(pid_t));
+	for (p = autostart; *p; i++, p++) {
+		if ((autostart_pids[i] = fork()) == 0) {
+			setsid();
+			execvp(*p, (char *const *)p);
+			die("dwl: execvp %s:", *p);
+		}
+		/* skip arguments */
+		while (*++p);
+	}
+}
+
+void
 axisnotify(struct wl_listener *listener, void *data)
 {
 	/* This event is forwarded by the cursor when a pointer emits an axis event,
@@ -1189,6 +1216,16 @@
 	if (locked)
 		return;
 
+ 	/* Warp cursor to center of client if it is outside */
+ 	if (c && (cursor->x < c->geom.x ||
+ 		cursor->x > c->geom.x + c->geom.width ||
+ 		cursor->y < c->geom.y ||
+ 		cursor->y > c->geom.y + c->geom.height))
+ 		wlr_cursor_warp_closest( cursor,
+ 			  NULL,
+ 			  c->geom.x + c->geom.width / 2.0,
+ 			  c->geom.y + c->geom.height / 2.0);
+ 
 	/* Raise client in stacking order if requested */
 	if (c && lift)
 		wlr_scene_node_raise_to_top(&c->scene->node);
@@ -1348,7 +1385,7 @@
 }
 
 int
-keybinding(uint32_t mods, xkb_keysym_t sym)
+keybinding(uint32_t mods, xkb_keycode_t keycode)
 {
 	/*
 	 * Here we handle compositor keybindings. This is when the compositor is
@@ -1359,7 +1396,7 @@
 	const Key *k;
 	for (k = keys; k < END(keys); k++) {
 		if (CLEANMASK(mods) == CLEANMASK(k->mod) &&
-				sym == k->keysym && k->func) {
+				keycode == k->keycode && k->func) {
 			k->func(&k->arg);
 			handled = 1;
 		}
@@ -1370,17 +1407,12 @@
 void
 keypress(struct wl_listener *listener, void *data)
 {
-	int i;
 	/* This event is raised when a key is pressed or released. */
 	Keyboard *kb = wl_container_of(listener, kb, key);
 	struct wlr_keyboard_key_event *event = data;
 
 	/* Translate libinput keycode -> xkbcommon */
 	uint32_t keycode = event->keycode + 8;
-	/* Get a list of keysyms based on the keymap for this keyboard */
-	const xkb_keysym_t *syms;
-	int nsyms = xkb_state_key_get_syms(
-			kb->wlr_keyboard->xkb_state, keycode, &syms);
 
 	int handled = 0;
 	uint32_t mods = wlr_keyboard_get_modifiers(kb->wlr_keyboard);
@@ -1391,8 +1423,7 @@
 	 * attempt to process a compositor keybinding. */
 	if (!locked && !input_inhibit_mgr->active_inhibitor
 			&& event->state == WL_KEYBOARD_KEY_STATE_PRESSED)
-		for (i = 0; i < nsyms; i++)
-			handled = keybinding(mods, syms[i]) || handled;
+		handled = keybinding(mods, keycode);
 
 	if (!handled) {
 		/* Pass unhandled keycodes along to the client. */
@@ -1813,6 +1844,16 @@
 void
 quit(const Arg *arg)
 {
+	size_t i;
+
+	/* kill child processes */
+	for (i = 0; i < autostart_len; i++) {
+		if (0 < autostart_pids[i]) {
+			kill(autostart_pids[i], SIGTERM);
+			waitpid(autostart_pids[i], NULL, 0);
+		}
+	}
+
 	wl_display_terminate(dpy);
 }
 
@@ -1895,6 +1936,7 @@
 		die("startup: backend_start");
 
 	/* Now that the socket exists and the backend is started, run the startup command */
+	autostartexec();
 	if (startup_cmd) {
 		int piperw[2];
 		if (pipe(piperw) < 0)
@@ -2071,11 +2113,7 @@
 	dpy = wl_display_create();
 
 	/* Set up signal handlers */
-#ifdef XWAYLAND
 	sigchld(0);
-#else
-	signal(SIGCHLD, SIG_IGN);
-#endif
 	signal(SIGINT, quitsignal);
 	signal(SIGTERM, quitsignal);
 
@@ -2252,6 +2290,42 @@
 }
 
 void
+sigchld(int unused)
+{
+	siginfo_t in;
+	/* We should be able to remove this function in favor of a simple
+	 *     signal(SIGCHLD, SIG_IGN);
+	 * but the Xwayland implementation in wlroots currently prevents us from
+	 * setting our own disposition for SIGCHLD.
+	 */
+	if (signal(SIGCHLD, sigchld) == SIG_ERR)
+		die("can't install SIGCHLD handler:");
+	/* WNOWAIT leaves the child in a waitable state, in case this is the
+	 * XWayland process
+	 */
+	while (!waitid(P_ALL, 0, &in, WEXITED|WNOHANG|WNOWAIT) && in.si_pid
+#ifdef XWAYLAND
+			&& (!xwayland || in.si_pid != xwayland->server->pid)
+#endif
+			) {
+		pid_t *p, *lim;
+		waitpid(in.si_pid, NULL, 0);
+		if (in.si_pid == child_pid)
+			child_pid = -1;
+		if (!(p = autostart_pids))
+			continue;
+		lim = &p[autostart_len];
+
+		for (; p < lim; p++) {
+			if (*p == in.si_pid) {
+				*p = -1;
+				break;
+			}
+		}
+	}
+}
+
+void
 spawn(const Arg *arg)
 {
 	if (fork() == 0) {
@@ -2695,25 +2769,6 @@
 }
 
 void
-sigchld(int unused)
-{
-	siginfo_t in;
-	/* We should be able to remove this function in favor of a simple
-	 *     signal(SIGCHLD, SIG_IGN);
-	 * but the Xwayland implementation in wlroots currently prevents us from
-	 * setting our own disposition for SIGCHLD.
-	 */
-	if (signal(SIGCHLD, sigchld) == SIG_ERR)
-		die("can't install SIGCHLD handler:");
-	/* WNOWAIT leaves the child in a waitable state, in case this is the
-	 * XWayland process
-	 */
-	while (!waitid(P_ALL, 0, &in, WEXITED|WNOHANG|WNOWAIT) && in.si_pid
-			&& (!xwayland || in.si_pid != xwayland->server->pid))
-		waitpid(in.si_pid, NULL, 0);
-}
-
-void
 xwaylandready(struct wl_listener *listener, void *data)
 {
 	struct wlr_xcursor *xcursor;
--- /dev/null	2023-02-22 13:21:10.572520974 +0630
+++ b/config.h	2023-02-22 15:14:26.792991056 +0630
@@ -0,0 +1,122 @@
+/* appearance */
+static const int sloppyfocus               = 1;  /* focus follows mouse */
+static const int bypass_surface_visibility = 0;  /* 1 means idle inhibitors will disable idle tracking even if it's surface isn't visible  */
+static const unsigned int borderpx         = 3;  /* border pixel of windows */
+static const float rootcolor[]             = {0.3, 0.3, 0.3, 1.0};
+static const float bordercolor[]           = {0.5, 0.5, 0.5, 1.0};
+static const float focuscolor[]            = {1.0, 0.0, 0.0, 1.0};
+/* To conform the xdg-protocol, set the alpha to zero to restore the old behavior */
+static const float fullscreen_bg[]         = {0.1, 0.1, 0.1, 1.0};
+
+/* autostart */
+static const char *const autostart[] = {
+	"/usr/bin/sh", "-c", "~/.config/dwlmsh/dwlmshautostart.sh", NULL,
+	NULL /* terminate */
+};
+
+/* tagging */
+static const char *tags[] = { "1", "2", "3", "4", "5", "6", "7", "8", "9" };
+
+#include "ruconfig.h"
+/* moved to ruconfig.h
+static const Rule rules[] = {
+	// app_id     title       tags mask     isfloating   monitor
+	{ "firefox",  NULL,       1 << 8,       0,           -1 },
+};
+*/
+
+/* layout(s) */
+static const Layout layouts[] = {
+	/* symbol     arrange function */
+	{ "[M]",      monocle },
+	{ "[]=",      tile },
+	{ "><>",      NULL },    /* no layout function means floating behavior */
+};
+
+/* monitors */
+static const MonitorRule monrules[] = {
+	/* name       mfact nmaster scale layout       rotate/reflect */
+	/* example of a HiDPI laptop monitor:
+	{ "eDP-1",    0.5,  1,      2,    &layouts[0], WL_OUTPUT_TRANSFORM_NORMAL },
+	*/
+	/* defaults */
+	{ NULL,       0.55, 1,      1,    &layouts[0], WL_OUTPUT_TRANSFORM_NORMAL },
+};
+
+/* keyboard */
+static const struct xkb_rule_names xkb_rules = {
+	/* can specify fields: rules, model, layout, variant, options */
+	/* example:
+	.options = "ctrl:nocaps",
+	*/
+    .layout = "us,mm",
+	.options = "grp:ctrl_space_toggle,altwin:swap_alt_win",
+};
+
+static const int repeat_rate = 25;
+static const int repeat_delay = 600;
+
+/* Trackpad */
+static const int tap_to_click = 1;
+static const int tap_and_drag = 1;
+static const int drag_lock = 1;
+static const int natural_scrolling = 0;
+static const int disable_while_typing = 1;
+static const int left_handed = 0;
+static const int middle_button_emulation = 0;
+/* You can choose between:
+LIBINPUT_CONFIG_SCROLL_NO_SCROLL
+LIBINPUT_CONFIG_SCROLL_2FG
+LIBINPUT_CONFIG_SCROLL_EDGE
+LIBINPUT_CONFIG_SCROLL_ON_BUTTON_DOWN
+*/
+static const enum libinput_config_scroll_method scroll_method = LIBINPUT_CONFIG_SCROLL_2FG;
+
+/* You can choose between:
+LIBINPUT_CONFIG_CLICK_METHOD_NONE       
+LIBINPUT_CONFIG_CLICK_METHOD_BUTTON_AREAS       
+LIBINPUT_CONFIG_CLICK_METHOD_CLICKFINGER 
+*/
+static const enum libinput_config_click_method click_method = LIBINPUT_CONFIG_CLICK_METHOD_BUTTON_AREAS;
+
+/* You can choose between:
+LIBINPUT_CONFIG_SEND_EVENTS_ENABLED
+LIBINPUT_CONFIG_SEND_EVENTS_DISABLED
+LIBINPUT_CONFIG_SEND_EVENTS_DISABLED_ON_EXTERNAL_MOUSE
+*/
+static const uint32_t send_events_mode = LIBINPUT_CONFIG_SEND_EVENTS_ENABLED;
+
+/* You can choose between:
+LIBINPUT_CONFIG_ACCEL_PROFILE_FLAT
+LIBINPUT_CONFIG_ACCEL_PROFILE_ADAPTIVE
+*/
+static const enum libinput_config_accel_profile accel_profile = LIBINPUT_CONFIG_ACCEL_PROFILE_ADAPTIVE;
+static const double accel_speed = 0.0;
+/* You can choose between:
+LIBINPUT_CONFIG_TAP_MAP_LRM -- 1/2/3 finger tap maps to left/right/middle
+LIBINPUT_CONFIG_TAP_MAP_LMR -- 1/2/3 finger tap maps to left/middle/right
+*/
+static const enum libinput_config_tap_button_map button_map = LIBINPUT_CONFIG_TAP_MAP_LRM;
+
+/* If you want to use the windows key for MODKEY, use WLR_MODIFIER_LOGO */
+/* If you want to use the windows key for MODKEY, use WLR_MODIFIER_ALT */
+#define MODKEY WLR_MODIFIER_LOGO
+
+#define TAGKEYS(KEY,TAG) \
+	{ MODKEY,                    KEY,            view,            {.ui = 1 << TAG} }, \
+	{ MODKEY|WLR_MODIFIER_CTRL,  KEY,            toggleview,      {.ui = 1 << TAG} }, \
+	{ MODKEY|WLR_MODIFIER_SHIFT, KEY,            tag,             {.ui = 1 << TAG} }, \
+	{ MODKEY|WLR_MODIFIER_CTRL|WLR_MODIFIER_SHIFT,KEY,toggletag,  {.ui = 1 << TAG} }
+
+/* helper for spawning shell commands in the pre dwm-5.0 fashion */
+#define SHCMD(cmd) { .v = (const char*[]){ "/bin/sh", "-c", cmd, NULL } }
+
+/* moved to kbconfig.h */
+#include "kbconfig.h"
+
+static const Button buttons[] = {
+	{ MODKEY,                    BTN_LEFT,   moveresize,     {.ui = CurMove} },
+	{ MODKEY|WLR_MODIFIER_SHIFT, BTN_LEFT,   moveresize,     {.ui = CurResize} },
+	{ MODKEY,                    BTN_MIDDLE, togglefloating, {0} },
+	{ MODKEY,                    BTN_RIGHT,  moveresize,     {.ui = CurResize} },
+};
--- /dev/null	2023-02-22 13:21:10.572520974 +0630
+++ b/kbconfig.h	2023-02-22 15:14:26.799657723 +0630
@@ -0,0 +1,111 @@
+/* this commands and keys section was moved from config.h */
+/* commands the following *termcmd and *menucmd can not be changed */
+static const char *termcmd[] = { "alacritty", NULL };
+static const char *menucmd[] = { "bemenu-run", NULL };
+static const char *nnncmd[] = { "alacritty", "-e", "nnn", "-R", NULL };
+static const char *termAFcmd[] = { "alacritty", "-t", "termfloat", NULL };
+
+static const char *dwliicmd[] = { "dwlii", NULL }; // F12
+static const char *dwlinfocmd[] = { "dwlinfo", NULL }; // Home
+
+static const char *mn1cmd[] = { "dwlii", "menu", "mn1", NULL };
+static const char *mn2cmd[] = { "dwlii", "menu", "mn2", NULL };
+static const char *mn3cmd[] = { "dwlii", "menu", "mn3", NULL };
+// static const char *mndicmd[] = { "dwlii", "menu", "dic", NULL };
+// static const char *mnfmcmd[] = { "dwlii", "menu", "fm", NULL };
+static const char *mnsscmd[] = { "dwlii", "menu", "ss", NULL };
+
+static const char *ss1cmd[] = { "dwlii", "ss1", NULL }; // Print
+static const char *ss2cmd[] = { "dwlii", "ss2", NULL }; // Shift+Print
+static const char *ss3cmd[] = { "dwlii", "ss3", NULL }; // Control+Print
+
+static const char *selviewcmd[] = { "dwlii", "selview", NULL }; // Insert (selected rectangle ss and Mouse Left Button up/down toggle)
+static const char *mev0x4080cmd[] = { "dwlii", "mlb", NULL }; // Control+Insert (Mouse Left Button up/down toggle)
+
+static const char *mutetoggle[] = { "dwlii", "audio", "mtoggle", NULL };
+static const char *voldown[] = { "dwlii", "audio", "voldown", NULL };
+static const char *volup[] = { "dwlii", "audio", "volup", NULL };
+static const char *bridown[] = { "dwlii", "screenbl", "down", NULL };
+static const char *briup[] = { "dwlii", "screenbl", "up", NULL };
+
+#include "keys.h"
+#include "shiftview.c"
+
+static const Key keys[] = {
+	/* modifier                  key             function        argument */
+	{ MODKEY,                    Key_p,          spawn,          {.v = menucmd} },
+	{ MODKEY,                    Key_e,          spawn,          {.v = menucmd} },
+	{ MODKEY,                    Key_Return,     spawn,          {.v = termcmd} },
+	{ 0|WLR_MODIFIER_CTRL,       Key_backslash,  spawn,          {.v = termAFcmd} },
+	{ 0,                         Key_F12,        spawn,          {.v = dwliicmd} },
+	{ 0,                         Key_Home,       spawn,          {.v = dwlinfocmd} },
+	{ MODKEY,                    Key_minus,      spawn,          {.v = termcmd} },
+	{ MODKEY,                    Key_equal,      spawn,          {.v = nnncmd} },
+
+	{ MODKEY,                    Key_Print,      spawn,          {.v = mnsscmd} },
+	{ 0,                         Key_Print,      spawn,          {.v = ss1cmd} },
+	{ 0|WLR_MODIFIER_SHIFT,      Key_Print,      spawn,          {.v = ss2cmd} },
+	{ 0|WLR_MODIFIER_CTRL,       Key_Print,      spawn,          {.v = ss3cmd} },
+	{ 0,                         Key_Insert,     spawn,          {.v = selviewcmd} },
+	{ 0|WLR_MODIFIER_CTRL,       Key_Insert,     spawn,          {.v = mev0x4080cmd} },
+
+	{ MODKEY,                    Key_semicolon,  spawn,          {.v = mn1cmd} },
+	{ MODKEY,                    Key_backslash,  spawn,          {.v = mn2cmd} },
+	{ MODKEY,                    Key_apostrophe, spawn,          {.v = mn3cmd} },
+
+	/* modifier        key                  function        argument */
+	{ MODKEY,          Key_j,               focusstack,     {.i = +1} },
+	{ MODKEY,          Key_n,               focusstack,     {.i = +1} },
+	{ MODKEY,          Key_bracketleft,     focusstack,     {.i = +1} },
+	{ MODKEY,          Key_k,               focusstack,     {.i = -1} },
+	{ MODKEY,          Key_bracketright,    focusstack,     {.i = -1} },
+
+	{ MODKEY,                    Key_i,            incnmaster,       {.i = +1} },
+	{ MODKEY,                    Key_d,            incnmaster,       {.i = -1} },
+	{ MODKEY,                    Key_h,            setmfact,         {.f = -0.05} },
+	{ MODKEY,                    Key_l,            setmfact,         {.f = +0.05} },
+	{ MODKEY|WLR_MODIFIER_SHIFT, Key_Return,       zoom,             {0} },
+	{ MODKEY,                    Key_Tab,          view,             {0} },
+	{ MODKEY|WLR_MODIFIER_SHIFT, Key_c,            killclient,       {0} },
+	{ MODKEY,                    Key_BackSpace,    killclient,       {0} },
+	{ MODKEY,                    Key_z,            killclient,       {0} },
+	{ MODKEY,                    Key_m,            setlayout,        {.v = &layouts[0]} },
+	{ MODKEY,                    Key_t,            setlayout,        {.v = &layouts[1]} },
+	{ MODKEY,                    Key_f,            setlayout,        {.v = &layouts[2]} },
+	{ MODKEY,                    Key_space,        shiftview,        {.i = 1 } },
+	{ MODKEY|WLR_MODIFIER_SHIFT, Key_space,        shiftview,        {.i = -1 } },
+	{ MODKEY,                    Key_b,            setlayout,        {0} },
+	{ MODKEY|WLR_MODIFIER_SHIFT, Key_f,            togglefloating,   {0} },
+	{ MODKEY,                    Key_y,            togglefullscreen, {0} },
+	{ MODKEY,                    Key_0,            view,             {.ui = ~0} },
+	{ MODKEY|WLR_MODIFIER_SHIFT, Key_0,            tag,              {.ui = ~0} },
+	{ MODKEY,                    Key_comma,        focusmon,         {.i = WLR_DIRECTION_LEFT} },
+	{ MODKEY,                    Key_period,       focusmon,         {.i = WLR_DIRECTION_RIGHT} },
+	{ MODKEY|WLR_MODIFIER_SHIFT, Key_comma,        tagmon,           {.i = WLR_DIRECTION_LEFT} },
+	{ MODKEY|WLR_MODIFIER_SHIFT, Key_period,       tagmon,           {.i = WLR_DIRECTION_RIGHT} },
+	TAGKEYS(                     Key_1,                       0),
+	TAGKEYS(                     Key_2,                       1),
+	TAGKEYS(                     Key_3,                       2),
+	TAGKEYS(                     Key_4,                       3),
+	TAGKEYS(                     Key_5,                       4),
+	TAGKEYS(                     Key_6,                       5),
+	TAGKEYS(                     Key_7,                       6),
+	TAGKEYS(                     Key_8,                       7),
+	TAGKEYS(                     Key_9,                       8),
+	{ MODKEY|WLR_MODIFIER_SHIFT, Key_q,       quit,           {0} },
+
+	/* Audio Control & Screen Brightness Control */
+	/* modifier  key                        function        argument */
+	{ 0,         Key_XF86AudioMute,         spawn,          {.v = mutetoggle} },
+	{ 0,         Key_XF86AudioLowerVolume,  spawn,          {.v = voldown} },
+	{ 0,         Key_XF86AudioRaiseVolume,  spawn,          {.v = volup} },
+	{ 0,         Key_XF86MonBrightnessDown, spawn,          {.v = bridown} },
+	{ 0,         Key_XF86MonBrightnessUp,   spawn,          {.v = briup} },
+
+	/* Ctrl-Alt-Backspace and Ctrl-Alt-Fx used to be handled by X server */
+	{ WLR_MODIFIER_CTRL|WLR_MODIFIER_ALT,Key_BackSpace, quit, {0} },
+#define CHVT(KEY,n) { WLR_MODIFIER_CTRL|WLR_MODIFIER_ALT, KEY, chvt, {.ui = (n)} }
+	CHVT(Key_F1, 1), CHVT(Key_F2,  2),  CHVT(Key_F3,  3),  CHVT(Key_F4,  4),
+	CHVT(Key_F5, 5), CHVT(Key_F6,  6),  CHVT(Key_F7,  7),  CHVT(Key_F8,  8),
+	CHVT(Key_F9, 9), CHVT(Key_F10, 10), CHVT(Key_F11, 11), CHVT(Key_F12, 12),
+};
--- /dev/null	2023-02-22 13:21:10.572520974 +0630
+++ b/ruconfig.h	2023-02-22 15:14:26.792991056 +0630
@@ -0,0 +1,8 @@
+/* this client rules section was moved from config.h */
+
+static const Rule rules[] = {
+	/* app_id       title          tags mask    isfloating   monitor */
+	{ "Alacritty",  "termfloat",   0,           1,           -1 },
+	{ "foot",       "termfloat",   0,           1,           -1 },
+	{ NULL,         "mshcfloat",   0,           1,           -1 },
+};
--- /dev/null	2023-02-22 13:21:10.572520974 +0630
+++ b/keys.h	2023-02-22 15:14:26.792991056 +0630
@@ -0,0 +1,242 @@
+/* You can use the macros within this file
+ * instead of search the keycodes yourself
+ * with wev or something like that
+ * Also probably you search this:
+ *    Key_XF86AudioMute
+ *    Key_XF86AudioLowerVolume
+ *    Key_XF86AudioRaiseVolume
+ *    Key_XF86MonBrightnessDown
+ *    Key_XF86MonBrightnessUp
+*/
+
+#define Key_Escape                   9
+#define Key_1                        10
+#define Key_2                        11
+#define Key_3                        12
+#define Key_4                        13
+#define Key_5                        14
+#define Key_6                        15
+#define Key_7                        16
+#define Key_8                        17
+#define Key_9                        18
+#define Key_0                        19
+#define Key_minus                    20
+#define Key_equal                    21
+#define Key_BackSpace                22
+#define Key_Tab                      23
+#define Key_q                        24
+#define Key_w                        25
+#define Key_e                        26
+#define Key_r                        27
+#define Key_t                        28
+#define Key_y                        29
+#define Key_u                        30
+#define Key_i                        31
+#define Key_o                        32
+#define Key_p                        33
+#define Key_bracketleft              34
+#define Key_bracketright             35
+#define Key_Return                   36
+#define Key_Control_L                37
+#define Key_a                        38
+#define Key_s                        39
+#define Key_d                        40
+#define Key_f                        41
+#define Key_g                        42
+#define Key_h                        43
+#define Key_j                        44
+#define Key_k                        45
+#define Key_l                        46
+#define Key_semicolon                47
+#define Key_apostrophe               48
+#define Key_grave                    49
+#define Key_Shift_L                  50
+#define Key_backslash                51
+#define Key_z                        52
+#define Key_x                        53
+#define Key_c                        54
+#define Key_v                        55
+#define Key_b                        56
+#define Key_n                        57
+#define Key_m                        58
+#define Key_comma                    59
+#define Key_period                   60
+#define Key_slash                    61
+#define Key_Shift_R                  62
+#define Key_KP_Multiply              63
+#define Key_Alt_L                    64
+#define Key_space                    65
+#define Key_Caps_Lock                66
+#define Key_F1                       67
+#define Key_F2                       68
+#define Key_F3                       69
+#define Key_F4                       70
+#define Key_F5                       71
+#define Key_F6                       72
+#define Key_F7                       73
+#define Key_F8                       74
+#define Key_F9                       75
+#define Key_F10                      76
+#define Key_Num_Lock                 77
+#define Key_Scroll_Lock              78
+#define Key_KP_Home                  79
+#define Key_KP_7                     Key_KP_Home
+#define Key_KP_Up                    80
+#define Key_KP_8                     Key_KP_Up
+#define Key_KP_Prior                 81
+#define Key_KP_9                     Key_KP_Prior
+#define Key_KP_Subtract              82
+#define Key_KP_Left                  83
+#define Key_KP_4                     Key_KP_Left
+#define Key_KP_Begin                 84
+#define Key_KP_5                     Key_KP_Begin
+#define Key_KP_Right                 85
+#define Key_KP_6                     Key_KP_Right
+#define Key_KP_Add                   86
+#define Key_KP_End                   87
+#define Key_KP_1                     Key_KP_End
+#define Key_KP_Down                  88
+#define Key_KP_2                     Key_KP_Down
+#define Key_KP_Next                  89
+#define Key_KP_3                     Key_KP_Next
+#define Key_KP_Insert                90
+#define Key_KP_0                     Key_KP_Insert
+#define Key_KP_Delete                91
+#define Key_KP_Period                Key_KP_Insert
+#define Key_ISO_Level3_Shift         92
+#define Key_less                     94
+#define Key_F11                      95
+#define Key_F12                      96
+#define Key_Katakana                 98
+#define Key_Hiragana                 99
+#define Key_Henkan_Mode              100
+#define Key_Hiragana_Katakana        101
+#define Key_Muhenkan                 102
+#define Key_KP_Enter                 104
+#define Key_Control_R                105
+#define Key_KP_Divide                106
+#define Key_Print                    107
+#define Key_Alt_R                    108
+#define Key_Linefeed                 109
+#define Key_Home                     110
+#define Key_Up                       111
+#define Key_Prior                    112
+#define Key_Left                     113
+#define Key_Right                    114
+#define Key_End                      115
+#define Key_Down                     116
+#define Key_Next                     117
+#define Key_Insert                   118
+#define Key_Delete                   119
+#define Key_XF86AudioMute            121
+#define Key_XF86AudioLowerVolume     122
+#define Key_XF86AudioRaiseVolume     123
+#define Key_XF86PowerOff             124
+#define Key_KP_Equal                 125
+#define Key_plusminus                126
+#define Key_Pause                    127
+#define Key_XF86LaunchA              128
+#define Key_KP_Decimal               129
+#define Key_Hangul                   130
+#define Key_Hangul_Hanja             131
+#define Key_Super_L                  133
+#define Key_Super_R                  134
+#define Key_Menu                     135
+#define Key_Cancel                   136
+#define Key_Redo                     137
+#define Key_SunProps                 138
+#define Key_Undo                     139
+#define Key_SunFront                 140
+#define Key_XF86Copy                 141
+#define Key_XF86Open                 142
+#define Key_XF86Paste                143
+#define Key_Find                     144
+#define Key_XF86Cut                  145
+#define Key_Help                     146
+#define Key_XF86MenuKB               147
+#define Key_XF86Calculator           148
+#define Key_XF86Sleep                150
+#define Key_XF86WakeUp               151
+#define Key_XF86Explorer             152
+#define Key_XF86Send                 153
+#define Key_XF86Xfer                 155
+#define Key_XF86Launch1              156
+#define Key_XF86Launch2              157
+#define Key_XF86WWW                  158
+#define Key_XF86DOS                  159
+#define Key_XF86ScreenSaver          160
+#define Key_XF86RotateWindows        161
+#define Key_XF86TaskPane             162
+#define Key_XF86Mail                 163
+#define Key_XF86Favorites            164
+#define Key_XF86MyComputer           165
+#define Key_XF86Back                 166
+#define Key_XF86Forward              167
+#define Key_XF86Eject1               169
+#define Key_XF86Eject2               170
+#define Key_XF86AudioNext            171
+#define Key_XF86AudioPlay            172
+#define Key_XF86AudioPrev            173
+#define Key_XF86AudioStop            174
+#define Key_XF86AudioRecord          175
+#define Key_XF86AudioRewind          176
+#define Key_XF86Phone                177
+#define Key_XF86Tools                179
+#define Key_XF86HomePage             180
+#define Key_XF86Reload               181
+#define Key_XF86Close                182
+#define Key_XF86ScrollUp             185
+#define Key_XF86ScrollDown           186
+#define Key_parenleft                187
+#define Key_parenright               188
+#define Key_XF86New                  189
+#define Key_Redo2                    190
+#define Key_XF86Tools2               191
+#define Key_XF86Launch5              192
+#define Key_XF86Launch6              193
+#define Key_XF86Launch7              194
+#define Key_XF86Launch8              195
+#define Key_XF86Launch9              196
+#define Key_XF86AudioMicMute         198
+#define Key_XF86TouchpadToggle       199
+#define Key_XF86TouchpadOn           200
+#define Key_XF86TouchpadOff          201
+#define Key_Mode_switch              203
+#define Key_XF86AudioPlay2           208
+#define Key_XF86AudioPause           209
+#define Key_XF86Launch3              210
+#define Key_XF86Launch4              211
+#define Key_XF86LaunchB              212
+#define Key_XF86Suspend              213
+#define Key_XF86Close2               214
+#define Key_XF86AudioPlay3           215
+#define Key_XF86AudioForward         216
+#define Key_Print2                   218
+#define Key_XF86WebCam               220
+#define Key_XF86AudioPreset          221
+#define Key_XF86Mail2                223
+#define Key_XF86Messenger            224
+#define Key_XF86Search               225
+#define Key_XF86Go                   226
+#define Key_XF86Finance              227
+#define Key_XF86Game                 228
+#define Key_XF86Shop                 229
+#define Key_Cancel2                  231
+#define Key_XF86MonBrightnessDown    232
+#define Key_XF86MonBrightnessUp      233
+#define Key_XF86AudioMedia           234
+#define Key_XF86Display              235
+#define Key_XF86KbdLightOnOff        236
+#define Key_XF86KbdBrightnessDown    237
+#define Key_XF86KbdBrightnessUp      238
+#define Key_XF86Send2                239
+#define Key_XF86Reply                240
+#define Key_XF86MailForward          241
+#define Key_XF86Save                 242
+#define Key_XF86Documents            243
+#define Key_XF86Battery              244
+#define Key_XF86Bluetooth            245
+#define Key_XF86WLAN                 246
+#define Key_XF86MonBrightnessCycle   251
+#define Key_XF86WWAN                 254
+#define Key_XF86RFKill               255
--- /dev/null	2023-02-22 13:21:10.572520974 +0630
+++ b/shiftview.c	2023-02-22 15:14:26.799657723 +0630
@@ -0,0 +1,35 @@
+// "arg->i" stores the number of tags to shift right (positive value)
+//          or left (negative value)
+void
+shiftview(const Arg *arg)
+{
+	Arg a;
+	Client *c;
+	size_t ntags = LENGTH(tags);
+	bool visible = false;
+	int i = arg->i;
+	int count = 0;
+	int nextseltags, curseltags = selmon->tagset[selmon->seltags];
+
+	do {
+		if (i > 0) // left circular shift
+			nextseltags = (curseltags << i) | (curseltags >> (ntags - i));
+		else // right circular shift
+			nextseltags = curseltags >> (- i) | (curseltags << (ntags + i));
+
+		// Check if the tag is visible
+		wl_list_for_each(c, &clients, link) {
+			if (c->mon == selmon && nextseltags & c->tags) {
+				visible = true;
+				break;
+			}
+		}
+
+		i += arg->i;
+	} while (!visible && ++count <= ntags);
+
+	if (count <= ntags) {
+		a.i = nextseltags;
+		view(&a);
+	}
+}
```
