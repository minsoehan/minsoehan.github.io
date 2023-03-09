# ydotool
After getting update of ydotool version 1.0.2-1 in Arch Linux
```
[2023-03-07T09:34:07+0630] [ALPM] upgraded ydotool (1.0.1-3 -> 1.0.2-1)
```
doing ydotool without sudo got the following message
```
~]$ ydotool type TESTING
Segmentation fault (core dumped)
```
It happens if the user was added to `input` group and the `ydotool.service` *user* service was enabled and started.
And using `ydotool` without root permission (`sudo`).

It is because `ydotool` accesses to `/dev/input`, root permission (`sudo`) is needed.
But if the user is added to `input` group, root permission (`sudo`) is not needed.
And adding user to `input` group also make `ydotool.service` *user* service to be able to start `ydotoold`.
```
$ systemctl --user enable ydotool.service
$ systemctl --user start ydotool.service
```
Otherwise `ydotoold` can not be started even though the `ydotool.service` *user* service was enabled and started.

## Working
The way working at this moment is to start `ydotoold` by root permission by putting `sudo ydotoold` in the autostart file.
Edit `/etc/sudoers` file using `visudo`, For example;
```
# EDITOR=nvim visudo
```
putting the following line below the line of `%wheel ALL=(ALL:ALL)`,
```
%wheel ALL=(ALL:ALL) NOPASSWD: /usr/bin/ydotool, /usr/bin/ydotoold
```
Then do `~] $ sudo ydotool type TESTING`. It is working.
But this way should only be temporary, I think.
