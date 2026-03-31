#!/bin/bash

# Function to handle errors
error_exit() {
    echo "Error: $1"
    exit 1
}

# Run build
echo "🚀 Running npm run build..."
npm run build || error_exit "Build failed."

# Add changes
echo "📦 Adding changes to git..."
git add . || error_exit "Failed to add changes."

# Check if there are actually changes to commit
if git diff-index --quiet HEAD --; then
    echo "✅ No changes to commit. Skipping push."
    exit 0
fi

# Commit with current date/time
COMMIT_MESSAGE=$(date "+%Y-%m-%d %H:%M:%S")
echo "📝 Committing changes with message: '$COMMIT_MESSAGE'..."
git commit -m "$COMMIT_MESSAGE" || error_exit "Git commit failed."

# Push
echo "📤 Pushing changes to remote..."
git push || error_exit "Git push failed."

echo "🎉 Successfully built and pushed!"
