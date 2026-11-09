#!/usr/bin/env bash
# ==============================================================================
# 1-Click Hugging Face Spaces Deployment Script for VitaRisk CDS
# ==============================================================================
set -e

HF_USER="${1:-farhan277}"
HF_TOKEN="$2"
SPACE_NAME="${3:-vitarisk-cds}"

if [ -z "$HF_USER" ]; then
  echo "Usage: ./scripts/deploy_hf.sh <hf-username> [hf-token] [space-name]"
  exit 1
fi

if [ -n "$HF_TOKEN" ]; then
  REMOTE_URL="https://${HF_USER}:${HF_TOKEN}@huggingface.co/spaces/${HF_USER}/${SPACE_NAME}"
  echo "Configuring Hugging Face Space remote with authentication..."
else
  REMOTE_URL="https://huggingface.co/spaces/${HF_USER}/${SPACE_NAME}"
  echo "Configuring Hugging Face Space remote: ${REMOTE_URL}..."
fi

if git remote | grep -q "^space$"; then
  git remote set-url space "${REMOTE_URL}"
else
  git remote add space "${REMOTE_URL}"
fi

echo "Pushing main branch to Hugging Face Space (${HF_USER}/${SPACE_NAME})..."
git push space main

echo ""
echo "======================================================================"
echo "🎉 DEPLOYMENT LAUNCHED SUCCESSFULLY!"
echo "======================================================================"
echo "Your live public web app will be available in ~60-90 seconds at:"
echo "👉 https://${HF_USER}-${SPACE_NAME}.hf.space"
echo ""
echo "Paste this URL into your Devpost submission under 'Working Demo URL'!"
echo "======================================================================"
