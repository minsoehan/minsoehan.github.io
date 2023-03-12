---
layout: post
title:  "yt-dlp notes"
date:   2023-03-11 15:56:00 +0630
categories: jekyll update
---

## yt-dlp notes
Recently I uninstall [youtube-dl](https://github.com/ytdl-org/youtube-dl) and install [yt-dlp](https://github.com/yt-dlp/yt-dlp).

I was surprised when I look at [yt-dlp (1) man page](https://man.archlinux.org/man/community/yt-dlp/yt-dlp.1.en).
There are many options and options of options. In fact, I just need to download video or audio file with quality as good as possible.
I don't really care this and that. So, I created the following script.
```bash
#!/bin/dash

durl=$(wl-paste)
ckyt=$(echo "$durl" | awk -F '/' '{print $3}')
if [ "$ckyt" = "www.youtube.com" ]; then
    fmli=$(yt-dlp -F "$durl" | grep 'mp3\|mp4\|m4a\|webm\|3gp' | wofi -d)
    fmsl=$(yt-dlp -F "$durl" | grep 'mp3\|mp4\|m4a\|webm\|3gp' | grep "$fmli")

    if [ ! -z "$fmli" ] && [ ! -z "$fmsl" ]; then
        fmid=$(echo "$fmsl" | cut -d ' ' -f 1)
        alacritty -t "terminal-float" -e yt-dlp -f "$fmid" "$durl"
    else
        notify-send -t 1800 " " "clean exit\n_"
    fi
else
    notify-send -t 1800 " " "the link is not YouTube link. Fuck You!\n_"
    exit 0
fi
```
The script need `wofi` or `fuzzel` or `bemenu`, and a terminal like `alacritty`.
Then put it in the $PATH and execute it.
