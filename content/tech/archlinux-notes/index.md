+++
date = '2025-06-25T20:17:13+06:30'
draft = false
title = 'Archlinux Notes'
categories = ['Tech', 'Linux']
tags = ['Arch Linux', 'System', 'Command']
+++

### Signing Error of System Upgrading

Upgrading the system regularly running {{< inline-code >}}$ sudo pacman -Syu{{</ inline-code >}} prevents most signing errors. If delay is unavoidable and system upgrade gets delayed for an extended period, manually sync the pacakge database and upgrade the archlinux-keyring package before system upgrade. Basically it is syncing the package database and installing archlinux-keyring package just before the system upgrade. See the following command;

```text
# pacman -Sy archlinux-keyring && pacman -Su
```

### Failed to init transaction (unable to lock database)

When pacman is about to alter the package database, for example installing a package, it creates a lock file at /var/lib/pacman/db.lck. This prevents another instance of pacman from trying to alter the package database at the same time. If pacman is interrupted while changing the database, this stale lock file can remain. If you are certain that no instances of pacman are running then delete the lock file:

```text
# rm /var/lib/pacman/db.lck
```

### Finding which package a file or command belongs to

```text
$ pacman -Qo /path/to/filename
```

or

```text
$ pacman -Qo command
```

or

```text
$ pacman -F /path/to/filename
```

or

```text
$ pacman -F command
```

E.g., to query the database to know which package inotifywait command belongs to:

```text
$ pacman -Qo inotifywait
/usr/bin/inotifywait is owned by inotify-tools 4.23.9.0-1
```

```text
$ pacman -F inotifywait
extra/bash-completion 2.11-3
    usr/share/bash-completion/completions/inotifywait
extra/inotify-tools 4.23.9.0-1 [installed]
    usr/bin/inotifywait
```

Be aware that to use {{< inline-code >}}$ pacman -F <command or file>{{</ inline-code >}}, it needs to run the following first.

```text
# pacman -Fy
```