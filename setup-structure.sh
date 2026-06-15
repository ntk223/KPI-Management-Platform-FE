#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Initializing modular folder structure for KPI Management Project..."

# Define directories to create
DIRS=(
  "src/assets"
  "src/components/ui"
  "src/components/feedback"
  "src/config"
  "src/context"
  "src/features/auth/components"
  "src/features/auth/hooks"
  "src/features/auth/services"
  "src/features/auth/types"
  "src/features/kpi-document/components"
  "src/features/kpi-document/hooks"
  "src/features/kpi-document/services"
  "src/features/kpi-document/types"
  "src/features/tracking-log/components"
  "src/features/tracking-log/hooks"
  "src/features/tracking-log/services"
  "src/features/tracking-log/types"
  "src/hooks"
  "src/layouts"
  "src/pages"
  "src/routes"
  "src/services"
  "src/styles"
  "src/types"
  "src/utils"
)

# Create directories
for dir in "${DIRS[@]}"; do
  mkdir -p "$dir"
  echo "Created directory: $dir"
done

# Create index.ts files for exports
touch src/components/ui/index.ts
touch src/components/feedback/index.ts
touch src/config/index.ts
touch src/context/index.ts
touch src/features/auth/index.ts
touch src/features/kpi-document/index.ts
touch src/features/tracking-log/index.ts
touch src/hooks/index.ts
touch src/layouts/index.ts
touch src/pages/index.ts
touch src/routes/index.ts
touch src/services/index.ts
touch src/types/index.ts
touch src/utils/index.ts

# Create initial empty React file placeholders
touch src/App.tsx
touch src/main.tsx

echo "Directory structure created successfully!"
echo "Now you can write source code inside the designated directories."
