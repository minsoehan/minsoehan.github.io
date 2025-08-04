+++
date = '2025-06-22T19:22:44+06:30'
draft = false
title = 'What Package Provides What Command'
categories = ['Tech', 'Linux']
tags = ['Arch', 'System']
+++

Sometime we just want to know which package is a command provided by? For instance, which package provides pactl command.  Then use pacman in Arch Linux.

```text
[user@hostname ~]$ pacman -Qo pactl
/usr/bin/pactl is owned by libpulse 17.0-3
```

And for it path,

```text
[user@hostname ~]$ pacman -F pactl
extra/libpulse 16.1-6 [installed: 17.0-3]
    usr/bin/pactl
    usr/share/bash-completion/completions/pactl
```

### Recommended Reads

Arch Wiki [pacman](https://wiki.archlinux.org/title/Pacman) and [Pacman Manual](https://man.archlinux.org/man/pacman.8) man page.  
Arch Wiki [Tips and Tricks of pacman](https://wiki.archlinux.org/title/Pacman/Tips_and_tricks)  
Arch Forum [Which package provides the executable](https://bbs.archlinux.org/viewtopic.php?id=262806)