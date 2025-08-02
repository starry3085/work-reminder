@echo off
echo ========================================
echo Deploying to both Gitee and GitHub
echo ========================================

echo Step 1: Adding all files to git...
git add .

echo Step 2: Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Fix PAUSE button issue - Add GitHub Pages compatibility fixes

git commit -m "%commit_msg%"

echo Step 3: Checking current remotes...
git remote -v

echo Step 4: Adding remotes if not exist...
git remote get-url gitee >nul 2>&1
if errorlevel 1 (
    echo Adding Gitee remote...
    git remote add gitee https://gitee.com/starry3085/work-reminder.git
) else (
    echo Gitee remote already exists
)

git remote get-url github >nul 2>&1
if errorlevel 1 (
    echo Adding GitHub remote...
    git remote add github https://github.com/starry3085/work-reminder.git
) else (
    echo GitHub remote already exists
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Setting origin to GitHub...
    git remote add origin https://github.com/starry3085/work-reminder.git
)

echo Step 5: Pushing to Gitee...
git push gitee main
if errorlevel 1 (
    echo Warning: Failed to push to Gitee, trying to set upstream...
    git push -u gitee main
)

echo Step 6: Pushing to GitHub...
git push github main
if errorlevel 1 (
    echo Warning: Failed to push to GitHub, trying to set upstream...
    git push -u github main
)

echo Step 7: Pushing to origin (GitHub)...
git push origin main
if errorlevel 1 (
    echo Warning: Failed to push to origin, trying to set upstream...
    git push -u origin main
)

echo ========================================
echo Deployment Summary:
echo - Gitee: https://gitee.com/starry3085/work-reminder
echo - GitHub: https://github.com/starry3085/work-reminder  
echo - GitHub Pages: https://starry3085.github.io/work-reminder/
echo ========================================
echo Deployment complete!
echo GitHub Pages will auto-deploy from main branch.
echo Please wait 1-2 minutes for GitHub Pages to update.

pause