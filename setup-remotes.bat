@echo off
echo Setting up Git remotes for dual repository deployment...

echo Current remotes:
git remote -v

echo.
echo Removing existing remotes (if any)...
git remote remove origin 2>nul
git remote remove github 2>nul  
git remote remove gitee 2>nul

echo.
echo Adding new remotes...
git remote add origin https://github.com/starry3085/work-reminder.git
git remote add github https://github.com/starry3085/work-reminder.git
git remote add gitee https://gitee.com/starry3085/work-reminder.git

echo.
echo Updated remotes:
git remote -v

echo.
echo Testing connectivity...
echo Testing GitHub...
git ls-remote github HEAD

echo Testing Gitee...
git ls-remote gitee HEAD

echo.
echo Setup complete! You can now use:
echo - deploy-dual-repos.bat (full deployment with prompts)
echo - quick-deploy.bat (quick deployment with timestamp)
echo - npm run deploy-dual
echo - npm run quick-deploy

pause