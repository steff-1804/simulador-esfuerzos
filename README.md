# Programa interactivo — Ejercicio 4.112

Simulador web del problema de máximo doblez permitido en un tubo circular hueco.

## Resultado con los datos del ejercicio

- Diámetro exterior: 0.75 pulg
- Espesor: 0.08 pulg
- Relación máxima: 4
- Resultado: h = 0.4553 pulg ≈ 11.56 mm

## Ecuación implementada

Para la barra recta:

`σ_recto = P/A`

Para la barra doblada:

`σ_máx = P/A + P h c/I`

Al imponer:

`σ_máx = k σ_recto`

se obtiene:

`h_máx = (k - 1) I / (A c)`

## Publicar en GitHub Pages

Suba todos los archivos a la raíz del repositorio. El paquete ya incluye el
flujo `.github/workflows/deploy.yml`.

Después abra:

`Settings → Pages → Source: GitHub Actions`

La página se publicará automáticamente cuando se guarden cambios en `main`.
