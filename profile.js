// Load saved profile data from localStorage
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});

// Toggle Edit Mode
function toggleEdit() {
    const editForm = document.getElementById('editForm');
    const editBtn = document.getElementById('editBtn');

    if (editForm.style.display === 'none' || editForm.style.display === '') {
        editForm.style.display = 'block';
        editBtn.innerText = 'Cancel';
    } else {
        editForm.style.display = 'none';
        editBtn.innerText = 'Edit Profile';
    }
}

// Save Profile Data
function saveProfile() {
    const nameInput = document.getElementById('nameInput').value;
    const emailInput = document.getElementById('emailInput').value;
    const dateInput = document.getElementById('dateInput').value;

    // Save to localStorage
    localStorage.setItem('profileName', nameInput);
    localStorage.setItem('profileEmail', emailInput);
    localStorage.setItem('profileDate', dateInput);

    // Update displayed data
    document.getElementById('profileName').innerText = nameInput;
    document.getElementById('profileEmail').innerText = emailInput;
    document.getElementById('profileDate').innerText = dateInput;

    // Hide edit form after saving
    toggleEdit();
}

// Load Profile Data
function loadProfile() {
    const name = localStorage.getItem('profileName') || 'John Doe';
    const email = localStorage.getItem('profileEmail') || 'johndoe@example.com';
    const date = localStorage.getItem('profileDate') || 'January 2024';
    const imgSrc = localStorage.getItem('profileImg') || 'images/profile-icon.jpg';

    document.getElementById('profileName').innerText = name;
    document.getElementById('profileEmail').innerText = email;
    document.getElementById('profileDate').innerText = date;
    document.getElementById('profileImg').src = imgSrc;

    document.getElementById('nameInput').value = name;
    document.getElementById('emailInput').value = email;
    document.getElementById('dateInput').value = date;
}

// Change Profile Picture
function changeProfilePicture() {
    const imgUpload = document.getElementById('imgUpload');
    imgUpload.click();

    imgUpload.onchange = function () {
        const file = imgUpload.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const newImgSrc = e.target.result;
                document.getElementById('profileImg').src = newImgSrc;
                localStorage.setItem('profileImg', newImgSrc);
            };
            reader.readAsDataURL(file);
        }
    };
}
