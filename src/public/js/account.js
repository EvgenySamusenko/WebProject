document.addEventListener("DOMContentLoaded", function () {
    // Логика переключения между формами
    document.querySelector(".create-account-btn").addEventListener("click", function() {
        document.querySelector(".form-wrapper").classList.add("active");
    });

    document.querySelector(".login-account-btn").addEventListener("click", function() {
        document.querySelector(".form-wrapper").classList.remove("active");
    });

    // Получаем формы
    const loginForm = document.querySelector(".auth-form");
    const registerForm = document.querySelector(".register-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Отменяем стандартное поведение формы

            const username = loginForm.querySelector("input[type='text']").value;
            const password = loginForm.querySelector("input[type='password']").value;

            try {
                const response = await fetch("http://localhost:5000/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ login: username, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("userId", data.id);
                    alert("Успешный вход!");
                    window.location.href = "main.html";
                    // Можно добавить редирект
                } else {
                    alert(`Ошибка: ${data.message}`);
                }
            } catch (error) {
                console.error("Ошибка при входе:", error);
                alert("Не удалось выполнить вход. Попробуйте позже.");
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Отменяем стандартное поведение формы

            const username = registerForm.querySelector("input[type='text']").value;
            const email = registerForm.querySelector("input[type='email']").value;
            const password = registerForm.querySelectorAll("input[type='password']")[0].value;
            const confirmPassword = registerForm.querySelectorAll("input[type='password']")[1].value;

            if (password !== confirmPassword) {
                alert("Пароли не совпадают!");
                return;
            }

            try {
                const response = await fetch("http://localhost:5000/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ login: username, email, password }),
                });
            
                const text = await response.text(); // Читаем текстовый ответ
            
                try {
                    const data = JSON.parse(text); // Пробуем разобрать JSON
                    if (response.ok) {
                        alert("Регистрация успешна! Проверьте почту для подтверждения.");
                        registerForm.reset();
                    } else {
                        alert(`Ошибка: ${data.message}`);
                    }
                } catch {
                    console.error("Ошибка сервера:", text);
                    alert("Ошибка сервера, попробуйте позже.");
                }
            } catch (error) {
                console.error("Ошибка при регистрации:", error);
                alert("Не удалось зарегистрироваться. Попробуйте позже.");
            }
            
        });
    }
});
