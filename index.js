// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBRuZdeaUSI3pu3-YdPlMSgApxwO3GknOQ",
    authDomain: "chromadiaries-d7f14.firebaseapp.com",
    databaseURL: "https://chromadiaries-d7f14-default-rtdb.firebaseio.com",
    projectId: "chromadiaries-d7f14",
    storageBucket: "chromadiaries-d7f14.firebasestorage.app",
    messagingSenderId: "637524482274",
    appId: "1:637524482274:web:603eb6026f810b59efe6bb",
    measurementId: "G-YQPQ8W2DTQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// DOM Elements
const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');
const loginLink = document.getElementById('loginLink');
const signupLink = document.getElementById('signupLink');
const createWritingLink = document.getElementById('createWritingLink');
const dashboardLink = document.getElementById('dashboardLink');
const logoutLink = document.getElementById('logoutLink');
const contributeLink = document.getElementById('contributeLink');
const mobileContributeLink = document.getElementById('mobileContributeLink');
const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
const successModal = new bootstrap.Modal(document.getElementById('successModal'));
const successMessage = document.getElementById('successMessage');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const writingForm = document.getElementById('writingForm');
const profileForm = document.getElementById('profileForm');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const showMoreBtn = document.getElementById('showMoreBtn');
const categoryShowMoreBtn = document.getElementById('categoryShowMoreBtn');
const searchShowMoreBtn = document.getElementById('searchShowMoreBtn');
const mobileNavToggle = document.getElementById('mobileNavToggle');
const mobileNavMenu = document.getElementById('mobileNavMenu');

// Page Elements
const homePage = document.getElementById('homePage');
const aboutPage = document.getElementById('aboutPage');
const categoryPage = document.getElementById('categoryPage');
const contactPage = document.getElementById('contactPage');
const createWritingPage = document.getElementById('createWritingPage');
const dashboardPage = document.getElementById('dashboardPage');
const authorDashboardPage = document.getElementById('authorDashboardPage');
const articlePage = document.getElementById('articlePage');
const searchResultsPage = document.getElementById('searchResultsPage');

// State
let currentUser = null;
let currentPage = 'home';
let currentCategory = '';
let writings = [];
let displayedWritings = 9;
let categoryDisplayedWritings = 9;
let searchDisplayedWritings = 9;
let searchResults = [];
let searchQuery = '';
let profileImageUrl = '';
let currentWritingId = null;
let userLikes = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;

            // Update UI for logged in user
            loginLink.classList.add('hidden');
            signupLink.classList.add('hidden');
            createWritingLink.classList.remove('hidden');
            dashboardLink.classList.remove('hidden');
            logoutLink.classList.remove('hidden');

            // Load user data
            loadUserData();
            loadUserEngagement();
        } else {
            currentUser = null;

            // Update UI for logged out user
            loginLink.classList.remove('hidden');
            signupLink.classList.remove('hidden');
            createWritingLink.classList.add('hidden');
            dashboardLink.classList.add('hidden');
            logoutLink.classList.add('hidden');
        }
    });

    // Load initial data
    loadWritings();

    // Set up slideshow
    setupSlideshow();

    // Set up rich text editor
    setupRichTextEditor();

    // Set up image upload
    setupImageUpload();

    // Set up likes
    setupEngagement();
});

// Mobile Navigation Toggle
mobileNavToggle.addEventListener('click', () => {
    const isMenuOpen = mobileNavMenu.classList.contains('show');
    
    // Toggle menu
    mobileNavMenu.classList.toggle('show');
    
    // Toggle button state
    mobileNavToggle.classList.toggle('active');
    
    // Close all dropdowns when closing menu
    if (isMenuOpen) {
        closeAllMobileDropdowns();
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileNavMenu.contains(e.target) && !mobileNavToggle.contains(e.target)) {
        if (mobileNavMenu.classList.contains('show')) {
            mobileNavMenu.classList.remove('show');
            mobileNavToggle.classList.remove('active');
            closeAllMobileDropdowns();
        }
    }
});

// Add these variables to the top of your index.js file
let userFollowing = {};
let currentAuthor = null;



// Modal switching functionality
document.getElementById('signupFromLogin').addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.hide();
    signupModal.show();
});

document.getElementById('loginFromSignup').addEventListener('click', (e) => {
    e.preventDefault();
    signupModal.hide();
    loginModal.show();
});

// Add these functions to handle following
function setupFollowButtons() {
    // Author dashboard follow button
    const authorFollowBtn = document.getElementById('authorFollowBtn');
    if (authorFollowBtn) {
        authorFollowBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please login to follow authors');
                return;
            }
            
            toggleFollow(currentAuthor);
        });
    }
    
    // Article page follow button
    const articleFollowBtn = document.getElementById('articleFollowBtn');
    if (articleFollowBtn) {
        articleFollowBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please login to follow authors');
                return;
            }
            
            const authorEmail = document.getElementById('articleAuthor').getAttribute('data-author');
            toggleFollow(authorEmail);
        });
    }
}

// Update the toggleFollow function to provide better feedback
function toggleFollow(authorEmail) {
    if (!currentUser || !authorEmail) return;
    
    // Don't allow following yourself
    if (authorEmail === currentUser.email) {
        alert('You cannot follow yourself');
        return;
    }
    
    const followRef = database.ref('following/' + currentUser.uid + '/' + authorEmail.replace(/\./g, '_'));
    
    followRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            // Unfollow
            followRef.remove().then(() => {
                updateFollowButton(authorEmail, false);
                updateFollowerCount(authorEmail, -1);
                showNotification('You have unfollowed this author');
            });
        } else {
            // Follow
            followRef.set({
                authorEmail: authorEmail,
                timestamp: new Date().toISOString()
            }).then(() => {
                updateFollowButton(authorEmail, true);
                updateFollowerCount(authorEmail, 1);
                showNotification('You are now following this author');
            });
        }
    });
}
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'follow-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--gradient-primary);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
        font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add the animations to your CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


// Update the updateFollowButton function to handle both buttons
function updateFollowButton(authorEmail, isFollowing) {
    // Update author dashboard button
    const authorFollowBtn = document.getElementById('authorFollowBtn');
    if (authorFollowBtn && currentAuthor === authorEmail) {
        if (isFollowing) {
            authorFollowBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
            authorFollowBtn.classList.add('following');
        } else {
            authorFollowBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
            authorFollowBtn.classList.remove('following');
        }
    }
    
    // Update article page button
    const articleFollowBtn = document.getElementById('articleFollowBtn');
    const articleAuthor = document.getElementById('articleAuthor');
    if (articleFollowBtn && articleAuthor && articleAuthor.getAttribute('data-author') === authorEmail) {
        if (isFollowing) {
            articleFollowBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
            articleFollowBtn.classList.add('following');
        } else {
            articleFollowBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
            articleFollowBtn.classList.remove('following');
        }
    }
}


function updateFollowerCount(authorEmail, change) {
    const authorFollowRef = database.ref('followers/' + authorEmail.replace(/\./g, '_'));
    
    authorFollowRef.once('value').then(snapshot => {
        let count = 0;
        if (snapshot.exists()) {
            count = snapshot.val().count || 0;
        }
        
        count += change;
        if (count < 0) count = 0;
        
        authorFollowRef.set({ count: count });
        
        // Update UI
        updateFollowerCountUI(authorEmail, count);
    });
}

function updateFollowerCountUI(authorEmail, count) {
    // Update author dashboard count
    const followerCount = document.getElementById('followerCount');
    if (followerCount && currentAuthor === authorEmail) {
        followerCount.textContent = count;
    }
    
    // Update article page count
    const articleFollowerCount = document.getElementById('articleFollowerCount');
    const articleAuthor = document.getElementById('articleAuthor');
    if (articleFollowerCount && articleAuthor && articleAuthor.getAttribute('data-author') === authorEmail) {
        articleFollowerCount.textContent = count;
    }
}

function loadFollowingData() {
    if (!currentUser) return;
    
    // Load who the current user is following
    database.ref('following/' + currentUser.uid).once('value').then(snapshot => {
        const following = snapshot.val();
        userFollowing = {};
        
        if (following) {
            for (const authorKey in following) {
                // Convert back from the Firebase-safe key
                const authorEmail = authorKey.replace(/_/g, '.');
                userFollowing[authorEmail] = true;
            }
        }
        
        // Update follow buttons if on relevant pages
        if (currentPage === 'authorDashboard' && currentAuthor) {
            updateFollowButton(currentAuthor, userFollowing[currentAuthor] || false);
        } else if (currentPage === 'article') {
            const articleAuthor = document.getElementById('articleAuthor');
            if (articleAuthor) {
                const authorEmail = articleAuthor.getAttribute('data-author');
                updateFollowButton(authorEmail, userFollowing[authorEmail] || false);
            }
        }
    });
}

// Fix the updateFollowButton function to properly handle the button state
function updateFollowButton(authorEmail, isFollowing) {
    // Update author dashboard button
    const authorFollowBtn = document.getElementById('authorFollowBtn');
    if (authorFollowBtn && currentAuthor === authorEmail) {
        if (isFollowing) {
            authorFollowBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
            authorFollowBtn.classList.add('following');
        } else {
            authorFollowBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
            authorFollowBtn.classList.remove('following');
        }
    }
    
    // Update article page button
    const articleFollowBtn = document.getElementById('articleFollowBtn');
    const articleAuthor = document.getElementById('articleAuthor');
    if (articleFollowBtn && articleAuthor && articleAuthor.getAttribute('data-author') === authorEmail) {
        if (isFollowing) {
            articleFollowBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
            articleFollowBtn.classList.add('following');
        } else {
            articleFollowBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
            articleFollowBtn.classList.remove('following');
        }
    }
}

// Make sure to call setupFollowButtons in your initialization code
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    
    // Set up follow buttons
    setupFollowButtons();
    
    // ... rest of initialization code ...
});

// Add this code inside the DOMContentLoaded event listener

// Add this code inside the DOMContentLoaded event listener
// Search functionality
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        searchWritings(query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            searchWritings(query);
        }
    }
});

function loadFollowerCount(authorEmail) {
    if (!authorEmail) return;
    
    const authorFollowRef = database.ref('followers/' + authorEmail.replace(/\./g, '_'));
    
    authorFollowRef.once('value').then(snapshot => {
        let count = 0;
        if (snapshot.exists()) {
            count = snapshot.val().count || 0;
        }
        
        updateFollowerCountUI(authorEmail, count);
    });
}

// Function to close all mobile dropdowns
function closeAllMobileDropdowns() {
    document.querySelectorAll('.mobile-dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}

// Profile Dropdown
profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove('show');
    }
});

// Profile Menu Links
loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.show();
});

signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupModal.show();
});

createWritingLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('createWriting');
});

dashboardLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser) {
        // Show the author dashboard for the logged-in user
        showAuthorDashboard(currentUser.email);
    }
});

logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        showPage('home');
    });
});

// Contribute Links
contributeLink.addEventListener('click', (e) => {
    e.preventDefault();
    handleContributeClick();
});

mobileContributeLink.addEventListener('click', (e) => {
    e.preventDefault();
    handleContributeClick();
});

// Handle Contribute Click
function handleContributeClick() {
    if (currentUser) {
        // User is logged in, go to create writing page
        showPage('createWriting');
    } else {
        // User is not logged in, show signup modal
        signupModal.show();
    }
}

// Toggle Mobile Dropdown
function toggleMobileDropdown(dropdownType) {
    const dropdown = document.getElementById('mobile' + dropdownType.charAt(0).toUpperCase() + dropdownType.slice(1) + 'Dropdown');
    const isCurrentlyActive = dropdown.classList.contains('active');
    
    // Close all other dropdowns first
    document.querySelectorAll('.mobile-dropdown').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('active');
        }
    });
    
    // Toggle current dropdown
    if (isCurrentlyActive) {
        dropdown.classList.remove('active');
    } else {
        dropdown.classList.add('active');
    }
}

// Rich Text Editor Setup
function setupRichTextEditor() {
    const editorButtons = document.querySelectorAll('.editor-btn');
    const editorSelects = document.querySelectorAll('.editor-select');

    editorButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const command = button.getAttribute('data-command');

            if (command === 'createLink') {
                const url = prompt('Enter URL:');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else if (command === 'insertImage') {
                const url = prompt('Enter image URL:');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else {
                document.execCommand(command, false, null);
            }

            document.getElementById('writingContent').focus();
        });
    });

    editorSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            const command = select.getAttribute('data-command');
            const value = select.value;

            if (value) {
                document.execCommand(command, false, value);
                select.value = '';
            }

            document.getElementById('writingContent').focus();
        });
    });
}

// Image Upload Setup
function setupImageUpload() {
    // Writing image upload
    const writingImageUpload = document.getElementById('writingImageUpload');
    const writingImageFile = document.getElementById('writingImageFile');
    const writingImage = document.getElementById('writingImage');

    writingImageUpload.addEventListener('click', () => {
        writingImageFile.click();
    });

    writingImageFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadImage(file, (url) => {
                writingImage.value = url;
                writingImageUpload.classList.add('has-image');
                writingImageUpload.innerHTML = `
                    <img src="${url}" alt="Uploaded image" class="uploaded-image">
                    <div class="image-upload-overlay">
                        <i class="fas fa-camera"></i> Change Image
                    </div>
                `;
            });
        }
    });

    // Profile picture upload in signup
    const signupProfileUploadBtn = document.getElementById('signupProfileUploadBtn');
    const signupProfilePicFile = document.getElementById('signupProfilePicFile');
    const signupProfilePic = document.getElementById('signupProfilePic');

    signupProfileUploadBtn.addEventListener('click', () => {
        signupProfilePicFile.click();
    });

    signupProfilePicFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                signupProfilePic.src = e.target.result;
                profileImageUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Profile picture upload in dashboard
    const profileUploadBtn = document.getElementById('profileUploadBtn');
    const profilePicFile = document.getElementById('profilePicFile');
    const profilePic = document.getElementById('profilePic');

    profileUploadBtn.addEventListener('click', () => {
        profilePicFile.click();
    });

    profilePicFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadImage(file, (url) => {
                profilePic.src = url;
                
                // Update user profile in database
                if (currentUser) {
                    database.ref('users/' + currentUser.uid).update({
                        profilePicture: url
                    });
                    
                    // Update all writings by this user with the new profile picture
                    database.ref('writings').once('value').then(snapshot => {
                        const data = snapshot.val();
                        const updates = {};
                        
                        for (const id in data) {
                            if (data[id].author === currentUser.email) {
                                updates[id] = {
                                    ...data[id],
                                    authorProfilePicture: url
                                };
                            }
                        }
                        
                        if (Object.keys(updates).length > 0) {
                            database.ref('writings').update(updates).then(() => {
                                // Reload writings to reflect the changes
                                loadWritings();
                            });
                        }
                    });
                    
                    // Update profile button to show user image
                    profileBtn.innerHTML = `<img src="${url}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                }
            });
        }
    });
}

// Upload Image to Firebase Storage
function uploadImage(file, callback) {
    const storageRef = storage.ref('images/' + Date.now() + '_' + file.name);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed',
        (snapshot) => {
            // Progress indicator can be added here
        },
        (error) => {
            console.error('Upload error:', error);
            alert('Image upload failed. Please try again.');
        },
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                callback(downloadURL);
            });
        }
    );
}

// Setup Likes
function setupEngagement() {
    const likeBtn = document.getElementById('likeBtn');

    // Like button click
    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please login to like articles');
                return;
            }

            if (!currentWritingId) return;

            const likeRef = database.ref('likes/' + currentWritingId + '/' + currentUser.uid);

            likeRef.once('value').then(snapshot => {
                if (snapshot.exists()) {
                    // Unlike
                    likeRef.remove();
                    likeBtn.classList.remove('liked');
                } else {
                    // Like
                    likeRef.set({
                        userId: currentUser.uid,
                        timestamp: new Date().toISOString()
                    });
                    likeBtn.classList.add('liked');
                }
            });
        });
    }
}

// Update the loadUserEngagement function
function loadUserEngagement() {
    if (!currentUser) return;

    // Load user's likes
    database.ref('likes').on('value', (snapshot) => {
        userLikes = {};
        const likes = snapshot.val();

        for (const writingId in likes) {
            for (const userId in likes[writingId]) {
                if (!userLikes[writingId]) {
                    userLikes[writingId] = [];
                }
                userLikes[writingId].push(userId);
            }
        }

        // Update like button if on article page
        if (currentWritingId && userLikes[currentWritingId]) {
            const likeBtn = document.getElementById('likeBtn');
            if (likeBtn && userLikes[currentWritingId].includes(currentUser.uid)) {
                likeBtn.classList.add('liked');
            } else {
                likeBtn.classList.remove('liked');
            }
        }

        // Refresh the display to update like counts
        if (currentPage === 'home') {
            // Update like counts for displayed writings
            writings.forEach(writing => {
                if (userLikes[writing.id]) {
                    writing.likesCount = userLikes[writing.id].length;
                } else {
                    writing.likesCount = 0;
                }
            });
            displayWritings(writings.slice(0, displayedWritings));
        } else if (currentPage === 'category') {
            const categoryWritings = writings.filter(w => w.category === currentCategory);
            categoryWritings.forEach(writing => {
                if (userLikes[writing.id]) {
                    writing.likesCount = userLikes[writing.id].length;
                } else {
                    writing.likesCount = 0;
                }
            });
            displayWritings(categoryWritings.slice(0, categoryDisplayedWritings), 'categoryWritings');
        } else if (currentPage === 'searchResults') {
            searchResults.forEach(writing => {
                if (userLikes[writing.id]) {
                    writing.likesCount = userLikes[writing.id].length;
                } else {
                    writing.likesCount = 0;
                }
            });
            displayWritings(searchResults.slice(0, searchDisplayedWritings), 'searchResultsContainer');
        }
    });
}

// Login Form
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Check for admin credentials
    if (email === 'admin' && password === 'alwan@24') {
        // Redirect to admin page
        window.location.href = 'admin.html';
        return;
    }

    // Regular user login with Firebase
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            loginModal.hide();
        })
        .catch(error => {
            console.error('Login error:', error);
            alert('Login failed. Please check your credentials.');
        });
});

// Update the signupForm event listener
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form values
    const firstName = document.getElementById('signupFirstName').value;
    const surname = document.getElementById('signupSurname').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const bio = document.getElementById('signupBio').value;
    const website = document.getElementById('signupWebsite').value;
    const location = document.getElementById('signupLocation').value;
    const dob = document.getElementById('signupDOB').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        return;
    }

    // Calculate age from DOB
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    // Block users who are 18 or older
    if (age >= 18) {
        alert('You must be under 18 years old to create an account.');
        return;
    }

    // Create user with Firebase
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Save user data to Firebase
            const userData = {
                firstName: firstName,
                surname: surname,
                email: email,
                phone: phone,
                bio: bio,
                website: website,
                location: location,
                dob: dob,
                // Use default profile image if none uploaded
                profilePicture: profileImageUrl || 'image',
                createdAt: new Date().toISOString()
            };

            database.ref('users/' + userCredential.user.uid).set(userData);

            signupModal.hide();
            successMessage.textContent = 'Account created successfully!';
            successModal.show();
            
            // Reset profileImageUrl for next signup
            profileImageUrl = '';
        })
        .catch(error => {
            console.error('Signup error:', error);
            alert('Signup failed. Please try again.');
        });
});

// Writing Form - IMPROVED
writingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('writingTitle').value;
    const description = document.getElementById('writingDescription').value;
    const image = document.getElementById('writingImage').value || `https://picsum.photos/seed/${Date.now()}/400/300.jpg`;
    const content = document.getElementById('writingContent').innerHTML;
    const tags = document.getElementById('writingTags').value.split(',').map(tag => tag.trim());
    const category = document.getElementById('writingCategory').value;

    // Create writing object
    const writing = {
        title: title,
        description: description,
        image: image,
        content: content,
        tags: tags,
        category: category,
        author: currentUser.email,
        authorName: currentUser.displayName || `${currentUser.firstName || ''} ${currentUser.surname || ''}` || currentUser.email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        comments: 0
    };

    // Submit to Formspree for admin review
    const form = document.createElement('form');
    form.action = 'https://formspree.io/f/xnnonkrk';
    form.method = 'POST';

    Object.keys(writing).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = typeof writing[key] === 'object' ? JSON.stringify(writing[key]) : writing[key];
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    // Reset form
    writingForm.reset();
    document.getElementById('writingContent').innerHTML = '';
    document.getElementById('writingImageUpload').classList.remove('has-image');
    document.getElementById('writingImageUpload').innerHTML = `
        <input type="file" id="writingImageFile" accept="image/*" style="display: none;">
        <div id="imageUploadPlaceholder">
            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
            <p class="text-muted">Click to upload image or drag and drop</p>
            <p class="text-muted small">PNG, JPG, GIF up to 10MB</p>
        </div>
        <div class="image-upload-overlay">
            <i class="fas fa-camera"></i> Change Image
        </div>
    `;

 // Re-setup image upload
setupImageUpload();

// Show success message
successMessage.textContent = 'Your writing has been submitted for review!';
successModal.show();

// Redirect to dashboard
setTimeout(() => {
showPage('dashboard');
}, 2000);
});

// Profile Form - IMPROVED
profileForm.addEventListener('submit', (e) => {
e.preventDefault();

const firstName = document.getElementById('profileFirstName').value;
const surname = document.getElementById('profileSurname').value;
const bio = document.getElementById('profileBio').value;
const website = document.getElementById('profileWebsite').value;
const location = document.getElementById('profileLocation').value;
const phone = document.getElementById('profilePhone').value;

// Get current profile picture URL
const currentProfilePic = document.getElementById('profilePic').src;

// Update user profile in Firebase
const updateData = {
firstName: firstName,
surname: surname,
bio: bio,
website: website,
location: location,
phone: phone,
profilePicture: currentProfilePic,
updatedAt: new Date().toISOString()
};

// First update the user profile
database.ref('users/' + currentUser.uid).update(updateData)
.then(() => {
// Update display name in Firebase Auth
return currentUser.updateProfile({
displayName: `${firstName} ${surname}`
});
})
.then(() => {
// Update profile button to show user image
profileBtn.innerHTML = `<img src="${currentProfilePic}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;

// Now update all writings by this user
return database.ref('writings').once('value');
})
.then(snapshot => {
const data = snapshot.val();
const updates = {};

for (const id in data) {
if (data[id].author === currentUser.email) {
const fullName = `${firstName} ${surname}`.trim();
updates[id] = {
...data[id],
authorName: fullName,
authorBio: bio,
authorProfilePicture: currentProfilePic
};
}
}

if (Object.keys(updates).length > 0) {
return database.ref('writings').update(updates);
} else {
return Promise.resolve();
}
})
.then(() => {
// Reload writings to reflect the changes
return loadWritings();
})
.then(() => {
// If currently viewing an article by this user, refresh it
if (currentPage === 'article' && currentWritingId) {
const currentWriting = writings.find(w => w.id === currentWritingId);
if (currentWriting && currentWriting.author === currentUser.email) {
// Update the current writing object with new author info
currentWriting.authorName = `${firstName} ${surname}`.trim();
currentWriting.authorBio = bio;
currentWriting.authorProfilePicture = currentProfilePic;

// Refresh the article view
viewWriting(currentWriting);
}
}

// Show success message
successMessage.textContent = 'Profile updated successfully!';
successModal.show();
})
.catch(error => {
console.error('Profile update error:', error);
alert('Profile update failed. Please try again.');
});
});
// Page Navigation Functions
function showPage(page) {
    // Hide all pages
    homePage.classList.add('hidden');
    aboutPage.classList.add('hidden');
    categoryPage.classList.add('hidden');
    contactPage.classList.add('hidden');
    createWritingPage.classList.add('hidden');
    dashboardPage.classList.add('hidden');
    authorDashboardPage.classList.add('hidden');
    articlePage.classList.add('hidden');
    searchResultsPage.classList.add('hidden');

    // Show selected page
    switch (page) {
        case 'home':
            homePage.classList.remove('hidden');
            currentPage = 'home';
            break;
        case 'about':
            aboutPage.classList.remove('hidden');
            currentPage = 'about';
            break;
        case 'contact':
            contactPage.classList.remove('hidden');
            currentPage = 'contact';
            break;
        case 'createWriting':
            createWritingPage.classList.remove('hidden');
            currentPage = 'createWriting';
            break;
        case 'dashboard':
            dashboardPage.classList.remove('hidden');
            currentPage = 'dashboard';
            loadUserWritings();
            updateDashboardStats();
            break;
        case 'article':
            articlePage.classList.remove('hidden');
            currentPage = 'article';
            break;
    }

    // Close profile menu
    profileMenu.classList.remove('show');

    // Close mobile menu
    mobileNavMenu.classList.remove('show');
    mobileNavToggle.classList.remove('active');
    closeAllMobileDropdowns();
}

// Update the showCategoryPage function
function showCategoryPage(category) {
    // Hide all pages
    homePage.classList.add('hidden');
    aboutPage.classList.add('hidden');
    categoryPage.classList.add('hidden');
    contactPage.classList.add('hidden');
    createWritingPage.classList.add('hidden');
    dashboardPage.classList.add('hidden');
    authorDashboardPage.classList.add('hidden');
    articlePage.classList.add('hidden');
    searchResultsPage.classList.add('hidden');

    // Show category page
    categoryPage.classList.remove('hidden');
    currentPage = 'category';
    currentCategory = category;
    categoryDisplayedWritings = 9;

    // Set category title
    const categoryTitle = document.getElementById('categoryTitle');
    switch (category) {
        case 'book-review':
            categoryTitle.textContent = 'Reviews';
            break;
        case 'philosophy':
            categoryTitle.textContent = 'Stories';
            break;
        case 'politics':
            categoryTitle.textContent = 'Poems';
            break;
        case 'science-technology':
            categoryTitle.textContent = 'Translation';
            break;
        case 'society-culture':
            categoryTitle.textContent = 'Features';
            break;
        case 'theology':
            categoryTitle.textContent = 'Letters';
            break;
        case 'shorts':
            categoryTitle.textContent = 'Diary';
            break;
        case 'translation':
            categoryTitle.textContent = 'Essays';
            break;
        case 'podcast':
            categoryTitle.textContent = 'Podcast';
            break;
    }

    // Load category writings
    const categoryWritings = writings.filter(writing => writing.category === category);
    displayWritings(categoryWritings.slice(0, categoryDisplayedWritings), 'categoryWritings');

    // Show/hide show more button
    if (categoryWritings.length <= categoryDisplayedWritings) {
        categoryShowMoreBtn.style.display = 'none';
    } else {
        categoryShowMoreBtn.style.display = 'block';
    }

    // Close profile menu
    profileMenu.classList.remove('show');

    // Close mobile menu
    mobileNavMenu.classList.remove('show');
    mobileNavToggle.classList.remove('active');
    closeAllMobileDropdowns();
}

function showAuthorDashboard(authorEmail) {
    // Hide all pages
    homePage.classList.add('hidden');
    aboutPage.classList.add('hidden');
    categoryPage.classList.add('hidden');
    contactPage.classList.add('hidden');
    createWritingPage.classList.add('hidden');
    dashboardPage.classList.add('hidden');
    authorDashboardPage.classList.remove('hidden');
    articlePage.classList.add('hidden');
    searchResultsPage.classList.add('hidden');

    currentPage = 'authorDashboard';
    currentAuthor = authorEmail;

    // Check if viewing own profile
    const isOwnProfile = currentUser && authorEmail === currentUser.email;

    // Load following data first
    loadFollowingData();
    
    // Load author data - use once() to get fresh data
    database.ref('users').once('value').then(snapshot => {
        const users = snapshot.val();
        let authorData = null;
        let authorId = null;

        for (const userId in users) {
            if (users[userId].email === authorEmail) {
                authorData = users[userId];
                authorId = userId;
                break;
            }
        }

        // Get fresh follower count
        getFollowerCount(authorEmail).then(followersCount => {
            // Update follower count display
            document.getElementById('followerCount').textContent = followersCount;
            
            // Update follow button if user is logged in
            if (currentUser) {
                // Hide follow button if viewing own profile
                const followSection = document.querySelector('.author-follow-section');
                if (isOwnProfile) {
                    followSection.style.display = 'none';
                } else {
                    followSection.style.display = 'flex';
                    updateFollowButton(authorEmail, userFollowing[authorEmail] || false);
                }
            }
        });

        if (authorData) {
            const fullName = `${authorData.firstName || ''} ${authorData.surname || ''}`.trim() || authorData.email;
            document.getElementById('authorName').textContent = fullName;
            document.getElementById('authorBio').textContent = authorData.bio || 'No bio available.';
            document.getElementById('authorEmail').textContent = authorData.email;
            
            // Check each field and display either the value or "Not provided"
            document.getElementById('authorPhone').textContent = authorData.phone || 'Not provided';
            document.getElementById('authorInstitution').textContent = authorData.institution || 'Not provided';
            document.getElementById('authorWebsite').textContent = authorData.website || 'Not provided';
            document.getElementById('authorLocation').textContent = authorData.location || 'Not provided';
            
            if (authorData.profilePicture) {
                document.getElementById('authorPic').src = authorData.profilePicture;
            }
        } else {
            // Even if no user data found, still show basic info
            document.getElementById('authorName').textContent = authorEmail;
            document.getElementById('authorBio').textContent = 'No bio available.';
            document.getElementById('authorEmail').textContent = authorEmail;
            document.getElementById('authorPhone').textContent = 'Not provided';
            document.getElementById('authorInstitution').textContent = 'Not provided';
            document.getElementById('authorWebsite').textContent = 'Not provided';
            document.getElementById('authorLocation').textContent = 'Not provided';
        }

        // Show/hide dashboard link based on profile ownership
        const dashboardLink = document.getElementById('authorDashboardLink');
        if (isOwnProfile) {
            dashboardLink.style.display = 'block';
        } else {
            dashboardLink.style.display = 'none';
        }
    });

    // Load author's writings - use fresh data
    database.ref('writings').once('value').then(snapshot => {
        const data = snapshot.val();
        const allWritings = [];
        
        // Convert to array
        for (const id in data) {
            allWritings.push({
                id: id,
                ...data[id]
            });
        }
        
        // Filter writings by author
        let authorWritings = allWritings.filter(writing => writing.author === authorEmail);
        
        // If no writings found, show appropriate message
        if (authorWritings.length === 0) {
            const container = document.getElementById('authorWritings');
            if (isOwnProfile) {
                container.innerHTML = `
                    <div class="no-writings-message">
                        <i class="fas fa-pen-fancy fa-3x text-muted mb-3"></i>
                        <h4>Your writings appear in your author profile in the reading section.</h4>
                        <p>Or please create your own writings.</p>
                        <button class="btn btn-primary mt-3" onclick="showPage('createWriting')">
                            <i class="fas fa-plus"></i> Create Your First Writing
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="no-writings-message">
                        <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                        <h4>No writings found</h4>
                        <p>This author hasn't created any writings yet.</p>
                    </div>
                `;
            }
        } else {
            // Update counts for each writing
            Promise.all(authorWritings.map(writing => {
                return Promise.all([
                    getFollowerCount(writing.author),
                    getLikeCount(writing.id)
                ]).then(([followers, likes]) => {
                    writing.authorFollowers = followers;
                    writing.likesCount = likes;
                });
            })).then(() => {
                displayWritings(authorWritings, 'authorWritings');
                
                // If viewing own profile, add edit options to writings
                if (isOwnProfile) {
                    addEditOptionsToAuthorWritings(authorWritings);
                }
            });
        }
    });

    // Close profile menu
    profileMenu.classList.remove('show');

    // Close mobile menu
    mobileNavMenu.classList.remove('show');
    mobileNavToggle.classList.remove('active');
    closeAllMobileDropdowns();
}


function addEditOptionsToAuthorWritings(authorWritings) {
    const container = document.getElementById('authorWritings');
    const writingCards = container.querySelectorAll('.article-card');
    
    writingCards.forEach((card, index) => {
        const writing = authorWritings[index];
        
        // Create status badge
        const statusBadge = document.createElement('div');
        statusBadge.className = `writing-status status-${writing.status || 'pending'}`;
        statusBadge.innerHTML = `
            <i class="fas ${getStatusIcon(writing.status)}"></i>
            ${getStatusText(writing.status)}
        `;
        
        // Create edit actions container
        const editActions = document.createElement('div');
        editActions.className = 'author-writing-actions';
        editActions.innerHTML = `
            <button class="btn btn-sm btn-outline-primary edit-writing" data-id="${writing.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-danger delete-writing" data-id="${writing.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
        
        // Add to card body
        const cardBody = card.querySelector('.article-card-body');
        cardBody.insertBefore(statusBadge, cardBody.firstChild);
        cardBody.appendChild(editActions);
        
        // Add event listeners
        editActions.querySelector('.edit-writing').addEventListener('click', (e) => {
            e.stopPropagation();
            editWriting(writing.id);
        });
        
        editActions.querySelector('.delete-writing').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteWriting(writing.id);
        });
    });
}

// Helper functions for status
function getStatusIcon(status) {
    switch(status) {
        case 'published': return 'fa-check-circle';
        case 'pending': return 'fa-clock';
        case 'rejected': return 'fa-times-circle';
        default: return 'fa-clock';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'published': return 'Published';
        case 'pending': return 'Pending Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending Review';
    }
}

// Update the loadWritings function to properly load counts
function loadWritings() {
    database.ref('writings').once('value').then(snapshot => {
        const data = snapshot.val();
        writings = [];

        for (const id in data) {
            writings.push({
                id: id,
                ...data[id]
            });
        }

        // Load author data for each writing
        database.ref('users').once('value').then(userSnapshot => {
            const users = userSnapshot.val();
            
            writings.forEach(writing => {
                // Find author data
                for (const userId in users) {
                    if (users[userId].email === writing.author) {
                        const authorData = users[userId];
                        const fullName = `${authorData.firstName || ''} ${authorData.surname || ''}`.trim();
                        writing.authorName = fullName || writing.author;
                        writing.authorBio = authorData.bio || '';
                        writing.authorProfilePicture = authorData.profilePicture || `https://picsum.photos/seed/${writing.author}/50/50.jpg`;
                        break;
                    }
                }
            });

            // Sort by creation date (newest first)
            writings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Load counts for all writings
            Promise.all(writings.map(writing => {
                return Promise.all([
                    getFollowerCount(writing.author),
                    getLikeCount(writing.id)
                ]).then(([followers, likes]) => {
                    writing.authorFollowers = followers;
                    writing.likesCount = likes;
                });
            })).then(() => {
                // Display writings on home page
                displayWritings(writings.slice(0, displayedWritings));

                // Set up slideshow with latest writings
                setupSlideshowWithWritings();

                // Show/hide show more button
                if (writings.length <= displayedWritings) {
                    showMoreBtn.style.display = 'none';
                } else {
                    showMoreBtn.style.display = 'block';
                }
            });
        });
    });
}

function refreshAuthorDataForWriting(writing) {
    return database.ref('users').once('value').then(userSnapshot => {
        const users = userSnapshot.val();
        
        // Find author data
        for (const userId in users) {
            if (users[userId].email === writing.author) {
                const authorData = users[userId];
                const fullName = `${authorData.firstName || ''} ${authorData.surname || ''}`.trim();
                writing.authorName = fullName || writing.author;
                writing.authorBio = authorData.bio || '';
                writing.authorInstitution = authorData.institution || ''; // Add institution
                writing.authorProfilePicture = authorData.profilePicture || `https://picsum.photos/seed/${writing.author}/50/50.jpg`;
                break;
            }
        }
        
        return writing;
    });
}

function loadUserData() {
    if (currentUser) {
        database.ref('users/' + currentUser.uid).once('value').then(snapshot => {
            const userData = snapshot.val();

            if (userData) {
                // Update profile form
                document.getElementById('profileFirstName').value = userData.firstName || '';
                document.getElementById('profileSurname').value = userData.surname || '';
                document.getElementById('profileEmail').value = userData.email || currentUser.email;
                document.getElementById('profilePhone').value = userData.phone || '';
                document.getElementById('profileInstitution').value = userData.institution || ''; // Add institution field
                document.getElementById('profileBio').value = userData.bio || '';
                document.getElementById('profileWebsite').value = userData.website || '';
                document.getElementById('profileLocation').value = userData.location || '';

                // Update profile picture
                if (userData.profilePicture) {
                    document.getElementById('profilePic').src = userData.profilePicture;
                    // Update profile button to show user image instead of icon
                    profileBtn.innerHTML = `<img src="${userData.profilePicture}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
                }
            }
        });
    }
}

// Update the profileForm submission to include institution
profileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('profileFirstName').value;
    const surname = document.getElementById('profileSurname').value;
    const bio = document.getElementById('profileBio').value;
    const website = document.getElementById('profileWebsite').value;
    const location = document.getElementById('profileLocation').value;
    const phone = document.getElementById('profilePhone').value;
    const institution = document.getElementById('profileInstitution').value; // Add institution field

    // Get current profile picture URL
    const currentProfilePic = document.getElementById('profilePic').src;

    // Update user profile in Firebase (include institution)
    const updateData = {
        firstName: firstName,
        surname: surname,
        bio: bio,
        website: website,
        location: location,
        phone: phone,
        institution: institution, // Add institution to update data
        profilePicture: currentProfilePic,
        updatedAt: new Date().toISOString()
    };

    // First update the user profile
    database.ref('users/' + currentUser.uid).update(updateData)
        .then(() => {
            // Update display name in Firebase Auth
            return currentUser.updateProfile({
                displayName: `${firstName} ${surname}`
            });
        })
        .then(() => {
            // Update profile button to show user image
            profileBtn.innerHTML = `<img src="${currentProfilePic}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;

            // Now update all writings by this user
            return database.ref('writings').once('value');
        })
        .then(snapshot => {
            const data = snapshot.val();
            const updates = {};
            
            for (const id in data) {
                if (data[id].author === currentUser.email) {
                    const fullName = `${firstName} ${surname}`.trim();
                    updates[id] = {
                        ...data[id],
                        authorName: fullName,
                        authorBio: bio,
                        authorInstitution: institution, // Add institution to writings
                        authorProfilePicture: currentProfilePic
                    };
                }
            }
            
            if (Object.keys(updates).length > 0) {
                return database.ref('writings').update(updates);
            } else {
                return Promise.resolve();
            }
        })
        .then(() => {
            // Reload writings to reflect the changes
            return loadWritings();
        })
        .then(() => {
            // If currently viewing an article by this user, refresh it
            if (currentPage === 'article' && currentWritingId) {
                const currentWriting = writings.find(w => w.id === currentWritingId);
                if (currentWriting && currentWriting.author === currentUser.email) {
                    // Update the current writing object with new author info
                    currentWriting.authorName = `${firstName} ${surname}`.trim();
                    currentWriting.authorBio = bio;
                    currentWriting.authorInstitution = institution; // Add institution
                    currentWriting.authorProfilePicture = currentProfilePic;
                    
                    // Refresh the article view
                    viewWriting(currentWriting);
                }
            }
            
            // Show success message
            successMessage.textContent = 'Profile updated successfully!';
            successModal.show();
        })
        .catch(error => {
            console.error('Profile update error:', error);
            alert('Profile update failed. Please try again.');
        });
});

function loadUserWritings() {
    if (currentUser) {
        // Get all writings from the database
        database.ref('writings').once('value').then(snapshot => {
            const data = snapshot.val();
            const allWritings = [];
            
            // Convert to array
            for (const id in data) {
                allWritings.push({
                    id: id,
                    ...data[id]
                });
            }
            
            // Filter writings by current user's email
            const userWritings = allWritings.filter(writing => writing.author === currentUser.email);
            
            // Display user's writings
            displayUserWritings(userWritings);
        }).catch(error => {
            console.error('Error loading user writings:', error);
            document.getElementById('myWritings').innerHTML = '<p>Error loading your writings. Please try again later.</p>';
        });
    }
}

// Update Dashboard Statistics
function updateDashboardStats() {
    if (currentUser) {
        // Get all writings from the database
        database.ref('writings').once('value').then(snapshot => {
            const data = snapshot.val();
            const allWritings = [];
            
            // Convert to array
            for (const id in data) {
                allWritings.push({
                    id: id,
                    ...data[id]
                });
            }
            
            // Filter writings by current user's email
            const userWritings = allWritings.filter(writing => writing.author === currentUser.email);

            // Calculate real statistics from database
            let totalViews = 0;
            let totalLikes = 0;
            let totalComments = 0;

            // Get likes and comments data
            database.ref('likes').once('value').then(likesSnapshot => {
                const likes = likesSnapshot.val();

                database.ref('comments').once('value').then(commentsSnapshot => {
                    const comments = commentsSnapshot.val();

                    userWritings.forEach(writing => {
                        totalViews += writing.views || 0;

                        // Count likes for this writing
                        if (likes && likes[writing.id]) {
                            totalLikes += Object.keys(likes[writing.id]).length;
                        }

                        // Count comments for this writing
                        if (comments && comments[writing.id]) {
                            totalComments += Object.keys(comments[writing.id]).length;
                        }
                    });

                    // Update UI
                    document.getElementById('totalWritings').textContent = userWritings.length;
                    document.getElementById('totalViews').textContent = totalViews;
                    document.getElementById('totalLikes').textContent = totalLikes;
                    document.getElementById('totalComments').textContent = totalComments;
                });
            });
        }).catch(error => {
            console.error('Error updating dashboard stats:', error);
        });
    }
}

// Update the displayWritings function
function displayWritings(writingsToDisplay, containerId = 'recentWritings') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (writingsToDisplay.length === 0) {
        container.innerHTML = '<p class="text-center">No writings found.</p>';
        return;
    }

    writingsToDisplay.forEach(writing => {
        const articleCard = document.createElement('div');
        articleCard.className = 'col-md-4 mb-4';

        const categoryLabel = getCategoryLabel(writing.category);
        const authorProfilePic = writing.authorProfilePicture || `https://picsum.photos/seed/${writing.author}/35/35.jpg`;

        // Use the loaded counts
        const likesCount = writing.likesCount || 0;
        const followersCount = writing.authorFollowers || 0;

        articleCard.innerHTML = `
            <div class="article-card">
                <img src="${writing.image}" alt="${writing.title}">
                <div class="article-card-body">
                    <div class="article-category">${categoryLabel}</div>
                    <h5 class="article-title">${writing.title}</h5>
                    <p class="card-text">${writing.description}</p>
                    <div class="article-meta">
                        <div class="author-info">
                            <img src="${authorProfilePic}" alt="${writing.authorName}" class="author-avatar">
                            <div>
                                <span class="author-name clickable-author" data-author="${writing.author}">${writing.authorName || writing.author}</span>
                                <span class="author-bio">${writing.authorBio || ''}</span>
                            </div>
                        </div>
                        <span>${formatDate(writing.createdAt)}</span>
                    </div>
                    <div class="article-stats">
                        <div class="stat-item">
                            <i class="fas fa-users"></i>
                            <span>${followersCount}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-heart"></i>
                            <span>${likesCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add click event to article card
        articleCard.addEventListener('click', (e) => {
            // Check if click is on author name
            if (e.target.classList.contains('clickable-author')) {
                e.stopPropagation();
                const authorEmail = e.target.getAttribute('data-author');
                showAuthorDashboard(authorEmail);
            } else {
                viewWriting(writing);
            }
        });

        container.appendChild(articleCard);
    });
}

    // Add this function to index.js
function loadAuthorFollowers() {
    database.ref('followers').once('value').then(snapshot => {
        const followers = snapshot.val();
        
        // Update each writing with its author's follower count
        writings.forEach(writing => {
            const authorKey = writing.author.replace(/\./g, '_');
            if (followers && followers[authorKey]) {
                writing.authorFollowers = followers[authorKey].count || 0;
            } else {
                writing.authorFollowers = 0;
            }
        });
        
        // Refresh the display if we're on a page that shows writings
        if (currentPage === 'home') {
            displayWritings(writings.slice(0, displayedWritings));
        } else if (currentPage === 'category') {
            const categoryWritings = writings.filter(w => w.category === currentCategory);
            displayWritings(categoryWritings.slice(0, categoryDisplayedWritings), 'categoryWritings');
        } else if (currentPage === 'searchResults') {
            displayWritings(searchResults.slice(0, searchDisplayedWritings), 'searchResultsContainer');
        }
    });
}


// Update the displayUserWritings function
function displayUserWritings(userWritings) {
    const container = document.getElementById('myWritings');
    container.innerHTML = '';

    if (userWritings.length === 0) {
        container.innerHTML = '<p>You haven\'t created any writings yet.</p>';
        return;
    }

    // Get fresh counts for all writings
    Promise.all(userWritings.map(writing => {
        return Promise.all([
            getFollowerCount(writing.author),
            getLikeCount(writing.id)
        ]).then(([followers, likes]) => {
            writing.authorFollowers = followers;
            writing.likesCount = likes;
        });
    })).then(() => {
        userWritings.forEach(writing => {
            const writingItem = document.createElement('div');
            writingItem.className = 'writing-item';

            const likesCount = writing.likesCount || 0;
            const followersCount = writing.authorFollowers || 0;

            writingItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5>${writing.title}</h5>
                        <p>${writing.description}</p>
                        <div>
                            <span class="status-published">Published</span>
                            <span class="ms-2">${getCategoryLabel(writing.category)}</span>
                            <span class="ms-2 text-muted">
                                <i class="fas fa-eye"></i> ${writing.views || 0}
                                <i class="fas fa-heart ms-2"></i> ${likesCount}
                                <i class="fas fa-users ms-2"></i> ${followersCount}
                            </span>
                        </div>
                    </div>
                    <div class="admin-actions">
                        <button class="btn btn-sm btn-outline-primary edit-writing" data-id="${writing.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-writing" data-id="${writing.id}">Delete</button>
                    </div>
                </div>
            `;

            container.appendChild(writingItem);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-writing').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const writingId = btn.getAttribute('data-id');
                editWriting(writingId);
            });
        });

        document.querySelectorAll('.delete-writing').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const writingId = btn.getAttribute('data-id');
                deleteWriting(writingId);
            });
        });
    });
}

// Update the viewWriting function
function viewWriting(writing) {
    // Hide all pages
    homePage.classList.add('hidden');
    aboutPage.classList.add('hidden');
    categoryPage.classList.add('hidden');
    contactPage.classList.add('hidden');
    createWritingPage.classList.add('hidden');
    dashboardPage.classList.add('hidden');
    authorDashboardPage.classList.add('hidden');
    searchResultsPage.classList.add('hidden');
    
    // Show article page
    articlePage.classList.remove('hidden');

    // Set current writing ID
    currentWritingId = writing.id;

    // Get fresh counts for this writing
    Promise.all([
        getFollowerCount(writing.author),
        getLikeCount(writing.id)
    ]).then(([followers, likes]) => {
        // Update the writing object with fresh counts
        writing.authorFollowers = followers;
        writing.likesCount = likes;

        // Refresh author data for this writing
        refreshAuthorDataForWriting(writing).then(updatedWriting => {
            // Populate article page with writing data
            document.getElementById('articleTitle').textContent = updatedWriting.title;
            
            // Update author section with clickable name and bio
            const authorElement = document.getElementById('articleAuthor');
            authorElement.textContent = updatedWriting.authorName || updatedWriting.author;
            authorElement.className = 'clickable-author';
            authorElement.setAttribute('data-author', updatedWriting.author);
            
            // Add author bio if available
            let authorBioElement = document.getElementById('articleBio');
            if (!authorBioElement) {
                authorBioElement = document.createElement('div');
                authorBioElement.id = 'articleBio';
                authorBioElement.className = 'author-bio-small';
                
                // Insert bio after author name
                const authorParent = authorElement.parentNode;
                authorParent.insertBefore(authorBioElement, authorElement.nextSibling);
            }
            authorBioElement.textContent = updatedWriting.authorBio || '';
            
            // Add author institution if available
            let authorInstitutionElement = document.getElementById('articleInstitution');
            if (!authorInstitutionElement) {
                authorInstitutionElement = document.createElement('div');
                authorInstitutionElement.id = 'articleInstitution';
                authorInstitutionElement.className = 'author-institution-small';
                
                // Insert institution after bio
                const authorParent = authorElement.parentNode;
                authorParent.insertBefore(authorInstitutionElement, authorElement.nextSibling);
            }
            authorInstitutionElement.textContent = updatedWriting.authorInstitution || '';
            
            // Update author avatar
            const authorAvatar = document.getElementById('articleAuthorAvatar');
            authorAvatar.src = updatedWriting.authorProfilePicture || `https://picsum.photos/seed/${updatedWriting.author}/50/50.jpg`;
            
            document.getElementById('articleDate').textContent = formatDate(updatedWriting.createdAt);
            document.getElementById('articleCategory').textContent = getCategoryLabel(updatedWriting.category);
            document.getElementById('articleImage').src = updatedWriting.image;

            // Display content (HTML from rich text editor)
            const contentElement = document.getElementById('articleContent');
            
            // If content is plain text, convert line breaks to <br>
            if (!updatedWriting.content.includes('<')) {
                contentElement.innerHTML = updatedWriting.content.replace(/\n/g, '<br>');
            } else {
                contentElement.innerHTML = updatedWriting.content;
            }

            // Display tags
            const tagsContainer = document.getElementById('articleTags');
            tagsContainer.innerHTML = '';
            if (updatedWriting.tags && updatedWriting.tags.length > 0) {
                updatedWriting.tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'tag';
                    tagElement.textContent = tag;
                    tagsContainer.appendChild(tagElement);
                });
            }

            // Update engagement counts with fresh data
            document.getElementById('likeCount').textContent = likes;
            document.getElementById('articleFollowerCount').textContent = followers;

            // Update like button state
            const likeBtn = document.getElementById('likeBtn');
            if (currentUser && userLikes[updatedWriting.id] && userLikes[updatedWriting.id].includes(currentUser.uid)) {
                likeBtn.classList.add('liked');
            } else {
                likeBtn.classList.remove('liked');
            }

            // Update follow button if user is logged in
            if (currentUser) {
                updateFollowButton(updatedWriting.author, userFollowing[updatedWriting.author] || false);
            }

            // Update views count
            if (updatedWriting.id) {
                database.ref('writings/' + updatedWriting.id).update({
                    views: (updatedWriting.views || 0) + 1
                });
            }

            // Update current page
            currentPage = 'article';

            // Add click event to author name
            authorElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showAuthorDashboard(updatedWriting.author);
            });

            // Close profile menu
            profileMenu.classList.remove('show');

            // Close mobile menu
            mobileNavMenu.classList.remove('show');
            mobileNavToggle.classList.remove('active');
            closeAllMobileDropdowns();
        });
    });
}

function editWriting(writingId) {
    // Find the writing
    const writing = writings.find(w => w.id === writingId);
    if (!writing) return;

    // Show create writing page with pre-filled data
    showPage('createWriting');

    // Fill the form with writing data
    document.getElementById('writingTitle').value = writing.title;
    document.getElementById('writingDescription').value = writing.description;
    document.getElementById('writingImage').value = writing.image;
    document.getElementById('writingContent').innerHTML = writing.content;
    document.getElementById('writingTags').value = writing.tags.join(', ');
    document.getElementById('writingCategory').value = writing.category;

    // Update image upload display
    if (writing.image) {
        const writingImageUpload = document.getElementById('writingImageUpload');
        writingImageUpload.classList.add('has-image');
        writingImageUpload.innerHTML = `
            <input type="file" id="writingImageFile" accept="image/*" style="display: none;">
            <img src="${writing.image}" alt="Uploaded image" class="uploaded-image">
            <div class="image-upload-overlay">
                <i class="fas fa-camera"></i> Change Image
            </div>
        `;
    }

    // Re-setup image upload
    setupImageUpload();

    // Change form submission behavior
    writingForm.onsubmit = (e) => {
        e.preventDefault();

        // Update writing object
        const updatedWriting = {
            title: document.getElementById('writingTitle').value,
            description: document.getElementById('writingDescription').value,
            image: document.getElementById('writingImage').value,
            content: document.getElementById('writingContent').innerHTML,
            tags: document.getElementById('writingTags').value.split(',').map(tag => tag.trim()),
            category: document.getElementById('writingCategory').value,
            author: writing.author,
            authorName: writing.authorName,
            status: writing.status,
            createdAt: writing.createdAt,
            updatedAt: new Date().toISOString()
        };

        // Submit to Formspree for admin review
        const form = document.createElement('form');
        form.action = 'https://formspree.io/f/xnnonkrk';
        form.method = 'POST';

        Object.keys(updatedWriting).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = typeof updatedWriting[key] === 'object' ? JSON.stringify(updatedWriting[key]) : updatedWriting[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        // Reset form
        writingForm.reset();
        document.getElementById('writingContent').innerHTML = '';
        writingForm.onsubmit = null;

        // Show success message
        successMessage.textContent = 'Your writing has been updated and submitted for review!';
        successModal.show();

        // Redirect to dashboard
        setTimeout(() => {
            showPage('dashboard');
        }, 2000);
    };
}

function deleteWriting(writingId) {
    if (confirm('Are you sure you want to delete this writing?')) {
        // Submit deletion request to Formspree
        const form = document.createElement('form');
        form.action = 'https://formspree.io/f/xnnonkrk';
        form.method = 'POST';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'deleteWriting';
        input.value = writingId;
        form.appendChild(input);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        // Show success message
        successMessage.textContent = 'Your deletion request has been submitted for review!';
        successModal.show();

        // Reload user writings
        loadUserWritings();
    }
}

function searchWritings(query) {
    searchQuery = query;
    searchDisplayedWritings = 9;

    const lowerQuery = query.toLowerCase();

    // Search in titles, authors, tags, and content
    searchResults = writings.filter(writing => {
        const titleMatch = writing.title && writing.title.toLowerCase().includes(lowerQuery);
        const authorMatch = (writing.authorName || writing.author) && (writing.authorName || writing.author).toLowerCase().includes(lowerQuery);
        const tagsMatch = writing.tags && writing.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        const categoryMatch = writing.category && getCategoryLabel(writing.category).toLowerCase().includes(lowerQuery);
        const contentMatch = writing.content && writing.content.toLowerCase().includes(lowerQuery);

        return titleMatch || authorMatch || tagsMatch || categoryMatch || contentMatch;
    });

    // Hide all pages
    homePage.classList.add('hidden');
    aboutPage.classList.add('hidden');
    categoryPage.classList.add('hidden');
    contactPage.classList.add('hidden');
    createWritingPage.classList.add('hidden');
    dashboardPage.classList.add('hidden');
    authorDashboardPage.classList.add('hidden');
    articlePage.classList.add('hidden');

    // Show search results page
    searchResultsPage.classList.remove('hidden');

    // Update search info
    document.getElementById('searchInfo').textContent = `Found ${searchResults.length} results for "${query}"`;

    // Display search results
    displayWritings(searchResults.slice(0, searchDisplayedWritings), 'searchResultsContainer');

    // Show/hide show more button
    if (searchResults.length <= searchDisplayedWritings) {
        searchShowMoreBtn.style.display = 'none';
    } else {
        searchShowMoreBtn.style.display = 'block';
    }

    // Update current page
    currentPage = 'searchResults';

    // Close profile menu
    profileMenu.classList.remove('show');

    // Close mobile menu
    mobileNavMenu.classList.remove('show');
    mobileNavToggle.classList.remove('active');
    closeAllMobileDropdowns();
}

// Slideshow Function
function setupSlideshow() {
    // This will be replaced by setupSlideshowWithWritings
}

// Setup Slideshow with Latest Writings
function setupSlideshowWithWritings() {
    const slideshow = document.getElementById('slideshow');
    const smallSlides = document.getElementById('smallSlides');

    // Clear existing slides
    slideshow.innerHTML = '';
    smallSlides.innerHTML = '';

    // Get the latest 3 writings for main slideshow
    const latestWritings = writings.slice(0, 3);

    // Create main slides
    latestWritings.forEach((writing, index) => {
        const slide = document.createElement('div');
        slide.className = index === 0 ? 'slide active' : 'slide';

        slide.innerHTML = `
            <img src="${writing.image}" alt="${writing.title}">
            <div class="slide-content">
                <h2>${writing.title}</h2>
                <p>By ${writing.authorName || writing.author} • ${formatDate(writing.createdAt)}</p>
            </div>
        `;

        slideshow.appendChild(slide);
    });

    // Get the next 2 writings for small slides
    const smallWritings = writings.slice(3, 5);

    // Create small slides
    smallWritings.forEach(writing => {
        const smallSlide = document.createElement('div');
        smallSlide.className = 'small-slide';

        smallSlide.innerHTML = `
            <img src="${writing.image}" alt="${writing.title}">
            <div class="small-slide-content">
                <h5>${writing.title}</h5>
                <p>By ${writing.authorName || writing.author}</p>
            </div>
        `;

        smallSlide.addEventListener('click', () => {
            viewWriting(writing);
        });

        smallSlides.appendChild(smallSlide);
    });

    // Set up auto-rotation for main slides
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    // Auto-rotate slides every 5 seconds
    setInterval(nextSlide, 5000);
}

// Update the getCategoryLabel function
function getCategoryLabel(category) {
    switch (category) {
        case 'book-review':
            return 'Reviews';
        case 'philosophy':
            return 'Stories';
        case 'politics':
            return 'Poems';
        case 'science-technology':
            return 'Translation';
        case 'society-culture':
            return 'Features';
        case 'theology':
            return 'Letters';
        case 'shorts':
            return 'Diary';
        case 'translation':
            return 'Essays';
        case 'podcast':
            return 'Podcast';
        default:
            return category || 'Uncategorized';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Add these functions at the top of your index.js file, after the state variables

// Centralized function to get follower count for an author
function getFollowerCount(authorEmail) {
    return new Promise((resolve) => {
        const authorFollowRef = database.ref('followers/' + authorEmail.replace(/\./g, '_'));
        authorFollowRef.once('value').then(snapshot => {
            let count = 0;
            if (snapshot.exists()) {
                count = snapshot.val().count || 0;
            }
            resolve(count);
        });
    });
}

// Centralized function to get like count for a writing
function getLikeCount(writingId) {
    return new Promise((resolve) => {
        database.ref('likes/' + writingId).once('value').then(snapshot => {
            let count = 0;
            if (snapshot.exists()) {
                count = Object.keys(snapshot.val()).length;
            }
            resolve(count);
        });
    });
}

