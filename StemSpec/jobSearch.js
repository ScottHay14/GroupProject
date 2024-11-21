document.addEventListener("DOMContentLoaded", () => {
    const searchButton = document.querySelector(".find-jobs-btn");
    const searchInput = document.querySelector(".search-input");
    const jobListing = document.querySelector(".job-listing");
    const introSection = document.getElementById("intro");  // Intro section to be replaced
    const subjectSelect = document.querySelector('.filters select'); // Subject dropdown
    const salarySelect = document.querySelector('#salary-filter'); // Salary dropdown

    const originalIntroContent = introSection.innerHTML;

    // Sample jobs for initial display
    const sampleJobs = [
        {
            title: "Software Engineer",
            salary_range: [30000, 45000],
            related_degrees: ["Computer Science", "Software Engineering"],
            entry_reqs: "Bachelor's degree in Computer Science or related field",
            related_careers: ["Data Scientist", "System Architect"],
            skills_knowledge: ["Programming", "Problem-solving", "Algorithms"]
        },
        {
            title: "Marketing Specialist",
            salary_range: [25000, 35000],
            related_degrees: ["Marketing", "Business Administration"],
            entry_reqs: "Bachelor's degree in Marketing or Business",
            related_careers: ["Product Manager", "Sales Manager"],
            skills_knowledge: ["SEO", "Data Analysis", "Communication"]
        },
        {
            title: "Graphic Designer",
            salary_range: [22000, 35000],
            related_degrees: ["Graphic Design", "Visual Arts"],
            entry_reqs: "Bachelor's degree in Graphic Design or related field",
            related_careers: ["Art Director", "UI/UX Designer"],
            skills_knowledge: ["Adobe Creative Suite", "Creativity", "Typography"]
        }
    ];

    // Function to create a job card and display job details
    const displayJobs = (jobs) => {
        jobListing.innerHTML = '';

        if (jobs.length === 0) {
            const noJobsMessage = document.createElement('p');
            noJobsMessage.textContent = 'No jobs found.';
            jobListing.appendChild(noJobsMessage);
        } else {
            // Display the jobs
            jobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.classList.add('job-card');

                const jobDetails = document.createElement('div');
                jobDetails.classList.add('job-details');

                jobDetails.innerHTML = `
                    <h3>Job: ${job.title}</h3>
                    <p><strong>Salary:</strong> £${job.salary_range[0]} - £${job.salary_range[1]}</p>
                    <p><strong>Education Level:</strong> ${job.related_degrees.join(', ')}</p>
                    <a href="#" class="see-more">See more...</a>
                `;

                // Add the jobDetails and card
                jobCard.appendChild(jobDetails);
                jobListing.appendChild(jobCard);

                const seeMoreLink = jobCard.querySelector('.see-more');
                seeMoreLink.addEventListener('click', (event) => {
                    event.preventDefault(); 

                    const whiteBox = document.createElement('div');
                    whiteBox.classList.add('white-box');

                    // Job details template
                    whiteBox.innerHTML = `
                        <h2>Job: ${job.title}</h2>
                        <div class="tabs">
                            <button class="tab-btn active" data-tab="skills-knowledge">Skills & Knowledge</button>
                            <button class="tab-btn" data-tab="studies-degrees">Studies & Degrees</button>
                            <button class="tab-btn" data-tab="related-careers">Related Careers</button>
                        </div>
                        <hr>  <!-- Inserted the horizontal rule here -->
                        <div class="tab-content">
                            <div id="skills-knowledge" class="tab-panel">
                                <p><strong>Skills Needed:</strong></p>
                                <ul>
                                    ${job.skills_knowledge.map(skill => `<li>${skill}</li>`).join('')}
                                </ul>
                            </div>
                            <div id="studies-degrees" class="tab-panel" style="display: none;">
                                <p><strong>Required Entry Level:</strong> ${job.entry_reqs}</p>
                                <p><strong>Related Degrees:</strong> ${job.related_degrees.join(', ')}</p>
                            </div>
                            <div id="related-careers" class="tab-panel" style="display: none;">
                                <p><strong>Related Careers:</strong> ${job.related_careers.join(', ')}</p>
                            </div>
                        </div>
                        <button id="go-back-button" class="go-back">Go Back</button>
                    `;

                    introSection.innerHTML = ''; 
                    introSection.appendChild(whiteBox);  

                    const goBackButton = document.getElementById("go-back-button");
                    goBackButton.addEventListener('click', () => {
                        introSection.innerHTML = originalIntroContent; // Reuse the stored intro content
                    });

                    // Tab switching
                    const tabBtns = whiteBox.querySelectorAll('.tab-btn');
                    const tabPanels = whiteBox.querySelectorAll('.tab-panel');

                    tabBtns.forEach(tabBtn => {
                        tabBtn.addEventListener('click', () => {
                            tabPanels.forEach(panel => panel.style.display = 'none');
                            tabBtns.forEach(btn => btn.classList.remove('active'));
                            const activeTab = tabBtn.getAttribute('data-tab');
                            document.getElementById(activeTab).style.display = 'block';
                            tabBtn.classList.add('active');
                        });
                    });
                });
            });
        }
    };

    displayJobs(sampleJobs);

    const fetchSubjects = async () => {
        try {
            // Call the Flask API 
            const response = await fetch('/api/subjects');
            const data = await response.json();

            if (data.subjects && Array.isArray(data.subjects)) {
                const subjectsSet = new Set();

                data.subjects.forEach(subject => {
                    subjectsSet.add(subject);
                });

                const subjectSelect = document.querySelector('.filters select');
                subjectsSet.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject;
                    option.textContent = subject;
                    subjectSelect.appendChild(option);
                });
            } else {
                console.error("Error: Subjects data is missing or malformed.");
            }

        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    // Add subjects to dropdown
    document.addEventListener('DOMContentLoaded', fetchSubjects);

    fetchSubjects();

    // Function to fetch jobs based on a search query, selected subject, and selected salary
    const fetchJobs = async (query, subject, salary) => {
        try {
            if (subject === "Subject" || subject === "") {
                subject = null;
            }

            const url = `/api/jobs?query=${encodeURIComponent(query)}${subject ? `&subject=${encodeURIComponent(subject)}` : ''}`;
            const response = await fetch(url);
            const jobs = await response.json();

            // Apply salary filter
            const filteredJobs = jobs.filter(job => {
                const salaryMatch = (salary === "50000" && job.salary_range[1] >= 50000) || 
                                    (job.salary_range[0] >= salary);
                return salaryMatch;
            });

            // Display filtered jobs
            displayJobs(filteredJobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);

            const filteredJobs = sampleJobs.filter(job => {
                // Apply both query, subject, and salary filters
                const matchesQuery = job.title.toLowerCase().includes(query.toLowerCase()) ||
                                     job.related_degrees.some(degree => degree.toLowerCase().includes(query.toLowerCase()));
                const matchesSubject = subject ? job.related_degrees.some(degree => degree.toLowerCase().includes(subject.toLowerCase())) : true;
                const matchesSalary = (salary === "50000" && job.salary_range[1] >= 50000) || 
                                      (job.salary_range[0] >= salary);
                return matchesQuery && matchesSubject && matchesSalary;
            });
            displayJobs(filteredJobs);
        }
    };

    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        const selectedSubject = subjectSelect.value.trim();
        const selectedSalary = salarySelect.value.trim();

        if (query || selectedSubject || selectedSalary) {
            fetchJobs(query, selectedSubject, selectedSalary);  
        } else {
            displayJobs(sampleJobs);
        }
    });
});
