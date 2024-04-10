find . -type f -name ".DS_Store" -delete
zip -r package.zip . --exclude ".git/*" --exclude "release.sh" --exclude .DS_Store
mv package.zip ~/Downloads/package.zip