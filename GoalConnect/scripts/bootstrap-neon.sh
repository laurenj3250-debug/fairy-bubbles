#!/usr/bin/env bash
set -euo pipefail

# This script bootstraps the Neon database with GoalConnect's November data.
# Usage: ./scripts/bootstrap-neon.sh

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

print_step() {
  printf "\n\033[1;36m➡️  %s\033[0m\n" "$1"
}

print_success() {
  printf "\033[1;32m✅ %s\033[0m\n" "$1"
}

ensure_env_file() {
  if [[ -f .env ]]; then
    print_success ".env already exists."
    return
  fi

  if [[ ! -f .env.example ]]; then
    printf "\033[1;31m❌ Missing .env.example — cannot create .env automatically.\033[0m\n" >&2
    exit 1
  fi

  cp .env.example .env
  print_success "Created .env from .env.example."
  printf "\n\033[0;33m⚠️  Review .env and confirm the credentials match your Neon project before continuing.\033[0m\n"
}

install_dependencies() {
  print_step "Installing npm dependencies"
  npm install
  print_success "Dependencies installed."
}

run_migrations() {
  print_step "Pushing Drizzle migrations to Neon"
  npm run db:push
  print_success "Migrations applied."
}

seed_database() {
  print_step "Seeding November data"
  npm exec tsx server/setup-november-goals.ts
  print_success "Database seeded."
}

print_step "Preparing environment"
ensure_env_file

install_dependencies
run_migrations
seed_database

print_step "All done! Start the dev server with: npm run dev"
