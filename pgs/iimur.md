# AUR Helper script

2023-03-12 Sunday 15:19 03:19:03 PM

Every [Arch Linux](https://archlinux.org) user usually install [AUR](https://aur.archlinux.org) packages at some point.
I also install 10-15 AUR packages in my Arch Linux system.
But I am not an advanced user. I usually don't need to edit this and that.
I just need to install and update AUR packages. There are AUR Helpers out there.
But they are very advanced and complicated to me. So I wrote the following script for my personal use.
It is a `dash` script and very fast. The following script can be cloned from my [mshii repository](https://github.com/minsoehan/mshii)
and [the direct link to the script](https://github.com/minsoehan/mshii/blob/main/mur).
```bash
#!/bin/dash

aursearch () {
    curl -s "https://aur.archlinux.org/rpc/?v=5&type=search&arg=$1" | jq -r '.results [] | "-------------------------------------\n"+.Name+"\n"+.Description'
    echo "-------------------------------------"
}

aurmanage () {
    if [ "$1" = "update" ]; then
        for i in $(pacman -Qm | cut -d' ' -f1); do
            iv=$(pacman -Q $i | cut -d' ' -f2)
            cv=$(curl -s "https://aur.archlinux.org/rpc/?v=5&type=info&arg[]=$i" | jq -r '.results[] | .Version')
            if [ ! -z "$cv" ]; then
                if [ "$iv" = "$cv" ]; then
                    echo -n "$i "
                    aniup
                else
                    mkdir -p ~/.cache/mshii/murbui
                    cd ~/.cache/mshii/murbui
                    [ -d $i ] && rm -rf ./$i >> /dev/null 2>&1
                    [ -f $i.tar.gz ] && rm -f ./$i.tar.gz >> /dev/null 2>&1
                    wget https://aur.archlinux.org/cgit/aur.git/snapshot/$i.tar.gz
                    tar -xzf ./$i.tar.gz
                    cd ./$i
                    makepkg -isc
                    cd ~
                fi
            else
                echo "! $i is not found at aur.archlinux.org"
            fi
        done
    else
        chap=$(curl -s "https://aur.archlinux.org/rpc/?v=5&type=info&arg[]=$2" | jq -r '.results [] | .Version')
        if [ ! -z "$chap" ]; then
            mkdir -p ~/.cache/mshii/murbui
            cd ~/.cache/mshii/murbui
            [ -d "$2" ] && rm -rf ./"$2" >> /dev/null 2>&1
            [ -f "$2.tar.gz" ] && rm -f ./"$2.tar.gz" >> /dev/null 2>&1
            wget https://aur.archlinux.org/cgit/aur.git/snapshot/"$2.tar.gz"
            tar -xzf ./"$2.tar.gz"
            case $1 in
                install)
                    cd ./"$2"
                    makepkg -isc
                    cd ~
                    ;;
                download)
                    echo "----------> AUR Package has been downloaded and extracted."
                    echo " "
                    ;;
            esac
        else
            echo "! The package does not exist in AUR."
        fi
    fi
}

aniup () {
    ch='-:-:-:-:-:-:-:-:-:-:-:>: :u:p: :t:o: :d:a:t:e: :'
    IFS=:
    for i in $ch; do
        echo -n $i
        sleep 0.08
    done
    echo ""
}

case $1 in
    search)
        aursearch $2
        ;;
    install)
        aurmanage install $2
        ;;
    download)
        aurmanage download $2
        ;;
    update)
        aurmanage update
        ;;
    *)
        echo "------------------------------------------------------------"
        echo "   Do one of search, install, download and update after mur"
        echo "   Examples:"
        echo "    ~ $ ii mur search <keyword>"
        echo "    ~ $ ii mur install <packagename>"
        echo "    ~ $ ii mur download <packagename>"
        echo "    ~ $ ii mur update"
        echo "------------------------------------------------------------"
        ;;
esac
```
