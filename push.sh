#!/bin/bash

set -euo pipefail
trap 'echo "❌ Error en línea $LINENO. Saliendo..."; exit 1' ERR

# Obtener la ruta absoluta del directorio donde se encuentra este script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Variables de configuración por defecto
NO_PAUSE=false
PARALLEL=false

# Procesar argumentos de línea
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    -n|--no-pause) NO_PAUSE=true ;;
    -p|--parallel) PARALLEL=true ;;
    -h|--help)
      echo "Uso: $0 [-n|--no-pause] [-p|--parallel]"
      echo "  -n, --no-pause    Omitir la pausa final"
      echo "  -p, --parallel    Ejecutar docker push en paralelo"
      exit 0
      ;;
    *) echo "⚠️  Opción desconocida: $1"; exit 1 ;;
  esac
  shift
done

# Cargar variables de entorno desde .env
if [ -f "$DIR/.env" ]; then
  set -a
  source "$DIR/.env"
  set +a
else
  echo "❌ No se encontró el archivo .env"
  exit 1
fi

# 🔐 VALIDACIÓN DE VARIABLES DE HARBOR
: "${HARBOR_REGISTRY:?Falta definir HARBOR_REGISTRY en .env}"
: "${HARBOR_USERNAME:?Falta definir HARBOR_USERNAME en .env}"
: "${HARBOR_PASSWORD:?Falta definir HARBOR_PASSWORD en .env}"
: "${REGISTRY:?Falta definir REGISTRY en .env}"
: "${PROJECT:?Falta definir PROJECT en .env}"

ORIGINAL_REGISTRY="$REGISTRY"
LAST_ENV=""

while true; do
  REGISTRY="$ORIGINAL_REGISTRY"

  # Pedir ambiente
  if [ -z "${ENVIRONMENT-}" ]; then
    if [ -n "$LAST_ENV" ]; then
      read -rp "Ingresa el ambiente (dev/prod) [último: $LAST_ENV]: " ENVIRONMENT
      ENVIRONMENT=${ENVIRONMENT:-$LAST_ENV}
    else
      read -rp "Ingresa el ambiente (dev/prod): " ENVIRONMENT
    fi
  fi

  # Validar ambiente
  if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo "❌ Ambiente inválido. Usa 'dev' o 'prod'."
    ENVIRONMENT=""
    continue
  fi

  LAST_ENV="$ENVIRONMENT"

  # Preguntar si subir imágenes
  read -rp "¿Deseas subir las imágenes al repositorio? (y/n): " PUSH_CONFIRM
  if [[ "$PUSH_CONFIRM" =~ ^[Nn]$ ]]; then
    ONLY_BUILD=true
  else
    ONLY_BUILD=false
  fi

  # Concatenar ambiente al REGISTRY
  REGISTRY="${REGISTRY%/}/$ENVIRONMENT/${PROJECT%/}"
  export REGISTRY ENVIRONMENT

  DOCKER_COMPOSE_FILE="$DIR/docker-compose-$ENVIRONMENT.yaml"
  if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "❌ No se encontró el archivo $DOCKER_COMPOSE_FILE"
    $NO_PAUSE || read -p "Presiona cualquier tecla para continuar..."
    ENVIRONMENT=""
    continue
  fi

  # Verificar Docker
  if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker no está corriendo."
    exit 1
  fi

  # 🔐 LOGIN AUTOMÁTICO A HARBOR (ROBOT ACCOUNT)
  if ! $ONLY_BUILD; then
    echo "🔐 Autenticando contra Harbor: $HARBOR_REGISTRY"
    echo "$HARBOR_PASSWORD" | docker login "$HARBOR_REGISTRY" \
      --username "$HARBOR_USERNAME" \
      --password-stdin
    echo "✅ Login a Harbor exitoso"
  fi

  # Build
  echo "🔧 Ejecutando build con $DOCKER_COMPOSE_FILE..."
  docker-compose -f "$DOCKER_COMPOSE_FILE" build

  if ! $ONLY_BUILD; then
    SERVICES=$(grep -E '^\s*image:' "$DOCKER_COMPOSE_FILE" | awk '{print $2}' | tr -d '"' | grep -v '^#')

    if [ -z "$SERVICES" ]; then
      echo "❌ No se encontraron imágenes en $DOCKER_COMPOSE_FILE"
      ENVIRONMENT=""
      continue
    fi

    FAILED_IMAGES=()
    PUSH_COMMANDS=()

    env_expand() {
      echo "$1" | envsubst
    }

    for SERVICE in $SERVICES; do
      IMAGE_NAME=$(env_expand "$SERVICE")

      if [[ "$IMAGE_NAME" == *"\${"* ]]; then
        echo "❌ Imagen con variables sin reemplazar: $SERVICE"
        FAILED_IMAGES+=("$SERVICE")
        continue
      fi

      echo "⬆️  Subiendo imagen: $IMAGE_NAME"

      if $PARALLEL; then
        (
          docker push "$IMAGE_NAME" && \
          echo "✅ Imagen subida: $IMAGE_NAME" || \
          FAILED_IMAGES+=("$IMAGE_NAME")
        ) &
        PUSH_COMMANDS+=($!)
      else
        if docker push "$IMAGE_NAME"; then
          echo "✅ Imagen subida correctamente: $IMAGE_NAME"
        else
          echo "❌ Error al subir la imagen: $IMAGE_NAME"
          FAILED_IMAGES+=("$IMAGE_NAME")
        fi
      fi
    done

    if $PARALLEL && [ ${#PUSH_COMMANDS[@]} -gt 0 ]; then
      wait "${PUSH_COMMANDS[@]}"
    fi

    if [ ${#FAILED_IMAGES[@]} -gt 0 ]; then
      echo "❌ Errores al subir imágenes:"
      for img in "${FAILED_IMAGES[@]}"; do
        echo "   - $img"
      done
    fi

    # 🔐 LOGOUT (BUENA PRÁCTICA)
    docker logout "$HARBOR_REGISTRY" >/dev/null 2>&1 || true
  fi

  read -rp $'\n¿Deseas realizar otra operación? (y/n): ' CONTINUE
  if [[ "$CONTINUE" =~ ^[Nn]$ ]]; then
    echo "👋 Saliendo del script."
    break
  fi

  ENVIRONMENT=""
  ONLY_BUILD=false
  echo "----------------------------------------------"
done
``
