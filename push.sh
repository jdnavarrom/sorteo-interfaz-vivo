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

# Cargar variables de entorno desde .env si existe
if [ -f "$DIR/.env" ]; then
  set -a  # Exporta todas las variables que se carguen a continuación
  source "$DIR/.env"
  set +a
else
  echo "⚠️  No se encontró el archivo .env, usando valores predeterminados"
  REGISTRY="10.1.10.13:5000"  # Registro por defecto
fi

ORIGINAL_REGISTRY="$REGISTRY"  # Guardar valor original

LAST_ENV=""

while true; do
  REGISTRY="$ORIGINAL_REGISTRY"  # Restaurar valor original al inicio de cada ciclo

  # Pedir ambiente
  if [ -z "${ENVIRONMENT-}" ]; then
    if [ -n "$LAST_ENV" ]; then
      read -rp "Ingresa el ambiente (dev/prod) [último: $LAST_ENV]: " ENVIRONMENT || ENVIRONMENT="$LAST_ENV"
      ENVIRONMENT=${ENVIRONMENT:-$LAST_ENV}
    else
      read -rp "Ingresa el ambiente (dev/prod): " ENVIRONMENT || ENVIRONMENT=""
    fi
  fi

  # Validar ambiente
  if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo "❌ Ambiente inválido. Usa 'dev' o 'prod'."
    ENVIRONMENT=""
    continue
  fi

  LAST_ENV="$ENVIRONMENT"

  # Preguntar si subir imagenes
  read -rp "¿Deseas subir las imágenes al repositorio? (y/n): " PUSH_CONFIRM || PUSH_CONFIRM="n"
  if [[ "$PUSH_CONFIRM" =~ ^[Nn]$ ]]; then
    ONLY_BUILD=true
  else
    ONLY_BUILD=false
  fi

  # Concatenar ambiente al REGISTRY
  REGISTRY="${REGISTRY%/}/$ENVIRONMENT/${PROJECT%/}"

  export REGISTRY ENVIRONMENT

  # Archivo docker-compose
  DOCKER_COMPOSE_FILE="$DIR/docker-compose-$ENVIRONMENT.yaml"
  if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "❌ No se encontró el archivo $DOCKER_COMPOSE_FILE"
    $NO_PAUSE || read -p "Presiona cualquier tecla para continuar..."
    ENVIRONMENT=""
    continue
  fi

#  echo "📦 Variables cargadas:"
#  env | grep -E 'REGISTRY|ENVIRONMENT|PROFILE|VERSION|_VERSION' || true

  # Verificar docker
  if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Inícialo e intenta nuevamente."
    $NO_PAUSE || read -p "Presiona cualquier tecla para continuar..."
    ENVIRONMENT=""
    continue
  fi

  # Ejecutar build
  echo "🔧 Ejecutando build con $DOCKER_COMPOSE_FILE..."
  docker-compose -f "$DOCKER_COMPOSE_FILE" build

  if $ONLY_BUILD; then
    echo "✅ Build completado. No se realizó push por elección del usuario."
  else
    SERVICES=$(grep -E '^\s*image:' "$DOCKER_COMPOSE_FILE" | awk '{print $2}' | tr -d '"' | grep -v '^#')
    if [ -z "$SERVICES" ]; then
      echo "❌ No se encontraron servicios con imagen en $DOCKER_COMPOSE_FILE"
      $NO_PAUSE || read -p "Presiona cualquier tecla para continuar..."
      ENVIRONMENT=""
      continue
    fi

    FAILED_IMAGES=()
    PUSH_COMMANDS=()

    env_expand() {
      local raw="$1"
      echo "$raw" | envsubst
    }

    for SERVICE in $SERVICES; do
      IMAGE_NAME=$(env_expand "$SERVICE")

      if [[ "$IMAGE_NAME" == *"\${"* ]]; then
        echo "❌ Error: La imagen '$SERVICE' aún contiene variables sin reemplazar."
        FAILED_IMAGES+=("$SERVICE")
        continue
      fi

      echo "⬆️  Subiendo la imagen: $IMAGE_NAME"

      if $PARALLEL; then
        (
          if docker push "$IMAGE_NAME"; then
            echo "✅ Imagen subida: $IMAGE_NAME"
          else
            echo "❌ Error al subir la imagen: $IMAGE_NAME"
            FAILED_IMAGES+=("$IMAGE_NAME")
          fi
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
      echo "❌ Se encontraron errores al subir las siguientes imágenes:"
      for img in "${FAILED_IMAGES[@]}"; do
        echo "   - $img"
      done
    fi
  fi

  read -rp $'\n¿Deseas realizar otra operación? (y/n): ' CONTINUE || CONTINUE="n"
  if [[ "$CONTINUE" =~ ^[Nn]$ ]]; then
    echo "👋 Saliendo del script."
    break
  fi

  ENVIRONMENT=""
  ONLY_BUILD=false
  echo "----------------------------------------------"
done
