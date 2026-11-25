# Documentación · Segmentación de humedales altoandinos

Sitio web estático (GitHub Pages) que documenta, sin detalles de implementación, cómo funciona el proyecto de
segmentación de humedales altoandinos a partir de imágenes de dron.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Portada: contexto, flujo general, principios y estado |
| `adquisicion.html` | Vuelos, metadatos, resolución en el suelo y registro de campañas |
| `etiquetado.html` | Herramientas de revisión y evolución del pre-etiquetado automático |
| `terreno.html` | Fotogrametría y capas de relieve |
| `modelos.html` | Arquitecturas del benchmark y modelo híbrido propuesto |
| `entrenamiento.html` | Prueba de diseño, fases, receta común y sobreajuste |
| `evaluacion.html` | Predicción por teselas y métricas |
| `estado.html` | Avance y hoja de ruta |
| `glosario.html` | Términos técnicos |
| `assets/` | Estilos, script de navegación e ícono |
| `notas/` | Notas anteriores en Markdown |

La barra lateral y la navegación anterior/siguiente se generan desde `assets/js/sitio.js` (lista `NAV`):
para agregar una página, cópiese una existente y añádase su entrada en esa lista.

El archivo `.nojekyll` hace que GitHub Pages sirva los archivos tal cual, sin procesarlos con Jekyll.
