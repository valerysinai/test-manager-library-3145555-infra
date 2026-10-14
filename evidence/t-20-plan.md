# Plan previo · T-20, despliegue integrado

Rama feature/infra-library desde main. Referencias: docs 16cba02, constitution artículos V/IX/XII,
tasks T-20, decisiones C-04 y C-06. Se conserva el producto, las seis entidades y el contrato.
API 590a012 y React a302d41 están publicados en sus ramas feature, pendientes de fusión.
Este plan se publica antes de Compose, scripts y pruebas.

## Responsabilidades y secuencia

1. PostgreSQL 16 arranca sin esquema de negocio ni scripts de inicialización montados.
2. Un servicio transitorio `migrate`, usando la imagen de API, invoca explícitamente las migraciones
   de Laravel. Infra coordina su ejecución; no contiene DDL, modelos, semilla ni copias de migraciones.
3. API espera motor saludable y migración terminada correctamente; su arranque aprovisiona el admin
   desde entorno. Un error de migración impide abrir la API.
4. React se sirve como archivos estáticos. Un gateway termina TLS y enruta /api/v1 hacia Laravel,
   y las demás rutas hacia React. Ambos servicios usan el mismo origen HTTPS.
5. Solo el gateway publica un puerto, limitado a loopback por defecto. API y PostgreSQL quedan
   en red privada; PostgreSQL y portadas usan volúmenes persistentes separados.

La ejecución explícita de migraciones se declara en Compose como comando de la imagen de API;
el entrypoint de API continúa sin DDL. Con entorno/certificados preparados, `docker compose up`
coordina el sistema con un comando. Para demostrar que el motor arranca vacío, la prueba levanta
primero únicamente db, inspecciona su catálogo y después inicia el resto. No se oculta esa secuencia.

## Configuración y secretos

- Claves generadas localmente, .env y certificados privados excluidos de Git, sin valores en logs.
- Inicializador local no sobrescribe configuración existente, no instala confianza global y no
  cambia repositorios vecinos. Entorno de producción y reloj real como valores normales.
- Perfil demo/testing y CLOCK_FIXED_AT quedan configurables para C-04/T-21; no se cambia el reloj
  del sistema ni se añade una operación HTTP para ello.
- CA local y certificado de localhost para desarrollo; el cliente debe confiar explícitamente
  en la CA. No se usa validación TLS desactivada. Para despliegue real, certificados confiables.
- Las imágenes de API/React se construyen desde checkouts vecinos; CI fija commits públicos para
  no depender de una rama que pueda cambiar durante la verificación.

## Evidencia prevista antes de implementar

- Validar Compose sin imprimir su configuración expandida ni secretos.
- Comprobar aislamiento de puertos/redes, volúmenes, dependencias, ausencia de DDL/init SQL en infra.
- Motor real vacío antes de migrar; después, esquema/categorías y login admin por HTTPS confiable.
- Recorrido React real con navegador: catálogo, socio, libro, portada, préstamo, devolución y reporte;
  comprobar librarian sin acciones admin. Capturas solo con datos sintéticos y sin credenciales.
- Reiniciar/recrear contenedores conservando volúmenes y comprobar datos y binario de portada.
- Registrar comandos, commits, resultados y límites. La medición de 5.000 libros y el sembrador
  permanecen en tool; el sitio público permanece en page.

Fuentes técnicas contrastadas: [orden de inicio de Compose](https://docs.docker.com/compose/how-tos/startup-order/),
[redes internas](https://docs.docker.com/reference/compose-file/networks/) e
[imagen oficial PostgreSQL](https://hub.docker.com/_/postgres).
Las condiciones service_healthy/service_completed_successfully evitan confundir proceso iniciado
con dependencia preparada. La elección de servicios y secuencia es una decisión de este proyecto.

El corte original del README se conserva. Este avance es posterior y no acredita elegibilidad.
