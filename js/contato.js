document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('contact-status');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const button = form.querySelector('button[type="submit"]');
        const data = Object.fromEntries(new FormData(form));
        data.consentimento = form.elements.consentimento.checked;
        button.disabled = true;
        form.setAttribute('aria-busy', 'true');
        status.dataset.state = 'pending';
        status.textContent = 'Registrando sua mensagem…';
        try {
            const response = await fetch(form.action, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok || result.status !== 'success') throw new Error(result.message || 'Não foi possível registrar agora.');
            status.dataset.state = 'success';
            status.textContent = result.message;
            form.reset();
        } catch (error) {
            status.dataset.state = 'error';
            status.textContent = error.message || 'Falha de conexão. Tente novamente.';
        } finally {
            button.disabled = false;
            form.removeAttribute('aria-busy');
        }
    });
});
