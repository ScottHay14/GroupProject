document.addEventListener("DOMContentLoaded", () => {
    const exploreSubjects = document.querySelector('a[href="#subjects"]');
    const homeLink = document.querySelector('a[href="#home"]');
    const subjectContainer = document.getElementById('subject-container');
    const filters = document.querySelector('.filters');
    const searchBar = document.querySelector('.search-bar');
    const findJobsButton = document.querySelector('.find-jobs-btn');
    const findSearchInput = document.querySelector('.search-input');
    const jobListing = document.querySelector('.job-listing');
    const introSection = document.getElementById("intro");  
    const originalIntroContent = introSection.innerHTML; 

    // Function to remove active class from both links
    const removeActiveClass = () => {
        homeLink.classList.remove('active');
        exploreSubjects.classList.remove('active');
    };

    exploreSubjects.addEventListener('click', async (e) => {
        e.preventDefault(); 

        removeActiveClass();
        
        exploreSubjects.classList.add('active');

        filters.style.display = 'none';
        searchBar.classList.add('hidden');
        findJobsButton.style.display = 'none';
        findSearchInput.style.display = 'none';
        jobListing.style.display = 'none';

        subjectContainer.style.display = 'flex';

        try {
            const response = await fetch('/api/subjects');
            const data = await response.json();

            if (data.subjects && data.subjects.length > 0) {
                // Clear and style the subject container
                subjectContainer.innerHTML = '';
                subjectContainer.style.flexWrap = 'wrap';
                subjectContainer.style.gap = '20px';

                const sortedSubjects = data.subjects.sort();

                sortedSubjects.forEach((subject) => {
                    const subjectCard = document.createElement('div');
                    subjectCard.className = 'subject-card';
                    subjectCard.textContent = subject;

                    subjectContainer.appendChild(subjectCard);

                    subjectCard.addEventListener('click', () => {
                        showSubjectDetails(subject);
                    });
                });
            } else {
                alert('No subjects found.');
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
            alert('An error occurred while fetching subjects.');
        }
    });

    homeLink.addEventListener('click', (e) => {
        e.preventDefault();

        removeActiveClass();
        
        homeLink.classList.add('active');

        filters.style.display = 'flex';
        searchBar.classList.remove('hidden');
        findSearchInput.style.display = 'block';
        jobListing.style.display = 'block';
        findJobsButton.style.display = 'inline-block';
        subjectContainer.style.display = 'none';
    });

    // Function to show the white box with detailed topic information
    const showSubjectDetails = async (subject) => {
        try {
            const response = await fetch(`/api/topicDetails?subject=${encodeURIComponent(subject)}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch topics for subject: ${subject}`);
            }
            
            const data = await response.json();

            if (data.error) {
                console.error('Error:', data.error);
                alert(data.error); // Show an alert in case of an error
                return;
            }

            const whiteBox = document.createElement('div');
            whiteBox.classList.add('white-box');

            whiteBox.innerHTML += `<h2>${subject}</h2><hr>`;

            data.forEach((topic) => {
                whiteBox.innerHTML += `
                    <p><strong>Topic:</strong> ${topic.topic}</p>
                    <p><strong>Description:</strong> ${topic.description}</p>
                    <p><strong>Related Fields:</strong> ${topic.related_degrees.join(', ')}</p>
                    <hr>
                `;
            });

            introSection.innerHTML = '';
            introSection.appendChild(whiteBox);

            const goBackButton = document.getElementById("go-back-button");
            goBackButton.addEventListener('click', () => {
                introSection.innerHTML = originalIntroContent;
            });
        } catch (error) {
            console.error('Error fetching topic details:', error);
        }
    };
});
