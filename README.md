# Proyecto Tecnologías Web - Ritmo Cardíaco

## Instrucciones

### 1. Construcción de imágenes y contenedores

- Ubícate en la raíz de la carpeta que clonaste.
- El archivo que nos interesa en este momento es el `docker-compose.yml`. Para poder orquestar los múltiples contenedores como un solo servicio ejecutaremos el siguiente comando:

```bash
docker-compose up -d
```

Cuando finalicen las pruebas para detener los contenedores haremos uso del siguiente comando:

```bash
docker-compose down
```

### 2. Ejecución del simulador

Gracias al `docker-compose.yml` ya no es necesario montar de forma manual el script de Python ni los puertos a utilizar, por lo que solo nos interesará en este momento ingresar al contenedor específico con MQTT y Python, para ello haremos los siguientes pasos:

1. Visualizar los contenedores, con el siguiente comando:
   ```bash
   docker ps -a
   ```

2. El `docker-compose.yml` crea 3 contenedores, el que nos interesa es el que tiene el nombre de `proyecto-mosquitto`, ingresaremos a él mediante el siguiente comando:
   ```bash
   docker exec -it id_contenedor sh
   ```

3. Una vez dentro, iremos a la carpeta `app` mediante:
   ```bash
   cd app
   ```

4. Encontremos el script de python, lo podemos comprobar con el comando:
   ```bash
   ls
   ```

5. Para ejecutar el simulador, primero tendremos que pasarle un argumento. En este caso, nos servirá para poder identificar cada ejecución de script y asignarle un nombre al reloj de simulación. Lo ejecutaremos de la siguiente manera:
   ```bash
   python simulador_reloj.py nombre_del_reloj
   ```

   `nombre_del_reloj` es el argumento específico, así que puedes ponerle el nombre que tú quieras como:
   - `reloj1`
   - `apple_watch`
   - `galaxy_watch6`

Para poder tener n número de relojes, podemos repetir desde el paso 2 de la instrucción 2 con un nombre diferente de reloj.

### 3. Visualizar datos

Verás que el script empieza a mostrar información en formato JSON en la terminal. La cual está siendo enviada a dos puntos importantes al broker para que puedan visualizarla aquellos que estén suscritos y a una API con el método POST para poder ser almacenada en una base de datos.

En nuestro caso, tenemos 2 clientes web que están suscritos al topic, para visualizarlo, simplemente iremos a las carpetas `cliente_dashboard`, `cliente_reloj` y abrir sus respectivos `index.html` y se empezará a mostrar la información una vez hayas seleccionado un dispositivo de la lista.

Para el consumo de la API y mostrar los datos almacenados ingresaremos a la carpeta `cliente_api`, y abriremos su correspondiente `index.html`, la cual ya estará consumiendo la API.

## Funcionamiento Interno

### ¿Cómo funciona?

Ante la complejidad de orquestar múltiples elementos, se optó por usar un `docker-compose` ya que permite definir y gestionar múltiples contenedores Docker como un solo servicio, en nuestro caso contamos con 3 los cuales cumplen las siguientes funciones:

- **Mosquitto con Python**: Ejecuta el Simulador del reloj y la información la envía a los topics con Mosquitto.
- **MySQL**: Para almacenar la información generada por el simulador del reloj en una base de datos mediante la API.
- **PHP con mysqli**: Utilizado para levantar un servicio web y así poder acceder a la API y hacer las consultas establecidas internas de la API.

La división de responsabilidades es de suma importancia, realizar lo anterior con un solo contenedor habría dificultado su gestión, ya que al fallar algo todos los demás también se verían afectados.

Es importante aclarar que el `docker-compose.yml` ocupa Dockerfiles (`dockerfile.php`, `dockerfile.mosquitto`) que personalizamos para poder tener todo el stack tecnológico necesario para su funcionamiento dentro de contenedores, no es necesario ejecutar cada dockerfile de forma individual, esto ya lo hace automáticamente el `docker-compose.yml`.

De forma resumida hace lo siguiente:

#### Servicios:

**mosquitto**
Broker MQTT basado en Eclipse Mosquitto, con configuración personalizada y un script Python que simula un reloj inteligente publicando ritmo cardíaco.
Dentro del script de python utilizamos la librería request, la cual nos permitirá realizar operaciones http, en este caso un post a la API.

**mysql_db**
Base de datos MySQL que almacena los datos de la API. Se inicializa con un script SQL (`init.sql`) y mantiene persistencia con un volumen.

En nuestro caso tenemos a dos usuarios, uno declarado explícitamente en el docker-compose:
* Usuario: root, Contraseña: root_password_seguro
* Usuario: usuario_api, Contraseña: password_usuario_api

Si desea visualizar los datos almacenados directamente desde el contenedor, es necesario ingresar el siguiente comando:
```bash
docker exec -it mysql_db mysql -u {usuario} -p
```
En `{usuario}` debe ser uno de los se enlistaron con anterioridad. 

Inmediatamente, se le solicitará ingresar la contraseña correspondiente dependiendo del usuario.

Una vez dentro, podrá ingresar el comando `SHOW DATABASES` y verá creada la BD declarada en el docker-compose con el nombre basedatos_api.

Posteriormente ingresa `USE basedatos_api` y `SHOW TABLES`, la tabla generada es a partir del archivo init.sql el cual es montado en la ruta `/docker-entrypoint-initdb.d/init.sql` dentro del contenedor, la cual es datos_relojes, posteriormente haz un `SELECT * FROM datos_relojes` para mostrar todos los datos.

**¿Qué sucede ahí?**
Cuando usas una imagen oficial de MySQL, durante la creación inicial del contenedor (es decir, cuando la base de datos aún no existe), cualquier archivo .sql o .sh en la carpeta `/docker-entrypoint-initdb.d/` se ejecuta automáticamente. En nuestro caso, ocupamos una imagen oficial. El archivo init.sql, solo se ejecutará una vez.

**¿Y la persistencia?**
En el archivo Docker-compose.yml creamos un volumen (una forma de guardar datos de manera persistente fuera del contenedor[named volumes]) - `mysql_data:/var/lib/mysql`, en este caso:
almacena los datos de la base de datos fuera del contenedor, para que no se pierdan si el contenedor se reinicia o elimina.

`/var/lib/mysql` es donde MySQL guarda sus archivos de base de datos dentro del contenedor.

`mysql_data` es un volumen Docker que se crea automáticamente si no existe.

**api_php**
Servidor PHP que ejecuta una API REST (ubicada en `API_RitmoCardiaco`) en el puerto 5000, conectándose a la base de datos.
En el docker-compose declaramos el siguiente comando `php -S 0.0.0.0:5000 -t /var/www/html`, el cual lanza un servidor embebido el cual escucha en todas las interfaces para poder acceder desde dentro de los contenedores o fuera de ellos y establecemos la ruta en la cual fueron montados los archivos de la api del host al contenedor. De igual forma, se hace un mapeo del host al contenedor, siendo este el mismo para poder consumir la API desde el host.

#### Red y Volúmenes:

Todos los servicios comparten una red interna `mqtt_network` para comunicarse entre sí por nombre de contenedor.

Se utiliza el volumen `mysql_data` para conservar los datos de MySQL.

## Estructura de carpetas

Nos encontraremos con 4 carpetas diferentes cada una con diferentes responsabilidades:

- **API_RitmoCardiaco**: Contiene toda la lógica de la API, además de un archivo `index.html` en la raíz para pruebas con los métodos POST y GET.

- **cliente_api**: Contiene toda la lógica y la interfaz de un cliente web que consume la API mediante el endpoint `http://localhost:5000/api/ritmo` con el método GET.

  Opcionalmente, podemos ocupar Postman o CURL para consultar a la API desde el host, ya que hacemos un mapeo del puerto 5000:5000 del host y del contenedor de php con mysqli haciendo lo anterior posible:
  
  **CURL:**
  ```bash
  curl http://localhost:5000/api/ritmo
  ```
  
  **POSTMAN:**
  - Método: GET
  - Endpoint: `http://localhost:5000/api/ritmo`

  Obtendremos una respuesta en JSON con el siguiente formato:
  ```json
  {
      "id": 43,
      "dispositivo": "apple_watch",
      "ritmo": {
          "valor": 119,
          "unidad": "bpm"
      },
      "timestamp": 1749494290
  }
  ```

- **cliente_dashboard**: Contiene toda la lógica y la interfaz para ver en tiempo real los datos generados por el simulador reloj, utilizando websockets.

- **cliente_reloj**: Contiene toda la lógica y la interfaz para poder visualizar el ritmo cardíaco de un reloj específico y las alertas enviadas desde el `cliente_dashboard`, además de poder responder a estas mismas.