# Red segmentación

# Pipeline de procesamiento y segmentación de imágenes de humedales

## 1. Descripción general

El objetivo de este proceso es entrenar una red neuronal capaz de identificar automáticamente la zona correspondiente al agua dentro de las imágenes de los humedales.

Para realizar la segmentación se utilizan dos elementos principales:

- La imagen original del humedal.
- Una máscara que indica qué partes de la imagen corresponden al agua.

En esta etapa del proyecto solamente se utiliza la información RGB de las imágenes y las máscaras. El código contiene funciones para trabajar con profundidad y DSM, pero actualmente estas funciones están desactivadas y no intervienen en el entrenamiento.

El proceso general es:

**Imagen RGB → preparación → división de datos → red neuronal → predicción de máscara → comparación con la máscara real → actualización del modelo.**

---

## 2. Organización de las imágenes y máscaras

El programa trabaja con dos carpetas principales:

- `dataset/images`: contiene las imágenes que serán utilizadas para entrenar y validar el modelo.
- `dataset/masks`: contiene las máscaras correspondientes a cada imagen.

Cada imagen debe tener una máscara asociada. El programa busca la máscara utilizando el mismo nombre de la imagen y agregando `_mask`.

Por ejemplo:

```
dataset/images/
    imagen_001.JPG
    imagen_002.JPG
    imagen_003.JPG

dataset/masks/
    imagen_001_mask.tif
    imagen_002_mask.tif
    imagen_003_mask.tif
```

De esta manera, `imagen_001.JPG` se relaciona directamente con `imagen_001_mask.tif`.

El programa revisa todas las imágenes de la carpeta y solamente utiliza aquellas que tienen su máscara correspondiente. Si no existe la máscara, esa imagen no se incorpora al conjunto de datos.

Al finalizar esta etapa se obtiene una lista de pares:

```
(imagen, máscara)
```

Esto permite que durante el entrenamiento el modelo siempre reciba una imagen y conozca cuál debería ser la segmentación correcta.

---

## 3. Lectura de la imagen

Cada imagen se carga utilizando OpenCV.

Primero se obtiene la imagen RGB y después se convierte a un formato que pueda utilizar la red neuronal.

El proceso es:

1. Se abre la imagen.
2. Se corrige el orden de los canales de color.
3. Se cambia su tamaño a `512 × 512` píxeles.
4. Se normalizan los valores de los píxeles entre `0` y `1`.
5. Finalmente, la imagen se convierte al formato utilizado por PyTorch.

El tamaño utilizado actualmente para cada muestra es de:

**512 × 512 píxeles.**

La configuración del programa establece este tamaño mediante `patch_size=512`.

---

## 4. Preparación de la máscara

La máscara contiene la información que indica dónde se encuentra el agua.

La máscara se lee como una imagen independiente y posteriormente se convierte en una máscara binaria:

- `0` representa el fondo o zonas que no corresponden al agua.
- `1` representa la zona identificada como agua.

El código realiza esta conversión comprobando si el valor de cada píxel de la máscara es mayor que cero.

Después, la máscara se redimensiona a `512 × 512` píxeles utilizando un método que mantiene los valores de las clases sin generar nuevos valores intermedios.

De esta forma, la red recibe una imagen de entrada y una máscara que representa la respuesta correcta que debe aprender.

---

## 5. Aumento de datos

Antes de utilizar las imágenes para entrenar, se pueden realizar algunos cambios para generar variaciones de las mismas imágenes.

Actualmente el aumento de datos está activado.

Entre las modificaciones utilizadas se encuentran:

- Volteo horizontal.
- Volteo vertical.

Estas modificaciones se realizan tanto sobre la imagen como sobre su máscara. Esto es importante porque si una imagen cambia de posición, la máscara debe cambiar exactamente de la misma manera.

El objetivo es evitar que el modelo aprenda únicamente una determinada orientación de los humedales y ayudarlo a reconocer el agua aunque la imagen tenga una orientación diferente.

El código también contiene funciones para realizar rotaciones, cambios de brillo, contraste y ruido, aunque el flujo principal del `Dataset` utiliza directamente las transformaciones básicas definidas en su carga de datos.

---

## 6. División de las imágenes

Una vez encontrados todos los pares de imagen y máscara, el conjunto de datos se divide en dos partes:

- **80 % para entrenamiento.**
- **20 % para validación.**

Actualmente no se utiliza un conjunto de prueba separado, ya que `test_ratio` está establecido en `0`.

Antes de realizar la división, las muestras se mezclan aleatoriamente. Esto evita que todas las imágenes de un determinado orden queden juntas en una sola parte del conjunto de datos.

Por ejemplo, si existen 100 pares de imágenes y máscaras:

```
80 pares → entrenamiento
20 pares → validación
```

Esta división permite utilizar una parte de las imágenes para que la red aprenda y otra parte para comprobar cómo funciona con imágenes que no utilizó directamente durante el entrenamiento.

La configuración final del programa establece `train_ratio=0.8`, `val_ratio=0.2` y `test_ratio=0.0`.

---

## 7. Entrada de la red neuronal

Una vez preparadas las imágenes, estas se entregan a la red neuronal.

La entrada principal es únicamente la imagen RGB:

```
RGB
 ↓
ResNet50
 ↓
FPN
 ↓
CBAM
 ↓
Transformer
 ↓
U-Net Decoder
 ↓
Segmentation Head
 ↓
Máscara predicha
```

Aunque la arquitectura tiene elementos adicionales, el objetivo de todos ellos en esta etapa es obtener información suficiente de la imagen para determinar qué píxeles pertenecen al agua.

---

## 8. Extracción de información de la imagen

La primera parte de la red utiliza **ResNet50**.

Esta parte recibe la imagen RGB y extrae diferentes características de ella. En las primeras capas se identifican elementos más sencillos, mientras que en capas posteriores se obtiene información más relacionada con las formas y características generales de la imagen.

El modelo utiliza una versión preentrenada de ResNet50, por lo que parte de unos pesos que ya contienen información aprendida previamente sobre imágenes.

En este proyecto, ResNet50 recibe tres canales correspondientes a la imagen RGB.

---

## 9. FPN

Después de ResNet50 se utiliza una estructura llamada FPN.

Su función principal es combinar información obtenida a diferentes tamaños.

Esto resulta útil para la segmentación porque el agua puede aparecer en diferentes tamaños dentro de una imagen. Algunas características pueden necesitar información de zonas pequeñas y otras pueden necesitar información de una región más amplia.

La FPN recibe las características obtenidas por ResNet50 y genera varias representaciones de la imagen que posteriormente continúan hacia las siguientes partes de la red.

---

## 10. CBAM

Después de obtener estas características se utiliza CBAM.

De manera sencilla, este módulo ayuda a la red a prestar mayor atención a la información que puede ser importante para realizar la segmentación.

El módulo considera dos aspectos:

- Qué características son más importantes.
- En qué zonas de la imagen se encuentra información relevante.

En el código, CBAM se aplica sobre las características obtenidas en las diferentes escalas antes de enviarlas al resto de la red.

---

## 11. Transformer

Posteriormente las características pasan por un módulo Transformer.

En este proyecto se utiliza para analizar relaciones entre diferentes partes de la imagen.

Esto permite que la red no dependa únicamente de información localizada en una pequeña zona, sino que pueda relacionar diferentes regiones de la imagen antes de realizar la segmentación.

El Transformer se encuentra en la parte central de la red, antes del decodificador U-Net.

---

## 12. Decoder U-Net

Después de procesar la información, la red debe volver a construir una imagen con una resolución cercana a la original.

Para esto se utiliza un decoder basado en U-Net.

El decoder va aumentando progresivamente el tamaño de las características y recuperando información obtenida anteriormente por el encoder.

En el código se utilizan tres bloques principales del decoder:

```
Bottleneck
   ↓
Decoder 3
   ↓
Decoder 2
   ↓
Decoder 1
   ↓
Upsampling final
```

La idea es recuperar información espacial suficiente para que la predicción final pueda indicar qué píxeles corresponden al agua.

---

## 13. Generación de la máscara predicha

Al final del decoder se encuentra la **Segmentation Head**.

Esta parte recibe las características procesadas por la red y genera una salida de un solo canal.

Ese canal representa la predicción de la red para cada píxel de la imagen.

En otras palabras:

```
Imagen RGB
     ↓
Red neuronal
     ↓
Predicción
     ↓
1 valor por píxel
     ↓
Máscara de agua
```

La salida todavía no es directamente una máscara binaria. Primero representa la probabilidad o confianza de que cada píxel pertenezca a la clase agua.

El código utiliza posteriormente una función sigmoide para convertir esta salida en valores entre `0` y `1`.

---

## 14. Comparación con la máscara real

Durante el entrenamiento, la máscara generada por la red se compara con la máscara real proporcionada en el dataset.

Para esto se utiliza una función de pérdida formada por dos partes:

- **BCE (Binary Cross Entropy).**
- **Dice Loss.**

La BCE permite medir qué tan diferentes son las predicciones píxel por píxel.

La Dice Loss ayuda a medir qué tanto coinciden las zonas segmentadas por el modelo con las zonas de agua de la máscara real.

La pérdida final corresponde a:

```
Pérdida total = BCE + Dice Loss
```

Esta pérdida es la información que utiliza el modelo para saber qué tan correcta fue su predicción y modificar sus parámetros durante el entrenamiento.

---

## 15. Entrenamiento

El entrenamiento se realiza por épocas.

En cada época se siguen aproximadamente estos pasos:

```
1. Cargar un grupo de imágenes y máscaras.
2. Enviar las imágenes a la red.
3. Obtener las máscaras predichas.
4. Comparar las predicciones con las máscaras reales.
5. Calcular la pérdida.
6. Ajustar los parámetros de la red.
7. Repetir el proceso con las siguientes imágenes.
8. Al terminar la época, validar el modelo.
```

El tamaño del grupo utilizado actualmente es de 4 imágenes por lote (`batch_size=4`).

El modelo tiene configuradas hasta 200 épocas de entrenamiento, aunque el proceso puede detenerse antes si la validación deja de mejorar durante el número de épocas establecido.

La configuración utilizada actualmente establece 200 épocas y un `batch_size` de 4.

---

## 16. Validación

Después de cada época de entrenamiento, el modelo se prueba con las imágenes que fueron separadas para validación.

Estas imágenes no se utilizan para actualizar directamente los parámetros del modelo.

El objetivo es comprobar si el modelo está aprendiendo a segmentar correctamente imágenes que no utilizó durante el entrenamiento.

Para la segmentación se calculan principalmente:

- **IoU:** mide cuánto coinciden la predicción y la máscara real.
- **Dice:** mide la coincidencia entre ambas máscaras.
- **Precision:** indica qué proporción de las zonas predichas como agua realmente corresponde al agua.
- **Recall:** indica qué proporción del agua real consiguió detectar el modelo.
- **F1:** combina precision y recall.

El código calcula estas métricas utilizando un umbral de `0.5` para convertir la predicción en una máscara binaria.

---

## 17. Guardado del modelo

Durante el entrenamiento se guardan checkpoints del modelo.

Esto permite conservar el estado del entrenamiento y posteriormente cargar un modelo guardado.

Al finalizar el entrenamiento, el código busca el archivo:

```
output/checkpoints/best_model.pth
```

Si existe, se carga ese modelo para realizar la evaluación y generar las visualizaciones finales.

---

## 18. Resultado final

El resultado principal de esta etapa es una máscara de segmentación que indica qué zonas de la imagen fueron identificadas como agua.

El flujo completo queda resumido de la siguiente manera:

```
                    IMAGEN RGB
                         │
                         ▼
              Comprobación de imagen
                         │
                         ▼
                 Redimensionar
                    512 × 512
                         │
                         ▼
                  Normalización
                         │
                         ▼
                 Aumento de datos
                         │
                         ▼
                    ResNet50
                         │
                         ▼
                       FPN
                         │
                         ▼
                      CBAM
                         │
                         ▼
                   Transformer
                         │
                         ▼
                  U-Net Decoder
                         │
                         ▼
                Segmentation Head
                         │
                         ▼
                Máscara predicha
                         │
                         ▼
             Comparación con máscara
                    de referencia
                         │
                         ▼
                  BCE + Dice Loss
                         │
                         ▼
              Actualización del modelo
```

De esta manera, el sistema parte de una fotografía RGB y aprende progresivamente a distinguir la zona correspondiente al agua. Las máscaras utilizadas durante el entrenamiento sirven como referencia para que el modelo pueda aprender qué características de las imágenes están relacionadas con la presencia del humedal.

En esta versión, el objetivo está limitado a la **segmentación del agua**. Las funciones relacionadas con profundidad, DSM y otras modalidades se mantienen dentro del código como parte de una arquitectura que puede ampliarse posteriormente, pero no intervienen en el entrenamiento actual.