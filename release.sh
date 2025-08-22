find . -type f -name ".DS_Store" -delete
zip -r chrome.zip . --exclude ".git/*" --exclude "release.sh" --exclude .DS_Store
mv chrome.zip ~/Downloads/chrome.zip