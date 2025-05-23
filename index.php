<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="image/icono.png">
    <link rel="stylesheet" href="css/index.css">
    <title>Bienvenido</title>
</head>

<body onload="scrollTitle()">
    <!-- Encabezado Mejorado -->
    <header class="header-modern">
        <div class="container-header">
            <div class="title-section">
                <h1>Juan Abel Huaman Rafael</h1>
                <p class="subtitle">👨‍💻 Programador | SAP B1 | PHP | JS</p>
            </div>
            <nav class="nav-modern">
                <ul>
                    <li><a href="#about">Sobre mí</a></li>
                    <li><a href="#projects">Proyectos</a></li>
                    <li><a href="#contact">Contacto</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <!-- Sección: Sobre mí -->
    <section id="about" class="about-section">
        <div class="about-content">
            <img src="image/imagen-logo.png" alt="Foto de perfil" class="profile-pic">
            <div class="about-text">
                <h2><span class="gradient-title">Sobre mí</span></h2>
                <p>
                    ¡Hola! Soy <strong>Juan Abel</strong>, un desarrollador apasionado por crear experiencias <em>visuales</em> y <em>funcionales</em>.
                    Me especializo en <strong>PHP</strong>, <strong>JavaScript</strong>, <strong>SQL</strong> y tengo amplia experiencia integrando soluciones empresariales con <strong>SAP Business One</strong>, utilizando <code>DI-API</code> en <strong>C#</strong> y bases de datos <strong>SAP HANA</strong>.
                </p>
                <p>
                    He trabajado en empresas del sector industrial desarrollando sistemas de gestión para <strong>almacenes</strong>, <strong>ventas</strong> y <strong>procesos logísticos</strong>.
                    Me considero una persona comprometida, que aprende rápido y que siempre está dispuesta a trabajar duro. Me adapto con facilidad y busco constantemente optimizar procesos mediante soluciones tecnológicas eficientes.
                </p>

            </div>
        </div>
    </section>

    <!-- Sección: Proyectos -->
    <section id="projects" class="projects">
        <h2 class="projects-title">🚀 Proyectos</h2>
        <div class="projects-grid">
            <div class="project-card">
                <img src="image/logo-tetris.png" alt="Proyecto Tetris">
                <h3>🎮 Videojuego Tetris</h3>
                <p>Juego tipo arcade con ranking Firebase, pausa, predicción de pieza y diseño responsive.</p>
                <a class="project-button" href="game.html" target="_blank">🎮 Jugar ahora</a>
            </div>
            <div class="project-card">
                <img src="image/icono_chat.png" alt="Chat">
                <h3>💬 Chat</h3>
                <p>Aplicación de mensajería instantánea desarrollada con Laravel, WebSockets (Pusher), Bootstrap 5 y
                    autenticación con Laravel Breeze. Permite conversaciones en tiempo real entre usuarios autenticados.
                </p>
                <a class="project-button disabled" href="#">🧑‍💻 En desarrollo</a>

                <!-- <a class="project-button" href="chat.html" target="_blank">💬 Ver Chat</a> -->
            </div>
        </div>
    </section>
    <section id="contact" class="contact-section">
        <div class="contact-container">
            <h2 class="contact-title">📬 Contacto</h2>
            <p>Estoy disponible para colaborar en proyectos o resolver dudas. Puedes escribirme directamente:</p>

            <div class="contact-links">
                <a href="mailto:jabelxd1@gmail.com" class="contact-button">📧 Enviar correo</a>
                <a href="https://www.linkedin.com/in/juan-abel-huaman-rafael-1987572b8/" target="_blank" class="contact-button linkedin">
                    🔗 LinkedIn
                </a>
            </div>
        </div>
    </section>

    <?php include 'includes/footer.php'; ?>

    <script src="dist/js/source_index.js"></script>

</body>


</html>