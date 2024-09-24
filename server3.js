const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS
app.use(cors());

// Serve static files (like CSS if you want to separate it later)
app.use(express.static('public'));

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the uploads directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to the file name
    }
});

const upload = multer({ storage: storage });

// Create 'uploads' directory if it doesn't exist
const dir = './uploads';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

// Endpoint to upload a file
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded successfully: ${req.file.filename}`);
});

// Endpoint to submit feedback
app.post('/feedback', (req, res) => {
    const feedback = req.body.feedback;

    if (!feedback) {
        return res.status(400).send('No feedback provided.');
    }

    // Save the feedback to a text file
    fs.appendFile('feedback.txt', feedback + '\n', (err) => {
        if (err) {
            return res.status(500).send('Error saving feedback.');
        }
        res.send('Feedback submitted successfully!');
    });
});

// Serve the HTML page
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CV Upload</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: url('https://example.com/harward.jpg') no-repeat center center; /* Update to your image URL */
                background-size: 100% 100%;
                color: #333;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
            }
            h2 {
                text-align: center;
                margin-bottom: 20px;
            }
            .file-upload {
                margin-bottom: 20px;
            }
            input[type="file"], textarea {
                display: block;
                width: 100%;
                margin: 10px 0;
            }
            label {
                display: block;
                padding: 10px;
                background: #007bff;
                color: white;
                text-align: center;
                border-radius: 5px;
                cursor: pointer;
            }
            .message {
                margin-top: 15px;
                text-align: center;
                color: #28a745;
            }
        </style>
    </head>
    <body>

    <div class="container">
        <h2>Upload Your CV</h2>
        <div class="file-upload">
            <input type="file" id="cvFile" accept=".pdf, .doc, .docx, .txt" />
            <label for="cvFile">Choose CV File</label>
        </div>
        <button id="uploadBtn">Upload</button>
        <div class="message" id="message"></div>

        <h2>Feedback</h2>
        <textarea id="feedbackText" rows="4" placeholder="Enter your feedback..."></textarea>
        <button id="submitFeedbackBtn">Submit Feedback</button>
    </div>

    <script>
        const uploadURL = 'http://localhost:${PORT}';
        document.getElementById('uploadBtn').addEventListener('click', async function() {
            const fileInput = document.getElementById('cvFile');
            const message = document.getElementById('message');

            if (fileInput.files.length === 0) {
                message.textContent = 'Please select a file to upload.';
                message.style.color = 'red';
                return;
            }

            const file = fileInput.files[0];
            const allowedExtensions = /(\.txt|\.pdf|\.doc|\.docx)$/i;

            if (!allowedExtensions.exec(file.name)) {
                message.textContent = 'Invalid file type. Please upload a TEXT or PDF or DOC file.';
                message.style.color = 'red';
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(\`\${uploadURL}/upload\`, {
                    method: 'POST',
                    body: formData,
                });
                if (response.ok) {
                    const result = await response.text();
                    message.textContent = result;
                    message.style.color = 'green';
                    fileInput.value = ''; // Reset the input
                } else {
                    message.textContent = 'Upload failed. Please try again.';
                    message.style.color = 'red';
                }
            } catch (error) {
                message.textContent = 'Error uploading file: ' + error.message;
                message.style.color = 'red';
            }
        });

        document.getElementById('submitFeedbackBtn').addEventListener('click', async function() {
            const feedbackText = document.getElementById('feedbackText').value;
            const message = document.getElementById('message');

            if (!feedbackText) {
                message.textContent = 'Please enter your feedback.';
                message.style.color = 'red';
                return;
            }

            try {
                const response = await fetch(\`\${uploadURL}/feedback\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ feedback: feedbackText }),
                });
                if (response.ok) {
                    message.textContent = 'Feedback submitted successfully!';
                    message.style.color = 'green';
                    document.getElementById('feedbackText').value = ''; // Reset the input
                } else {
                    message.textContent = 'Feedback submission failed. Please try again.';
                    message.style.color = 'red';
                }
            } catch (error) {
                message.textContent = 'Error submitting feedback: ' + error.message;
                message.style.color = 'red';
            }
        });
    </script>

    </body>
    </html>
    `);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});