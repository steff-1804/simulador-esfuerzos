# Publicar el simulador únicamente con GitHub Pages

Este proyecto es completamente estático. No requiere Render, Python, Flask,
base de datos ni servidor adicional.

## 1. Crear el repositorio

1. Ingrese a GitHub.
2. Presione **New repository**.
3. Nombre recomendado: `simulador-esfuerzos`.
4. Seleccione **Public**.
5. Presione **Create repository**.

## 2. Subir los archivos

Suba directamente a la raíz del repositorio:

- `index.html`
- `styles.css`
- `app.js`
- `.nojekyll`
- `404.html`

No suba una carpeta que contenga estos archivos. Los archivos deben verse
directamente al abrir el repositorio.

## 3. Activar GitHub Pages

1. Abra **Settings**.
2. En el menú lateral seleccione **Pages**.
3. En **Build and deployment**, seleccione:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Presione **Save**.

## 4. Dirección esperada

La dirección tendrá esta estructura:

`https://NOMBRE-DE-USUARIO.github.io/simulador-esfuerzos/`

Ejemplo:

`https://steffany123.github.io/simulador-esfuerzos/`

## 5. Actualizaciones

Cada vez que cambie `index.html`, `styles.css` o `app.js` y guarde el cambio en
la rama `main`, GitHub Pages volverá a publicar el sitio.

## Errores frecuentes

### Sale error 404

Verifique que:

- GitHub Pages esté activado.
- La rama seleccionada sea `main`.
- La carpeta seleccionada sea `/ (root)`.
- El archivo se llame exactamente `index.html`.
- Los archivos no estén dentro de otra carpeta.

### No carga el diseño o los cálculos

Los archivos `styles.css` y `app.js` deben estar en la misma ubicación que
`index.html`.
