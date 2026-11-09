#!/usr/bin/env bash
# ==============================================================================
# 1-Click Hugging Face Spaces Deployment Script for VitaRisk CDS
# ==============================================================================
set -e

if [ -z "$1" ]; then
  echo "======================================================================"
  echo "🚀 VitaRisk CDS - 1-Click Hugging Face Spaces Deployment"
  echo "======================================================================"
  echo "Usage: ./scripts/deploy_hf.sh <your-hf-username> [space-name]"
  echo ""
  echo "Example:"
  echo "  ./scripts/deploy_hf.sh armageden vitarisk-cds"
  echo ""
  echo "Steps performed automatically:"
  echo "  1. Configures HF Spaces git remote (Docker SDK)"
  echo "  2. Pushes repo main branch to Hugging Face"
  echo "  3. Provides your permanent HTTPS live URL for Devpost"
  echo "======================================================================"
  exit 1
fi

HF_USER="$1"
SPACE_NAME="${2:-vitarisk-cds}"
REMOTE_URL="https://huggingface.co/spaces/${HF_USER}/${SPACE_NAME}"

echo "Configuring Hugging Face Space remote: ${REMOTE_URL}..."
if git remote | grep -q "^space$"; then
  git remote set-url space "${REMOTE_URL}"
else
  git remote add space "${REMOTE_URL}"
fi

echo "Pushing main branch to Hugging Face Space..."
git push space main

echo ""
echo "======================================================================"
echo "🎉 DEPLOYMENT LAUNCHED SUCCESSFULLY!"
echo "======================================================================"
echo "Your live public web app will be available in ~90 seconds at:"
echo "👉 https://${HF_USER}-${SPACE_NAME}.hf.space"
echo ""
echo "Paste this URL into your Devpost submission under 'Working Demo URL'!"
echo "======================================================================"
