# git push

2023-03-12 Sunday 18:43 06:43:19 PM

To push files in a local folder to github repository, go in the folder and run
```
$ echo "# Title" >> README.md
$ git init
$ git add .
$ git commit -m "write commit"
$ git branch -M main
$ git remote add origin https://github.com/username/reponame.git
$ git push -u origin main
```
If `ssh` is used
```
$ git remote add origin git@github.com:username/reponame.git
```
If the repository was cloned into local computer, go to the reponame folder, edit or add file and run,
```
$ git add .
$ git commit -m "write commit"
$ git push -u origin main
```
see: photos
![git push http](bag/gitpush-http.png)
![git push ssh](bag/gitpush-ssh.png)

---


