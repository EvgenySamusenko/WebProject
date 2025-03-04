function goToProfile() {
    window.location.href = "profile-setting.html"; // Сюда вставь реальный путь
}

document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Вы не авторизованы!");
        window.location.href = "account.html";
    }

    const profileContainer = document.getElementById("profileContainer");
    if (profileContainer) {
        profileContainer.addEventListener("click", goToProfile);
    }
});