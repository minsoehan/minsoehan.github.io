---
layout: post
title:  "Setting up GitHub Pages static website with Jekyll"
date:   2023-03-11 19:45:00 +0630
categories: howto
---

# Setting up GitHub Pages static website with Jekyll

See: [GitHub Pages](https://pages.github.com/) _don't forget to scroll down_.  
Create GitHub pages website first following [Create a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

Then [set up site with Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll)
Jekyll is a static site generator.
It takes text written in your favorite markup language and uses layouts to create a static website.
You can tweak the site’s look and feel, URLs, the data displayed on the page, and more.

In Arch Linux, install `ruby` first. see: [Ruby @ Arch Wiki](https://wiki.archlinux.org/title/ruby)
And `rubygems` package is going to be installed as dependency of `ruby`.

Jekyll can be install by `gem`. RubyGems is package manager of `ruby`. By default, in Arch Linux,
when run `gem`, gems are installed to `~/.local/share/gem/ruby` directory.
But that directory must be included in `$PATH` by setting environment variable as follows;
```
export GEM_HOME="$(ruby -e 'puts Gem.user_dir')"
export PATH="$PATH:$GEM_HOME/bin"
```
in the file in which environment variables are set, such as `~/.bash_profile`.
Then relogin or reboot your computer. Then install `jekyll` and `bundle` by the following.
```
gem install jekyll bundle
```
Now, jekyll is ready.

After setting up `jekyll` and `bundle` in the computer, clone the github repository (_github pages site was created_)
```
$ git clone https://github.com/username/username.github.io
```
Next, `cd` into that directory.
```
$ cd /path/to/username.github.io
```
Then run the following command.
```
$ jekyll new --skip-bundle .
```
Edit `Gemfile` file. Comment `gem "jekyll"` and uncomment `gem "github-pages",group: :jekyll-plugins`.
```
# gem "jekyll", "~> 4.3.2"
# This is the default theme for new Jekyll sites. You may change this to anything you like.
gem "minima", "~> 2.5"
# If you want to use GitHub Pages, remove the "gem "jekyll"" above and
# uncomment the line below. To upgrade, run `bundle update github-pages`.
# gem "github-pages", group: :jekyll_plugins
gem "github-pages", group: :jekyll_plugins
```
And...
```
$ bundle install
```
Now, more files would have been populated. Browse the folder, edit `_config.yml` file, add file in `_posts` directory,
add pages-file, and so on. After editing and adding, run
```
$ jekyll serve
```
or if error
```
$ bundle exec jekyll serve
```
the `--webrick` error happen, run the following first;
```
$ bundle add webrick
```
then run again the following;
```
$ bundle exec jekyll serve
```
It will generate `_site` folder and `.html` files in it. Finally, push into the github repository as follows;
```
$ git add .
$ git commit -m "write commit here"
$ git push origin main
```

Then go to site `https://username.github.io` in browser.
