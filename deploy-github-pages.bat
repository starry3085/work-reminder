@echo off
echo Deploying to GitHub Pages with PAUSE button fix...

echo Step 1: Adding all files to git...
git add .

echo Step 2: Committing changes...
git commit -m "Fix PAUSE button issue on GitHub Pages - Add compatibility fixes and debugging"

echo Step 3: Pushing to main branch...
git push origin main

echo Step 4: Deploying to GitHub Pages...
npm run deploy

echo Deployment complete! 
echo Please wait 1-2 minutes for GitHub Pages to update.
echo Then test the PAUSE button functionality.

pause