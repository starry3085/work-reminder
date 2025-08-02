@echo off
echo Pushing to all repositories...

git add .
git commit -m "Update: %date% %time%"

echo Pushing to Gitee...
git push gitee main

echo Pushing to GitHub...  
git push github main

echo Pushing to origin...
git push origin main

echo Done! 
echo - Gitee: https://gitee.com/starry3085/work-reminder
echo - GitHub: https://github.com/starry3085/work-reminder
echo - GitHub Pages will auto-deploy: https://starry3085.github.io/work-reminder/