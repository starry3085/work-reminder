#!/bin/bash

echo "========================================"
echo "Deploying to both Gitee and GitHub"
echo "========================================"

echo "Step 1: Adding all files to git..."
git add .

echo "Step 2: Committing changes..."
read -p "Enter commit message (or press Enter for default): " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Fix PAUSE button issue - Add GitHub Pages compatibility fixes"
fi

git commit -m "$commit_msg"

echo "Step 3: Checking current remotes..."
git remote -v

echo "Step 4: Adding remotes if not exist..."
if ! git remote get-url gitee >/dev/null 2>&1; then
    echo "Adding Gitee remote..."
    git remote add gitee https://gitee.com/starry3085/work-reminder.git
else
    echo "Gitee remote already exists"
fi

if ! git remote get-url github >/dev/null 2>&1; then
    echo "Adding GitHub remote..."
    git remote add github https://github.com/starry3085/work-reminder.git
else
    echo "GitHub remote already exists"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
    echo "Setting origin to GitHub..."
    git remote add origin https://github.com/starry3085/work-reminder.git
fi

echo "Step 5: Pushing to Gitee..."
if ! git push gitee main; then
    echo "Warning: Failed to push to Gitee, trying to set upstream..."
    git push -u gitee main
fi

echo "Step 6: Pushing to GitHub..."
if ! git push github main; then
    echo "Warning: Failed to push to GitHub, trying to set upstream..."
    git push -u github main
fi

echo "Step 7: Pushing to origin (GitHub)..."
if ! git push origin main; then
    echo "Warning: Failed to push to origin, trying to set upstream..."
    git push -u origin main
fi

echo "========================================"
echo "Deployment Summary:"
echo "- Gitee: https://gitee.com/starry3085/work-reminder"
echo "- GitHub: https://github.com/starry3085/work-reminder"
echo "- GitHub Pages: https://starry3085.github.io/work-reminder/"
echo "========================================"
echo "Deployment complete!"
echo "GitHub Pages will auto-deploy from main branch."
echo "Please wait 1-2 minutes for GitHub Pages to update."

read -p "Press Enter to continue..."