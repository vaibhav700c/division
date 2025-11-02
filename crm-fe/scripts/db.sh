#!/bin/bash

# Neon DB Helper Script for TaskFlow CRM

DATABASE_URL="postgresql://neondb_owner:npg_5eGICyt8cLqZ@ep-ancient-butterfly-adp2xjxs-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

case "$1" in
  "push")
    echo "🚀 Pushing schema to Neon DB..."
    DATABASE_URL="$DATABASE_URL" npx prisma db push
    ;;
  "seed")
    echo "🌱 Seeding database..."
    DATABASE_URL="$DATABASE_URL" pnpm db:seed
    ;;
  "studio")
    echo "🎨 Opening Prisma Studio..."
    DATABASE_URL="$DATABASE_URL" npx prisma studio
    ;;
  "generate")
    echo "⚡ Generating Prisma client..."
    DATABASE_URL="$DATABASE_URL" npx prisma generate
    ;;
  "reset")
    echo "🔄 Resetting database..."
    DATABASE_URL="$DATABASE_URL" npx prisma db push --force-reset
    DATABASE_URL="$DATABASE_URL" pnpm db:seed
    ;;
  *)
    echo "Usage: ./scripts/db.sh [push|seed|studio|generate|reset]"
    echo ""
    echo "Commands:"
    echo "  push     - Push schema changes to database"
    echo "  seed     - Seed database with initial data"
    echo "  studio   - Open Prisma Studio"
    echo "  generate - Generate Prisma client"
    echo "  reset    - Reset database and reseed"
    ;;
esac