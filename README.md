# Taxabide-Mobile-App

## Development Workflow

1. Always make changes in the `dev` branch first
2. Push changes to the `dev` branch for testing
3. After verification, merge changes to `main` branch

### Working with branches:

```bash
# Switch to dev branch for development
git checkout dev

# Make your changes and commit them
git add .
git commit -m "Your commit message"

# Push changes to dev branch
git push origin dev

# After testing, merge to main branch
git checkout main
git merge dev
git push origin main

# Return to dev branch for more development
git checkout dev
```
