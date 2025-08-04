+++
date = '2025-06-23T10:59:30+06:30'
draft = false
title = 'Disable Drag Lock DWL'
categories = ['Tech', 'Linux']
tags = ['Wayland', 'dwl', 'Window Manager']
+++

Disabling {{< inline-code >}}drag_lock{{< /inline-code >}} function in dwl is recommended if you are experiencing half a second delay on releasing mouse button simulated by touchpad.

For example, it takes half a second for cursor to reset its shape after doing any drag action like moving or resizing window using touchpad.

To disable that behaviour, it is easy. Just disable static const int {{< inline-code >}}drag_lock{{< /inline-code >}} function by setting its value to 0 in {{< inline-code >}}config.h{{< /inline-code >}} file.

```c
/* Trackpad */
static const int tap_to_click = 1;
static const int tap_and_drag = 1;
/* to disable the following drag_lock function, just set its value to 0. Default is 1. */
static const int drag_lock = 0;
static const int natural_scrolling = 0;
static const int disable_while_typing = 1;
static const int left_handed = 0;
static const int middle_button_emulation = 0;
```