const express = require('express');
const router = express.Router();

// Privacy Policy page
router.get('/privacy-policy', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Updates App</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #FFB800;
            border-bottom: 2px solid #FFB800;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        .last-updated {
            color: #666;
            font-style: italic;
            margin-bottom: 30px;
        }
        .contact-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <h1>Privacy Policy - Updates App</h1>
    <p class="last-updated">Last updated: ${new Date().toLocaleDateString()}</p>

    <h2>Introduction</h2>
    <p>Updates ("we," "our," or "us") operates the Updates mobile application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.</p>

    <h2>Information We Collect</h2>
    <ul>
        <li><strong>Account Information:</strong> Name, email address when you create an account</li>
        <li><strong>Profile Information:</strong> Optional profile photo and church preferences</li>
        <li><strong>Usage Data:</strong> Information about how you use the app, events you view and like</li>
        <li><strong>Device Information:</strong> Device type, operating system, app version</li>
    </ul>

    <h2>How We Use Your Information</h2>
    <ul>
        <li>To provide and maintain our Service</li>
        <li>To notify you about changes to our Service</li>
        <li>To provide customer support</li>
        <li>To gather analysis or valuable information to improve our Service</li>
        <li>To monitor usage of our Service</li>
    </ul>

    <h2>Data Sharing</h2>
    <p>We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
    <ul>
        <li>With your explicit consent</li>
        <li>To comply with legal obligations</li>
        <li>To protect our rights and safety</li>
    </ul>

    <h2>Data Security</h2>
    <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

    <h2>Your Rights</h2>
    <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Delete your account and data</li>
        <li>Withdraw consent at any time</li>
    </ul>

    <h2>Children's Privacy</h2>
    <p>Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us.</p>

    <h2>Changes to This Privacy Policy</h2>
    <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>

    <div class="contact-info">
        <h2>Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us:</p>
        <ul>
            <li>Email: max.mezalon@gmail.com</li>
            <li>Website: https://www.linkedin.com/in/max-mezalon/</li>
        </ul>
    </div>
</body>
</html>
  `;
  
  res.send(html);
});

// Terms of Service page
router.get('/terms-of-service', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - Updates App</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #FFB800;
            border-bottom: 2px solid #FFB800;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        .last-updated {
            color: #666;
            font-style: italic;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <h1>Terms of Service - Updates App</h1>
    <p class="last-updated">Last updated: ${new Date().toLocaleDateString()}</p>

    <h2>Acceptance of Terms</h2>
    <p>By accessing and using the Updates mobile application, you accept and agree to be bound by the terms and provision of this agreement.</p>

    <h2>Description of Service</h2>
    <p>Updates is a mobile application that helps users discover church events, follow churches, and stay connected with their faith community.</p>

    <h2>User Accounts</h2>
    <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

    <h2>User Content</h2>
    <p>Users may upload profile photos and interact with church content. You retain ownership of content you create, but grant us license to use it within the app.</p>

    <h2>Prohibited Uses</h2>
    <p>You may not use our service:</p>
    <ul>
        <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
        <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
        <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
        <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
        <li>To submit false or misleading information</li>
    </ul>

    <h2>Termination</h2>
    <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.</p>

    <h2>Disclaimer</h2>
    <p>The information on this app is provided on an "as is" basis. To the fullest extent permitted by law, we exclude all representations, warranties, and conditions relating to our app and the use of this app.</p>

    <h2>Contact Information</h2>
    <p>Questions about the Terms of Service should be sent to us at max.mezalon@gmail.com.</p>
</body>
</html>
  `;
  
  res.send(html);
});

module.exports = router;
