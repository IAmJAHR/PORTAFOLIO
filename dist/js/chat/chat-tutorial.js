// ==========================================
// 📖 CHAT TUTORIAL - Patrón: Walkthrough / Guide (<85 líneas)
// ==========================================
(function() {
    const STEPS = [
        {
            title: '01 // CIFRADO E2E MILITAR',
            icon: '🔒',
            desc: 'Los mensajes se cifran en tu navegador con AES-256 antes de salir a la red. El servidor solo almacena texto ininteligible (Ciphertext) e IV.'
        },
        {
            title: '02 // SALAS PRIVADAS CON CLAVE',
            icon: '🗝️',
            desc: 'Crea salas secretas con el botón "+ NUEVA SALA". Solo quienes conozcan la contraseña podrán descifrar los mensajes en tiempo real.'
        },
        {
            title: '03 // REGISTRO PERMANENTE EN POSTGRES',
            icon: '💾',
            desc: 'El historial de chat se conserva en PostgreSQL Dokploy de forma segura. Al volver a entrar con tu clave, el chat se reconstruye.'
        },
        {
            title: '04 // MODO EFÍMERO (30 SEGUNDOS)',
            icon: '🔥',
            desc: 'Activa el botón "EFÍMERO" para comunicaciones de alto riesgo. Los mensajes se auto-destruyen 30 segundos después de ser leídos.'
        }
    ];

    class ChatTutorial {
        constructor() {
            this.current = 0;
            this.modal = document.getElementById('modal-tutorial');
            this.titleEl = document.getElementById('tut-title');
            this.iconEl = document.getElementById('tut-icon');
            this.descEl = document.getElementById('tut-desc');
            this.stepIndicator = document.getElementById('tut-steps');
            this.nextBtn = document.getElementById('tut-btn-next');
            this.openBtn = document.getElementById('btn-open-tutorial');

            if (this.openBtn) this.openBtn.addEventListener('click', () => this.show(0));
            if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());

            const seen = localStorage.getItem('chat_tut_seen');
            const hasAlias = localStorage.getItem('chat_alias');
            if (!seen && hasAlias) {
                setTimeout(() => this.show(0), 600);
            }
        }

        show(index = 0) {
            this.current = index;
            this.render();
            if (this.modal) this.modal.classList.remove('hidden');
        }

        render() {
            const step = STEPS[this.current];
            if (this.titleEl) this.titleEl.innerText = step.title;
            if (this.iconEl) this.iconEl.innerText = step.icon;
            if (this.descEl) this.descEl.innerText = step.desc;
            if (this.stepIndicator) this.stepIndicator.innerText = `PASO ${this.current + 1} DE ${STEPS.length}`;
            if (this.nextBtn) this.nextBtn.innerText = this.current === STEPS.length - 1 ? 'ENTENDIDO // COMENZAR' : 'SIGUIENTE >';
        }

        next() {
            if (this.current < STEPS.length - 1) {
                this.current++;
                this.render();
            } else {
                localStorage.setItem('chat_tut_seen', 'true');
                if (this.modal) this.modal.classList.add('hidden');
                window.CyberToast?.success('Protocolo de seguridad asimilado.');
            }
        }
    }

    window.ChatTutorial = ChatTutorial;
})();
