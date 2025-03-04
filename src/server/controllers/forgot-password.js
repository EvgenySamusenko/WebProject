document.addEventListener("DOMContentLoaded", function () {
    const formWrapper = document.querySelector(".form-wrapper");

    // Кнопка для перехода на регистрацию
    document.querySelector(".create-account-btn").addEventListener("click", function () {
        formWrapper.classList.remove("active-forgot");
        formWrapper.classList.add("active");
    });

    // Кнопка для возвращения к авторизации
    document.querySelectorAll(".login-account-btn").forEach(button => {
        button.addEventListener("click", function () {
            formWrapper.classList.remove("active");
            formWrapper.classList.remove("active-forgot");
        });
    });

    // Кнопка "Забыл пароль?"
    document.querySelector(".forgot-password").addEventListener("click", function () {
        formWrapper.classList.remove("active");
        formWrapper.classList.add("active-forgot");
    });

    // Логика для формы "Забыл пароль"
    const forgotForm = document.querySelector(".forgot-form");
    if (forgotForm) {
        forgotForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Отменяем стандартное поведение формы

            const email = document.querySelector("#forgot-email").value;

            try {
                const response = await fetch("http://localhost:5000/auth/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();
                if (response.ok) {
                    alert("Письмо для сброса пароля отправлено! Проверьте почту.");
                    forgotForm.reset();
                } else {
                    alert(`Ошибка: ${data.message}`);
                }
            } catch (error) {
                console.error("Ошибка при восстановлении пароля:", error);
                alert("Не удалось отправить запрос. Попробуйте позже.");
            }
        });
    }
});
