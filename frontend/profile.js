document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const profileForm = document.querySelector('.profile-form-container');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const addSocialLinkBtn = document.getElementById('addSocialLink');
    const socialLinksContainer = document.querySelector('.social-links-container');
    const profilePhoto = document.getElementById('profilePhoto');
    const profilePictureUpload = document.getElementById('profilePictureUpload');
    const bioTextarea = document.getElementById('bio');
    
    // Load profile data from localStorage when page loads
    loadProfileData();
    
    // Save profile data
    saveBtn.addEventListener('click', saveProfileData);
    
    // Cancel button - navigate back to main page
    cancelBtn.addEventListener('click', () => {
        window.location.href = 'main.html';
    });
    
    // Add social link
    addSocialLinkBtn.addEventListener('click', addSocialLinkField);
    
    // Initialize with one empty social link field
    if (document.querySelectorAll('.social-link-item').length === 1) {
        const firstSocialLink = document.querySelector('.social-link-item');
        if (!firstSocialLink.querySelector('.social-platform').value && 
            !firstSocialLink.querySelector('.social-url').value) {
            // Keep the first one empty
        } else {
            // If first one has data, add another empty one
            addSocialLinkField();
        }
    }
    
    // Handle profile picture upload
    profilePictureUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                // Create image element to replace the SVG
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                
                // Clear the profilePhoto element and add the image
                profilePhoto.innerHTML = '';
                profilePhoto.appendChild(img);
                
                // Store the image data in localStorage
                localStorage.setItem('profilePicture', event.target.result);
                
                // The main profile icon will be updated automatically via the storage event in app.js
            };
            reader.readAsDataURL(file);
        }
    });
    

    
    function loadProfileData() {
        // Load basic profile information
        const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
        
        if (document.getElementById('firstName')) {
            document.getElementById('firstName').value = profileData.firstName || '';
        }
        if (document.getElementById('lastName')) {
            document.getElementById('lastName').value = profileData.lastName || '';
        }
        if (document.getElementById('username')) {
            document.getElementById('username').value = profileData.username || '';
        }
        if (document.getElementById('email')) {
            document.getElementById('email').value = profileData.email || '';
        }
        
        if (document.getElementById('birthDate')) {
            document.getElementById('birthDate').value = profileData.birthDate || '';
        }
        
        if (document.getElementById('gender')) {
            document.getElementById('gender').value = profileData.gender || '';
        }
        
        if (document.getElementById('country')) {
            document.getElementById('country').value = profileData.country || '';
        }
        
        if (document.getElementById('city')) {
            document.getElementById('city').value = profileData.city || '';
        }
        if (document.getElementById('address')) {
            document.getElementById('address').value = profileData.address || '';
        }
        
        if (document.getElementById('bio')) {
            document.getElementById('bio').value = profileData.bio || '';
        }
        
        if (document.getElementById('website')) {
            document.getElementById('website').value = profileData.website || '';
        }
        
        if (document.getElementById('profession')) {
            document.getElementById('profession').value = profileData.profession || '';
        }
        
        if (document.getElementById('education')) {
            document.getElementById('education').value = profileData.education || '';
        }
        
        if (document.getElementById('interestsText')) {
            document.getElementById('interestsText').value = profileData.interestsText || '';
        }
        
        if (document.getElementById('newsletter')) {
            document.getElementById('newsletter').checked = profileData.newsletter || false;
        }
        if (document.getElementById('notifications')) {
            document.getElementById('notifications').checked = profileData.notifications || false;
        }
        if (document.getElementById('showEmail')) {
            document.getElementById('showEmail').checked = profileData.showEmail || false;
        }
        
        // Load profile picture if available
        const profilePicture = localStorage.getItem('profilePicture');
        if (profilePicture) {
            // Create image element to replace the SVG
            const img = document.createElement('img');
            img.src = profilePicture;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            
            // Clear the profilePhoto element and add the image
            profilePhoto.innerHTML = '';
            profilePhoto.appendChild(img);
            
            // The main profile icon will be updated automatically via the storage event in app.js
        }
        
        // Load social links
        if (profileData.socialLinks && profileData.socialLinks.length > 0) {
            // Clear existing social links except the first one
            const existingSocialLinks = document.querySelectorAll('.social-link-item');
            for (let i = 1; i < existingSocialLinks.length; i++) {
                existingSocialLinks[i].remove();
            }
            
            // Populate the first social link with first entry
            if (existingSocialLinks[0]) {
                const firstLink = existingSocialLinks[0];
                if (profileData.socialLinks[0]) {
                    firstLink.querySelector('.social-platform').value = profileData.socialLinks[0].platform || '';
                    firstLink.querySelector('.social-url').value = profileData.socialLinks[0].url || '';
                }
            }
            
            // Add additional social link fields for remaining entries
            for (let i = 1; i < profileData.socialLinks.length; i++) {
                const newSocialLink = addSocialLinkField();
                if (newSocialLink) {
                    newSocialLink.querySelector('.social-platform').value = profileData.socialLinks[i].platform || '';
                    newSocialLink.querySelector('.social-url').value = profileData.socialLinks[i].url || '';
                }
            }
        }
    }
    
    function saveProfileData() {
        // Collect form data
        const profileData = {
            firstName: document.getElementById('firstName')?.value || '',
            lastName: document.getElementById('lastName')?.value || '',
            username: document.getElementById('username')?.value || '',
            email: document.getElementById('email')?.value || '',
            birthDate: document.getElementById('birthDate')?.value || '',
            gender: document.getElementById('gender')?.value || '',
            country: document.getElementById('country')?.value || '',
            city: document.getElementById('city')?.value || '',
            address: document.getElementById('address')?.value || '',
            bio: document.getElementById('bio')?.value || '',
            website: document.getElementById('website')?.value || '',
            profession: document.getElementById('profession')?.value || '',
            education: document.getElementById('education')?.value || '',
            interestsText: document.getElementById('interestsText')?.value || '',
            newsletter: document.getElementById('newsletter')?.checked || false,
            notifications: document.getElementById('notifications')?.checked || false,
            showEmail: document.getElementById('showEmail')?.checked || false,
            socialLinks: []
        };
        
        // Collect social links
        const socialLinkItems = document.querySelectorAll('.social-link-item');
        socialLinkItems.forEach(item => {
            const platform = item.querySelector('.social-platform').value;
            const url = item.querySelector('.social-url').value;
            
            if (platform || url) { // Only save if at least one field is filled
                profileData.socialLinks.push({
                    platform: platform,
                    url: url
                });
            }
        });
        
        // Save to localStorage
        localStorage.setItem('profileData', JSON.stringify(profileData));
        
        // Show success notification modal
        showSuccessModal();
    }
    
    function showSuccessModal() {
        // Remove any existing modals
        const existingModal = document.getElementById('profile-save-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'profile-save-modal';
        modal.className = 'notification-modal';
        modal.innerHTML = `
            <div class="notification-modal-content">
                <h3>Success</h3>
                <p>Profile data saved successfully!</p>
                <button id="modal-ok-btn" class="modal-btn">OK</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const okBtn = document.getElementById('modal-ok-btn');
        const closeModal = () => {
            modal.remove();
        };
        
        okBtn.addEventListener('click', closeModal);
        
        // Close when clicking outside the modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    function addSocialLinkField() {
        const socialLinkItem = document.createElement('div');
        socialLinkItem.className = 'social-link-item';
        socialLinkItem.innerHTML = `
            <select class="social-platform">
                <option value="">Select platform...</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter (X)</option>
                <option value="linkedin">LinkedIn</option>
                <option value="github">GitHub</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="other">Other</option>
            </select>
            <input type="url" class="social-url" placeholder="https://profile-url">
            <button type="button" class="remove-social-btn">Remove</button>
        `;
        
        // Add event listener to remove button
        const removeBtn = socialLinkItem.querySelector('.remove-social-btn');
        removeBtn.addEventListener('click', function() {
            if (document.querySelectorAll('.social-link-item').length > 1) {
                socialLinkItem.remove();
            } else {
                // If it's the last one, just clear the values
                socialLinkItem.querySelector('.social-platform').value = '';
                socialLinkItem.querySelector('.social-url').value = '';
            }
        });
        
        socialLinksContainer.appendChild(socialLinkItem);
        return socialLinkItem;
    }
    
    // Add remove functionality to existing social links
    socialLinksContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-social-btn')) {
            const socialLinkItem = e.target.closest('.social-link-item');
            if (document.querySelectorAll('.social-link-item').length > 1) {
                socialLinkItem.remove();
            } else {
                // If it's the last one, just clear the values
                socialLinkItem.querySelector('.social-platform').value = '';
                socialLinkItem.querySelector('.social-url').value = '';
            }
        }
    });
});