#!/bin/bash

# OpenEXA Chat - CI/CD Setup Script
# This script helps set up and verify the CI/CD pipeline

set -e

echo "🚀 OpenEXA Chat - CI/CD Setup"
echo "=============================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ This directory is not a git repository."
    echo ""
    echo "To initialize git:"
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
    echo "  git remote add origin <your-repo-url>"
    exit 1
fi

echo "✅ Git repository detected"
echo ""

# Check GitHub workflows directory
if [ -d ".github/workflows" ]; then
    echo "✅ GitHub workflows directory found"
    echo ""
    echo "Available workflows:"
    ls -lh .github/workflows/
    echo ""
else
    echo "⚠️  GitHub workflows directory not found"
    exit 1
fi

# Check package.json scripts
echo "📝 Checking package.json scripts:"
echo ""

if grep -q '"lint"' package.json; then
    echo "✅ lint script found"
else
    echo "⚠️  lint script missing"
fi

if grep -q '"build"' package.json; then
    echo "✅ build script found"
else
    echo "⚠️  build script missing"
fi

if grep -q '"test"' package.json; then
    echo "✅ test script found"
else
    echo "⚠️  test script missing (optional but recommended)"
fi

echo ""
echo "📊 Next Steps:"
echo "=============="
echo ""
echo "1. Push to GitHub:"
echo "   git push -u origin main"
echo ""
echo "2. Enable Actions in GitHub:"
echo "   - Go to your repository on GitHub"
echo "   - Navigate to Settings > Actions"
echo "   - Select 'Allow all actions and reusable workflows'"
echo ""
echo "3. Set up deployment environments (optional):"
echo "   - Go to Settings > Environments"
echo "   - Create 'production' environment"
echo "   - Add protection rules and secrets as needed"
echo ""
echo "4. Configure branch protection (recommended):"
echo "   - Go to Settings > Branches"
echo "   - Add rule for 'main' branch"
echo "   - Require status checks to pass before merging"
echo ""
echo "5. Monitor CI/CD runs:"
echo "   - Go to Actions tab in your repository"
echo "   - Watch workflows execute on each push/PR"
echo ""
echo "✅ CI/CD pipeline is ready!"
