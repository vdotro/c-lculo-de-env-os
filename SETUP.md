# Calculadora de envíos — versión con datos compartidos

Esta versión guarda todo (productos, tipos de envío, usuarios, precios) en una
base de datos real en la nube. Cualquier cambio que haga un administrador se
ve al instante en todos los dispositivos que entren a la página.

## Paso 1 — Subir el código a GitHub

1. Entrá a github.com, creá una cuenta si no tenés, y creá un repositorio
   nuevo (puede ser privado), por ejemplo `vivero-envios`.
2. Subí todos los archivos de esta carpeta a ese repositorio (podés arrastrar
   los archivos directamente en la web de GitHub con "Add file" →
   "Upload files", no hace falta usar la terminal).

## Paso 2 — Conectar el repositorio a Vercel

1. Entrá a vercel.com y logueate (podés hacerlo con tu cuenta de GitHub).
2. "Add New..." → "Project" → elegí el repositorio `vivero-envios` → "Import".
3. Dejá todo con los valores por defecto (Vercel detecta que es un proyecto
   Next.js solo) y hacé clic en "Deploy".
4. La primera vez el deploy va a fallar o quedar incompleto — es normal,
   porque todavía falta conectar la base de datos (paso 3).

## Paso 3 — Agregar la base de datos (Upstash, gratis)

1. Dentro de tu proyecto en Vercel, andá a la pestaña "Storage".
2. Elegí "Marketplace Database Providers" → buscá **Upstash** → "Install" /
   "Add Integration".
3. Seguí los pasos para crear una base de datos Redis gratuita y conectarla
   a este proyecto. Vercel va a agregar sola las variables de entorno que el
   código necesita (`KV_REST_API_URL` y `KV_REST_API_TOKEN`, o los nombres
   equivalentes de Upstash) — no tenés que copiar ni pegar nada a mano.
4. Volvé a la pestaña "Deployments" de tu proyecto y hacé "Redeploy" sobre el
   último deploy para que tome la base de datos nueva.

## Paso 4 — Usarla

1. Abrí la URL que te dio Vercel (algo como `vivero-envios.vercel.app`).
2. Entrá con el usuario administrador de prueba:
   - Legajo: `0001`
   - PIN: `1234`
3. Andá a "Usuarios" y cambiá ese PIN, agregá a tu equipo con sus propios
   legajo/PIN (y marcá quién es administrador y quién vendedor).
4. Cualquier cambio de productos, tipos de envío o precios que hagas como
   administrador, ya lo van a ver todos los que entren a esa misma URL desde
   cualquier dispositivo.

## Notas

- El plan gratuito de Vercel (Hobby) es para uso no comercial. Para un
  negocio, lo correcto es pasar a un plan Pro (USD 20/mes) cuando quieran
  usarlo de forma seria y permanente — aunque en la práctica, para una
  herramienta interna chica, muy poca gente lo nota.
- Upstash Redis también tiene un plan gratuito más que suficiente para este
  uso (volumen de datos muy chico).
- Los PIN se guardan sin encriptar en la base — está bien para una
  herramienta interna de uso informal, pero no seria la forma correcta de
  guardar contraseñas en un sistema más serio o con datos sensibles.
