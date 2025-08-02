@echo off
echo Quick deploy to both repositories...

git add .
git commit -m "Update: %date% %time%"

echo Pushing to Gitee...
git push gitee main

echo Pushing to GitHub...  
git push github main
git push origin main

echo Deploying to GitHub Pages...
npm run deploy

echo Done! Check:
echo - Gitee: https://gitee.com/starry3085/work-reminder
echo - GitHub Pages: https://starry3085.github.io/work-reminder/