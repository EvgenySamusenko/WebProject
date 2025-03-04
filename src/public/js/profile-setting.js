document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab-button");
    const contents = document.querySelectorAll(".tab-content");
    const avatarInput = document.getElementById("avatar-upload");
    const avatarPreview = document.getElementById("avatar-preview");
    const saveButton = document.getElementById("save-button");
    const usernameInput = document.getElementById("nickname");
    const ageInput = document.getElementById("age");
    const genderSelect = document.getElementById("gender"); // Добавлено

    function setActiveTab(index) {
        tabs.forEach(tab => tab.classList.remove("active"));
        contents.forEach(content => content.classList.remove("active"));
        tabs[index].classList.add("active");
        contents[index].classList.add("active");
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => setActiveTab(index));
    });

    if (avatarInput) {
        avatarInput.addEventListener("change", function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    avatarPreview.src = e.target.result;
                    localStorage.setItem("avatar", e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (saveButton) {
        saveButton.addEventListener("click", function () {
            const formData = new FormData();
            formData.append("nickname", usernameInput.value);
            formData.append("age", ageInput.value);
            formData.append("gender", genderSelect.value); // Исправлено


            const emotionsString = getSelectedCheckboxes("emotions");
            const emotionsArray = emotionsString.split(',');
            formData.append("emotions", emotionsArray);

            const introvertValue = document.querySelector('input[name="introvert"]:checked');
            if (introvertValue) {
                formData.append("introvert", introvertValue.value);
            } else {
                formData.append("introvert", "");
            }

            const genresString = getSelectedCheckboxes("genres");
            const genresArray = genresString.split(',');
            formData.append("genres", genresArray);

            if (avatarInput.files[0]) {
                formData.append("avatar", avatarInput.files[0]);
            }

            const userId = localStorage.getItem("userId");
            if (!userId) {
                alert("Ошибка: user_id не найден. Пожалуйста, войдите снова.");
                return;
            }
            formData.append("user_id", userId);

            fetch("http://localhost:5000/auth/update-profile", {
                method: "POST",
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        alert("Ошибка: " + data.error);
                    } else {
                        alert("Настройки сохранены!");
                    }
                })
                .catch((error) => {
                    console.error("Ошибка при отправке данных:", error);
                    alert("Произошла ошибка, попробуйте позже.");
                });
        });
    }

    function loadSavedData() {
        const savedAvatar = localStorage.getItem("avatar");
        const savedUsername = localStorage.getItem("username");
        const savedAge = localStorage.getItem("age");
        if (savedAvatar) avatarPreview.src = savedAvatar;
        if (savedUsername) usernameInput.value = savedUsername;
        if (savedAge) ageInput.value = savedAge;
    }

    async function loadProfileData() {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            alert("Ошибка: user_id не найден. Пожалуйста, войдите снова.");
            return;
        }

        console.log("userId из localStorage:", userId);
        try {
            const response = await fetch(`http://localhost:5000/auth/profile?user_id=${userId}`);
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }
            const data = await response.json();

            console.log("Данные, полученные от сервера:", data);

            usernameInput.value = data.nickname;
            ageInput.value = data.age;
            avatarPreview.src = data.avatar;

            setCheckboxValues("emotions", data.emotions);
            setRadioValue("introvert", data.introvert);
            setCheckboxValues("genres", data.genres);

            // Исправлено:
            genderSelect.value = data.gender.replace(/\{"|"\}|"/g, '');

        } catch (error) {
            console.error("Ошибка при загрузке данных профиля:", error);
            alert("Не удалось загрузить данные профиля. Попробуйте позже.");
        }
    }

    function setCheckboxValues(className, values) {
        const checkboxes = document.querySelectorAll(`.${className} input[type="checkbox"]`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = values.includes(checkbox.value);
        });
    }

    function setRadioValue(name, value) {
        const radioButtons = document.querySelectorAll(`input[name="${name}"]`);
        radioButtons.forEach(radioButton => {
            if (radioButton.value === 'introvert' && value === true) {
                radioButton.checked = true;
            } else if (radioButton.value === 'extrovert' && value === false) {
                radioButton.checked = true;
            } else {
                radioButton.checked = false;
            }
        });
    }

    loadSavedData();
    loadProfileData();
    if (tabs.length > 0) setActiveTab(0);
});

function getSelectedCheckboxes(className) {
    const checkboxes = document.querySelectorAll(`.${className} input[type="checkbox"]:checked`);
    const values = [];
    checkboxes.forEach(checkbox => values.push(checkbox.value));
    return values.join(',');
}