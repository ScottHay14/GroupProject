document.addEventListener("DOMContentLoaded", () => {
    const introSection = document.getElementById("intro");
    const askAI = document.getElementById("askAI-text");

    // Store the original content and styles
    const originalContent = introSection.innerHTML;
    const originalStyles = introSection.style.cssText;

    askAI.addEventListener("click", () => {
        // Replace intro section content with AI interaction area and Go Back button
        introSection.innerHTML = `
            <div class="white-box">
                <div id="chat-container" class="chat-box"></div>
            </div>
            <div class="input-box">
                <input type="text" id="ai-user-input" placeholder="Enter your query here">
                <button id="ai-submit-button"><i class="fas fa-arrow-right"></i></button>
            </div>
            <button id="go-back-button" class="go-back">Go Back</button>
        `;

        // Apply styles for the interaction section
        const whiteBox = document.querySelector(".white-box");
        whiteBox.style.cssText = `
            background-color: #ffffff;
            padding: 20px;
            border: 3px solid #5ce1e6;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.1);
            font-family: 'Poppins';
            width: 550px;
            margin-bottom: 10px;
        `;

        const inputBox = document.querySelector(".input-box");
        inputBox.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 570px;
            background-color: #ffffff;
            padding: 10px;
            border: 3px solid #5ce1e6;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.1);
        `;

        const goBackButton = document.querySelector(".go-back");
        goBackButton.style.cssText = `
            background-color: #fddf59;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: 'Poppins';
            cursor: pointer;
            margin-top: 10px;
        `;

        const goBackButtonHandler = () => {
            introSection.innerHTML = originalContent;
            introSection.style.cssText = originalStyles;
        };

        document.getElementById("go-back-button").addEventListener("click", goBackButtonHandler);

        const handleSubmit = () => {
            const userInput = document.getElementById("ai-user-input").value;
            const chatBox = document.getElementById("chat-container");

            if (!userInput.trim()) {
                alert("Please enter a query.");
                return;
            }

            const userMessage = document.createElement("div");
            userMessage.className = "chat-message user-message";
            userMessage.textContent = userInput;
            chatBox.appendChild(userMessage);

            // Clear the input field
            document.getElementById("ai-user-input").value = "";

            fetch('/get_job_recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_input: userInput }),
            })
                .then((response) => response.json())
                .then((data) => {
                    // Append the AI's response to the chat in a blue box on the left
                    const aiMessage = document.createElement("div");
                    aiMessage.className = "chat-message ai-message";
                    aiMessage.textContent = data.response;
                    chatBox.appendChild(aiMessage);

                    chatBox.scrollTop = chatBox.scrollHeight;
                })
                .catch(() => {
                    const errorMessage = document.createElement("div");
                    errorMessage.className = "chat-message ai-message";
                    errorMessage.textContent = "Error: Could not fetch recommendations.";
                    chatBox.appendChild(errorMessage);

                    chatBox.scrollTop = chatBox.scrollHeight;
                });
        };

        document.getElementById("ai-user-input").addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();  
                handleSubmit();
            }
        });

        const submitButton = document.getElementById("ai-submit-button");
        submitButton.addEventListener("click", handleSubmit);
    });
});
