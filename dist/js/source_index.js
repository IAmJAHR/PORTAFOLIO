// Juan Abel - Dynamic Document Title & Cyber Tab Feedback
(function () {
    const originalTitle = "Juan Abel | Full Stack & SAP Specialist ⚡";
    const awayTitles = [
        "👾 Conexión pausada... | J_ABEL",
        "⚡ Esperando retorno... | J_ABEL",
        "💻 root@dev:~$ standby..."
    ];
    let awayIndex = 0;
    let awayInterval = null;

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            awayInterval = setInterval(() => {
                document.title = awayTitles[awayIndex % awayTitles.length];
                awayIndex++;
            }, 1800);
        } else {
            clearInterval(awayInterval);
            document.title = originalTitle;
            setTimeout(() => {
                document.title = "Juan Abel | Hacker & Enterprise Developer";
            }, 2000);
        }
    });
})();
