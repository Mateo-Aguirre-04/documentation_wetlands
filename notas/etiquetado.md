# Etiquetado

Como parte de la Iniciativa de Conservación Basada en Datos VLIR-TEAM para la Reserva Natural Antisana, se desarrolló un marco automatizado de procesamiento de imágenes diseñado para caracterizar y monitorear los ecosistemas de humedales altoandinos a partir de fotografías tomadas por vehículos aéreos no tripulados. Este marco de trabajo se validó en el humedal de Pugllohuma, el cual se seleccionó como el sitio de prueba inicial del proyecto previo a su despliegue a gran escala en los sistemas de humedales de la Reserva Ecológica Antisana durante la segunda fase de la investigación.

El flujo de trabajo diseñado integró cuatro etapas fundamentales que abarcaron la anotación automática de los humedales en las imágenes, la segmentación de las áreas de interés, el filtrado para la reducción de ruido y la posterior clasificación y detección. En esta última fase, se probó y evaluó un modelo de red neuronal de reconocimiento de imágenes basado en la arquitectura UNet, el cual fue entrenado para identificar los límites del humedal, las características de la superficie y la estimación del volumen de líquido. Esta arquitectura por etapas permitió verificar de manera independiente cada componente frente a datos reales de campo antes de escalar el sistema a conjuntos de datos más extensos y heterogéneos.

Para llevar a cabo la evaluación del sistema, se estructuró un conjunto de datos compuesto por 150 imágenes, cuyas regiones de humedal fueron etiquetadas mediante un proceso híbrido que combinó el pre-etiquetado automático asistido por el modelo con la posterior corrección manual, logrando optimizar tanto el rendimiento del etiquetado como la precisión en la definición de los bordes. Toda la imaginería fue adquirida a lo largo de múltiples campañas de vuelos de prueba utilizando plataformas aéreas de transición VTOL de despegue y aterrizaje vertical, vinculando de forma directa el procesamiento de datos con las operaciones de vuelo ejecutadas en Pugllohuma y Antisana. El objetivo principal de esta etapa consistió en validar plenamente la precisión y robustez del marco de trabajo sobre el conjunto de datos recopilado, garantizando que el proceso desde la segmentación hasta la detección estuviera listo para su uso operativo antes de iniciar la adquisición masiva de imágenes sobre la reserva natural.

# Prerequisitos

- WSL (Obligatorio)

- Visual Studio Code (Opcional)

# Requisitos

- Docker
- Xlaunch
- Python

## Instalación

### Docker

Con el docker instalado se procede a hacer lo siguiente:

**1. Iniciar un contenedor interactivo con la base de NVIDIA APROX (30-40GB)**

Ejecuta en PowerShell:

PowerShell

```
docker run -it --gpus all --name temporal nvidia/cuda:12.1.1-cudnn8-devel-ubuntu22.04 /bin/bash
```

Docker descargará la imagen oficial y te dejará directamente dentro del contenedor (`root@<id>:/#`).

**2. Instalar las dependencias y Miniconda dentro del contenedor**

Pega estos comandos dentro de la consola de Linux del contenedor:

Bash

```
# Actualizar repositorios e instalar paquetes básicos
apt-get update && apt-get install -y wget git bzip2 libgl1 libglib2.0-0 ca-certificates

# Descargar e instalar Miniconda silenciosamente
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh
bash /tmp/miniconda.sh -b -p /root/miniconda3
rm /tmp/miniconda.sh

# Cargar conda al path del entorno actual y activarlo
export PATH="/root/miniconda3/bin:$PATH"
/root/miniconda3/bin/conda init bash
source ~/.bashrc
```

Si quieres instalar PyTorch, OpenCV o tus librerías aquí mismo, puedes hacerlo ahora con `conda install` o `pip install`. Cuando termines, sal del contenedor escribiendo:

Bash

```
exit
```

**3. Guardar el contenedor como tu nueva imagen (`docker commit`)**

En tu ventana habitual de PowerShell (fuera del contenedor), ejecuta:

PowerShell

```
docker commit temporal yolo_cuda_conda
```

Para verificar que ya existe, ejecuta `docker images` y verás `yolo_cuda_conda` en la lista.

**4. Limpiar el temporal y correr tu entorno definitivo**

Elimina el contenedor temporal:

PowerShell

```
docker rm temporal
```

Ahora ya puedes ejecutar tu comando original de montaje de volumen sin errores:

PowerShell

```
docker run -it --gpus all --name unet `
  -v "C:/Users/"TU-USUARIO"/Documents/Unet_humedales:/app" `
  -w /app `
  yolo_cuda_conda /bin/bash
```

## Librerias

Una vez se haya ejecutado lo ultimo y se este dentro del contenedor instalar las siguientes librerias

```jsx
apt update && apt install -y \
    libegl1 \
    libgl1 \
    libfontconfig1 \
    libdbus-1-3 \
    libglib2.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcb-cursor0 \
    libxcb-icccm4 \
    libxcb-image0 \
    libxcb-keysyms1 \
    libxcb-render-util0 \
    libxcb-shape0 \
    libxcb-xinerama0 \
    libxcb-xkb1 \
    libxkbcommon0 \
    libxkbcommon-x11-0\
    rasterio
    
pip install "numpy<2" --force-reinstall
pip install tensorflow
apt-get install -y libgl1-mesa-glx libglib2.0-0
pip install opencv-python-headless
pip install -r requirements.txt
pip install seaborn 
```

## XLaunch

Sin esto no se podra hacer la parte visual del etiquetado ya que al trabajar con wsl no lo permite

### Instala XLaunch en Windows

[VcXsrv / XLaunch](https://sourceforge.net/projects/vcxsrv/?utm_source=chatgpt.com)

Al iniciar XLaunch, selecciona:

1. **Multiple windows**
2. **Start no client**
3. En opciones adicionales marca **Disable access control**
4. Finaliza.

(El XLaunch no aparecera en barra de tareas sin embargo se esta ejecutando en segundo plano, se debe hacer este proceso de abrirlo cada vez que se apague el equipo o se lo reinicie ya que se cerrará)

Finalmente para la ultima configuracion se debe verificar el DISPLAY dentro del contenedor.

En el contenedor correr:
`echo "DISPLAY=$DISPLAY"`

Si `echo $DISPLAY` devuelve vacío, por ejemplo:

```
DISPLAY=
```

Hacer lo siguiente con XLaunch abierto:

```
export DISPLAY=host.docker.internal:0.0
echo $DISPLAY
python etiquetado_unet.py
```

# Descripción del proceso de autoetiquetado y corrección de imágenes

El proceso de etiquetado de las imágenes se divide en dos etapas principales. La primera corresponde al **autoetiquetado**, donde el programa analiza automáticamente cada imagen y genera una primera máscara de las zonas que pueden corresponder a un humedal. La segunda etapa corresponde a la **revisión y corrección manual**, donde se revisan los resultados generados automáticamente y se corrigen las partes que no fueron identificadas correctamente.

El objetivo de este proceso es reducir la cantidad de trabajo manual necesario para preparar las imágenes que posteriormente serán utilizadas para entrenar el modelo de segmentación.

---

## 1. Entrada de las imágenes

El proceso comienza con las imágenes obtenidas mediante el dron. Estas imágenes se encuentran almacenadas en una carpeta y pueden estar en formatos como `.TIF`, `.TIFF`, `.JPG`, `.JPEG` o `.PNG`.

El programa toma cada imagen y la procesa individualmente. Para mantener organizado el trabajo, los resultados se almacenan en diferentes carpetas.

De forma general, se tiene una estructura similar a:

```
Dataset_Metadatos/
├── images/
├── masks/
├── overlays/
└── metadata/
```

La carpeta `images` contiene las imágenes originales.

La carpeta `masks` contiene las máscaras generadas para cada imagen.

La carpeta `overlays` contiene imágenes que permiten visualizar la imagen original junto con la máscara generada, lo que facilita revisar si el resultado es correcto.

La carpeta `metadata` contiene información utilizada para mantener el control del proceso.

---

# 2. Primera etapa: Autoetiquetado

La primera etapa corresponde al programa de **autoetiquetado**. Su función es analizar automáticamente cada imagen y buscar zonas que puedan corresponder a un humedal.

Para realizar este proceso se utiliza **SAM 2**, que permite generar una máscara a partir de diferentes puntos y regiones proporcionadas por el programa.

El proceso no consiste simplemente en enviar toda la imagen a SAM 2. Antes de utilizarlo, el programa realiza varios pasos para encontrar posibles zonas de interés.

---

## 2.1. Detección de posibles zonas de humedal

Primero, el programa analiza la imagen y busca diferentes regiones que puedan corresponder a un humedal.

Estas regiones se consideran **candidatos**. Un candidato representa una zona que posiblemente pertenece al área que se desea etiquetar.

No todos los candidatos son necesariamente correctos. Por esta razón, el programa aplica ciertos filtros para eliminar regiones demasiado pequeñas o que no cumplen con las condiciones establecidas.

El resultado de esta etapa es un conjunto de posibles zonas que serán analizadas posteriormente.

---

## 2.2. Generación de puntos

Una vez identificados los candidatos, el programa genera diferentes puntos dentro de cada región.

Estos puntos sirven para indicarle a SAM 2 qué parte de la imagen debe analizar.

Dependiendo de la región encontrada, se pueden utilizar varios puntos para representar mejor el área candidata.

Además de los puntos, se utiliza la región que contiene al candidato para limitar el área que se está analizando.

De esta manera, SAM 2 recibe información sobre **dónde se encuentra la posible zona de humedal**.

---

## 2.3. Generación de la máscara con SAM 2

Después de obtener los puntos y la región candidata, estos datos se utilizan para realizar la predicción con SAM 2.

SAM 2 puede generar diferentes máscaras para una misma región. Cada una representa una posible interpretación de la zona seleccionada.

El programa analiza estas opciones y selecciona la máscara que considera más adecuada para el candidato.

Este proceso se repite para las diferentes regiones encontradas en la imagen.

---

## 2.4. Unión de las máscaras

Cuando se han procesado todos los candidatos, las máscaras obtenidas se unen en una sola máscara correspondiente a la imagen.

En esta máscara se utiliza:

- `0` para representar el fondo.
- `1` para representar la zona identificada como humedal.

De esta manera se obtiene una primera versión de la etiqueta de la imagen completa.

---

## 2.5. Limpieza de la máscara

Después de generar las máscaras, el programa realiza un proceso de limpieza para evitar que algunas regiones pequeñas o no deseadas formen parte de la etiqueta final.

Este paso permite obtener una máscara más ordenada antes de guardarla.

Sin embargo, esta limpieza no garantiza que todas las regiones sean perfectas. Pueden existir zonas que fueron incluidas cuando no debían serlo o zonas de humedal que no fueron detectadas.

Por esta razón, el resultado del autoetiquetado se considera una **primera versión de la etiqueta** y no necesariamente la versión definitiva.

---

## 2.6. Guardado de los resultados

Una vez terminado el procesamiento de una imagen, el programa guarda los resultados.

La máscara se almacena en la carpeta correspondiente y mantiene la información necesaria de la imagen original.

También se genera una imagen de visualización o `overlay`, donde se puede observar la imagen original junto con la zona que fue etiquetada.

Esto permite revisar rápidamente el resultado obtenido.

---

## 2.7. Control del progreso

El programa también mantiene un registro de las imágenes que ya fueron procesadas.

Para esto utiliza un archivo de progreso, como:

```
progress_sam.json
```

Este archivo permite saber qué imágenes ya fueron procesadas.

Por ejemplo, si el programa se detiene después de procesar varias imágenes, al volver a ejecutarlo puede continuar con las imágenes pendientes en lugar de comenzar nuevamente desde el principio.

Esto resulta especialmente útil cuando se trabaja con una gran cantidad de imágenes.

---

# 3. Resultado del autoetiquetado

Al terminar la primera etapa, cada imagen procesada puede tener:

```
Imagen original
      ↓
Máscara automática
      ↓
Overlay para revisión
```

La máscara automática ya contiene una primera identificación de las zonas de humedal.

Sin embargo, el autoetiquetado puede presentar algunos errores.

Por ejemplo:

- Puede etiquetar una zona que no pertenece al humedal.
- Puede dejar fuera una parte del humedal.
- Puede generar una máscara más grande o más pequeña de lo necesario.
- Puede incluir pequeñas regiones que no deberían formar parte de la etiqueta.
- Puede separar una zona que en realidad pertenece a una misma región.

Por este motivo, las máscaras generadas automáticamente pasan a una segunda etapa de revisión.

---

# 4. Segunda etapa: Revisión y corrección manual

La segunda etapa utiliza un programa con una interfaz gráfica que permite revisar las máscaras generadas por el autoetiquetado.

En lugar de comenzar nuevamente desde una imagen sin etiquetar, el programa carga la máscara que ya fue generada automáticamente.

Esto permite que el usuario solamente tenga que corregir las partes que presentan problemas.

El objetivo de esta etapa es convertir la máscara automática en una **máscara final revisada**.

---

## 4.1. Carga de la imagen

El usuario selecciona una imagen del conjunto de datos.

El programa carga:

- La imagen original.
- La máscara existente, si ya fue generada.
- La información necesaria para realizar nuevas predicciones.

La máscara existente se muestra sobre la imagen para que el usuario pueda observar qué partes fueron etiquetadas automáticamente.

---

## 4.2. Revisión de la máscara

El usuario revisa visualmente la máscara generada.

En esta etapa puede ocurrir que la etiqueta automática sea correcta en algunas partes, pero incorrecta en otras.

Por ejemplo:

```
        Autoetiquetado
              ↓
       ┌─────────────┐
       │ Zona correcta│
       │      +       │
       │ Zona incorrecta
       └─────────────┘
              ↓
        Revisión manual
```

La persona encargada del etiquetado determina qué regiones necesitan ser corregidas.

---

# 5. Corrección mediante puntos

Cuando una zona no fue etiquetada correctamente, el usuario puede colocar puntos sobre la imagen.

Estos puntos indican al programa qué región se desea agregar o corregir.

Al colocar los puntos, nuevamente se utiliza SAM 2 para generar una máscara correspondiente a la zona seleccionada.

Esto permite corregir una región sin tener que dibujar manualmente toda la forma del humedal.

El usuario puede revisar la nueva máscara generada y comprobar si corresponde a la zona que desea agregar.

---

# 6. Corrección de regiones incorrectas

El programa también permite eliminar regiones que fueron etiquetadas automáticamente pero que no pertenecen al humedal.

De esta manera, la corrección manual puede realizarse en ambos sentidos:

```
          Máscara automática
                  ↓
        ┌─────────┴─────────┐
        ↓                   ↓
Agregar zonas          Eliminar zonas
que faltan             incorrectas
        ↓                   ↓
        └─────────┬─────────┘
                  ↓
            Máscara corregida
```

Por lo tanto, el usuario no solamente puede agregar nuevas regiones, sino también eliminar aquellas que fueron detectadas incorrectamente.

---

# 7. Integración de las correcciones

Cuando el usuario realiza una corrección, la nueva región generada se combina con la máscara que ya existía.

Esto permite conservar las partes que estaban correctamente etiquetadas y modificar únicamente las zonas que necesitaban cambios.

El proceso puede entenderse de la siguiente manera:

```
Máscara automática
        +
Correcciones realizadas
        ↓
Máscara final
```

De esta forma no es necesario volver a realizar todo el proceso de autoetiquetado.

---

# 8. Guardado de la máscara final

Cuando el usuario termina de revisar una imagen, puede guardar los cambios.

El programa genera nuevamente la máscara final y la almacena junto con la información correspondiente a la imagen.

También se genera un nuevo `overlay`, que permite comprobar visualmente cómo quedó la etiqueta después de las correcciones.

La imagen queda entonces preparada para continuar con el proceso de creación del conjunto de datos.

---

# 9. Control del conjunto de imágenes

El programa manual también mantiene información sobre las imágenes que ya fueron revisadas.

Esto permite conocer cuáles imágenes ya fueron corregidas y cuáles todavía están pendientes.

Además, el programa permite eliminar una imagen y sus archivos relacionados cuando es necesario volver a procesarla.

Esto facilita mantener organizado el conjunto de datos durante todo el proceso de etiquetado.

---

# 10. Flujo completo del proceso

El proceso completo puede resumirse de la siguiente manera:

```
                  IMÁGENES DEL DRON
                         ↓
                 AUTOETIQUETADO
                         ↓
              Detección de candidatos
                         ↓
                Generación de puntos
                         ↓
                       SAM 2
                         ↓
               Generación de máscaras
                         ↓
                Unión y limpieza
                         ↓
              MÁSCARA AUTOMÁTICA
                         ↓
                  REVISIÓN MANUAL
                         ↓
              ¿La máscara es correcta?
                  SI             NO
                  ↓               ↓
             Se conserva     Se realizan
                              correcciones
                                  ↓
                         Nuevos puntos / borrar
                                  ↓
                               SAM 2
                                  ↓
                         Máscara corregida
                                  ↓
                         MÁSCARA FINAL
                                  ↓
                             GUARDADO
```

---

# 11. Función de cada etapa

Las dos etapas tienen funciones diferentes.

### Autoetiquetado

Su objetivo principal es **generar rápidamente una primera etiqueta para cada imagen**.

En esta etapa se busca reducir el trabajo que tendría que realizar una persona si tuviera que identificar manualmente cada zona de humedal.

### Corrección manual

Su objetivo es **revisar y mejorar las etiquetas generadas automáticamente**.

Esta etapa es necesaria porque el autoetiquetado puede cometer errores o no identificar completamente algunas zonas.

De esta manera, la persona encargada no tiene que crear la máscara desde cero, sino que trabaja sobre una etiqueta que ya fue generada.

---

# 12. Resultado final

Al terminar ambas etapas, se obtiene un conjunto de imágenes acompañado por sus máscaras revisadas.

El proceso puede resumirse como:

```
Imagen original
      ↓
Autoetiquetado con SAM 2
      ↓
Máscara automática
      ↓
Revisión humana
      ↓
Corrección de errores
      ↓
Máscara final
      ↓
Conjunto de datos para entrenamiento
```

La idea principal del sistema es combinar el procesamiento automático con la revisión humana. El autoetiquetado permite avanzar rápidamente con una gran cantidad de imágenes, mientras que la revisión manual permite corregir los errores que puedan aparecer.

Por lo tanto, el resultado final no depende únicamente de la predicción automática. Cada máscara puede ser revisada y corregida antes de utilizarse como parte del conjunto de datos para entrenar el modelo de segmentación.